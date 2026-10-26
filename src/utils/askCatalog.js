/**
 * Product and read questions answered on this device (Ask audit issue 2:
 * the signed-out website can try Ask). Everything comes from ayna's own
 * records: the product's catalog record and evidence (the same evidenceFor
 * the product page uses) and the published reads with their own sources.
 * Nothing is generated: if a record has no field, the answer leaves it out.
 *
 *   "Check Saalt Cup for me", "What's the evidence for Saalt Cup?"  -> product facts
 *   "What helps with period cramps?", "Reads on heavy periods"      -> ayna's library on it
 */
import { productCard } from './askProducts.js';

const PRODUCT_ASK = /^(?:check|tell me about|what(?:'|’)?s in|what is|ingredients (?:in|of)|(?:what(?:'|’)?s|show me) the evidence (?:for|on)|evidence for|sources for|is there research on)\s+(.+?)(?:\s+for me)?\s*\??$/i;
const PRODUCT_GENERIC = /^check (?:a|this) product(?: for me)?\??$/i;
const TOPIC_ASK = /^(?:what (?:helps|can help|could help|works) (?:with|for)|options for|products for|reads? (?:on|about)|what does ayna(?:'|’)?s library say about|find a read (?:on|about))\s+(.+?)\s*\??$/i;

const clean = (t) => String(t || '').replace(/\s+/g, ' ').trim();
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };

/** Text of a React node tree (a read's JSX body). */
function textOf(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  return textOf(node.props?.children);
}

/** A read's own links and its list items, from its JSX body. */
export function readParts(article) {
  const links = []; const lists = [];
  const walk = (node) => {
    if (node == null || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach(walk); return; }
    const { type, props } = node;
    if (type === 'a' && props?.href && /^https:\/\//i.test(props.href)) links.push({ title: clean(textOf(props.children)).replace(/\s+[–-]\s+/g, ': '), url: props.href });
    if (type === 'ul' || type === 'ol') {
      const items = [];
      const kids = Array.isArray(props?.children) ? props.children : [props?.children];
      kids.forEach((k) => { if (k && typeof k === 'object' && k.type === 'li') items.push(clean(textOf(k.props?.children))); });
      if (items.length && !items.every((x) => links.some((l) => x.includes(l.title.split(':')[0])))) lists.push(items.filter(Boolean));
    }
    walk(props?.children);
  };
  walk(article?.body);
  return { links, lists };
}

const DONT = /^(avoid|don['’]t|do not|never|skip|stop)\b/i;

/**
 * Do / Don't from a read's own guideline list (Clean Curls pattern, #21):
 * only a list that itself has at least one "Avoid / Don't" line, so the
 * columns come straight from the read. null when the read has none.
 */
export function dosAndDonts(article) {
  for (const list of readParts(article).lists) {
    const donts = list.filter((x) => DONT.test(x));
    const dos = list.filter((x) => !DONT.test(x));
    if (donts.length && dos.length) return { dos, donts };
  }
  return null;
}

const STOP = new Set(['what', 'helps', 'help', 'with', 'for', 'the', 'and', 'my', 'a', 'an', 'of', 'to', 'on', 'about', 'period', 'periods']);
const terms = (t) => clean(t).toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));

/** Reads on a topic, best first (title and tags count most). */
export function readsOn(topic, articles = []) {
  const ws = terms(topic);
  const all = clean(topic).toLowerCase();
  if (!ws.length && !all) return [];
  return articles.map((a) => {
    const title = String(a.title || '').toLowerCase();
    const tags = (a.tags || []).join(' ').toLowerCase();
    const teaser = String(a.teaser || '').toLowerCase();
    let score = title.includes(all) ? 6 : 0;
    for (const w of ws.length ? ws : [all]) {
      const stem = w.replace(/s$/, '');
      if (title.includes(stem)) score += 3;
      if (tags.includes(stem)) score += 2;
      if (teaser.includes(stem)) score += 1;
    }
    return { a, score };
  }).filter((x) => x.score >= 3).sort((x, y) => y.score - x.score).map((x) => x.a);
}

/** Sources with their evidence level (the product page's four marks); never more than `max`. */
export async function markSources(links, { brand = '', max = 4 } = {}) {
  const { levelOfLink } = await import('../components/pdp/evidenceLevels.js');
  const rank = { gov: 0, peer: 1, brand: 2, people: 3 };
  const seen = new Set();
  return links.filter((l) => l?.url && !seen.has(l.url) && seen.add(l.url))
    .map((l) => ({ title: clean(l.title) || host(l.url), url: l.url, level: levelOfLink(l.url, brand) || null }))
    .sort((a, b) => (rank[a.level] ?? 9) - (rank[b.level] ?? 9))
    .slice(0, max);
}

async function loadReads() {
  try { const m = await import('../components/Articles.jsx'); return m.ARTICLES || []; } catch { return []; }
}

async function productAnswer(product, ctx) {
  const [{ evidenceFor }, { whoLists }, { getProductMatchDetailsForProduct }] = await Promise.all([
    import('../components/pdp/evidenceLevels.js'), import('../components/pdp/pdpParts.js'), import('../data/products.js'),
  ]);
  const ev = evidenceFor(product);
  const name = clean(product.name);
  const brand = ev.brand || clean(product.brand);
  const details = ctx.profile ? getProductMatchDetailsForProduct(product, ctx.profile, ctx.healthProfile || null, ctx.matchOpts) : null;
  const who = whoLists({ details: details && details.matchStatus !== 'no-profile' ? details : null, who: (product.whoItsFor || []).map(clean).filter(Boolean) });
  const facts = [
    product.price && { label: 'Price', value: clean(product.price) },
    { label: 'Evidence', value: ev.status },
    product.safety?.fdaStatus && { label: 'FDA status', value: clean(product.safety.fdaStatus) },
    product.ingredients && { label: 'Ingredients on file', value: clean(product.ingredients) },
  ].filter(Boolean);
  const lead = `**${name}**${brand && !name.toLowerCase().startsWith(brand.toLowerCase()) ? ` by ${brand}` : ''}. ${clean(product.summary || product.description || '')}`.trim();
  const links = Object.values(ev.links || {}).flat().map((url) => ({ url, title: '' }));
  return {
    answer: [lead, ev.why].filter(Boolean).join('\n\n'),
    followUps: [{ type: 'open_product', productId: String(product.id), label: 'See the full product page' }],
    facts,
    stat: ev.counts.gov > 0 ? { value: String(ev.counts.gov), caption: ev.counts.gov === 1 ? '.gov source on file' : '.gov sources on file', level: 'gov' } : null,
    columns: (who.yes.length || who.no.length) ? { kind: 'fit', yes: who.yes.slice(0, 5), no: who.no.slice(0, 5) } : null,
    products: [await productCard(product, ctx)],
    sources: await markSources(links, { brand, max: 5 }),
    noSources: 'No sources on file for this product yet.',
    basedOn: ['ayna’s product record', details && details.matchStatus !== 'no-profile' ? 'your health profile' : ''].filter(Boolean),
  };
}

/**
 * @param {string} text her question
 * @param {{ profile?: object|null, healthProfile?: object|null, matchOpts?: object, focusProduct?: object|null, topics?: boolean, signedIn?: boolean }} ctx
 *   topics: also answer "what helps with X" from the library (signed out; signed in, ayna's AI answers those).
 * @returns {Promise<object|null>}
 */
export async function localCatalogAnswer(text, ctx = {}) {
  const t = clean(text);
  if (!t || t.length > 160) return null;
  if (PRODUCT_GENERIC.test(t)) {
    if (ctx.focusProduct) return productAnswer(ctx.focusProduct, ctx);
    return { answer: 'Which product? Type its name, like “Check Saalt Cup for me”, and you’ll get its facts, evidence and sources.', followUps: [{ type: 'ask_else', label: 'Type a product' }], basedOn: [] };
  }
  const pm = t.match(PRODUCT_ASK);
  if (pm) {
    const [{ ALL_PRODUCTS, CATEGORY_LABELS }, { findConfidentProductMatch }] = await Promise.all([import('../data/products.js'), import('./naturalLanguageSearch.js')]);
    const q = pm[1].replace(/^(?:this|the)\s+/i, '');
    const product = ctx.focusProduct && /^(?:this|it|this product)$/i.test(q) ? ctx.focusProduct
      : (() => { const id = findConfidentProductMatch(q, ALL_PRODUCTS, null, CATEGORY_LABELS); return id && ALL_PRODUCTS.find((p) => String(p.id) === String(id)); })();
    if (product) return productAnswer(product, ctx);
    // More than one fits the name ("Saalt Cup": the cup or the cup steamer): offer them, never guess.
    const nls = await import('./naturalLanguageSearch.js');
    const close = ALL_PRODUCTS.filter((p) => p?.id)
      .map((p) => ({ p, s: nls.scoreQueryAgainstProduct(q, nls.buildSearchTextForItem(p, CATEGORY_LABELS), nls.buildIdentityTextForItem(p, CATEGORY_LABELS)) }))
      .filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 3).map((x) => x.p);
    if (close.length > 1 && /^check\b/i.test(t)) {
      return {
        answer: `More than one product fits “${q}”. Which one do you mean?`,
        followUps: close.map((p) => ({ type: 'ask', text: `Check ${clean(p.name)} for me`, label: clean(p.name) })),
        products: await Promise.all(close.map((p) => productCard(p, ctx))),
        basedOn: ['ayna’s product records'],
      };
    }
    if (!ctx.topics) return null;
  }
  const tm = ctx.topics ? t.match(TOPIC_ASK) : null;
  if (!tm) return null;
  const topic = tm[1].replace(/^my\s+/i, '');
  const [articles, { ALL_PRODUCTS, CATEGORY_LABELS }, nls] = await Promise.all([loadReads(), import('../data/products.js'), import('./naturalLanguageSearch.js')]);
  const reads = readsOn(topic, articles).slice(0, 2);
  const scored = ALL_PRODUCTS.filter((p) => p?.id && p.type !== 'digital')
    .map((p) => ({ p, s: nls.scoreQueryAgainstProduct(topic, nls.buildSearchTextForItem(p, CATEGORY_LABELS), nls.buildIdentityTextForItem(p, CATEGORY_LABELS)) }))
    .filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 3).map((x) => x.p);
  if (!reads.length && !scored.length) return null;
  const parts = [`Here’s what ayna’s library has on ${topic}.`];
  if (reads.length) parts.push(`**${reads.length === 1 ? 'Read' : 'Reads'}**\n${reads.map((a) => `- **${clean(a.title)}**: ${clean(a.teaser)}`).join('\n')}`);
  if (scored.length) parts.push('**In ayna’s catalog**, with your match when ayna has your answers:');
  if (!ctx.signedIn) parts.push('For an answer about you, sign in and ask ayna’s AI.');
  const dd = reads.map(dosAndDonts).find(Boolean);
  const links = reads.flatMap((a) => readParts(a).links);
  return {
    answer: parts.join('\n\n'),
    followUps: reads.map((a) => ({ type: 'open_library', articleId: a.id, label: `Read “${clean(a.title)}”` })),
    columns: dd ? { kind: 'do', yes: dd.dos.slice(0, 4), no: dd.donts.slice(0, 4), from: clean(reads.find((a) => dosAndDonts(a))?.title) } : null,
    products: await Promise.all(scored.map((p) => productCard(p, ctx))),
    sources: await markSources(links, { max: 4 }),
    noSources: 'No checked sources on file for this yet.',
    basedOn: ['ayna’s reads and their sources', 'ayna’s product records', ctx.profile ? 'your health profile, for the match' : ''].filter(Boolean),
  };
}

/** Reads in ayna's library on what she asked, for after an AI answer ("Related reads"). */
export async function relatedReads(text, max = 2) {
  const articles = await loadReads();
  const t = clean(text).replace(/\?$/, '');
  return readsOn(t, articles).slice(0, max).map((a) => ({ id: a.id, title: clean(a.title) }));
}
