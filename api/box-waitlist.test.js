import { describe, expect, it } from 'vitest';
import { buildWaitlistRow } from './box-waitlist.js';

describe('box waitlist', () => {
  it('needs a real-looking email', () => {
    expect(buildWaitlistRow({ email: 'nope' }).error).toBeTruthy();
    expect(buildWaitlistRow({}).error).toBeTruthy();
  });
  it('keeps only email, wants, source and platform', () => {
    const { row } = buildWaitlistRow({ email: ' Me@Example.com ', wants: 'pads   and tea', source: 'you', platform: 'app', extra: 'x' });
    expect(row).toEqual({ email: 'me@example.com', wants: 'pads and tea', source: 'you', platform: 'app' });
  });
  it('drops unknown sources and long text', () => {
    const { row } = buildWaitlistRow({ email: 'a@b.co', wants: 'x'.repeat(400), source: 'evil' });
    expect(row.source).toBeNull();
    expect(row.wants).toHaveLength(300);
  });
});
