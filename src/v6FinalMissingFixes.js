import './v6FinalMissingFixes.css';

let scheduled = false;

function text(node) {
  return String(node?.textContent || '').replace(/\s+/g, ' ').trim();
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
  document.querySelectorAll('.v6-home-search input').forEach((input) => input.setAttribute('autocomplete', 'off'));
}

function run() {
  removeLiteralHud();
  ensureSignedOutAskAyna();
  fixSearchAutocomplete();
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
