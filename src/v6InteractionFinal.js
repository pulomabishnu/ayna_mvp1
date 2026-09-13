import './v6InteractionFinal.css';

function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function closeSearchBlockingSignIn() {
  const overlay = document.querySelector('.v6-auth-overlay.v6-auth-sheet-mode');
  if (!overlay) return;
  const close = overlay.querySelector('button[aria-label="Skip for now"], button[aria-label="Close"]');
  close?.click();
}

function openSignIn() {
  const visible = (node) => {
    if (!node) return false;
    const style = getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
  };

  const direct = [...document.querySelectorAll('button, a')].find((node) =>
    visible(node) && /^(sign in|log in)$/i.test(clean(node.textContent)) && !node.closest('.v6-ask-locked-fallback')
  );
  if (direct) {
    direct.click();
    return;
  }

  const account = [...document.querySelectorAll('.app-nav__circle--account, [aria-label*="account" i]')].find(visible);
  if (!account) return;
  account.click();
  window.setTimeout(() => {
    const login = [...document.querySelectorAll('.nav-account-menu button, .mobile-nav-drawer button')]
      .find((node) => visible(node) && /^(sign in|log in)$/i.test(clean(node.textContent)));
    login?.click();
  }, 60);
}

function closeBrowseNeedsMenu() {
  const browse = document.querySelector('.ayna-browse');
  const menu = browse?.querySelector('.ayna-browse__categories');
  const trigger = browse?.querySelector('.v6-browse-needs-trigger');
  menu?.classList.remove('is-open');
  trigger?.setAttribute('aria-expanded', 'false');
}

function closeBrowseFilters() {
  const browse = document.querySelector('.ayna-browse');
  const panel = browse?.querySelector('.ayna-browse__filters');
  const button = browse?.querySelector('.ayna-browse__filter-button');
  if (panel && button) button.click();
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

  document.addEventListener('pointerdown', (event) => {
    const needsTrigger = event.target?.closest?.('.v6-browse-needs-trigger');
    const filterButton = event.target?.closest?.('.ayna-browse__filter-button');

    // Only one floating Browse panel should be open at a time.
    if (needsTrigger) closeBrowseFilters();
    if (filterButton) closeBrowseNeedsMenu();
  }, true);

  document.addEventListener('click', (event) => {
    if (!document.documentElement.classList.contains('v6-signed-out')) return;

    const personalize = event.target?.closest?.('.ayna-browse__personalized-toggle');
    if (personalize) {
      // A signed-out visitor can inspect the control, but cannot enter a fake
      // personalized state. Keep the real switch off and surface auth instead.
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      const checkbox = personalize.querySelector('input[type="checkbox"]');
      if (checkbox) checkbox.checked = false;
      openSignIn();
      return;
    }

    const ecosystemNav = event.target?.closest?.('button, a');
    if (ecosystemNav && /^my ecosystem$/i.test(clean(ecosystemNav.textContent))) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      openSignIn();
    }
  }, true);

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
