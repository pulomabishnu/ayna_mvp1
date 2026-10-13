import React, { useEffect, useMemo, useState } from 'react';
import './campusResources.css';
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
        <ExternalLink href={r.sourceUrl}>Official source: {r.sourceLabel}</ExternalLink>
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

function JaneDoeSection() {
  const used = [];
  CASE_BLOCKS.forEach((b) => b.sources.forEach((s) => { if (!used.includes(s)) used.push(s); }));
  return (
    <section className="cr-case" id="jane-doe" aria-labelledby="cr-case-h">
      <p className="cr-case__tag">Advocacy and news information, separate from Cornell’s official resources</p>
      <h2 id="cr-case-h" className="cr-h2">Jane Doe case &amp; petition</h2>
      <p className="cr-lede">This concerns a case at Cornell University and is shown to all visitors. It is not a support service and is not from Cornell. It summarizes an unresolved case, with each statement attributed to its source. Allegations have not been proven.</p>
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
    </section>
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
          {school.id === 'cornell-university' && <li><a href="#jane-doe">Jane Doe case &amp; petition</a></li>}
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

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (selectedId) url.searchParams.set(SCHOOL_PARAM, selectedId); else url.searchParams.delete(SCHOOL_PARAM);
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
    } catch { /* non-critical */ }
  }, [selectedId]);

  const pick = (id) => { setSelectedId(id); setQuery(''); };
  const trimmed = query.trim();
  const unverified = trimmed.length >= 2 && matches.length === 0;

  return (
    <div className="mockup-page cr-page">
      <div className="cr-wrap">
        <header>
          <h1 className="cr-h1">Campus Resources</h1>
          <p className="cr-sub">Find sexual assault support and resources at your school.</p>
          <p className="cr-lede">Search for your college or university to find confidential support, reporting options, medical care, and other resources available to your campus community.</p>
        </header>

        <p className="cr-emergency" role="note"><strong>{EMERGENCY_NOTICE}</strong></p>

        <div className="cr-search" role="search">
          <label htmlFor="cr-school-search" className="cr-label">Search your school…</label>
          <input
            id="cr-school-search"
            className="cr-input"
            type="search"
            inputMode="search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            placeholder="Search your school…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-describedby="cr-search-status"
          />
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
              <summary>Schools with verified resources ({SCHOOLS.length})</summary>
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

        <p className="cr-small"><a href="#jane-doe">Jane Doe case &amp; petition (Cornell)</a></p>

        <NationalSection school={selected} />

        {selected && !unverified && (
          <>
            <button type="button" className="cr-link cr-change" onClick={() => setSelectedId(null)}>Choose a different school</button>
            <SchoolSection school={selected} />
          </>
        )}

        <JaneDoeSection />
      </div>
    </div>
  );
}
