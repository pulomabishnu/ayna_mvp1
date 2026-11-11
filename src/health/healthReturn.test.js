// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest';
import { rememberHealthReturn, takeHealthReturn } from './healthReturn.js';

describe('health connect return spot', () => {
  beforeEach(() => { try { sessionStorage.clear(); } catch { /* none */ } });
  it('gives the screen back once', () => {
    rememberHealthReturn('connect');
    expect(takeHealthReturn()).toEqual({ screen: 'connect' });
    expect(takeHealthReturn()).toBeNull();
  });
  it('forgets after 15 minutes', () => {
    rememberHealthReturn('today');
    expect(takeHealthReturn(Date.now() + 16 * 60 * 1000)).toBeNull();
  });
});
