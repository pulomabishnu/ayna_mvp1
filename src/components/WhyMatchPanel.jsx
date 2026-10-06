import React, { useMemo } from 'react';
import { getProductMatchDetailsForProduct } from '../data/products';
import { buildMatchBreakdown } from '../utils/whyMatch';
import MatchGauge from './MatchGauge';
import './whyMatchPanel.css';

/**
 * "Why this match" breakdown, ported from the mobile app's WhyMatchScreen as
 * an inline expanding panel on the product page. "What matched" is the
 * engine's real reasonDetails (never invented sub-scores); "Worth noting"
 * only appears when the engine returned a real consideration (a known
 * medication interaction, for example), never a generic warning written for
 * this panel. An excluded product gets its own state rather than a cheerful
 * low tier.
 */
export default function WhyMatchPanel({ id, product, quizResults = null, healthProfile = null, onClose = null, onUpdateHealth = null }) {
  const breakdown = useMemo(
    () => buildMatchBreakdown(getProductMatchDetailsForProduct(product, quizResults, healthProfile)),
    [product, quizResults, healthProfile]
  );

  const closeButton = onClose ? (
    <button type="button" className="whymatch__close" onClick={onClose} aria-label="Close match breakdown">
      <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
    </button>
  ) : null;

  if (breakdown.state === 'unscored') {
    return (
      <section id={id} className="whymatch" aria-label="About this match">
        <div className="whymatch__top">
          <div className="whymatch__eyebrow">About this match</div>
          {closeButton}
        </div>
        <p className="whymatch__text">
          We don&apos;t have enough from your health profile yet to score this one personally.
        </p>
        {onUpdateHealth && (
          <button type="button" className="whymatch__cta" onClick={onUpdateHealth}>Complete your health profile</button>
        )}
      </section>
    );
  }

  if (breakdown.state === 'excluded') {
    return (
      <section id={id} className="whymatch whymatch--excluded" aria-label="Not a fit right now">
        <div className="whymatch__top">
          <div>
            <div className="whymatch__eyebrow">Match breakdown</div>
            <h3 className="whymatch__title">Not a fit right now</h3>
          </div>
          {closeButton}
        </div>
        <p className="whymatch__text">
          {breakdown.reason || "This doesn't match your current health profile."}
        </p>
        <p className="whymatch__foot">
          Based on what you told us. Update your profile if something has changed.
        </p>
      </section>
    );
  }

  const { percent, tier, matches, considerations } = breakdown;

  return (
    <section id={id} className={`whymatch whymatch--${tier.key}`} aria-label={`Why ${percent}% match`}>
      <div className="whymatch__top">
        <div>
          <div className="whymatch__eyebrow">Match breakdown</div>
          <h3 className="whymatch__title">Why {percent}%</h3>
        </div>
        {closeButton}
      </div>

      <div className="whymatch__hero">
        <MatchGauge percent={percent} size={64} theme="light" />
        <div className="whymatch__hero-copy">
          <span className="whymatch__tier">{tier.tier}</span>
          <div className="whymatch__headline">{tier.headline}</div>
          <p className="whymatch__sub">{tier.sub}</p>
        </div>
      </div>

      {matches.length > 0 && (
        <div className="whymatch__group">
          <div className="whymatch__label whymatch__label--good">
            <span className="whymatch__dot" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="10" height="10"><path d="M5 13l4 4L19 7" /></svg>
            </span>
            What matched
            <span className="whymatch__rule" aria-hidden="true" />
            <span className="whymatch__count">{matches.length}</span>
          </div>
          <ul className="whymatch__list">
            {matches.map((m, i) => (
              <li key={`${m.component}-${i}`} className={`whymatch__row whymatch__row--${m.key}`}>
                <span className="whymatch__glyph" aria-hidden="true">{m.glyph}</span>
                <span className="whymatch__row-copy">
                  <span className="whymatch__kind">{m.kind}</span>
                  <span className="whymatch__reason">{m.label}</span>
                </span>
                <span className="whymatch__weight">{m.weight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {considerations.length > 0 && (
        <div className="whymatch__group">
          <div className="whymatch__label whymatch__label--note">
            <span className="whymatch__dot" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="10" height="10"><path d="M12 7v6M12 16.5v.1" /></svg>
            </span>
            Worth noting
            <span className="whymatch__rule" aria-hidden="true" />
          </div>
          {considerations.map((text, i) => (
            <p key={i} className="whymatch__note">{text}</p>
          ))}
        </div>
      )}

      <p className="whymatch__foot">
        A relevance score from what you told us. Not a medical recommendation, and not a promise of results.
      </p>
    </section>
  );
}
