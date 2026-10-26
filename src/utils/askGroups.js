/**
 * Ask ayna's first screen (Ask audit, Oct 25, issue 1 + 5): three to five
 * suggested questions in short groups, About you · Safety · Products, each a
 * single pill. The Safety group goes first when her profile has a relevant
 * flag (a safety hold, a care item, an IUD, pregnancy, bleeding after
 * menopause); otherwise it sits after About you. Pure: what ayna knows in,
 * groups out. A question is only offered when ayna can answer it:
 * `local: true` ones are answered on this device (askAnswer.js), the rest
 * use ayna's AI and, signed out, ask her to sign in.
 */
import { askWhyFor } from './askPrompts.js';

export const GROUP_TITLES = { about: 'About you', safety: 'Safety', products: 'Products' };

// Safety questions answered on this device from her own profile (askSafety.js).
export const SAFETY_Q = {
  hold: 'Why is a product on safety hold for me?',
  bleeding: 'What should I know about bleeding after menopause?',
  care: 'What should I check with a clinician first?',
};

const q = (question, local, extra = {}) => ({ question, local, ...extra });

/**
 * @param {object} o
 * @param {boolean} o.signedIn     a session exists (ayna's AI can answer)
 * @param {boolean} o.hasProfile   she has quiz answers on this device
 * @param {object}  o.signals      Today's signals on this device (askToday.js)
 * @param {object|null} o.safety   askSafetyFlags() result: { flags: string[] }
 * @param {object|null} o.focusProduct  the product she has open
 * @param {number|null} o.topPercent    her top match % from the one engine (shown only 50+)
 * @param {string} o.topic         a need phrase from her profile for the read prompt ("heavy periods")
 * @param {boolean} o.hasHealthData
 * @param {number} o.max           total prompts (3 to 5)
 * @returns {{ id: 'about'|'safety'|'products', title: string, prompts: { question: string, local: boolean }[] }[]}
 */
export function askPromptGroups({ signedIn = false, hasProfile = false, signals = {}, safety = null, focusProduct = null, topPercent = null, topic = '', hasHealthData = false, max = 5 } = {}) {
  const s = signals || {};
  const flags = new Set(safety?.flags || []);
  const about = [];
  if (focusProduct?.name && hasProfile) about.push(q(`Why is ${focusProduct.name} my match?`, true));
  if (s.lowSleepOrEnergy) about.push(q('Why am I feeling so tired today?', false));
  if (s.hasRundown) about.push(q('Explain my Daily Rundown', true));
  about.push(q('What should I focus on today?', true));
  if (s.hasYesterdayLog) about.push(q('What changed from yesterday?', true));
  if (hasProfile && !focusProduct) about.push(q(Number(topPercent) >= 50 ? `Why is my top match ${Math.round(topPercent)}%?` : 'Explain my top match', true));
  if (signedIn && hasHealthData) about.push(q('What stands out in my health data this week?', false));
  if (s.hasHistory) about.push(q('What helped last time?', true));

  const safe = [];
  if (flags.has('bleeding')) safe.push(q(SAFETY_Q.bleeding, true));
  if (flags.has('hold')) safe.push(q(SAFETY_Q.hold, true));
  if (flags.has('care') || flags.has('pregnancy')) safe.push(q(SAFETY_Q.care, true));
  if (flags.has('iud')) safe.push(q(focusProduct?.name ? `Is ${focusProduct.name} OK with my IUD?` : 'Is a cup or disc OK with my IUD?', false));
  if (!safe.length) safe.push(q(focusProduct?.name ? `Anything I should know before using ${focusProduct.name}?` : 'Is this safe with my birth control?', false));

  const products = [];
  if (focusProduct?.name) products.push(q(`Check ${focusProduct.name} for me`, true));
  else {
    products.push(q(`What helps with ${topic || 'period cramps'}?`, true));
    products.push(q('Check a product for me', true));
  }

  // Signed out: only what ayna answers on this device, plus the Safety group's
  // first question so the sign-in note can say why it needs an account.
  const keep = (list) => (signedIn ? list : list.filter((p) => p.local));
  const flagged = flags.size > 0;
  const groups = [
    { id: 'about', prompts: keep(about) },
    { id: 'safety', prompts: signedIn || flagged ? keep(safe).length ? keep(safe) : safe.slice(0, 1) : [] },
    { id: 'products', prompts: keep(products) },
  ];
  // Budget: Safety first when flagged; About you keeps two, Products one or two.
  const take = { about: 2, safety: flagged ? 2 : 1, products: 1 };
  let left = Math.max(3, Math.min(5, max));
  const order = flagged ? ['safety', 'about', 'products'] : ['about', 'safety', 'products'];
  const out = {};
  for (const id of order) {
    const g = groups.find((x) => x.id === id);
    const n = Math.min(take[id], left, g.prompts.length);
    out[id] = g.prompts.slice(0, n);
    left -= n;
  }
  // Room left (few signals): fill from About you, then Products.
  for (const id of ['about', 'products']) {
    const g = groups.find((x) => x.id === id);
    while (left > 0 && out[id].length < g.prompts.length) { out[id].push(g.prompts[out[id].length]); left -= 1; }
  }
  return order.map((id) => ({ id, title: GROUP_TITLES[id], prompts: out[id] })).filter((g) => g.prompts.length);
}

/**
 * Three Ask starters built from her actual health findings (dashboard brief,
 * week 3), for the dashboard on both platforms. A finding is the fact as
 * shown ({ title } or { text }); its own question wins when it has one.
 * The fact goes to ayna's AI only with her health opt-in (askFromPrompt).
 * @param {Array<{ title?: string, text?: string, fact?: string, question?: string }>} findings
 * @returns {Array<{ question: string, reason: string, local: false, health: string }>}
 */
export function startersFromFindings(findings = []) {
  const out = [];
  for (const f of Array.isArray(findings) ? findings : []) {
    const fact = String(f?.fact || f?.title || f?.text || '').trim();
    if (!fact) continue;
    const question = String(f?.question || '').trim() || askWhyFor(fact);
    if (out.some((x) => x.question === question)) continue;
    out.push({ question, reason: fact, local: false, health: fact });
    if (out.length === 3) break;
  }
  return out;
}
