import React from 'react';
import { InfoPage, InfoSection } from './InfoPage';
import { TEAM_PHOTO, TEAM_CAPTION } from '../data/welcomeSlides.js';

/**
 * About = people, mission and advisors (audit HW01). The method itself
 * (profile, market, evidence, shop) lives on How It Works only.
 *
 * Only real, already-published information is used here: the team photo,
 * the founders' names, and the advisor list this page already carried.
 */

const FOUNDERS = [
  { name: 'Puloma Bishnu', role: 'Co-founder & CEO' },
  { name: 'Ameera Omar', role: 'Co-founder, CMO & interim CTO' },
  { name: 'Eliz Celik', role: 'Co-founder & COO' },
];
// Advisors in discussion stay off the public page until confirmed.
const SHOW_ADVISOR_IN_DISCUSSION = false;

const PRINCIPLES = [
  { title: 'Matched to you', body: 'Your profile shapes what you see.' },
  { title: 'Evidence-aware', body: 'Research and guidance add context.' },
  { title: 'Clinician + community', body: 'Two kinds of experience, side by side.' },
  { title: 'Never pay-to-match', body: 'Sponsorship is never a match input.' },
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

/** Not yet a confirmed advisor. Kept separate from ADVISORS rather than
 * implying a relationship that isn't official yet. */
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

function AdvisorPhoto({ advisor, small = false }) {
  const [failed, setFailed] = React.useState(false);
  const cls = `ay-info-advisor__photo${small ? ' ay-info-advisor__photo--sm' : ''}`;
  if (advisor.photo && !failed) {
    return <img className={cls} src={advisor.photo} alt="" onError={() => setFailed(true)} />;
  }
  return <div className={`${cls} ay-info-advisor__photo--initials`} aria-hidden="true">{initials(advisor.name)}</div>;
}

export default function About({ onBack }) {
  return (
    <InfoPage
      eyebrow="About ayna"
      title={<>Made for the whole you.</>}
      lede="Women's health isn't one-size-fits-all. ayna helps you explore options with the context, evidence and explanations you deserve."
      onBack={onBack}
    >
      <InfoSection eyebrow="The people" title="Who's behind ayna">
        <div className="ay-info-team">
          <figure className="ay-info-team__photo">
            <img src={TEAM_PHOTO} alt="The ayna founders together outdoors" />
            <figcaption>{TEAM_CAPTION}</figcaption>
          </figure>
          <div className="ay-info-card ay-info-team__card">
            <span className="ay-info__pill">Founders</span>
            <ul className="ay-info-team__names">
              {FOUNDERS.map((f) => <li key={f.name}><strong>{f.name}</strong><span className="ay-info-team__role">{f.role}</span></li>)}
            </ul>
            <p className="ay-info__body">
              Real people building a place to explore women's health with more clarity, care and community.
            </p>
          </div>
        </div>
      </InfoSection>

      <InfoSection
        eyebrow="Our mission"
        title="Discovery with context."
        intro="ayna is a place to discover women's health products with more context. You tell us about your goals and preferences. We help you find relevant options and show why they may fit."
      >
        <div className="ay-info-grid ay-info-grid--4">
          {PRINCIPLES.map((p, i) => (
            <div key={p.title} className={`ay-info-tile ay-info-tile--${['peri', 'pink', 'mint', 'butter'][i]}`}>
              <div className="ay-info-tile__title">{p.title}</div>
              <p className="ay-info-tile__body">{p.body}</p>
            </div>
          ))}
        </div>
      </InfoSection>

      <InfoSection eyebrow="Advisors" title="Guided by real expertise.">
        <ul className="ay-info-advisors">
          {ADVISORS.map((advisor) => (
            <li key={advisor.name} className="ay-info-advisor">
              <AdvisorPhoto advisor={advisor} />
              <div className="ay-info-advisor__name">{advisor.name}</div>
              <div className="ay-info-advisor__title">{advisor.title}</div>
              {advisor.linkedin && (
                <a className="ay-info-advisor__link" href={advisor.linkedin} target="_blank" rel="noopener noreferrer">
                  LinkedIn <span aria-hidden="true">↗</span>
                </a>
              )}
            </li>
          ))}
        </ul>
        {SHOW_ADVISOR_IN_DISCUSSION && <div className="ay-info-advisor-note">
          <AdvisorPhoto advisor={ADVISOR_IN_DISCUSSION} small />
          <div>
            <strong>{ADVISOR_IN_DISCUSSION.name}</strong>, {ADVISOR_IN_DISCUSSION.title}
            <div className="ay-info-advisor-note__label">In conversation with ayna, not yet a confirmed advisor</div>
          </div>
        </div>}
      </InfoSection>
    </InfoPage>
  );
}
