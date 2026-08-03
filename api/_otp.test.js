/* global process */
import { describe, it, expect, beforeEach } from 'vitest';
import { hashCode, codeMatches, generateCode, normalizeE164 } from './_otp.js';

// pepper() is read on every call, so setting the env var between assertions is enough.
describe('OTP hashing', () => {
  beforeEach(() => {
    process.env.OTP_PEPPER = 'pepper-A';
    process.env.SMS_ALLOWED_COUNTRY_CODES = '1';
  });

  it('is NOT reproducible without the server pepper (defeats the offline crack)', () => {
    const uid = '019f23fa-2ddc-7baf-b219-bf4b5c6dceb4';
    const withA = hashCode('123456', uid);
    process.env.OTP_PEPPER = 'pepper-B';
    const withB = hashCode('123456', uid);
    expect(withA).not.toBe(withB);
  });

  it('differs from the old unpeppered sha256 scheme', async () => {
    const crypto = await import('crypto');
    const uid = 'user-1';
    const old = crypto.createHash('sha256').update(`${uid}:123456`).digest('hex');
    expect(hashCode('123456', uid)).not.toBe(old);
  });

  it('accepts the correct code and rejects a wrong one', () => {
    const stored = hashCode('654321', 'user-1');
    expect(codeMatches('654321', 'user-1', stored)).toBe(true);
    expect(codeMatches('654322', 'user-1', stored)).toBe(false);
  });

  it('is bound to the user id, so a code cannot be replayed across accounts', () => {
    const stored = hashCode('111111', 'user-1');
    expect(codeMatches('111111', 'user-2', stored)).toBe(false);
  });

  it('does not throw on a malformed stored hash', () => {
    expect(codeMatches('111111', 'user-1', '')).toBe(false);
    expect(codeMatches('111111', 'user-1', 'short')).toBe(false);
    expect(codeMatches('111111', 'user-1', null)).toBe(false);
  });

  it('generates a 6-digit code', () => {
    for (let i = 0; i < 200; i++) expect(generateCode()).toMatch(/^\d{6}$/);
  });
});

describe('normalizeE164 country allowlist (IRSF / toll fraud)', () => {
  beforeEach(() => { process.env.SMS_ALLOWED_COUNTRY_CODES = '1'; });

  it('rejects premium-rate international numbers that were previously accepted', () => {
    expect(normalizeE164('+8869123456789')).toBeNull();
    expect(normalizeE164('+23480123456789')).toBeNull();
  });

  it('accepts US numbers in the formats the UI produces', () => {
    expect(normalizeE164('5551234567')).toBe('+15551234567');
    expect(normalizeE164('(555) 123-4567')).toBe('+15551234567');
    expect(normalizeE164('+15551234567')).toBe('+15551234567');
  });

  it('honours an explicit widened allowlist', () => {
    process.env.SMS_ALLOWED_COUNTRY_CODES = '1,44';
    expect(normalizeE164('+447700900123')).toBe('+447700900123');
  });
});
