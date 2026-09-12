import './v6Enhancements.css';

const QUIZ_THEME_KEY = 'ayna_v6_quiz_theme';

function cleanText(node) {
  return String(node?.textContent || '').replace(/\s+/g, ' ').trim();
}

function nextFrame(fn) {
  window.requestAnimationFrame(() => window.requestAnimationFrame(fn));
}

function setQuizTheme(root, theme) {
  const next = theme === 'dark' ? 'dark' : 'light';
  root.classList.toggle('v6-quiz-dark', next === 'dark');
  root.classList.toggle('v6-quiz-light', next === 'light');
  try { window.sessionStorage.setItem(QUIZ_THEME_KEY, next); } catch (_) {}

  const toggle = root.querySelector('.v6-quiz-theme-toggle');
  if (toggle) {
    toggle.textContent = next === 'dark' ? '☾' : '☀';
    toggle.setAttribute('aria-label', next === 'dark' ? 'Switch intake to light mode' : 'Switch intake to dark mode');
    toggle.title = next === 'dark' ? 'Dark intake mode' : 'Light intake mode';
  }
}

function quizHasAnswer(question) {
  if (!question) return false;

  if (question.dataset.v6Interacted === '1') return true;
  if (question.querySelector('.ayna-age-value:not(.empty)')) return true;
  if (question.querySelector('.ayna-choice-card.selected, .ayna-row-choice.selected, .ayna-seg-option.selected, .ayna-pill.selected, .ayna-scale button.selected, .ayna-timeline button.selected, .ayna-spectrum-grid button.selected')) return true;
  if (question.querySelector('.ayna-tokens > span, .ayna-product-row')) return true;

  const textControls = question.querySelectorAll('.ayna-text-input, .ayna-textarea');
  for (const control of textControls) {
    if (String(control.value || '').trim()) return true;
  }

  return false;
}

function syncQuizContinue(root) {
  const question = root.querySelector('.ayna-intake-question');
  const button = question?.querySelector('.ayna-continue');
  if (!question || !button) return;

  const required = Boolean(question.querySelector('.ayna-intake-hint'));
  const saving = /saving/i.test(cleanText(button));

  if (required || saving) {
    button.classList.remove('v6-unanswered');
    return;
  }

  const answered = quizHasAnswer(question);
  button.disabled = !answered;
  button.classList.toggle('v6-unanswered', !answered);
  button.setAttribute('aria-disabled', answered ? 'false' : 'true');
}

function syncSupportAccordion(root) {
  const question = root.querySelector('.ayna-intake-question');
  if (!question || !/currently experiencing|looking for support/i.test(cleanText(question.querySelector('h1')))) return;

  const search = question.querySelector('.ayna-search-wrap input');
  const categories = [...question.querySelectorAll('.ayna-category')];
  if (!categories.length) return;

  categories.forEach((category, index) => {
    category.classList.add('v6-support-category');
    const title = category.querySelector('.ayna-category-title');
    if (!title) return;

    title.setAttribute('role', 'button');
    title.setAttribute('tabindex', '0');
    title.setAttribute('aria-expanded', category.classList.contains('is-open') ? 'true' : 'false');

    if (!title.dataset.v6Bound) {
      title.dataset.v6Bound = '1';
      const toggle = () => {
        const willOpen = !category.classList.contains('is-open');
        category.classList.toggle('is-open', willOpen);
        title.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      };
      title.addEventListener('click', toggle);
      title.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggle();
        }
      });
    }

    const hasSelected = Boolean(category.querySelector('.ayna-row-choice.selected'));
    const searching = Boolean(String(search?.value || '').trim());
    if (searching || hasSelected || (index === 0 && !categories.some((item) => item.classList.contains('is-open')))) {
      category.classList.add('is-open');
      title.setAttribute('aria-expanded', 'true');
    }
  });

  if (search && !search.dataset.v6AccordionBound) {
    search.dataset.v6AccordionBound = '1';
    search.addEventListener('input', () => {
      nextFrame(() => {
        const activeSearch = Boolean(String(search.value || '').trim());
        const currentCategories = [...question.querySelectorAll('.ayna-category')];
        currentCategories.forEach((category, index) => {
          const hasSelected = Boolean(category.querySelector('.ayna-row-choice.selected'));
          const open = activeSearch || hasSelected || (!activeSearch && !hasSelected && index === 0);
          category.classList.toggle('is-open', open);
          category.querySelector('.ayna-category-title')?.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
      });
    });
  }
}

function enhanceQuiz() {
  const root = document.querySelector('.ayna-intake-root');
  if (!root) return;

  const top = root.querySelector('.ayna-intake-top');
  if (top && !top.querySelector('.v6-quiz-theme-toggle')) {
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'v6-quiz-theme-toggle';
    toggle.addEventListener('click', () => {
      setQuizTheme(root, root.classList.contains('v6-quiz-dark') ? 'light' : 'dark');
    });
    top.appendChild(toggle);
  }

  let savedTheme = 'light';
  try { savedTheme = window.sessionStorage.getItem(QUIZ_THEME_KEY) || 'light'; } catch (_) {}
  setQuizTheme(root, savedTheme);

  const question = root.querySelector('.ayna-intake-question');
  if (question) {
    const heading = cleanText(question.querySelector('h1'));
    if (question.dataset.v6Heading !== heading) {
      question.dataset.v6Heading = heading;
      delete question.dataset.v6Interacted;
    }

    if (!question.dataset.v6InteractionBound) {
      question.dataset.v6InteractionBound = '1';
      question.addEventListener('click', (event) => {
        if (event.target.closest('.ayna-trust-list')) question.dataset.v6Interacted = '1';
        nextFrame(() => syncQuizContinue(root));
      });
      question.addEventListener('input', () => nextFrame(() => syncQuizContinue(root)));
      question.addEventListener('change', () => nextFrame(() => syncQuizContinue(root)));
      question.addEventListener('dragend', (event) => {
        if (event.target.closest('.ayna-trust-list')) question.dataset.v6Interacted = '1';
        nextFrame(() => syncQuizContinue(root));
      });
    }
  }

  syncSupportAccordion(root);
  syncQuizContinue(root);
}

function enhanceBrowse() {
  const browse = document.querySelector('.ayna-browse');
  if (!browse) return;

  browse.classList.add('v6-browse-live');
  const categories = browse.querySelector('.ayna-browse__categories');
  if (!categories) return;

  categories.classList.add('v6-browse-needs-menu');

  let trigger = browse.querySelector('.v6-browse-needs-trigger');
  if (!trigger) {
    trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'v6-browse-needs-trigger';
    trigger.textContent = 'browse by need ↓';
    trigger.setAttribute('aria-expanded', 'false');
    categories.insertAdjacentElement('beforebegin', trigger);

    trigger.addEventListener('click', (event) => {
      event.stopPropagation();
      const open = !categories.classList.contains('is-open');
      categories.classList.toggle('is-open', open);
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  if (!categories.dataset.v6Bound) {
    categories.dataset.v6Bound = '1';
    categories.addEventListener('click', (event) => {
      if (!event.target.closest('button')) return;
      window.setTimeout(() => {
        categories.classList.remove('is-open');
        trigger?.setAttribute('aria-expanded', 'false');
      }, 80);
    });
  }
}

function findAuthCard() {
  const toggles = [...document.querySelectorAll('button')].filter((button) => ['Create account', 'Sign in'].includes(cleanText(button)));
  for (const button of toggles) {
    const row = button.parentElement;
    if (!row) continue;
    const labels = [...row.querySelectorAll(':scope > button')].map(cleanText);
    if (!(labels.includes('Create account') && labels.includes('Sign in'))) continue;

    let card = row.parentElement;
    while (card && card !== document.body) {
      const hasGoogle = [...card.querySelectorAll('button')].some((item) => /continue with google/i.test(cleanText(item)));
      const hasAyna = [...card.querySelectorAll('div')].some((item) => cleanText(item) === 'ayna');
      if (hasGoogle && hasAyna) return { card, row };
      card = card.parentElement;
    }
  }
  return null;
}

function enhanceAuth() {
  const found = findAuthCard();
  if (!found) return;

  const { card, row } = found;
  card.classList.add('v6-auth-card');
  row.classList.add('v6-auth-mode-row');
  card.parentElement?.classList.add('v6-auth-overlay');

  const modeButtons = [...row.querySelectorAll(':scope > button')];
  const createModeButton = modeButtons.find((button) => cleanText(button) === 'Create account');
  const signInModeButton = modeButtons.find((button) => cleanText(button) === 'Sign in');

  const allButtons = [...card.querySelectorAll('button')];
  const submitButton = [...card.querySelectorAll('form button[type="submit"]')][0];
  const googleButton = allButtons.find((button) => /continue with google|redirecting/i.test(cleanText(button)));
  const logo = [...card.querySelectorAll('div')].find((item) => cleanText(item) === 'ayna');
  const tagline = logo?.nextElementSibling;

  logo?.classList.add('v6-auth-logo');
  tagline?.classList.add('v6-auth-tagline');
  submitButton?.classList.add('v6-auth-primary');
  googleButton?.classList.add('v6-auth-google');
  card.querySelectorAll('input').forEach((input) => input.classList.add('v6-auth-input'));

  const signup = Boolean(card.querySelector('input[placeholder="First name"]')) || ['Create account', 'Send code', 'Verify'].includes(cleanText(submitButton));
  const quizContext = /health profile|ecosystem/i.test(cleanText(tagline));

  if (submitButton && signup && cleanText(submitButton) === 'Create account') {
    submitButton.textContent = quizContext ? 'create account + build my ecosystem' : 'create my account';
  }

  let switchLink = card.querySelector('.v6-auth-switch-link');
  if (!switchLink) {
    switchLink = document.createElement('button');
    switchLink.type = 'button';
    switchLink.className = 'v6-auth-switch-link';
    card.appendChild(switchLink);
  }

  switchLink.textContent = signup
    ? 'already have an account? sign in'
    : (quizContext ? 'new to ayna? create an account to build your ecosystem' : 'new to ayna? create an account');

  switchLink.onclick = () => {
    if (signup) signInModeButton?.click();
    else createModeButton?.click();
    nextFrame(enhanceAuth);
  };
}

function enhanceAll() {
  enhanceQuiz();
  enhanceBrowse();
  enhanceAuth();
}

const observer = new MutationObserver(() => {
  window.clearTimeout(observer._v6Timer);
  observer._v6Timer = window.setTimeout(enhanceAll, 20);
});

function start() {
  observer.observe(document.documentElement, { childList: true, subtree: true });
  enhanceAll();

  document.addEventListener('pointerdown', (event) => {
    const browse = document.querySelector('.ayna-browse');
    const menu = browse?.querySelector('.ayna-browse__categories');
    const trigger = browse?.querySelector('.v6-browse-needs-trigger');
    if (!menu?.classList.contains('is-open')) return;
    if (menu.contains(event.target) || trigger?.contains(event.target)) return;
    menu.classList.remove('is-open');
    trigger?.setAttribute('aria-expanded', 'false');
  }, true);

  document.addEventListener('click', () => nextFrame(enhanceAll), true);
  document.addEventListener('input', () => nextFrame(enhanceAll), true);
  document.addEventListener('change', () => nextFrame(enhanceAll), true);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();
