import React, { useMemo, useState } from 'react';
import MatchPill from '../MatchPill.jsx';
import SafetyHoldNote from '../match/SafetyHoldNote.jsx';
import BleedingEvaluationNote from '../match/BleedingEvaluationNote.jsx';
import { matchText, MATCH_UNAVAILABLE, SAFETY_HOLD } from '../../utils/matchDisplay.js';
import { buildEvidence } from './evidenceModel.js';
import { fitChecklist, splitShow, SHOW_FIRST } from './pdpParts.js';
import PdpIcon from './PdpIcon.jsx';
import './pdp-v7.css';

/**
 * The product page's shared parts (website page, app page, app sheet):
 * one match line, the Is it for you checklist, the At a glance bento, the
 * evidence meter, the safety box and "Show all N". Decisions live in
 * pdpParts.js; these only draw them.
 */

/** "Show all N": the first few, then the rest in place. Everything stays in the page. */
export function ShowAll({ items, n = SHOW_FIRST, render, className = '', label = 'items', itemClass }) {
  const [open, setOpen] = useState(false);
  const { shown, rest, total } = splitShow(items, n);
  if (!total) return null;
  const li = (x, i, hidden = false) => <li key={i} className={itemClass ? itemClass(x) : undefined} hidden={hidden || undefined}>{render(x, i)}</li>;
  return (
    <>
      <ul className={className}>
        {shown.map((x, i) => li(x, i))}
        {rest.map((x, i) => li(x, i + shown.length, !open))}
      </ul>
      {rest.length > 0 && (
        <button type="button" className="ayv-showall" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? 'Show fewer' : `Show all ${total} ${label}`}
        </button>
      )}
    </>
  );
}

/** The one match line under the price: % + why, a safety hold, the bleeding evaluation, or nothing. Never 0%. */
export function MatchLine({ state, onWhy = null, onFix = null, onQuiz = null }) {
  if (!state) return null;
  if (state.kind === 'pct') {
    const body = <><MatchPill percent={state.percent} size="sm" /><span className="ayv-match__why">{state.why || 'Why ayna picked this for you'}</span>{onWhy && <span className="ayv-match__go">See why</span>}</>;
    return onWhy
      ? <button type="button" className="ayv-match" data-tour="pdp-why" onClick={onWhy} aria-label={`${matchText(state.percent)}${state.why ? `. ${state.why}` : ''}. See why`}>{body}</button>
      : <p className="ayv-match" data-tour="pdp-why">{body}</p>;
  }
  if (state.kind === 'hold') {
    return (
      <div className="ayv-match is-hold" data-tour="pdp-why">
        {state.hold ? <SafetyHoldNote hold={state.hold} onFix={onFix} compact /> : <p className="ayv-match__row"><MatchPill hold size="sm" /><span className="ayv-match__why">{MATCH_UNAVAILABLE}</span></p>}
        {onWhy && <button type="button" className="ayv-textbtn" onClick={onWhy} aria-label={`${SAFETY_HOLD}. ${MATCH_UNAVAILABLE}. See why`}>See why</button>}
      </div>
    );
  }
  if (state.kind === 'evaluation') {
    return (
      <div className="ayv-match is-hold" data-tour="pdp-why">
        {state.note ? <BleedingEvaluationNote note={state.note} /> : <p className="ayv-match__why">{state.text}</p>}
        {onWhy && <button type="button" className="ayv-textbtn" onClick={onWhy}>See why</button>}
      </div>
    );
  }
  if (state.kind === 'none') {
    return onWhy
      ? <button type="button" className="ayv-match is-none" data-tour="pdp-why" onClick={onWhy}><span className="ayv-match__why">{state.text}</span><span className="ayv-match__go">See why</span></button>
      : <p className="ayv-match is-none" data-tour="pdp-why"><span className="ayv-match__why">{state.text}</span></p>;
  }
  if (state.kind === 'quiz') {
    return <button type="button" className="ayv-match is-none" data-tour="pdp-why" onClick={onQuiz || undefined}><span className="ayv-match__why">See how it fits you</span><span className="ayv-match__go">Get matched</span></button>;
  }
  return null;
}

const MARKS = {
  yes: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  check: <><path d="M12 6.5v7" /><path d="M12 17.2v.3" /></>,
  no: <path d="M7 7l10 10M17 7 7 17" />,
};
const TONE_SR = { yes: 'Fits: ', check: 'Check first: ', no: 'Not for: ' };

/** "Is it for you": ✓ fits, ! check with a clinician, ✕ not for. Built from what is on file. */
export function IsItForYou({ product, details = null, hasProfile = false, onShowWhy = null, helps = [], extra = null, heading = 'Is it for you', id = 'ayv-fit' }) {
  const m = useMemo(() => (product ? buildEvidence(product, {}) : null), [product]);
  const items = useMemo(() => fitChecklist({ details: hasProfile ? details : null, who: m?.who || [], warnings: m?.safety?.warnings || [] }), [m, details, hasProfile]);
  if (!items.length && !helps.length) return null;
  return (
    <section className="ayv-fit ayq-anchor" id={id} aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className="ayv-h">{heading}</h2>
      {!hasProfile && items.length > 0 && <p className="ayv-fit__sub">Who it’s for</p>}
      <ShowAll
        items={items}
        n={4}
        label="points"
        className="ayv-checks"
        itemClass={(x) => `is-${x.tone}`}
        render={(x) => (
          <>
            <span className="ayv-checks__mark" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">{MARKS[x.tone]}</svg></span>
            <span className="ayv-checks__text"><span className="sr-only">{TONE_SR[x.tone]}</span>{x.text}</span>
          </>
        )}
      />
      {helps.length > 0 && <p className="ayv-fit__helps"><b>Helps with:</b> {helps.join(', ')}</p>}
      {extra}
      {hasProfile && onShowWhy && (
        <p className="ayv-fit__links">
          <button type="button" className="ayv-textbtn" onClick={onShowWhy}>See the breakdown</button>
          <a className="ayv-textbtn" href="/how-it-works">How we match</a>
        </p>
      )}
    </section>
  );
}

/** At a glance: a bento of 4-6 tiles, each a label and one big value. */
export function GlanceBento({ tiles, id = 'ayv-glance' }) {
  if (!tiles?.length) return null;
  return (
    <section className="ayv-glance" aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className="ayv-h">At a glance</h2>
      <ul className={`ayv-bento is-${tiles.length}`}>
        {tiles.map((t, i) => (
          <li key={t.id} className={`ayv-tile is-${t.id}${i === 0 ? ' is-lead' : ''}`}>
            <span className="ayv-tile__label"><PdpIcon name={t.icon} size={18} />{t.label}</span>
            <span className="ayv-tile__value">{t.main}</span>
            {t.note && <span className="ayv-tile__note">{t.note}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The evidence grade as 3 bars + its word. The bars fill once (none under reduced motion). */
export function EvidenceMeter({ meter, onMore = null, moreLabel = 'See the literature', size = 'md' }) {
  if (!meter) return null;
  return (
    <div className={`ayv-meter is-${size}${meter.empty ? ' is-empty' : ''}`} data-level={meter.level}>
      <p className="ayv-meter__k">Evidence</p>
      {meter.empty ? (
        <p className="ayv-meter__word">{meter.label}</p>
      ) : (
        <p className="ayv-meter__row">
          <span className="ayv-meter__bars" role="img" aria-label={`${meter.label}, ${meter.level} of ${meter.of}`}>
            {Array.from({ length: meter.of }, (_, i) => <i key={i} className={i < meter.level ? 'is-on' : undefined} style={{ '--i': i }} />)}
          </span>
          <span className="ayv-meter__word">{meter.label}{meter.need && <span className="ayv-meter__for"> for {meter.need}</span>}</span>
        </p>
      )}
      {meter.note && <p className="ayv-meter__note">{meter.note}</p>}
      {onMore && <button type="button" className="ayv-textbtn" onClick={onMore}>{moreLabel}</button>}
    </div>
  );
}

/** The one critical safety line, in a clearly coloured box near the top; "All safety info" opens the full list. */
export function SafetyBox({ text, onAll = null }) {
  if (!text) return null;
  const all = onAll || (() => window.dispatchEvent(new CustomEvent('ay-open-tab', { detail: 'safety' })));
  return (
    <div className="ayv-safety" role="note">
      <span className="ayv-safety__mark" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 2 21h20L12 3Z" /><path d="M12 10v5M12 18v.5" /></svg></span>
      <p className="ayv-safety__text"><span className="sr-only">Safety note: </span>{text}</p>
      <button type="button" className="ayv-safety__all" onClick={all}>All safety info</button>
    </div>
  );
}
