import fs from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer';

const BASE = process.env.AYNA_AFTER_URL || 'https://aynamvp1-git-ameera-v6-real-b9ae33-pulomabishnu-4744s-projects.vercel.app';
const OUT = process.env.AYNA_QA_OUT || 'artifacts/v6-ecosystem-signedin-qa';
const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const USER_ID = '11111111-2222-4333-8444-555555555555';
const widths = [375, 768, 1440];
const themes = ['light', 'dark'];
const passes = ['layout-spacing', 'theme-contrast', 'interaction', 'responsive', 'regression'];
const failures = [];
const observations = [];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const nowIso = new Date().toISOString();
const farFuture = 4102444800;

const intake = {
  age: '29',
  lifeStage: 'My periods are irregular',
  lifeStageSelections: ['My periods are irregular'],
  zipcode: '10001',
  supportSelections: ['Cramps or period pain', 'PCOS support', 'Vaginal dryness', 'Recurrent UTI-like symptoms'],
  periodFlow: 'Moderate',
  periodPain: 'Moderate',
  utiFrequency: 'A few times a year',
  diagnosisSelections: ['PCOS'],
  allergyStatus: 'No known allergies',
  allergyItems: [],
  takesCurrent: 'No',
  currentMedicationItems: [],
  productHistory: [],
  avoidRepeat: [],
  safetyConcern: 'No',
  preferredFormats: ['Period-care products', 'Drinks or teas', 'Pills or capsules'],
  priceRange: ['$25–$75'],
  largePurchaseFrequency: 'A few times a year',
  brandOpenness: 'I like a mix of familiar and new brands',
  trustedBrands: ['LOLA'],
  avoidIngredients: ['Fragrance'],
  fsaHsaAnswer: 'Not sure',
  trustRanking: ['Clinical or scientific evidence', 'Reviews and experiences from other women', 'Brand reputation or expert recommendations'],
  trustRankingTouched: true,
  anythingElse: '',
};

const products = [
  {
    id: 'p-lola-tampon', name: 'LOLA Organic Tampons', brand: 'LOLA', category: 'tampon', type: 'physical',
    healthFunctions: ['menstrual-collection'], price: '$10 for 18', matchPercentage: 96,
    image: 'https://mylola.com/cdn/shop/files/four-lola-plastic-applicator-tampon-boxes.img.jpg?v=1753220344&width=900',
    recommendationReason: 'Matches your period-care preferences and preference for trusted brands.'
  },
  {
    id: 'p-rael-organic-pad', name: 'Rael Organic Cotton Pads', brand: 'Rael', category: 'pad', type: 'physical',
    healthFunctions: ['menstrual-collection', 'leak-protection'], price: '$9 for 14', matchPercentage: 93,
    image: 'https://m.media-amazon.com/images/I/71BjZn+VbJL.jpg',
    recommendationReason: 'A fragrance-free organic period-care option.'
  },
  {
    id: 'p-inositol-wholesome', name: 'Wholesome Story Myo & D-Chiro Inositol', brand: 'Wholesome Story', category: 'supplement', type: 'physical',
    healthFunctions: ['supplement', 'pcos-management'], price: '$25', matchPercentage: 91,
    image: 'https://cdn.shopify.com/s/files/1/0412/0094/3266/files/Inositol_Front_Panel_V.A_Rev_1_3_25.png?v=1742858533',
    recommendationReason: 'Matches the PCOS-support area in your profile.'
  },
  {
    id: 'qa-vaginal', name: 'Neycher Vaginal Moisturizer', brand: 'Neycher', category: 'intimate-care', type: 'physical',
    healthFunctions: ['vaginal-health'], price: '$24', matchPercentage: 90,
    image: 'https://cdn.prod.website-files.com/66dc3b9581bf97e670861652/686eb5fcdbbd35b6fc957602_Frame%201000011567.jpg',
    recommendationReason: 'Matches the vaginal-dryness support you selected.'
  },
  {
    id: 'p-uqora-control', name: 'Uqora Control', brand: 'Uqora', category: 'supplement', type: 'physical',
    healthFunctions: ['uti-prevention', 'supplement'], price: '$25/month', matchPercentage: 88,
    image: 'https://cdn.shopify.com/s/files/1/0839/0671/files/3_month.jpg?v=1762457618',
    recommendationReason: 'Matches recurrent UTI-support needs in your intake.'
  },
  {
    id: 'qa-pelvic', name: 'Pelvic Floor Support', brand: 'Ayna QA', category: 'pelvic-floor', type: 'digital',
    healthFunctions: ['sexual-health'], price: '$0', matchPercentage: 87,
    recommendationReason: 'Matches pelvic and intimate-care support.'
  }
];

function b64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

function makeSession() {
  const user = {
    id: USER_ID,
    aud: 'authenticated', role: 'authenticated', email: 'qa-ecosystem@ayna.test',
    email_confirmed_at: nowIso, confirmed_at: nowIso, created_at: nowIso, updated_at: nowIso,
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: { first_name: 'Ameera', full_name: 'Ameera QA' }, identities: []
  };
  const token = `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({ aud: 'authenticated', exp: farFuture, sub: USER_ID, email: user.email, role: 'authenticated' })}.qa`;
  return { access_token: token, refresh_token: 'qa-refresh-token', token_type: 'bearer', expires_in: farFuture, expires_at: farFuture, user };
}

function ecosystemRows() {
  return products.map((p) => ({
    user_id: USER_ID, product_id: p.id, product_name: p.name, brand: p.brand, category: p.category,
    product_type: p.type, product_data: p, in_ecosystem: true, is_tracked: false, is_omitted: false,
    updated_at: nowIso
  }));
}

function shadow() {
  const rows = {};
  for (const p of products) rows[p.id] = { product: p, inEcosystem: true, isTracked: false, isOmitted: false, updatedAt: Date.now() };
  return { version: 3, resetAt: 0, rows };
}

async function discoverProjectRef() {
  const html = await (await fetch(`${BASE}/?qa-discover=1`)).text();
  const scripts = [...html.matchAll(/<script[^>]+src=["']([^"']+\.js[^"']*)/g)].map((m) => new URL(m[1], BASE).href);
  for (const src of scripts) {
    const text = await fetch(src).then((r) => r.text()).catch(() => '');
    const match = text.match(/https:\/\/([a-z0-9-]+)\.supabase\.co/i);
    if (match) return match[1];
  }
  throw new Error('Could not discover Supabase project ref from preview bundle');
}

function corsHeaders(extra = {}) {
  return { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-expose-headers': '*', 'content-type': 'application/json', ...extra };
}

function contrast(rgb1, rgb2) {
  const lum = (rgb) => {
    const a = rgb.map((v) => v / 255).map((v) => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
    return .2126 * a[0] + .7152 * a[1] + .0722 * a[2];
  };
  const l1 = lum(rgb1), l2 = lum(rgb2);
  return (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05);
}

function parseRgb(value) {
  const m = String(value || '').match(/rgba?\((\d+(?:\.\d+)?)[, ]+\s*(\d+(?:\.\d+)?)[, ]+\s*(\d+(?:\.\d+)?)/i);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

await fs.mkdir(OUT, { recursive: true });
const projectRef = await discoverProjectRef();
const session = makeSession();
const storageKey = `sb-${projectRef}-auth-token`;

const browser = await puppeteer.launch({
  headless: true, executablePath: CHROME, protocolTimeout: 120000,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
});

async function makePage(width, theme) {
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(45000);
  page.setDefaultTimeout(12000);
  await page.setViewport({ width, height: 1000, deviceScaleFactor: 1 });
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: theme }, { name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.evaluateOnNewDocument(({ storageKey, session, userId, intake, shadow, theme }) => {
    localStorage.setItem(storageKey, JSON.stringify(session));
    localStorage.setItem('ayna_v6_site_theme', theme);
    sessionStorage.setItem(`ayna_health_intake_v2:${userId}`, JSON.stringify(intake));
    sessionStorage.setItem(`ayna_ecosystem_shadow_v2:${userId}`, JSON.stringify(shadow));
  }, { storageKey, session, userId: USER_ID, intake, shadow: shadow(), theme });

  await page.setRequestInterception(true);
  page.on('request', async (req) => {
    const u = new URL(req.url());
    const method = req.method();
    if (method === 'OPTIONS' && u.hostname.endsWith('.supabase.co')) {
      return req.respond({ status: 204, headers: corsHeaders() });
    }
    if (u.hostname.endsWith('.supabase.co')) {
      if (u.pathname.includes('/auth/v1/user')) return req.respond({ status: 200, headers: corsHeaders(), body: JSON.stringify(session.user) });
      if (u.pathname.includes('/auth/v1/token')) return req.respond({ status: 200, headers: corsHeaders(), body: JSON.stringify(session) });
      if (u.pathname.includes('/rest/v1/user_ecosystems')) return req.respond({ status: 200, headers: corsHeaders({ 'content-range': `0-${products.length - 1}/${products.length}` }), body: JSON.stringify(ecosystemRows()) });
      if (u.pathname.includes('/rest/v1/health_intakes')) return req.respond({ status: 200, headers: corsHeaders(), body: JSON.stringify({ profile: intake }) });
      if (u.pathname.includes('/rest/v1/user_health_profiles')) return req.respond({ status: 200, headers: corsHeaders(), body: JSON.stringify({ profile: { firstName: 'Ameera', conditions: ['PCOS'], allergies: ['Fragrance'], medications: [] } }) });
      const accept = req.headers().accept || '';
      return req.respond({ status: 200, headers: corsHeaders(), body: accept.includes('vnd.pgrst.object') ? '{}' : '[]' });
    }
    if (u.pathname === '/api/llm-recommendations') return req.respond({ status: 200, headers: corsHeaders(), body: JSON.stringify({ recommendations: [], providerUsed: 'qa', concernsTotal: 0 }) });
    if (u.pathname === '/api/ask-ayna') return req.respond({ status: 200, headers: corsHeaders(), body: JSON.stringify({ answer: 'QA response.', profileUpdate: {} }) });
    return req.continue();
  });
  return page;
}

async function waitForEcosystem(page) {
  await page.goto(`${BASE}/ecosystem?ecosystemQa=1`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForSelector('.v6-ecosystem-page', { timeout: 15000 });
  await sleep(900);
}

async function snapshotChecks(page, width, theme, pass) {
  const result = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const qa = (s) => [...document.querySelectorAll(s)];
    const visible = (el) => !!el && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden' && el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0;
    const bounds = (el) => el ? (() => { const r = el.getBoundingClientRect(); return { left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height }; })() : null;
    const critical = ['.app-nav','.v6-ecosystem-panel','.v6-eco-copy h1','.v6-eco-product-card','.v6-universe-wrap','.v6-eco-stats','.ayna-ask-launcher'];
    const boxes = Object.fromEntries(critical.map((s) => [s, bounds(q(s))]));
    const offscreen = qa('button,a,input,select,textarea').filter(visible).map((el) => ({ text:(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0,80), rect:bounds(el) })).filter((x) => x.rect.left < -3 || x.rect.right > innerWidth + 3);
    const clipped = critical.map((s) => q(s)).filter(visible).filter((el) => el.scrollWidth > el.clientWidth + 3).map((el) => el.className || el.tagName);
    const styleOf = (s) => { const el=q(s); if(!el) return null; const cs=getComputedStyle(el); return { color:cs.color, background:cs.backgroundColor, borderColor:cs.borderColor, borderWidth:cs.borderWidth, fontSize:cs.fontSize }; };
    return {
      path: location.pathname,
      signedIn: document.documentElement.classList.contains('v6-signed-in'),
      theme: document.documentElement.dataset.v6SiteTheme,
      heading: q('.v6-eco-copy h1')?.textContent?.trim() || '',
      bubbles: qa('.v6-care-bubble').filter(visible).length,
      activeBubbles: qa('.v6-care-bubble.is-active').filter(visible).length,
      hasProduct: visible(q('.v6-eco-product-card:not(.empty)')),
      overflowX: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth,
      offscreen, clipped, boxes,
      styles: {
        nav: styleOf('.app-nav'), heading: styleOf('.v6-eco-copy h1'), bodyCopy: styleOf('.v6-eco-copy > p'),
        productName: styleOf('.v6-eco-product-name'), productMeta: styleOf('.v6-eco-product-copy small'),
        bubble: styleOf('.v6-care-bubble'), activeBubble: styleOf('.v6-care-bubble.is-active'), stats: styleOf('.v6-eco-stats small'), ask: styleOf('.ayna-ask-launcher')
      }
    };
  });

  const state = `${pass}/${theme}/${width}`;
  const fail = (message) => failures.push(`${state}: ${message}`);
  if (result.path !== '/ecosystem') fail(`route changed to ${result.path}`);
  if (!result.signedIn) fail('signed-in class missing');
  if (result.theme !== theme) fail(`theme is ${result.theme || 'unset'}`);
  if (!/health universe/i.test(result.heading)) fail('V6 health-universe heading missing');
  if (result.bubbles < 3) fail(`only ${result.bubbles} care bubbles rendered`);
  if (result.activeBubbles !== 1) fail(`${result.activeBubbles} active bubbles rendered`);
  if (!result.hasProduct) fail('selected product card missing');
  if (result.overflowX > 3) fail(`horizontal overflow ${result.overflowX}px`);
  if (result.offscreen.length) fail(`offscreen controls: ${result.offscreen.slice(0,4).map((x) => x.text || 'unnamed').join(', ')}`);
  if (result.clipped.length) fail(`critical clipped nodes: ${result.clipped.join(', ')}`);

  const keyPairs = [['nav','nav'],['heading','heading'],['bodyCopy','bodyCopy'],['productName','productName'],['productMeta','productMeta'],['stats','stats']];
  for (const [key] of keyPairs) {
    const s = result.styles[key];
    if (!s) continue;
    const fg = parseRgb(s.color), bg = parseRgb(s.background);
    if (fg && bg && !(bg[0] === 0 && bg[1] === 0 && bg[2] === 0)) {
      const ratio = contrast(fg,bg);
      if (Number.isFinite(ratio) && ratio < 4.5) observations.push(`${state}: ${key} direct computed pair ${ratio.toFixed(2)}:1 (${s.color} on ${s.background})`);
    }
  }

  const panel = result.boxes['.v6-ecosystem-panel'];
  if (panel && width >= 768 && panel.height < 820) observations.push(`${state}: ecosystem panel is ${Math.round(panel.height)}px tall in a 1000px viewport; verify full-viewport intent`);
  return result;
}

async function interactionChecks(page, width, theme, pass) {
  const state = `${pass}/${theme}/${width}`;
  const fail = (message) => failures.push(`${state}: ${message}`);
  try {
    const before = await page.$eval('.v6-eco-product-name', (el) => el.textContent.trim()).catch(() => '');
    const bubbles = await page.$$('.v6-care-bubble:not(.add)');
    if (bubbles.length > 1) {
      await bubbles[1].click(); await sleep(120);
      const active = await page.$$('.v6-care-bubble.is-active');
      if (active.length !== 1) fail('care bubble selection did not settle to one active bubble');
    }
    const why = await page.$('.v6-why-link');
    if (why) {
      await why.click(); await sleep(80);
      if (!(await page.$('.v6-eco-why'))) fail('why-this panel did not open');
      await why.click().catch(() => {});
    } else fail('why-this control missing');

    const ask = await page.$('.ayna-ask-launcher');
    if (!ask) fail('Ask Ayna launcher missing');
    else {
      await ask.click(); await sleep(100);
      if (!(await page.$('.ayna-ask-panel'))) fail('Ask Ayna panel did not open');
      const suggestions = await page.$$('.v6-ask-suggestion-bubble');
      if (suggestions.length < 2) fail(`Ask Ayna quick suggestions missing (${suggestions.length})`);
      await page.click('.ayna-ask-panel__close').catch(() => {});
    }

    const next = await page.$('.v6-eco-arrow[aria-label="Next product"]');
    if (next && !(await next.evaluate((el) => el.disabled))) {
      const first = await page.$eval('.v6-eco-count', (el) => el.textContent.trim()).catch(() => '');
      await next.click(); await sleep(80);
      const second = await page.$eval('.v6-eco-count', (el) => el.textContent.trim()).catch(() => '');
      if (first === second) fail('product carousel next arrow did not advance count');
    }
    const after = await page.$eval('.v6-eco-product-name', (el) => el.textContent.trim()).catch(() => '');
    if (!before || !after) fail('product name disappeared during interactions');
  } catch (error) {
    fail(`interaction exception: ${error?.message || error}`);
  }
}

async function runState(pass, width, theme) {
  const page = await makePage(width, theme);
  try {
    await waitForEcosystem(page);
    await page.addStyleTag({ content: '*,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}' }).catch(() => {});
    const result = await snapshotChecks(page, width, theme, pass);
    if (pass === 'interaction' || pass === 'regression') await interactionChecks(page, width, theme, pass);
    await page.screenshot({ path: path.join(OUT, `${pass}-${theme}-${width}.png`), fullPage: false, captureBeyondViewport: false, timeout: 20000 });
    return result;
  } finally {
    await page.close().catch(() => {});
  }
}

const results = [];
try {
  for (const pass of passes) {
    for (const width of widths) {
      for (const theme of themes) results.push({ pass, width, theme, result: await runState(pass,width,theme) });
    }
  }
  const report = { base: BASE, projectRef, generatedAt: new Date().toISOString(), statesChecked: results.length, failures, observations, results };
  await fs.writeFile(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  const md = [
    '# Signed-in Ecosystem five-pass QA', '',
    `Preview: ${BASE}`, `States checked: ${results.length} (5 passes × 3 widths × 2 themes)`,
    `Failures: ${failures.length}`, `Observations: ${observations.length}`, '',
    '## Failures', ...(failures.length ? failures.map((x) => `- ${x}`) : ['- none']), '',
    '## Observations', ...(observations.length ? observations.map((x) => `- ${x}`) : ['- none']), '',
    '## Passes', ...passes.map((p) => `- ${p}: 375 / 768 / 1440, light + dark`),
  ].join('\n');
  await fs.writeFile(path.join(OUT, 'report.md'), md);
  console.log(`Signed-in ecosystem QA checked ${results.length} states. Failures: ${failures.length}. Observations: ${observations.length}.`);
  if (failures.length) process.exitCode = 1;
} finally {
  await browser.close();
}
