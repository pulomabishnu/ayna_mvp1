import React from 'react';

export default function Articles() {
    return (
        <section className="container animate-fade-in-up" style={{ padding: 'var(--spacing-xl) var(--spacing-md)', maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Health Articles Library</h1>
                <p style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)' }}>Free, evidence-based health information drawn from UpToDate, peer-reviewed literature, and expert physicians.</p>
            </div>

            <article style={{ background: 'white', padding: '2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--color-text-main)' }}>Intimate Washes: Good, Bad, or Unnecessary?</h2>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <span style={{ padding: '0.2rem 0.6rem', background: 'var(--color-secondary-fade)', color: 'var(--color-primary)', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 'bold' }}>Source: UpToDate</span>
                    <span style={{ padding: '0.2rem 0.6rem', background: 'var(--color-surface-soft)', color: 'var(--color-text-muted)', borderRadius: '1rem', fontSize: '0.8rem' }}>Gynecology</span>
                </div>

                <div style={{ lineHeight: '1.8', fontSize: '1.1rem', color: 'var(--color-text-main)' }}>
                    <p>
                        The feminine hygiene aisle is packed with intimate washes, wipes, and deodorants. But are they actually good for your health, or just a marketing gimmick?
                        We reviewed clinical guidelines from <strong>UpToDate</strong>, the ACOG, and leading gynecologists to break down the pros and cons.
                    </p>

                    <h3 style={{ marginTop: '2rem', fontSize: '1.4rem' }}>The Vagina is Self-Cleaning</h3>
                    <p>
                        It is a medical consensus that the <em>vagina</em> (the internal canal) is self-cleaning and self-regulating. It maintains a delicate pH balance (typically between 3.8 and 4.5)
                        driven by lactobacilli bacteria. <strong>Douching or internal washing is universally condemned by doctors</strong> because it disrupts this microbiome, leading to an increased risk of Bacterial Vaginosis (BV) and yeast infections.
                    </p>

                    <h3 style={{ marginTop: '2rem', fontSize: '1.4rem' }}>What About the Vulva?</h3>
                    <p>
                        The <em>vulva</em> (the external genitalia) is skin, and it does accumulate sweat, sebum (smegma), and dead skin cells. While warm water alone is often sufficient to clean the vulva,
                        some people prefer using a cleanser.
                    </p>

                    <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 300px', background: 'var(--color-surface-contrast)', color: 'white', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                            <h4 style={{ color: 'var(--color-secondary)', marginBottom: '0.5rem' }}>Pros of Intimate Washes</h4>
                            <ul style={{ paddingLeft: '1.2rem' }}>
                                <li>Can cleanly remove accumulated sweat and sebum.</li>
                                <li>pH-balanced formulas (unlike standard bar soaps) respect the acid mantle of the skin.</li>
                                <li>Fragrance-free options are less drying than standard body washes.</li>
                            </ul>
                        </div>
                        <div style={{ flex: '1 1 300px', background: '#FFF1F0', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                            <h4 style={{ color: '#D32F2F', margin: '0', marginBottom: '0.5rem' }}>Cons & Risks</h4>
                            <ul style={{ paddingLeft: '1.2rem' }}>
                                <li>Scented washes often contain allergens resulting in contact dermatitis.</li>
                                <li>Over-washing can strip natural oils, leading to chronic dryness and micro-tears.</li>
                                <li>May accidentally disrupt the internal pH if the soap runs inside the vaginal opening.</li>
                            </ul>
                        </div>
                    </div>

                    <h3 style={{ marginTop: '2rem', fontSize: '1.4rem' }}>Doctor Opinions</h3>
                    <blockquote style={{ borderLeft: '4px solid var(--color-primary)', margin: '1.5rem 0', background: 'var(--color-surface-soft)', padding: '1rem', borderRadius: '0 var(--radius-md) var(--radius-md) 0' }}>
                        <p style={{ fontStyle: 'italic', margin: 0 }}>
                            "The golden rule is: water only or a very mild, unscented cleanser for the vulva. Nothing goes inside the vagina. If you are experiencing odor, a scented wash will only mask the problem and could make an underlying infection worse."
                        </p>
                        <span style={{ fontSize: '0.9rem', fontWeight: 'bold', display: 'block', marginTop: '0.5rem' }}>— Dr. Jen Gunter, OB-GYN and author of The Vagina Bible</span>
                    </blockquote>

                    <h3 style={{ marginTop: '2rem', fontSize: '1.4rem' }}>Guidelines Summary</h3>
                    <p>According to <strong>UpToDate</strong> guidelines on vulvovaginal health:</p>
                    <ul style={{ paddingLeft: '1.5rem', marginBottom: '2rem' }}>
                        <li><strong>Avoid</strong> all perfumed soaps, bubble baths, bath salts, and vaginal deodorants.</li>
                        <li><strong>Cleanse</strong> the vulva gently with your hands (avoid abrasive washcloths/loofahs) using warm water or an unfragranced soap substitute.</li>
                        <li><strong>Dry</strong> thoroughly before putting on underwear.</li>
                    </ul>

                    <p><strong>The Verdict:</strong> You do not <em>need</em> an intimate wash. Warm water is medically sufficient. However, if you prefer using a cleanser for comfort or to remove sweat, choose a product that is fragrance-free, pH-balanced for external use, and strictly avoid getting it inside.</p>
                </div>
            </article>
        </section>
    );
}
