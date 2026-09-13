import fs from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer';

const AFTER = process.env.AYNA_AFTER_URL || 'https://aynamvp1-git-ameera-v6-real-b9ae33-pulomabishnu-4744s-projects.vercel.app';
const BEFORE = process.env.AYNA_BEFORE_URL || 'https://aynamvp1.vercel.app';
const OUT = process.env.AYNA_AUDIT_OUT || 'artifacts/v6-master-audit';
const widths = [375, 768, 1440];
const themes = ['light', 'dark'];
const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const errors = [];

await fs.mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  executablePath: chrome,
  protocolTimeout: 240_000,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
  ],
});

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForSite(url) {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${url}/?audit=${Date.now()}`, { redirect: 'follow' });
      if (res.ok) return;
    } catch {}
    await sleep(3_000);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function preparePage(width, theme) {
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(60_000);
  page.setDefaultTimeout(20_000);
  await page.setViewport({ width, height: 1000, deviceScaleFactor: 1 });
  await page.emulateMediaFeatures([
    { name: 'prefers-color-scheme', value: theme },
    { name: 'prefers-reduced-motion', value: 'reduce' },
  ]);
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    const type = request.resourceType();
    if (type === 'media') request.abort();
    else request.continue();
  });
  return page;
}

async function forceTheme(page, theme) {
  await page.evaluate((nextTheme) => {
    document.documentElement.setAttribute('data-v6-site-theme', nextTheme);
    document.documentElement.style.colorScheme = nextTheme;
    const quiz = document.querySelector('.ayna-intake-root');
    if (quiz) {
      quiz.classList.toggle('v6-quiz-dark', nextTheme === 'dark');
      quiz.classList.toggle('v6-quiz-light', nextTheme === 'light');
    }
  }, theme);
}

async function freezeVisuals(page) {
  await page.addStyleTag({ content: `
    *, *::before, *::after {
      animation-duration: 0.001ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.001ms !important;
      scroll-behavior: auto !important;
    }
  `}).catch(() => {});
}

async function goto(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await sleep(1_000);
  await freezeVisuals(page);
}

async function reachSupportStep(page, baseUrl) {
  await goto(page, `${baseUrl}/quiz?visualAudit=1`);
  const nameInput = await page.$('.v6-name-step__input');
  if (nameInput) {
    await nameInput.type('Ameera', { delay: 10 });
    await page.click('.v6-name-step__button');
    await sleep(250);
  }

  for (let guard = 0; guard < 10; guard += 1) {
    const heading = await page.$eval('.ayna-intake-question > h1', (el) => el.textContent?.trim() || '').catch(() => '');
    const hasSearch = Boolean(await page.$('.ayna-search-wrap'));
    if (/which options best describe you right now/i.test(heading) && hasSearch) return true;

    if (/how old are you/i.test(heading)) {
      const skip = await page.$('.ayna-skip');
      if (skip) await skip.click();
    } else if (/which options best describe you right now/i.test(heading)) {
      const firstChoice = await page.$('.ayna-choice-card');
      if (firstChoice) await firstChoice.click();
      const next = await page.$('.ayna-continue:not([disabled])');
      if (next) await next.click();
      else await page.$eval('.ayna-skip', (el) => el.click()).catch(() => {});
    } else {
      const skip = await page.$('.ayna-skip');
      if (skip) await skip.click();
      else {
        const next = await page.$('.ayna-continue:not([disabled])');
        if (next) await next.click();
        else break;
      }
    }
    await sleep(250);
  }
  return false;
}

async function safeScreenshot(page, file, options = {}) {
  try {
    await page.screenshot({ path: path.join(OUT, file), captureBeyondViewport: false, ...options });
    return true;
  } catch (error) {
    errors.push(`${file}: ${error?.message || error}`);
    return false;
  }
}

async function captureOne(label, baseUrl, width, theme) {
  const page = await preparePage(width, theme);
  try {
    await goto(page, `${baseUrl}/?visualAudit=1`);
    await forceTheme(page, theme);
    await sleep(150);
    await safeScreenshot(page, `${label}-home-${theme}-${width}.png`, { fullPage: false });

    const unlock = await page.$('.v6-unlock-card');
    if (unlock) {
      try {
        await unlock.screenshot({ path: path.join(OUT, `${label}-signin-banner-${theme}-${width}.png`) });
      } catch (error) {
        errors.push(`${label}-signin-banner-${theme}-${width}.png: ${error?.message || error}`);
        await safeScreenshot(page, `${label}-signin-banner-${theme}-${width}.png`, { fullPage: false });
      }
    } else {
      await safeScreenshot(page, `${label}-signin-banner-${theme}-${width}.png`, { fullPage: false });
    }

    const reached = await reachSupportStep(page, baseUrl).catch((error) => {
      errors.push(`${label}-quiz-nav-${theme}-${width}: ${error?.message || error}`);
      return false;
    });
    await forceTheme(page, theme).catch(() => {});
    await sleep(150);
    await safeScreenshot(page, `${label}-quiz-${theme}-${width}.png`, { fullPage: false });
    if (!reached) errors.push(`${label}-quiz-${theme}-${width}: captured quiz fallback because support step was not reachable automatically`);
  } catch (error) {
    errors.push(`${label}-${theme}-${width}: ${error?.message || error}`);
    await safeScreenshot(page, `${label}-error-${theme}-${width}.png`, { fullPage: false });
  } finally {
    await page.close().catch(() => {});
  }
}

async function captureSet(label, baseUrl) {
  for (const width of widths) {
    for (const theme of themes) {
      await captureOne(label, baseUrl, width, theme);
    }
  }
}

try {
  await waitForSite(AFTER);
  await waitForSite(BEFORE);
  await captureSet('before', BEFORE);
  await captureSet('after', AFTER);
  await fs.writeFile(path.join(OUT, 'README.txt'), [
    `Before: ${BEFORE}`,
    `After: ${AFTER}`,
    'Captured: home, quiz, and signed-out sign-in banner',
    'Widths: 375, 768, 1440',
    'Themes: light, dark',
    `Expected PNG count: 36`,
    `Non-fatal notes/errors: ${errors.length}`,
  ].join('\n'));
  if (errors.length) await fs.writeFile(path.join(OUT, 'capture-notes.txt'), errors.join('\n'));

  const files = await fs.readdir(OUT);
  const pngs = files.filter((name) => name.endsWith('.png'));
  console.log(`Captured ${pngs.length} PNG files to ${OUT}`);
  if (pngs.length < 36) throw new Error(`Visual audit incomplete: expected 36 PNG files, got ${pngs.length}`);
} finally {
  await browser.close();
}
