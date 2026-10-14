import React, { useState } from 'react';
import { InfoPage } from './InfoPage';

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
    <InfoPage tone="sky"
      eyebrow="By text"
      title="Text ayna"
      lede="Get personalized health texts from ayna anytime, without opening the app."
      onBack={onCancel}
      width="narrow"
    >
      <div className="ay-info-card ay-info-card--pad ay-info-form">
        {step === 'phone' && (
          <>
            <div className="ay-info-field">
              <label htmlFor="text-ayna-phone">Phone number</label>
              <input
                id="text-ayna-phone"
                type="tel"
                autoComplete="tel"
                placeholder="(555) 555-5555"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
            <p className="ay-info__small">{CONSENT_TEXT}</p>
            {error && <div role="alert" className="ay-info-notice ay-info-notice--err">{error}</div>}
            <button
              type="button"
              className="ay-info-btn ay-info-btn--block"
              onClick={handleSendCode}
              disabled={sending || !phoneNumber.trim()}
            >
              {sending ? 'Sending…' : 'Send code'}
            </button>
          </>
        )}

        {step === 'code' && (
          <>
            <p className="ay-info__body">We texted a code to {phoneNumber}. Enter it below.</p>
            <div className="ay-info-field">
              <label htmlFor="text-ayna-code">Verification code</label>
              <input
                id="text-ayna-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            {error && <div role="alert" className="ay-info-notice ay-info-notice--err">{error}</div>}
            <div className="ay-info-btn-row">
              <button type="button" className="ay-info-btn ay-info-btn--ghost" onClick={() => setStep('phone')}>Change number</button>
              <button type="button" className="ay-info-btn" onClick={handleConfirmCode} disabled={sending || !code.trim()}>
                {sending ? 'Verifying…' : 'Verify'}
              </button>
            </div>
          </>
        )}

        {step === 'done' && (
          <>
            <h2 className="ay-info__h3">You're all set</h2>
            {AYNA_SMS_NUMBER && <p className="ay-info-sms-number">{AYNA_SMS_NUMBER}</p>}
            <p className="ay-info__body">Try texting: "what helps with PCOS bloating"</p>
            <button type="button" className="ay-info-btn" onClick={onCancel}>Done</button>
          </>
        )}
      </div>
    </InfoPage>
  );
}
