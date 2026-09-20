import fs from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer';

const BASE = process.env.AYNA_AFTER_URL || 'http://127.0.0.1:4173';
const OUT = process.env.AYNA_QA_OUT || 'artifacts/v6-signedout-interactions';
const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const results = [];

await fs.mkdir(OUT, { recursive: true });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const browser = await puppeteer.launch({
  headless: true,
  executablePath: CHROME,
  protocolTimeout: 120000,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
});

async function pageFor(width = 1440) {
  const page = await browser.newPage();
  page.setDefaultTimeout(12000);
  page.setDefaultNavigationTimeout(45000);
  await page.setViewport({ width, height: 1000, deviceScaleFactor: 1 });
  return page;
}

async function goto(page, pathname) {
  await page.goto(`${BASE}${pathname}${pathname.includes('?') ? '&' : '?'}qa=${Date.now()}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.classList.contains('v6-signed-out'), { timeout: 12000 });
  await sleep(350);
}

async function visible(page, selector) {
  return page.$eval(selector, (el) => {
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
  }).catch(() => false);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function findVisibleTextHandle(page, pattern) {
  const handles = await page.$$('button,a');
  for (const handle of handles) {
    const match = await page.evaluate((el, source) => {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const value = (el.textContent || '').replace(/\s+/g, ' ').trim();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0 && new RegExp(source, 'i').test(value);
    }, handle, pattern.source);
    if (match) return handle;
  }
  return null;
}

async function closeAuth(page) {
  const close = await page.$('.v6-auth-overlay button[aria-label="Skip for now"], .v6-auth-overlay button[aria-label="Close"]');
  if (close) await close.click();
  await sleep(120);
}

async function testDesktopBrowse() {
  const page = await pageFor(1440);
  try {
    // Exercise the real SPA path a visitor uses. Direct /browse was never an
    // app route, so it could only test the harness rather than first-click nav.
    await goto(page, '/');
    const browse = await findVisibleTextHandle(page, /^Browse$/i);
    assert(Boolean(browse), 'Could not find visible Browse navigation control on Home');
    await browse.click();
    await page.waitForSelector('.ayna-browse');
    results.push('Browse opens from Home on the first physical click');

    await page.waitForSelector('.v6-browse-needs-trigger');
    await page.click('.v6-browse-needs-trigger');
    await sleep(100);
    assert(await page.$eval('.ayna-browse__categories', (el) => el.classList.contains('is-open')), 'Browse by Need did not open on first click');
    results.push('browse by need opens on first click');

    await page.click('.ayna-browse__filter-button');
    await sleep(120);
    assert(!(await page.$eval('.ayna-browse__categories', (el) => el.classList.contains('is-open'))), 'Browse by Need stayed open when Filters opened');
    assert(await visible(page, '.ayna-browse__filters'), 'Filters did not open on first click');
    results.push('filters open on first click and close browse-by-need');

    await page.click('.v6-browse-needs-trigger');
    await sleep(140);
    assert(!(await visible(page, '.ayna-browse__filters')), 'Filters stayed open when Browse by Need reopened');
    assert(await page.$eval('.ayna-browse__categories', (el) => el.classList.contains('is-open')), 'Browse by Need did not reopen after Filters');
    results.push('browse panels are mutually exclusive');

    await page.click('.v6-browse-needs-trigger');
    await page.click('.ayna-browse__personalized-toggle');
    await page.waitForSelector('.v6-auth-overlay');
    const checked = await page.$eval('.ayna-browse__personalized-toggle input[type="checkbox"]', (el) => el.checked);
    assert(!checked, 'Signed-out Personalized toggle entered a checked/fake personalized state');
    results.push('signed-out personalized click opens auth and stays off');
    await closeAuth(page);

    const ecosystem = await findVisibleTextHandle(page, /^My Ecosystem$/i);
    assert(Boolean(ecosystem), 'Could not find visible My Ecosystem nav control');
    const pathBefore = await page.evaluate(() => location.pathname);
    await ecosystem.click();
    await page.waitForSelector('.v6-auth-overlay');
    const pathAfter = await page.evaluate(() => location.pathname);
    assert(pathAfter === pathBefore, `Signed-out My Ecosystem navigated away instead of opening auth (${pathBefore} -> ${pathAfter})`);
    results.push('signed-out My Ecosystem opens auth instead of fake navigation');

    await page.screenshot({ path: path.join(OUT, 'desktop-browse-after-interactions.png'), fullPage: false });
  } finally {
    await page.close();
  }
}

async function testAskAyna(width) {
  const page = await pageFor(width);
  try {
    await goto(page, '/');
    await page.waitForSelector('.v6-ask-locked-fallback');
    assert(await visible(page, '.v6-ask-locked-fallback'), `Ask ayna fallback not visible at ${width}px`);
    await page.click('.v6-ask-locked-fallback');

    // Give the real React auth action a moment, then capture state before the
    // hard assertion. This does not weaken the test; it makes a mobile failure
    // actionable instead of another opaque selector timeout.
    await sleep(1400);
    const debug = await page.evaluate(() => ({
      path: location.pathname,
      authOverlay: Boolean(document.querySelector('.v6-auth-overlay')),
      mobileDrawer: Boolean(document.querySelector('.mobile-nav-drawer')),
      accountMenu: Boolean(document.querySelector('.nav-account-menu')),
      accountExpanded: document.querySelector('.app-nav__circle--account')?.getAttribute('aria-expanded') || null,
      visibleLoginTexts: [...document.querySelectorAll('button,a')].filter((el) => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden' && /^(sign in|log in)$/i.test((el.textContent || '').trim());
      }).map((el) => (el.textContent || '').trim()),
    }));
    await fs.writeFile(path.join(OUT, `ask-debug-${width}.json`), JSON.stringify(debug, null, 2));
    assert(debug.authOverlay, `Ask ayna did not open auth at ${width}px; debug=${JSON.stringify(debug)}`);

    results.push(`signed-out Ask ayna opens auth on first click at ${width}px`);
    await page.screenshot({ path: path.join(OUT, `ask-auth-${width}.png`), fullPage: false });
  } finally {
    await page.close();
  }
}

try {
  await testDesktopBrowse();
  await testAskAyna(1440);
  await testAskAyna(375);
  await fs.writeFile(path.join(OUT, 'results.json'), JSON.stringify({ passed: results.length, results }, null, 2));
  console.log(`Signed-out interaction QA passed ${results.length} assertions.`);
} finally {
  await browser.close();
}
