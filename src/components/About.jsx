import React from 'react';

/**
 * About — rebuilt 2026-10-05 from the "About Us" design export.
 *
 * Photos: drop files at the paths below (public/about/...) and they replace
 * the dashed placeholders automatically; a missing or broken file falls back
 * to the placeholder, so nothing breaks before photos are uploaded.
 *
 * The hero keeps the hiw-hero classes so it stays one painted canvas with the
 * gradient nav (App.jsx: app-nav--about). Everything below uses its own `ab-`
 * classes so the older hiw-/about- overrides in the v6 stylesheets don't apply.
 */

const TEAM_PHOTO = '/about/team.jpg';

const FOUNDERS = [
  // linkedin: paste the profile URL to show the "LinkedIn ↗" link.
  // position: which part of the photo stays in frame in the 4:3 crop.
  { name: 'Puloma Bishnu', role: 'CEO', photo: '/about/puloma.jpg', position: '50% 22%', linkedin: '' },
  { name: 'Eliz Celik', role: 'COO', photo: '/about/eliz.jpg', position: '50% 38%', linkedin: '' },
  { name: 'Ameera Omar', role: 'Interim CTO and CMO', photo: '/about/ameera.jpg', position: '50% 50%', linkedin: '' },
];

const HELPS = [
  {
    title: 'Start with your needs',
    body: 'Explore by wellness concern or share your preferences for a more personalized experience.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="M15.5 15.5 21 21" />
      </svg>
    ),
  },
  {
    title: 'Look beyond the label',
    body: 'Find ingredient details, available research and product information together, with sources you can explore further.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8z" />
        <path d="M14 3v5h5M8.5 12.5h7M8.5 16h7" />
      </svg>
    ),
  },
  {
    title: 'Hear other perspectives',
    body: 'Read consumer experiences alongside product information. Someone else’s experience can offer context, even when their needs differ from yours.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20c.8-3.5 3.3-5.5 6.5-5.5s5.7 2 6.5 5.5" />
        <circle cx="17" cy="9" r="2.8" />
        <path d="M17.5 14.5c2.3.3 3.6 2 4 4.5" />
      </svg>
    ),
  },
];

const ADVISORS = [
  { name: 'Dr. David Orbach', title: 'BME, MD, Startup Advisor', photo: '/advisors/david-orbach.png' },
  { name: 'Gwyn Blanton', title: 'Former Director of Ethics & Compliance, Deloitte', photo: '/advisors/gwyn-blanton.png' },
  { name: 'Albert Charles', title: 'Co-Founder, Gorges Ventures', photo: '/advisors/albert-charles.png' },
  { name: 'Erika Demonsant', title: 'Healthcare Consultant, Huron', photo: '/advisors/erika-demonsant.png' },
  { name: 'Pamela Nasr', title: 'Product Lead, Benchling', photo: '/advisors/pamela-nasr.png' },
  { name: 'Nishtha Kaushik', title: 'Advisor', photo: '/advisors/nishtha-kaushik.jpg', linkedin: 'https://www.linkedin.com/in/nkaushik29/' },
  { name: 'Navneet Kaur', title: 'Advisor', photo: '/advisors/navneet-kaur.jpg', linkedin: 'https://www.linkedin.com/in/navneet-kaur-80109b227' },
  { name: 'Dr. Anuja Vyas', title: 'Board-Certified OB/GYN, Advisor', photo: '/advisors/anuja-vyas.jpg' },
];

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

/** Image with a dashed placeholder until the file exists. */
function PhotoSlot({ src, alt, label, className, position }) {
  const [failed, setFailed] = React.useState(false);
  if (src && !failed) {
    return (
      <div className={`ab-photo ${className || ''}`}>
        <img src={src} alt={alt} loading="lazy" style={position ? { objectPosition: position } : undefined} onError={() => setFailed(true)} />
      </div>
    );
  }
  return (
    <div className={`ab-photo ab-photo--empty ${className || ''}`} aria-label={`${label} (photo coming soon)`}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </svg>
      <span>{label}</span>
    </div>
  );
}

function AdvisorPhoto({ advisor }) {
  const [failed, setFailed] = React.useState(false);
  if (advisor.photo && !failed) {
    return <img className="ab-advisor__photo" src={advisor.photo} alt={advisor.name} onError={() => setFailed(true)} />;
  }
  return <div className="ab-advisor__photo ab-advisor__initials">{initials(advisor.name)}</div>;
}

export default function About({ onExplore, onStart }) {
  return (
    <div className="ab animate-fade-in-up">
      <section className="hiw-hero ab-hero">
        <div className="hiw-hero__col">
          <div className="hiw-hero__eyebrow ab-eyebrow">About ayna</div>
          <h1 className="hiw-hero__headline ab-hero__headline">
            We built the place we <em>wished</em> we could turn to.
          </h1>
          <p className="hiw-hero__sub ab-hero__sub">Women’s wellness discovery, shaped around you.</p>
          {onExplore && (
            <button type="button" className="ab-btn" onClick={() => onExplore()}>Explore ayna</button>
          )}
        </div>
      </section>

      <div className="ab-wrap">
        <section className="ab-split ab-intro">
          <h2 className="ab-h2">Your body. Your questions.<br />A clearer place to start.</h2>
          <p className="ab-p">
            Ayna helps you discover women’s wellness products with your needs in mind. Explore product information,
            research and reviews in one place, so you can spend less time searching and more time understanding your options.
          </p>
        </section>

        <section className="ab-split ab-story">
          <div>
            <div className="ab-eyebrow">Our story</div>
            <h2 className="ab-h2">Different stories.<br />One shared question.</h2>
            <p className="ab-p">
              For our co-founder Puloma, getting a PMOS diagnosis took visits to three doctors. When she asked her OB-GYN
              which products could help manage her symptoms, she was told to “look it up.” Finding guidance on
              non-prescription products brought another challenge: figuring out where to begin.
            </p>
            <p className="ab-p">
              For Eliz and Ameera, growing up in households where intimate health wasn’t openly discussed meant looking
              online for answers to questions that were difficult to ask elsewhere.
            </p>
            <p className="ab-p">
              We met at Cornell, bringing different experiences to the same question:{' '}
              <em>why does understanding our options require so much searching?</em>
            </p>
            <p className="ab-p">
              Ayna grew out of that question. We’re building a place where women can explore wellness products,
              understand the information behind them and find options that reflect their individual needs.
            </p>
          </div>
          <PhotoSlot src={TEAM_PHOTO} alt="The ayna founding team" label="Team photo" className="ab-photo--team" position="50% 70%" />
        </section>

        <section className="ab-mirror">
          <h2 className="ab-h2 ab-mirror__title">Ayna means “mirror.”</h2>
          <p className="ab-p">
            Our name means mirror in Bengali and Turkish. To us, it expresses what we want this experience to feel like:
            a place that reflects you, your questions and what matters to you.
          </p>
        </section>

        <section className="ab-block">
          <div className="ab-eyebrow">How ayna helps</div>
          <h2 className="ab-h2 ab-h2--section">More context for the choices you make.</h2>
          <div className="ab-grid3">
            {HELPS.map((item) => (
              <div key={item.title} className="ab-card ab-help">
                <span className="ab-help__icon">{item.icon}</span>
                <h3 className="ab-h3">{item.title}</h3>
                <p className="ab-p ab-p--sm">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="ab-block">
          <div className="ab-eyebrow">Meet the founders</div>
          <h2 className="ab-h2 ab-h2--section">Three founders. A shared reason to build.</h2>
          <p className="ab-p ab-lede">
            We’re Puloma, Eliz and Ameera: three women who met at Cornell and wanted a better starting point for women
            navigating wellness products.
          </p>
          <div className="ab-grid3">
            {FOUNDERS.map((f) => (
              <div key={f.name} className="ab-card ab-founder">
                <PhotoSlot src={f.photo} alt={f.name} label={`${f.name.split(' ')[0]} portrait`} className="ab-photo--portrait" position={f.position} />
                <h3 className="ab-h3">{f.name}</h3>
                <div className="ab-founder__role">{f.role}</div>
                {f.linkedin && (
                  <a className="ab-founder__link" href={f.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="ab-block" id="advisors">
          <div className="ab-eyebrow">Our advisors</div>
          <h2 className="ab-h2 ab-h2--section">Guided by real expertise.</h2>
          <div className="ab-advisor-grid">
            {ADVISORS.map((advisor) => (
              <div key={advisor.name} className="ab-card ab-advisor">
                <AdvisorPhoto advisor={advisor} />
                <div className="ab-advisor__name">{advisor.name}</div>
                <div className="ab-advisor__title">{advisor.title}</div>
                {advisor.linkedin && (
                  <a className="ab-founder__link" href={advisor.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="ab-cta">
        <h2 className="ab-cta__title">A place to return to as your needs change.</h2>
        <p className="ab-cta__body">
          The questions you have about your body can change over time. We want Ayna to grow with those questions,
          making women’s wellness easier to explore at every stage.
        </p>
        {onStart && (
          <button type="button" className="ab-btn" onClick={() => onStart()}>Find your starting point</button>
        )}
        <p className="ab-cta__note">
          Ayna provides product information to support your research. It does not replace advice from a qualified
          healthcare professional.
        </p>
      </section>
    </div>
  );
}
