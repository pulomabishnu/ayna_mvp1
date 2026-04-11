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
                <h1
                    id="welcome-heading"
                    style={{
                        fontSize: 'clamp(2.25rem, 5.5vw, 3.75rem)',
                        maxWidth: '720px',
                        marginBottom: 'var(--spacing-lg)',
                        color: 'var(--color-surface-contrast)',
                        lineHeight: 1.12,
                        fontWeight: 800,
                    }}
                >
                    Welcome to Ayna
                </h1>
            </ScrollReveal>

            <ScrollReveal className="stagger-2">
                <p
                    style={{
                        fontSize: '1.05rem',
                        color: 'var(--color-text-main)',
                        maxWidth: '640px',
                        marginBottom: '2.5rem',
                        lineHeight: 1.65,
                    }}
                >
                    We build you a personalized ecosystem: of women’s health products, telehealth, and nearby care options across all brands, matched to your own health profile—no one else’s.
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
                            boxShadow: '0 4px 14px rgba(217, 76, 147, 0.35)',
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
