import { describe, it, expect } from 'vitest';
import { navTabFor } from './navTab.js';
import { routeForPush } from '../hooks/usePushNotifications.js';

describe('navTabFor', () => {
  it('puts each screen under its main tab', () => {
    expect(navTabFor('today')).toBe('today');
    expect(navTabFor('explore')).toBe('explore');
    expect(navTabFor('browse')).toBe('explore');
    expect(navTabFor('library')).toBe('explore');
    expect(navTabFor('ask')).toBe('ask');
    expect(navTabFor('community')).toBe('community');
    expect(navTabFor('eco')).toBe('profile');
    expect(navTabFor('saved')).toBe('profile');
    expect(navTabFor('browse', 'profile')).toBe('profile');
    expect(navTabFor('quiz')).toBe(null);
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
