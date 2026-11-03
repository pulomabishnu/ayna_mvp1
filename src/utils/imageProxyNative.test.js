import { describe, it, expect, vi } from 'vitest';

// Nov 2: in the iOS/Android app a bare /api path points at the phone, so
// proxied product photos never loaded. They must use the real site there.
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => true } }));

describe('product photos in the native app', () => {
  it('proxied photos load from aynahealth.co, not the phone', async () => {
    const { safeProductImageSrc } = await import('./resolveProductImage.js');
    const src = safeProductImageSrc('https://example.com/photo.jpg');
    expect(src).toBe(`https://www.aynahealth.co/api/image-proxy?url=${encodeURIComponent('https://example.com/photo.jpg')}`);
  });
});
