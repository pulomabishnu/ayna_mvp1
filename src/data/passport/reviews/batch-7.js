// Research pass 7 (Nov 4 2026): fragrance facts from the brand's own pages, for products held
// back only because their fragrance status was unknown. Each fact quotes the brand page.
// Latex was checked on the same pages: none of them say anything about latex, so latex stays
// unknown on purpose (unknown is never "latex-free").

const D = '2026-11-04';
const NEXT = '2027-05-03';
const BY = 'ayna research pass (AI-assisted), needs human sign-off';
const f = (value, source, source_url, source_type = 'brand') => ({ value, source, source_url, source_type, verified_at: D });
const head = (notes) => ({ qa_status: 'in_review', reviewed_by: BY, reviewed_at: D, last_checked: D, next_review_due: NEXT, notes });

const RAEL_PADS = 'https://www.getrael.com/collections/pads';
const RAEL_LINERS = 'https://www.getrael.com/products/regular-organic-cotton-liners';
const NATRACARE = 'https://natracare.com/why-natracare/natural-materials';
const TARO_PAGE = 'https://taro.com/node/77';
const MONISTAT_LABEL = 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=e1b8ad40-5adb-482a-b532-3f8e30d90128';

export default {
  'p-monistat-3-combo': { ...head('FDA Drug Facts label on DailyMed (Insight Pharmaceuticals). The label lists every inactive ingredient; none is a fragrance.'), facts: { 'composition.fragrance': f('Fragrance-free. Drug Facts inactive ingredients: benzoic acid, cetyl alcohol, isopropyl myristate, polysorbate 60, potassium hydroxide, propylene glycol, purified water, stearyl alcohol. No fragrance or perfume is listed.', 'DailyMed: Monistat 3 Combination Pack label', MONISTAT_LABEL, 'regulatory') } },
  'p-taro-clotrimazole-7': { ...head('Taro product page (NDC 51672-2003-6, Taro labeler code 51672). The page lists every inactive ingredient; none is a fragrance.'), facts: { 'composition.fragrance': f('Fragrance-free. Taro page inactive ingredients: benzyl alcohol, cetostearyl alcohol, cetyl esters wax, 2-octyldodecanol, polysorbate 60, purified water, sorbitan monostearate. No fragrance is listed.', 'Taro: Clotrimazole Vaginal Cream 1% (NDC 51672-2003-6)', TARO_PAGE) } },
  'p-rael-organic-pad': { ...head('Rael pads collection page.'), facts: { 'composition.fragrance': f('Fragrance-free. Brand page: Rael pads "are made without fragrances, dyes, or chlorine bleaching".', 'Rael: Pads collection', RAEL_PADS) } },
  'p-rael-overnight': { ...head('Rael pads collection page.'), facts: { 'composition.fragrance': f('Fragrance-free. Brand page: Rael pads "are made without fragrances, dyes, or chlorine bleaching".', 'Rael: Pads collection', RAEL_PADS) } },
  'p-rael-liners': { ...head('Rael liners product page.'), facts: { 'composition.fragrance': f('Fragrance-free. Brand page: "unscented, non-perfumed panty liners".', 'Rael: Regular Organic Cotton Cover Panty Liners', RAEL_LINERS) } },
  'p-natracare-pad': { ...head('Natracare natural materials page.'), facts: { 'composition.fragrance': f('Fragrance-free. Brand page: "Natracare products are perfume and dye free."', 'Natracare: Natural materials', NATRACARE) } },
  'p-natracare-tampon': { ...head('Natracare natural materials page.'), facts: { 'composition.fragrance': f('Fragrance-free. Brand page: "Natracare products are perfume and dye free." Tampons are "100% certified organic cotton" with nothing else added.', 'Natracare: Natural materials', NATRACARE) } },
};
