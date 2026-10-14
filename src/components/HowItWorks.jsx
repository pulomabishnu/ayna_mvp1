import React from 'react';
import HowItWorksFunnel from './HowItWorksFunnel';
import { getSampleFunnel, SAMPLE_PROFILE_CHIPS } from '../utils/sampleFunnel';
import { InfoPage, InfoSection } from './InfoPage';

// What a personalized match is built from. Sponsorship is never one of them.
const MATCH_INPUTS = ['Your profile', 'Published research', 'Clinical guidance + clinician input', 'Community experience'];

export default function HowItWorks({ onBack, onViewSources }) {
  const funnel = getSampleFunnel();
  const openSources = () => {
    if (onViewSources) onViewSources();
    else if (onBack) onBack();
  };

  return (
    <InfoPage photos={['blue-sink', 'pink-tile-shelf', 'sink-tea']} tone="sky"
      eyebrow="How it works"
      title="No mystery box."
      lede="ayna compares products with the health profile and preferences you choose to share, then adds cited research, clinical guidance, safety information and community context where available."
      onBack={onBack}
      width="wide"
    >
      <InfoSection
        eyebrow="The process"
        title="Four steps, in order."
        intro="The numbers below are a sample profile run live on today's catalog, not your results."
      >
        <ol className="ay-info-steps">
          <li className="ay-info-card ay-info-step">
            <span className="ay-info__pill">Step 01</span>
            <h3 className="ay-info-step__title">You tell us</h3>
            <p className="ay-info-step__body">Stage of life, goals, sensitivities and the details you choose to share.</p>
            <div className="ay-info-step__demo">
              <span className="ay-info-example">Sample profile</span>
              <div className="ay-info-chip-row">
                {SAMPLE_PROFILE_CHIPS.map((t) => <span key={t} className="ay-info-chip">{t}</span>)}
              </div>
            </div>
          </li>
          <li className="ay-info-card ay-info-step">
            <span className="ay-info__pill">Step 02</span>
            <h3 className="ay-info-step__title">We narrow the market</h3>
            <p className="ay-info-step__body">Products across the open market are filtered for category fit, known safety conflicts and relevance.</p>
            <div className="ay-info-step__demo">
              <span className="ay-info-example">Sample profile</span>
              <div className="ay-info-metric"><span>In the catalog</span><strong>{funnel.catalog.toLocaleString()}</strong></div>
              <div className="ay-info-metric"><span>Matched to this profile</span><strong>{funnel.matched}</strong></div>
            </div>
          </li>
          <li className="ay-info-card ay-info-step">
            <span className="ay-info__pill">Step 03</span>
            <h3 className="ay-info-step__title">We add evidence</h3>
            <p className="ay-info-step__body">Published research, clinical guidance, product and safety sources, and community experience, where available.</p>
            <div className="ay-info-step__demo">
              <div className="ay-info-chip-row">
                {['NIH research', 'ACOG guidance', 'CDC data'].map((t) => <span key={t} className="ay-info-chip">{t}</span>)}
              </div>
              <p className="ay-info__small">Unsupported claims are labeled, not upgraded into facts.</p>
            </div>
          </li>
          <li className="ay-info-card ay-info-step ay-info-step--done">
            <span className="ay-info__pill">Step 04</span>
            <h3 className="ay-info-step__title">Your ecosystem</h3>
            <p className="ay-info-step__body">Your strongest fits, each shown with its match reason and source context.</p>
            <div className="ay-info-step__demo">
              <span className="ay-info-example">Sample profile</span>
              <div className="ay-info-metric ay-info-metric--big"><strong>{funnel.strong}</strong><span>strong matches, each with its match reason</span></div>
            </div>
          </li>
        </ol>
      </InfoSection>

      <InfoSection eyebrow="The funnel" title="Broad in. Focused out.">
        <div className="ay-info-card ay-info-card--pad">
          <HowItWorksFunnel />
        </div>
      </InfoSection>

      <InfoSection eyebrow="What shapes a match" title="Relevant, not paid-first.">
        <div className="ay-info-split">
          <div className="ay-info-card ay-info-card--pad">
            <h3 className="ay-info-card__title">Signals we look at</h3>
            <div className="ay-info-chip-row">
              {MATCH_INPUTS.map((s) => <span key={s} className="ay-info-chip">{s}</span>)}
            </div>
          </div>
          <div className="ay-info-card ay-info-card--pad">
            <h3 className="ay-info-card__title">What never counts</h3>
            <p className="ay-info__body">
              Personalized picks are ranked on relevance to you, not on commission rate or partnership status.
              Sponsorship is never a match input. Partner brands can be shown higher in Browse, always with a label.
            </p>
          </div>
        </div>
      </InfoSection>

      <InfoSection eyebrow="Sources" title="ayna is not a doctor, and never pretends to be.">
        <div className="ay-info-card ay-info-card--pad ay-info-cta">
          <p className="ay-info__body">
            Summaries may be AI-assisted and are grounded in cited sources where available. “Clinical context” can
            include published guidance, clinician-authored sources or clearly labeled brand-provided clinician claims;
            it does not mean every product has been independently reviewed by an ayna clinician.
          </p>
          <button type="button" className="ay-info-btn" onClick={openSources}>Read our sources</button>
        </div>
      </InfoSection>
    </InfoPage>
  );
}
