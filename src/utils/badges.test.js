import { describe, it, expect } from 'vitest';
import { computeBadges, referralCodeFor, inviteLinkFor } from './badges.js';

describe('badges', () => {
  it('has exactly the four badges, locked by default', () => {
    const b = computeBadges();
    expect(b.map((x) => x.label)).toEqual(['First purchase', 'Full ecosystem', 'First post', 'Brought 3 friends']);
    expect(b.every((x) => !x.earned)).toBe(true);
    expect(b.find((x) => x.key === 'friends').progress).toEqual({ value: 0, goal: 3 });
  });
  it('earns from real signals', () => {
    const b = computeBadges({ boughtOnce: true, eco: { filled: 3, total: 3 }, hasPosted: true, referrals: { joined: 5, qualified: 4 } });
    expect(b.every((x) => x.earned)).toBe(true);
    expect(computeBadges({ eco: { filled: 2, total: 3 } }).find((x) => x.key === 'ecosystem').earned).toBe(false);
    expect(computeBadges({ eco: { filled: 0, total: 0 } }).find((x) => x.key === 'ecosystem').earned).toBe(false);
  });
  it('derives a stable invite code from the user id', () => {
    expect(referralCodeFor('3F2A9C1E-1234-5678-9abc-def012345678')).toBe('3f2a9c1e12');
    expect(referralCodeFor('')).toBeNull();
    expect(inviteLinkFor('3f2a9c1e-1234-5678-9abc-def012345678', 'https://x.test')).toBe('https://x.test/?ref=3f2a9c1e12');
  });
});
