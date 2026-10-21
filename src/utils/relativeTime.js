import { useEffect, useState } from 'react';

// Relative times ("Just now", "2m ago", "Yesterday"), shared by the website
// and the app, refreshed once a minute by one shared timer (not one per row).

export function relativeTime(when, now = Date.now()) {
  if (when == null || when === '') return '';
  const t = when instanceof Date ? when.getTime() : new Date(when).getTime();
  if (!Number.isFinite(t)) return '';
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 45) return 'Just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const then = new Date(t);
  if (h < 24 && then >= today) return `${h}h ago`;
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (then >= yesterday) return 'Yesterday';
  const days = Math.round((today - new Date(then.getFullYear(), then.getMonth(), then.getDate())) / 86400000);
  if (days < 7) return `${days}d ago`;
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(then.getFullYear() !== new Date(now).getFullYear() ? { year: 'numeric' } : {}) });
}

// One minute tick for every subscriber, aligned to the wall-clock minute.
const listeners = new Set();
let timer = 0;
function start() {
  if (timer || typeof window === 'undefined') return;
  const fire = () => listeners.forEach((fn) => fn(Date.now()));
  timer = window.setTimeout(function tick() {
    fire();
    timer = window.setTimeout(tick, 60000);
  }, 60000 - (Date.now() % 60000));
  document.addEventListener('visibilitychange', onVisible);
}
function onVisible() { if (document.visibilityState === 'visible') listeners.forEach((fn) => fn(Date.now())); }
function stop() {
  if (listeners.size || !timer) return;
  window.clearTimeout(timer); timer = 0;
  document.removeEventListener('visibilitychange', onVisible);
}

/** Current time, updated every minute while mounted. */
export function useMinuteNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    listeners.add(setNow); start();
    return () => { listeners.delete(setNow); stop(); };
  }, []);
  return now;
}

