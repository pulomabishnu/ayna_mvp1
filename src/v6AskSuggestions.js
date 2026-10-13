
const PROMPTS = [
  'What can help with cramps?',
  'Find PCOS support',
  'Compare period products',
  'What can help with vaginal dryness?',
];

let scheduled = false;

function setInputValue(input, value) {
  if (!input) return;
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  if (setter) setter.call(input, value);
  else input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function enhanceAskPanel() {
  const panel = document.querySelector('.ayna-ask-panel');
  if (!panel) return;

  let host = panel.querySelector('.v6-ask-suggestions');
  if (panel.querySelector('.ayna-ask-message--user')) {
    host?.remove();
    return;
  }
  if (host) return;

  host = document.createElement('div');
  host.className = 'v6-ask-suggestions';
  host.setAttribute('aria-label', 'Ayna suggestions');

  const label = document.createElement('div');
  label.className = 'v6-ask-suggestions__label';
  const star = document.createElement('span');
  star.setAttribute('aria-hidden', 'true');
  star.textContent = '✦';
  const labelText = document.createElement('span');
  labelText.textContent = 'ayna suggestions';
  label.append(star, labelText);
  host.appendChild(label);

  const row = document.createElement('div');
  row.className = 'v6-ask-suggestions__row';
  PROMPTS.forEach((prompt) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'v6-ask-suggestion-bubble';
    const icon = document.createElement('span');
    icon.className = 'v6-ask-suggestion-star';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '✦';
    const text = document.createElement('span');
    text.textContent = prompt;
    button.append(icon, text);
    button.addEventListener('click', () => {
      const input = panel.querySelector('.ayna-ask-panel__composer input');
      const form = panel.querySelector('.ayna-ask-panel__composer');
      if (!input || !form || input.disabled) return;
      setInputValue(input, prompt);
      window.setTimeout(() => form.requestSubmit?.(), 60);
    });
    row.appendChild(button);
  });
  host.appendChild(row);

  const mode = panel.querySelector('.ayna-ask-mode');
  const messages = panel.querySelector('.ayna-ask-panel__messages');
  if (mode) mode.insertAdjacentElement('afterend', host);
  else messages?.insertAdjacentElement('beforebegin', host);
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    enhanceAskPanel();
  });
}

function start() {
  enhanceAskPanel();
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();
