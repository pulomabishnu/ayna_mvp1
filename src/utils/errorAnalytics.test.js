import { describe, it, expect } from 'vitest';
import { redactErrorMessage, componentFromStack, appErrorProperties } from './errorAnalytics';

describe('redactErrorMessage', () => {
  it('keeps the shape of ordinary errors', () => {
    expect(redactErrorMessage("Cannot read properties of undefined (reading 'map')")).toBe('Cannot read properties of undefined (reading "…")');
  });
  it('removes quoted user text, emails, urls, query strings, ids and long numbers', () => {
    const out = redactErrorMessage('No match for "vaginal dryness" from jane@x.com at https://aynahealth.co/shop?q=uti id 3f2a9c1e-1111-2222-3333-444455556666 phone 3474435696');
    expect(out).not.toMatch(/vaginal|jane|aynahealth|uti|3f2a9c1e|3474435696/);
    expect(out).toContain('[email]');
    expect(out).toContain('[url]');
  });
  it('caps the length', () => {
    expect(redactErrorMessage('x '.repeat(500)).length).toBeLessThanOrEqual(160);
  });
  it('handles empty input', () => {
    expect(redactErrorMessage(undefined)).toBe('');
  });
});

describe('componentFromStack', () => {
  it('returns the nearest named component', () => {
    expect(componentFromStack('\n    at ProductCard (https://x/a.js:1:2)\n    at Discovery (https://x/b.js:3:4)')).toBe('ProductCard');
  });
  it('skips wrappers and minified names', () => {
    expect(componentFromStack('\n    at Suspense\n    at aB (x.js)\n    at WebDiscoverDeck (x.js)')).toBe('WebDiscoverDeck');
  });
  it('supports the older "in X" format', () => {
    expect(componentFromStack('\n    in MyEcosystem (created by App)')).toBe('MyEcosystem');
  });
});

describe('appErrorProperties', () => {
  it('builds the event payload without a `message` key', () => {
    const err = Object.assign(new TypeError("x is not a function in 'pcos search'"), { status: 500, code: 'E1' });
    const props = appErrorProperties(err, { componentStack: '\n    at Discovery (a.js)' });
    expect(props).toMatchObject({ errorName: 'TypeError', component: 'Discovery', isChunkLoadError: false, status: 500, errorCode: 'E1' });
    expect(props.errorMessage).not.toMatch(/pcos/);
    expect(props).not.toHaveProperty('message');
  });
  it('falls back to the current screen when the stack has no usable name', () => {
    const props = appErrorProperties(new Error('boom'), { componentStack: '\n    at Xe (a.js)' }, { view: 'discovery' });
    expect(props).toMatchObject({ component: 'discovery', view: 'discovery' });
  });
});
