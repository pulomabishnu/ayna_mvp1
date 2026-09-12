import './v6InteractionFinal.css';

function closeSearchBlockingSignIn() {
  const overlay = document.querySelector('.v6-auth-overlay.v6-auth-sheet-mode');
  if (!overlay) return;
  const close = overlay.querySelector('button[aria-label="Skip for now"], button[aria-label="Close"]');
  close?.click();
}

function syncExpandedState(input) {
  if (!input) return;
  const form = input.closest('.v6-typeahead-host');
  const dropdown = form?.querySelector('.v6-live-search-dropdown');
  input.setAttribute('aria-expanded', dropdown && !dropdown.hidden ? 'true' : 'false');
  input.setAttribute('aria-haspopup', 'listbox');
  input.setAttribute('autocomplete', 'off');
}

function enhance() {
  document.querySelectorAll('.v6-home-search input, .ayna-browse__search input').forEach(syncExpandedState);
  const support = document.querySelector('.ayna-intake-question .ayna-search-wrap input');
  if (support) {
    const dropdown = support.closest('.ayna-search-wrap')?.querySelector('.v6-intake-search-dropdown');
    support.setAttribute('aria-expanded', dropdown && !dropdown.hidden ? 'true' : 'false');
    support.setAttribute('aria-haspopup', 'listbox');
    support.setAttribute('autocomplete', 'off');
  }
}

let timer = null;
const observer = new MutationObserver(() => {
  window.clearTimeout(timer);
  timer = window.setTimeout(enhance, 20);
});

function start() {
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'class'] });
  enhance();

  document.addEventListener('focusin', (event) => {
    if (event.target?.matches?.('.v6-home-search input, .ayna-browse__search input')) {
      closeSearchBlockingSignIn();
      window.setTimeout(enhance, 0);
    }
  }, true);

  document.addEventListener('input', (event) => {
    if (event.target?.matches?.('.v6-home-search input, .ayna-browse__search input, .ayna-intake-question .ayna-search-wrap input')) {
      window.setTimeout(enhance, 0);
    }
  }, true);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();
