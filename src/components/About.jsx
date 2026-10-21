import React from 'react';
import { EdPage, EdBlock } from './editorial/EdPage';
import { Clip } from './personality/Bits.jsx';
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
  { title: 'Never pay\u2011to\u2011match', body: 'Sponsorship is never a match input.' },
];


const ADVISORS = [
  { name: 'Dr. David Orbach', title: 'BME, MD, Startup Advisor', photo: '/advisors/david-orbach.png', linkedin: 'https://www.linkedin.com/in/davidorbach/' },
  { name: 'Gwyn Blanton', title: 'Former Director of Ethics & Compliance, Deloitte', photo: '/advisors/gwyn-blanton.png', linkedin: 'https://www.linkedin.com/in/gwyn-blanton-8910638/' },
  { name: 'Albert Charles', title: 'Co-Founder, Gorges Ventures', photo: '/advisors/albert-charles.png', linkedin: 'https://www.linkedin.com/in/albert-charles-6800a41a1/' },
  { name: 'Erika Demonsant', title: 'Healthcare Consultant, Huron', photo: '/advisors/erika-demonsant.png', linkedin: 'https://www.linkedin.com/in/erikalacey/' },
  { name: 'Pamela Nasr', title: 'Product Lead, Benchling', photo: '/advisors/pamela-nasr.png', linkedin: 'https://www.linkedin.com/in/pamelatnasr/' },
  { name: 'Nishtha Kaushik', title: 'Ex-Amazon Marketing', photo: '/advisors/nishtha-kaushik.jpg', linkedin: 'https://www.linkedin.com/in/nkaushik29/' },
  { name: 'Navneet Kaur', title: 'TechThrive Ventures', photo: '/advisors/navneet-kaur.jpg', linkedin: 'https://www.linkedin.com/in/navneet-kaur-80109b227' },
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
  const cls = small ? 'ed-advisor__photo--sm' : '';
  if (advisor.photo && !failed) {
    return <img className={cls} src={advisor.photo} alt="" loading="lazy" onError={() => setFailed(true)} />;
  }
  return <div className={`ed-initials ${cls}`} aria-hidden="true">{initials(advisor.name)}</div>;
}

function FounderPhoto({ founder }) {
  const [failed, setFailed] = React.useState(false);
  if (founder.photo && !failed) {
    return (
      <img
        src={founder.photo}
        alt={founder.name}
        loading="lazy"
        style={founder.position ? { objectPosition: founder.position } : undefined}
        onError={() => setFailed(true)}
      />
    );
  }
  return <div className="ed-initials" aria-hidden="true">{initials(founder.name)}</div>;
}

function TeamPhoto() {
  const [failed, setFailed] = React.useState(false);
  if (failed) return null;
  return (
    <figure className="ay-polaroid ed-story__polaroid" style={{ '--tilt': '-1.5deg' }}>
      <Clip />
      <img src={TEAM_PHOTO} alt="The ayna founding team" style={{ objectPosition: '50% 70%' }} loading="lazy" onError={() => setFailed(true)} />
      <figcaption>{TEAM_CAPTION}</figcaption>
    </figure>
  );
}

export default function About({ onBack, onExplore, onStart }) {
  return (
    <EdPage
      title="We built the place we wished we could turn to."
      lede="Women’s wellness products matched to your needs, with the research and reviews beside them."
      onBack={onBack}
      photo="robe-pickles"
      tone="pink"
      frame="stamp"
    >
      <EdBlock
        title="Find what fits your body, with the research right next to it."
        intro="ayna matches women’s health products to your answers and puts the research and reviews beside each one, so you spend less time searching."
      >
        <ol className="ed-principles">
          {PRINCIPLES.map((p, i) => (
            <li key={p.title}>
              <b aria-hidden="true">{i + 1}</b>
              <h3 className="ed-rowtitle">{p.title}</h3>
              <p>{p.body}</p>
            </li>
          ))}
        </ol>
      </EdBlock>

      <EdBlock title="We kept asking the same thing: why is this so hard to find?">
        <div className="ed-story">
          <div className="ed-prose">
            <p>
              For our co-founder Puloma, getting a PMOS diagnosis took visits to three doctors. When she asked her OB-GYN
              which products could help manage her symptoms, she was told to “look it up.” Finding guidance on
              non-prescription products brought another challenge: figuring out where to begin.
            </p>
            <p>
              For Eliz and Ameera, growing up in households where intimate health wasn’t openly discussed meant looking
              online for answers to questions that were difficult to ask elsewhere.
            </p>
            <p>
              We met at Cornell, bringing different experiences to the same question:{' '}
              <em>why does understanding our options require so much searching?</em>
            </p>
            <p>
              ayna grew out of that question. We’re building a place where women can compare wellness products,
              understand the information behind them and find options that reflect their individual needs.
            </p>
            <div className="ed-pull">
              <p>ayna means “mirror.”</p>
              <p>
                Our name means mirror in Bengali and Turkish. To us, it expresses what we want this experience to feel like:
                a place that reflects you, your questions and what matters to you.
              </p>
            </div>
          </div>
          <TeamPhoto />
        </div>
      </EdBlock>

      <EdBlock
        title="The people building ayna"
        intro="We’re Puloma, Eliz and Ameera: three women who met at Cornell and wanted a better starting point for women trying to figure out wellness products."
      >
        <ul className="ed-people">
          {FOUNDERS.map((f) => (
            <li key={f.name} className="ed-person">
              <FounderPhoto founder={f} />
              <h3 className="ed-rowtitle">{f.name}</h3>
              <span className="ed-meta">{f.role}</span>
              {f.linkedin && (
                <a href={f.linkedin} target="_blank" rel="noopener noreferrer">
                  LinkedIn <span aria-hidden="true">↗</span><span className="ed-sr"> (opens in a new tab)</span>
                </a>
              )}
            </li>
          ))}
        </ul>
      </EdBlock>

      <EdBlock title="Advised by physicians and health-industry operators.">
        <ul className="ed-advisors" id="advisors">
          {ADVISORS.map((advisor) => (
            <li key={advisor.name} className="ed-advisor">
              <AdvisorPhoto advisor={advisor} />
              <span className="ed-rowtitle">{advisor.name}</span>
              <span className="ed-meta">{advisor.title}</span>
              {advisor.linkedin && (
                <a href={advisor.linkedin} target="_blank" rel="noopener noreferrer">
                  {advisor.linkLabel || 'LinkedIn'} <span aria-hidden="true">↗</span><span className="ed-sr"> (opens in a new tab)</span>
                </a>
              )}
            </li>
          ))}
        </ul>
        {SHOW_ADVISOR_IN_DISCUSSION && <div className="ed-advisor">
          <AdvisorPhoto advisor={ADVISOR_IN_DISCUSSION} small />
          <span className="ed-rowtitle">{ADVISOR_IN_DISCUSSION.name}</span>
          <span className="ed-meta">{ADVISOR_IN_DISCUSSION.title}</span>
          <span className="ed-caption">In conversation with ayna, not yet a confirmed advisor</span>
        </div>}
      </EdBlock>

      <section className="ed-block ay-band ay-band--espresso ay-band--bleed ay-band--scallop ed-closer ed-closer--band" aria-labelledby="ed-about-closer">
        <div>
          <h2 id="ed-about-closer" className="ed-h2">A place to return to as your needs change.</h2>
          <p className="ed-body">
            The questions you have about your body can change over time. We want ayna to grow with those questions,
            making women’s wellness easier to explore at every stage.
          </p>
        </div>
        {(onStart || onExplore) && (
          <div className="ed-closer__cta">
            {onStart && <button type="button" className="ay-btn ay-btn--primary" onClick={() => onStart()}>See my matches</button>}
            {onExplore && <button type="button" className="ay-btn ay-btn--secondary" onClick={() => onExplore()}>Browse the Shop</button>}
          </div>
        )}
      </section>
    </EdPage>
  );
}
