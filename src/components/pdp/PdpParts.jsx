import React, { useEffect, useState } from 'react';
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

/** Every store on file, one row each: the Buy link first, price where known, ↗ for links. Only when there is more than one. */
export function WhereToBuy({ rows, onOpen = null }) {
  if (!rows || rows.length < 2) return null;
  return (
    <section className="ayv-where" aria-labelledby="ayv-where-h">
      <h2 id="ayv-where-h" className="ayv-where__h">Where to buy</h2>
      <ul className="ayv-where__list">
        {rows.map((r) => (
          <li key={`${r.name}-${r.url}`}>
            {r.url
              ? <a href={r.url} target="_blank" rel="noopener noreferrer" onClick={() => onOpen?.(r)}><span className="ayv-where__name">{r.name}{r.host && <small className="ayv-where__host">{r.host}</small>}</span>{r.price && <span className="ayv-where__price">{r.price}</span>}{r.inStock && <span className="ayv-where__stock">In stock</span>}<span aria-hidden="true" className="ayv-where__go">↗</span><span className="sr-only"> (opens in a new tab)</span></a>
              : <span className="ayv-where__row"><span className="ayv-where__name">{r.name}</span>{r.inStock && <span className="ayv-where__stock">In stock</span>}<span className="ayv-where__nolink">No link yet</span></span>}
          </li>
        ))}
      </ul>
    </section>
  );
}

const HEART = 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z';

/**
 * Buy stays in reach (founder, Oct 25): once the hero's action row scrolls
 * out of view, a slim bar with the price, Buy and Save. `mode` 'scroll' sits
 * at the bottom of the app's own scroll area (page or sheet, above the tab
 * bar); 'fixed' sits above the website's phone tab bar. Hidden while she is
 * typing (keyboard open) and before she has scrolled past the actions.
 */
export function StickyBuy({ model, watch, saved = false, onSave = null, mode = 'scroll', onBuy = null, wideOff = false }) {
  const [past, setPast] = useState(false);
  const [typing, setTyping] = useState(false);
  const [wide, setWide] = useState(() => wideOff && typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(min-width: 1024px)').matches);
  const [bottom, setBottom] = useState(0);
  useEffect(() => {
    const el = watch?.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    let root = null;
    // The element that really scrolls (the app's page or sheet); the website scrolls the document (root null).
    for (let n = el.parentElement; n && n !== document.body && n !== document.documentElement; n = n.parentElement) { const oy = window.getComputedStyle(n).overflowY; if ((oy === 'auto' || oy === 'scroll') && n.scrollHeight > n.clientHeight + 1) { root = n; break; } }
    const io = new IntersectionObserver(([e]) => {
      const top = root ? root.getBoundingClientRect().top : 0;
      setPast(!e.isIntersecting && e.boundingClientRect.bottom < top + 8);
    }, { root, threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [watch]);
  useEffect(() => {
    const isField = (t) => t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) && !/^(button|checkbox|radio|submit)$/i.test(t.type || '');
    const on = (e) => setTyping(isField(e.target));
    const off = () => setTyping(false);
    document.addEventListener('focusin', on);
    document.addEventListener('focusout', off);
    return () => { document.removeEventListener('focusin', on); document.removeEventListener('focusout', off); };
  }, []);
  useEffect(() => {
    if (mode !== 'fixed') return undefined;
    const read = () => {
      const nav = document.querySelector('nav.ay-tabbar--main');
      const r = nav ? nav.getBoundingClientRect() : null;
      setBottom(r && r.height && window.getComputedStyle(nav).display !== 'none' ? Math.max(0, window.innerHeight - r.top) : 0);
      if (wideOff && typeof window.matchMedia === 'function') setWide(window.matchMedia('(min-width: 1024px)').matches);
    };
    read();
    window.addEventListener('resize', read);
    return () => window.removeEventListener('resize', read);
  }, [mode, wideOff]);
  if (!model?.url || !past || typing || wide) return null;
  return (
    <div className={`ayv-stickybuy is-${mode}`} style={mode === 'fixed' ? { bottom } : undefined} role="region" aria-label="Buy">
      {model.price && <span className="ayv-stickybuy__price">{model.price}</span>}
      <a className="ayv-stickybuy__buy" href={model.url} target="_blank" rel="noopener noreferrer" onClick={() => onBuy?.()}>
        {model.isService ? 'Visit' : model.retailer && model.retailer.length <= 14 ? `Buy at ${model.retailer}` : 'Buy'}<span aria-hidden="true"> ↗</span><span className="sr-only"> (opens the seller’s site)</span>
      </a>
      {onSave && (
        <button type="button" className={`ayv-stickybuy__save${saved ? ' is-on' : ''}`} aria-pressed={saved} aria-label={saved ? 'Saved' : 'Save'} onClick={onSave}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={HEART} /></svg>
        </button>
      )}
    </div>
  );
}

/** The price, big, and one muted line of what it buys (count, supply, per unit). */
export function PriceLine({ main, notes = [] }) {
  if (!main && !notes.length) return null;
  return (
    <div className="ayv-price">
      {main && <span className="ayv-price__main">{main}</span>}
      {notes.length > 0 && <span className="ayv-price__notes">{notes.join(' · ')}</span>}
    </div>
  );
}
