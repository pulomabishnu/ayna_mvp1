import { useEffect, useState } from 'react';
import { proNow } from '../../pro/proDoor.js';
import { openProPaywall } from '../../pro/paywall.js';
import { MATCH_MEANING } from '../../utils/matchDisplay.js';
import { breakdownFromDetails } from '../../matching/breakdown.js';

/**
 * The parts of "Why this matches" that come straight from the decision trace
 * (src/matching/trace.js), shared by the website panel and the app screen:
 *   - what the % means (everyone)
 *   - Checked for you: safety checks that passed for her (everyone; safety
 *     is never a Pro feature)
 *   - Evidence: the grade the score used (everyone)
 *   - Every factor: each thing that raised or lowered the number (Pro,
 *     "Recommendation explanations: deeper context"); free sees one line
 *     that opens the Pro sheet. The top reasons stay free above this.
 */
export function usePro() {
  const [pro, setPro] = useState(null);
  useEffect(() => {
    let live = true;
    proNow().then((s) => { if (live) setPro(!s || !s.gates || s.active); }).catch(() => { if (live) setPro(false); });
    return () => { live = false; };
  }, []);
  return pro;
}

export default function WhyTrace({ product, details, Heading = 'h3', pro: proProp = undefined }) {
  const auto = usePro();
  const pro = proProp ?? auto;
  if (!details || details.matchStatus !== 'scored' || !(details.percent > 0)) return null;
  const b = breakdownFromDetails(product, details);
  const factors = [...(b?.raised || []).map((x) => ({ ...x, up: true })), ...(b?.lowered || []).map((x) => ({ ...x, up: false }))].filter((x) => x.text);
  return (
    <>
      <section className="ay-why-trace">
        <Heading>What the % means</Heading>
        <p>{MATCH_MEANING} Brands can’t pay to change it.</p>
      </section>
      {b?.checks?.length > 0 && (
        <section className="ay-why-trace">
          <Heading>Checked for you</Heading>
          <ul className="ay-why-checks">{b.checks.map((c) => <li key={c.code}>{c.text}</li>)}</ul>
        </section>
      )}
      {b?.evidence && (
        <section className="ay-why-trace">
          <Heading>Evidence</Heading>
          <p><b>{b.evidence.label}.</b> {b.evidence.line}{b.evidence.draft ? ' ayna’s grade, before clinician sign-off.' : ''}</p>
        </section>
      )}
      {factors.length > 0 && (pro ? (
        <section className="ay-why-trace">
          <Heading>Every factor</Heading>
          <ul className="ay-why-factors">{factors.map((x) => <li key={`${x.up ? 'u' : 'd'}-${x.text}`} className={x.up ? 'is-up' : 'is-down'}><span aria-hidden="true">{x.up ? '+' : '−'}</span>{x.text}<span className="sr-only">{x.up ? ', raised it' : ', lowered it'}</span></li>)}</ul>
        </section>
      ) : pro === false ? (
        <section className="ay-why-trace is-locked">
          <Heading>Every factor</Heading>
          <p>See each thing that raised or lowered this match.</p>
          <button type="button" className="ay-why-pro" onClick={() => openProPaywall({ feature: 'insights', featureName: 'Deeper match explanations' })}>Unlock with ayna Pro</button>
        </section>
      ) : null)}
    </>
  );
}
