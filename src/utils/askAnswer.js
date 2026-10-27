/**
 * One place for how an Ask ayna answer is put together, shared by the app
 * sheet and the website panel (Ask audit issue 4 + 6):
 *
 *   localAnswer(question, ctx)  the questions ayna answers on this device,
 *                               in order: Safety, match (the one engine),
 *                               what helped, today, Today's items (signed
 *                               out), product facts and the reads library.
 *   aiAnswerExtras(data, ctx)   what goes under an answer from ayna's AI.
 *
 * Every answer carries `basedOn` (what it used, said plainly) and `sources`
 * (links with their evidence level), so the panel can end each answer with
 * "Sources" and "Based on". Sources are only ever links ayna already has on
 * file for that product or read; an AI answer that came with none says so.
 */
import { localMatchAnswer } from './askMatch.js';
import { localHistoryAnswer } from './askHistory.js';
import { localTodayAnswer, localItemAnswer } from './askToday.js';
import { localSafetyAnswer } from './askSafety.js';
import { localCatalogAnswer, markSources, relatedReads } from './askCatalog.js';
import { productCard, listableCards } from './askProducts.js';

const safe = (p) => Promise.resolve(p).catch(() => null);

async function withMatchExtras(r, ctx) {
  if (!r?.productId) return { ...r, basedOn: ['your health profile answers', 'ayna’s match engine on this device'] };
  try {
    const [{ ALL_PRODUCTS }, { evidenceFor }] = await Promise.all([import('../data/products.js'), import('../components/pdp/evidenceLevels.js')]);
    const product = ALL_PRODUCTS.find((p) => String(p.id) === String(r.productId)) || ctx.focusProduct;
    if (!product) return { ...r, basedOn: ['your health profile answers', 'ayna’s match engine on this device'] };
    const ev = evidenceFor(product);
    const card = await productCard(product, ctx);
    return {
      ...r,
      products: [card],
      sources: await markSources(Object.values(ev.links || {}).flat().map((url) => ({ url })), { brand: ev.brand, max: 4 }),
      basedOn: ['your health profile answers', 'ayna’s match engine on this device', 'the product’s evidence on file'],
    };
  } catch {
    return { ...r, basedOn: ['your health profile answers', 'ayna’s match engine on this device'] };
  }
}

/**
 * @param {string} msg
 * @param {{ profile?: object|null, healthProfile?: object|null, matchOpts?: object, focusProduct?: object|null,
 *   guideTrials?: object[], guide?: boolean, signedIn?: boolean, safety?: object|null }} ctx
 * @returns {Promise<{ answer: string, followUps: object[], basedOn: string[], sources?: object[], products?: object[], facts?: object[], stat?: object, columns?: object, local: true } | null>}
 */
export async function localAnswer(msg, ctx = {}) {
  const { profile = null, healthProfile = null, matchOpts, focusProduct = null, signedIn = false, safety = null } = ctx;
  const s = localSafetyAnswer(msg, safety);
  if (s) return { ...s, local: true };
  const m = await safe(localMatchAnswer(msg, { quizAnswers: profile, healthProfile, matchOpts, focusProduct }));
  if (m) return { ...(await withMatchExtras(m, ctx)), local: true };
  const h = await safe(localHistoryAnswer(msg, ctx.guide ? { guideTrials: ctx.guideTrials || [], guide: true } : undefined));
  if (h) return { ...h, basedOn: ['what you recorded trying'], local: true };
  const t = await safe(localTodayAnswer(msg, { intake: profile }));
  if (t) return { ...t, basedOn: ['your log and connected data on this device'], local: true };
  if (!signedIn) {
    const i = await safe(localItemAnswer(msg));
    if (i) return { ...i, basedOn: ['today’s items on this device'], local: true };
  }
  const c = await safe(localCatalogAnswer(msg, { profile, healthProfile, matchOpts, focusProduct, signedIn, topics: !signedIn }));
  if (c) return { ...c, local: true };
  return null;
}

/**
 * What goes under an answer from ayna's AI: what it used (only what was
 * actually sent), the products it pointed to as plate cards with her match,
 * and related reads from ayna's library, labelled as related, never as the
 * answer's sources.
 * @param {{ followUps?: object[] }} data  the /api/ask-ayna reply
 * @param {{ msg: string, profileSent?: boolean, contextSent?: boolean, healthSent?: boolean, resolveProduct?: Function, profile?: object|null, healthProfile?: object|null, matchOpts?: object }} ctx
 */
export async function aiAnswerExtras(data, ctx = {}) {
  const basedOn = ['ayna’s AI', ctx.profileSent && 'your profile summary', ctx.contextSent && 'what you were looking at', ctx.healthSent && 'your cycle and sleep data (you turned this on)'].filter(Boolean);
  const ids = (data?.followUps || []).filter((f) => f?.type === 'open_product' && f.productId).map((f) => f.productId).slice(0, 3);
  const products = [];
  for (const id of ids) {
    const p = ctx.resolveProduct?.(id);
    if (p) products.push(await productCard(p, ctx).catch(() => null));
  }
  const related = await relatedReads(ctx.msg || '').catch(() => []);
  // Products the engine left out for her are not listed (QA3 M10).
  return { basedOn, sources: [], related, products: listableCards(products, 3).shown };
}
