const PRODUCT_DETAIL_PATH = /^\/product\//;

const COLLAPSIBLE_SELECTORS = [
  '.pdp-summary-card__body',
  '.pdp-community__snippet',
  '.pdp-scientific__entry-text',
  '.pdp-scientific__entry-summary',
  '.pdp-evidence-head__desc',
  '.pdp-rail__body',
].join(',');

const MIN_TEXT_LENGTH = 105;
const DATA_KEY = 'aynaCompactCopy';

function injectStyles() {
  if (document.getElementById('ayna-compact-product-copy-styles')) return;

  const style = document.createElement('style');
  style.id = 'ayna-compact-product-copy-styles';
  style.textContent = `
    .pdp-summary-card {
      padding: 18px !important;
    }

    .pdp-summary-card__body,
    .pdp-community__snippet,
    .pdp-scientific__entry-text,
    .pdp-scientific__entry-summary,
    .pdp-evidence-head__desc,
    .pdp-rail__body {
      line-height: 1.5 !important;
    }

    .ayna-collapsible-copy:not(.is-expanded) {
      display: -webkit-box !important;
      -webkit-box-orient: vertical !important;
      -webkit-line-clamp: 2 !important;
      overflow: hidden !important;
      max-height: 3em !important;
    }

    .ayna-collapsible-copy.is-expanded {
      display: block !important;
      -webkit-line-clamp: unset !important;
      max-height: none !important;
      overflow: visible !important;
    }

    .ayna-read-more-toggle {
      display: inline-flex;
      align-items: center;
      width: fit-content;
      margin: 6px 0 10px;
      padding: 0;
      border: 0;
      background: transparent;
      color: #4E3866;
      font: 600 12px/1.2 "DM Sans", sans-serif;
      text-decoration: underline;
      text-underline-offset: 3px;
      cursor: pointer;
      position: relative;
      z-index: 2;
    }

    .ayna-read-more-toggle:hover {
      opacity: .72;
    }

    .pdp-scientific__entry .ayna-read-more-toggle {
      margin-bottom: 4px;
    }

    @media (max-width: 720px) {
      .pdp-summary-card {
        padding: 15px !important;
      }

      .ayna-collapsible-copy:not(.is-expanded) {
        -webkit-line-clamp: 2 !important;
        max-height: 3em !important;
      }
    }
  `;
  document.head.appendChild(style);
}

function stopLinkNavigation(event) {
  event.preventDefault();
  event.stopPropagation();
}

function decorateCopy(node) {
  if (!(node instanceof HTMLElement)) return;
  if (node.dataset[DATA_KEY] === '1') return;

  const text = (node.textContent || '').replace(/\s+/g, ' ').trim();
  if (text.length < MIN_TEXT_LENGTH) {
    node.dataset[DATA_KEY] = '1';
    return;
  }

  node.dataset[DATA_KEY] = '1';
  node.classList.add('ayna-collapsible-copy');

  const toggle = document.createElement('span');
  toggle.className = 'ayna-read-more-toggle';
  toggle.setAttribute('role', 'button');
  toggle.setAttribute('tabindex', '0');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.textContent = 'Read more';

  const setExpanded = (expanded) => {
    node.classList.toggle('is-expanded', expanded);
    toggle.textContent = expanded ? 'Read less' : 'Read more';
    toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  };

  const activate = (event) => {
    stopLinkNavigation(event);
    setExpanded(!node.classList.contains('is-expanded'));
  };

  toggle.addEventListener('click', activate);
  toggle.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    activate(event);
  });

  node.insertAdjacentElement('afterend', toggle);
}

function decorateProductPage() {
  if (!PRODUCT_DETAIL_PATH.test(window.location.pathname)) return;
  injectStyles();
  document.querySelectorAll(COLLAPSIBLE_SELECTORS).forEach(decorateCopy);
}

let scheduled = false;
function scheduleDecorate() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    decorateProductPage();
  });
}

const observer = new MutationObserver(scheduleDecorate);
observer.observe(document.documentElement, { childList: true, subtree: true });

window.addEventListener('popstate', scheduleDecorate);
window.addEventListener('hashchange', scheduleDecorate);
document.addEventListener('DOMContentLoaded', scheduleDecorate);
scheduleDecorate();
