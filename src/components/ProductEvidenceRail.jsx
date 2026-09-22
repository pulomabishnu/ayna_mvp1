import React from 'react';
import { getVerificationLinks, toSourceChips, hostLabel } from '../utils/verificationLinks';

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
  // Prefers a shorter, results-first version when a catalog entry has one —
  // this rail card has much less width than the ayna-summary tab's
  // full-width Clinician opinion card, which always gets the full text.
  const clinicianNote = product.doctorOpinionShort || product.doctorOpinion || product.clinicianOpinion || null;
  // Backs the clinician-opinion claim with an actual link to check it against
  // — a stated claim with no source a reader can click isn't evidence, it's
  // just a bigger claim. Flagged live 2026-08-25. Skips 'scientific' links
  // when the product curates its own scientificCitations — see the matching
  // note on clinicianSourceLinks in ProductModal.jsx for why.
  const hasCuratedScientific = (product.scientificCitations || []).length > 0;
  const clinicianSourceChips = [
    ...toSourceChips([
      ...getVerificationLinks(product, 'doctor'),
      ...(hasCuratedScientific ? [] : getVerificationLinks(product, 'scientific')),
    ]),
    ...(product.doctorOpinionCitations || []).map((c) => ({ url: c.url, label: hostLabel(c.url) || c.label, text: c.label })),
  ];

  const scientificChips = toSourceChips(getVerificationLinks(product, 'scientific'));
  const clinicalChips = toSourceChips(getVerificationLinks(product, 'doctor'));
  const communityChips = toSourceChips(getVerificationLinks(product, 'community'));

  const evidenceRows = [
    scientificChips.length > 0
      ? { label: 'Scientific', value: `${scientificChips.length} source${scientificChips.length === 1 ? '' : 's'}`, chips: scientificChips }
      : null,
    clinicalChips.length > 0
      ? { label: 'Clinical', value: `${clinicalChips.length} reference${clinicalChips.length === 1 ? '' : 's'}`, chips: clinicalChips }
      : null,
    communityChips.length > 0
      ? { label: 'Social Media + Reviews', value: `${communityChips.length} link${communityChips.length === 1 ? '' : 's'}`, chips: communityChips }
      : null,
    aynaReviewCount > 0 ? { label: 'ayna Reviews', value: `${aynaReviewCount}` } : null,
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
              <ul className="pdp-rail__reasons">
                {matchLabels.length > 0
                  ? matchLabels.slice(0, 3).map((label) => (
                      <li className="pdp-rail__reason" key={label}>{label}</li>
                    ))
                  : <li className="pdp-rail__reason">Based on your ecosystem</li>}
              </ul>
          </div>
        ) : (
            <ul className="pdp-rail__reasons">
              {matchLabels.length > 0
                ? matchLabels.slice(0, 3).map((label) => (
                    <li className="pdp-rail__reason" key={label}>{label}</li>
                  ))
                : <li className="pdp-rail__reason">Build your ecosystem to see your match</li>}
            </ul>
        )}
      </div>

      <div className="pdp-rail__card">
        <div className="pdp-rail__label">Clinician Opinion</div>
        {clinicianNote ? (
          <>
            <div className="pdp-rail__body pdp-rail__body--dark">{clinicianNote}</div>
            {product.clinicianAttribution && (
              <div className="pdp-rail__attr">{product.clinicianAttribution}</div>
            )}
            {clinicianSourceChips.length > 0 && (
              <div className="pdp-summary-card__chips">
                {clinicianSourceChips.map((chip) => (
                  <a
                    key={chip.url}
                    className="pdp-head__badge"
                    href={chip.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={chip.text || chip.url}
                  >
                    {chip.label}
                  </a>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="pdp-rail__body pdp-rail__body--dark">
            No clinician note yet.
          </div>
        )}
      </div>

      {Array.isArray(product.warnings) && product.warnings.length > 0 && (
        <div className="pdp-rail__card" style={{ background: '#FEF2F2', border: '1px solid #FEE2E2', borderLeft: '4px solid #DC2626' }}>
          <div className="pdp-rail__label" style={{ color: '#991B1B' }}>Warnings</div>
          <ul style={{ margin: '8px 0 0', padding: 0, listStyle: 'none' }}>
            {product.warnings.map((item) => (
              <li key={item} style={{ display: 'flex', gap: 10, fontSize: 13.5, lineHeight: 1.5, color: '#3f3831', marginBottom: 6 }}>
                <span style={{ flex: 'none', color: '#DC2626' }}>•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="pdp-rail__card">
        <div className="pdp-rail__label">Evidence</div>
        {evidenceRows.length > 0 ? (
          <div className="pdp-rail__evidence">
            {evidenceRows.map((row) => (
              <div key={row.label}>
                <span>{row.label}</span>
                {row.chips?.length > 0 ? (
                  <a
                    href={row.chips[0].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={row.chips.map((c) => c.label).join(', ')}
                  >
                    {row.value}
                  </a>
                ) : (
                  <span>{row.value}</span>
                )}
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
