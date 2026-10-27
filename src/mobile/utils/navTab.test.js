import { describe, it, expect } from 'vitest';
import { navTabFor, aynaRoute, homeScreenFor, showsEmptyHome } from './navTab.js';
import { routeForPush } from '../hooks/usePushNotifications.js';

describe('navTabFor', () => {
  it('puts each screen under its main tab', () => {
    expect(navTabFor('ayna')).toBe('home');
    expect(navTabFor('today')).toBe('home');
    // Signed out, the landing is the Home tab (founder, Oct 27 01:10).
    expect(navTabFor('landing')).toBe('home');
    // Ask ayna is its own tab again (all-pages brief, Oct 25): the chat view, or the old 'ask' key.
    expect(navTabFor('ask')).toBe('ask');
    expect(navTabFor('ayna', null, { view: 'chat' })).toBe('ask');
    expect(navTabFor('ayna', null, { view: 'home' })).toBe('home');
    // Chat-first Home (?home=chat): the chat is home.
    expect(navTabFor('ayna', null, { view: 'chat', variant: 'chat' })).toBe('home');
    expect(navTabFor('explore')).toBe('explore');
    expect(navTabFor('browse')).toBe('explore');
    // Today · Shop · Services · Community · Library (founder, Oct 26): Shop keeps the 'explore' key.
    expect(navTabFor('explore', null, { section: 'services' })).toBe('services');
    expect(navTabFor('explore', null, { section: 'products' })).toBe('explore');
    expect(navTabFor('library')).toBe('library');
    expect(navTabFor('explore', null, { section: 'resources' })).toBe('library');
    expect(navTabFor('community')).toBe('community');
    expect(navTabFor('eco')).toBe('profile');
    expect(navTabFor('saved')).toBe('profile');
    expect(navTabFor('browse', 'profile')).toBe('profile');
    expect(navTabFor('quiz')).toBe(null);
  });
});

describe('aynaRoute (old screens keep working)', () => {
  it('maps Today and ayna to Home, Ask to the chat; the chat-first Home keeps its own views', () => {
    expect(aynaRoute('today')).toEqual({ screen: 'ayna', view: 'home' });
    expect(aynaRoute('ayna')).toEqual({ screen: 'ayna', view: 'home' });
    expect(aynaRoute('ask')).toEqual({ screen: 'ayna', view: 'chat' });
    expect(aynaRoute('ayna', 'chat')).toEqual({ screen: 'ayna', view: 'chat' });
    expect(aynaRoute('today', 'chat')).toEqual({ screen: 'ayna', view: 'dashboard' });
    expect(aynaRoute('explore')).toEqual({ screen: 'explore', view: null });
  });
});

describe('routeForPush', () => {
  it('opens Today for a Today reminder and the product for a recall alert', () => {
    expect(routeForPush({ route: 'today' })).toEqual({ screen: 'today' });
    expect(routeForPush({ type: 'recall', productId: 42 })).toEqual({ screen: 'product', productId: '42' });
    expect(routeForPush({ type: 'broadcast' })).toBe(null);
    expect(routeForPush(null)).toBe(null);
  });
});

// Founder, Oct 27 11:38: signed out, the app stays on the landing, never an empty dashboard.
describe('Home signed out', () => {
  it('Home is the landing signed out with nothing on this phone, and the dashboard otherwise', () => {
    expect(homeScreenFor({})).toBe('landing');
    expect(homeScreenFor({ signedIn: false, hasProfile: false, pendingQuiz: false })).toBe('landing');
    expect(homeScreenFor({ signedIn: true })).toBe('ayna');
    expect(homeScreenFor({ hasProfile: true })).toBe('ayna');
    expect(homeScreenFor({ pendingQuiz: true })).toBe('ayna');
  });
  it('the dashboard shown signed out (a late auth answer, a swipe, Back, a stale session) is caught', () => {
    expect(showsEmptyHome({ screen: 'ayna', view: 'home' })).toBe(true);
    expect(showsEmptyHome({ screen: 'ayna', view: 'dashboard' })).toBe(true);
    expect(showsEmptyHome({ screen: 'today' })).toBe(true);
    // the Ask tab (Home's chat view) is fine signed out
    expect(showsEmptyHome({ screen: 'ayna', view: 'chat' })).toBe(false);
    expect(showsEmptyHome({ screen: 'landing' })).toBe(false);
    expect(showsEmptyHome({ screen: 'explore' })).toBe(false);
    expect(showsEmptyHome({ screen: 'ayna', view: 'home', signedIn: true })).toBe(false);
    expect(showsEmptyHome({ screen: 'ayna', view: 'home', hasProfile: true })).toBe(false);
  });
});
