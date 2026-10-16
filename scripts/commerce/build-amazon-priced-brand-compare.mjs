// The Amazon-routed products whose catalog price text has a dollar figure,
// compared with what the audit read on the brand's own site. Brand prices are
// for spotting wrong counts/sizes only: an Amazon card may never show them.
// Run: node scripts/commerce/build-amazon-priced-brand-compare.mjs
import fs from 'node:fs';
const read = (p) => JSON.parse(fs.readFileSync(new URL(`../../docs/commerce/audit/${p}`, import.meta.url), 'utf8'));
const auditRows = read('catalog_audit_rows.json');
const rows = auditRows.rows || auditRows;
const merchant = read('merchant_verification_merged_2026-10-15.json');
const csv = (v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const firstDollar = (t) => { const m = String(t || '').match(/\$\s*([\d,]+(?:\.\d+)?)/); return m ? Number(m[1].replace(/,/g, '')) : null; };

const amz = rows.filter((x) => x.selected_primary_offer.startsWith('amazon') && /\$/.test(x.ayna_current_price || ''));
const header = ['ayna_product_id', 'product_name', 'ayna_price_text', 'amazon_asin', 'brand_site', 'brand_product_match', 'brand_option_compared', 'brand_regular_price_usd', 'ayna_size_count', 'brand_size_count', 'size_count_match', 'verdict', 'why'];
const out = [header.join(',')];
const tally = {};
for (const x of amz) {
  const m = merchant[x.ayna_product_id];
  const p = m?.price || {};
  const pack = m?.packOrSize || {};
  let verdict; let why = '';
  if (!m || m.productMatch === 'unable_to_verify' || !m.merchant) { verdict = 'NEEDS_BRAND_CHECK'; why = 'no brand-site read in the audit'; }
  else if (m.productMatch !== 'exact') { verdict = 'BRAND_PRODUCT_UNCLEAR'; why = `brand page match: ${m.productMatch}`; }
  else if (pack.match === 'mismatch') { verdict = 'LIKELY_WRONG_COUNT_OR_SIZE'; why = `ayna "${pack.ayna}" vs brand "${pack.merchantDefault}"`; }
  else {
    const a = firstDollar(x.ayna_current_price); const b = p.merchantRegular;
    if (b != null && p.currency && p.currency !== 'USD') { verdict = 'PLAUSIBLE_SIZE_ONLY'; why = `brand price is in ${p.currency}, not comparable`; }
    else if (a != null && b != null && Math.abs(a - b) / b > 0.25) { verdict = 'TEXT_FAR_FROM_BRAND_PRICE'; why = `ayna $${a} vs brand $${b} (more than 25% apart; check the item, not just the price)`; }
    else if (a != null && b != null) { verdict = 'PLAUSIBLE'; why = 'same product and size on the brand site, price in range'; }
    else { verdict = 'NEEDS_BRAND_CHECK'; why = 'brand price not read'; }
  }
  tally[verdict] = (tally[verdict] || 0) + 1;
  out.push([x.ayna_product_id, x.product_name, x.ayna_current_price, x.product_identifier, m?.merchant || '', m?.productMatch || '', p.forOption || '', p.merchantRegular ?? '', pack.ayna || '', pack.merchantDefault || '', pack.match || '', verdict, why].map(csv).join(','));
}
fs.writeFileSync(new URL('../../docs/commerce/amazon_priced_vs_brand_site.csv', import.meta.url), `${out.join('\n')}\n`);
console.log(amz.length, tally);
