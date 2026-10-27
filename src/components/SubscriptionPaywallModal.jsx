import React from 'react';
import { useEscapeToClose } from '../utils/useEscapeToClose';

const MONTHLY_PRICE = '$4.99';
const MONTHLY_REGULAR = '$8.99';
const ANNUAL_PRICE = '$45';
const ANNUAL_REGULAR = '$90';

export default function SubscriptionPaywallModal({ onClose, featureName = 'this feature', featureDescription = 'deeper personalized health tools and insights' }) {
  useEscapeToClose(true, onClose);

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
          maxWidth: '520px',
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
            fontSize: 'var(--ay-fs-section)', color: 'var(--color-text-muted)',
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
            fontSize: 12.5, fontWeight: 600,
            marginBottom: '1rem',
          }}>
            ayna Pro Early Access
          </div>
          <h2 style={{ fontSize: 'var(--ay-fs-section)', marginBottom: '0.75rem', color: 'var(--color-text-main)' }}>
            Unlock Pro now
          </h2>
          <p style={{ fontSize: 16, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Get {featureName} plus ayna Pro&apos;s deeper personalized tools. {featureDescription}.
          </p>
          <p style={{ fontSize: 16, color: 'var(--color-text-muted)', lineHeight: 1.6, marginTop: '0.75rem' }}>
            Pay the Early Access price today and use Pro during beta. Your purchased month or year starts at the January 1, 2027 launch, not today.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
          <a
            href="/pro"
            style={{
              flex: 1, textAlign: 'center', textDecoration: 'none',
              padding: '1.25rem 1rem',
              border: '2px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--color-surface-soft)',
              color: 'var(--color-text-main)',
              display: 'block',
            }}
          >
            <div style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}><del>{MONTHLY_REGULAR}</del></div>
            <div style={{ fontSize: 'var(--ay-fs-section)', fontWeight: 600, color: 'var(--color-text-main)' }}>{MONTHLY_PRICE}</div>
            <div style={{ fontSize: 14, color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>first month</div>
          </a>

          <a
            href="/pro"
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
              fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap',
            }}>
              50% off
            </div>
            <div style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}><del>{ANNUAL_REGULAR}</del></div>
            <div style={{ fontSize: 'var(--ay-fs-section)', fontWeight: 600, color: 'var(--color-text-main)' }}>{ANNUAL_PRICE}</div>
            <div style={{ fontSize: 14, color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>first year</div>
          </a>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
          Beta access before launch is included at no extra cost. After your purchased period ends, your plan renews at {MONTHLY_REGULAR}/month or {ANNUAL_REGULAR}/year unless canceled.
        </p>
      </div>
    </div>
  );
}
