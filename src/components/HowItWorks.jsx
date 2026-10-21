import React from 'react';
import HowItWorksFunnel from './HowItWorksFunnel';
import { getSampleFunnel, SAMPLE_PROFILE_CHIPS } from '../utils/sampleFunnel';
import { EdPage, EdBlock } from './editorial/EdPage';

// What a personalized match is built from. Sponsorship is never one of them.
const MATCH_INPUTS = ['Your profile', 'Published research', 'Clinical guidance + clinician input', 'Community experience'];

export default function HowItWorks({ onBack, onViewSources }) {
  const funnel = getSampleFunnel();
  const openSources = () => {
    if (onViewSources) onViewSources();
    else if (onBack) onBack();
  };

  return (
    <EdPage
      title="How ayna picks your matches."
      lede="ayna compares products with the health profile and preferences you choose to share, then adds cited research, clinical guidance, safety information and community context where available."
      onBack={onBack}
      photo="blue-sink"
      tone="sky"
      frame="flower"
      seal
    >
      <EdBlock title="Four steps, in order." intro="The numbers below are a sample profile run live on today's catalog, not your results.">
        <ol className="ed-hiw">
          <li>
            <span className="ed-hiw__n" aria-hidden="true">1</span>
            <h3 className="ed-rowtitle"><span className="ed-sr">Step 1: </span>You tell us</h3>
            <p>Stage of life, goals, sensitivities and the details you choose to share.</p>
            <div className="ed-hiw__demo">
              <span className="ed-caption">Sample profile</span>
              <div className="ed-tags">{SAMPLE_PROFILE_CHIPS.map((t) => <span key={t}>{t}</span>)}</div>
            </div>
          </li>
          <li>
            <span className="ed-hiw__n" aria-hidden="true">2</span>
            <h3 className="ed-rowtitle"><span className="ed-sr">Step 2: </span>We narrow the market</h3>
            <p>Products across the open market are filtered for category fit, known safety conflicts and relevance.</p>
            <div className="ed-hiw__demo">
              <span className="ed-caption">Sample profile</span>
              <div className="ed-figrow"><span>In the catalog</span><b>{funnel.catalog.toLocaleString()}</b></div>
              <div className="ed-figrow"><span>Matched to this profile</span><b>{funnel.matched}</b></div>
            </div>
          </li>
          <li>
            <span className="ed-hiw__n" aria-hidden="true">3</span>
            <h3 className="ed-rowtitle"><span className="ed-sr">Step 3: </span>We add evidence</h3>
            <p>Published research, clinical guidance, product and safety sources, and community experience, where available.</p>
            <div className="ed-hiw__demo">
              <div className="ed-tags">{['NIH research', 'ACOG guidance', 'CDC data'].map((t) => <span key={t}>{t}</span>)}</div>
              <span className="ed-caption">Unsupported claims are labeled, not upgraded into facts.</span>
            </div>
          </li>
          <li>
            <span className="ed-hiw__n" aria-hidden="true">4</span>
            <h3 className="ed-rowtitle"><span className="ed-sr">Step 4: </span>Your ecosystem</h3>
            <p>Your strongest fits, each shown with its match reason and source context.</p>
            <div className="ed-hiw__demo">
              <span className="ed-caption">Sample profile</span>
              <div className="ed-figrow"><span>strong matches, each with its match reason</span><b>{funnel.strong}</b></div>
            </div>
          </li>
        </ol>
      </EdBlock>

      <EdBlock title="From the whole catalog to your short list.">
        <div className="ay-group is-padded"><HowItWorksFunnel /></div>
      </EdBlock>

      <EdBlock title="Relevant, not paid-first.">
        <div className="ed-two">
          <div>
            <h3 className="ed-rowtitle" style={{ marginBottom: 10 }}>Signals we look at</h3>
            <ul className="ed-rows">
              {MATCH_INPUTS.map((x) => <li key={x} className="ed-body">{x}</li>)}
            </ul>
          </div>
          <div>
            <h3 className="ed-rowtitle" style={{ marginBottom: 10 }}>What never counts</h3>
            <p className="ed-body">
              Personalized picks are ranked on relevance to you, not on commission rate or partnership status.
              Sponsorship is never a match input. Partner brands can be shown higher in Browse, always with a label.
            </p>
          </div>
        </div>
      </EdBlock>

      <EdBlock title="ayna is not a doctor, and never pretends to be.">
        <div className="ed-prose">
          <p>
            Summaries may be AI-assisted and are grounded in cited sources where available. “Clinical context” can
            include published guidance, clinician-authored sources or clearly labeled brand-provided clinician claims;
            it does not mean every product has been independently reviewed by an ayna clinician.
          </p>
          <p style={{ marginTop: 20 }}><button type="button" className="ay-btn ay-btn--primary" onClick={openSources}>Read our sources</button></p>
        </div>
      </EdBlock>
    </EdPage>
  );
}
