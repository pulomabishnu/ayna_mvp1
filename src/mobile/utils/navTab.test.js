import { describe, it, expect } from 'vitest';
import { navTabFor, aynaRoute } from './navTab.js';
import { routeForPush } from '../hooks/usePushNotifications.js';

describe('navTabFor', () => {
  it('puts each screen under its main tab', () => {
    expect(navTabFor('ayna')).toBe('home');
    expect(navTabFor('today')).toBe('home');
    expect(navTabFor('ask')).toBe('home');
    expect(navTabFor('explore')).toBe('explore');
    expect(navTabFor('browse')).toBe('explore');
    // The Library is pushed from Explore, not a tab.
    expect(navTabFor('library')).toBe('explore');
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
