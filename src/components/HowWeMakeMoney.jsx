import React from 'react';

const SECTIONS = [
    {
        eyebrow: 'How a recommendation actually gets made',
        paragraphs: [
            'We earn a commission if you buy something from a brand we are partnered with, BUT our recommendation for you is never for sale. Our recommendation engine that decides what products to recommend you has no idea which brand pays us or not. Clinical logic, safety checks, and personalization are the only things that influence your recommendation.',
            'Only after you get your recommendations, do we check internally if we have a brand partnership with any of the products we recommended. If we do, and you do decide to buy something, we make a commission. If we don’t have a partnership with any of the brands we recommended you, then we don’t make commission. That’s fine with us, as long as it means you can make a product decision with confidence.',
            'This commission never comes out of your pocket. The price you pay is the same whether or not we’re partnered with the brand. And when brands pay us different commission rates, that difference has no bearing on your recommendation. A product with a lower payout to us can still outrank one with a higher payout, and we regularly recommend brands we have no financial relationship with at all, as long as they’re the best fit for you.',
        ],
    },
    {
        eyebrow: 'What partnership means (and doesn’t mean)',
        paragraphs: [
            'Our brand partners are displayed higher on the discovery page (but not the recommendation engine). Some of the brands we recommend, we also partner with more directly, on things like discount codes, co-marketing, or early product access. Those partnerships fund the work we do and get you better deals.',
            'They do not buy placement in your specific recommendation. They will be surfaced higher, however, on the discovery page, which is a page where you can freely browse anything, not just your recommendations. If a brand isn’t right for you, it doesn’t matter what deal we have with them. They will not be recommended to you. We label these placements clearly, so you’ll always see a “Sponsored” or “Partner” tag on any brand shown higher for this reason on the discovery page.',
        ],
    },
    {
        eyebrow: 'How we choose our partners, and when we walk away',
        paragraphs: [
            'We only partner with brands whose products pass our clinical and safety review, the same bar we hold every product to, partner or not. If a brand’s products ever stop meeting our quality or safety standards, we end the partnership, no matter how long we’ve worked together or what it costs us.',
        ],
    },
    {
        eyebrow: 'No exclusivity, ever',
        paragraphs: [
            'We don’t do exclusivity. We will never sign an agreement that locks a category to one brand. All brands compete for every recommendation for you based on the quality of their product, not on who’s paying us the most. This is also just good business for us: it’s what keeps our advice worth trusting.',
        ],
    },
    {
        eyebrow: 'Something feel off? Tell us.',
        paragraphs: [
            'If you’re ever concerned about a specific product or a recommendation you received, you can report it directly to us at puloma@aynahealth.co. We review every report.',
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
                    We think you deserve to know how a health platform gets paid, especially one that's telling you what to do about your own body. So here it is, plainly.
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
                    We make money when you find the right product. We do not make money by pointing you toward the wrong one. If those two things were ever in conflict, that would be the day to stop trusting us, and we intend to never let that day come.
                </p>
                <p style={{ fontSize: '1.05rem', color: 'var(--color-surface-contrast)', lineHeight: 1.75, fontWeight: 500, margin: '0.75rem 0 0' }}>
                    Brand partnerships help support Ayna, but they never decide what we recommend to you.
                </p>
            </div>
        </section>
    );
}
