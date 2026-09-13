import { getProductMatchDetailsForProduct } from '../../data/products.js';
import LegalFooter from '../components/LegalFooter.jsx';

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: 'var(--ayna-heading)' }}>
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
  );
}

function ArrowIcon({ color }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--ayna-text-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l7 3v6c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6z" />
    </svg>
  );
}

// Three real bands over the same percent everywhere else in the app uses
// (getProductMatchPercentForProduct) — copy and colour are templated per
// band, not fabricated per product, and which band applies is driven
// entirely by the real score.
const TIERS = [
  {
    min: 75, tier: 'Strong match', headline: 'A strong match.',
    sub: "Multiple signals from your profile line up, and nothing you've flagged gets in the way.",
    ink: '#25382A', ring: '#3F6B4A', soft: '#EFF3EC', mid: '#E0EDE1', deep: '#CFE5D2', edge: '#CFE0CE',
  },
  {
    min: 50, tier: 'Good fit', headline: 'Most of it fits.',
    sub: "Several signals line up. Worth a quick look at what's below before you commit.",
    ink: '#6B4413', ring: '#E8843C', soft: '#FFF1E4', mid: '#FFE1CB', deep: '#FFD2B4', edge: '#F1D3BC',
  },
  {
    min: 0, tier: 'Worth a look', headline: 'Worth a look.',
    sub: 'A couple of things line up with your profile — enough to show you, not enough to push.',
    ink: '#7A4410', ring: '#E8A94F', soft: '#FFF4E2', mid: '#FFE7C6', deep: '#FFDCA8', edge: '#F0D9B4',
  },
];

function tierForPercent(percent) {
  return TIERS.find((t) => percent >= t.min) || TIERS[TIERS.length - 1];
}

// Buckets the engine's real reasonDetails (src/data/products.js) into the
// same three "kind" groupings the score itself is weighted by — goal fit,
// profile fit, and preference fit — rather than inventing categories that
// don't map to what was actually computed.
const GOAL_COMPONENTS = new Set(['primaryGoal', 'periodFlow', 'periodPain', 'utiFrequency', 'diagnoses']);
const PROFILE_COMPONENTS = new Set(['age', 'lifeStage', 'breastfeeding', 'postpartumTiming', 'pregnancyTrimester', 'triedBefore']);

function kindForComponent(component) {
  if (GOAL_COMPONENTS.has(component)) return { kind: 'Your goal', glyph: '✦', bg: '#E1EFE2', fg: '#3F6B4A' };
  if (PROFILE_COMPONENTS.has(component)) return { kind: 'Your profile', glyph: '❋', bg: '#E1EFE2', fg: '#3F6B4A' };
  return { kind: 'Your preference', glyph: '◈', bg: '#E7EAF5', fg: '#3B4677' };
}

/**
 * The real relevance score and its breakdown — getProductMatchDetailsForProduct
 * (src/data/products.js) is the same weighted engine that drives recommendation
 * ranking and eligibility everywhere else in the app, desktop included. "What
 * matched" is built from its real reasonDetails (never invented sub-scores);
 * "Worth noting" only appears when the engine found a real known medication/
 * supplement interaction or a real overlap with a flagged-but-unmapped
 * allergy — never a generic warning invented for this screen.
 */
function SimpleHeader({ title, onBack }) {
  return (
    <div style={{ flex: 'none', paddingTop: 'max(20px, env(safe-area-inset-top))', paddingLeft: 20, paddingRight: 20, paddingBottom: 14, borderBottom: '1px solid var(--ayna-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div onClick={onBack} style={{ width: 36, height: 36, flex: 'none', borderRadius: 99, border: '1px solid var(--ayna-border)', background: 'var(--ayna-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <BackIcon />
        </div>
        <div style={{ flex: 1, minWidth: 0, fontFamily: "'Playfair Display',serif", fontSize: 'calc(25px * var(--ayna-text-scale, 1))', color: 'var(--ayna-heading)' }}>
          {title}
        </div>
      </div>
    </div>
  );
}

export default function WhyMatchScreen({ product, quizAnswers, onBack, onUpdateHealth, onViewDetails }) {
  const details = getProductMatchDetailsForProduct(product, quizAnswers);
  const { percent, eligible, reasonDetails = [], considerations = [] } = details;

  if (percent == null) {
    return (
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: 'var(--ayna-bg)', animation: 'ay-page .25s ease-out' }}>
        <SimpleHeader title="About this match" onBack={onBack} />
        <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '18px 20px 40px' }}>
          <div style={{ fontSize: 'calc(14px * var(--ayna-text-scale, 1))', lineHeight: 1.6, color: 'var(--ayna-text-muted)' }}>
            We don't have enough from your health profile yet to score this one personally.
          </div>
          {onUpdateHealth && (
            <div
              onClick={onUpdateHealth}
              style={{ marginTop: 18, display: 'inline-block', fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', padding: '12px 20px', borderRadius: 99, cursor: 'pointer', background: 'var(--ayna-cta-bg)', color: 'var(--ayna-cta-text)' }}
            >
              Complete your health profile
            </div>
          )}
          <LegalFooter />
        </div>
      </div>
    );
  }

  // Distinct from a low positive score: the engine actively excluded this
  // product for the profile (life stage, a flagged allergy, a prescription
  // gate, a past bad reaction, etc.) — showing that as a cheerful "worth a
  // look" tier would misrepresent a real exclusion as a soft positive.
  if (eligible === false) {
    const reason = considerations[0]?.text;
    return (
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: 'var(--ayna-bg)', animation: 'ay-page .25s ease-out' }}>
        <SimpleHeader title="Not a fit right now" onBack={onBack} />
        <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '18px 20px 40px' }}>
          <div style={{ background: 'var(--ayna-chip-bg)', border: '1px solid var(--ayna-border)', borderRadius: 20, padding: 18 }}>
            <div style={{ fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', lineHeight: 1.55, color: 'var(--ayna-text)' }}>
              {reason || "This doesn't match your current health profile."}
            </div>
          </div>
          <div
            onClick={onBack}
            style={{ marginTop: 16, textAlign: 'center', background: 'var(--ayna-cta-bg)', color: 'var(--ayna-cta-text)', borderRadius: 99, padding: '14px 0', fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', fontWeight: 600, cursor: 'pointer' }}
          >
            Back to product
          </div>
          <LegalFooter />
        </div>
      </div>
    );
  }

  const t = tierForPercent(percent);

  // Capped at 4 upstream already (reasonDetails.slice(0, 4) in the engine) —
  // no synthesized "no conflicts" positive card here, since the interaction
  // checker only ever confirms a problem or says it doesn't know; it has no
  // real "confirmed clear" state to honestly claim one.
  const displayedMatches = reasonDetails.map((r) => {
    const k = kindForComponent(r.component);
    return { ...k, label: r.text.replace(/^[A-Za-z ]+:\s*/, ''), weight: r.score >= 1 ? 'Strong' : 'Match' };
  });

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: 'var(--ayna-bg)', animation: 'ay-page .25s ease-out' }}>
      <div style={{ flex: 'none', paddingTop: 'max(20px, env(safe-area-inset-top))', paddingLeft: 20, paddingRight: 20, paddingBottom: 14, borderBottom: '1px solid var(--ayna-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div onClick={onBack} style={{ width: 36, height: 36, flex: 'none', borderRadius: 99, border: '1px solid var(--ayna-border)', background: 'var(--ayna-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <BackIcon />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9px * var(--ayna-text-scale, 1))', letterSpacing: '1.4px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)' }}>Match breakdown</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 'calc(23px * var(--ayna-text-scale, 1))', color: 'var(--ayna-heading)', lineHeight: 1.2 }}>Why {percent}%</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '18px 20px 40px' }}>
        <div style={{ position: 'relative', overflow: 'hidden', background: `linear-gradient(150deg,${t.soft},${t.mid} 55%,${t.deep})`, border: `1px solid ${t.edge}`, borderRadius: 26, padding: '19px 19px 17px' }}>
          <div aria-hidden style={{ position: 'absolute', right: -36, top: -34, width: 120, height: 120, borderRadius: 99, background: 'rgba(255,255,255,.4)' }} />
          <div aria-hidden style={{ position: 'absolute', right: 34, bottom: -46, width: 78, height: 78, borderRadius: 99, background: 'rgba(255,255,255,.28)' }} />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                flex: 'none', width: 76, height: 76, borderRadius: 99, display: 'grid', placeItems: 'center',
                background: `conic-gradient(${t.ring} ${Math.round(percent * 3.6)}deg, rgba(255,255,255,.62) 0)`,
                boxShadow: '0 2px 10px rgba(41,37,36,.08)',
              }}
            >
              <div style={{ width: 58, height: 58, borderRadius: 99, background: 'var(--ayna-surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 'calc(22px * var(--ayna-text-scale, 1))', color: t.ink, lineHeight: 1 }}>{percent}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(7.5px * var(--ayna-text-scale, 1))', letterSpacing: 1, color: t.ink, opacity: 0.55, marginTop: 2 }}>PCT</div>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'inline-block', fontFamily: "'DM Mono',monospace", fontSize: 'calc(8.5px * var(--ayna-text-scale, 1))', letterSpacing: '1.3px', textTransform: 'uppercase', background: 'var(--ayna-surface)', color: t.ink, borderRadius: 99, padding: '5px 10px' }}>
                {t.tier}
              </div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 'calc(19px * var(--ayna-text-scale, 1))', lineHeight: 1.22, marginTop: 9, color: t.ink }}>{t.headline}</div>
              <div style={{ fontSize: 'calc(12px * var(--ayna-text-scale, 1))', lineHeight: 1.55, marginTop: 6, color: t.ink, opacity: 0.78 }}>{t.sub}</div>
            </div>
          </div>
        </div>

        {displayedMatches.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '22px 4px 10px' }}>
              <div style={{ width: 20, height: 20, borderRadius: 99, background: '#E1EFE2', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#3F6B4A" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
              </div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9.5px * var(--ayna-text-scale, 1))', letterSpacing: '1.4px', textTransform: 'uppercase', color: '#3F6B4A' }}>What matched</div>
              <div style={{ flex: 1, height: 1, background: 'var(--ayna-border)' }} />
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9.5px * var(--ayna-text-scale, 1))', color: '#3F6B4A', background: '#E1EFE2', borderRadius: 99, padding: '3px 8px' }}>{displayedMatches.length} of 4</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {displayedMatches.map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 20, padding: '13px 15px' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 12, flex: 'none', background: m.bg, color: m.fg, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{m.glyph}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(8.5px * var(--ayna-text-scale, 1))', letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--ayna-text-faint)' }}>{m.kind}</div>
                    <div style={{ fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', fontWeight: 500, lineHeight: 1.35, marginTop: 3, color: 'var(--ayna-text)', textTransform: 'capitalize' }}>{m.label}</div>
                  </div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(8.5px * var(--ayna-text-scale, 1))', letterSpacing: '.9px', textTransform: 'uppercase', color: m.fg, background: m.bg, borderRadius: 99, padding: '5px 8px', flex: 'none' }}>{m.weight}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {considerations.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '22px 4px 10px' }}>
              <div style={{ width: 20, height: 20, borderRadius: 99, background: '#FBE7D6', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9A5B14" strokeWidth="2.6" strokeLinecap="round"><path d="M12 8v5" /><path d="M12 16.4v.1" /></svg>
              </div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9.5px * var(--ayna-text-scale, 1))', letterSpacing: '1.4px', textTransform: 'uppercase', color: '#9A5B14' }}>Worth noting</div>
              <div style={{ flex: 1, height: 1, background: 'var(--ayna-border)' }} />
            </div>
            {considerations.map((note, i) => (
              <div key={i} style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(140deg,#FFF6E9,#FDEBD3)', border: '1px solid #F1DCBF', borderRadius: 20, padding: '15px 16px', marginBottom: 9 }}>
                <div aria-hidden style={{ position: 'absolute', right: -22, bottom: -28, width: 76, height: 76, borderRadius: 99, background: 'rgba(255,255,255,.45)' }} />
                <div style={{ position: 'relative', fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', lineHeight: 1.55, color: '#6B4413' }}>{note.text}</div>
                {note.cta && onViewDetails && (
                  <div
                    onClick={onViewDetails}
                    style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 11, background: 'var(--ayna-surface)', borderRadius: 99, padding: '7px 12px', fontSize: 'calc(12px * var(--ayna-text-scale, 1))', fontWeight: 600, color: '#7A4410', cursor: 'pointer', boxShadow: '0 1px 4px rgba(122,68,16,.12)' }}
                  >
                    {note.cta}
                    <ArrowIcon color="#7A4410" />
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, marginTop: 16, background: 'var(--ayna-surface)', border: '1px dashed var(--ayna-border)', borderRadius: 20, padding: '14px 15px' }}>
          <div style={{ width: 26, height: 26, borderRadius: 99, background: 'var(--ayna-chip-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', marginTop: 1 }}>
            <ShieldIcon />
          </div>
          <div style={{ flex: 1, minWidth: 0, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', lineHeight: 1.55, color: 'var(--ayna-text-faint)' }}>
            A relevance score from what you told us — not a medical recommendation, and not a promise of results.
          </div>
        </div>

        <div
          onClick={onBack}
          style={{ marginTop: 16, textAlign: 'center', background: 'var(--ayna-cta-bg)', color: 'var(--ayna-cta-text)', borderRadius: 99, padding: '14px 0', fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', fontWeight: 600, cursor: 'pointer' }}
        >
          Back to product
        </div>
        <LegalFooter />
      </div>
    </div>
  );
}
