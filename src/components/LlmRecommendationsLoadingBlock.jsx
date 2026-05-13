import React, { useEffect, useState } from 'react';

/** Soft estimate used only to pace the progress bar. */
export const LLM_LOAD_UI_ESTIMATE_MS = 120_000;

export default function LlmRecommendationsLoadingBlock({ loadStartedAt, compact = false }) {
    const [, setTick] = useState(0);

    useEffect(() => {
        if (!loadStartedAt) return undefined;
        const id = window.setInterval(() => setTick((n) => n + 1), 500);
        return () => window.clearInterval(id);
    }, [loadStartedAt]);

    if (!loadStartedAt) return null;

    const elapsed = Math.max(0, Date.now() - loadStartedAt);
    const remainingMs = Math.max(0, LLM_LOAD_UI_ESTIMATE_MS - elapsed);
    const remainingSec = Math.ceil(remainingMs / 1000);
    // Bar drains right-to-left: starts full, empties as time passes
    const barPct = Math.max(2, 100 - (elapsed / LLM_LOAD_UI_ESTIMATE_MS) * 100);

    return (
        <div
            style={{
                textAlign: 'center',
                padding: compact ? '2rem' : '3rem',
                color: 'var(--color-text-muted)',
                maxWidth: compact ? 'none' : '720px',
                margin: compact ? undefined : '0 auto var(--spacing-xl)',
            }}
        >
            <div style={{ fontSize: '2rem', marginBottom: compact ? '0.75rem' : '1rem' }}>🌸</div>
            <p style={{ fontWeight: '600', color: 'var(--color-text-main)', fontSize: compact ? '1rem' : '1.1rem' }}>
                Building your personalized ecosystem...
            </p>
            <p style={{ fontSize: compact ? '0.82rem' : '0.88rem', marginTop: '0.5rem', fontWeight: '600', color: 'var(--color-text-main)' }}>
                {remainingSec > 0
                    ? `About ${remainingSec}s remaining`
                    : 'Almost done — finalizing your ecosystem…'}
            </p>
            <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(barPct)}
                aria-label="Ecosystem generation progress"
                style={{
                    height: '10px',
                    borderRadius: '999px',
                    background: 'var(--color-border)',
                    overflow: 'hidden',
                    maxWidth: '360px',
                    margin: '0.85rem auto 0',
                    direction: 'rtl',
                }}
            >
                <div
                    style={{
                        width: `${barPct}%`,
                        height: '100%',
                        borderRadius: '999px',
                        background: 'linear-gradient(90deg, var(--color-primary-hover), var(--color-primary))',
                        transition: 'width 0.5s ease-out',
                    }}
                />
            </div>
        </div>
    );
}
