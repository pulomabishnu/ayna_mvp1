// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { installDelight } from './delightRuntime.js';
import { growTransition, sourceFor } from './viewTransition.js';

beforeAll(() => installDelight());
afterEach(() => { document.body.innerHTML = ''; delete document.startViewTransition; window.matchMedia = undefined; });

function feedCard() {
  document.body.innerHTML = '<ul><li><article id="card"><img id="photo" alt=""><button id="open">Read the rest</button></article></li></ul><main id="page"></main>';
  const button = document.getElementById('open');
  button.dispatchEvent(new Event('pointerdown', { bubbles: true }));
  return button;
}

describe('growTransition', () => {
  it('just runs the update without View Transitions', () => {
    feedCard();
    const update = vi.fn();
    growTransition(update, { target: 'post' });
    expect(update).toHaveBeenCalledTimes(1);
  });

  it('just runs the update under reduced motion', () => {
    feedCard();
    window.matchMedia = (q) => ({ matches: q.includes('reduce') });
    document.startViewTransition = vi.fn();
    const update = vi.fn();
    growTransition(update, { target: 'post' });
    expect(update).toHaveBeenCalledTimes(1);
    expect(document.startViewTransition).not.toHaveBeenCalled();
  });

  it('morphs the tapped card into the opened element, then clears the names', async () => {
    feedCard();
    // jsdom has no layout: treat every element as rendered.
    vi.spyOn(Element.prototype, 'getClientRects').mockReturnValue([{}]);
    let finish;
    const finished = new Promise((r) => { finish = r; });
    let seenDuringSnapshot = '';
    document.startViewTransition = vi.fn((cb) => {
      seenDuringSnapshot = document.getElementById('card').style.viewTransitionName;
      cb();
      return { finished };
    });
    growTransition(() => {
      document.getElementById('page').innerHTML = '<article id="detail" data-vt-target="post"></article>';
    }, { target: 'post' });
    expect(seenDuringSnapshot).toBe('ay-grow');
    expect(document.getElementById('card').style.viewTransitionName).toBe('');
    expect(document.getElementById('detail').style.viewTransitionName).toBe('ay-grow');
    expect(document.documentElement.hasAttribute('data-ay-vt')).toBe(true);
    finish();
    await finished; await Promise.resolve();
    expect(document.getElementById('detail').style.viewTransitionName).toBe('');
    expect(document.documentElement.hasAttribute('data-ay-vt')).toBe(false);
    vi.restoreAllMocks();
  });

  it('starts from the photo for products', () => {
    const button = feedCard();
    expect(sourceFor(button, 'img').id).toBe('photo');
    expect(sourceFor(button).id).toBe('card');
  });
});
