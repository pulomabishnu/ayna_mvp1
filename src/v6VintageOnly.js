import './v6VintageOnly.css';

function removeLiteralCameraUi() {
  document.documentElement.classList.add('v6-vintage-only');
  document.querySelectorAll('.v6-camcorder-hud').forEach((node) => node.remove());
}

function start() {
  removeLiteralCameraUi();
  new MutationObserver(removeLiteralCameraUi).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}
