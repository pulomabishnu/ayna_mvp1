/**
 * "Ask Partner Studio": plain-language answers to common questions, built
 * only from the numbers already on the dashboard (no model, no network, so it
 * can't invent a figure). Pure and testable.
 */
import { explore } from './engine/explore.js';

export const QUESTIONS = [
  { id: 'overall', q: 'How am I doing overall?', keys: ['overall', 'doing', 'summary', 'how am i', 'score'] },
  { id: 'beating', q: 'Who is beating me, and by how much?', keys: ['beat', 'competitor', 'ahead', 'rank', 'who', 'top brand'] },
  { id: 'missing', q: 'Why am I missing the top 3?', keys: ['miss', 'why', 'lose', 'lost', 'not shown', 'not recommended'] },
  { id: 'fix', q: 'What should I fix first?', keys: ['fix', 'first', 'next', 'action', 'improve', 'priority'] },
  { id: 'strong', q: 'Where am I strongest?', keys: ['strong', 'best', 'win', 'good at'] },
  { id: 'price', q: 'Would a lower price help?', keys: ['price', 'cheaper', 'cost', 'discount', 'budget'] },
  { id: 'evidence', q: 'How does my evidence compare?', keys: ['evidence', 'study', 'studies', 'claim', 'research', 'proof'] },
];

export function matchQuestion(text) {
  const t = String(text || '').toLowerCase();
  if (!t.trim()) return null;
  let best = null;
  let score = 0;
  for (const q of QUESTIONS) {
    const s = q.keys.filter((k) => t.includes(k)).length;
    if (s > score) { best = q; score = s; }
  }
  return best;
}

const pct = (v) => (v == null ? 'N/A' : `${v}%`);
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

/**
 * @returns {{ title: string, lines: string[], go?: string }}
 */
export function answer(id, data, b) {
  const cats = b.categories || [];
  const t = b.totals || {};
  const first = cats[0];
  const meta = first ? data.categories.find((c) => c.id === first.id) : null;
  const ex = meta?.rows ? explore(meta, b.brand, first.outcomes) : null;
  const name = b.displayName || b.brand;

  if (!cats.length) {
    return { title: 'Not in a Phase 1 category yet', lines: [`${name}’s products aren’t in period care, intimate care, or bladder and pelvic floor, so there’s no ranking yet.`] };
  }

  if (id === 'overall') {
    const lines = [`Your products made ${t.slotShare.num} of the ${t.slotShare.den} top-3 picks (${pct(t.slotShare.pct)}).`];
    for (const c of cats) if (c.rank.rank) lines.push(`In ${c.label.toLowerCase()} you rank #${c.rank.rank} of ${c.field?.brands ?? c.rank.of} brands.`);
    if (t.eligibleToPlaced.den) lines.push(`When one of your products fit a shopper, it made the top 3 ${pct(t.eligibleToPlaced.pct)} of the time (${t.eligibleToPlaced.num} of ${t.eligibleToPlaced.den}).`);
    return { title: 'Your summary', lines, go: 'share' };
  }

  if (id === 'beating' && ex) {
    const me = ex.brands.find((x) => x.you);
    const ahead = ex.brands.filter((x) => !x.you && x.slots > (me?.slots || 0)).slice(0, 3);
    if (!ahead.length) return { title: 'Nobody is ahead of you', lines: [`You’re #1 in ${first.label.toLowerCase()}.`], go: 'share' };
    const lines = ahead.map((x) => `${x.brand}: ${x.slots} top-3 picks (${pct(x.share)}), ${x.slots - (me?.slots || 0)} more than you.`);
    const topProduct = ex.products.find((p) => !p.you);
    if (topProduct) lines.push(`The most-picked product is ${topProduct.name} (${topProduct.brand}), in the top 3 ${plural(topProduct.slots, 'time')}.`);
    return { title: `Brands ahead of you in ${first.label.toLowerCase()}`, lines, go: 'share' };
  }

  if (id === 'missing') {
    const f = first.funnel;
    if (!f.eligible_lost) return { title: 'No misses where you fit', lines: ['Every time one of your products fit a shopper, it made the top 3.'], go: 'losses' };
    const lines = [`You fit ${f.eligible} shoppers but missed the top 3 for ${f.eligible_lost}.`];
    for (const r of f.reasons.slice(0, 3)) lines.push(`${r.label}: ${plural(r.n, 'shopper')} (${pct(r.share)}). ${r.action}`);
    if (f.insufficient_info) lines.push(`Separately, ${plural(f.insufficient_info, 'shopper')} couldn’t be shown your product because a fact is missing (often ingredients or materials).`);
    return { title: 'Why you miss the top 3', lines, go: 'losses' };
  }

  if (id === 'fix') {
    const acts = (b.actions || []).slice(0, 3);
    if (!acts.length) return { title: 'Nothing urgent', lines: ['There are no open actions right now.'] };
    return { title: 'Start here', lines: acts.map((a, i) => `${i + 1}. ${a.title}. ${a.action}`), go: 'actions' };
  }

  if (id === 'strong') {
    const cells = (first.grid?.rows || []).flatMap((r) => r.cells.map((c) => ({ need: r.need, budget: first.grid.cols.find((x) => x.key === c.key)?.label, share: c.slotShare, n: c.brandSlots })));
    const top = cells.filter((c) => c.share > 0).sort((a, b2) => b2.share - a.share).slice(0, 3);
    if (!top.length) return { title: 'No wins yet', lines: ['None of your products made a top 3 in this category yet. Check “Why am I missing the top 3?”.'], go: 'losses' };
    const best = ex?.products.find((p) => p.you);
    const lines = top.map((c) => `${c.need}, ${c.budget}: ${pct(c.share)} of top-3 picks.`);
    if (best) lines.push(`Your best product is ${best.name}, #${best.rank} of ${ex.products.length} products.`);
    return { title: 'Where you win', lines, go: 'share' };
  }

  if (id === 'price') {
    const sims = (b.simulations || []).filter((s) => s.after.inclusion.num !== s.before.inclusion.num);
    if (!sims.length) return { title: 'Price isn’t the blocker', lines: ['A 20% lower price wouldn’t change how often any of your products are recommended.'], go: 'losses' };
    return { title: 'What a 20% lower price would do', lines: sims.map((s) => `${s.name}: recommended to ${s.before.inclusion.num} → ${s.after.inclusion.num} of ${s.scenarios} shoppers at ${s.changeLabel}.`), go: 'losses' };
  }

  if (id === 'evidence') {
    const m = b.evidence?.metrics;
    const claims = (b.evidence?.skus || []).reduce((n, r) => n + r.claims.length, 0);
    const direct = (b.evidence?.skus || []).reduce((n, r) => n + r.claims.filter((c) => c.status === 'direct').length, 0);
    const lines = [claims ? `ayna has ${plural(claims, 'claim')} on file for you; ${direct} ${direct === 1 ? 'is' : 'are'} backed by a study of the product itself (draft).` : 'ayna has no claim wording on file for your products yet. Sending your current claims and studies is the first step.'];
    if (m?.completeness?.mine != null) lines.push(`Your product info is ${m.completeness.mine}% complete vs a ${m.completeness.peerMedian ?? 'N/A'}% median for similar products.`);
    lines.push('All evidence statuses are drafts until a reviewer signs them off.');
    return { title: 'Your evidence', lines, go: 'evidence' };
  }

  return { title: 'Try one of these', lines: QUESTIONS.map((q) => q.q) };
}

/** Search across every catalog product and brand in the brand's categories, plus screens. */
export function search(query, data, b, screens) {
  const q = String(query || '').trim().toLowerCase();
  if (q.length < 2) return [];
  const out = [];
  for (const [id, label] of screens) if (label.toLowerCase().includes(q)) out.push({ kind: 'screen', id, label });
  const seen = new Set();
  for (const c of b.categories || []) {
    const meta = data.categories.find((x) => x.id === c.id);
    if (!meta?.rows) continue;
    const ex = explore(meta, b.brand, c.outcomes);
    for (const br of ex.brands) {
      if (br.brand.toLowerCase().includes(q) && !seen.has(`b:${br.brand}:${c.id}`)) {
        seen.add(`b:${br.brand}:${c.id}`);
        out.push({ kind: 'brand', label: br.brand, sub: `#${br.rank} of ${ex.brands.length} brands in ${c.label.toLowerCase()} · ${br.slots} top-3 picks`, partner: br.partner, you: br.you, cat: c.id });
      }
    }
    for (const p of ex.products) {
      if ((p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)) && !seen.has(`p:${p.id}`)) {
        seen.add(`p:${p.id}`);
        out.push({ kind: 'product', label: p.name, sub: `${p.brand} · #${p.rank} of ${ex.products.length} in ${c.label.toLowerCase()} · ${p.slots} times in top 3`, partner: p.partner, you: p.you, cat: c.id });
      }
    }
  }
  return out.slice(0, 10);
}
