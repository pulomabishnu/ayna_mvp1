import React from 'react';

const FUNNEL = [
    { label: 'Scanned market', value: 3140, color: 'var(--color-navy)' },
    { label: 'Relevant to you', value: 212, color: 'var(--color-plum)' },
    { label: 'Passed evidence', value: 41, color: 'var(--color-terracotta)' },
    { label: 'Shown in your shop', value: 14, color: 'var(--color-amber)' },
];

const SOURCES = [
    { label: 'NIH research', value: 12 },
    { label: 'ACOG guidance', value: 9 },
    { label: 'CDC data', value: 5 },
    { label: 'Clinician notes', value: 3 },
    { label: 'Community', value: 14 },
];

const MATCH_BREAKDOWN = [
    { label: 'Your profile fit', pct: 38, color: 'var(--color-navy)' },
    { label: 'Evidence strength', pct: 27, color: 'var(--color-plum)' },
    { label: 'Clinician input', pct: 21, color: 'var(--color-terracotta)' },
    { label: 'Women like you', pct: 14, color: 'var(--color-amber)' },
];

const GATES = [
    { n: '01', title: 'You tell us', body: 'Stage of life, goals, sensitivities, city.', detail: 'Postpartum · 8 weeks · sensitive skin · NYC' },
    { n: '02', title: 'We scan the market', body: 'Every product we can find, not a paid shelf.', detail: '3,140 scanned' },
    { n: '03', title: 'Evidence gate', body: 'Checked against NIH, ACOG and CDC guidance.', detail: 'Fails a check → dropped' },
    { n: '04', title: 'Your shop', body: 'Ranked, each with its match reason attached.', detail: '14', dark: true },
];

const COMPARISON_ROWS = [
    { label: 'Matched to your health profile', ayna: true, search: false, wellness: false },
    { label: 'Cycle & goal aware', ayna: true, search: false, wellness: false },
    { label: 'Vetted brands and providers', ayna: true, search: false, wellness: true },
    { label: 'No sponsored-first results', ayna: true, search: false, wellness: false },
    { label: 'Clinician input on every category', ayna: true, search: false, wellness: false },
];

function Mark({ on }) {
    return (
        <span style={{ color: on ? 'var(--color-navy)' : 'var(--color-text-muted)', opacity: on ? 1 : 0.45, fontWeight: 700 }}>
            {on ? '✓' : '✗'}
        </span>
    );
}

export default function HowItWorks({ onBack }) {
    const maxFunnel = FUNNEL[0].value;

    return (
        <div className="animate-fade-in-up">
            <section
                style={{
                    background: 'var(--hero-gradient)',
                    padding: '3.5rem 1.5rem 3rem',
                    textAlign: 'center',
                }}
            >
                {onBack && (
                    <button
                        type="button"
                        onClick={onBack}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', marginBottom: '1.5rem' }}
                    >
                        ← Back
                    </button>
                )}
                <span style={{
                    fontFamily: 'var(--font-label)', fontSize: '0.75rem', fontWeight: 500,
                    letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--color-amber)',
                    display: 'block', marginBottom: '0.75rem',
                }}>
                    How it works
                </span>
                <h1 style={{
                    fontFamily: 'var(--font-serif)', fontWeight: 500, color: '#fff',
                    fontSize: 'clamp(2rem, 4.5vw, 3rem)', marginBottom: '0.75rem',
                }}>
                    No <em style={{ color: 'var(--color-amber)', fontStyle: 'italic' }}>mystery box</em>.
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.05rem', maxWidth: '480px', margin: '0 auto' }}>
                    Every product you see cleared four filters. Here they are.
                </p>
            </section>

            <section className="container" style={{ padding: 'var(--spacing-xl) var(--spacing-md)', maxWidth: '900px', margin: '0 auto' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', marginBottom: '3rem', alignItems: 'flex-start' }}>
                    <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: '1.8rem', flex: '1 1 320px', margin: 0 }}>
                        1 in 2 women feel unseen by the wellness industry.
                    </h2>
                    <p style={{ flex: '1 1 320px', color: 'var(--color-text-muted)', lineHeight: 1.7, margin: 0 }}>
                        Generic wellness content doesn&apos;t account for your cycle, your history, or what&apos;s already worked for you.
                        Ayna builds a living health profile, then matches it against the open market and published research — in that order.
                    </p>
                </div>

                {/* Funnel */}
                <div style={{ marginBottom: '3rem' }}>
                    <span style={{
                        fontFamily: 'var(--font-label)', fontSize: '0.7rem', fontWeight: 500,
                        letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-amber-deep)',
                    }}>
                        The funnel
                    </span>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: '1.6rem', margin: '0.4rem 0 1.5rem' }}>
                        3,140 products in. 14 reach you.
                    </h3>
                    <div className="card" style={{ padding: '1.5rem' }}>
                        {FUNNEL.map((row) => (
                            <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.9rem' }}>
                                <span style={{ flex: '0 0 140px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{row.label}</span>
                                <div style={{ flex: 1, height: '14px', borderRadius: 'var(--radius-pill)', background: 'var(--color-border)', overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${Math.max(3, (row.value / maxFunnel) * 100)}%`, height: '100%',
                                        borderRadius: 'var(--radius-pill)', background: row.color,
                                    }} />
                                </div>
                                <span style={{ flex: '0 0 56px', textAlign: 'right', fontWeight: 600 }}>{row.value.toLocaleString()}</span>
                            </div>
                        ))}
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '1rem', marginBottom: 0 }}>
                            Example profile: postpartum, 8 weeks, sensitive skin, NYC.
                        </p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                    <div className="card">
                        <span style={{
                            fontFamily: 'var(--font-label)', fontSize: '0.65rem', fontWeight: 500,
                            letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-amber-deep)',
                        }}>
                            What we check against
                        </span>
                        <h4 style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: '1.25rem', margin: '0.4rem 0 1rem' }}>
                            Sources behind a single match
                        </h4>
                        {SOURCES.map((s) => (
                            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' }}>
                                <span style={{ flex: '0 0 110px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{s.label}</span>
                                <div style={{ flex: 1, height: '8px', borderRadius: 'var(--radius-pill)', background: 'var(--color-border)', overflow: 'hidden' }}>
                                    <div style={{ width: `${(s.value / 14) * 100}%`, height: '100%', background: 'var(--color-terracotta)', borderRadius: 'var(--radius-pill)' }} />
                                </div>
                                <span style={{ flex: '0 0 24px', textAlign: 'right', fontSize: '0.85rem' }}>{s.value}</span>
                            </div>
                        ))}
                    </div>

                    <div className="card">
                        <span style={{
                            fontFamily: 'var(--font-label)', fontSize: '0.65rem', fontWeight: 500,
                            letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-amber-deep)',
                        }}>
                            What a match score is made of
                        </span>
                        <h4 style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: '1.25rem', margin: '0.4rem 0 1rem' }}>
                            98% match, broken down
                        </h4>
                        <div style={{ display: 'flex', height: '14px', borderRadius: 'var(--radius-pill)', overflow: 'hidden', marginBottom: '0.9rem' }}>
                            {MATCH_BREAKDOWN.map((m) => (
                                <div key={m.label} style={{ width: `${m.pct}%`, background: m.color }} title={`${m.label}: ${m.pct}%`} />
                            ))}
                        </div>
                        {MATCH_BREAKDOWN.map((m) => (
                            <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                                <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: m.color, flexShrink: 0 }} />
                                <span style={{ flex: 1, color: 'var(--color-text-muted)' }}>{m.label}</span>
                                <span style={{ fontWeight: 600 }}>{m.pct}%</span>
                            </div>
                        ))}
                        <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.75rem', marginBottom: 0 }}>
                            Sponsorship is never an input.
                        </p>
                    </div>
                </div>

                {/* Decision tree */}
                <div style={{ marginBottom: '3rem' }}>
                    <span style={{
                        fontFamily: 'var(--font-label)', fontSize: '0.7rem', fontWeight: 500,
                        letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-amber-deep)',
                    }}>
                        The decision tree
                    </span>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: '1.6rem', margin: '0.4rem 0 1.5rem' }}>
                        Four gates, in order.
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem' }}>
                        {GATES.map((g) => (
                            <div
                                key={g.n}
                                className={g.dark ? '' : 'card'}
                                style={g.dark ? {
                                    padding: 'var(--spacing-lg)', borderRadius: 'var(--radius-lg)',
                                    background: 'var(--color-navy)', color: '#fff',
                                } : { padding: 'var(--spacing-lg)' }}
                            >
                                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', fontWeight: 500, opacity: g.dark ? 0.55 : 0.35, color: g.dark ? '#fff' : 'var(--color-text-main)' }}>
                                    {g.n}
                                </span>
                                <h4 style={{ fontSize: '1.1rem', margin: '0.5rem 0 0.5rem', color: g.dark ? '#fff' : 'var(--color-text-main)' }}>{g.title}</h4>
                                <p style={{ fontSize: '0.85rem', color: g.dark ? 'rgba(255,255,255,0.75)' : 'var(--color-text-muted)', marginBottom: '0.75rem' }}>{g.body}</p>
                                <span style={{
                                    display: 'inline-block', fontSize: '0.78rem', fontWeight: 600,
                                    color: g.dark ? '#fff' : 'var(--color-text-main)',
                                    background: g.dark ? 'rgba(255,255,255,0.14)' : 'var(--color-secondary-fade)',
                                    padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-pill)',
                                }}>
                                    {g.detail}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Comparison table */}
                <div style={{ marginBottom: '3rem' }}>
                    <span style={{
                        fontFamily: 'var(--font-label)', fontSize: '0.7rem', fontWeight: 500,
                        letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-amber-deep)',
                    }}>
                        Our difference
                    </span>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: '1.6rem', margin: '0.4rem 0 1.5rem' }}>
                        Why this isn&apos;t a search engine.
                    </h3>
                    <div className="card" style={{ padding: 0, overflow: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <th style={{ textAlign: 'left', padding: '1rem 1.25rem', fontWeight: 500, color: 'var(--color-text-muted)' }} />
                                    <th style={{ padding: '1rem', fontFamily: 'var(--font-label)', fontSize: '0.7rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-navy)' }}>Ayna</th>
                                    <th style={{ padding: '1rem', fontFamily: 'var(--font-label)', fontSize: '0.7rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Search &amp; influencers</th>
                                    <th style={{ padding: '1rem', fontFamily: 'var(--font-label)', fontSize: '0.7rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Wellness apps</th>
                                </tr>
                            </thead>
                            <tbody>
                                {COMPARISON_ROWS.map((row, i) => (
                                    <tr key={row.label} style={{ borderBottom: i === COMPARISON_ROWS.length - 1 ? 'none' : '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '0.9rem 1.25rem', color: 'var(--color-text-main)' }}>{row.label}</td>
                                        <td style={{ padding: '0.9rem', textAlign: 'center' }}><Mark on={row.ayna} /></td>
                                        <td style={{ padding: '0.9rem', textAlign: 'center' }}><Mark on={row.search} /></td>
                                        <td style={{ padding: '0.9rem', textAlign: 'center' }}><Mark on={row.wellness} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="card" style={{ background: 'var(--color-secondary-fade)', border: '1px solid var(--color-primary)', textAlign: 'center' }}>
                    <h4 style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                        Ayna is not a doctor, and never pretends to be.
                    </h4>
                    <p style={{ color: 'var(--color-text-muted)', maxWidth: '520px', margin: '0 auto', lineHeight: 1.6 }}>
                        Summaries are AI-written from cited sources and clinician input. Anything needing a diagnosis, we point you to a specialist.
                    </p>
                </div>
            </section>
        </div>
    );
}
