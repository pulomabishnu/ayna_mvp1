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

/**
 * First `maxSentences` sentences (paragraph breaks treated as sentence
 * breaks too), so this compact rail card gets a short clinician note even
 * for products with no authored doctorOpinionShort — falls back to slicing
 * on the full doctorOpinion, which for some products runs 4-5 paragraphs
 * and blew out this card. Flagged live by a user 2026-09-24: "way too long."
 */
function firstSentences(text, maxSentences = 3, maxChars = 480) {
  const t = String(text || '').trim().replace(/\n+/g, ' ');
  if (!t) return '';
  const sentences = t.match(/[^.!?]+[.!?]+(\s|$)/g) || [t];
  let out = sentences.slice(0, maxSentences).join('').trim();
  if (!out) out = t;
  if (out.length > maxChars) {
    const truncated = out.slice(0, maxChars);
    const lastSpace = truncated.lastIndexOf(' ');
    out = `${(lastSpace > maxChars * 0.6 ? truncated.slice(0, lastSpace) : truncated).trimEnd()}…`;
  } else if (sentences.length > maxSentences) {
    out = `${out}…`;
  }
  return out;
}

export default function ProductEvidenceRail({ product, matchLabels = [], matchPercent = null, aynaReviewCount = 0, hasEcosystemContext = false, isInEcosystem = false, whyItWorks = null, considerations = null }) {
  // A product can be genuinely in the user's ecosystem while still scoring no
  // quiz-match labels (e.g. it was added manually, or its tags don't map to
  // any quiz answer) — that's a real state, not "no ecosystem yet". Flagged
  // live by a user 2026-09-24: this card told her to "build your ecosystem"
  // on a product page that, one section up, already said "In your ecosystem".
  const noMatchFallback = isInEcosystem
    ? 'Already in your ecosystem'
    : hasEcosystemContext
      ? 'Add this to your ecosystem to see your match'
      : 'Build your ecosystem to see your match';
  // Prefers a shorter, results-first version when a catalog entry has one —
  // this rail card has much less width than the ayna-summary tab's
  // full-width Clinician opinion card, which always gets the full text.
  // When a product has no authored doctorOpinionShort, auto-trim the full
  // doctorOpinion to ~3 sentences rather than dumping the whole thing here.
  const clinicianNote = product.doctorOpinionShort
    || firstSentences(product.doctorOpinion || product.clinicianOpinion, 3)
    || null;
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
                : <li className="pdp-rail__reason">{noMatchFallback}</li>}
            </ul>
        )}
        {/* A short, connected explanation tying this specific product to the
            user's own quiz answers/profile — not just the terse match-label
            phrases above. Flagged live by a user 2026-09-24: "I couldn't
            always tell why a particular product was recommended." */}
        {whyItWorks && (
          <div className="pdp-rail__body" style={{ marginTop: 8 }}>{whyItWorks}</div>
        )}
        {considerations && (
          <div className="pdp-rail__body" style={{ marginTop: 6, fontStyle: 'italic' }}>{considerations}</div>
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
        <div className="pdp-rail__card" style={{ background: '#FEF2F2', border: '1px solid #991B1B', borderLeft: '4px solid #991B1B' }}>
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
