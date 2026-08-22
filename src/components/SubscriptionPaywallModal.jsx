import React from 'react';

const MONTHLY_PRICE = '$18';
const ANNUAL_PRICE = '$162';
const ANNUAL_SAVINGS = '3 months free';
const CONTACT_EMAIL = 'pulomabishnu@gmail.com';

export default function SubscriptionPaywallModal({ onClose, featureName = 'this feature', featureDescription = 'syncing and summarizing health data from wearables and EHRs' }) {
  const monthlyHref = `mailto:${CONTACT_EMAIL}?subject=Ayna%20Early%20Access%20Subscription%20(Monthly)&body=Hi%2C%20I%27d%20like%20to%20subscribe%20to%20Ayna%20Premium%20at%20%2418%2Fmonth.`;
  const annualHref = `mailto:${CONTACT_EMAIL}?subject=Ayna%20Early%20Access%20Subscription%20(Annual)&body=Hi%2C%20I%27d%20like%20to%20subscribe%20to%20Ayna%20Premium%20at%20%24162%2Fyear.`;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 3000,
        background: 'rgba(28,25,23,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          padding: '2rem',
          maxWidth: '480px',
          width: '100%',
          position: 'relative',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute', top: '1rem', right: '1rem',
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '1.25rem', color: 'var(--color-text-muted)',
            lineHeight: 1, padding: '0.25rem',
          }}
        >
          ✕
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            display: 'inline-block',
            background: 'var(--color-secondary-fade)',
            color: 'var(--color-primary)',
            padding: '0.4rem 1rem',
            borderRadius: 'var(--radius-pill)',
            fontSize: '0.8rem', fontWeight: '700',
            textTransform: 'uppercase', letterSpacing: '0.05em',
            marginBottom: '1rem',
          }}>
            Early Access
          </div>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '0.75rem', color: 'var(--color-text-main)' }}>
            Unlock Ayna Premium
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Ayna can only afford to offer {featureName} to paying users. {featureDescription} is
            costly to build and maintain.
          </p>
          <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', lineHeight: 1.6, marginTop: '0.75rem' }}>
            As an early user, we&apos;re offering a <strong>lifetime discount</strong>. {' '}
            <strong>subscribe now to lock in this price forever.</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <a
            href={monthlyHref}
            style={{
              flex: 1, textAlign: 'center', textDecoration: 'none',
              padding: '1.25rem 1rem',
              border: '2px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--color-surface-soft)',
              color: 'var(--color-text-main)',
              display: 'block',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
          >
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-text-main)' }}>{MONTHLY_PRICE}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>per month</div>
          </a>

          <a
            href={annualHref}
            style={{
              flex: 1, textAlign: 'center', textDecoration: 'none',
              padding: '1.25rem 1rem',
              border: '2px solid var(--color-primary)',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--color-secondary-fade)',
              color: 'var(--color-text-main)',
              display: 'block',
              position: 'relative',
            }}
          >
            <div style={{
              position: 'absolute', top: '-0.6rem', left: '50%', transform: 'translateX(-50%)',
              background: 'var(--color-primary)', color: 'white',
              padding: '0.15rem 0.6rem', borderRadius: 'var(--radius-pill)',
              fontSize: '0.7rem', fontWeight: '700', whiteSpace: 'nowrap',
            }}>
              {ANNUAL_SAVINGS}
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-text-main)' }}>{ANNUAL_PRICE}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>per year</div>
          </a>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
          Click a plan to get in touch. Feature is currently in development. Your early-user
          price is locked in forever once you subscribe.
        </p>
      </div>
    </div>
  );
}
