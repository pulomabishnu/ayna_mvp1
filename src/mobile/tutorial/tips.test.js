import { describe, expect, it } from 'vitest';
import { SCREENS, screenById, tourDecision, tipsToShow, rundownSettled, OFF_NOTE } from './tips.js';
import { readTour, setTipsEnabled, markScreenSeen, replayTour, setTourOwner, mergeTourPrefs, TOUR_KEY } from './tourStore.js';

function mem() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), _m: m };
}
const T = '2026-10-25';
const home = screenById('home');
const explore = screenById('explore');
const fresh = { enabled: null, seen: {}, welcomeDay: null, offNoteShown: false };

describe('tour store', () => {
  it('starts unasked and remembers the answer', () => {
    const s = mem();
    expect(readTour(s)).toEqual(fresh);
    setTipsEnabled(true, s);
    expect(readTour(s).enabled).toBe(true);
    setTipsEnabled(false, s);
    expect(readTour(s).enabled).toBe(false);
    expect(s._m.has(TOUR_KEY)).toBe(true);
  });
  it('marks screens seen and replay clears them and turns tips on', () => {
    const s = mem();
    setTipsEnabled(false, s);
    markScreenSeen('home', new Date(), s);
    expect(readTour(s).seen.home).toBeTruthy();
    replayTour(s);
    expect(readTour(s)).toMatchObject({ enabled: true, seen: {}, offNoteShown: false });
  });
  it('is per person: signing in folds device answers in, another person starts fresh', () => {
    const s = mem();
    setTipsEnabled(true, s);
    markScreenSeen('explore', new Date(), s);
    setTourOwner('u1', s);
    expect(readTour(s)).toMatchObject({ enabled: true });
    expect(readTour(s).seen.explore).toBeTruthy();
    setTourOwner(null, s);
    expect(readTour(s)).toEqual(fresh);
    setTourOwner('u2', s);
    expect(readTour(s)).toEqual(fresh);
    setTourOwner('u1', s);
    expect(readTour(s).enabled).toBe(true);
  });
  it('merge keeps her own choice over the device one', () => {
    expect(mergeTourPrefs({ enabled: false }, { enabled: true, seen: { home: 'x' } })).toMatchObject({ enabled: false, seen: { home: 'x' } });
  });
  it('survives blocked storage for the session', () => {
    const blocked = { getItem: () => { throw new Error('x'); }, setItem: () => { throw new Error('x'); } };
    setTipsEnabled(true, blocked);
    expect(readTour(blocked).enabled).toBe(true);
  });
});

describe('first visit logic', () => {
  it('offers the welcome only on Home, once a day, while unasked', () => {
    expect(tourDecision({ screen: home, prefs: fresh, today: T })).toEqual({ kind: 'welcome' });
    expect(tourDecision({ screen: explore, prefs: fresh, today: T }).kind).toBe('none');
    expect(tourDecision({ screen: home, prefs: { ...fresh, welcomeDay: T }, today: T }).kind).toBe('none');
    expect(tourDecision({ screen: home, prefs: { ...fresh, welcomeDay: '2026-10-24' }, today: T }).kind).toBe('welcome');
  });
  it('shows a screen’s tips the first time only', () => {
    const on = { ...fresh, enabled: true };
    expect(tourDecision({ screen: explore, prefs: on, today: T })).toMatchObject({ kind: 'tips' });
    expect(tourDecision({ screen: explore, prefs: { ...on, seen: { explore: 'x' } }, today: T }).kind).toBe('none');
  });
  it('opt-out: No thanks or Turn off tips means nothing shows', () => {
    const off = { ...fresh, enabled: false };
    for (const s of SCREENS) expect(tourDecision({ screen: s, prefs: off, today: T }).kind).toBe('none');
  });
  it('never during onboarding or over another dialog', () => {
    const on = { ...fresh, enabled: true };
    expect(tourDecision({ screen: home, prefs: on, today: T, onboarding: true }).kind).toBe('none');
    expect(tourDecision({ screen: explore, prefs: on, today: T, foreignDialog: true }).kind).toBe('none');
  });
});

describe('no collision with the Daily Rundown', () => {
  const nine = new Date(2026, 9, 25, 9, 0);
  it('waits on Home while the Rundown could still open on its own', () => {
    expect(rundownSettled({ memory: {}, today: T, now: nine, settledMs: 500 })).toBe(false);
    expect(tourDecision({ screen: home, prefs: fresh, today: T, settled: false }).kind).toBe('none');
  });
  it('goes ahead once the Rundown was viewed today, before 8, right after setup, or after the check passed', () => {
    expect(rundownSettled({ memory: { viewedDay: T }, today: T, now: nine })).toBe(true);
    expect(rundownSettled({ memory: { autoDay: T }, today: T, now: nine })).toBe(true);
    expect(rundownSettled({ memory: {}, today: T, now: new Date(2026, 9, 25, 7, 30) })).toBe(true);
    expect(rundownSettled({ memory: {}, today: T, now: nine, justOnboarded: true })).toBe(true);
    expect(rundownSettled({ memory: {}, today: T, now: nine, settledMs: 2000 })).toBe(true);
  });
  it('never shows while the Rundown story is open', () => {
    expect(tourDecision({ screen: home, prefs: { ...fresh, enabled: true }, today: T, rundownOpen: true }).kind).toBe('none');
  });
});

describe('tips to show', () => {
  it('skips a tip whose anchor is missing and keeps the rest in order', () => {
    const list = tipsToShow(home, (sel) => !sel.includes('rundown-card'));
    expect(list.map((t) => t.id)).toEqual(['home-ask', 'home-links']);
  });
  it('never more than 2 on a screen', () => {
    expect(tipsToShow(home, () => true).map((t) => t.id)).toEqual(['home-ask', 'home-rundown']);
  });
  it('nothing usable means nothing to show', () => {
    expect(tipsToShow(home, () => false)).toEqual([]);
  });
  it('the first tip ever says where to turn tips off, only once', () => {
    expect(tipsToShow(explore, () => true)[0].offNote).toBe(OFF_NOTE);
    expect(tipsToShow(explore, () => true, { offNoteShown: true })[0].offNote).toBeUndefined();
  });
});

describe('copy', () => {
  it('is short, plain and follows the rules', () => {
    for (const s of SCREENS) {
      expect(s.tips.length).toBeGreaterThan(0);
      expect(s.tips.length).toBeLessThanOrEqual(3);
      for (const t of s.tips) {
        expect(t.text).not.toMatch(/[—–]/);
        expect(t.text).not.toMatch(/chatbot|agent/i);
        expect(t.text.split(/\s+/).length).toBeLessThanOrEqual(12);
        expect(t.text.match(/[.!?]/g)).toHaveLength(1); // one sentence
        expect(t.text[0]).toBe(t.text[0].toUpperCase());
      }
    }
  });
});
