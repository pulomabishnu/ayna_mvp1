import { getProfileMatchPercentForProduct, getProfileMatchLabelsForProduct, getRecommendationExplanation } from '../../data/products.js';
import MatchRing from '../components/MatchRing.jsx';

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: 'var(--ayna-heading)' }}>
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: '#2F6B4F', flex: 'none' }}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/**
 * The real relevance score behind every match badge — getProfileMatchPercentForProduct
 * (src/data/products.js) is the same weighted tag-overlap engine that drives
 * recommendation ranking, not a number invented for this screen. "What
 * matched" lists the real overlapping labels it found; "Worth noting" only
 * appears when getRecommendationExplanation() has a real safety/allergen/
 * side-effect consideration to surface. There's no per-category breakdown
 * (symptom fit, evidence strength, etc.) because the engine doesn't compute
 * one yet — showing invented sub-scores here would look like real health
 * guidance, so this only shows what's actually behind the number.
 */
export default function WhyMatchScreen({ product, quizAnswers, onBack, onUpdateHealth }) {
  const percent = getProfileMatchPercentForProduct(product, quizAnswers);
  const labels = getProfileMatchLabelsForProduct(product, quizAnswers);
  const { whyItWorks, considerations } = getRecommendationExplanation(product, quizAnswers);
  const cleanWhy = whyItWorks ? whyItWorks.replace(/^Why it could work:\s*/i, '') : null;
  const cleanConsideration = considerations ? considerations.replace(/^Consideration:\s*/i, '') : null;

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: 'var(--ayna-bg)', animation: 'ay-page .25s ease-out' }}>
      <div style={{ flex: 'none', paddingTop: 'max(20px, env(safe-area-inset-top))', paddingLeft: 20, paddingRight: 20, paddingBottom: 14, borderBottom: '1px solid var(--ayna-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            onClick={onBack}
            style={{ width: 36, height: 36, flex: 'none', borderRadius: 99, border: '1px solid var(--ayna-border)', background: 'var(--ayna-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <BackIcon />
          </div>
          <div style={{ flex: 1, minWidth: 0, fontFamily: "'Playfair Display',serif", fontSize: 25, color: 'var(--ayna-heading)' }}>
            {percent != null ? `Why ${percent}%` : 'About this match'}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '18px 20px 40px' }}>
        {percent != null ? (
          <>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', background: 'var(--ayna-peach)', borderRadius: 20, padding: 18 }}>
              <MatchRing percent={percent} size={56} />
              <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, lineHeight: 1.5, color: 'var(--ayna-text)' }}>
                {cleanWhy || 'A relevance score based on your health profile.'}
              </div>
            </div>

            {labels.length > 0 && (
              <>
                <div style={{ marginTop: 26, fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)' }}>
                  What matched
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 12 }}>
                  {labels.map((label) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 16, padding: '12px 15px' }}>
                      <CheckIcon />
                      <div style={{ fontSize: 13.5, color: 'var(--ayna-text)', textTransform: 'capitalize' }}>{label}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {cleanConsideration && (
              <>
                <div style={{ marginTop: 26, fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)' }}>
                  Worth noting
                </div>
                <div style={{ marginTop: 12, borderLeft: '3px solid #D97A2B', background: 'rgba(217,122,43,.08)', borderRadius: '0 14px 14px 0', padding: '14px 16px' }}>
                  <div style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--ayna-text)' }}>{cleanConsideration}</div>
                </div>
              </>
            )}
          </>
        ) : (
          <div>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ayna-text-muted)' }}>
              We don't have enough from your health profile yet to score this one personally.
            </div>
            {onUpdateHealth && (
              <div
                onClick={onUpdateHealth}
                style={{ marginTop: 18, display: 'inline-block', fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 13.5, padding: '12px 20px', borderRadius: 99, cursor: 'pointer', background: 'var(--ayna-cta-bg)', color: 'var(--ayna-cta-text)' }}
              >
                Complete your health profile
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: 28, fontSize: 11.5, color: 'var(--ayna-text-faint)', lineHeight: 1.5 }}>
          This is a relevance score based on what you've told us, not a medical recommendation or a guarantee of results.
        </div>
      </div>
    </div>
  );
}
