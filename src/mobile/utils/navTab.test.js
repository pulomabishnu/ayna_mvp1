import { describe, it, expect } from 'vitest';
import { navTabFor, aynaRoute, homeScreenFor, showsEmptyHome, webHomeView } from './navTab.js';
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

// Founder, Oct 27 11:38 and 13:46: signed out, Home is the landing on the app and
// the website, whatever this phone or browser kept from earlier visits.
describe('Home signed out', () => {
  it('Home is the landing whenever she is signed out, the dashboard when signed in', () => {
    expect(homeScreenFor({})).toBe('landing');
    expect(homeScreenFor({ signedIn: false })).toBe('landing');
    expect(homeScreenFor({ signedIn: true })).toBe('ayna');
    // Leftover answers, an ecosystem or a waiting quiz on the device no longer open the dashboard.
    expect(homeScreenFor({ hasProfile: true })).toBe('landing');
    expect(homeScreenFor({ pendingQuiz: true })).toBe('landing');
    expect(homeScreenFor({ signedIn: false, hasProfile: true, pendingQuiz: true })).toBe('landing');
  });
  it('the dashboard shown signed out (cold load, reload, a swipe, Back, after signing out) is caught', () => {
    expect(showsEmptyHome({ screen: 'ayna', view: 'home' })).toBe(true);
    expect(showsEmptyHome({ screen: 'ayna', view: 'dashboard' })).toBe(true);
    expect(showsEmptyHome({ screen: 'today' })).toBe(true);
    expect(showsEmptyHome({ screen: 'ayna', view: 'home', hasProfile: true })).toBe(true);
    expect(showsEmptyHome({ screen: 'ayna', view: 'home', hasProfile: true, pendingQuiz: true })).toBe(true);
    // the Ask tab (Home's chat view) is fine signed out
    expect(showsEmptyHome({ screen: 'ayna', view: 'chat' })).toBe(false);
    expect(showsEmptyHome({ screen: 'landing' })).toBe(false);
    expect(showsEmptyHome({ screen: 'explore' })).toBe(false);
    // her matches after the quiz (My ecosystem) are not Home
    expect(showsEmptyHome({ screen: 'eco' })).toBe(false);
    expect(showsEmptyHome({ screen: 'ecointro' })).toBe(false);
    expect(showsEmptyHome({ screen: 'ayna', view: 'home', signedIn: true })).toBe(false);
  });
  it('the website Home tab always opens the ecosystem, with a setup lock for guests', () => {
    expect(webHomeView({})).toBe('ecosystem');
    expect(webHomeView({ signedIn: false })).toBe('ecosystem');
    expect(webHomeView({ signedIn: true })).toBe('ecosystem');
    expect(webHomeView({ signedIn: false, authLoading: true })).toBe('ecosystem');
  });
});
