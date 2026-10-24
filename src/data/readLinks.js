import { ARTICLE_TOPIC_TAGS, READ_SUMMARIES } from './readPicks.js';

/**
 * How Library reads and products point at each other (team direction 58:
 * content and products connect). ARTICLE_PRODUCTS is the website read page's
 * product row (moved here from components/Articles.jsx so the product pages
 * can use the same links in reverse). Matched on the read's condition, not on
 * broad tags: `ids` are hand-picked items the read itself talks about
 * (id → why), `tags` are condition tags in priority order, `categories`
 * optionally narrows tag matches.
 */
export const TAG_REASON = {
  'vaginal-health': 'Vaginal health',
  'heavy-flow': 'Heavy flow',
  anemia: 'Iron',
  menopause: 'Menopause',
  perimenopause: 'Perimenopause',
  uti: 'UTI',
  'uti-prevention': 'UTI',
  'cramp-relief': 'Cramp relief',
  cramps: 'Cramps',
  pcos: 'PMOS',
  irregular: 'Cycle tracking',
  'pelvic-floor': 'Pelvic floor',
  incontinence: 'Bladder leaks',
  endometriosis: 'Endometriosis',
  pms: 'PMS',
  'mental-health': 'Mood support',
  fibroids: 'Fibroids',
  contraception: 'Contraception',
};
export const ARTICLE_PRODUCTS = {
  'intimate-wash': { tags: ['vaginal-health'], categories: ['intimate-care'], reason: 'External wash' },
  'heavy-bleeding': { tags: ['heavy-flow', 'anemia'] },
  'menopause-basics': { tags: ['menopause', 'perimenopause'], categories: ['menopause', 'telehealth', 'supplement', 'tracker', 'intimate-care', 'sleep'] },
  'uti-prevention': { tags: ['uti', 'uti-prevention'], exclude: ['p-boric-acid'] },
  'yeast-infection-basics': {
    ids: { 'p-winx-vaginal-health-test-treat': 'pH test', 'p-probiotics-women': 'Vaginal flora', 'p-winx-vaginal-probiotic': 'Vaginal flora' },
  },
  'period-pain-when-to-seek-care': { tags: ['cramp-relief', 'cramps'] },
  'pcos-basics': { tags: ['pcos', 'irregular'] },
  'pelvic-floor-dysfunction': { ids: { 'p-intimate-rose': 'Dilators' }, tags: ['pelvic-floor', 'incontinence'] },
  'endometriosis-basics': { tags: ['endometriosis', 'cramp-relief'] },
  'bacterial-vaginosis': {
    ids: {
      'p-winx-vaginal-health-test-treat': 'pH test',
      'p-boric-acid': 'Boric acid',
      'p-neycher-odor-be-gone': 'Boric acid',
      'p-queen-v-pop': 'Boric acid',
      'p-probiotics-women': 'Probiotic',
      'p-winx-vaginal-probiotic': 'Probiotic',
    },
  },
  pmdd: { tags: ['pms', 'mental-health'] },
  fibroids: { tags: ['fibroids', 'anemia', 'heavy-flow'] },
  'iron-deficiency-anemia': { tags: ['anemia', 'heavy-flow'] },
  'ovarian-cysts': { tags: ['cramp-relief'], reason: 'Pain relief' },
  'hormonal-birth-control': { tags: ['contraception'] },
};

// What to know before the product row, so it never contradicts the read above it.
export const ROW_NOTES = {
  'intimate-wash': 'Most people don’t need a wash. If you use one, choose fragrance-free and outside use only.',
  'yeast-infection-basics': 'The usual first step is an over-the-counter antifungal from a pharmacy. The products below are tests and support, not treatment.',
  'bacterial-vaginosis': 'BV is treated with a prescription. The products below are tests and support, not treatment.',
  'iron-deficiency-anemia': 'Check your iron levels with a blood test before you start a supplement.',
  'uti-prevention': 'Evidence for these is mixed. Each card shows what research is linked.',
  'ovarian-cysts': 'Most cysts need no treatment. Sudden, severe pain needs care right away.',
  fibroids: 'Fibroids are diagnosed and treated by a clinician. These help with heavy bleeding in the meantime.',
  'heavy-bleeding': 'Products can make heavy periods easier to manage. They don’t treat the cause, so check in with a clinician too.',
  'pcos-basics': 'PMOS care is led by a clinician. These are tracking and support tools, not treatment.',
  'menopause-basics': 'Talk to a clinician first about treatment options. The rest is support for common symptoms.',
};

/**
 * Library reads on the same topic as a product, best first: a read that
 * names the product, then reads whose product row would include it, then
 * reads on one of its topics. Only existing reads (READ_SUMMARIES).
 */
export function readsForProduct(product, limit = 3) {
  if (!product) return [];
  const own = new Set([...(product.tags || []), ...(product.healthFunctions || []), product.category].filter(Boolean));
  const out = [];
  Object.entries(READ_SUMMARIES).forEach(([id, sum], order) => {
    const spec = ARTICLE_PRODUCTS[id];
    if (spec?.exclude?.includes(product.id)) return;
    let score = 0;
    if (spec?.ids?.[product.id]) score = 100;
    else if (spec?.tags?.length && (!spec.categories || spec.categories.includes(product.category))) {
      const rank = spec.tags.findIndex((t) => own.has(t));
      if (rank >= 0) score = 50 - rank;
    }
    if (!score) {
      const hits = (ARTICLE_TOPIC_TAGS[id] || []).filter((t) => own.has(t)).length;
      if (hits) score = 10 + hits;
    }
    if (score) out.push({ id, title: sum.title, teaser: sum.teaser, score, order });
  });
  return out.sort((a, b) => b.score - a.score || a.order - b.order).slice(0, limit).map(({ id, title, teaser }) => ({ id, title, teaser }));
}

/**
 * Products for a read (the app's read page; the website's row in
 * components/Articles.jsx adds profile ordering): the read's hand-picked
 * items first, then its condition tags in order, one product per brand.
 */
export function productsForRead(articleId, pool = [], limit = 4) {
  const spec = ARTICLE_PRODUCTS[articleId];
  if (!spec) return [];
  const exclude = new Set(spec.exclude || []);
  const idList = Object.keys(spec.ids || {});
  const tags = spec.tags || [];
  const ranked = [];
  pool.forEach((p, order) => {
    if (!p?.id || p.hidden || exclude.has(p.id)) return;
    const idRank = idList.indexOf(p.id);
    if (idRank >= 0) { ranked.push({ product: p, why: spec.ids[p.id], rank: idRank, order }); return; }
    if (!tags.length || (spec.categories && !spec.categories.includes(p.category))) return;
    const own = new Set([...(p.tags || []), ...(p.healthFunctions || [])]);
    const tagRank = tags.findIndex((t) => own.has(t));
    if (tagRank >= 0) ranked.push({ product: p, why: spec.reason || TAG_REASON[tags[tagRank]] || '', rank: idList.length + tagRank, order });
  });
  ranked.sort((a, b) => a.rank - b.rank || a.order - b.order);
  const seen = new Set();
  return ranked.filter((x) => {
    const b = String(x.product.brand || String(x.product.name).split(/\s+/).slice(0, 2).join(' ')).toLowerCase().trim();
    if (seen.has(b)) return false;
    seen.add(b);
    return true;
  }).slice(0, limit);
}
