// "Check in" from anywhere (routine summary, Ecosystem, You): open Today's
// log if the check-in item is standing in for it, then scroll to it.
export const OPEN_LOG_EVENT = 'ayna:open-today-log';
export function openTodayLog(variant = 'app') {
  try { window.dispatchEvent(new CustomEvent(OPEN_LOG_EVENT)); } catch { /* old browser */ }
  const go = () => document.getElementById(`ay-today-log-${variant}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => requestAnimationFrame(go)); else go();
}
