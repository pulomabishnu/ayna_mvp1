// Shopper profile — built only from what the person answered and what's in
// their Ecosystem (nothing inferred beyond that). Shared by Wrapped and You.
const TRUST_TYPES = {
  'Clinical or scientific evidence': { title: 'The Researcher', line: 'Evidence first' },
  'Reviews and experiences from other women': { title: 'The Listener', line: 'Real reviews first' },
  'Brand reputation or expert recommendations': { title: 'The Curator', line: 'Expert picks first' },
};
const BRAND_SHORT = {
  'I mostly stick with brands I already trust': 'Loyalist',
  'I prefer trusted brands but am open to something new': 'Mostly loyal',
  'I like a mix of familiar and new brands': 'Mix it up',
  'I enjoy discovering new brands': 'Explorer',
};
const ERA = {
  'I get periods regularly': 'Cycle era', 'My periods are irregular': 'Cycle era', 'I am trying to conceive': 'TTC era',
  'I am pregnant': 'Pregnancy era', 'I am postpartum': 'Postpartum era', 'I am in perimenopause': 'Perimenopause era',
  'I am in menopause': 'Menopause era', 'I am post-menopause': 'Post-menopause era', 'I use hormonal birth control': 'Birth control era',
};

export function buildPersona(intake) {
  if (!intake) return null;
  const trust = TRUST_TYPES[intake.trustRanking?.[0]];
  const brand = BRAND_SHORT[intake.brandOpenness];
  const format = (intake.preferredFormats || []).find((f) => f !== 'No preference');
  const facts = [
    trust && ['Trusts', trust.line],
    brand && ['Brands', brand],
    format && ['Format', format],
  ].filter(Boolean);
  if (!facts.length) return null;
  return { title: trust?.title || (brand === 'Explorer' ? 'The Explorer' : 'The Original'), facts };
}

const prettyCategory = (c) => String(c || '').replace(/-/g, ' ').replace(/^\w/, (m) => m.toUpperCase());

/** Rows for the You → Shopper profile card. Missing answers are left out, never guessed. */
export function buildShopperProfile(intake, myProducts = []) {
  if (!intake) return null;
  const persona = buildPersona(intake);
  const focus = (intake.supportSelections || []).find((s) => s && s !== 'Nothing right now');
  const priority = TRUST_TYPES[intake.trustRanking?.[0]]?.line;
  const counts = {};
  myProducts.forEach((p) => { if (p?.category) counts[p.category] = (counts[p.category] || 0) + 1; });
  const topCategory = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const format = (intake.preferredFormats || []).find((f) => f !== 'No preference');
  const nonNeg = (intake.avoidIngredients || []).filter((v) => v !== 'No preference' && !/-free$/.test(v)).slice(0, 2);
  const stage = (intake.lifeStageSelections || [])[0] || intake.lifeStage;
  const rows = [
    focus && { key: 'focus', label: 'Top health focus', value: focus, tone: 'pink' },
    priority && { key: 'priority', label: 'Shopping priority', value: priority, tone: 'mint' },
    (topCategory || format) && { key: 'type', label: 'Best-match type', value: topCategory ? prettyCategory(topCategory) : format, tone: 'peri' },
    nonNeg.length > 0 && { key: 'non', label: 'Non-negotiables', value: nonNeg.map((v) => (/^No /.test(v) ? v : `No ${v.toLowerCase()}`)).join(' · '), tone: 'butter' },
    ERA[stage] && { key: 'era', label: 'Health era', value: ERA[stage], tone: 'pink' },
  ].filter(Boolean);
  if (!persona && !rows.length) return null;
  const kind = { 'The Researcher': 'researcher', 'The Listener': 'listener', 'The Curator': 'curator', 'The Explorer': 'explorer' }[persona?.title] || 'original';
  const tagline = { researcher: 'You follow the evidence.', listener: 'You trust real experiences.', curator: 'You go with expert picks.', explorer: 'You love finding new brands.', original: 'You shop your own way.' }[kind];
  return { title: persona?.title || 'Your shelf', kind, tagline, rows };
}
