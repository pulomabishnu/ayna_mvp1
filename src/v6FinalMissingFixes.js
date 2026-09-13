import './v6FinalMissingFixes.css';

let scheduled = false;

function text(node) {
  return String(node?.textContent || '').replace(/\s+/g, ' ').trim();
}

function norm(value) {
  return text({ textContent: value }).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function setControlledInput(input, value) {
  if (!input) return;
  const proto = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  if (setter) setter.call(input, value);
  else input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function openRealSignIn() {
  const visibleButtons = [...document.querySelectorAll('button')].filter((button) => {
    const style = window.getComputedStyle(button);
    return style.display !== 'none' && style.visibility !== 'hidden';
  });

  const direct = visibleButtons.find((button) => /^sign\s*in$/i.test(text(button)) && !button.closest('.v6-ask-locked-fallback'));
  if (direct) {
    direct.click();
    return;
  }

  const account = document.querySelector('.app-nav__circle--account, [aria-label*="account" i]');
  if (account) {
    account.click();
    window.setTimeout(() => {
      const login = [...document.querySelectorAll('button, a')].find((node) => /^(sign in|log in)$/i.test(text(node)));
      login?.click();
    }, 60);
    return;
  }

  window.history.pushState({ view: 'quiz' }, '', '/quiz');
  window.dispatchEvent(new PopStateEvent('popstate', { state: { view: 'quiz' } }));
}

function ensureSignedOutAskAyna() {
  const signedOut = document.documentElement.classList.contains('v6-signed-out');
  const real = document.querySelector('.ayna-ask-launcher');
  let fallback = document.querySelector('.v6-ask-locked-fallback');

  if (!signedOut || real) {
    fallback?.remove();
    return;
  }

  if (fallback) return;
  fallback = document.createElement('button');
  fallback.type = 'button';
  fallback.className = 'v6-ask-locked-fallback';
  fallback.setAttribute('aria-label', 'Sign in to Ask Ayna');
  fallback.innerHTML = `
    <span class="v6-ask-locked-fallback__inner">
      <span class="v6-ask-locked-fallback__star" aria-hidden="true">✦</span>
      <span class="v6-ask-locked-fallback__label">ask ayna</span>
    </span>
    <span class="v6-ask-locked-fallback__lock" aria-hidden="true">⌑</span>`;
  fallback.addEventListener('click', openRealSignIn);
  document.body.appendChild(fallback);
}

function removeLiteralHud() {
  document.querySelectorAll('.v6-camcorder-hud').forEach((node) => node.remove());
}

function fixSearchAutocomplete() {
  document.querySelectorAll('.v6-home-search input, .ayna-browse__search input').forEach((input) => input.setAttribute('autocomplete', 'off'));
}

function supportQuestion() {
  return [...document.querySelectorAll('.ayna-intake-question')].find((question) => {
    const heading = text(question.querySelector(':scope > h1'));
    return Boolean(question.querySelector('.ayna-search-wrap input')) && /currently experiencing|looking for support|which options best describe you right now/i.test(heading);
  }) || null;
}

function chooseSupport(question, input, label) {
  const row = [...question.querySelectorAll('.ayna-row-choice')].find((button) => {
    const labelNode = button.querySelector('span:first-child') || button;
    return text(labelNode) === label;
  });
  if (!row) return;
  if (!row.classList.contains('selected')) row.click();
  setControlledInput(input, '');
}

function addCustomSupport(question, input, value) {
  const cleanValue = String(value || '').trim();
  if (!cleanValue) return;
  const other = [...question.querySelectorAll('.ayna-row-choice')].find((button) => text(button.querySelector('span:first-child') || button) === 'Something else');
  if (other && !other.classList.contains('selected')) other.click();
  window.setTimeout(() => {
    const custom = question.querySelector('.ayna-other-box input');
    if (custom) setControlledInput(custom, cleanValue);
    setControlledInput(input, '');
  }, 40);
}

function bindReliableSupportSearch() {
  const question = supportQuestion();
  const input = question?.querySelector('.ayna-search-wrap input');
  const wrap = input?.closest('.ayna-search-wrap');
  if (!question || !input || !wrap || input.dataset.v6ReliableSupport === '1') return;
  input.dataset.v6ReliableSupport = '1';
  input.placeholder = 'Search symptoms, needs, or support…';
  input.setAttribute('autocomplete', 'off');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-haspopup', 'listbox');

  let dropdown = wrap.querySelector('.v6-intake-search-dropdown');
  if (!dropdown) {
    dropdown = document.createElement('div');
    dropdown.className = 'v6-intake-search-dropdown';
    dropdown.setAttribute('role', 'listbox');
    dropdown.hidden = true;
    wrap.appendChild(dropdown);
  }
  dropdown.classList.add('v6-final-support-dropdown');

  let blurTimer = null;
  const close = () => {
    dropdown.hidden = true;
    wrap.classList.remove('v6-intake-typeahead-open');
    input.setAttribute('aria-expanded', 'false');
  };

  const render = () => {
    const query = String(input.value || '').trim();
    if (!query) {
      close();
      return;
    }

    const labels = [...question.querySelectorAll('.ayna-row-choice')]
      .map((button) => text(button.querySelector('span:first-child') || button))
      .filter(Boolean);
    const q = norm(query);
    const matches = labels
      .map((label) => {
        const n = norm(label);
        let score = Number.POSITIVE_INFINITY;
        if (n === q) score = 0;
        else if (n.startsWith(q)) score = 1;
        else if (n.includes(q)) score = 2 + n.indexOf(q) / 100;
        else if (q.split(' ').filter(Boolean).every((part) => n.includes(part))) score = 4;
        return { label, score };
      })
      .filter((entry) => Number.isFinite(entry.score))
      .sort((a, b) => a.score - b.score || a.label.localeCompare(b.label))
      .slice(0, 8);

    dropdown.replaceChildren();
    const heading = document.createElement('div');
    heading.className = 'v6-typeahead-label';
    heading.textContent = matches.length ? 'matching support options' : 'add to your health profile';
    dropdown.appendChild(heading);

    matches.forEach(({ label }) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'v6-intake-search-row';
      button.setAttribute('role', 'option');
      button.innerHTML = '<span></span><em>select +</em>';
      button.querySelector('span').textContent = label;
      button.addEventListener('mousedown', (event) => event.preventDefault());
      button.addEventListener('click', () => {
        chooseSupport(question, input, label);
        close();
      });
      dropdown.appendChild(button);
    });

    const exact = labels.some((label) => norm(label) === q);
    if (query.length >= 2 && !exact) {
      const add = document.createElement('button');
      add.type = 'button';
      add.className = 'v6-support-custom-add';
      add.setAttribute('role', 'option');
      add.innerHTML = '<span class="v6-support-custom-copy"><strong></strong><small>add this to my health profile</small></span><span class="v6-support-custom-plus">+</span>';
      add.querySelector('strong').textContent = `Add “${query}”`;
      add.addEventListener('mousedown', (event) => event.preventDefault());
      add.addEventListener('click', () => {
        addCustomSupport(question, input, query);
        close();
      });
      dropdown.appendChild(add);
    }

    dropdown.hidden = false;
    wrap.classList.add('v6-intake-typeahead-open');
    input.setAttribute('aria-expanded', 'true');
  };

  input.addEventListener('focus', () => {
    window.clearTimeout(blurTimer);
    render();
  });
  input.addEventListener('input', () => window.requestAnimationFrame(render));
  input.addEventListener('blur', () => {
    blurTimer = window.setTimeout(close, 180);
  });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
    if (event.key === 'Enter' && !dropdown.hidden) {
      const first = dropdown.querySelector('button');
      if (first) {
        event.preventDefault();
        first.click();
      }
    }
  });
}

function run() {
  removeLiteralHud();
  ensureSignedOutAskAyna();
  fixSearchAutocomplete();
  bindReliableSupportSearch();
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
  run();
  new MutationObserver(schedule).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class'],
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();
