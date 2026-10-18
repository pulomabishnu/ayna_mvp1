/**
 * Apple Health Records (FHIR) -> a short list she can review.
 *
 * Only three record types are read: allergies, conditions and medications.
 * They are used for SAFETY and context in matching (avoid an ingredient she's
 * allergic to, flag a medicine interaction). A condition never creates a need
 * on its own (see engineIntake in src/data/products.js).
 *
 * Where they live: on this phone only (localStorage in the app's WebView),
 * keyed by user. Not sent to ayna's server, an AI model, analytics, brands or
 * partners. They are deliberately NOT written into the health profile
 * (user_health_profiles), because that profile is sent to an AI model for
 * product insights.
 *
 * FHIR versions: Apple returns DSTU2 (1.0.2) or R4 (4.0.1). Both are handled:
 * DSTU2 uses plain-string statuses and AllergyIntolerance.substance; R4 uses
 * CodeableConcept statuses and AllergyIntolerance.code.
 */

export const RECORD_TYPES = {
  allergy: { label: 'Allergies', why: 'So ayna can warn you about products with ingredients or materials you react to.' },
  condition: { label: 'Conditions', why: 'As context for your matches and safety notes. A condition never adds a goal you did not choose.' },
  medication: { label: 'Medicines', why: 'So ayna can flag products that may not mix with what you take.' },
};

const MAX_PER_TYPE = 60;
const MAX_NAME = 120;

const str = (v) => (typeof v === 'string' ? v.trim() : '');
function conceptText(cc) {
  if (!cc || typeof cc !== 'object') return '';
  if (str(cc.text)) return str(cc.text);
  const coding = Array.isArray(cc.coding) ? cc.coding : [];
  return str(coding.find((c) => str(c?.display))?.display);
}
function firstCode(cc) {
  const c = (Array.isArray(cc?.coding) ? cc.coding : []).find((x) => str(x?.code));
  return c ? { system: str(c.system), code: str(c.code) } : null;
}
/** A status that may be a plain string (DSTU2) or a CodeableConcept (R4). */
function statusOf(v) {
  if (typeof v === 'string') return v.toLowerCase();
  const code = (Array.isArray(v?.coding) ? v.coding : []).find((c) => str(c?.code))?.code;
  return code ? String(code).toLowerCase() : str(v?.text).toLowerCase();
}

const DROP_VERIFICATION = new Set(['entered-in-error', 'refuted']);
const ACTIVE_CLINICAL = new Set(['', 'active', 'recurrence', 'relapse']);
const ACTIVE_MED = new Set(['', 'active', 'intended', 'on-hold']);

function parseJson(json) {
  if (json && typeof json === 'object') return json;
  try { return JSON.parse(String(json || '')); } catch { return null; }
}

function allergyItem(r) {
  const concept = r.code || r.substance; // R4 | DSTU2
  const name = conceptText(concept);
  if (!name) return null;
  if (DROP_VERIFICATION.has(statusOf(r.verificationStatus)) || DROP_VERIFICATION.has(statusOf(r.status))) return null;
  const clinical = statusOf(r.clinicalStatus || r.status);
  if (clinical && !['active', 'unconfirmed', 'confirmed'].includes(clinical)) return null; // resolved / inactive
  return { name, coding: firstCode(concept) };
}

function conditionItem(r) {
  const name = conceptText(r.code);
  if (!name) return null;
  if (DROP_VERIFICATION.has(statusOf(r.verificationStatus))) return null;
  if (!ACTIVE_CLINICAL.has(statusOf(r.clinicalStatus))) return null; // resolved, remission, inactive
  return { name, coding: firstCode(r.code) };
}

function medicationItem(r, now) {
  const concept = r.medicationCodeableConcept;
  const name = conceptText(concept) || str(r.medicationReference?.display) || str(r.medication?.concept?.text);
  if (!name) return null;
  const status = statusOf(r.status);
  if (r.resourceType === 'MedicationDispense') {
    // A dispense is "completed" when handed over; keep only the last year.
    const when = Date.parse(r.whenHandedOver || r.whenPrepared || '');
    if (status === 'entered-in-error' || status === 'cancelled') return null;
    if (Number.isFinite(when) && now - when > 365 * 86400000) return null;
  } else if (!ACTIVE_MED.has(status)) {
    return null; // completed, stopped, cancelled, entered-in-error, draft
  }
  return { name, coding: firstCode(concept) };
}

const PARSERS = {
  allergy: { types: ['AllergyIntolerance'], item: allergyItem },
  condition: { types: ['Condition'], item: conditionItem },
  medication: { types: ['MedicationStatement', 'MedicationRequest', 'MedicationOrder', 'MedicationDispense'], item: medicationItem },
};

/**
 * @param {Array<{ type, resourceType?, json, sourceName? }>} records from the native plugin
 * @returns {{ allergy: Item[], condition: Item[], medication: Item[], skipped: number }}
 *   Item = { id, name, coding, sources: string[] }
 */
export function parseClinicalRecords(records, { now = Date.now() } = {}) {
  const out = { allergy: [], condition: [], medication: [], skipped: 0 };
  const seen = { allergy: new Map(), condition: new Map(), medication: new Map() };
  for (const rec of Array.isArray(records) ? records : []) {
    const p = PARSERS[rec?.type];
    const r = parseJson(rec?.json);
    if (!p || !r || !p.types.includes(r.resourceType)) { out.skipped += 1; continue; }
    const item = p.item(r, now);
    if (!item) { out.skipped += 1; continue; }
    const name = item.name.replace(/\s+/g, ' ').slice(0, MAX_NAME);
    const key = name.toLowerCase();
    const source = str(rec.sourceName).slice(0, 80);
    const existing = seen[rec.type].get(key);
    if (existing) { if (source && !existing.sources.includes(source)) existing.sources.push(source); continue; }
    if (out[rec.type].length >= MAX_PER_TYPE) { out.skipped += 1; continue; }
    const entry = { id: `${rec.type}:${key}`, name, coding: item.coding, sources: source ? [source] : [] };
    seen[rec.type].set(key, entry);
    out[rec.type].push(entry);
  }
  for (const t of Object.keys(PARSERS)) out[t].sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

// ---- On-device store -------------------------------------------------------

const KEY = 'ayna.healthRecords.v1';
const keyFor = (userId) => `${KEY}:${userId}`;

function storage() {
  try { return typeof window !== 'undefined' ? window.localStorage : null; } catch { return null; }
}

/** @returns {{ allergies: string[], conditions: string[], medications: string[], savedAt: string, types: string[] } | null} */
export function loadSavedRecords(userId) {
  if (!userId) return null;
  try {
    const raw = storage()?.getItem(keyFor(userId));
    const v = raw ? JSON.parse(raw) : null;
    if (!v || typeof v !== 'object') return null;
    const list = (a) => (Array.isArray(a) ? a.filter((s) => typeof s === 'string' && s.trim()).slice(0, MAX_PER_TYPE) : []);
    return { allergies: list(v.allergies), conditions: list(v.conditions), medications: list(v.medications), savedAt: String(v.savedAt || ''), types: list(v.types) };
  } catch {
    return null;
  }
}

/** Save only the items she checked. Returns the saved object. */
export function saveRecords(userId, { allergies = [], conditions = [], medications = [], types = [] }) {
  if (!userId) throw new Error('no_user');
  const clean = (a) => [...new Set(a.map((s) => String(s).trim().slice(0, MAX_NAME)).filter(Boolean))].slice(0, MAX_PER_TYPE);
  const value = { allergies: clean(allergies), conditions: clean(conditions), medications: clean(medications), types: clean(types), savedAt: new Date().toISOString() };
  storage()?.setItem(keyFor(userId), JSON.stringify(value));
  return value;
}

export function deleteSavedRecords(userId) {
  try { if (userId) storage()?.removeItem(keyFor(userId)); } catch { /* nothing to delete */ }
}

/** Remove every user's saved records from this device (sign-out on a shared phone, account deletion). */
export function deleteAllSavedRecordsOnDevice() {
  const s = storage();
  if (!s) return;
  try {
    const keys = [];
    for (let i = 0; i < s.length; i += 1) { const k = s.key(i); if (k && k.startsWith(`${KEY}:`)) keys.push(k); }
    keys.forEach((k) => s.removeItem(k));
  } catch { /* ignore */ }
}

export const hasRecords = (r) => Boolean(r && (r.allergies.length || r.conditions.length || r.medications.length));
