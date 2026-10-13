// Keyboard-only focus for app search pills. Text inputs match :focus-visible
// even when tapped, so CSS alone can't tell a tap from a Tab. This marks
// <html data-ay-kbd> after a Tab/arrow key and clears it on any pointer or
// touch, so no-focus-ring.css can show the ring for keyboard users only.
const KEYS = new Set(['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
let installed = false;

export function installKeyboardModality() {
  if (installed || typeof document === 'undefined') return;
  installed = true;
  const root = document.documentElement;
  document.addEventListener('keydown', (e) => {
    if (KEYS.has(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey) root.setAttribute('data-ay-kbd', '');
  }, true);
  const clear = () => root.removeAttribute('data-ay-kbd');
  document.addEventListener('pointerdown', clear, true);
  document.addEventListener('touchstart', clear, { capture: true, passive: true });
}

installKeyboardModality();
