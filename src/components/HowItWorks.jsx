import React from 'react';

/**
 * About Us / How it works — a port of mockup board 1j, "About Us — how
 * matching works, with the numbers": gradient hero, the funnel, the two
 * source/score cards, the four-gate decision tree, the comparison table and
 * the not-a-doctor band.
 *
 * The numbers are the board's own illustrative figures for one example
 * profile, which the funnel card says on its face. The board also carried an
 * "AYNA PILOT COHORT SURVEY · 2026 · n=412" attribution under the "1 in 2
 * women" line; that survey citation is deliberately not reproduced here.
 */

const FUNNEL = [
    { label: 'Scanned market', value: 3140, width: '100%', fill: 'linear-gradient(90deg,#242A52,#3b3866)' },
    { label: 'Relevant to you', value: 212, width: '34%', fill: 'linear-gradient(90deg,#4E3866,#6d4a72)' },
    { label: 'Passed evidence', value: 41, width: '14%', fill: 'linear-gradient(90deg,#8A5049,#A2603C)' },
    { label: 'Shown in your shop', value: 14, width: '7%', fill: 'linear-gradient(90deg,#C07A2C,#F0A84B)' },
];

const SOURCES = [
    { label: 'NIH research', value: 12, width: '100%' },
    { label: 'ACOG guidance', value: 9, width: '75%' },
    { label: 'CDC data', value: 5, width: '42%' },
    { label: 'Clinician notes', value: 3, width: '25%' },
    { label: 'Community', value: 14, width: '88%' },
];

const MATCH_BREAKDOWN = [
    { label: 'Your profile fit', pct: 38, color: '#242A52' },
    { label: 'Evidence strength', pct: 27, color: '#4E3866' },
    { label: 'Clinician input', pct: 21, color: '#8A5049' },
    { label: 'Women like you', pct: 14, color: '#F0A84B' },
];

const GATES = [
    { n: '01', title: 'You tell us', body: 'Stage of life, goals, sensitivities, city.', chip: 'Postpartum · 8 weeks · sensitive skin · NYC' },
    { n: '02', title: 'We scan the market', body: 'Every product we can find, not a paid shelf.', figure: '3,140', figureNote: 'scanned' },
    { n: '03', title: 'Evidence gate', body: 'Checked against NIH, ACOG and CDC guidance.', dashed: 'Fails a check → dropped' },
    { n: '04', title: 'Your shop', body: 'Ranked, each with its match reason attached.', figure: '14', dark: true },
];

const COMPARISON_ROWS = [
    { label: 'Matched to your health profile', ayna: true, search: false, wellness: false },
    { label: 'Cycle & goal aware', ayna: true, search: false, wellness: false },
    { label: 'Vetted brands and providers', ayna: true, search: false, wellness: true },
    { label: 'No sponsored-first results', ayna: true, search: false, wellness: false },
    { label: 'Clinician input on every category', ayna: true, search: false, wellness: false },
];

function Mark({ on }) {
    return <span className={on ? 'hiw-mark hiw-mark--yes' : 'hiw-mark'}>{on ? '✓' : '✗'}</span>;
}

export default function HowItWorks({ onBack, onViewSources }) {
    return (
        <div className="hiw animate-fade-in-up">
            <section className="hiw-hero">
                <div className="hiw-hero__col">
                    {onBack && (
                        <button type="button" className="hiw-back" onClick={onBack}>← Back</button>
                    )}
                    <div className="hiw-hero__eyebrow">How it works</div>
                    <h1 className="hiw-hero__headline">
                        No <span style={{ fontStyle: 'italic', color: '#F0A84B' }}>mystery box</span>.
                    </h1>
                    <p className="hiw-hero__sub">Every product you see cleared four filters. Here they are.</p>
                </div>
            </section>

            <section className="mockup-page hiw-lede">
                <h2 className="hiw-lede__stat">1 in 2 women feel unseen by the wellness industry.</h2>
                <p className="hiw-lede__body">
                    Generic wellness content doesn&apos;t account for your cycle, your history, or what&apos;s already
                    worked for you. Ayna builds a living health profile, then matches it against the open market
                    and published research. In that order.
                </p>
            </section>

            <section className="mockup-page hiw-block">
                <div className="hiw-kicker">The funnel</div>
                <h3 className="hiw-h">3,140 products in. 14 reach you.</h3>
                <div className="hiw-card hiw-funnel">
                    {FUNNEL.map((row) => (
                        <div key={row.label} className="hiw-funnel__row">
                            <span className="hiw-funnel__label">{row.label}</span>
                            <span className="hiw-funnel__track">
                                <span style={{ width: row.width, background: row.fill }} />
                            </span>
                            <span className="hiw-funnel__value">{row.value.toLocaleString()}</span>
                        </div>
                    ))}
                    <p className="hiw-note">Example profile: postpartum, 8 weeks, sensitive skin, NYC.</p>
                </div>
            </section>

            <section className="mockup-page hiw-pair">
                <div className="hiw-card">
                    <div className="hiw-card__label">What we check against</div>
                    <h4 className="hiw-card__title">Sources behind a single match</h4>
                    <div className="hiw-sources">
                        {SOURCES.map((s) => (
                            <div key={s.label} className="hiw-sources__row">
                                <span className="hiw-sources__label">{s.label}</span>
                                <span className="hiw-sources__track">
                                    <span style={{ width: s.width }} />
                                </span>
                                <span className="hiw-sources__value">{s.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="hiw-card hiw-card--column">
                    <div className="hiw-card__label">What a match score is made of</div>
                    <h4 className="hiw-card__title">98% match, broken down</h4>
                    <div className="hiw-stack">
                        {MATCH_BREAKDOWN.map((m) => (
                            <span key={m.label} style={{ width: `${m.pct}%`, background: m.color }} />
                        ))}
                    </div>
                    <div className="hiw-legend">
                        {MATCH_BREAKDOWN.map((m) => (
                            <div key={m.label} className="hiw-legend__row">
                                <span className="hiw-legend__swatch" style={{ background: m.color }} />
                                {m.label}
                                <span className="hiw-legend__pct">{m.pct}%</span>
                            </div>
                        ))}
                    </div>
                    <p className="hiw-note hiw-note--push">Sponsorship is never an input.</p>
                </div>
            </section>

            <section className="mockup-page hiw-block">
                <div className="hiw-kicker">The decision tree</div>
                <h3 className="hiw-h">Four gates, in order.</h3>
                <div className="hiw-gates">
                    {GATES.map((g) => (
                        <div key={g.n} className={`hiw-gate${g.dark ? ' hiw-gate--dark' : ''}`}>
                            <div className="hiw-gate__n">{g.n}</div>
                            <div className="hiw-gate__title">{g.title}</div>
                            <div className="hiw-gate__body">{g.body}</div>
                            {g.chip && <div className="hiw-gate__chip">{g.chip}</div>}
                            {g.dashed && <div className="hiw-gate__chip hiw-gate__chip--dashed">{g.dashed}</div>}
                            {g.figure && (
                                <div className="hiw-gate__figure">
                                    {g.figure}
                                    {g.figureNote && <span> {g.figureNote}</span>}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            <section className="mockup-page hiw-block">
                <div className="hiw-kicker">Our difference</div>
                <h3 className="hiw-h">Why this isn&apos;t a search engine.</h3>
                <div className="hiw-card hiw-table">
                    <div className="hiw-table__row hiw-table__row--head">
                        <span />
                        <span className="hiw-table__ayna">AYNA</span>
                        <span>SEARCH &amp; INFLUENCERS</span>
                        <span>WELLNESS APPS</span>
                    </div>
                    {COMPARISON_ROWS.map((row) => (
                        <div key={row.label} className="hiw-table__row">
                            <span>{row.label}</span>
                            <span><Mark on={row.ayna} /></span>
                            <span><Mark on={row.search} /></span>
                            <span><Mark on={row.wellness} /></span>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mockup-page">
                <div className="hiw-band">
                    <div>
                        <div className="hiw-band__title">Ayna is not a doctor, and never pretends to be.</div>
                        <div className="hiw-band__body">
                            Summaries are AI-written from cited sources and clinician input. Anything needing a
                            diagnosis, we point you to a specialist.
                        </div>
                    </div>
                    <button type="button" className="hiw-band__cta" onClick={onViewSources}>Read our sources</button>
                </div>
            </section>
        </div>
    );
}
