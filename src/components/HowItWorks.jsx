import React from 'react';

const STEPS = [
  { n: '01', title: 'You tell us', body: 'Stage of life, goals, sensitivities, city.', detail: 'Your profile' },
  { n: '02', title: 'We scan', body: 'Relevant products across the open market.', detail: 'Broad search' },
  { n: '03', title: 'Evidence check', body: 'Research, guidance, clinician input.', detail: 'Quality gate' },
  { n: '04', title: 'Your ecosystem', body: 'The strongest fits, with clear reasons.', detail: 'Your matches' },
];

export default function HowItWorks({ onBack }) {
  return (
    <div className="hiw-simple animate-fade-in-up">
      <section className="mockup-page hiw-simple__intro">
        {onBack && <button type="button" className="hiw-back hiw-back--light" onClick={onBack}>Back</button>}
        <div className="hiw-kicker">How it works</div>
        <h1 className="hiw-simple__title">No mystery box.</h1>
        <p className="hiw-simple__sub">Your profile. The market. The evidence. Your matches.</p>
      </section>

      <section className="mockup-page hiw-simple__steps" aria-label="How Ayna works">
        {STEPS.map((step) => (
          <article className="hiw-simple__step" key={step.n}>
            <div className="hiw-simple__n">STEP {step.n}</div>
            <h2>{step.title}</h2>
            <p>{step.body}</p>
            <div className={`hiw-simple__visual hiw-simple__visual--${step.n}`} aria-hidden="true">
              <span>{step.detail}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="mockup-page hiw-simple__cta">
        <div>
          <div className="hiw-kicker">Personalized from the start</div>
          <h2>Nothing paid gets a better match.</h2>
        </div>
      </section>
    </div>
  );
}
