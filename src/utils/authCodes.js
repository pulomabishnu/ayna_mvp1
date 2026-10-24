/**
 * One sign-in code experience on the app and the website (team direction 55).
 *
 * Email: Supabase emails an 8-digit code when an account is created (the
 * website has typed it since 2026-09; the app used to wait for a link only).
 * SMS: Supabase phone sign-in and the Twilio Verify reminders number check
 * both text a 6-digit code (api/sms.js).
 *
 * Same lengths, same cleaning and the same words everywhere.
 */
export const EMAIL_CODE_LENGTH = 8;
export const SMS_CODE_LENGTH = 6;

/** Digits only, cut to the code's length (pasting "1234 5678" or "Code: 123456" works). */
export const cleanCode = (raw, length) => String(raw || '').replace(/\D/g, '').slice(0, length);

export const CODE_COPY = {
  emailSent: (email) => `We sent an ${EMAIL_CODE_LENGTH}-digit code to ${email}. Enter it below to finish creating your account.`,
  emailNotConfirmed: 'Your email still needs verifying. Enter the code from your email below.',
  emailPrompt: `Enter the ${EMAIL_CODE_LENGTH}-digit code from your email.`,
  emailPlaceholder: `${EMAIL_CODE_LENGTH}-digit code`,
  smsPrompt: `Enter the ${SMS_CODE_LENGTH}-digit code we texted you.`,
  smsPlaceholder: `${SMS_CODE_LENGTH}-digit code`,
  wrongOrExpired: 'That code is wrong or expired. Request a new code and try again.',
  resent: 'New code sent. Check your inbox and spam folder.',
  verified: 'Email verified. Signing you in.',
  noSession: 'Your email was verified, but we could not sign you in. Please sign in with your password.',
};

/** Friendly message for a code error from Supabase or our APIs. */
export function codeErrorText(err) {
  const msg = String(err?.message || err?.code || err || '');
  if (/expired|invalid|token|wrong|otp/i.test(msg)) return CODE_COPY.wrongOrExpired;
  return msg || CODE_COPY.wrongOrExpired;
}

/** Whether a Supabase sign-in error means "account exists, email not verified yet". */
export const isEmailNotConfirmed = (err) => err?.code === 'email_not_confirmed' || /email[_ ]not[_ ]confirmed|confirm your email|not verified/i.test(err?.message || '');

/**
 * Check an emailed sign-up code. Returns the session data, or throws an
 * Error whose message is already user-facing.
 */
export async function verifyEmailCode(supabase, email, raw) {
  const token = cleanCode(raw, EMAIL_CODE_LENGTH);
  if (token.length !== EMAIL_CODE_LENGTH) throw new Error(CODE_COPY.emailPrompt);
  if (!supabase) throw new Error('Sign-in is not configured right now.');
  const { data, error } = await supabase.auth.verifyOtp({ email: String(email || '').trim().toLowerCase(), token, type: 'email' });
  if (error) throw new Error(codeErrorText(error));
  if (!data?.session) throw new Error(CODE_COPY.noSession);
  return data;
}
