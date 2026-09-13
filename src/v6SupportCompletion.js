import './v6MasterCompletion.css';

const SUPPORT_HEADING = 'Which options best describe you right now?';
const SUPPORT_SUBCOPY = 'Search, or tap an Ayna suggestion below.';
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

function supportQuestion() {
  return [...document.querySelectorAll('.ayna-intake-question')].find((question) => {
    const heading = clean(question.querySelector(':scope > h1')?.textContent);
    return Boolean(question.querySelector('.ayna-search-wrap')) && /currently experiencing|looking for support|which options best describe you right now/i.test(heading);
  }) || null;
}

function finishSupportStep() {
  const question = supportQuestion();
  if (!question) return;
  question.classList.add('v6-master-support');

  const heading = question.querySelector(':scope > h1');
  const subtitle = question.querySelector(':scope > .ayna-intake-subtitle');
  if (heading) heading.textContent = SUPPORT_HEADING;
  if (subtitle) subtitle.textContent = SUPPORT_SUBCOPY;

  const wrap = question.querySelector('.ayna-search-wrap');
  const input = wrap?.querySelector('input');
  if (!wrap || !input) return;
  wrap.classList.add('v6-support-search-with-toggle');
  input.placeholder = 'Search period care, PCOS, UTI support, sleep…';

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
  if (copy) copy.textContent = 'Save picks, see your Ayna score, and open your health universe.';
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
