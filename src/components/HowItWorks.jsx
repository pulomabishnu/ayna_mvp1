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
          Ayna filters the open market against your profile, then against published research.
          <br className="hiw-desktop-break" />
          Anything that fails a step never reaches your shop.
        </p>

        <div className="hiw-mockup__steps">
          <article className="hiw-mockup__step">
            <div className="hiw-mockup__stepno">STEP 01</div>
            <h2>You tell us</h2>
            <p>Stage of life, goals, sensitivities, city.</p>

            <div className="hiw-mockup__profile-card">
              Postpartum · 8 weeks · sensitive skin · NYC
            </div>
          </article>

          <article className="hiw-mockup__step">
            <div className="hiw-mockup__stepno">STEP 02</div>
            <h2>We scan the market</h2>
            <p>Everything pulled in, then cut down.</p>

            <div className="hiw-mockup__metric">
              <span>Pulled in</span>
              <strong>3,140</strong>
            </div>

            <div className="hiw-mockup__metric">
              <span>Relevant to you</span>
              <strong>212</strong>
            </div>
          </article>

          <article className="hiw-mockup__step">
            <div className="hiw-mockup__stepno">STEP 03</div>
            <h2>Evidence check</h2>
            <p>Checked against published guidance.</p>

            <div className="hiw-mockup__evidence">NIH research</div>
            <div className="hiw-mockup__evidence">ACOG guidance</div>
            <div className="hiw-mockup__evidence">CDC data</div>
            <div className="hiw-mockup__dropped">Fails → dropped</div>
          </article>

          <article className="hiw-mockup__step">
            <div className="hiw-mockup__stepno">STEP 04</div>
            <h2>Your ecosystem</h2>
            <p>What's left is ranked, with the reason attached.</p>

            <div className="hiw-mockup__ecosystem-card">
              <strong>14</strong>
              <span>products, each with its match reason</span>
            </div>
          </article>
        </div>

        <div className="hiw-mockup__funnel-section">
          <h2>The narrowing down, in one picture</h2>
          <HowItWorksFunnel />
        </div>

        <div className="hiw-mockup__disclaimer">
          <div>
            <h2>Ayna is not a doctor, and never pretends to be.</h2>
            <p>
              Summaries are AI-written from cited sources and clinician input.
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
