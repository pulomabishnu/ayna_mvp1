import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  STARTUP_FILTERS,
  badgeLabel,
  formatCategoryLabel,
  getViewerTags,
  matchedTags,
  matchesStartupFilter,
  rankStartups,
  safeHttpUrl,
} from '../utils/earlyStartups';
import './earlyStartups.css';

/**
 * Early Stage Startups — the real early-stage companies the Ayna team tracks
 * in Airtable, served by /api/startups. Ported from the mobile app's
 * EarlyStageScreen. No placeholder companies: a failed or empty fetch shows
 * an honest empty state.
 *
 * Props: quizResults, healthProfile (optional) — used only to rank.
 */
export default function EarlyStartups({ quizResults = null, healthProfile = null }) {
  const [startups, setStartups] = useState([]);
  const [loadState, setLoadState] = useState('loading');
  const [filter, setFilter] = useState('all');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/startups', { headers: { Accept: 'application/json' } })
      .then((res) => {
        const type = res.headers.get('content-type') || '';
        if (!res.ok || !type.includes('application/json')) throw new Error('bad response');
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setStartups(Array.isArray(data?.startups) ? data.startups.filter((s) => s && s.id && s.name) : []);
        setLoadState('ready');
      })
      .catch(() => {
        if (!cancelled) setLoadState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const viewerTags = useMemo(() => getViewerTags(quizResults, healthProfile), [quizResults, healthProfile]);
  const hasProfile = viewerTags.size > 0;
  const ranked = useMemo(() => rankStartups(startups, viewerTags), [startups, viewerTags]);
  const filters = hasProfile ? STARTUP_FILTERS : STARTUP_FILTERS.filter((f) => f.key !== 'for-you');
  const visible = filter === 'all' ? ranked : ranked.filter((s) => matchesStartupFilter(s, filter, viewerTags));
  const retry = useCallback(() => {
    setLoadState('loading');
    setReloadKey((k) => k + 1);
  }, []);

  return (
    <section className="ayna-early container animate-fade-in-up">
      <header className="ayna-early-hero">
        <span className="ayna-early-hero-ring" aria-hidden="true" />
        <p className="ayna-early-eyebrow">Early stage · Founder-first</p>
        <h1 className="ayna-early-title">Real founders, not ad spend.</h1>
        <p className="ayna-early-sub">
          Emerging women&apos;s health startups the Ayna team is watching.{' '}
          {hasProfile
            ? 'Ranked by what you told us in your intake, never by who paid for placement.'
            : 'Take the quiz and we’ll rank these by what matters to you, never by who paid for placement.'}
        </p>
      </header>

      <div className="ayna-early-filters" role="group" aria-label="Filter startups">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`ayna-early-chip${filter === f.key ? ' is-active' : ''}`}
            aria-pressed={filter === f.key}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loadState === 'loading' && <p className="ayna-early-status">Loading startups…</p>}
      {loadState === 'error' && (
        <div className="ayna-early-status">
          <p style={{ margin: '0 0 0.75rem' }}>Couldn&apos;t load startups right now.</p>
          <button type="button" className="ayna-early-chip" onClick={retry}>Try again</button>
        </div>
      )}
      {loadState === 'ready' && visible.length === 0 && (
        <p className="ayna-early-status">
          {startups.length === 0 ? 'No startups to show yet. Check back soon.' : 'No startups match that filter yet.'}
        </p>
      )}

      {loadState === 'ready' && visible.length > 0 && (
        <ul className="ayna-early-grid">
          {visible.map((s) => (
            <li key={s.id} className={s.featured ? 'is-featured' : undefined}>
              <StartupTile startup={s} matches={matchedTags(s, viewerTags)} />
            </li>
          ))}
        </ul>
      )}

      {loadState === 'ready' && startups.length > 0 && (
        <p className="ayna-early-footnote">
          Startup details and badges come from founders and the Ayna team&apos;s notes. Ayna hasn&apos;t independently
          verified regulatory status; claims marked &ldquo;per the brand&rdquo; are the company&apos;s own. Talk to a
          clinician before relying on any product for a health decision.
        </p>
      )}
    </section>
  );
}

function StartupTile({ startup: s, matches }) {
  const [imgFailed, setImgFailed] = useState(false);
  const siteUrl = safeHttpUrl(s.url);
  const waitlistUrl = safeHttpUrl(s.waitlistUrl);
  const primaryUrl = waitlistUrl || siteUrl;
  const primaryLabel = waitlistUrl ? 'Join waitlist' : 'Visit site';
  const image = !imgFailed ? safeHttpUrl(s.image) : null;
  const badges = s.badges || [];
  const blurb = s.description || s.tagline;

  return (
    <article className="ayna-early-tile">
      <div className="ayna-early-media" aria-hidden="true">
        {image ? (
          <img src={image} alt="" loading="lazy" decoding="async" onError={() => setImgFailed(true)} />
        ) : (
          <span className="ayna-early-monogram">{(s.name || '?').trim().charAt(0).toUpperCase()}</span>
        )}
        {s.foundedYear && <span className="ayna-early-founded">Founded {s.foundedYear}</span>}
      </div>
      <div className="ayna-early-body">
        <div className="ayna-early-meta">
          {s.category && <span className="ayna-early-category">{formatCategoryLabel(s.category)}</span>}
          {s.stage && (
            <span className="ayna-early-stage">
              <span className="ayna-early-stage-dot" aria-hidden="true" />
              {s.stage}
            </span>
          )}
        </div>
        <h2 className="ayna-early-name">{s.name}</h2>
        {s.tagline && s.description && <p className="ayna-early-tagline">{s.tagline}</p>}
        {blurb && <p className="ayna-early-blurb">{blurb}</p>}
        {(matches.length > 0 || s.womenFounded || badges.length > 0) && (
          <ul className="ayna-early-badges">
            {matches.length > 0 && <li className="is-match">Matches your intake</li>}
            {s.womenFounded && !badges.includes('Women-Founded') && <li>Women-founded</li>}
            {badges.map((b) => (
              <li key={b}>{badgeLabel(b)}</li>
            ))}
          </ul>
        )}
        {s.founderNames && <p className="ayna-early-founders">Founded by {s.founderNames}</p>}
        {(primaryUrl || (siteUrl && waitlistUrl)) && (
          <div className="ayna-early-actions">
            {primaryUrl && (
              <a className="ayna-early-cta" href={primaryUrl} target="_blank" rel="noopener noreferrer">
                {primaryLabel}
              </a>
            )}
            {siteUrl && waitlistUrl && (
              <a className="ayna-early-link" href={siteUrl} target="_blank" rel="noopener noreferrer">
                Website
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
