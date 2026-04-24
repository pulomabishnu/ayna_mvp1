import React from 'react';
import ScrollReveal from './ScrollReveal';

/**
 * First screen on load: choose personalized recommendations (quiz / health profile)
 * or open discovery search.
 */
export default function WelcomeGate({ onPersonalizedPath, onBrowsePath }) {
    return (
        <section
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '85vh',
                textAlign: 'center',
                padding: 'var(--spacing-xl) var(--spacing-md)',
            }}
            className="container"
            aria-labelledby="welcome-heading"
        >
            <ScrollReveal className="stagger-1">
                <span className="ayna-eyebrow" style={{ textAlign: 'center', display: 'block', width: '100%' }}>Women&apos;s health, personalized</span>
                <h1
                    id="welcome-heading"
                    style={{
                        fontSize: 'clamp(2.1rem, 5vw, 3.4rem)',
                        maxWidth: '720px',
                        marginBottom: 'var(--spacing-lg)',
                        color: 'var(--color-surface-contrast)',
                        lineHeight: 1.15,
                        fontWeight: 600,
                    }}
                >
                    Welcome to Ayna
                </h1>
            </ScrollReveal>

            <ScrollReveal className="stagger-2">
                <p
                    style={{
                        fontSize: '1.08rem',
                        color: 'var(--color-text-muted)',
                        maxWidth: '640px',
                        marginBottom: '2.5rem',
                        lineHeight: 1.7,
                    }}
                >
                    Ayna builds your health ecosystem using clinical guidance, community signal, and evidence — so you can find products and care that fit you, from big names and small brands alike.
                </p>
            </ScrollReveal>

            <ScrollReveal className="stagger-3">
                <div
                    style={{
                        width: '100%',
                        maxWidth: '560px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                    }}
                >
                    <button
                        type="button"
                        className="btn btn-primary"
                        style={{
                            padding: '1rem 1.5rem',
                            fontSize: '1rem',
                            fontWeight: 600,
                            lineHeight: 1.35,
                            whiteSpace: 'normal',
                            textAlign: 'center',
                        }}
                        onClick={onPersonalizedPath}
                    >
                        Yes, build me my ecosystem!
                    </button>
                    <button
                        type="button"
                        className="btn btn-outline"
                        style={{
                            padding: '1rem 1.5rem',
                            fontSize: '1rem',
                            fontWeight: 600,
                            lineHeight: 1.35,
                            whiteSpace: 'normal',
                            textAlign: 'center',
                            borderWidth: '2px',
                            background: 'var(--color-surface-soft)',
                        }}
                        onClick={onBrowsePath}
                    >
                        No thanks, I would rather browse myself
                    </button>
                </div>
            </ScrollReveal>
        </section>
    );
}
