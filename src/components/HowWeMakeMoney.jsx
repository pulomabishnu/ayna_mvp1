import React from 'react';

const SECTIONS = [
    {
        eyebrow: 'How a recommendation actually gets made',
        paragraphs: [
            'ayna can earn money in two ways when you buy a product: through a direct brand partnership or through a retailer affiliate program such as Amazon Associates. Neither relationship is used as a signal in your personalized recommendation score.',
            'Personalized recommendations are ranked from the product information and the health profile or preferences you choose to share. Commercial status, commission rate, and whether we have a direct relationship with the brand do not increase a product’s personalized match score or move it higher in your personalized recommendation order.',
            'If you choose to buy through an affiliate link, ayna may earn a commission at no additional cost to you. As an Amazon Associate, ayna earns from qualifying purchases.',
        ],
    },
    {
        eyebrow: 'What partnership means (and doesn’t mean)',
        paragraphs: [
            'Confirmed brand partners can be displayed higher in general Browse, which is the page where you freely explore the catalog. That is separate from personalized recommendation ranking.',
            'In Browse, the “ayna Favorite” label identifies products from confirmed partner brands. On a product page, the “ayna Partner” disclosure explains the commercial relationship. A product can still use an affiliate retailer link without being a brand partner; affiliate-only products do not receive partner Browse promotion.',
        ],
    },
    {
        eyebrow: 'How we choose partners',
        paragraphs: [
            'We review potential partners for fit with ayna’s audience, product quality, safety, transparency, and brand practices. A partnership does not turn a marketing claim into a medical fact, and we may change or end a partnership if new information changes our assessment.',
        ],
    },
    {
        eyebrow: 'No exclusivity in personalized recommendations',
        paragraphs: [
            'A direct partner does not get an exclusive right to a recommendation category. Partner and non-partner products can both appear in personalized results when they are relevant to the user.',
        ],
    },
    {
        eyebrow: 'Something feel off? Tell us.',
        paragraphs: [
            'If you are concerned about a product, affiliate disclosure, partner placement, or recommendation you received, contact us at puloma@aynahealth.co and we will review it.',
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
                    Transparency
                </span>
                <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: '1.25rem', color: 'var(--color-surface-contrast)' }}>
                    How We Make Money
                </h1>
                <p style={{ fontSize: '1.15rem', color: 'var(--color-text-main)', maxWidth: '600px', margin: '0 auto', lineHeight: 1.65, fontWeight: 500 }}>
                    Health-product recommendations and commercial relationships should be easy to tell apart. Here is how ayna handles both.
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
                        {section.paragraphs.map((paragraph, index) => (
                            <p key={paragraph} style={{
                                fontSize: '1rem', color: 'var(--color-text-main)', lineHeight: 1.75,
                                marginBottom: index === section.paragraphs.length - 1 ? 0 : '1rem',
                            }}>
                                {paragraph}
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
                    Partnerships and affiliate links help support ayna. They can affect visibility in general Browse when clearly labeled, but they do not decide your personalized match score or recommendation order.
                </p>
            </div>
        </section>
    );
}
