import React from 'react';

/**
 * The second product layout — mockup board 1g, "Product detail — evidence rail
 * instead of tabs". Specs down the middle, and a rail of three cards on the
 * right: why you're seeing this, the clinician opinion, and the evidence.
 *
 * Board 1g shows a big "98%" in the match card and invented counts in the
 * evidence card. Neither exists in our data, so this builds both rows out of
 * fields the product actually carries and drops any row it has nothing for,
 * rather than printing a number we made up.
 */

function humanizeTag(tag) {
  return String(tag || '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** First sentence, so a long safety blob doesn't blow out the spec row. */
function firstSentence(text, max = 120) {
  const t = String(text || '').trim();
  if (!t) return '';
  const cut = t.split(/(?<=[.!?])\s/)[0] || t;
  return cut.length > max ? `${cut.slice(0, max).trimEnd()}…` : cut;
}

function SpecRow({ label, value, last }) {
  if (!value) return null;
  return (
    <div className={`pdp-rail__spec${last ? ' pdp-rail__spec--last' : ''}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export default function ProductEvidenceRail({ product, matchLabels = [], aynaReviewCount = 0 }) {
    const bestFor = (product.healthFunctions || []).concat(product.tags || [])
        .slice(0, 3)
        .map(humanizeTag)
        .join(', ');

    // "Skip if" is board 1g's label for a reason not to buy, so it maps to side
    // effects. The allergens field describes what a product is FREE of as often
    // as what's in it, so it gets its own neutral row instead.
    const skipIf = firstSentence(product.safety?.sideEffects);
    const allergens = firstSentence(product.safety?.allergens);
    const materials = firstSentence(product.safety?.materials);

    const clinicianNote = product.doctorOpinion || product.clinicianOpinion || null;

    const evidenceRows = [
        product.safety?.fdaStatus ? { label: 'FDA', value: product.safety.fdaStatus } : null,
        Array.isArray(product.verificationLinks) && product.verificationLinks.length
            ? { label: 'Verification', value: `${product.verificationLinks.length} source${product.verificationLinks.length === 1 ? '' : 's'}` }
            : null,
        product.effectiveness ? { label: 'Effectiveness', value: firstSentence(product.effectiveness, 60) } : null,
        product.communityReview ? { label: 'Community', value: 'Reported experience' } : null,
        aynaReviewCount > 0 ? { label: 'Ayna reviews', value: `${aynaReviewCount}` } : null,
    ].filter(Boolean);

    return (
        <div className="pdp-rail">
            <div className="pdp-rail__specs">
                <SpecRow label="Best for" value={bestFor} />
                <SpecRow label="Materials" value={materials} />
                <SpecRow label="Allergens" value={allergens} />
                <SpecRow label="Skip if" value={skipIf} last />
                {!bestFor && !materials && !allergens && !skipIf && (
                    <p className="pdp-rail__empty">No spec data recorded for this product yet.</p>
                )}
            </div>

            <div className="pdp-rail__cards">
                <div className="pdp-rail__card pdp-rail__card--why">
                    <div className="pdp-rail__label">Why you&apos;re seeing this</div>
                    <div className="pdp-rail__body">
                        {matchLabels.length > 0
                            ? `Matched on ${matchLabels.slice(0, 3).join(', ')}.`
                            : 'Shown because it fits this category. Build your health profile and Ayna will match it to you directly.'}
                    </div>
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
                            No clinician review on file for this product yet.
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
                        <div className="pdp-rail__body pdp-rail__body--dark">Nothing recorded yet.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
