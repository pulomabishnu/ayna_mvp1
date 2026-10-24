import { describe, expect, it } from 'vitest';
import { autoLaunchDecision, noteExternalOpen, openedExternally, urlIsDeepLink } from './autoLaunch.js';

const T = '2026-10-24';
const at = (h, m = 0) => new Date(2026, 9, 24, h, m);
const base = { today: T, hasContent: true, memory: {}, surface: 'app' };

describe('Daily Rundown auto-launch', () => {
  it('first open at or after 8 opens it; before 8 never', () => {
    expect(autoLaunchDecision({ ...base, now: at(7, 59) })).toBe('none');
    expect(autoLaunchDecision({ ...base, now: at(8, 0) })).toBe('open');
    expect(autoLaunchDecision({ ...base, now: at(21) })).toBe('open');
  });
  it('once a day: viewed, skipped or already auto-opened today means never again', () => {
    expect(autoLaunchDecision({ ...base, now: at(9), memory: { viewedDay: T } })).toBe('none');
    expect(autoLaunchDecision({ ...base, now: at(9), memory: { autoDay: T } })).toBe('none');
    expect(autoLaunchDecision({ ...base, now: at(9), memory: { viewedDay: '2026-10-23' } })).toBe('open');
  });
  it('only with real content', () => {
    expect(autoLaunchDecision({ ...base, hasContent: false, now: at(9) })).toBe('none');
  });
  it('never hijacks a deep link, onboarding or another dialog', () => {
    expect(autoLaunchDecision({ ...base, now: at(9), externalOpen: true })).toBe('none');
    expect(autoLaunchDecision({ ...base, now: at(9), firstTime: true })).toBe('none');
    expect(autoLaunchDecision({ ...base, now: at(9), dialogOpen: true })).toBe('none');
  });
  it('website and reduced motion: highlight the card, no full screen', () => {
    expect(autoLaunchDecision({ ...base, now: at(9), surface: 'web' })).toBe('highlight');
    expect(autoLaunchDecision({ ...base, now: at(9), reducedMotion: true })).toBe('highlight');
  });
  it('external opens and deep links are recognised', () => {
    noteExternalOpen(1000);
    expect(openedExternally(1000 + 5000)).toBe(true);
    expect(openedExternally(1000 + 60000)).toBe(false);
    expect(urlIsDeepLink('?product=p-thermacare')).toBe(true);
    expect(urlIsDeepLink('?screen=eco')).toBe(false);
  });
});
