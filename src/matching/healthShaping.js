/**
 * How connected health data changes what the Ecosystem shows, after the
 * engine (v1 or v2) has picked products. Same rules as src/health/matchContext.js:
 *
 *   what she told us  >  safety / life stage  >  health-data context  >  other preferences
 *
 * So this step can only ORDER what the engine already chose and passed
 * through every safety rule. It never adds a product, never removes one,
 * never creates or drops a need, and never touches care-first shelves.
 *
 * 1. Shelf order. A need her data backs moves ahead of chosen needs it does
 *    not back, but never ahead of her first need (what she told us comes
 *    first) and never past a care-first shelf.
 * 2. Pick order within that need:
 *    - Period due within a few days (or on now): things used around the
 *      period (pads, cups, heat, pain relievers) come before things that
 *      take weeks, like supplements. Pain relievers for period pain work best
 *      started 1 to 2 days before bleeding (RCH Melbourne guideline,
 *      src/health/insights.js PERIOD_TIMING_SOURCE).
 *    - She already tracks this with a connected source, so a tracker for the
 *      same thing moves after picks that act on it. It stays on the shelf.
 *
 * Personal matching only. Browse ranking, partner placement and ads never
 * call this (they never receive a health context).
 */

// Used during or right before a period.
export const AROUND_PERIOD_CATEGORIES = new Set(['pad', 'tampon', 'cup', 'disc', 'period-underwear', 'cramp-relief', 'medication']);
// Take weeks of daily use before they can help.
export const SLOW_CATEGORIES = new Set(['supplement']);
// Measure the thing her connected source already measures.
export const TRACKER_CATEGORIES = new Set(['tracker', 'wearable']);

const categoryOf = (pick, categoryFor) => String((categoryFor && categoryFor(pick.productId)) || pick.category || pick.pp?.category || '').toLowerCase();

/** Stable sort by rank (lower first), keeping engine order inside each rank. */
function stableBy(list, rank) {
  return list.map((x, i) => ({ x, i, r: rank(x) })).sort((a, b) => a.r - b.r || a.i - b.i).map((o) => o.x);
}

function pickRank(ctx, cat) {
  const timing = ctx.kind === 'timing' || ctx.timing;
  let r = 1;
  if (timing) r = AROUND_PERIOD_CATEGORIES.has(cat) ? 0 : SLOW_CATEGORIES.has(cat) ? 2 : 1;
  if (TRACKER_CATEGORIES.has(cat)) r = 3;
  return r;
}

/**
 * @param {object} eco  buildEcosystem / buildEcosystemV2 output
 * @param {object} up   buildUserProfile output (needs carry .healthData when backed)
 * @param {object} [opts] { categoryFor(productId) -> category }
 * @returns eco with reordered shelves/picks, `pick.healthBacked`, `shelf.healthData`,
 *   and `eco.healthShaped = { changes: [...], backedNeedIds: [...] }` (null when nothing applied).
 */
export function shapeEcosystemWithHealth(eco, up, opts = {}) {
  const needs = up?.healthIntent?.needs || [];
  const backed = new Map(needs.filter((n) => n.explicit !== false && n.healthData).map((n) => [n.id, n.healthData]));
  if (!eco?.shelves?.length || !backed.size) return { ...eco, healthShaped: null };

  const changes = [];
  const shelves = eco.shelves.map((shelf) => {
    const ctx = backed.get(shelf.needId);
    if (!ctx || shelf.careFirst) return shelf;
    const before = (shelf.picks || []).map((p) => p.productId);
    const picks = stableBy(shelf.picks || [], (p) => pickRank(ctx, categoryOf(p, opts.categoryFor)));
    const after = picks.map((p) => p.productId);
    const lifted = after.filter((id, i) => before.indexOf(id) > i);
    return {
      ...shelf,
      healthData: ctx,
      picks: picks.map((p) => ({ ...p, healthBacked: { needId: shelf.needId, kind: ctx.kind || 'trend', section: ctx.section, sources: ctx.sources, lifted: lifted.includes(p.productId), tracker: TRACKER_CATEGORIES.has(categoryOf(p, opts.categoryFor)) } })),
      healthReordered: lifted.length > 0,
      healthBefore: before,
    };
  });

  // Shelf order: index 0 (her first need) and care-first shelves stay put;
  // backed shelves fill the remaining places first, in her own order.
  const fixed = shelves.map((s, i) => i === 0 || s.careFirst);
  const movable = shelves.filter((_, i) => !fixed[i]);
  const ordered = stableBy(movable, (s) => (s.healthData ? 0 : 1));
  const out = [];
  let k = 0;
  for (let i = 0; i < shelves.length; i += 1) out.push(fixed[i] ? shelves[i] : ordered[k++]);

  for (let i = 0; i < out.length; i += 1) {
    const s = out[i];
    if (!s.healthData) continue;
    const was = shelves.indexOf(s);
    changes.push({
      needId: s.needId, label: s.label, kind: s.healthData.kind || 'trend', section: s.healthData.section,
      summary: s.healthData.summary, timing: s.healthData.timing || null, sources: s.healthData.sources || [],
      shelfMovedUp: i < was, picksReordered: Boolean(s.healthReordered),
      lifted: (s.picks || []).filter((p) => p.healthBacked?.lifted).map((p) => p.productId),
    });
  }
  return { ...eco, shelves: out, healthShaped: { changes, backedNeedIds: [...backed.keys()] } };
}
