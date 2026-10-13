const STORAGE_KEY = 'ayna_health_profile_v1';

/** @typedef {{ conditions: string[], medications: string[], allergies: string[], notes: string, intakeSummary?: string, wearableSummary?: { text?: string }, sources: { appleHealth: boolean, googleFit: boolean, fhir: boolean, manual: boolean }, updatedAt: string|null, fhirSummary?: { conditions: string[], medications: string[] } }} HealthProfile */

const KEYWORD_TAGS = [
  { re: /endometriosis|adenomyosis/i, tags: ['endometriosis', 'cramps'] },
  { re: /pcos|polycystic ovary/i, tags: ['pcos'] },
  { re: /menopause|perimenopause|hot flash|vasomotor/i, tags: ['menopause'] },
  { re: /postpartum|breastfeeding|lactation/i, tags: ['postpartum'] },
  { re: /pregnant|pregnancy|prenatal/i, tags: ['pregnancy'] },
  { re: /\buti\b|urinary tract|cystitis/i, tags: ['uti'] },
  { re: /urinary incontinence|stress incontinence|urge incontinence|bladder leaks?|urine leaks?|leak(?:ing)? urine|loss of bladder control|bladder control/i, tags: ['bladder-leaks'] },
  { re: /fibroid|menorrhagia|heavy menstrual|heavy period/i, tags: ['heavy-flow'] },
  { re: /pelvic pain|dyspareunia/i, tags: ['pelvic-floor', 'discomfort'] },
  { re: /anxiety|depression|insomnia/i, tags: ['comfort', 'mental-health'] },
  { re: /vaginal dryness|gsm|genitourinary syndrome/i, tags: ['menopause', 'discomfort'] },
  { re: /irregular cycle|oligomenorrhea|amenorrhea/i, tags: ['irregular'] },
  { re: /infertility|fertility|ttc|trying to conceive/i, tags: ['fertility'] },
  /** Wearable / tracker free text (Apple Health, Google Fit exports summarized by user) */
  { re: /sleep score|sleep duration|poor sleep|sleep debt|insomnia|awake time/i, tags: ['comfort', 'mental-health'] },
  { re: /cycle tracking|period prediction|irregular period|cycle length/i, tags: ['irregular'] },
  { re: /heart rate|hrv|resting heart|vo2|cardio/i, tags: ['comfort'] },
  { re: /steps|active calories|workout|walking|exercise minutes/i, tags: ['comfort'] },
];

/**
 * Supabase is the durable source of truth for imported health context. We keep
 * only an active-tab cache in sessionStorage so a refresh is smooth without
 * leaving conditions/medications/allergies on a shared computer indefinitely.
 * Older localStorage copies are migrated once and immediately removed.
 */
export function loadHealthProfile() {
  try {
    if (typeof window === 'undefined') return null;
    const sessionRaw = window.sessionStorage.getItem(STORAGE_KEY);
    if (sessionRaw) {
      const parsed = JSON.parse(sessionRaw);
      return parsed && typeof parsed === 'object' ? normalizeProfile(parsed) : null;
    }

    const legacyRaw = window.localStorage.getItem(STORAGE_KEY);
    if (!legacyRaw) return null;
    const parsed = JSON.parse(legacyRaw);
    if (!parsed || typeof parsed !== 'object') return null;
    const normalized = normalizeProfile(parsed);
    try { window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(normalized)); } catch (_) {}
    try { window.localStorage.removeItem(STORAGE_KEY); } catch (_) {}
    return normalized;
  } catch {
    return null;
  }
}

export function saveHealthProfile(profile) {
  if (typeof window === 'undefined') return null;
  const next = normalizeProfile(profile);
  next.updatedAt = new Date().toISOString();
  try { window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch (_) {}
  try { window.localStorage.removeItem(STORAGE_KEY); } catch (_) {}
  return next;
}

export function normalizeProfile(p) {
  return {
    conditions: Array.isArray(p.conditions) ? p.conditions.map(String) : [],
    medications: Array.isArray(p.medications) ? p.medications.map(String) : [],
    allergies: Array.isArray(p.allergies) ? p.allergies.map(String) : [],
    notes: typeof p.notes === 'string' ? p.notes : '',
    intakeSummary: typeof p.intakeSummary === 'string' ? p.intakeSummary : '',
    sources: {
      appleHealth: !!p.sources?.appleHealth,
      googleFit: !!p.sources?.googleFit,
      fhir: !!p.sources?.fhir,
      manual: !!p.sources?.manual,
    },
    fhirSummary: p.fhirSummary && typeof p.fhirSummary === 'object'
      ? {
        conditions: Array.isArray(p.fhirSummary.conditions) ? p.fhirSummary.conditions.map(String) : [],
        medications: Array.isArray(p.fhirSummary.medications) ? p.fhirSummary.medications.map(String) : [],
      }
      : { conditions: [], medications: [] },
    wearableSummary: p.wearableSummary && typeof p.wearableSummary === 'object'
      ? { text: typeof p.wearableSummary.text === 'string' ? p.wearableSummary.text : '' }
      : { text: '' },
    updatedAt: p.updatedAt || null,
  };
}

/**
 * Maps free-text conditions + FHIR labels to product recommendation tags.
 * @param {HealthProfile|null|undefined} profile
 * @returns {string[]}
 */
export function inferTagsFromHealthProfile(profile) {
  if (!profile) return [];
  const chunks = [
    ...profile.conditions,
    ...profile.medications,
    ...profile.allergies,
    ...(profile.fhirSummary?.conditions || []),
    ...(profile.fhirSummary?.medications || []),
    profile.notes || '',
    profile.intakeSummary || '',
    profile.wearableSummary?.text || '',
  ];
  const text = chunks.join(' ');
  if (!text.trim()) return [];
  const tags = new Set();
  KEYWORD_TAGS.forEach(({ re, tags: t }) => {
    if (re.test(text)) t.forEach((x) => tags.add(x));
  });
  return [...tags];
}

/**
 * True if the user has saved any importable health context (manual, FHIR, wearables, or source flags),
 * even when free text does not match keyword tags yet.
 */
export function hasHealthProfileSignals(profile) {
  if (!profile) return false;
  if (inferTagsFromHealthProfile(profile).length > 0) return true;
  const p = normalizeProfile(profile);
  return (
    p.conditions.length > 0 ||
    p.medications.length > 0 ||
    p.allergies.length > 0 ||
    p.notes.trim().length > 0 ||
    (p.intakeSummary || '').trim().length > 0 ||
    (p.wearableSummary?.text || '').trim().length > 0 ||
    p.fhirSummary.conditions.length > 0 ||
    p.fhirSummary.medications.length > 0 ||
    p.sources.appleHealth ||
    p.sources.googleFit ||
    p.sources.fhir
  );
}

/**
 * Minimal FHIR R4 Bundle parse: Condition.code, MedicationStatement.medicationCodeableConcept
 * @param {string} jsonText
 * @returns {{ conditions: string[], medications: string[], error?: string }}
 */
export function parseFhirBundleText(jsonText) {
  try {
    const bundle = JSON.parse(jsonText);
    if (!bundle || bundle.resourceType !== 'Bundle' || !Array.isArray(bundle.entry)) {
      return { conditions: [], medications: [], error: 'Not a FHIR Bundle' };
    }
    const conditions = [];
    const medications = [];
    for (const ent of bundle.entry) {
      const r = ent?.resource;
      if (!r) continue;
      if (r.resourceType === 'Condition') {
        const t = codeableToText(r.code);
        if (t) conditions.push(t);
      } else if (r.resourceType === 'MedicationStatement' || r.resourceType === 'MedicationRequest') {
        const t = codeableToText(r.medicationCodeableConcept || r.medication);
        if (t) medications.push(t);
      }
    }
    return { conditions, medications };
  } catch (e) {
    return { conditions: [], medications: [], error: e instanceof Error ? e.message : 'Parse error' };
  }
}

function codeableToText(cc) {
  if (!cc) return '';
  if (typeof cc === 'string') return cc;
  if (cc.text) return String(cc.text);
  const coding = cc.coding?.[0];
  if (coding?.display) return String(coding.display);
  if (coding?.code) return String(coding.code);
  return '';
}
