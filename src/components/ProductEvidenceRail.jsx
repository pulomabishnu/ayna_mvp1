import React from 'react';

/**
 * The right-hand rail on the evidence layout (mockup board 1g): three small
 * stacked cards — why you're seeing this, clinician opinion, evidence.
 *
 * Board 1g shows a big invented "98%" match number and made-up source counts
 * (NIH, ACOG, CDC). Neither exists in our data, so every row here is built
 * from fields the product actually carries — verificationLinks counts, the
 * real clinician sentence, real Ayna review counts — and dropped entirely
 * when there's nothing real to show, rather than printing a number we made up.
 */

/** First sentence, so a long safety blob doesn't blow out a card — cut on a word boundary, never mid-word. */
function firstSentence(text, max = 140) {
  const t = String(text || '').trim();
  if (!t) return '';
  const cut = t.split(/(?<=[.!?])\s/)[0] || t;
  if (cut.length <= max) return cut;
  const truncated = cut.slice(0, max);
  const lastSpace = truncated.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? truncated.slice(0, lastSpace) : truncated).trimEnd()}…`;
}

export default function ProductEvidenceRail({ product, matchLabels = [], matchPercent = null, aynaReviewCount = 0 }) {
  const clinicianNote = product.doctorOpinion || product.clinicianOpinion || null;

  const scientificCount = product.verificationLinks?.scientific?.links?.length || 0;
  const clinicalCount = product.verificationLinks?.doctor?.links?.length || 0;
  const communityLinkCount = product.verificationLinks?.community?.links?.length || 0;

  const evidenceRows = [
    scientificCount > 0 ? { label: 'Scientific', value: `${scientificCount} source${scientificCount === 1 ? '' : 's'}` } : null,
    clinicalCount > 0 ? { label: 'Clinical', value: `${clinicalCount} reference${clinicalCount === 1 ? '' : 's'}` } : null,
    communityLinkCount > 0 ? { label: 'Community', value: `${communityLinkCount} link${communityLinkCount === 1 ? '' : 's'}` } : null,
    aynaReviewCount > 0 ? { label: 'Ayna reviews', value: `${aynaReviewCount}` } : null,
    product.safety?.fdaStatus ? { label: 'FDA', value: firstSentence(product.safety.fdaStatus, 56) } : null,
  ].filter(Boolean);

  return (
    <div className="pdp-rail__cards">
      <div className="pdp-rail__card pdp-rail__card--why">
        <div className="pdp-rail__label">Why you&apos;re seeing this</div>
        {Number.isFinite(matchPercent) ? (
          <div className="pdp-rail__match-wrap">
            <div
              className="pdp-rail__match-ring"
              style={{ '--match-pct': `${Math.max(0, Math.min(100, matchPercent))}%` }}
              aria-label={`${matchPercent}% profile match`}
            >
              <span>{matchPercent}%</span>
              <small>match</small>
            </div>
            <div className="pdp-rail__body">
              {matchLabels.length > 0
                ? matchLabels.slice(0, 3).join(' · ')
                : 'Based on your ecosystem.'}
            </div>
          </div>
        ) : (
          <div className="pdp-rail__body">
            {matchLabels.length > 0
              ? matchLabels.slice(0, 3).join(' · ')
              : 'Build your ecosystem to see your match.'}
          </div>
        )}
      </div>

      <div className="pdp-rail__card">
        <div className="pdp-rail__label">Clinician opinion</div>
        {clinicianNote ? (
          <>
            <div className="pdp-rail__body pdp-rail__body--dark">{clinicianNote}</div>
            {product.clinicianAttribution && (
              <div className="pdp-rail__attr">{product.clinicianAttribution}</div>
            )}
          </>
        ) : (
          <div className="pdp-rail__body pdp-rail__body--dark">
            No clinician note yet.
          </div>
        )}
      </div>

      <div className="pdp-rail__card">
        <div className="pdp-rail__label">Evidence</div>
        {evidenceRows.length > 0 ? (
          <div className="pdp-rail__evidence">
            {evidenceRows.map((row) => (
              <div key={row.label}>
                <span>{row.label}</span>
                <span>{row.value}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="pdp-rail__body pdp-rail__body--dark">No evidence yet.</div>
        )}
      </div>
    </div>
  );
}
