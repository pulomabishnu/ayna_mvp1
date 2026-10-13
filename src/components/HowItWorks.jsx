import React from 'react';
import HowItWorksFunnel from './HowItWorksFunnel';
import { getSampleFunnel, SAMPLE_PROFILE_CHIPS } from '../utils/sampleFunnel';
import { InfoPage, InfoSection } from './InfoPage';

const SIGNALS = ['Published research', 'Clinical guidance', 'Clinician input', 'Community experience'];

export default function HowItWorks({ onBack, onViewSources }) {
  const funnel = getSampleFunnel();
  const openSources = () => {
    if (onViewSources) onViewSources();
    else if (onBack) onBack();
  };

  return (
    <InfoPage
      eyebrow="How it works"
      title="No mystery box."
      lede="ayna filters the open market against your profile, then against published research. Anything that fails a step never reaches your shop."
      onBack={onBack}
      width="wide"
    >
      <InfoSection
        eyebrow="The method"
        title="Four steps, one example."
        intro="The numbers below are a sample profile run live on today's catalog, not your results."
      >
        <ol className="ay-info-steps">
          <li className="ay-info-card ay-info-step">
            <span className="ay-info__pill">Step 01</span>
            <h3 className="ay-info-step__title">You tell us</h3>
            <p className="ay-info-step__body">Stage of life, goals, sensitivities, city.</p>
            <div className="ay-info-step__demo">
              <span className="ay-info-example">Sample profile</span>
              <div className="ay-info-chip-row">
                {SAMPLE_PROFILE_CHIPS.map((t) => <span key={t} className="ay-info-chip">{t}</span>)}
              </div>
            </div>
          </li>
          <li className="ay-info-card ay-info-step">
            <span className="ay-info__pill">Step 02</span>
            <h3 className="ay-info-step__title">We scan the market</h3>
            <p className="ay-info-step__body">Everything pulled in, then cut down.</p>
            <div className="ay-info-step__demo">
              <span className="ay-info-example">Sample profile</span>
              <div className="ay-info-metric"><span>In the catalog</span><strong>{funnel.catalog.toLocaleString()}</strong></div>
              <div className="ay-info-metric"><span>Matched to this profile</span><strong>{funnel.matched}</strong></div>
            </div>
          </li>
          <li className="ay-info-card ay-info-step">
            <span className="ay-info__pill">Step 03</span>
            <h3 className="ay-info-step__title">Evidence check</h3>
            <p className="ay-info-step__body">Checked against published guidance. Fails are dropped.</p>
            <div className="ay-info-step__demo">
              <div className="ay-info-chip-row">
                {['NIH research', 'ACOG guidance', 'CDC data'].map((t) => <span key={t} className="ay-info-chip">{t}</span>)}
              </div>
            </div>
          </li>
          <li className="ay-info-card ay-info-step ay-info-step--done">
            <span className="ay-info__pill">Step 04</span>
            <h3 className="ay-info-step__title">Your ecosystem</h3>
            <p className="ay-info-step__body">What's left is ranked, with the reason attached.</p>
            <div className="ay-info-step__demo">
              <span className="ay-info-example">Sample profile</span>
              <div className="ay-info-metric ay-info-metric--big"><strong>{funnel.strong}</strong><span>strong matches, each with its match reason</span></div>
            </div>
          </li>
        </ol>
      </InfoSection>

      <InfoSection eyebrow="The funnel" title="The narrowing down, in one picture.">
        <div className="ay-info-card ay-info-card--pad">
          <HowItWorksFunnel />
        </div>
      </InfoSection>

      <InfoSection eyebrow="What shapes a match" title="Relevant, not paid-first.">
        <div className="ay-info-split">
          <div className="ay-info-card ay-info-card--pad">
            <h3 className="ay-info-card__title">Signals we look at</h3>
            <div className="ay-info-chip-row">
              {SIGNALS.map((s) => <span key={s} className="ay-info-chip">{s}</span>)}
            </div>
          </div>
          <div className="ay-info-card ay-info-card--pad">
            <h3 className="ay-info-card__title">What never counts</h3>
            <p className="ay-info__body">Sponsorship is never a match input. Partner brands can be shown higher in Browse, always with a label.</p>
          </div>
        </div>
      </InfoSection>

      <InfoSection eyebrow="Sources" title="See where it comes from.">
        <div className="ay-info-card ay-info-card--pad ay-info-cta">
          <p className="ay-info__body">Summaries are AI-written from cited sources and clinician input.</p>
          <button type="button" className="ay-info-btn" onClick={openSources}>Read our sources</button>
        </div>
      </InfoSection>
    </InfoPage>
  );
}
