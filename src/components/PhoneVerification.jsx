import React, { useState } from 'react';
import { CODE_COPY, SMS_CODE_LENGTH, cleanCode } from '../utils/authCodes.js';
import { EdPage } from './editorial/EdPage';
import { maskedChange, formatUsPhone } from '../utils/inputMask.js';

const AYNA_SMS_NUMBER = import.meta.env.VITE_AYNA_SMS_NUMBER || '';

const CONSENT_TEXT =
  'By texting Ayna, you agree that your messages will be used to give you personalized health information. ' +
  'Msg & data rates may apply. Message frequency varies. Reply STOP to opt out, HELP for help. ' +
  'See our Terms of Service and Privacy Policy at aynahealth.co.';

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
  invalid_or_expired_code: CODE_COPY.wrongOrExpired,
  code_required: 'Please enter the code we texted you.',
  phone_already_linked: 'That phone number is already linked to another account.',
  auth_required: 'Please sign in first.',
};

function friendlyError(code) {
  return ERROR_MESSAGES[code] || 'We couldn’t verify your phone just now. Check the number and try again.';
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

  // Editorial footer-page layout (EdPage): back link, H1 and intro in the
  // reading column, then the form in one Group. No colour band.
  return (
    <EdPage
      title="Text ayna"
      lede="Get personalized health texts from ayna anytime, without opening the app."
      onBack={onCancel}
    >
      <div className="ay-group is-padded ed-form" style={{ maxWidth: 560 }}>
        {step === 'phone' && (
          <>
            <div className="ed-field">
              <label htmlFor="text-ayna-phone">Phone number</label>
              <input
                id="text-ayna-phone"
                type="tel"
                autoComplete="tel"
                placeholder="(555) 555-5555"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(maskedChange(e, formatUsPhone))}
              />
            </div>
            <p className="ed-small">{CONSENT_TEXT}</p>
            {error && <div role="alert" className="ed-notice ed-notice--err">{error}</div>}
            <div>
              <button
                type="button"
                className="ay-btn ay-btn--primary"
                onClick={handleSendCode}
                disabled={sending || !phoneNumber.trim()}
              >
                {sending ? 'Sending…' : 'Send code'}
              </button>
            </div>
          </>
        )}

        {step === 'code' && (
          <>
            <p className="ed-body">We texted a code to {phoneNumber}. Enter it below.</p>
            <div className="ed-field">
              <label htmlFor="text-ayna-code">Verification code</label>
              <input
                id="text-ayna-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder={CODE_COPY.smsPlaceholder}
                maxLength={SMS_CODE_LENGTH}
                value={code}
                onChange={(e) => setCode(cleanCode(e.target.value, SMS_CODE_LENGTH))}
              />
            </div>
            {error && <div role="alert" className="ed-notice ed-notice--err">{error}</div>}
            <div className="ed-btnrow">
              <button type="button" className="ay-btn ay-btn--primary" onClick={handleConfirmCode} disabled={sending || code.length !== SMS_CODE_LENGTH}>
                {sending ? 'Verifying…' : 'Verify'}
              </button>
              <button type="button" className="ay-btn ay-btn--secondary" onClick={() => setStep('phone')}>Change number</button>
            </div>
          </>
        )}

        {step === 'done' && (
          <>
            <h2 className="ed-h3">You're all set</h2>
            {AYNA_SMS_NUMBER && <p className="ed-body"><strong>{AYNA_SMS_NUMBER}</strong></p>}
            <p className="ed-body">Try texting: "what helps with PMOS bloating"</p>
            <div>
              <button type="button" className="ay-btn ay-btn--primary" onClick={onCancel}>Done</button>
            </div>
          </>
        )}
      </div>
    </EdPage>
  );
}
