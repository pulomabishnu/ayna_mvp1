import React from 'react';

/**
 * How it works — rebuilt 2026-10-05 from the "How It Works" design export,
 * sharing the About page's `ab-` styles (Playfair Display / DM Sans, navy
 * ink, gradient hero). The design's advisors section is intentionally left
 * out: advisors live on the About page.
 */

const STEPS = [
  {
    n: '01',
    title: 'You tell us',
    body: 'Stage of life, goals, sensitivities and the details you choose to share.',
    chips: ['Your profile', 'Your choices'],
  },
  {
    n: '02',
    title: 'We narrow the market',
    body: 'Products across the open market are filtered for category fit, known safety conflicts and relevance.',
    chips: ['Category fit', 'Safety conflicts'],
  },
  {
    n: '03',
    title: 'We add evidence',
    body: 'Published research, clinical guidance, product and safety sources, and community experience — where available.',
    note: 'Unsupported claims are labeled, not upgraded into facts.',
  },
  {
    n: '04',
    title: 'Your ecosystem',
    body: 'Your strongest fits, each shown with its match reason and source context.',
    dark: true,
  },
];

const FUNNEL = [
  { label: 'Open market', width: '100%', fill: 'linear-gradient(90deg,#242A52,#3B3866)' },
  { label: 'Fits your profile', width: '68%', fill: 'linear-gradient(90deg,#4E3866,#6D4A72)' },
  { label: 'Passes evidence checks', width: '42%', fill: 'linear-gradient(90deg,#8A5049,#A2603C)' },
  { label: 'Reaches your shop', width: '24%', fill: 'linear-gradient(90deg,#C07A2C,#F0A84B)', light: true },
];

const MATCH_INPUTS = ['Your profile', 'Published research', 'Clinical guidance + clinician input', 'Community experience'];

export default function HowItWorks({ onBack, onViewSources }) {
  const openSources = () => {
    if (onViewSources) onViewSources();
    else if (onBack) onBack();
  };

  return (
    <div className="ab animate-fade-in-up">
      <section className="hiw-hero ab-hero">
        <div className="hiw-hero__col">
          <div className="hiw-hero__eyebrow ab-eyebrow">How it works</div>
          <h1 className="hiw-hero__headline ab-hero__headline">
            No <em>mystery box.</em>
          </h1>
          <p className="hiw-hero__sub ab-hero__sub">See what shapes your shop.</p>
        </div>
      </section>

      <div className="ab-wrap">
        <section className="ab-split ab-intro">
          <h2 className="ab-h2">Women’s health isn’t <span className="ab-nowrap">one-size-fits-all.</span></h2>
          <p className="ab-p">
            ayna compares products with the health profile and preferences you choose to share, then adds cited research,
            clinical guidance, safety information and community context where available.
          </p>
        </section>

        <section className="ab-block">
          <div className="ab-eyebrow">The process</div>
          <h2 className="ab-h2 ab-h2--section">Four steps, in order.</h2>
          <div className="ab-steps">
            {STEPS.map((step) => (
              <div key={step.n} className={`ab-card ab-step${step.dark ? ' ab-step--dark' : ''}`}>
                <div className="ab-step__n">{step.n}</div>
                <h3 className="ab-h3">{step.title}</h3>
                <p className="ab-p ab-p--sm">{step.body}</p>
                {step.chips && (
                  <div className="ab-chips">
                    {step.chips.map((chip) => <span key={chip} className="ab-chip">{chip}</span>)}
                  </div>
                )}
                {step.note && <div className="ab-step__note">{step.note}</div>}
              </div>
            ))}
          </div>
        </section>

        <section className="ab-block">
          <div className="ab-eyebrow">The funnel</div>
          <h2 className="ab-h2 ab-h2--section">Broad in. Focused out.</h2>
          <div className="ab-card ab-funnel">
            {FUNNEL.map((row, i) => (
              <React.Fragment key={row.label}>
                {i > 0 && <div className="ab-funnel__arrow" aria-hidden="true">↓</div>}
                <div
                  className={`ab-funnel__bar${row.light ? ' ab-funnel__bar--light' : ''}`}
                  style={{ width: row.width, background: row.fill }}
                >
                  {row.label}
                </div>
              </React.Fragment>
            ))}
          </div>
        </section>

        <section className="ab-split ab-match">
          <div>
            <div className="ab-eyebrow">What shapes a match</div>
            <h2 className="ab-h2 ab-h2--section">Relevant, not paid-first.</h2>
            <p className="ab-p">
              Personalized picks are ranked on relevance to you — not on commission rate or partnership status.
              Sponsorship is never a match input.
            </p>
          </div>
          <div className="ab-match__grid">
            {MATCH_INPUTS.map((label) => <div key={label} className="ab-match__item">{label}</div>)}
          </div>
        </section>

        <section className="ab-card ab-notdoctor">
          <div>
            <h2 className="ab-h2 ab-notdoctor__title">ayna is not a doctor, and never pretends to be.</h2>
            <p className="ab-p ab-p--sm">
              Summaries may be AI-assisted and are grounded in cited sources where available. “Clinical context” can
              include published guidance, clinician-authored sources or clearly labeled brand-provided clinician claims;
              it does not mean every product has been independently reviewed by an ayna clinician.
            </p>
          </div>
          <button type="button" className="ab-btn-outline" onClick={openSources}>Read our sources</button>
        </section>
      </div>
    </div>
  );
}
