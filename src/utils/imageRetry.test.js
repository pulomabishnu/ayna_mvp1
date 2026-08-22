import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleImageErrorWithRetry } from './imageRetry';

/** Minimal <img>-shaped mock — this repo has no DOM/jsdom test environment. */
function makeImgEvent(src) {
  const img = {
    _src: src,
    dataset: {},
    get src() { return this._src; },
    set src(v) { this._src = v; },
    removeAttribute(name) { if (name === 'src') this._src = ''; },
  };
  return { currentTarget: img, img };
}

describe('handleImageErrorWithRetry', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', (cb) => { cb(); return 0; });
  });

  it('retries the same URL once instead of giving up immediately', () => {
    const { currentTarget: e, img } = makeImgEvent('https://example.com/photo.jpg');
    const onGiveUp = vi.fn();

    handleImageErrorWithRetry({ currentTarget: e }, onGiveUp);

    expect(onGiveUp).not.toHaveBeenCalled();
    expect(img.dataset.retried).toBe('1');
    // src was reassigned back to the same URL after the retry frame
    expect(img.src).toBe('https://example.com/photo.jpg');
  });

  it('gives up only on a SECOND error, after the retry has already happened', () => {
    const { currentTarget: e, img } = makeImgEvent('https://example.com/photo.jpg');
    const onGiveUp = vi.fn();

    handleImageErrorWithRetry({ currentTarget: e }, onGiveUp); // 1st error: retry
    handleImageErrorWithRetry({ currentTarget: e }, onGiveUp); // 2nd error: give up

    expect(onGiveUp).toHaveBeenCalledTimes(1);
    expect(img.dataset.retried).toBe('1');
  });

  it('a spurious one-off error (e.g. a request aborted by tab backgrounding) does not permanently hide the image', () => {
    // This is the actual bug: a transient failure firing `error` once should
    // not be indistinguishable from a genuinely broken URL.
    const { currentTarget: e } = makeImgEvent('https://example.com/photo.jpg');
    const onGiveUp = vi.fn();

    handleImageErrorWithRetry({ currentTarget: e }, onGiveUp);

    expect(onGiveUp).not.toHaveBeenCalled();
  });
});
