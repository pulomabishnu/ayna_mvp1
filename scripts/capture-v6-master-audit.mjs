import fs from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer';

const AFTER = process.env.AYNA_AFTER_URL || 'https://aynamvp1-git-ameera-v6-real-b9ae33-pulomabishnu-4744s-projects.vercel.app';
const BEFORE = process.env.AYNA_BEFORE_URL || 'https://aynamvp1.vercel.app';
const OUT = process.env.AYNA_AUDIT_OUT || 'artifacts/v6-master-audit';
const widths = [375, 768, 1440];
const themes = ['light', 'dark'];
const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';

await fs.mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  executablePath: chrome,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

async function waitForSite(url) {
  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${url}/?audit=${Date.now()}`, { redirect: 'follow' });
      if (res.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 5_000));
  }
  throw new Error(`Timed out waiting for ${url}`);
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

async function goto(page, url) {
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 120_000 });
  await new Promise((resolve) => setTimeout(resolve, 800));
}

async function reachSupportStep(page, baseUrl) {
  await goto(page, `${baseUrl}/quiz?visualAudit=1`);
  const nameInput = await page.$('.v6-name-step__input');
  if (nameInput) {
    await nameInput.type('Ameera');
    await page.click('.v6-name-step__button');
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  for (let guard = 0; guard < 8; guard += 1) {
    const heading = await page.$eval('.ayna-intake-question > h1', (el) => el.textContent?.trim() || '').catch(() => '');
    if (/which options best describe you right now/i.test(heading) && await page.$('.ayna-search-wrap')) return;
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
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
}

async function captureSet(label, baseUrl) {
  for (const width of widths) {
    for (const theme of themes) {
      const page = await browser.newPage();
      await page.setViewport({ width, height: 1000, deviceScaleFactor: 1 });
      await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: theme }]);

      await goto(page, `${baseUrl}/?visualAudit=1`);
      await forceTheme(page, theme);
      await page.screenshot({
        path: path.join(OUT, `${label}-home-${theme}-${width}.png`),
        fullPage: true,
      });

      const unlock = await page.$('.v6-unlock-card');
      if (unlock) {
        await unlock.screenshot({ path: path.join(OUT, `${label}-signin-banner-${theme}-${width}.png`) });
      } else {
        await page.screenshot({ path: path.join(OUT, `${label}-signin-banner-${theme}-${width}.png`), fullPage: false });
      }

      await reachSupportStep(page, baseUrl);
      await forceTheme(page, theme);
      await page.screenshot({
        path: path.join(OUT, `${label}-quiz-${theme}-${width}.png`),
        fullPage: true,
      });

      await page.close();
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
    'Captured: home, quiz support step, and signed-out sign-in banner',
    'Widths: 375, 768, 1440',
    'Themes: light, dark',
  ].join('\n'));
} finally {
  await browser.close();
}
