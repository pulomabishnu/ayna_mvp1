import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import posthog from 'posthog-js';
import { denyConsent, getStoredConsent, grantConsent, isGpcActive } from '../../utils/analyticsConsent.js';

function shouldShowPrompt() {
  const isIosApp = Capacitor.getPlatform() === 'ios';
  const isPreview = typeof window !== 'undefined' && window.location.pathname === '/mobile-preview';
  if (!isIosApp && !isPreview) return false;
  if (isGpcActive()) return false;
  const existing = getStoredConsent();
  return existing !== 'granted' && existing !== 'denied';
}

export default function AnalyticsConsentPrompt() {
  const [visible, setVisible] = useState(shouldShowPrompt);

  if (!visible) return null;

  const choose = (allowed) => {
    if (allowed) grantConsent(posthog);
    else denyConsent(posthog);
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="analytics-consent-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(24, 27, 52, .62)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '20px 16px max(20px, env(safe-area-inset-bottom))',
      }}
    >
      <div
        style={{
          width: 'min(520px, 100%)',
          borderRadius: 24,
          background: 'var(--ayna-surface, #FFFCF9)',
          color: 'var(--ayna-text, #292524)',
          padding: 22,
          boxShadow: '0 20px 60px rgba(0,0,0,.24)',
        }}
      >
        <div
          id="analytics-consent-title"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'calc(23px * var(--ayna-text-scale, 1))',
            lineHeight: 1.25,
            color: 'var(--ayna-heading, #242A52)',
          }}
        >
          Help improve ayna
        </div>
        <p style={{ margin: '10px 0 8px', fontSize: 'calc(14px * var(--ayna-text-scale, 1))', lineHeight: 1.55 }}>
          Share usage analytics so we can understand how the app is used. This does not include your health-profile answers, Ask ayna messages, SMS content, name, email, or phone number.
        </p>
        <p style={{ margin: '0 0 18px', fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', lineHeight: 1.5, color: 'var(--ayna-text-muted, #6f6880)' }}>
          You can change this any time in Privacy & Data. Core app features work either way.{' '}
          <a href="https://www.aynahealth.co/privacy-policy" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
            Privacy Policy
          </a>
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={() => choose(false)}
            style={{
              flex: 1,
              border: '1px solid var(--ayna-border, #ded6cd)',
              background: 'transparent',
              color: 'inherit',
              borderRadius: 99,
              padding: '13px 12px',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
              fontSize: 'calc(14px * var(--ayna-text-scale, 1))',
            }}
          >
            Not now
          </button>
          <button
            type="button"
            onClick={() => choose(true)}
            style={{
              flex: 1,
              border: 'none',
              background: 'var(--ayna-cta-bg, #FFC774)',
              color: 'var(--ayna-cta-text, #292524)',
              borderRadius: 99,
              padding: '13px 12px',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
              fontSize: 'calc(14px * var(--ayna-text-scale, 1))',
            }}
          >
            Allow analytics
          </button>
        </div>
      </div>
    </div>
  );
}
