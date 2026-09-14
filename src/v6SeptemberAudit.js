import './v6SeptemberAudit.css';

const DRAFT_KEY = 'ayna_intake_redesign_draft_v1';
const QUICK_CATEGORIES = [
  'period care', 'PCOS', 'vaginal health', 'UTI support', 'fertility', 'pregnancy',
  'postpartum', 'perimenopause', 'menopause', 'sexual wellness', 'pelvic health',
  'sleep + energy', 'skin + hair', 'gut health', 'cycle mood', 'provider matching',
];

const SUPPORT_LABELS = [
  'Period product support', 'Cramps or period pain', 'Pelvic pain', 'Heavy periods', 'Light periods',
  'Irregular periods', 'Missed periods', 'Spotting between periods', 'PMS symptoms', 'PMDD symptoms',
  'Breast tenderness', 'Cycle-related headaches or migraines', 'PCOS support', 'Endometriosis support',
  'Fibroid-related concerns', 'Adenomyosis-related concerns', 'Hormone-related symptoms', 'Cycle-related bloating',
  'Nausea', 'Fertility support', 'Trying to conceive', 'Ovulation tracking or support',
  'Prenatal or pregnancy support', 'Pregnancy-related discomfort', 'Pregnancy-safe product discovery',
  'Postpartum recovery', 'Breastfeeding or lactation support', 'Postpartum body or skin changes',
  'Vaginal dryness', 'Vaginal itching or irritation', 'Unusual vaginal discharge', 'Vaginal odor',
  'BV concerns', 'Yeast infection concerns', 'Burning with urination', 'Frequent urination',
  'Urinary urgency', 'Recurrent UTI-like symptoms', 'Bladder leakage or incontinence',
  'Pain or discomfort during sex', 'Low libido or libido changes', 'Sexual wellness or comfort',
  'Contraception', 'STI-related concerns', 'Hot flashes', 'Night sweats', 'Joint aches',
  'Menopause-related body changes', 'Mood swings', 'Irritability', 'Anxiety', 'Low mood',
  'Cycle-related mood changes', 'Fatigue or low energy', 'Trouble sleeping', 'Brain fog',
  'Difficulty concentrating', 'Constipation', 'Diarrhea', 'Gas', 'Abdominal discomfort',
  'Digestive bloating', 'Acne', 'Hair thinning or hair loss', 'Excess facial or body hair',
  'Other hormone-related skin concerns', 'Metabolism or weight support', 'Strength or fitness',
  'Bone health', 'Finding a doctor or specialist', 'Finding a telehealth provider',
  'Something else', 'Nothing right now',
];

const SUPPORT_BY_STAGE = new Map([
  ['I get periods regularly', ['Period product support', 'Cramps or period pain', 'PMS symptoms', 'Cycle-related bloating']],
  ['My periods are irregular', ['Irregular periods', 'PCOS support', 'Hormone-related symptoms', 'Cycle-related bloating']],
  ['I do not currently get periods', ['Hormone-related symptoms', 'Fatigue or low energy', 'Vaginal dryness', 'Trouble sleeping']],
  ['I use hormonal birth control', ['Contraception', 'Spotting between periods', 'Low libido or libido changes', 'Mood swings']],
  ['I am trying to conceive', ['Trying to conceive', 'Ovulation tracking or support', 'Fertility support', 'Finding a doctor or specialist']],
  ['I am pregnant', ['Prenatal or pregnancy support', 'Pregnancy-safe product discovery', 'Pregnancy-related discomfort', 'Nausea']],
  ['I am postpartum', ['Postpartum recovery', 'Breastfeeding or lactation support', 'Postpartum body or skin changes', 'Fatigue or low energy']],
  ['I am in perimenopause', ['Hot flashes', 'Night sweats', 'Brain fog', 'Vaginal dryness']],
  ['I am in menopause', ['Vaginal dryness', 'Hot flashes', 'Bone health', 'Joint aches']],
  ['I am post-menopause', ['Vaginal dryness', 'Bone health', 'Joint aches', 'Menopause-related body changes']],
  ['Other', ['Fatigue or low energy', 'Trouble sleeping', 'Vaginal dryness', 'Finding a doctor or specialist']],
]);

let observerTimer = null;
let quickTimer = null;
let hudTimer = null;

function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function norm(value) {
  return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function setInputValue(input, value) {
  if (!input) return;
  const proto = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  if (setter) setter.call(input, value);
  else input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function readDraft() {
  try {
    return JSON.parse(window.sessionStorage.getItem(DRAFT_KEY) || 'null')?.intake || {};
  } catch {
    return {};
  }
}

function stageSelections(intake) {
  const selected = Array.isArray(intake?.lifeStageSelections) ? intake.lifeStageSelections.filter(Boolean) : [];
  if (selected.length) return selected;
  return intake?.lifeStage ? [intake.lifeStage] : [];
}

function suggestedSupport(intake) {
  const result = [];
  stageSelections(intake).forEach((stage) => {
    (SUPPORT_BY_STAGE.get(stage) || []).forEach((item) => {
      if (!result.includes(item)) result.push(item);
    });
  });
  if (!result.length) {
    result.push('Cramps or period pain', 'Fatigue or low energy', 'Vaginal dryness', 'Trouble sleeping');
  }
  return result.slice(0, 6);
}

function findSupportQuestion() {
  return [...document.querySelectorAll('.ayna-intake-question')].find((question) =>
    /currently experiencing|looking for support/i.test(clean(question.querySelector('h1')?.textContent))
  ) || null;
}

function clickSupportLabel(question, label) {
  const input = question?.querySelector('.ayna-search-wrap input');
  if (!question || !input) return;
  setInputValue(input, '');
  window.setTimeout(() => {
    const row = [...question.querySelectorAll('.ayna-row-choice')].find((candidate) => {
      const text = clean(candidate.querySelector('span:first-child')?.textContent || candidate.textContent);
      return text === label;
    });
    row?.click();
    window.setTimeout(enhanceSupportQuestion, 45);
  }, 35);
}

function addCustomSupport(question, input, rawValue) {
  const value = clean(rawValue);
  if (!value) return;
  setInputValue(input, '');
  window.setTimeout(() => {
    const other = [...question.querySelectorAll('.ayna-row-choice')].find((candidate) =>
      clean(candidate.querySelector('span:first-child')?.textContent || candidate.textContent) === 'Something else'
    );
    if (other && !other.classList.contains('selected')) other.click();
    window.setTimeout(() => {
      const custom = question.querySelector('.ayna-other-box input');
      if (custom) setInputValue(custom, value);
      enhanceSupportQuestion();
    }, 45);
  }, 35);
}

function ensureCustomSupportRow(question, input) {
  if (!question || !input) return;
  const query = clean(input.value);
  const dropdown = question.querySelector('.v6-intake-search-dropdown');
  if (!dropdown || dropdown.hidden || query.length < 2) return;
  dropdown.querySelector('.v6-support-custom-add')?.remove();
  const exact = SUPPORT_LABELS.some((label) => norm(label) === norm(query));
  if (exact) return;

  const add = document.createElement('button');
  add.type = 'button';
  add.className = 'v6-support-custom-add';
  add.innerHTML = '<span class="v6-support-custom-copy"><strong></strong><small>add this to my health profile</small></span><span class="v6-support-custom-plus">+</span>';
  add.querySelector('strong').textContent = `Add “${query}”`;
  add.addEventListener('mousedown', (event) => event.preventDefault());
  add.addEventListener('click', () => addCustomSupport(question, input, query));
  dropdown.appendChild(add);
}

function renderSupportSuggestions(question) {
  const searchWrap = question.querySelector('.ayna-search-wrap');
  const input = searchWrap?.querySelector('input');
  if (!searchWrap || !input) return;

  let host = question.querySelector('.v6-support-suggestion-shell');
  if (!host) {
    host = document.createElement('div');
    host.className = 'v6-support-suggestion-shell';
    searchWrap.insertAdjacentElement('afterend', host);
  }

  const intake = readDraft();
  const selected = Array.isArray(intake.supportSelections) ? intake.supportSelections : [];
  const suggestions = suggestedSupport(intake);
  host.replaceChildren();

  const label = document.createElement('div');
  label.className = 'v6-support-suggestion-label';
  label.innerHTML = '<span class="v6-support-star" aria-hidden="true">✦</span><span>ayna suggestions</span>';
  host.appendChild(label);

  const bubbles = document.createElement('div');
  bubbles.className = 'v6-support-bubbles';
  suggestions.forEach((item) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `v6-support-bubble${selected.includes(item) ? ' is-selected' : ''}`;
    button.textContent = item;
    button.addEventListener('click', () => clickSupportLabel(question, item));
    bubbles.appendChild(button);
  });
  host.appendChild(bubbles);

  const selectedValues = selected.filter((item) => item && item !== 'Something else' && item !== 'Nothing right now');
  const custom = clean(intake.supportOtherText);
  if (selectedValues.length || custom) {
    const chosen = document.createElement('div');
    chosen.className = 'v6-support-selected';
    const chosenLabel = document.createElement('span');
    chosenLabel.className = 'v6-support-selected__label';
    chosenLabel.textContent = 'added';
    chosen.appendChild(chosenLabel);

    selectedValues.forEach((item) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'v6-support-selected__chip';
      chip.innerHTML = '<span></span><b aria-hidden="true">×</b>';
      chip.querySelector('span').textContent = item;
      chip.setAttribute('aria-label', `Remove ${item}`);
      chip.addEventListener('click', () => clickSupportLabel(question, item));
      chosen.appendChild(chip);
    });

    if (custom) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'v6-support-selected__chip';
      chip.innerHTML = '<span></span><b aria-hidden="true">×</b>';
      chip.querySelector('span').textContent = custom;
      chip.setAttribute('aria-label', `Remove ${custom}`);
      chip.addEventListener('click', () => {
        const otherInput = question.querySelector('.ayna-other-box input');
        if (otherInput) setInputValue(otherInput, '');
        clickSupportLabel(question, 'Something else');
      });
      chosen.appendChild(chip);
    }
    host.appendChild(chosen);
  }
}

function enhanceSupportQuestion() {
  const question = findSupportQuestion();
  if (!question) return;
  question.classList.add('v6-support-search-only');

  const subtitle = question.querySelector('.ayna-intake-subtitle');
  if (subtitle) subtitle.textContent = 'Search anything you are experiencing, or tap an Ayna suggestion.';

  const input = question.querySelector('.ayna-search-wrap input');
  if (input) {
    input.placeholder = 'Search symptoms, needs, or support…';
    if (input.dataset.v6SeptSupport !== '1') {
      input.dataset.v6SeptSupport = '1';
      const afterInput = () => window.setTimeout(() => ensureCustomSupportRow(question, input), 0);
      input.addEventListener('input', afterInput);
      input.addEventListener('focus', afterInput);
    }
    window.setTimeout(() => ensureCustomSupportRow(question, input), 0);
  }

  renderSupportSuggestions(question);
}

function submitHomeQuickLink(value) {
  const form = document.querySelector('.v6-home-search');
  const input = form?.querySelector('input');
  if (!form || !input) return;
  setInputValue(input, value);
  window.setTimeout(() => {
    if (typeof form.requestSubmit === 'function') form.requestSubmit();
    else form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  }, 60);
}

function enhanceQuickLinks() {
  const host = document.querySelector('.v6-quick-links');
  if (!host || host.dataset.v6SeptQuick === '1') return;
  host.dataset.v6SeptQuick = '1';
  host.classList.add('v6-quick-links--rotating');
  const buttons = [...host.querySelectorAll('button')].slice(0, 4);
  if (!buttons.length) return;

  let offset = 0;
  const paint = () => {
    buttons.forEach((button, index) => {
      const value = QUICK_CATEGORIES[(offset + index) % QUICK_CATEGORIES.length];
      button.textContent = value;
      button.dataset.v6QuickValue = value;
    });
    host.classList.remove('is-changing');
  };
  paint();

  buttons.forEach((button) => {
    button.addEventListener('click', (event) => {
      const value = button.dataset.v6QuickValue;
      if (!value) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      submitHomeQuickLink(value);
    }, true);
  });

  const rotate = () => {
    host.classList.add('is-changing');
    window.setTimeout(() => {
      offset = (offset + 4) % QUICK_CATEGORIES.length;
      paint();
    }, 150);
  };
  quickTimer = window.setInterval(rotate, 3400);
  host.addEventListener('mouseenter', () => { if (quickTimer) { clearInterval(quickTimer); quickTimer = null; } });
  host.addEventListener('mouseleave', () => { if (!quickTimer) quickTimer = window.setInterval(rotate, 3400); });
}

function shortenUnlockCard() {
  const card = document.querySelector('.v6-unlock-card');
  if (!card) return;
  card.classList.add('v6-unlock-card--compact');
  const paragraph = card.querySelector('p');
  if (paragraph && paragraph.dataset.v6SeptCopy !== '1') {
    paragraph.dataset.v6SeptCopy = '1';
    paragraph.textContent = 'Sign in to unlock your Ayna score, saved matches, and health universe.';
  }
}

function openSignIn() {
  const direct = [...document.querySelectorAll('button')].find((button) => {
    const value = clean(button.textContent).toLowerCase();
    return value === 'sign in' && !button.closest('.ayna-ask-launcher');
  });
  if (direct) {
    direct.click();
    return;
  }
  const account = document.querySelector('.app-nav__circle--account');
  if (!account) return;
  account.click();
  window.setTimeout(() => {
    const login = [...document.querySelectorAll('.nav-account-menu button, .mobile-nav-drawer button')]
      .find((button) => /^(log in|sign in)$/i.test(clean(button.textContent)));
    login?.click();
  }, 40);
}

function enhanceAskAynaLock() {
  const launcher = document.querySelector('.ayna-ask-launcher');
  if (!launcher) return;
  const signedOut = document.documentElement.classList.contains('v6-signed-out');
  launcher.classList.toggle('v6-ask-locked', signedOut);
  launcher.setAttribute('aria-label', signedOut ? 'Sign in to Ask Ayna' : 'Ask Ayna');

  let lock = launcher.querySelector('.v6-ask-lock');
  if (signedOut && !lock) {
    lock = document.createElement('span');
    lock.className = 'v6-ask-lock';
    lock.setAttribute('aria-hidden', 'true');
    lock.innerHTML = '<svg viewBox="0 0 24 24"><rect x="6.5" y="10.3" width="11" height="8.3" rx="2"/><path d="M9 10.3V8a3 3 0 0 1 6 0v2.3"/></svg>';
    launcher.appendChild(lock);
  }
  if (!signedOut) lock?.remove();

  if (launcher.dataset.v6SeptLockBound !== '1') {
    launcher.dataset.v6SeptLockBound = '1';
    launcher.addEventListener('click', (event) => {
      if (!document.documentElement.classList.contains('v6-signed-out')) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      openSignIn();
    }, true);
  }
}

function formatHudTime(date = new Date()) {
  const datePart = new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
    .format(date).replace(',', '').toUpperCase();
  const timePart = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(date);
  return `${datePart}  ${timePart}`;
}

function ensureHud() {
  if (document.querySelector('.v6-camcorder-hud')) return;
  const vignette = document.createElement('div');
  vignette.className = 'v6-film-vignette';
  vignette.setAttribute('aria-hidden', 'true');

  const hud = document.createElement('div');
  hud.className = 'v6-camcorder-hud';
  hud.setAttribute('aria-hidden', 'true');
  hud.innerHTML = `
    <div class="v6-hud-rec"><i></i><span>REC</span></div>
    <div class="v6-hud-battery"><span>[|||]</span><span>100%</span></div>
    <div class="v6-hud-time"></div>
    <div class="v6-hud-mark v6-hud-mark--tl"></div>
    <div class="v6-hud-mark v6-hud-mark--tr"></div>
    <div class="v6-hud-mark v6-hud-mark--bl"></div>
    <div class="v6-hud-mark v6-hud-mark--br"></div>`;
  document.body.append(vignette, hud);

  const update = () => {
    const time = hud.querySelector('.v6-hud-time');
    if (time) time.textContent = formatHudTime(new Date());
  };
  update();
  hudTimer = window.setInterval(update, 30000);
}

function markThemeControls() {
  document.querySelectorAll('.v6-quiz-theme-toggle, .v6-settings-theme button, [data-theme]').forEach((control) => {
    if (control.matches('.v6-quiz-theme-toggle')) control.classList.add('v6-a11y-theme-toggle');
  });
}

function enhanceAll() {
  enhanceSupportQuestion();
  enhanceQuickLinks();
  shortenUnlockCard();
  enhanceAskAynaLock();
  markThemeControls();
}

function start() {
  document.documentElement.classList.add('v6-september-audit');
  ensureHud();
  enhanceAll();

  const observer = new MutationObserver(() => {
    clearTimeout(observerTimer);
    observerTimer = window.setTimeout(enhanceAll, 28);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'data-v6-site-theme'] });

  document.addEventListener('input', () => window.setTimeout(enhanceAll, 0), true);
  document.addEventListener('change', () => window.setTimeout(enhanceAll, 0), true);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();

window.addEventListener('beforeunload', () => {
  if (quickTimer) clearInterval(quickTimer);
  if (hudTimer) clearInterval(hudTimer);
});
