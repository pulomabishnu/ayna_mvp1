// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { relativeTime, useMinuteNow } from './relativeTime.js';
import RelativeTime from '../components/ui/RelativeTime.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const NOW = new Date('2026-10-21T15:00:30').getTime();

describe('relativeTime', () => {
  it('reads like a person', () => {
    expect(relativeTime(NOW - 10 * 1000, NOW)).toBe('Just now');
    expect(relativeTime(NOW - 2 * 60 * 1000, NOW)).toBe('2m ago');
    expect(relativeTime(NOW - 3 * 3600 * 1000, NOW)).toBe('3h ago');
    expect(relativeTime(new Date('2026-10-20T09:00:00'), NOW)).toBe('Yesterday');
    expect(relativeTime(new Date('2026-10-17T09:00:00').toISOString(), NOW)).toBe('4d ago');
    expect(relativeTime(new Date('2026-09-02T09:00:00'), NOW)).toBe('Sep 2');
    expect(relativeTime(new Date('2025-09-02T09:00:00'), NOW)).toBe('Sep 2, 2025');
  });
  it('is empty for missing or broken values, never "Jan 1, 1970"', () => {
    expect(relativeTime(null, NOW)).toBe('');
    expect(relativeTime(undefined, NOW)).toBe('');
    expect(relativeTime('', NOW)).toBe('');
    expect(relativeTime('not a date', NOW)).toBe('');
  });
  it('never goes negative for a clock that runs ahead', () => {
    expect(relativeTime(NOW + 60000, NOW)).toBe('Just now');
  });
});

describe('useMinuteNow', () => {
  let host;
  let root;
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
  });
  afterEach(() => {
    act(() => root.unmount());
    host.remove();
    vi.useRealTimers();
  });

  it('refreshes "Just now" to "1m ago" on the next wall-clock minute', () => {
    const posted = NOW - 20 * 1000; // 20 seconds ago
    act(() => root.render(<RelativeTime at={new Date(posted).toISOString()} />));
    expect(host.textContent).toBe('Just now');
    // 15:00:30 -> 15:01:00 is the next minute boundary: 50s old, rounds to 1m.
    act(() => { vi.advanceTimersByTime(30 * 1000); });
    expect(host.textContent).toBe('1m ago');
    act(() => { vi.advanceTimersByTime(60 * 1000); });
    expect(host.textContent).toBe('2m ago');
  });

  it('shares one timer between every time on screen', () => {
    const seen = [];
    function Probe({ id }) { const now = useMinuteNow(); seen.push([id, now]); return null; }
    act(() => root.render(<><Probe id="a" /><Probe id="b" /></>));
    expect(vi.getTimerCount()).toBe(1);
    seen.length = 0;
    act(() => { vi.advanceTimersByTime(30 * 1000); });
    const [a, b] = [seen.find(([id]) => id === 'a'), seen.find(([id]) => id === 'b')];
    expect(a[1]).toBe(b[1]);
    expect(a[1]).toBe(NOW + 30 * 1000);
  });

  it('stops its timer when nothing shows a time', () => {
    function Probe() { useMinuteNow(); return null; }
    act(() => root.render(<Probe />));
    expect(vi.getTimerCount()).toBe(1);
    act(() => root.render(null));
    expect(vi.getTimerCount()).toBe(0);
  });

  it('catches up when the tab comes back', () => {
    const posted = NOW - 20 * 1000;
    act(() => root.render(<RelativeTime at={new Date(posted).toISOString()} />));
    // The tab sat in the background (timers throttled) for 5 minutes.
    vi.setSystemTime(NOW + 5 * 60 * 1000);
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
    expect(host.textContent).toBe('5m ago');
  });
});
