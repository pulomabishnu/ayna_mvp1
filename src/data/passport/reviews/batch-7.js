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

export default {
  'p-rael-organic-pad': { ...head('Rael pads collection page.'), facts: { 'composition.fragrance': f('Fragrance-free. Brand page: Rael pads "are made without fragrances, dyes, or chlorine bleaching".', 'Rael: Pads collection', RAEL_PADS) } },
  'p-rael-overnight': { ...head('Rael pads collection page.'), facts: { 'composition.fragrance': f('Fragrance-free. Brand page: Rael pads "are made without fragrances, dyes, or chlorine bleaching".', 'Rael: Pads collection', RAEL_PADS) } },
  'p-rael-liners': { ...head('Rael liners product page.'), facts: { 'composition.fragrance': f('Fragrance-free. Brand page: "unscented, non-perfumed panty liners".', 'Rael: Regular Organic Cotton Cover Panty Liners', RAEL_LINERS) } },
  'p-natracare-pad': { ...head('Natracare natural materials page.'), facts: { 'composition.fragrance': f('Fragrance-free. Brand page: "Natracare products are perfume and dye free."', 'Natracare: Natural materials', NATRACARE) } },
  'p-natracare-tampon': { ...head('Natracare natural materials page.'), facts: { 'composition.fragrance': f('Fragrance-free. Brand page: "Natracare products are perfume and dye free." Tampons are "100% certified organic cotton" with nothing else added.', 'Natracare: Natural materials', NATRACARE) } },
};
