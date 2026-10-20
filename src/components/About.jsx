import React from 'react';
import { InfoPage, InfoSection } from './InfoPage';
import { TEAM_CAPTION } from '../data/welcomeSlides.js';

/**
 * About = people, story, mission and advisors (audit HW01). The method itself
 * (profile, market, evidence, shop) lives on How It Works only.
 *
 * Only real, already-published information is used here: the founders' story,
 * team and portrait photos (public/about/), founder titles, LinkedIn links and
 * the advisor list. A missing photo falls back to initials, so nothing breaks.
 */

const TEAM_PHOTO = '/about/team.jpg';

const FOUNDERS = [
  // position: which part of the photo stays in frame in the 4:3 crop.
  { name: 'Puloma Bishnu', role: 'Co-founder & CEO', photo: '/about/puloma.jpg', position: '50% 22%', linkedin: 'https://www.linkedin.com/in/pulomabishnu/' },
  { name: 'Eliz Celik', role: 'Co-founder & COO', photo: '/about/eliz.jpg', position: '50% 38%', linkedin: 'https://www.linkedin.com/in/eliz-celik-098215216/' },
  { name: 'Ameera Omar', role: 'Co-founder, CMO & Interim CTO', photo: '/about/ameera.jpg', position: '50% 50%', linkedin: 'https://www.linkedin.com/in/ameera-omar/' },
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
  { name: 'Dr. David Orbach', title: 'BME, MD, Startup Advisor', photo: '/advisors/david-orbach.png', linkedin: 'https://www.linkedin.com/in/davidorbach/' },
  { name: 'Gwyn Blanton', title: 'Former Director of Ethics & Compliance, Deloitte', photo: '/advisors/gwyn-blanton.png', linkedin: 'https://www.linkedin.com/in/gwyn-blanton-8910638/' },
  { name: 'Albert Charles', title: 'Co-Founder, Gorges Ventures', photo: '/advisors/albert-charles.png', linkedin: 'https://www.linkedin.com/in/albert-charles-6800a41a1/' },
  { name: 'Erika Demonsant', title: 'Healthcare Consultant, Huron', photo: '/advisors/erika-demonsant.png', linkedin: 'https://www.linkedin.com/in/erikalacey/' },
  { name: 'Pamela Nasr', title: 'Product Lead, Benchling', photo: '/advisors/pamela-nasr.png', linkedin: 'https://www.linkedin.com/in/pamelatnasr/' },
  { name: 'Nishtha Kaushik', title: 'Advisor', photo: '/advisors/nishtha-kaushik.jpg', linkedin: 'https://www.linkedin.com/in/nkaushik29/' },
  { name: 'Navneet Kaur', title: 'Advisor', photo: '/advisors/navneet-kaur.jpg', linkedin: 'https://www.linkedin.com/in/navneet-kaur-80109b227' },
  // No LinkedIn found; links her Houston Methodist physician profile instead.
  { name: 'Dr. Anuja Vyas', title: 'Board-Certified OB/GYN, Advisor', photo: '/advisors/anuja-vyas.jpg', linkedin: 'https://www.houstonmethodist.org/doctor/anuja-vyas/', linkLabel: 'Profile' },
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
    return <img className={cls} src={advisor.photo} alt="" loading="lazy" onError={() => setFailed(true)} />;
  }
  return <div className={`${cls} ay-info-advisor__photo--initials`} aria-hidden="true">{initials(advisor.name)}</div>;
}

function FounderPhoto({ founder }) {
  const [failed, setFailed] = React.useState(false);
  if (founder.photo && !failed) {
    return (
      <img
        className="ay-info-founder__photo"
        src={founder.photo}
        alt={founder.name}
        loading="lazy"
        style={founder.position ? { objectPosition: founder.position } : undefined}
        onError={() => setFailed(true)}
      />
    );
  }
  return <div className="ay-info-founder__photo ay-info-founder__photo--initials" aria-hidden="true">{initials(founder.name)}</div>;
}

function TeamPhoto() {
  const [failed, setFailed] = React.useState(false);
  if (failed) return null;
  return (
    <figure className="ay-info-team__photo ay-info-story__photo">
      <img src={TEAM_PHOTO} alt="The ayna founding team" style={{ objectPosition: '50% 70%' }} onError={() => setFailed(true)} />
      <figcaption>{TEAM_CAPTION}</figcaption>
    </figure>
  );
}

export default function About({ onBack, onExplore, onStart }) {
  return (
    <InfoPage photos={['robe-pickles', 'lilies', 'pink-stripe-floor']}
      eyebrow="About ayna"
      title={<>We built the place we wished we could turn to.</>}
      lede="Women’s wellness products matched to your needs, with the research and reviews beside them."
      onBack={onBack}
    >
      <InfoSection
        eyebrow="Our mission"
        title="Your body. Your questions. A clearer place to start."
        intro="ayna helps you discover women’s wellness products with your needs in mind. Explore product information, research and reviews in one place, so you can spend less time searching and more time understanding your options."
      >
        {/* Numbered like the landing's "Your counter, decoded" (was four colour blobs). */}
        <ol className="ay-info-principles">
          {PRINCIPLES.map((p, i) => (
            <li key={p.title}>
              <span className="ay-info-principles__n" aria-hidden="true">{i + 1}</span>
              <div><h3>{p.title}</h3><p>{p.body}</p></div>
            </li>
          ))}
        </ol>
      </InfoSection>

      <InfoSection eyebrow="Our story" title="Three of us, one question: why is this so hard to find?">
        <div className="ay-info-story">
          <div className="ay-info-card ay-info-card--pad ay-info-story__text">
            <p className="ay-info__body">
              For our co-founder Puloma, getting a PMOS (PCOS) diagnosis took visits to three doctors. When she asked her OB-GYN
              which products could help manage her symptoms, she was told to “look it up.” Finding guidance on
              non-prescription products brought another challenge: figuring out where to begin.
            </p>
            <p className="ay-info__body">
              For Eliz and Ameera, growing up in households where intimate health wasn’t openly discussed meant looking
              online for answers to questions that were difficult to ask elsewhere.
            </p>
            <p className="ay-info__body">
              We met at Cornell, bringing different experiences to the same question:{' '}
              <em>why does understanding our options require so much searching?</em>
            </p>
            <p className="ay-info__body">
              ayna grew out of that question. We’re building a place where women can explore wellness products,
              understand the information behind them and find options that reflect their individual needs.
            </p>
          </div>
          <TeamPhoto />
        </div>
        <div className="ay-info-card ay-info-card--pad ay-info-card--butter ay-info-mirror">
          <h3 className="ay-info-card__title">ayna means “mirror.”</h3>
          <p className="ay-info__body">
            Our name means mirror in Bengali and Turkish. To us, it expresses what we want this experience to feel like:
            a place that reflects you, your questions and what matters to you.
          </p>
        </div>
      </InfoSection>

      {/* The icon + title + line ×3 block was cut: the landing's "Your counter, decoded" says it better. */}
      <InfoSection
        eyebrow="Meet the founders"
        title="The people building ayna."
        intro="We’re Puloma, Eliz and Ameera: three women who met at Cornell and wanted a better starting point for women navigating wellness products."
      >
        <ul className="ay-info-grid ay-info-grid--3 ay-info-founders">
          {FOUNDERS.map((f) => (
            <li key={f.name} className="ay-info-card ay-info-founder">
              <FounderPhoto founder={f} />
              <div className="ay-info-founder__body">
                <h3 className="ay-info-card__title">{f.name}</h3>
                <div className="ay-info-team__role">{f.role}</div>
                {f.linkedin && (
                  <a className="ay-info-advisor__link" href={f.linkedin} target="_blank" rel="noopener noreferrer">
                    LinkedIn <span aria-hidden="true">↗</span>
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      </InfoSection>

      <InfoSection eyebrow="Advisors" title="Advised by physicians and health-industry operators.">
        <ul className="ay-info-advisors" id="advisors">
          {ADVISORS.map((advisor) => (
            <li key={advisor.name} className="ay-info-advisor">
              <AdvisorPhoto advisor={advisor} />
              <div className="ay-info-advisor__name">{advisor.name}</div>
              <div className="ay-info-advisor__title">{advisor.title}</div>
              {advisor.linkedin && (
                <a className="ay-info-advisor__link" href={advisor.linkedin} target="_blank" rel="noopener noreferrer">
                  {advisor.linkLabel || 'LinkedIn'} <span aria-hidden="true">↗</span>
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

      <InfoSection>
        <div className="ay-info-card ay-info-card--pad ay-info-card--peri ay-info-cta">
          <div>
            <h2 className="ay-info__h2 ay-info__h2--sm">A place to return to as your needs change.</h2>
            <p className="ay-info__body">
              The questions you have about your body can change over time. We want ayna to grow with those questions,
              making women’s wellness easier to explore at every stage.
            </p>
          </div>
          {(onStart || onExplore) && (
            <div className="ay-info-btn-row">
              {onStart && <button type="button" className="ay-info-btn" onClick={() => onStart()}>See my matches</button>}
              {onExplore && <button type="button" className="ay-info-btn ay-info-btn--ghost" onClick={() => onExplore()}>Browse the Shop</button>}
            </div>
          )}
        </div>
      </InfoSection>
    </InfoPage>
  );
}
