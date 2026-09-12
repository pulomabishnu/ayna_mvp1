import React from 'react';
import HowItWorksFunnel from './HowItWorksFunnel';

export default function HowItWorks({ onBack, onViewSources }) {
  const openSources = () => {
    if (onViewSources) onViewSources();
    else if (onBack) onBack();
  };

  return (
    <div className="hiw-mockup">
      <div className="hiw-mockup__inner">
        <div className="hiw-mockup__kicker">HOW IT WORKS</div>

        <h1 className="hiw-mockup__title">No mystery box.</h1>

        <p className="hiw-mockup__intro">
          ayna compares products with the health profile and preferences you choose to share, then adds cited research, clinical guidance, safety information, and community context where available.
          <br className="hiw-desktop-break" />
          Personalized picks are ranked on relevance to you, not on commission rate or partnership status.
        </p>

        <div className="hiw-mockup__steps">
          <article className="hiw-mockup__step">
            <div className="hiw-mockup__stepno">STEP 01</div>
            <h2>You tell us</h2>
            <p>Stage of life, goals, sensitivities, and the details you choose to share.</p>

            <div className="hiw-mockup__profile-card">
              Your profile · your choices
            </div>
          </article>

          <article className="hiw-mockup__step">
            <div className="hiw-mockup__stepno">STEP 02</div>
            <h2>We narrow the catalog</h2>
            <p>Products are filtered for category fit, known safety conflicts, and relevance.</p>

            <div className="hiw-mockup__metric">
              <span>Start</span>
              <strong>Catalog</strong>
            </div>

            <div className="hiw-mockup__metric">
              <span>Then</span>
              <strong>Relevant set</strong>
            </div>
          </article>

          <article className="hiw-mockup__step">
            <div className="hiw-mockup__stepno">STEP 03</div>
            <h2>Evidence context</h2>
            <p>Where available, ayna links published research, clinical guidance, product-specific evidence, safety information, and community sources.</p>

            <div className="hiw-mockup__evidence">Published research</div>
            <div className="hiw-mockup__evidence">Clinical guidance</div>
            <div className="hiw-mockup__evidence">Product & safety sources</div>
            <div className="hiw-mockup__dropped">Unsupported claims are labeled, not upgraded into facts</div>
          </article>

          <article className="hiw-mockup__step">
            <div className="hiw-mockup__stepno">STEP 04</div>
            <h2>Your ecosystem</h2>
            <p>Your strongest relevant picks are shown with the match reason attached.</p>

            <div className="hiw-mockup__ecosystem-card">
              <strong>Your picks</strong>
              <span>with match reasons and source context</span>
            </div>
          </article>
        </div>

        <div className="hiw-mockup__funnel-section">
          <h2>The narrowing down, in one picture</h2>
          <HowItWorksFunnel />
        </div>

        <div className="hiw-mockup__disclaimer">
          <div>
            <h2>ayna is not a doctor, and never pretends to be.</h2>
            <p>
              Summaries may be AI-assisted and are grounded in cited sources where available. “Clinical context” can include published guidance, clinician-authored sources, or clearly labeled brand-provided clinician claims; it does not mean every product has been independently reviewed by an ayna clinician.
            </p>
          </div>

          <button type="button" onClick={openSources}>
            Read our sources
          </button>
        </div>
      </div>
    </div>
  );
}
