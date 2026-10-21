import { useEffect } from 'react';

// Bottom sheets on phones (Safari and the iOS app's web view):
// - the page behind never scrolls or rubber-bands while a sheet is open,
// - a drag that starts on the dimmed backdrop does nothing,
// - the sheet sits inside the visible viewport, so with the keyboard up it
//   stays above the keyboard instead of jumping or hiding the Post button.
// The visible viewport is published as --ay-vv-top / --ay-vv-h on <html>.

let locks = 0;
let detach = null;
const BACKDROPS = '.cm-sheet-backdrop, .am-sheet-backdrop';
const SHEETS = '.cm-sheet, .am-sheet';

function attach() {
  const root = document.documentElement;
  root.classList.add('ay-sheet-open');
  const vv = window.visualViewport;
  let frame = 0;
  const publish = () => {
    frame = 0;
    const h = vv ? vv.height : window.innerHeight;
    const top = vv ? vv.offsetTop : 0;
    root.style.setProperty('--ay-vv-h', `${Math.round(h)}px`);
    root.style.setProperty('--ay-vv-top', `${Math.round(top)}px`);
  };
  const schedule = () => { if (!frame) frame = window.requestAnimationFrame(publish); };
  publish();
  vv?.addEventListener('resize', schedule);
  vv?.addEventListener('scroll', schedule);
  window.addEventListener('resize', schedule);
  // A drag or wheel that nothing inside the sheet can scroll any further
  // would scroll (or rubber-band) the page behind; iOS ignores overflow:
  // hidden on <body> and overscroll-behavior on a sheet that doesn't
  // overflow, so those moves are cancelled here. Moves on the dimmed
  // backdrop are always cancelled.
  let lastX = 0;
  let lastY = 0;
  const onTouchStart = (e) => { lastX = e.touches?.[0]?.clientX ?? 0; lastY = e.touches?.[0]?.clientY ?? 0; };
  const block = (e, dy) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    const sheet = t.closest(SHEETS);
    if (!sheet) { if (t.closest(BACKDROPS)) e.preventDefault(); return; }
    if (!dy) return;
    for (let el = t; el; el = el.parentElement) {
      const oy = getComputedStyle(el).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight + 1) {
        if (dy > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0) return;
      }
      if (el === sheet) break;
    }
    if (e.cancelable) e.preventDefault();
  };
  const onTouchMove = (e) => {
    if (e.touches?.length !== 1) return;
    const { clientX: x, clientY: y } = e.touches[0];
    const dx = lastX - x; const dy = lastY - y;
    lastX = x; lastY = y;
    if (Math.abs(dx) > Math.abs(dy)) return; // sideways: chip rows, carousels
    block(e, dy);
  };
  const onWheel = (e) => { if (!e.ctrlKey && Math.abs(e.deltaY) >= Math.abs(e.deltaX)) block(e, e.deltaY); };
  document.addEventListener('touchstart', onTouchStart, { passive: true });
  document.addEventListener('touchmove', onTouchMove, { passive: false });
  document.addEventListener('wheel', onWheel, { passive: false });
  return () => {
    if (frame) window.cancelAnimationFrame(frame);
    vv?.removeEventListener('resize', schedule);
    vv?.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    document.removeEventListener('touchstart', onTouchStart);
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('wheel', onWheel);
    root.classList.remove('ay-sheet-open');
    root.style.removeProperty('--ay-vv-h');
    root.style.removeProperty('--ay-vv-top');
  };
}

/** Call with `open` true while any bottom sheet is showing. */
export function useSheetViewport(open = true) {
  useEffect(() => {
    if (!open || typeof window === 'undefined') return undefined;
    locks += 1;
    if (locks === 1) detach = attach();
    return () => {
      locks = Math.max(0, locks - 1);
      if (!locks && detach) { detach(); detach = null; }
    };
  }, [open]);
}

/**
 * Backdrop props that dismiss only on a real tap on the backdrop: the press
 * and the release both have to land on it. A text selection, a scroll or a
 * swipe that starts in the sheet and ends outside it never closes the sheet.
 * The press is remembered on the element, so a re-render in between (focus
 * leaving an input, the keyboard closing) doesn't lose it.
 */
export function backdropTap(onDismiss) {
  return {
    onPointerDown: (e) => { e.currentTarget.dataset.press = e.target === e.currentTarget ? '1' : ''; },
    onClick: (e) => {
      const ok = e.currentTarget.dataset.press === '1' && e.target === e.currentTarget;
      e.currentTarget.dataset.press = '';
      if (ok) onDismiss?.();
    },
  };
}
