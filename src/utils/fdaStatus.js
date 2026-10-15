// One fixed list for "FDA status" (the catalog has ~90 free-text values).
// Each product's text is mapped to one of these, shown with one plain line,
// and the original note stays available as the detail. "FDA-registered"
// never reads like an approval: registration is a listing, not a review.

export const FDA_STATUSES = {
  cleared: { label: 'FDA-cleared', line: 'The FDA reviewed this device before sale (510(k) or De Novo).' },
  approved: { label: 'FDA-approved', line: 'The FDA approved this drug or device.' },
  'brand-claim': { label: 'Brand says FDA-cleared (not confirmed)', line: 'The brand says it is cleared; ayna has not confirmed it in the FDA databases.' },
  'otc-drug': { label: 'Over-the-counter drug', line: 'Sold without a prescription under the FDA’s rules for OTC drugs.' },
  listed: { label: 'Listed with the FDA', line: 'The maker or product is registered with the FDA. That is a listing, not an approval or clearance.' },
  supplement: { label: 'Dietary supplement', line: 'The FDA does not approve supplements before sale.' },
  cosmetic: { label: 'Cosmetic or personal care', line: 'Cosmetics are not reviewed by the FDA before sale.' },
  'not-device': { label: 'Not a medical device', line: 'A wellness, fitness or everyday product, so no FDA review applies.' },
  care: { label: 'Care service', line: 'Care is given by licensed clinicians; the service itself is not an FDA product.' },
  na: { label: 'Not applicable', line: 'Apps and services are not FDA products.' },
};

export function normalizeFdaStatus(raw) {
  const s = String(raw || '').replace(/⚠️?/g, '').trim();
  if (!s) return null;
  const t = s.toLowerCase();
  const negCleared = /not (an |a )?(fda[- ])?cleared|not separately|no 510\(k\)|exempt from/.test(t);
  let key = null;
  if (/(says|claims|per the brand|could not find|not confirmed)/.test(t) && /cleared/.test(t) && !/not (an )?fda-?cleared/.test(t)) key = 'brand-claim';
  else if (/approved/.test(t) && !/not (an )?(fda-)?approved|not fda-approved/.test(t)) key = 'approved';
  else if (/(510\(k\)|de novo|fda-cleared|fda cleared)/.test(t) && !negCleared) key = 'cleared';
  else if (/prescription via|licensed (clinician|provider|healthcare|telehealth|therapy)|clinical care|licensed providers/.test(t)) key = 'care';
  else if (/over-the-counter (urinary )?(drug|analgesic|external analgesic)|otc drug|external analgesic|sunscreens are regulated/.test(t)) key = 'otc-drug';
  else if (/supplement|nutraceutical|\busp\b|\bnsf\b|\bgmp\b|non-gmo|ifos/.test(t) && !/cosmetic/.test(t)) key = 'supplement';
  else if (/cosmetic|personal[- ]care/.test(t)) key = 'cosmetic';
  else if (/class i|class ii|fda-listed|fda-registered|registered with the fda|registered class|medical device|regulated by the fda as medical devices|tampon|pregnancy test|diagnostic|lh test|gudid/.test(t) && !/not (an |a )?(fda-cleared |fda-regulated )?medical device|not a medical device/.test(t)) key = 'listed';
  else if (/wellness|fitness|apparel|garment|pleasure device|not a medical device|not fda-regulated|not regulated|absorbent hygiene|accessory|not fda-cleared|not listed with the fda/.test(t)) key = 'not-device';
  else if (/^n\/a|software|\bapp\b/.test(t)) key = 'na';
  if (!key) return null; // e.g. "Phthalate-free" or "Dermatologist tested": not an FDA status at all
  return { key, ...FDA_STATUSES[key], detail: s };
}
