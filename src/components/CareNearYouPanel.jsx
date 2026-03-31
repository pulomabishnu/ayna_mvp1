import React, { useState, useEffect } from 'react';
import { getCareResourceBundle } from '../data/careResources';
import Disclaimer from './Disclaimer';

/**
 * Care near you + telehealth — driven by quiz, chat-updated profile, imported records, and wearable summary.
 */
export default function CareNearYouPanel({
  quizResults,
  healthProfile,
  userZipCode = '',
  onZipCodeChange,
  onOpenProduct,
  compact = false,
}) {
  const [zipInput, setZipInput] = useState((userZipCode || '').replace(/\D/g, '').slice(0, 5));

  useEffect(() => {
    setZipInput((userZipCode || '').replace(/\D/g, '').slice(0, 5));
  }, [userZipCode]);

  const bundle = getCareResourceBundle(quizResults, healthProfile, userZipCode || zipInput);

  const saveZip = () => {
    const z = zipInput.replace(/\D/g, '').slice(0, 5);
    setZipInput(z);
    onZipCodeChange?.(z);
  };

  return (
    <div
      style={{
        maxWidth: '900px',
        margin: '0 auto var(--spacing-xl)',
        padding: compact ? '1rem 1.25rem' : '1.5rem 1.75rem',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f5f3ff 100%)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
      }}
    >
      <h3 style={{ fontSize: compact ? '1.05rem' : '1.2rem', marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>
        Care near you &amp; telehealth
      </h3>
      <p style={{ fontSize: '0.92rem', color: 'var(--color-text-muted)', lineHeight: 1.55, marginBottom: '1rem' }}>
        {bundle.intro}
      </p>

      {onZipCodeChange && (
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.25rem' }}>
          <label style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--color-text-main)' }}>US zip (for local finders)</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={5}
            placeholder="e.g. 94102"
            value={zipInput}
            onChange={(e) => setZipInput(e.target.value.replace(/\D/g, '').slice(0, 5))}
            style={{
              width: '100px',
              padding: '0.45rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              fontSize: '0.95rem',
            }}
          />
          <button type="button" className="btn btn-outline" style={{ padding: '0.45rem 1rem', fontSize: '0.88rem' }} onClick={saveZip}>
            Save zip
          </button>
          {(userZipCode || zipInput) && (
            <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
              Using <strong>{(userZipCode || zipInput).slice(0, 5)}</strong> for HRSA links
            </span>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        <div>
          <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
            In-person &amp; community clinics
          </h4>
          <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.9rem', lineHeight: 1.55, color: 'var(--color-text-main)' }}>
            {bundle.clinicLinks.map((link) => (
              <li key={link.href} style={{ marginBottom: '0.5rem' }}>
                <a href={link.href} target="_blank" rel="noopener noreferrer" style={{ fontWeight: '600', color: 'var(--color-primary)' }}>
                  {link.label} ↗
                </a>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{link.hint}</div>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
            Education &amp; virtual care context
          </h4>
          <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.9rem', lineHeight: 1.55, color: 'var(--color-text-main)' }}>
            {bundle.telehealthLinks.map((link) => (
              <li key={link.href} style={{ marginBottom: '0.5rem' }}>
                <a href={link.href} target="_blank" rel="noopener noreferrer" style={{ fontWeight: '600', color: 'var(--color-primary)' }}>
                  {link.label} ↗
                </a>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{link.hint}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {bundle.catalogTelehealth.length > 0 && onOpenProduct && (
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
          <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
            Telehealth platforms in our catalog (matched to your profile when possible)
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {bundle.catalogTelehealth.map((p) => (
              <button
                key={p.id}
                type="button"
                className="btn btn-outline"
                style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem' }}
                onClick={() => onOpenProduct(p)}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <Disclaimer compact style={{ marginTop: '1rem' }} />
    </div>
  );
}
