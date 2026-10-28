import React, { useEffect, useMemo, useRef, useState } from 'react';
import './campusResources.css';
import { dashToSentence } from '../utils/dashToSentence';
import { SCHOOLS, getSchoolById, searchSchools, groupResources, formatVerified } from '../data/campusResources';
import { NATIONAL_RESOURCES, EMERGENCY_NOTICE } from '../data/campusResources/national';
import { PETITION, CASE_BLOCKS, SOURCES } from '../data/campusResources/janeDoe';

// Privacy: this page deliberately sends nothing to analytics (see the route
// check in main.jsx's before_send). Do not add any analytics calls here.

const SCHOOL_PARAM = 'school';

const telHref = (p) => `tel:+1${String(p).replace(/\D/g, '')}`;
const CONF_LABEL = { confidential: 'Confidential', 'not-confidential': 'Not confidential' };

function ExternalLink({ href, children, className, ...rest }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className={className} {...rest}>{children}<span className="cr-sr"> (opens in a new tab)</span></a>;
}

function ResourceCard({ r }) {
  const callLabel = r.phoneDisplay || r.phone;
  return (
    <li className="cr-card">
      <div className="cr-card__head">
        <h4 className="cr-card__name">{r.name}</h4>
        {r.confidentiality && (
          <span className={`cr-badge cr-badge--${r.confidentiality}`}>{CONF_LABEL[r.confidentiality]}</span>
        )}
      </div>
      {r.description && <p className="cr-card__desc">{r.description}</p>}

      {(r.phone || r.text || r.email || r.chat || r.actions || r.website) && (
        <div className="cr-actions">
          {r.phone && <a className="cr-btn cr-btn--primary" href={telHref(r.phone)}>Call {callLabel}{r.phoneLabel ? ` (${r.phoneLabel})` : ''}</a>}
          {(r.extraPhones || []).map((p) => <a key={p.number} className="cr-btn cr-btn--primary" href={telHref(p.number)}>Call {p.display || p.number}{p.label ? ` (${p.label})` : ''}</a>)}
          {r.text && <a className="cr-btn cr-btn--primary" href={r.text.keyword ? `sms:${r.text.number}?&body=${encodeURIComponent(r.text.keyword)}` : `sms:${r.text.number}`}>{r.text.keyword ? `Text ${r.text.keyword} to ${r.text.number}` : `Text ${r.text.number}`}</a>}
          {r.chat && <ExternalLink className="cr-btn" href={r.chat.url}>{r.chat.label}</ExternalLink>}
          {(r.actions || []).map((a) => <ExternalLink key={a.url} className="cr-btn" href={a.url}>{a.label}</ExternalLink>)}
          {r.email && <a className="cr-btn" href={`mailto:${r.email}`}>Email {r.email}</a>}
          {r.website && <ExternalLink className="cr-btn" href={r.website}>Visit website</ExternalLink>}
        </div>
      )}

      <dl className="cr-facts">
        {r.hours && (<><dt>Hours</dt><dd>{r.hours}</dd></>)}
        {r.confidentialityNote && (<><dt>Privacy</dt><dd>{r.confidentialityNote}</dd></>)}
        {r.emailNote && (<><dt>Email note</dt><dd>{r.emailNote}</dd></>)}
        {r.reportingNotes && (<><dt>Reporting</dt><dd>{r.reportingNotes}</dd></>)}
      </dl>

      <p className="cr-card__source">
        <ExternalLink href={r.sourceUrl}>Official source: {dashToSentence(r.sourceLabel, { label: true })}</ExternalLink>
        <span className="cr-card__verified">Last verified: {formatVerified(r.lastVerified)}</span>
      </p>
    </li>
  );
}

function CardList({ items }) {
  return <ul className="cr-list">{items.map((r) => <ResourceCard key={r.id} r={r} />)}</ul>;
}

function NationalSection({ school }) {
  return (
    <section className="cr-section" id="national" aria-labelledby="cr-national-h">
      <h2 id="cr-national-h" className="cr-h2">National support</h2>
      <p className="cr-lede">Available for every school, whether or not we have verified resources for yours.</p>
      <CardList items={NATIONAL_RESOURCES.filter((r) => !r.onlyStates || (school && r.onlyStates.includes(school.state)))} />
    </section>
  );
}

// Shown only once someone has picked Cornell, closed by default, behind a
// content note: this page is for people who may have just been hurt.
function JaneDoeSection() {
  const used = [];
  CASE_BLOCKS.forEach((b) => b.sources.forEach((s) => { if (!used.includes(s)) used.push(s); }));
  return (
    <details className="cr-case" id="jane-doe">
      <summary className="cr-case__summary"><span className="cr-h2" id="cr-case-h">Related news at Cornell</span><span className="cr-small">Jane Doe case and petition. Content note: describes an alleged sexual assault.</span></summary>
      <p className="cr-case__tag">Advocacy and news information, separate from Cornell’s official resources</p>
      <p className="cr-lede">This concerns a case at Cornell University. It is not a support service and is not from Cornell. It summarizes an unresolved case, with each statement attributed to its source. Allegations have not been proven.</p>
      <ExternalLink className="cr-btn cr-btn--primary" href={PETITION.url}>{PETITION.label}</ExternalLink>
      <p className="cr-small">{PETITION.note}</p>

      <h3 className="cr-h3" id="reporting-sources">Reporting &amp; sources</h3>
      {CASE_BLOCKS.map((b) => (
        <article key={b.heading} className="cr-case__block">
          <h4 className="cr-case__heading">{b.heading}</h4>
          <p className="cr-case__kind">{b.kind}</p>
          {b.body.map((p, i) => <p key={i}>{p}</p>)}
          <p className="cr-small">
            Sources: {b.sources.map((k, i) => (
              <React.Fragment key={k}>{i > 0 && ', '}<ExternalLink href={SOURCES[k].url}>{SOURCES[k].label.split(':')[0]}</ExternalLink></React.Fragment>
            ))}
          </p>
        </article>
      ))}
      <h4 className="cr-case__heading">Sources</h4>
      <ul className="cr-sources">
        {used.map((k) => <li key={k}><ExternalLink href={SOURCES[k].url}>{SOURCES[k].label}</ExternalLink></li>)}
      </ul>
      <p className="cr-small">Last verified: October 2026. Details of an ongoing case can change; check the linked sources for updates.</p>
    </details>
  );
}

function SchoolSection({ school }) {
  const groups = useMemo(() => groupResources(school.resources), [school]);
  return (
    <section className="cr-school" aria-labelledby="cr-school-h">
      <h2 id="cr-school-h" className="cr-h2 cr-h2--xl">{school.name}</h2>
      <p className="cr-lede">{school.subtitle || `Sexual assault support, advocacy, reporting, and care resources for the ${school.name} community.`}</p>
      <p className="cr-small">Last verified: {formatVerified(school.lastVerified)}</p>

      <nav className="cr-jump" aria-label={`Jump to a section for ${school.name}`}>
        <ul>
          {groups.map((g) => <li key={g.id}><a href={`#cat-${g.id}`}>{g.label}</a></li>)}
        </ul>
      </nav>

      {groups.map((g) => (
        <section key={g.id} className="cr-section" id={`cat-${g.id}`} aria-labelledby={`cr-h-${g.id}`}>
          <h3 id={`cr-h-${g.id}`} className="cr-h3">{g.label}</h3>
          <p className="cr-lede">{g.blurb}</p>
          <CardList items={g.items} />
        </section>
      ))}

      {(school.extraLinks || []).length > 0 && (
        <p className="cr-small">
          {school.extraLinks.map((l) => <ExternalLink key={l.url} href={l.url}>{l.label}</ExternalLink>)}
        </p>
      )}

    </section>
  );
}

export default function CampusResources() {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(() => {
    try { return getSchoolById(new URLSearchParams(window.location.search).get(SCHOOL_PARAM))?.id || null; } catch { return null; }
  });
  const selected = selectedId ? getSchoolById(selectedId) : null;
  const matches = useMemo(() => searchSchools(query), [query]);

  // The school is never written to the address bar: on a shared device the
  // history would show which school was searched on a sexual-assault page.
  // An incoming ?school= link still opens that school, then the URL is cleaned.
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (!url.searchParams.has(SCHOOL_PARAM)) return;
      url.searchParams.delete(SCHOOL_PARAM);
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
    } catch { /* non-critical */ }
  }, []);

  const inputRef = useRef(null);
  const pick = (id) => {
    setSelectedId(id); setQuery('');
    // Go straight to what she asked for: her school's support, first on the page.
    window.requestAnimationFrame(() => document.getElementById('cr-school-h')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
  const clearSchool = () => { setSelectedId(null); setQuery(''); window.requestAnimationFrame(() => inputRef.current?.focus()); };
  const trimmed = query.trim();
  const unverified = trimmed.length >= 2 && matches.length === 0;

  return (
    <div className="mockup-page cr-page">
      {/* Quick exit: leaves for a neutral site and replaces this page in history, so Back does not return here. */}
      <button type="button" className="cr-quickexit" onClick={() => { try { window.location.replace('https://www.google.com/search?q=weather'); } catch { window.location.href = 'https://www.google.com'; } }}>
        Leave this page quickly
      </button>
      <div className="cr-wrap">
        <header className="cr-edhead">
          <h1 className="cr-h1">Campus resources</h1>
          <p className="cr-sub">Find sexual assault support and resources at your school.</p>
          <p className="cr-lede">Search for your college or university to find confidential support, reporting options, medical care, and other resources available to your campus community.</p>
        </header>

        <p className="cr-emergency" role="note"><strong>{EMERGENCY_NOTICE.replace(/call 911\.?$/, '')}<a href="tel:911" className="cr-emergency__call">call 911</a>.</strong></p>

        <div className="cr-search" role="search">
          <label htmlFor="cr-school-search" className="cr-label">Your school</label>
          {selected && !query ? (
            <div className="cr-picked">
              <span>{selected.name}</span>
              <button type="button" className="cr-picked__x" onClick={clearSchool} aria-label={`Clear ${selected.name}`}>×</button>
            </div>
          ) : (
          <input
            ref={inputRef}
            id="cr-school-search"
            className="cr-input"
            type="search"
            inputMode="search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            placeholder="e.g. Cornell University"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-describedby="cr-search-status"
          />
          )}
          <p id="cr-search-status" className="cr-status" role="status" aria-live="polite">
            {unverified ? 'We’re still verifying resources for this school.' : matches.length ? `${matches.length} verified ${matches.length === 1 ? 'school' : 'schools'} found` : ''}
          </p>
          {matches.length > 0 && (
            <ul className="cr-results">
              {matches.map((s) => (
                <li key={s.id}><button type="button" className="cr-result" onClick={() => pick(s.id)}>{s.name}<span>{s.city}, {s.state}</span></button></li>
              ))}
            </ul>
          )}
          {!trimmed && !selected && (
            <details className="cr-small cr-schools-list">
              <summary>See all {SCHOOLS.length} schools with verified resources</summary>
              <ul>
                {SCHOOLS.map((s) => (
                  <li key={s.id}><button type="button" className="cr-link" onClick={() => pick(s.id)}>{s.name}</button></li>
                ))}
              </ul>
            </details>
          )}
          {unverified && (
            <div className="cr-unverified">
              <p><strong>We’re still verifying resources for this school.</strong></p>
              <p className="cr-small">We only publish campus-specific resources after verifying them against official sources. National resources are below.</p>
            </div>
          )}
        </div>

        {selected && !unverified && <SchoolSection school={selected} />}
        <NationalSection school={selected} />

        {selected?.id === 'cornell-university' && !unverified && <JaneDoeSection />}
      </div>
    </div>
  );
}
