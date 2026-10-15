// Merges the Chrome Amazon check (docs/commerce/audit/chrome_amazon_findings_2026-10-15.json)
// into docs/commerce/amazon_human_review.csv and prints the summary counts.
// Identity and variant only: no Amazon price is read, stored or shown.
// Run: node scripts/commerce/apply-chrome-findings.mjs
import fs from 'node:fs';
const root = new URL('../../', import.meta.url);
const F = JSON.parse(fs.readFileSync(new URL('docs/commerce/audit/chrome_amazon_findings_2026-10-15.json', root), 'utf8'));
const csvPath = new URL('docs/commerce/amazon_human_review.csv', root);

function parse(text) {
  const rows = []; let row = []; let f = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c; }
    else if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; } else if (c !== '\r') f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows;
}
const esc = (v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

const [header, ...data] = parse(fs.readFileSync(csvPath, 'utf8'));
const NEW = ['chrome_check_status', 'chrome_observed_on_amazon', 'chrome_notes', 'chrome_proposed_child_asin'];
const cols = header.filter((h) => !NEW.includes(h));
const idx = Object.fromEntries(header.map((h, i) => [h, i]));
const outHeader = [...cols, ...NEW];
const notChecked = new Set(F.not_checked);
const out = [outHeader.join(',')];
const tally = { rows: 0, checked: 0, statuses: {} };
for (const r of data) {
  if (!r.length || (r.length === 1 && !r[0])) continue;
  const get = (k) => (idx[k] != null ? r[idx[k]] ?? '' : '');
  const asin = get('asin_for_this_row') || (get('amazon_link_to_open').match(/\/dp\/([A-Z0-9]{10})/) || [])[1] || '';
  const hit = F.listings[asin];
  const proposed = F.proposed_child_asins[get('ayna_product_id')]?.[get('ayna_option_label')] || '';
  let status; let observed = ''; let notes = '';
  if (hit) { [status, observed, notes] = hit; tally.checked++; }
  else if (!asin) status = proposed ? 'NO_CHILD_ASIN_CANDIDATE_FOUND' : 'NO_CHILD_ASIN_ON_LISTING';
  else status = notChecked.has(asin) ? 'NOT_CHECKED' : 'NOT_CHECKED';
  const vals = Object.fromEntries(cols.map((h) => [h, get(h)]));
  if (hit) {
    vals.reviewer_exact_product_yes_no = /IDENTITY_MISMATCH/.test(status) ? 'no' : /IDENTITY_EXACT/.test(status) ? 'yes' : '';
    vals.reviewer_exact_variant_yes_no = /VARIANT_MISMATCH|COUNT_MISMATCH|PACK_MISMATCH|FORMULATION_MISMATCH|IDENTITY_MISMATCH/.test(status) ? 'no' : /VARIANT_EXACT/.test(status) ? 'yes' : '';
    vals.reviewer_availability = /unavailable/i.test(observed) ? 'unavailable' : /in stock|left in stock/i.test(observed) ? 'in stock' : 'not shown';
    vals.reviewed_by = F.reviewer;
    vals.reviewed_at = F.checked_at;
  }
  vals.reviewer_price_seen_usd_internal_only = '';
  for (const s of status.split('|')) tally.statuses[s] = (tally.statuses[s] || 0) + 1;
  tally.rows++;
  out.push([...cols.map((h) => esc(vals[h])), esc(status), esc(observed), esc(notes), esc(proposed)].join(','));
}
fs.writeFileSync(csvPath, `${out.join('\n')}\n`);
const L = Object.values(F.listings).map((x) => x[0]);
const n = (re) => L.filter((s) => re.test(s)).length;
console.log(JSON.stringify({
  listingsQueued: Object.keys(F.listings).length + F.not_checked.length,
  opened: Object.keys(F.listings).length,
  blockedOrCaptcha: 0,
  notChecked: F.not_checked.length,
  identityExact: n(/IDENTITY_EXACT/),
  identityMismatch: n(/IDENTITY_MISMATCH/),
  variantExact: n(/VARIANT_EXACT/),
  countOrPackMismatch: n(/COUNT_MISMATCH|PACK_MISMATCH/),
  variantMismatch: n(/VARIANT_MISMATCH/),
  formulationMismatch: n(/FORMULATION_MISMATCH/),
  unavailable: n(/LISTING_UNAVAILABLE/),
  needsHuman: n(/NEEDS_HUMAN_REVIEW/),
  cleanExact: L.filter((s) => s === 'IDENTITY_EXACT|VARIANT_EXACT').length,
  rows: tally,
}, null, 1));
