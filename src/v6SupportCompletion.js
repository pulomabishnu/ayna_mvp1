
const SUPPORT_HEADING = 'Which options best describe you right now?';
const SUPPORT_SUBCOPY = 'Search, or tap an Ayna suggestion below.';
const DRAFT_KEY = 'ayna_intake_redesign_draft_v1';
const DEFAULT_SUGGESTIONS = ['Cramps or period pain', 'Irregular periods', 'PCOS support', 'Fertility support', 'Vaginal dryness'];
const SUGGESTIONS_BY_STAGE = new Map([
  ['I get periods regularly', ['Cramps or period pain', 'PMS symptoms', 'Period product support', 'Cycle-related bloating', 'Vaginal dryness']],
  ['My periods are irregular', ['Irregular periods', 'PCOS support', 'Hormone-related symptoms', 'Cycle-related bloating', 'Fertility support']],
  ['I do not currently get periods', ['Hormone-related symptoms', 'Fatigue or low energy', 'Vaginal dryness', 'Trouble sleeping', 'Bone health']],
  ['I use hormonal birth control', ['Contraception', 'Spotting between periods', 'Low libido or libido changes', 'Mood swings', 'Vaginal dryness']],
  ['I am trying to conceive', ['Trying to conceive', 'Ovulation tracking or support', 'Fertility support', 'Prenatal or pregnancy support', 'Finding a doctor or specialist']],
  ['I am pregnant', ['Prenatal or pregnancy support', 'Pregnancy-safe product discovery', 'Pregnancy-related discomfort', 'Nausea', 'Finding a doctor or specialist']],
  ['I am postpartum', ['Postpartum recovery', 'Breastfeeding or lactation support', 'Postpartum body or skin changes', 'Fatigue or low energy', 'Trouble sleeping']],
  ['I am in perimenopause', ['Hot flashes', 'Night sweats', 'Brain fog', 'Vaginal dryness', 'Trouble sleeping']],
  ['I am in menopause', ['Vaginal dryness', 'Hot flashes', 'Bone health', 'Joint aches', 'Trouble sleeping']],
  ['I am post-menopause', ['Vaginal dryness', 'Bone health', 'Joint aches', 'Menopause-related body changes', 'Finding a doctor or specialist']],
]);

let scheduled = false;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function setInputValue(input, value) {
  if (!input) return;
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  if (setter) setter.call(input, value);
  else input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function readDraft() {
  try { return JSON.parse(window.sessionStorage.getItem(DRAFT_KEY) || 'null')?.intake || {}; }
  catch { return {}; }
}

function isSupportQuestion(question) {
  const heading = clean(question?.querySelector(':scope > h1')?.textContent);
  return Boolean(question?.querySelector('.ayna-search-wrap'))
    && /currently experiencing|looking for support|which options best describe you right now/i.test(heading);
}

function supportQuestion() {
  return [...document.querySelectorAll('.ayna-intake-question')].find(isSupportQuestion) || null;
}

function cleanupStaleSupportEnhancements() {
  document.querySelectorAll('.ayna-intake-question').forEach((question) => {
    if (isSupportQuestion(question)) return;

    question.classList.remove('v6-master-support', 'v6-support-search-only', 'v6-support-browse-all');
    question.querySelectorAll('.v6-support-suggestion-shell').forEach((node) => node.remove());
    question.querySelectorAll('.v6-support-browse-toggle').forEach((node) => node.remove());
    question.querySelectorAll('.v6-support-search-with-toggle').forEach((node) => node.classList.remove('v6-support-search-with-toggle'));
  });
}

function selectSupport(question, label) {
  const row = [...question.querySelectorAll('.ayna-row-choice')].find((candidate) => {
    const text = clean(candidate.querySelector('span:first-child')?.textContent || candidate.textContent);
    return text === label;
  });
  row?.click();
}

function ensureSuggestionShell(question, wrap) {
  let shell = question.querySelector('.v6-support-suggestion-shell');
  if (shell) return shell;

  shell = document.createElement('div');
  shell.className = 'v6-support-suggestion-shell';
  const label = document.createElement('div');
  label.className = 'v6-support-suggestion-label';
  const star = document.createElement('span');
  star.className = 'v6-support-star';
  star.setAttribute('aria-hidden', 'true');
  star.textContent = '✦';
  const labelText = document.createElement('span');
  labelText.textContent = 'ayna suggestions';
  label.append(star, labelText);
  shell.appendChild(label);

  const bubbles = document.createElement('div');
  bubbles.className = 'v6-support-bubbles';
  shell.appendChild(bubbles);
  wrap.insertAdjacentElement('afterend', shell);
  return shell;
}

function populateSuggestions(question, wrap) {
  const shell = ensureSuggestionShell(question, wrap);
  const bubbles = shell.querySelector('.v6-support-bubbles');
  if (!bubbles || bubbles.children.length) return;

  const intake = readDraft();
  const stages = Array.isArray(intake.lifeStageSelections) && intake.lifeStageSelections.length
    ? intake.lifeStageSelections
    : intake.lifeStage ? [intake.lifeStage] : [];
  const suggestions = [];
  stages.forEach((stage) => {
    (SUGGESTIONS_BY_STAGE.get(stage) || []).forEach((item) => {
      if (!suggestions.includes(item)) suggestions.push(item);
    });
  });
  (suggestions.length ? suggestions : DEFAULT_SUGGESTIONS).slice(0, 6).forEach((item) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'v6-support-bubble v6-master-suggestion-bubble';
    button.textContent = item;
    button.addEventListener('click', () => {
      selectSupport(question, item);
      window.setTimeout(schedule, 40);
    });
    bubbles.appendChild(button);
  });
}

function finishSupportStep() {
  const question = supportQuestion();
  if (!question) return;
  question.classList.add('v6-master-support', 'v6-support-search-only');

  const heading = question.querySelector(':scope > h1');
  const subtitle = question.querySelector(':scope > .ayna-intake-subtitle');
  if (heading) heading.textContent = SUPPORT_HEADING;
  if (subtitle) subtitle.textContent = SUPPORT_SUBCOPY;

  const wrap = question.querySelector('.ayna-search-wrap');
  const input = wrap?.querySelector('input');
  if (!wrap || !input) return;
  wrap.classList.add('v6-support-search-with-toggle');
  input.placeholder = 'Search period care, PCOS, UTI support, sleep…';

  populateSuggestions(question, wrap);

  if (!wrap.querySelector('.v6-support-browse-toggle')) {
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'v6-support-browse-toggle';
    toggle.setAttribute('aria-label', 'Browse all support categories');
    toggle.setAttribute('aria-expanded', 'false');
    const symbol = document.createElement('span');
    symbol.setAttribute('aria-hidden', 'true');
    symbol.textContent = '+';
    toggle.appendChild(symbol);
    toggle.addEventListener('click', () => {
      const open = !question.classList.contains('v6-support-browse-all');
      question.classList.toggle('v6-support-browse-all', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close all support categories' : 'Browse all support categories');
      symbol.textContent = open ? '×' : '+';
    });
    wrap.appendChild(toggle);
  }

  question.querySelectorAll('.v6-support-bubble').forEach((bubble) => bubble.classList.add('v6-master-suggestion-bubble'));
}

function finishUnlockCard() {
  const card = document.querySelector('.v6-unlock-card');
  if (!card) return;
  card.classList.add('v6-unlock-card--slim');
  const heading = card.querySelector('h2');
  const copy = card.querySelector('p');
  if (heading) heading.textContent = 'sign in to unlock your personalized results.';
  if (copy) copy.textContent = 'Save picks, see your ayna score, and open your health universe.';
  const actions = [...card.querySelectorAll('.v6-unlock-actions button')];
  if (actions[1]) actions[1].textContent = 'new here? build your ecosystem';
}

function finishReducedMotion() {
  document.documentElement.classList.toggle('v6-reduced-motion-static', reduceMotion.matches);
  const links = document.querySelector('.v6-quick-links');
  if (!links) return;
  let staticButton = links.parentElement?.querySelector(':scope > .v6-quick-static');
  if (!reduceMotion.matches) {
    staticButton?.remove();
    return;
  }
  if (staticButton) return;
  staticButton = document.createElement('button');
  staticButton.type = 'button';
  staticButton.className = 'v6-quick-static';
  staticButton.textContent = 'period care';
  staticButton.addEventListener('click', () => {
    const form = document.querySelector('.v6-home-search');
    const input = form?.querySelector('input');
    if (!form || !input) return;
    setInputValue(input, 'period care');
    window.setTimeout(() => form.requestSubmit?.(), 40);
  });
  links.insertAdjacentElement('afterend', staticButton);
}

function run() {
  cleanupStaleSupportEnhancements();
  finishSupportStep();
  finishUnlockCard();
  finishReducedMotion();
  document.querySelector('.v6-camcorder-hud')?.setAttribute('aria-hidden', 'true');
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    run();
  });
}

function start() {
  if (typeof reduceMotion.addEventListener === 'function') reduceMotion.addEventListener('change', schedule);
  run();
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();
