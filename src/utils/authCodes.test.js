import { describe, it, expect, vi } from 'vitest';
import { CODE_COPY, EMAIL_CODE_LENGTH, SMS_CODE_LENGTH, cleanCode, codeErrorText, isEmailNotConfirmed, verifyEmailCode } from './authCodes.js';

describe('one code format on app and web', () => {
  it('uses 8 digits for email and 6 for texts', () => {
    expect(EMAIL_CODE_LENGTH).toBe(8);
    expect(SMS_CODE_LENGTH).toBe(6);
    expect(cleanCode('Code: 1234 5678 9', EMAIL_CODE_LENGTH)).toBe('12345678');
    expect(cleanCode('12-34-56', SMS_CODE_LENGTH)).toBe('123456');
  });
  it('words never use em dashes and say the length', () => {
    for (const v of Object.values(CODE_COPY)) expect(typeof v === 'function' ? v('a@b.co') : v).not.toMatch(/—/);
    expect(CODE_COPY.emailPrompt).toMatch(/8-digit/);
  });
  it('maps Supabase code errors to one message', () => {
    expect(codeErrorText({ message: 'Token has expired or is invalid' })).toBe(CODE_COPY.wrongOrExpired);
    expect(isEmailNotConfirmed({ code: 'email_not_confirmed' })).toBe(true);
    expect(isEmailNotConfirmed({ message: 'Invalid login credentials' })).toBe(false);
  });
  it('verifies an email code with type email and needs a session', async () => {
    const verifyOtp = vi.fn().mockResolvedValue({ data: { session: { user: { id: 'u' } } }, error: null });
    await verifyEmailCode({ auth: { verifyOtp } }, ' A@B.co ', '1234 5678');
    expect(verifyOtp).toHaveBeenCalledWith({ email: 'a@b.co', token: '12345678', type: 'email' });
    await expect(verifyEmailCode({ auth: { verifyOtp } }, 'a@b.co', '123')).rejects.toThrow(CODE_COPY.emailPrompt);
  });
});
