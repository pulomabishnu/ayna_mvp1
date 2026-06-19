import React, { useState } from 'react';

const AYNA_SMS_NUMBER = import.meta.env.VITE_AYNA_SMS_NUMBER || '';

const CONSENT_TEXT =
  'By texting Ayna, you agree that your messages will be used to give you personalized health information. ' +
  'Standard text message rates may apply. Reply STOP at any time to stop receiving texts.';

async function callApi(path, body, authToken) {
  const res = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify(body),
  });
  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  if (!res.ok) {
    throw new Error(data?.error || `HTTP ${res.status}`);
  }
  return data;
}

const ERROR_MESSAGES = {
  invalid_phone_number: 'Please enter a valid 10-digit phone number.',
  rate_limited: 'Too many attempts. Please try again in an hour.',
  twilio_send_failed: "We couldn't send a code right now. Please try again.",
  twilio_check_failed: "We couldn't check that code right now. Please try again.",
  invalid_or_expired_code: 'That code is wrong or expired. Please try again.',
  code_required: 'Please enter the code we texted you.',
  phone_already_linked: 'That phone number is already linked to another account.',
  auth_required: 'Please sign in first.',
};

function friendlyError(code) {
  return ERROR_MESSAGES[code] || 'Something went wrong. Please try again.';
}

export default function PhoneVerification({ userSession, onVerified, onCancel }) {
  const [step, setStep] = useState('phone'); // 'phone' | 'code' | 'done'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const authToken = userSession?.access_token;

  const handleSendCode = async () => {
    setError('');
    setSending(true);
    try {
      await callApi('/api/phone-verify-send', { phoneNumber }, authToken);
      setStep('code');
    } catch (e) {
      setError(friendlyError(e.message));
    } finally {
      setSending(false);
    }
  };

  const handleConfirmCode = async () => {
    setError('');
    setSending(true);
    try {
      await callApi('/api/phone-verify-confirm', { phoneNumber, code }, authToken);
      setStep('done');
      onVerified?.(phoneNumber);
    } catch (e) {
      setError(friendlyError(e.message));
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="container animate-fade-in-up" style={{ padding: 'var(--spacing-xl) var(--spacing-md)', maxWidth: '560px' }}>
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Text Ayna</h2>
          <button type="button" className="btn btn-outline" onClick={onCancel}>Back</button>
        </div>

        {step === 'phone' && (
          <>
            <p style={{ color: 'var(--color-text-muted)' }}>
              Get personalized health texts from Ayna anytime, without opening the app. Enter your phone number to get started.
            </p>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span>Phone number</span>
              <input
                type="tel"
                placeholder="(555) 555-5555"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                style={{ padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '1rem' }}
              />
            </label>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.75rem' }}>{CONSENT_TEXT}</p>
            {error && <p style={{ color: '#b42318', fontSize: '0.85rem' }}>{error}</p>}
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSendCode}
              disabled={sending || !phoneNumber.trim()}
              style={{ marginTop: '0.75rem' }}
            >
              {sending ? 'Sending…' : 'Send code'}
            </button>
          </>
        )}

        {step === 'code' && (
          <>
            <p style={{ color: 'var(--color-text-muted)' }}>
              We texted a code to {phoneNumber}. Enter it below.
            </p>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span>Verification code</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                style={{ padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '1rem' }}
              />
            </label>
            {error && <p style={{ color: '#b42318', fontSize: '0.85rem' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
              <button type="button" className="btn btn-outline" onClick={() => setStep('phone')}>Change number</button>
              <button type="button" className="btn btn-primary" onClick={handleConfirmCode} disabled={sending || !code.trim()}>
                {sending ? 'Verifying…' : 'Verify'}
              </button>
            </div>
          </>
        )}

        {step === 'done' && (
          <>
            <p style={{ color: 'var(--color-text-main)', fontWeight: 600 }}>You're all set!</p>
            {AYNA_SMS_NUMBER && (
              <p style={{ fontSize: '1.1rem', margin: '0.5rem 0' }}>{AYNA_SMS_NUMBER}</p>
            )}
            <p style={{ color: 'var(--color-text-muted)' }}>
              Try texting: "what helps with PCOS bloating"
            </p>
            <button type="button" className="btn btn-primary" onClick={onCancel} style={{ marginTop: '0.75rem' }}>
              Done
            </button>
          </>
        )}
      </div>
    </section>
  );
}
