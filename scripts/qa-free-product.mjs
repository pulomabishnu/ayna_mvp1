/* global process, console */
/**
 * Screenshots every state of the free product campaign against a local build,
 * with /api/campaign and Supabase auth mocked (same approach as
 * qa-v6-signedin-ecosystem.mjs). Also checks for horizontal overflow and
 * drives the real spin -> confirm -> claim -> address flow by clicking.
 *
 *   VITE_SUPABASE_URL=https://qaproject.supabase.co VITE_SUPABASE_ANON_KEY=<fake> npx vite build --outDir /tmp/qa-dist
 *   npx vite preview --outDir /tmp/qa-dist --port 4173 &
 *   CHROME_PATH=... AYNA_URL=http://127.0.0.1:4173 node scripts/qa-free-product.mjs
 */
import fs from 'node:fs/promises';
import puppeteer from 'puppeteer';

const BASE = process.env.AYNA_URL || 'http://127.0.0.1:4173';
const OUT = process.env.AYNA_QA_OUT || 'artifacts/free-product-qa';
const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const USER_ID = '11111111-2222-4333-8444-555555555555';
const REF = 'qaproject';
const now = new Date().toISOString();
const far = 4102444800;
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const problems = [];

function session({ verified = true } = {}) {
  const user = {
    id: USER_ID, aud: 'authenticated', role: 'authenticated', email: 'maya@example.com',
    email_confirmed_at: verified ? now : null, confirmed_at: verified ? now : null, created_at: '2026-08-01T00:00:00Z', updated_at: now,
    app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: { first_name: 'Maya' }, identities: [], is_anonymous: false,
  };
  return { access_token: `${b64({ alg: 'HS256' })}.${b64({ sub: USER_ID, exp: far, role: 'authenticated' })}.qa`, refresh_token: 'r', token_type: 'bearer', expires_in: far, expires_at: far, user };
}

const P = {
  lola: { id: 'p-lola-tampon', name: 'LOLA Organic Tampons', brand: 'LOLA', category: 'tampon', image: null, summary: '100% organic cotton with a compact BPA-free applicator.' },
  cora: { id: 'p-cora-organic-pads', name: 'Cora Organic Pads', brand: 'Cora', category: 'pad', image: null, summary: '100% organic cotton pads. Plastic-free packaging.' },
};
const ANS = {
  like: { response: 'The match scores helped me pick a pad for sensitive skin, and seeing why each one fit made me trust the recommendation more than reviews.', chars: 136 },
  friction: { response: 'Finding saved products again took a while because the Ecosystem and Saved pages look alike and I kept opening the wrong one first.', chars: 133 },
  change: { response: 'I would add reminders when something I use is running low, so the routine section can nudge me before I run out of pads again.', chars: 128 },
};

function status(over = {}) {
  return {
    campaign: { id: 'free-product-2026', open: true, endsAt: null, minChars: 120, friendsRequired: 3 },
    verified: true, feedbackDone: [], answers: {}, friendsJoined: 0, friendsVerified: 0, friendsRequired: 3, friends: [],
    referralLink: 'https://www.aynahealth.co/join?ref=k7m2p9qa', eligible: false, inventoryAvailable: true, claim: null, ...over,
  };
}
const eligible = () => status({
  feedbackDone: ['change', 'friction', 'like'], answers: ANS, friendsJoined: 4, friendsVerified: 3,
  friends: [
    { label: 'Friend 1', status: 'verified', joinedAt: '2026-10-16' }, { label: 'Friend 2', status: 'verified', joinedAt: '2026-10-17' },
    { label: 'Friend 3', status: 'verified', joinedAt: '2026-10-18' }, { label: 'Friend 4', status: 'joined', joinedAt: '2026-10-19' },
  ],
  eligible: true,
});
const claim = (st, ship) => ({
  id: 'c1', claimedAt: '2026-10-20T15:00:00Z', status: st, product: P.lola,
  shipping: ship ? { fullName: 'Maya Chen', line1: '120 Elm St', line2: 'Apt 4B', city: 'Ithaca', state: 'NY', postal: '14850', email: 'maya@example.com' } : null,
});

const browser = await puppeteer.launch({ headless: true, executablePath: CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] });
await fs.mkdir(OUT, { recursive: true });

async function open(path, { width = 1440, theme = 'light', signedIn = true, verified = true, get, post = {}, motion = 'reduce', hang = false, admin } = {}) {
  const ctx = await browser.createBrowserContext(); // fresh storage per page
  const page = await ctx.newPage();
  page.close = async () => ctx.close();
  await page.setViewport({ width, height: width < 600 ? 860 : 1000, deviceScaleFactor: width < 600 ? 2 : 1 });
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: theme }, { name: 'prefers-reduced-motion', value: motion }]);
  const s = session({ verified });
  await page.evaluateOnNewDocument((k, s, signedIn, theme) => {
    if (signedIn) localStorage.setItem(k, JSON.stringify(s));
    localStorage.setItem('ayna_v6_site_theme', theme);
    localStorage.setItem('ayna_mobile_theme_v1', theme);
    localStorage.setItem('ayna_analytics_consent', 'denied');
  }, `sb-${REF}-auth-token`, s, signedIn, theme);
  await page.setRequestInterception(true);
  const posts = [];
  page.on('request', (req) => {
    const u = new URL(req.url());
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' };
    if (u.hostname.endsWith('.supabase.co')) {
      if (req.method() === 'OPTIONS') return req.respond({ status: 204, headers: cors });
      if (u.pathname.includes('/auth/v1/user')) return req.respond({ status: 200, headers: cors, body: JSON.stringify(s.user) });
      if (u.pathname.includes('/auth/v1/token')) return req.respond({ status: 200, headers: cors, body: JSON.stringify(s) });
      return req.respond({ status: 200, headers: cors, body: (req.headers().accept || '').includes('pgrst.object') ? '{}' : '[]' });
    }
    if (u.pathname === '/api/campaign') {
      if (hang) return undefined; // never answers: loading state
      if (req.method() === 'GET') {
        const g = typeof get === 'function' ? get(posts) : get;
        return req.respond({ status: g?.code || 200, headers: cors, body: JSON.stringify(g?.body || g) });
      }
      const body = JSON.parse(req.postData() || '{}');
      posts.push(body);
      const h = post[body.action];
      const r = typeof h === 'function' ? h(body, posts) : h || { code: 500, body: { error: 'server_error' } };
      return req.respond({ status: r.code || 200, headers: cors, body: JSON.stringify(r.body || r) });
    }
    if (u.pathname === '/api/campaign-admin') return req.respond({ status: 200, headers: cors, body: JSON.stringify(admin) });
    if (u.pathname.startsWith('/api/') || u.pathname.startsWith('/ingest')) return req.respond({ status: 200, headers: cors, body: '{}' });
    if (!['127.0.0.1', 'localhost'].includes(u.hostname) && !u.hostname.endsWith('fonts.googleapis.com') && !u.hostname.endsWith('fonts.gstatic.com')) return req.abort();
    return req.continue();
  });
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle2', timeout: 45000 }).catch(() => {});
  await sleep(700);
  return page;
}

async function shot(page, name, { full = true } = {}) {
  const overflow = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth);
  if (overflow > 2) problems.push(`${name}: horizontal overflow ${overflow}px`);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });
  console.log(`  ${name}${overflow > 2 ? `  (overflow ${overflow}px)` : ''}`);
}

const spinOk = (n) => ({ body: { status: 'ok', spinId: 100 + n, spinCount: n, rewardId: '22222222-2222-4222-8222-222222222222', product: n % 2 ? P.lola : P.cora } });

for (const [w, tag] of [[1440, 'desktop'], [390, 'mobile']]) {
  console.log(`── ${tag}`);
  let p;
  p = await open('/free-product', { width: w, signedIn: false }); await shot(p, `${tag}-01-signed-out`); await p.close();
  p = await open('/free-product', { width: w, hang: true }); await shot(p, `${tag}-02-loading`, { full: false }); await p.close();
  p = await open('/free-product', { width: w, verified: false, get: status({ verified: false }) }); await shot(p, `${tag}-03-unverified`); await p.close();

  // partial progress, then type a too-short answer to show the counter + validation
  p = await open('/free-product', { width: w, get: status({
    feedbackDone: ['like'], answers: { like: ANS.like }, friendsJoined: 2, friendsVerified: 1,
    friends: [{ label: 'Friend 1', status: 'verified', joinedAt: '2026-10-16' }, { label: 'Friend 2', status: 'joined', joinedAt: '2026-10-17' }],
  }) });
  await p.type('#fp-q-friction', 'The Ecosystem and Saved pages look alike so I keep opening the wrong one first.');
  await p.click('#fp-q-friction ~ .ayfp-q__foot button');
  await sleep(300);
  await shot(p, `${tag}-04-in-progress-validation`);
  await p.close();

  p = await open('/free-product', { width: w, get: eligible() }); await shot(p, `${tag}-05-eligible`); await p.close();
  p = await open('/free-product', { width: w, get: { ...eligible(), inventoryAvailable: false } }); await shot(p, `${tag}-06-eligible-no-inventory`, { full: false });
  await p.click('.ayfp-main-cta'); await sleep(400); await shot(p, `${tag}-07-reward-empty-shelf`, { full: false }); await p.close();

  // reward flow, clicking through the real UI
  let spins = 0;
  let claimedNow = null;
  p = await open('/free-product', { width: w, get: () => (claimedNow ? status({ claim: claimedNow }) : eligible()), post: {
    spin: () => spinOk(++spins),
    claim: (b, posts) => (posts.filter((x) => x.action === 'claim').length === 1
      ? { code: 409, body: { status: 'out_of_stock' } }
      : (claimedNow = { ...claim('needs_address'), product: spins % 2 ? P.lola : P.cora }, { body: { status: 'claimed', spinsBeforeClaim: spins, productId: claimedNow.product.id, claim: claimedNow } })),
  } });
  await p.click('.ayfp-main-cta'); await sleep(500);
  await shot(p, `${tag}-08-reward-intro`, { full: false });
  await p.click('.ayfp-spin-btn'); await sleep(900);
  await shot(p, `${tag}-09-spin-result`);
  await p.click('.ayfp-result__actions .wyou-btn'); await sleep(400);
  await shot(p, `${tag}-10-confirm-dialog`, { full: false });
  const focused = await p.evaluate(() => document.activeElement?.textContent);
  if (focused !== 'yes, claim it') problems.push(`${tag}: confirm dialog focus is on "${focused}"`);
  await p.click('.ay-newacct__primary'); await sleep(700);
  await shot(p, `${tag}-11-sold-out-before-claim`, { full: false });
  await p.click('.ayfp-spin-btn'); await sleep(900);
  await p.click('.ayfp-result__actions .wyou-btn'); await sleep(300);
  await p.click('.ay-newacct__primary'); await sleep(1200);
  await shot(p, `${tag}-12-claimed-add-address`);
  await p.click('.ayfp-ship button[type=submit]'); await sleep(300);
  await shot(p, `${tag}-13-address-validation`);
  await p.close();

  // mid-shuffle, with motion on
  p = await open('/free-product', { width: w, motion: 'no-preference', get: eligible(), post: { spin: async () => spinOk(1) } });
  await p.click('.ayfp-main-cta'); await sleep(500); await p.click('.ayfp-spin-btn'); await sleep(450);
  await shot(p, `${tag}-14-spinning-motion`, { full: false }); await p.close();

  p = await open('/free-product', { width: w, get: status({ claim: claim('ready_to_ship', true) }) }); await shot(p, `${tag}-15-claimed-revisit`); await p.close();
  p = await open('/free-product', { width: w, get: status({ campaign: { id: 'free-product-2026', open: false, minChars: 120, friendsRequired: 3 } }) }); await shot(p, `${tag}-16-campaign-ended`, { full: false }); await p.close();
  p = await open('/free-product', { width: w, get: { code: 500, body: { error: 'server_error' } } }); await shot(p, `${tag}-17-server-error`, { full: false }); await p.close();
  p = await open('/join?ref=k7m2p9qa', { width: w, signedIn: false });
  const pending = await p.evaluate(() => localStorage.getItem('ayna_pending_ref_v1'));
  if (!pending?.includes('k7m2p9qa')) problems.push(`${tag}: /join did not store the invite code`);
  await shot(p, `${tag}-18-join`); await p.close();
  p = await open('/you', { width: w, get: { ...eligible(), eligible: false, friendsVerified: 2, feedbackDone: ['like', 'change'] } });
  await p.waitForSelector('.ayfp-you', { timeout: 8000 }).catch(() => problems.push(`${tag}: /you card missing`));
  await p.evaluate(() => document.querySelector('.ayfp-you')?.scrollIntoView({ block: 'center' }));
  await shot(p, `${tag}-19-you-card`, { full: false }); await p.close();

  p = await open('/free-product', { width: w, theme: 'dark', get: eligible() }); await shot(p, `${tag}-20-dark-eligible`); await p.close();
}

console.log('── admin');
const admin = {
  campaign: { is_active: true, starts_at: '2026-10-16T14:00:00Z' },
  totals: { people: 42, verified: 39, feedbackComplete: 28, verifiedReferrals: 61, eligibleUnclaimed: 4, claims: 11, avgSpinsBeforeClaim: 2.7 },
  inventory: [
    { rewardId: 'r1', productId: P.lola.id, name: P.lola.name, brand: 'LOLA', total: 10, claimed: 6, remaining: 4, active: true, shown: 31, kept: 6, sold_out: 0 },
    { rewardId: 'r2', productId: P.cora.id, name: P.cora.name, brand: 'Cora', total: 5, claimed: 5, remaining: 0, active: true, shown: 22, kept: 5, sold_out: 1 },
  ],
  people: [
    { user_id: 'u1', email: 'maya@example.com', account_verified: true, feedback_like: ANS.like.response, feedback_friction: ANS.friction.response, feedback_change: ANS.change.response, referrals_verified: 5, referrals_joined: 6, eligible_now: false, spins: 3, claimed_product_name: P.lola.name, claimed_at: '2026-10-20T15:00:00Z', fulfillment_status: 'ready_to_ship', claim_id: 'c1', shipping: { full_name: 'Maya Chen', address_line1: '120 Elm St', address_line2: 'Apt 4B', city: 'Ithaca', state: 'NY', postal_code: '14850', email: 'maya@example.com' } },
    { user_id: 'u2', email: 'jo@example.com', account_verified: true, feedback_like: 'x', feedback_friction: null, feedback_change: null, referrals_verified: 1, referrals_joined: 3, eligible_now: false, spins: 0 },
  ],
};
let ap = await open('/admin/campaign', { admin });
await ap.click('.ayfp-table .ayfp-link'); await sleep(200);
await shot(ap, 'desktop-21-admin');
await ap.close();

await browser.close();
console.log(problems.length ? `\nProblems:\n- ${problems.join('\n- ')}` : '\nNo overflow / focus / storage problems found.');
process.exit(problems.length ? 1 : 0);
