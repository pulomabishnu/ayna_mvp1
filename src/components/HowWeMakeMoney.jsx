import React from 'react';

const SECTIONS = [
    {
        eyebrow: 'How a recommendation actually gets made',
        paragraphs: [
            'We earn money when you buy from a brand we partner with. But we never sell our recommendations. The system that picks your recommendations does not know which brands pay us. Only medical guidance, safety checks, and what is right for you decide what we recommend.',
            'We only check for brand partnerships after you already have your recommendations. If we are partnered with a brand you buy from, we earn money. If we are not, we do not. Either way is fine with us — what matters is that you can trust your choice.',
        ],
    },
    {
        eyebrow: 'What partnership means (and doesn’t mean)',
        paragraphs: [
            'Our partner brands show up higher on the Discover page — but not in your personal recommendations. With some brands, we also work together on things like discount codes or early access to new products. These partnerships help pay for Ayna and get you better deals.',
            'Brands cannot pay to be in your personal recommendations. They can only show up higher on the Discover page, where you browse everything, not just your picks. If a brand is not right for you, we will not recommend it — no matter what deal we have with them.',
        ],
    },
    {
        eyebrow: 'No exclusivity, ever',
        paragraphs: [
            'We never lock out other brands. We will never sign a deal that says only one brand can be recommended in a category. Every brand competes on how good their product is — not on who pays us the most. This is also what keeps our advice worth trusting.',
        ],
    },
];

export default function HowWeMakeMoney({ onBack }) {
    return (
        <section className="container animate-fade-in-up" style={{ padding: 'var(--spacing-xl) var(--spacing-md)', maxWidth: '720px', margin: '0 auto' }}>
            <button
                type="button"
                onClick={onBack}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92400E', fontSize: '0.9rem', marginBottom: '1.5rem', padding: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
                ← Back
            </button>

            <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
                <span style={{
                    fontSize: '0.85rem', fontWeight: '600', color: '#92400E',
                    background: 'var(--color-secondary-fade)', padding: '0.3rem 0.8rem',
                    borderRadius: 'var(--radius-pill)', display: 'inline-block', marginBottom: '1rem'
                }}>
                    💛 Transparency
                </span>
                <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: '1.25rem', color: 'var(--color-surface-contrast)' }}>
                    How We Make Money
                </h1>
                <p style={{ fontSize: '1.15rem', color: 'var(--color-text-main)', maxWidth: '600px', margin: '0 auto', lineHeight: 1.65, fontWeight: 500 }}>
                    You deserve to know how we make money — especially since we help with choices about your own body. Here it is, plainly.
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {SECTIONS.map((section) => (
                    <div key={section.eyebrow}>
                        <h2 style={{
                            fontSize: '0.78rem', fontWeight: '700', color: '#92400E',
                            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem',
                        }}>
                            {section.eyebrow}
                        </h2>
                        {section.paragraphs.map((p, i) => (
                            <p key={i} style={{
                                fontSize: '1rem', color: 'var(--color-text-main)', lineHeight: 1.75,
                                marginBottom: i === section.paragraphs.length - 1 ? 0 : '1rem',
                            }}>
                                {p}
                            </p>
                        ))}
                    </div>
                ))}
            </div>

            <div className="card" style={{
                marginTop: '2.5rem', padding: '1.75rem 2rem',
                background: 'var(--color-secondary-fade)', border: '1px solid var(--color-primary)',
            }}>
                <h2 style={{
                    fontSize: '0.78rem', fontWeight: '700', color: '#92400E',
                    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem',
                }}>
                    The bottom line
                </h2>
                <p style={{ fontSize: '1.05rem', color: 'var(--color-surface-contrast)', lineHeight: 1.75, fontWeight: 500, margin: 0 }}>
                    We make money when you find the right product — not by pointing you to the wrong one. If that ever changed, that would be the day to stop trusting us. We plan to never let that day come.
                </p>
            </div>
        </section>
    );
}
