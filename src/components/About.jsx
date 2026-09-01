import React from 'react';

const FUNNEL = [
  { label: 'Open market', width: '100%', fill: 'linear-gradient(90deg,#242A52,#3b3866)' },
  { label: 'Fits your profile', width: '68%', fill: 'linear-gradient(90deg,#4E3866,#6d4a72)' },
  { label: 'Passes evidence checks', width: '42%', fill: 'linear-gradient(90deg,#8A5049,#A2603C)' },
  { label: 'Reaches your shop', width: '24%', fill: 'linear-gradient(90deg,#C07A2C,#F0A84B)' },
];

const GATES = [
  { n: '01', title: 'Your profile', body: 'Goals, stage of life, sensitivities, preferences.' },
  { n: '02', title: 'The market', body: 'Relevant products across the open market.' },
  { n: '03', title: 'The evidence', body: 'Research, guidance, clinician and community signals.' },
  { n: '04', title: 'Your shop', body: 'The strongest fits, with clear reasons.' },
];

const DIFFERENCES = [
  'Matched to your profile',
  'Evidence-aware',
  'Clinician + community context',
  'Sponsored placement never changes match',
];

const ADVISORS = [
  { name: 'Dr. David Orbach', title: 'BME, MD, Startup Advisor', photo: '/advisors/david-orbach.png' },
  { name: 'Gwyn Blanton', title: 'Former Director of Ethics & Compliance, Deloitte', photo: '/advisors/gwyn-blanton.png' },
  { name: 'Albert Charles', title: 'Co-Founder, Gorges Ventures', photo: '/advisors/albert-charles.png' },
  { name: 'Erika Demonsant', title: 'Healthcare Consultant, Huron', photo: '/advisors/erika-demonsant.png' },
  { name: 'Pamela Nasr', title: 'Product Lead, Benchling', photo: '/advisors/pamela-nasr.png' },
  { name: 'Nishtha Kaushik', title: 'Advisor', linkedin: 'https://www.linkedin.com/in/nkaushik29/' },
  { name: 'Navneet Kaur', title: 'Advisor', linkedin: 'https://www.linkedin.com/in/navneet-kaur-80109b227' },
];

/** Not yet a confirmed advisor — keep separate from ADVISORS rather than
 * implying a relationship that isn't official yet (same standard as brand
 * partnerships elsewhere in the app). */
const ADVISOR_IN_DISCUSSION = {
  name: 'Dr. Denise Howard',
  title: 'Chief of OBGYN, NY-Presbyterian Brooklyn Methodist',
  photo: '/advisors/denise-howard.png',
};

function initials(name) {
  return name
    .replace(/^Dr\.\s*/i, '')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function AdvisorPhoto({ advisor }) {
  const [failed, setFailed] = React.useState(false);
  if (advisor.photo && !failed) {
    return (
      <img
        className="about-advisor__photo"
        src={advisor.photo}
        alt={advisor.name}
        onError={() => setFailed(true)}
      />
    );
  }
  return <div className="about-advisor__initials">{initials(advisor.name)}</div>;
}

export default function About({ onBack, onViewSources }) {
  return (
    <div className="hiw animate-fade-in-up">
      <section className="hiw-hero">
        <div className="hiw-hero__col">
          {onBack && <button type="button" className="hiw-back" onClick={onBack}>Back</button>}
          <div className="hiw-hero__eyebrow">About ayna</div>
          <h1 className="hiw-hero__headline">No <span style={{ fontStyle: 'italic', color: '#F0A84B' }}>mystery box</span>.</h1>
          <p className="hiw-hero__sub">See what shapes your shop.</p>
        </div>
      </section>

      <section className="mockup-page hiw-lede">
        <h2 className="hiw-lede__stat">Women&apos;s health isn&apos;t one-size-fits-all.</h2>
        <p className="hiw-lede__body">ayna starts with you, scans relevant products, checks available evidence, then makes the reasoning visible.</p>
      </section>

      <section className="mockup-page hiw-block">
        <div className="hiw-kicker">The funnel</div>
        <h3 className="hiw-h">Broad in. Focused out.</h3>
        <div className="hiw-card hiw-funnel">
          {FUNNEL.map((row) => (
            <div key={row.label} className="hiw-funnel__row hiw-funnel__row--concept">
              <span className="hiw-funnel__label">{row.label}</span>
              <span className="hiw-funnel__track"><span style={{ width: row.width, background: row.fill }} /></span>
            </div>
          ))}
        </div>
      </section>

      <section className="mockup-page hiw-pair">
        <div className="hiw-card">
          <div className="hiw-card__label">What we look at</div>
          <h4 className="hiw-card__title">Multiple signals, one view</h4>
          <div className="about-source-grid">
            {['Published research', 'Clinical guidance', 'Clinician input', 'Community experience'].map((label) => <span key={label}>{label}</span>)}
          </div>
        </div>
        <div className="hiw-card hiw-card--column">
          <div className="hiw-card__label">What shapes a match</div>
          <h4 className="hiw-card__title">Relevant, not paid-first</h4>
          <div className="about-factor-list">
            {['Your profile', 'Evidence', 'Clinician context', 'Community context'].map((label) => <div key={label}>{label}</div>)}
          </div>
          <p className="hiw-note hiw-note--push">Sponsorship is never a match input.</p>
        </div>
      </section>

      <section className="mockup-page hiw-block">
        <div className="hiw-kicker">The process</div>
        <h3 className="hiw-h">Four gates, in order.</h3>
        <div className="hiw-gates">
          {GATES.map((gate) => (
            <div key={gate.n} className={`hiw-gate${gate.n === '04' ? ' hiw-gate--dark' : ''}`}>
              <div className="hiw-gate__n">{gate.n}</div>
              <div className="hiw-gate__title">{gate.title}</div>
              <div className="hiw-gate__body">{gate.body}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mockup-page hiw-block">
        <div className="hiw-kicker">Why ayna</div>
        <h3 className="hiw-h">Discovery with context.</h3>
        <div className="about-difference-grid">
          {DIFFERENCES.map((item) => <div key={item}>{item}</div>)}
        </div>
      </section>

      <section className="mockup-page hiw-block">
        <div className="hiw-kicker">Our advisors</div>
        <h3 className="hiw-h">Guided by real expertise.</h3>
        <div className="about-advisor-grid">
          {ADVISORS.map((advisor) => (
            <div key={advisor.name} className="about-advisor">
              <AdvisorPhoto advisor={advisor} />
              <div className="about-advisor__name">{advisor.name}</div>
              <div className="about-advisor__title">{advisor.title}</div>
              {advisor.linkedin && (
                <a className="about-advisor__link" href={advisor.linkedin} target="_blank" rel="noopener noreferrer">
                  LinkedIn ↗
                </a>
              )}
            </div>
          ))}
        </div>
        <div className="about-advisor-note">
          <AdvisorPhoto advisor={ADVISOR_IN_DISCUSSION} />
          <div>
            <strong>{ADVISOR_IN_DISCUSSION.name}</strong> — {ADVISOR_IN_DISCUSSION.title}
            <div className="about-advisor-note__label">In conversation with ayna, not yet a confirmed advisor</div>
          </div>
        </div>
      </section>

      <section className="mockup-page">
        <div className="hiw-band">
          <div>
            <div className="hiw-band__title">ayna is not a doctor.</div>
            <div className="hiw-band__body">Medical decisions stay with you and your clinician.</div>
          </div>
          {onViewSources && <button type="button" className="hiw-band__cta" onClick={onViewSources}>Sources</button>}
        </div>
      </section>
    </div>
  );
}
