// @vitest-environment jsdom
import { StrictMode, act, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useRevealOnce } from './ecoMotion.js';

// Walkthrough P1-30: under StrictMode (double effect run) shelves stayed at
// opacity 0 forever, because the second run skipped anything already marked '0'.
let observers;
class FakeIO {
  constructor(cb) { this.cb = cb; this.els = new Set(); this.live = true; observers.push(this); }
  observe(el) { this.els.add(el); }
  unobserve(el) { this.els.delete(el); }
  disconnect() { this.live = false; this.els.clear(); }
  fire() { this.cb([...this.els].map((target) => ({ target, isIntersecting: true }))); }
}

function Shelves({ n = 2 }) {
  const ref = useRef(null);
  useRevealOnce(ref, '.shelf');
  return <div ref={ref}>{Array.from({ length: n }, (_, i) => <section key={i} className="shelf">Shelf {i}</section>)}</div>;
}

let host; let root;
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  observers = [];
  vi.stubGlobal('IntersectionObserver', FakeIO);
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
  window.matchMedia = () => ({ matches: false });
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); vi.unstubAllGlobals(); });

describe('useRevealOnce', () => {
  it('still reveals every shelf after a StrictMode double mount', () => {
    act(() => root.render(<StrictMode><Shelves /></StrictMode>));
    const live = observers.filter((o) => o.live);
    expect(live).toHaveLength(1);
    // Every waiting shelf is watched by the observer that is still running.
    expect(live[0].els.size).toBe(2);
    act(() => live[0].fire());
    host.querySelectorAll('.shelf').forEach((el) => expect(el.getAttribute('data-eco-in')).toBe('1'));
  });

  it('drops the hiding switch on cleanup, so nothing can stay hidden', () => {
    act(() => root.render(<Shelves />));
    const box = host.firstChild;
    expect(box.getAttribute('data-eco-anim')).toBe('1');
    act(() => root.render(<span />));
    expect(box.getAttribute('data-eco-anim')).toBe(null);
  });
});
