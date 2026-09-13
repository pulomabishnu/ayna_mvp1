import fs from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer';

const AFTER = process.env.AYNA_AFTER_URL || 'http://127.0.0.1:4173';
const BEFORE = process.env.AYNA_BEFORE_URL || 'http://127.0.0.1:4174';
const OUT = process.env.AYNA_AUDIT_OUT || 'artifacts/v6-local-audit';
const widths = [375, 768, 1440];
const themes = ['light', 'dark'];
const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';

await fs.mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  executablePath: chrome,
  protocolTimeout: 120_000,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor(url) {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    await sleep(1000);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function newPage(width, theme) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 1000, deviceScaleFactor: 1 });
  await page.emulateMediaFeatures([
    { name: 'prefers-color-scheme', value: theme },
    { name: 'prefers-reduced-motion', value: 'no-preference' },
  ]);
  page.setDefaultNavigationTimeout(45_000);
  page.setDefaultTimeout(12_000);
  return page;
}

async function forceTheme(page, theme) {
  await page.evaluate((value) => {
    try { localStorage.setItem('ayna_v6_site_theme', value); } catch {}
    document.documentElement.dataset.v6SiteTheme = value;
    document.documentElement.dataset.v6SiteThemeMode = value;
    document.documentElement.style.colorScheme = value;
    const quiz = document.querySelector('.ayna-intake-root');
    if (quiz) {
      quiz.classList.toggle('v6-quiz-dark', value === 'dark');
      quiz.classList.toggle('v6-quiz-light', value === 'light');
    }
    document.querySelectorAll('.v6-camcorder-hud').forEach((node) => node.remove());
  }, theme);
}

async function goto(page, url, theme) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await sleep(900);
  await forceTheme(page, theme);
  await page.addStyleTag({ content: `
    *, *::before, *::after { transition-duration: .001ms !important; }
  `}).catch(() => {});
  await sleep(120);
}

async function captureViewport(page, file) {
  await page.screenshot({ path: path.join(OUT, file), fullPage: false, captureBeyondViewport: false });
}

async function captureHomeDiagnostics(page, width, theme) {
  const data = await page.evaluate(() => {
    const describe = (el) => {
      if (!el) return null;
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        tagName: el.tagName,
        className: el.className,
        type: el.getAttribute?.('type'),
        outerHTML: el.outerHTML?.slice(0, 1200),
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        style: {
          appearance: style.appearance,
          background: style.background,
          backgroundColor: style.backgroundColor,
          border: style.border,
          borderTopWidth: style.borderTopWidth,
          borderRadius: style.borderRadius,
          boxShadow: style.boxShadow,
          outline: style.outline,
          padding: style.padding,
          minHeight: style.minHeight,
          height: style.height,
        },
      };
    };
    const form = document.querySelector('.v6-home-search');
    const input = form?.querySelector('input') || null;
    return {
      htmlTheme: document.documentElement.dataset.v6SiteTheme || '',
      form: describe(form),
      input: describe(input),
      inputParent: describe(input?.parentElement || null),
    };
  });
  await fs.writeFile(path.join(OUT, `after-home-diagnostics-${theme}-${width}.json`), JSON.stringify(data, null, 2));
}

async function moveBranchQuizToSupport(page) {
  const name = await page.$('.v6-name-step__input');
  if (name) {
    await name.type('Ameera');
    await page.click('.v6-name-step__button');
    await sleep(200);
  }

  for (let i = 0; i < 10; i += 1) {
    const heading = await page.$eval('.ayna-intake-question > h1', (el) => (el.textContent || '').trim()).catch(() => '');
    if (/which options best describe you right now/i.test(heading) && await page.$('.ayna-search-wrap')) return true;

    if (/how old are you/i.test(heading)) {
      const range = await page.$('input[type="range"]');
      if (range) {
        await page.evaluate((el) => {
          const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
          if (setter) setter.call(el, '24'); else el.value = '24';
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }, range);
      }
    } else if (/which options best describe you right now/i.test(heading)) {
      const choice = await page.$('.ayna-choice-card, .ayna-row-choice');
      if (choice) await choice.click();
    } else if (/zip/i.test(heading)) {
      const input = await page.$('input');
      if (input) await input.type('10001');
    }

    const next = await page.$('.ayna-continue:not([disabled])');
    if (next) await next.click();
    else {
      const skip = await page.$('.ayna-skip');
      if (skip) await skip.click();
      else break;
    }
    await sleep(220);
  }
  return false;
}

async function clickFirstVisible(page, selectors) {
  for (const selector of selectors) {
    const handle = await page.$(selector);
    if (!handle) continue;
    const visible = await page.evaluate((el) => {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    }, handle);
    if (visible) {
      await handle.click();
      return true;
    }
  }
  return false;
}

async function moveBranchQuizToDiagnosis(page) {
  for (let i = 0; i < 8; i += 1) {
    const heading = await page.$eval('.ayna-intake-question > h1', (el) => (el.textContent || '').trim()).catch(() => '');

    if (/diagnosed with any of the following/i.test(heading)) {
      const data = await page.evaluate(() => ({
        heading: document.querySelector('.ayna-intake-question > h1')?.textContent?.trim() || '',
        choices: [...document.querySelectorAll('.ayna-intake-question .ayna-list-panel .ayna-row-choice')]
          .filter((node) => {
            const style = getComputedStyle(node);
            const rect = node.getBoundingClientRect();
            return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
          })
          .map((node) => node.textContent?.replace(/\s+/g, ' ').trim() || ''),
        staleSupportShells: document.querySelectorAll('.ayna-intake-question .v6-support-suggestion-shell').length,
        supportOnlyClass: document.querySelector('.ayna-intake-question')?.classList.contains('v6-support-search-only') || false,
      }));
      if (data.choices.length < 5) throw new Error(`Diagnosis regression: expected visible condition choices, got ${data.choices.length}`);
      if (!data.choices.some((choice) => /None that I know of/i.test(choice))) throw new Error('Diagnosis regression: missing “None that I know of”');
      if (!data.choices.some((choice) => /Prefer not to say/i.test(choice))) throw new Error('Diagnosis regression: missing “Prefer not to say”');
      if (data.staleSupportShells !== 0 || data.supportOnlyClass) throw new Error('Diagnosis regression: stale support-search enhancement leaked into diagnosis step');
      return data;
    }

    if (/which options best describe you right now/i.test(heading)) {
      await clickFirstVisible(page, ['.v6-support-bubble', '.v6-master-suggestion-bubble', '.ayna-row-choice']);
    } else if (/period flow/i.test(heading)) {
      await clickFirstVisible(page, ['.ayna-scale button', '.ayna-seg-option', '.ayna-row-choice']);
    } else if (/period pain/i.test(heading)) {
      await clickFirstVisible(page, ['.ayna-scale button', '.ayna-seg-option', '.ayna-row-choice']);
    } else {
      const skip = await page.$('.ayna-skip');
      if (skip) await skip.click();
    }

    await sleep(120);
    const next = await page.$('.ayna-continue:not([disabled])');
    if (next) await next.click();
    else {
      const skip = await page.$('.ayna-skip');
      if (skip) await skip.click();
      else throw new Error(`Could not advance intake from “${heading}”`);
    }
    await sleep(240);
  }
  throw new Error('Diagnosis regression: did not reach diagnosis question');
}

async function capture(label, base, width, theme, isAfter) {
  const page = await newPage(width, theme);
  try {
    await goto(page, `${base}/?qa=${Date.now()}`, theme);
    if (isAfter) await captureHomeDiagnostics(page, width, theme);
    await captureViewport(page, `${label}-home-${theme}-${width}.png`);

    const unlock = await page.$('.v6-unlock-card');
    if (unlock) {
      await page.evaluate((el) => el.scrollIntoView({ block: 'center' }), unlock);
      await sleep(100);
    }
    await captureViewport(page, `${label}-signin-banner-${theme}-${width}.png`);

    await goto(page, `${base}/quiz?qa=${Date.now()}`, theme);
    if (isAfter) await moveBranchQuizToSupport(page);
    await forceTheme(page, theme);
    await captureViewport(page, `${label}-quiz-${theme}-${width}.png`);

    if (isAfter) {
      const diagnosis = await moveBranchQuizToDiagnosis(page);
      await forceTheme(page, theme);
      await fs.writeFile(path.join(OUT, `after-diagnosis-${theme}-${width}.json`), JSON.stringify(diagnosis, null, 2));
      await captureViewport(page, `after-diagnosis-${theme}-${width}.png`);
    }
  } finally {
    await page.close();
  }
}

try {
  await waitFor(AFTER);
  await waitFor(BEFORE);
  for (const width of widths) {
    for (const theme of themes) {
      await capture('before', BEFORE, width, theme, false);
      await capture('after', AFTER, width, theme, true);
    }
  }

  const files = await fs.readdir(OUT);
  const pngs = files.filter((name) => name.endsWith('.png'));
  await fs.writeFile(path.join(OUT, 'README.txt'), [
    `Before local build: ${BEFORE}`,
    `After local build: ${AFTER}`,
    `PNG count: ${pngs.length}`,
    'Pages/states: home, signed-out unlock state, support-step quiz, diagnosis-step regression check',
    'Widths: 375, 768, 1440',
    'Themes: light, dark',
    'Home diagnostics: computed form/input styles for the redesign build.',
    'Diagnosis diagnostics: visible required choices plus stale-support-enhancement assertions.',
    'Literal REC/battery/timestamp HUD is removed from the after build by design.',
  ].join('\n'));
  if (pngs.length !== 42) throw new Error(`Expected 42 screenshots, got ${pngs.length}`);
  console.log(`Captured ${pngs.length} real local-build screenshots and verified the diagnosis step.`);
} finally {
  await browser.close();
}
