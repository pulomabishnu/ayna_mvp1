import React from 'react';

/** Baseline sources for all synthesized health information (use in intros and sourcing notes). */
export const BASELINE_SOURCES = '';

/**
 * Standard medical disclaimer. Use wherever we show products, advice, or health info.
 */
export default function Disclaimer({ compact = false, style = {}, showSources = false }) {
  const text = "This information is for educational purposes only and is not medical advice. Always consult your clinician or healthcare provider for diagnosis, treatment, and personalized medical advice. Ayna cannot and does not provide medical instructions or replace professional care.";
  if (compact) {
    return (
      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.4, margin: 0, ...style }}>
        {text}
        {showSources && BASELINE_SOURCES && <><br /><span style={{ marginTop: '0.35rem', display: 'inline-block' }}>{BASELINE_SOURCES}</span></>}
      </p>
    );
  }
  return (
    <div style={{
      padding: '1rem 1.25rem',
      background: 'var(--color-secondary-fade)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      marginTop: '1.5rem',
      ...style
    }}>
      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-main)', lineHeight: 1.5, margin: 0, fontWeight: 500 }}>
        <strong>Disclaimer:</strong> {text}
      </p>
      {showSources && BASELINE_SOURCES && <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.45, margin: '0.75rem 0 0', fontWeight: 500 }}>{BASELINE_SOURCES}</p>}
    </div>
  );
}
