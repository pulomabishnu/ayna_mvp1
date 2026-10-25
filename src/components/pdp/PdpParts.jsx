import React, { useState } from 'react';
import MatchPill from '../MatchPill.jsx';
import SafetyHoldNote from '../match/SafetyHoldNote.jsx';
import BleedingEvaluationNote from '../match/BleedingEvaluationNote.jsx';
import { matchText, MATCH_UNAVAILABLE, SAFETY_HOLD } from '../../utils/matchDisplay.js';
import { splitShow, SHOW_FIRST } from './pdpParts.js';
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
          {open ? 'Show fewer' : `Show all ${total}${label ? ` ${label}` : ''}`}
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

/**
 * The one critical safety line under the action row (founder, Oct 25): a pink
 * mark, the line, and "Safety", which jumps to the Safety section. No box, and
 * the full text lives only in Safety.
 */
export function SafetyLine({ text, onGo = null }) {
  if (!text) return null;
  const go = onGo || (() => window.dispatchEvent(new CustomEvent('ay-open-tab', { detail: 'safety' })));
  return (
    <p className="ayv-safeline" role="note">
      <span className="ayv-safeline__mark" aria-hidden="true">!</span>
      <span className="ayv-safeline__text"><span className="sr-only">Safety: </span>{text}</span>
      <button type="button" className="ayv-textbtn ayv-safeline__go" onClick={go}>Safety</button>
    </p>
  );
}
