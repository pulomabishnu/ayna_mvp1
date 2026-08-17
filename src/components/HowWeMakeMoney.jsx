import React from 'react';

export default function HowWeMakeMoney({ onBack }) {
    return (
        <section className="container animate-fade-in-up" style={{ padding: 'var(--spacing-xl) var(--spacing-md)', maxWidth: '760px', margin: '0 auto' }}>
            <button
                type="button"
                onClick={onBack}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: '0.9rem', marginBottom: '1.5rem', padding: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
                ← Back
            </button>

            <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
                <span style={{
                    fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-primary)',
                    background: 'var(--color-secondary-fade)', padding: '0.3rem 0.8rem',
                    borderRadius: 'var(--radius-pill)', display: 'inline-block', marginBottom: '1rem'
                }}>
                    💛 Transparency
                </span>
                <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: '1rem', color: 'var(--color-surface-contrast)' }}>
                    How We Make Money
                </h1>
                <p style={{ fontSize: '1.1rem', color: 'var(--color-text-muted)', maxWidth: '560px', margin: '0 auto', lineHeight: 1.6 }}>
                    We're finalizing this page. In the meantime — nothing about how we're funded changes what we recommend to you.
                </p>
            </div>

            <div className="card" style={{ padding: '1.75rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                We're putting together a clear, plain-language breakdown of how Ayna sustains itself financially. Check back soon.
            </div>
        </section>
    );
}
