/* global process */
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

// OpenFDA recall lookup — free, no API key required for basic use.
// Add OPENFDA_API_KEY to Vercel env vars for higher rate limits (free at open.fda.gov).
// Docs: https://open.fda.gov/apis/
//
// SAFETY CONTRACT — read before changing anything in this file.
//
// This endpoint decides whether a woman is told her product has been recalled.
// Both error directions are harmful, so the response distinguishes THREE states
// and the UI must never collapse them into two:
//
//   status: 'ok'      every relevant dataset answered; `hasRecalls` is meaningful
//   status: 'partial' at least one dataset answered and at least one failed
//   status: 'failed'  nothing answered — we know NOTHING about this product
//
// The previous version returned `{ hasRecalls: false }` for every failure mode,
// which the product modal rendered as a green "No FDA Recalls Found". A timeout,
// a 429, or a malformed query all produced an affirmative all-clear.
//
// Note on OpenFDA semantics: a search with zero matches returns HTTP 404 with
// `{"error":{"code":"NOT_FOUND"}}`. So `res.ok === false` is the NORMAL empty
// case and cannot be treated as failure — the body must be inspected.

const MAX_TERM_LEN = 120;
const REQUEST_TIMEOUT_MS = 8000;

/** Datasets by what they actually cover. */
const DATASETS = {
  deviceRecall: 'https://api.fda.gov/device/recall.json',
  deviceEnforcement: 'https://api.fda.gov/device/enforcement.json',
  drugEnforcement: 'https://api.fda.gov/drug/enforcement.json',
  // Dietary supplements are regulated as FOOD under DSHEA. Supplement recalls
  // (undeclared allergens, heavy metals, adulteration) are food enforcement
  // reports and were previously never queried at all.
  foodEnforcement: 'https://api.fda.gov/food/enforcement.json',
};

/**
 * Recency sort field PER DATASET. These schemas differ: the enforcement
 * datasets carry `report_date`, but device/recall.json does not — and OpenFDA
 * rejects a sort on an unknown field with a 400, which would fail the lookup
 * outright rather than merely returning it unsorted.
 */
const SORT_FIELD = {
  deviceRecall: 'event_date_initiated',
  deviceEnforcement: 'report_date',
  drugEnforcement: 'report_date',
  foodEnforcement: 'report_date',
};

/** Categories that have no FDA SKU to recall. */
const NON_PHYSICAL_CATEGORIES = new Set([
  'telehealth', 'app', 'tracker', 'service', 'community', 'mental-health', 'fitness',
]);

function datasetsForCategory(cat) {
  if (cat === 'supplement' || cat === 'vitamin' || cat === 'probiotic') {
    return ['foodEnforcement', 'drugEnforcement'];
  }
  if (['pad', 'tampon', 'cup', 'disc', 'period-underwear', 'device', 'diagnostics',
       'pelvic-floor', 'hormone-monitoring', 'contraception'].includes(cat)) {
    return ['deviceRecall', 'deviceEnforcement'];
  }
  // Unknown category — search everything rather than guess.
  return ['deviceRecall', 'deviceEnforcement', 'drugEnforcement', 'foodEnforcement'];
}

/** Lucene metacharacters must be escaped or a stray quote yields a 400. */
function escapeLucene(s) {
  return String(s).replace(/([+\-!(){}[\]^"~*?:\\/]|&&|\|\|)/g, '\\$1');
}

function firstParam(v) {
  return Array.isArray(v) ? v[0] : v;
}

function cleanTerm(v) {
  return String(firstParam(v) || '').trim().replace(/\s+/g, ' ').slice(0, MAX_TERM_LEN);
}

/**
 * Core recall lookup for one product. Pulled out of the handler so the
 * recall-monitoring sweep (below) can check many products without going
 * through HTTP — same logic, same result shape, no res/req coupling.
 */
export async function checkRecallsForProduct({ name, brand, category }) {
  if (NON_PHYSICAL_CATEGORIES.has(category)) {
    // Explicitly "not applicable" — distinct from "we checked and found nothing".
    return {
      status: 'skipped', hasRecalls: false, hasHistoricalRecalls: false,
      recalls: [], historicalRecalls: [],
      checkedAt: new Date().toISOString(), source: 'OpenFDA',
      skipped: true, skipReason: 'not_an_fda_regulated_product',
      cacheControl: 'public, s-maxage=86400',
    };
  }

  const apiKey = process.env.OPENFDA_API_KEY;
  const keyParam = apiKey ? `&api_key=${encodeURIComponent(apiKey)}` : '';

  // Query BROADLY and let the post-filter provide precision. The previous
  // version searched for the exact quoted phrase `"<brand> <name>"` inside
  // product_description — but FDA descriptions are free text written by the
  // recalling firm ("PRENATAL MULTIVITAMIN (Ritual) 30ct"), so the adjacent
  // in-order phrase almost never appears and real recalls were missed.
  const clauses = [`product_description:"${escapeLucene(name)}"`];
  if (brand) {
    clauses.push(`openfda.brand_name:"${escapeLucene(brand)}"`);
    clauses.push(`recalling_firm:"${escapeLucene(brand)}"`);
  }
  const search = encodeURIComponent(`(${clauses.join(' OR ')})`);

  const chosen = datasetsForCategory(category);

  const settled = await Promise.all(
    chosen.map(async (key) => {
      const base = `${DATASETS[key]}?search=${search}&limit=50${keyParam}`;
      const sortField = SORT_FIELD[key];

      const attempt = async (url) => {
        const r = await fetch(url, {
          headers: { 'User-Agent': 'Ayna-Health-App/1.0' },
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        if (r.ok) {
          const json = await r.json();
          return { key, ok: true, results: Array.isArray(json?.results) ? json.results : [] };
        }
        // 404 + NOT_FOUND is OpenFDA's "zero matches" — a successful empty answer,
        // NOT a failure. This is the distinction the old code could not make.
        if (r.status === 404) {
          const body = await r.json().catch(() => null);
          if (body?.error?.code === 'NOT_FOUND') return { key, ok: true, results: [] };
        }
        return { key, ok: false, reason: `http_${r.status}`, status: r.status };
      };

      try {
        const first = await attempt(sortField ? `${base}&sort=${sortField}:desc` : base);
        // An unrecognised sort field is a 400. Recency is a nice-to-have; a
        // successful unsorted lookup beats reporting the dataset as failed.
        if (!first.ok && first.status === 400 && sortField) {
          console.warn(`[fda-recall] sort on ${sortField} rejected for ${key}; retrying unsorted`);
          return await attempt(base);
        }
        return first;
      } catch (e) {
        return { key, ok: false, reason: e?.name === 'TimeoutError' ? 'timeout' : 'network' };
      }
    })
  );

  const succeeded = settled.filter((s) => s.ok);
  const failed = settled.filter((s) => !s.ok);

  const status = failed.length === 0 ? 'ok' : (succeeded.length === 0 ? 'failed' : 'partial');

  if (status === 'failed') {
    console.error('[fda-recall] all datasets failed for', name, failed.map((f) => `${f.key}=${f.reason}`).join(','));
    return {
      // Must never be cached — a transient outage would be pinned into the CDN
      // as a false all-clear.
      status: 'failed', hasRecalls: null, hasHistoricalRecalls: null,
      recalls: [], historicalRecalls: [],
      checkedAt: new Date().toISOString(), source: 'OpenFDA',
      failedDatasets: failed.map((f) => ({ dataset: f.key, reason: f.reason })),
      message: 'Could not reach the FDA recall database.',
      cacheControl: 'no-store',
    };
  }

  const recalls = [];
  const seen = new Set();
  for (const s of succeeded) {
    for (const item of s.results) {
      if (!recallRecordMatchesProduct(item, name, brand)) continue;
      const normalized = normalizeRecall(item, s.key);
      if (seen.has(normalized.recallNumber || normalized.description)) continue;
      seen.add(normalized.recallNumber || normalized.description);
      recalls.push(normalized);
      if (recalls.length >= 8) break;
    }
    if (recalls.length >= 8) break;
  }

  const activeRecalls = recalls.filter((r) => !r.isHistorical);
  const historicalRecalls = recalls.filter((r) => r.isHistorical);

  return {
    status,
    // Active only. A closed-out recall from a decade ago is context, not an alert.
    hasRecalls: activeRecalls.length > 0,
    hasHistoricalRecalls: historicalRecalls.length > 0,
    recalls: activeRecalls,
    historicalRecalls,
    checkedAt: new Date().toISOString(),
    source: 'OpenFDA',
    datasetsChecked: succeeded.map((s) => s.key),
    failedDatasets: failed.map((f) => ({ dataset: f.key, reason: f.reason })),
    cacheControl: status === 'partial'
      ? 'no-store'
      : 'public, s-maxage=3600, stale-while-revalidate=600',
  };
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Cron-triggered sweep mode — see runRecallSweep below. Checked before the
  // name-based validation since a sweep request carries no `name` param.
  if (req.query.sweep === '1') return handleSweepRequest(req, res);

  const name = cleanTerm(req.query.name);
  const brand = cleanTerm(req.query.brand);
  const category = cleanTerm(req.query.category).toLowerCase();

  if (!name) return res.status(400).json({ error: 'missing_name' });

  const result = await checkRecallsForProduct({ name, brand, category });
  const { cacheControl, ...body } = result;
  res.setHeader('Cache-Control', cacheControl);
  return res.status(result.status === 'failed' ? 502 : 200).json(body);
}

/** OpenFDA dates are YYYYMMDD strings. */
function parseFdaDate(v) {
  const m = /^(\d{4})(\d{2})(\d{2})$/.exec(String(v || '').trim());
  if (m) return new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00Z`);
  const d = new Date(String(v || ''));
  return Number.isNaN(d.getTime()) ? null : d;
}

const HISTORICAL_AFTER_YEARS = 2;

/**
 * A recall is HISTORICAL when it has been terminated and is old.
 *
 * drug/enforcement retains `status: "Terminated"` rows back to 2012, and the
 * previous code captured `status` but never used it — so a terminated 2013
 * single-lot recall surfaced today as "⚠️ FDA Recall Records Found — review
 * carefully before purchasing". False alarms on a safety surface cost you the
 * true positives, so these are returned but flagged, and excluded from the
 * top-level hasRecalls signal.
 */
function isHistoricalRecall(statusText, dateValue) {
  const terminated = /terminated|completed/i.test(String(statusText || ''));
  if (!terminated) return false;
  const d = parseFdaDate(dateValue);
  if (!d) return false;
  const ageYears = (Date.now() - d.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  return ageYears > HISTORICAL_AFTER_YEARS;
}

/**
 * Resolve a date across every field name the four datasets use.
 *
 * Choosing by dataset alone was too brittle: a device row missing
 * `event_date_initiated` resolved to no date at all, which meant a terminated
 * recall could not be aged out and was reported as a live alert.
 */
function resolveRecallDate(item) {
  return (
    item.event_date_initiated ||
    item.event_date_posted ||
    item.recall_initiation_date ||
    item.report_date ||
    item.center_classification_date ||
    ''
  );
}

/** Field names differ per dataset; map each explicitly rather than guessing. */
function normalizeRecall(item, dataset) {
  const recallDate = resolveRecallDate(item);
  return {
    dataset,
    recallNumber: String(
      item.recall_number || item.res_event_number || item.product_res_number || item.event_id || item.id || ''
    ),
    date: String(recallDate || ''),
    reason: String(item.reason_for_recall || item.root_cause_description || '').slice(0, 240),
    status: String(item.status || ''),
    classification: String(item.classification || item.product_res_number || ''),
    firm: String(item.recalling_firm || ''),
    description: String(item.product_description || '').slice(0, 240),
    isHistorical: isHistoricalRecall(item.status, recallDate),
  };
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function flattenOpenfda(val) {
  if (val == null) return '';
  if (Array.isArray(val)) return val.filter(Boolean).join(' ');
  return String(val);
}

/**
 * Fields are matched INDIVIDUALLY. The previous version joined them with a
 * space and matched phrases against the concatenation, so a phrase could match
 * across a field boundary — "...100% Cotton" + "Tampons may contain..." matched
 * a product named "Cotton Tampons" from an unrelated recall.
 */
function recallFields(item) {
  const o = item.openfda || {};
  return [
    item.product_description,
    item.reason_for_recall,
    item.code_info,
    item.recalling_firm,
    flattenOpenfda(o.brand_name),
    flattenOpenfda(o.generic_name),
    flattenOpenfda(o.manufacturer_name),
    flattenOpenfda(o.device_name),
  ].filter(Boolean).map((f) => String(f).replace(/\s+/g, ' '));
}

export function recallRecordMatchesProduct(item, name, brand) {
  const fields = recallFields(item);
  if (!fields.length) return false;
  const n = String(name || '').trim();
  const b = String(brand || '').trim();
  if (n.length >= 3 && fields.some((f) => wordOrPhraseMatches(f, n))) return true;
  if (b.length >= 3 && fields.some((f) => wordOrPhraseMatches(f, b))) return true;
  return false;
}

export function wordOrPhraseMatches(blob, token) {
  const t = token.trim().replace(/\s+/g, ' ');
  if (t.length < 3) return false;

  // `\b` is a word/non-word transition, so it FAILS when the token itself ends
  // in a non-word character: "Ritual Essential Prenatal 18+" against
  // "... 18+ capsules" never matched, because \b demanded a word char after
  // the '+'. Lookarounds on an explicit character class behave correctly at
  // both word and non-word edges.
  const body = t.split(' ').map(escapeRegex).join('\\s+');
  const re = new RegExp(`(?<![A-Za-z0-9])${body}(?![A-Za-z0-9])`, 'i');
  return re.test(blob);
}

// ─── Recall-monitoring sweep ────────────────────────────────────────────────
//
// Makes the "🔔 Monitor Safety Recalls" button on a product page actually do
// something. Previously it only flipped `user_ecosystems.is_tracked` — nothing
// ever read that flag. This is cron-triggered (Vercel Cron, see vercel.json),
// checks every distinct product any user has flagged as tracked, and texts
// (via the Twilio integration already used for OTP/SMS elsewhere in this repo)
// any user newly affected by an ACTIVE recall that wasn't there last check.
//
// Safety gates, both required before a single real SMS goes out:
//   1. CRON_SECRET must be set and match the request's Authorization header —
//      otherwise sweep mode 401s. Nothing about this endpoint's existence is
//      revealed to an unauthenticated caller beyond the 401 itself.
//   2. RECALL_SWEEP_ENABLED must be exactly "1" — otherwise the sweep still
//      runs (so you can watch the logs and confirm behavior) but makes ZERO
//      writes: no recall_notifications rows, no product_recall_state updates,
//      no Twilio calls. This is deliberate — a dry run that persisted state
//      would let a recall "expire" out of detection before it was ever really
//      sent, once the real switch is flipped on.

let _admin = null;
function getAdmin() {
  if (_admin) return _admin;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  _admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return _admin;
}

async function mapConcurrent(items, fn, limit = 5) {
  const results = new Array(items.length).fill(null);
  let nextIdx = 0;
  async function worker() {
    while (nextIdx < items.length) {
      const i = nextIdx++;
      try {
        results[i] = await fn(items[i], i);
      } catch (e) {
        console.error('[fda-recall sweep] task failed:', e?.message);
        results[i] = null;
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/** Stable identity for "the current active recall set" — order-independent, so
 *  re-fetching the same recalls in a different order never looks like a change. */
function computeRecallSignature(activeRecalls) {
  return activeRecalls
    .map((r) => r.recallNumber || r.description)
    .filter(Boolean)
    .sort()
    .join(',');
}

function buildRecallSmsBody(productName, reason) {
  const cleanReason = String(reason || '').replace(/\s+/g, ' ').trim().slice(0, 200);
  return `⚠️ Ayna Safety Alert: ${productName} has a new FDA safety alert${cleanReason ? `: ${cleanReason}` : '.'} Open the Ayna app for details and alternatives. Reply STOP to opt out.`;
}

/**
 * Notify every user tracking `productId` about a newly-detected active
 * recall. Claim-then-send: the recall_notifications insert (status: 'sent')
 * happens BEFORE the Twilio call and is what the unique index on
 * (user_id, product_id, recall_signature) guards — if the insert 23505s,
 * this exact user/product/recall combination was already handled (by a
 * previous run, or a concurrent one), so we skip rather than double-text.
 */
async function notifyUsersOfRecall(admin, { productId, productName, recallSignature, reason, dryRun }) {
  const { data: trackers, error } = await admin
    .from('user_ecosystems')
    .select('user_id')
    .eq('product_id', productId)
    .eq('is_tracked', true);

  if (error) {
    console.error(`[fda-recall sweep] could not list trackers for ${productId}:`, error.message);
    return { notified: 0, skipped: 0, failed: 0 };
  }
  if (!trackers?.length) return { notified: 0, skipped: 0, failed: 0 };

  let notified = 0, skipped = 0, failed = 0;

  await mapConcurrent(trackers, async ({ user_id }) => {
    const { data: phoneRow } = await admin
      .from('phone_numbers')
      .select('phone_number, is_verified, sms_opted_out')
      .eq('user_id', user_id)
      .maybeSingle();

    const hasUsableNumber = phoneRow?.phone_number && phoneRow.is_verified && !phoneRow.sms_opted_out;

    if (dryRun) {
      // Zero writes in dry run — see the header comment above for why.
      console.log(
        hasUsableNumber
          ? `[fda-recall sweep] DRY RUN — would text user ${user_id} about ${productName}`
          : `[fda-recall sweep] DRY RUN — would SKIP user ${user_id} (no verified/opted-in number) for ${productName}`
      );
      if (hasUsableNumber) notified++; else skipped++;
      return;
    }

    if (!hasUsableNumber) {
      skipped++;
      await admin.from('recall_notifications').insert({
        user_id, product_id: productId, product_name: productName,
        recall_signature: recallSignature, status: 'skipped_no_phone',
      });
      return;
    }

    // Claim first. A 23505 here means this exact (user, product, recall set)
    // was already sent — by an earlier run or a concurrent one — so stop.
    const { error: claimError } = await admin.from('recall_notifications').insert({
      user_id, product_id: productId, product_name: productName,
      recall_signature: recallSignature, status: 'sent',
    });
    if (claimError) {
      if (claimError.code === '23505') { skipped++; return; }
      console.error(`[fda-recall sweep] claim failed for user ${user_id}:`, claimError.message);
      failed++;
      return;
    }

    try {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      await client.messages.create({
        to: phoneRow.phone_number,
        from: process.env.TWILIO_PHONE_NUMBER,
        body: buildRecallSmsBody(productName, reason),
      });
      notified++;
    } catch (e) {
      console.error(`[fda-recall sweep] Twilio send failed for user ${user_id}:`, e?.message);
      await admin.from('recall_notifications')
        .update({ status: 'failed' })
        .eq('user_id', user_id).eq('product_id', productId).eq('recall_signature', recallSignature);
      failed++;
    }
  });

  return { notified, skipped, failed };
}

async function runRecallSweep(admin, { dryRun }) {
  const { data: rows, error } = await admin
    .from('user_ecosystems')
    .select('product_id, product_name, brand, category')
    .eq('is_tracked', true);

  if (error) throw new Error(`could not list tracked products: ${error.message}`);

  const byProduct = new Map();
  for (const r of rows || []) {
    if (!r.product_id || byProduct.has(r.product_id)) continue;
    byProduct.set(r.product_id, r);
  }
  const products = [...byProduct.values()];

  let productsWithNewRecalls = 0;
  let notified = 0, skipped = 0, failed = 0;

  await mapConcurrent(products, async (p) => {
    const result = await checkRecallsForProduct({ name: p.product_name || p.product_id, brand: p.brand, category: p.category });
    if (result.status === 'failed' || result.status === 'skipped') return;

    const signature = computeRecallSignature(result.recalls);

    const { data: stateRow } = await admin
      .from('product_recall_state')
      .select('recall_signature')
      .eq('product_id', p.product_id)
      .maybeSingle();

    const previousSignature = stateRow?.recall_signature ?? null;
    const isNewActiveRecall = signature && signature !== previousSignature;

    if (isNewActiveRecall) {
      productsWithNewRecalls++;
      const reason = result.recalls[0]?.reason || result.recalls[0]?.description || '';
      const outcome = await notifyUsersOfRecall(admin, {
        productId: p.product_id,
        productName: p.product_name || p.product_id,
        recallSignature: signature,
        reason,
        dryRun,
      });
      notified += outcome.notified;
      skipped += outcome.skipped;
      failed += outcome.failed;
    }

    if (!dryRun) {
      await admin.from('product_recall_state').upsert({
        product_id: p.product_id,
        product_name: p.product_name || p.product_id,
        recall_signature: signature,
        last_checked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'product_id' });
    }
  }, 5);

  return {
    productsChecked: products.length,
    productsWithNewRecalls,
    notified, skipped, failed,
  };
}

async function handleSweepRequest(req, res) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('[fda-recall sweep] CRON_SECRET is not set; refusing sweep requests entirely.');
    return res.status(401).json({ error: 'unauthorized' });
  }
  const authHeader = req.headers.authorization || '';
  if (authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const admin = getAdmin();
  if (!admin) {
    console.error('[fda-recall sweep] Supabase env not configured.');
    return res.status(503).json({ error: 'not_configured' });
  }

  const dryRun = process.env.RECALL_SWEEP_ENABLED !== '1';
  if (dryRun) {
    console.warn('[fda-recall sweep] RECALL_SWEEP_ENABLED is not "1" — running in dry-run mode, no SMS will send and no state will be written.');
  }

  try {
    const summary = await runRecallSweep(admin, { dryRun });
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ mode: 'sweep', dryRun, checkedAt: new Date().toISOString(), ...summary });
  } catch (e) {
    console.error('[fda-recall sweep] failed:', e?.message);
    return res.status(500).json({ error: 'sweep_failed', message: e?.message });
  }
}
