import { useState } from 'react';
import { matchText } from '../../utils/matchDisplay.js';
import { safeProductImageSrc } from '../../utils/resolveProductImage.js';
import { productImageOverride } from '../../data/productImageOverrides.js';
import { getBuyUrl } from '../../mobile/data/buyUrl.js';
import { leavingLine } from '../../utils/leavingAyna.js';
import { OUTCOME_LABELS } from '../../health/outcomes.js';
import { START_MAX } from '../../health/routines.js';
import './routine.css';

/**
 * "Your period-pain routine": one routine per active need (team direction
 * 3, 4, 66, 67). Start here (1 to 3), Track it, Other options. Her changes
 * are made in place; the last one can be undone. Buying is never the point:
 * shopping the routine together is a quiet link at the end.
 *
 * Copy here is control labels and fixed frames only. Every Why, When and
 * How long line comes from src/health/routines.js.
 */

const fmtDay = (day) => new Date(`${day}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

function Thumb({ product }) {
  const src = productImageOverride(product) || safeProductImageSrc(product?.image || product?.imageUrl || product?.images?.[0]);
  const [broken, setBroken] = useState(false);
  return <span className="ay-rx__thumb" aria-hidden="true">{src && !broken ? <img src={src} alt="" loading="lazy" onError={() => setBroken(true)} /> : <span>{(product?.brand || product?.name || '?').charAt(0)}</span>}</span>;
}

function Sources({ list = [] }) {
  const s = list.filter((x) => x?.url);
  if (!s.length) return null;
  return <p className="ay-rx__src">Source{s.length > 1 ? 's' : ''}: {s.map((x, i) => <span key={x.url}>{i ? ', ' : ''}<a href={x.url} target="_blank" rel="noopener noreferrer">{x.label}<span className="sr-only"> (opens in a new tab)</span></a></span>)}</p>;
}

/** Where she is with it: started, due, or what she said. */
function TryLine({ item }) {
  const t = item.lastTry;
  if (!t) return null;
  if (t.outcome) return <p className="ay-rx__status">You said: {OUTCOME_LABELS[t.outcome] || 'Recorded'}{t.recordedDay ? `, ${fmtDay(t.recordedDay)}` : ''}.</p>;
  const due = t.status === 'due';
  return <p className="ay-rx__status">{due ? 'Time to say how it went.' : `Trying since ${fmtDay(t.startedDay)}.`}</p>;
}

function Facts({ item, onCheckIn }) {
  return (
    <dl className="ay-rx__facts">
      <div><dt>Why</dt><dd>{item.why}</dd></div>
      {item.when && <div><dt>When</dt><dd>{item.when}{item.how ? <><br /><span className="ay-rx__how">{item.how}</span>{item.howSource && <small> From {item.howSource}</small>}</> : null}</dd></div>}
      {item.horizon && <div><dt>How long to try</dt><dd>{item.horizon.label.charAt(0).toUpperCase() + item.horizon.label.slice(1)}</dd></div>}
      {item.know && <div><dt>How you’ll know</dt><dd>{item.know}{onCheckIn && <> <button type="button" className="ay-rx__link" onClick={onCheckIn}>Check in</button></>}</dd></div>}
    </dl>
  );
}

function StartItem({ routine, item, act, onOpenProduct, onCheckIn, alternatives }) {
  const [replacing, setReplacing] = useState(false);
  const need = routine.need;
  const tried = Boolean(item.lastTry);
  const pct = item.kind === 'product' ? matchText(item.percent) : '';
  return (
    <li className={`ay-rx__item is-${item.kind}`}>
      <div className="ay-rx__itemhead">
        {item.kind === 'product' && <Thumb product={item.product} />}
        <div className="ay-rx__itemname">
          <p className="ay-rx__kicker">{item.kind === 'product' ? 'A product' : item.informationOnly ? 'Information' : 'Something to try'}</p>
          {item.kind === 'product'
            ? <h4><button type="button" className="ay-rx__namebtn" onClick={() => onOpenProduct?.(item.product)}>{item.title}</button></h4>
            : <h4>{item.title}</h4>}
          {(pct || item.owned) && <p className="ay-rx__meta">{[pct, item.owned ? 'You have this' : ''].filter(Boolean).join(' · ')}</p>}
        </div>
      </div>
      <Facts item={item} onCheckIn={onCheckIn} />
      {item.caution && <p className="ay-rx__caution">{item.caution}</p>}
      {item.kind !== 'product' && <Sources list={item.sources} />}
      <TryLine item={item} />
      <div className="ay-rx__actions">
        {item.canStart && !tried && <button type="button" className="ay-rx__primary" onClick={() => act.start(need, item)}>I’m trying this</button>}
        {item.canStart && (
          <span className="ay-rx__chips" role="group" aria-label={`Did ${item.title} help?`}>
            <span className="ay-rx__chiplabel">{tried ? 'Did it help?' : 'Tried it before?'}</span>
            <button type="button" className="ay-rx__chip" aria-pressed={item.lastTry?.outcome === 'helpful'} onClick={() => act.outcome(need, item, 'helpful')}>Helped</button>
            <button type="button" className="ay-rx__chip" aria-pressed={item.lastTry?.outcome === 'no_change'} onClick={() => act.outcome(need, item, 'no_change')}>Didn’t help</button>
            {tried && <button type="button" className="ay-rx__chip" aria-pressed={item.lastTry?.outcome === 'unsure'} onClick={() => act.outcome(need, item, 'unsure')}>Not sure yet</button>}
          </span>
        )}
      </div>
      <details className="ay-rx__change">
        <summary>Change</summary>
        <div className="ay-rx__changerow">
          {alternatives.length > 0 && <button type="button" className="ay-rx__text" aria-expanded={replacing} onClick={() => setReplacing((v) => !v)}>Replace</button>}
          {item.kind === 'product' && <button type="button" className="ay-rx__text" aria-pressed={Boolean(item.owned)} onClick={() => act.owned(need, item)}>{item.owned ? 'I don’t have it' : 'Already have it'}</button>}
          <button type="button" className="ay-rx__text" onClick={() => act.postpone(need, item, 7)}>Not now, in a week</button>
          <button type="button" className="ay-rx__text" onClick={() => act.later(need, item)}>Save for later</button>
          <button type="button" className="ay-rx__text" onClick={() => act.remove(need, item)}>Remove</button>
          <button type="button" className="ay-rx__text" onClick={() => act.notForMe(need, item)}>Not for me</button>
        </div>
        {replacing && (
          <ul className="ay-rx__replace" aria-label={`Replace ${item.title} with`}>
            {alternatives.map((alt) => <li key={alt.key}><button type="button" onClick={() => { setReplacing(false); act.replace(need, item, alt); }}><span>{alt.title}</span><small>{alt.when || alt.why}</small></button></li>)}
          </ul>
        )}
      </details>
    </li>
  );
}

function OtherItem({ routine, item, act, onOpenProduct, canAdd }) {
  const need = routine.need;
  const pct = item.kind === 'product' ? matchText(item.percent) : '';
  return (
    <li className="ay-rx__other-item">
      {item.kind === 'product' && <Thumb product={item.product} />}
      <div className="ay-rx__other-text">
        {item.kind === 'product'
          ? <button type="button" className="ay-rx__namebtn" onClick={() => onOpenProduct?.(item.product)}>{item.title}</button>
          : <b>{item.title}</b>}
        <span>{[pct, item.when].filter(Boolean).join(' · ')}</span>
        <span className="ay-rx__other-why">{item.why}</span>
        {item.caution && <span className="ay-rx__caution">{item.caution}</span>}
        {item.kind !== 'product' && <Sources list={item.sources} />}
        <span className="ay-rx__actions">
          {canAdd && !item.informationOnly && <button type="button" className="ay-rx__text" onClick={() => act.add(need, item)}>Add to Start here</button>}
          <button type="button" className="ay-rx__text" onClick={() => act.later(need, item)}>Save for later</button>
          <button type="button" className="ay-rx__text" onClick={() => act.notForMe(need, item)}>Not for me</button>
        </span>
      </div>
    </li>
  );
}

function SetAside({ routine, act }) {
  const groups = [
    ['Saved for later', routine.later],
    ['Not now', routine.postponed],
    ['Tried, did not help', routine.tried],
    ['Not for me', routine.notForMe],
  ].filter(([, list]) => list.length);
  if (!groups.length) return null;
  return (
    <details className="ay-rx__aside">
      <summary>Set aside ({groups.reduce((n, [, l]) => n + l.length, 0)})</summary>
      {groups.map(([title, list]) => (
        <div key={title} className="ay-rx__asidegroup">
          <h5>{title}</h5>
          <ul>{list.map((it) => <li key={it.key}><span>{it.title}{it.until ? <small> until {fmtDay(it.until)}</small> : null}</span>{title !== 'Tried, did not help' && <button type="button" className="ay-rx__text" onClick={() => act.restore(routine.need, it)}>Restore</button>}</li>)}</ul>
        </div>
      ))}
    </details>
  );
}

/** Shop the routine together: only the products in Start here she does not have. A quiet, optional link. */
function ShopTogether({ routine }) {
  const items = routine.start.filter((it) => it.kind === 'product' && !it.owned).map((it) => ({ it, url: getBuyUrl(it.product) })).filter((x) => x.url);
  if (!items.length) return null;
  return (
    <details className="ay-rx__shop">
      <summary>Buy this routine</summary>
      <p className="ay-rx__note">Only if you want to. Everything here is optional, and you can start with what you have.</p>
      <ul>{items.map(({ it, url }) => (
        <li key={it.key}><span>{it.title}</span><a href={url} target="_blank" rel="noopener noreferrer sponsored">Buy<span className="sr-only"> {it.title} (opens the seller’s site)</span></a><small>{leavingLine(url)}</small></li>
      ))}</ul>
    </details>
  );
}

const OTHER_SHOWN = 4;

function OneRoutine({ routine, act, note, onOpenProduct, onCheckIn, headingLevel = 2 }) {
  const [more, setMore] = useState(false);
  const H = `h${headingLevel}`;
  const others = routine.other;
  const shown = more ? others : others.slice(0, OTHER_SHOWN);
  const altFor = (item) => others.filter((o) => o.kind === item.kind && !o.informationOnly).slice(0, 4);
  return (
    <section className="ay-rx" aria-labelledby={`ay-rx-${routine.need}`}>
      <header className="ay-rx__head">
        <H id={`ay-rx-${routine.need}`}>{routine.title}</H>
        <p>Start with one or two things. You don’t need everything here.</p>
        {note?.need === routine.need && (
          <p className="ay-rx__notice" role="status">{note.text} {note.undo && <button type="button" className="ay-rx__link" onClick={note.undo}>Undo</button>}</p>
        )}
      </header>
      <div className="ay-rx__main">
      <h3 className="ay-rx__h">Start here</h3>
      {routine.start.length
        ? <ol className="ay-rx__list">{routine.start.map((item) => <StartItem key={item.key} routine={routine} item={item} act={act} onOpenProduct={onOpenProduct} onCheckIn={onCheckIn} alternatives={altFor(item)} />)}</ol>
        : <p className="ay-rx__empty">Nothing in Start here. Add one of the options below.</p>}
      <div className="ay-rx__track">
        <div>
          <p className="ay-rx__kicker">Track it</p>
          <h4>{routine.track.title}</h4>
          <p>{routine.track.body}</p>
        </div>
        {onCheckIn && <button type="button" className="ay-rx__primary" onClick={onCheckIn}>Check in</button>}
      </div>
      </div>
      <div className="ay-rx__side">
      {others.length > 0 && (
        <div className="ay-rx__others">
          <h3 className="ay-rx__h">Other options</h3>
          <ul>{shown.map((item) => <OtherItem key={item.key} routine={routine} item={item} act={act} onOpenProduct={onOpenProduct} canAdd={!routine.full} />)}</ul>
          {others.length > OTHER_SHOWN && <button type="button" className="ay-rx__text" aria-expanded={more} onClick={() => setMore((v) => !v)}>{more ? 'Show fewer' : `Show ${others.length - OTHER_SHOWN} more`}</button>}
          {routine.full && <p className="ay-rx__note">Start here holds {START_MAX}. Remove one to add another.</p>}
        </div>
      )}
        <SetAside routine={routine} act={act} />
        <ShopTogether routine={routine} />
      </div>
    </section>
  );
}

/**
 * @param {{ state: ReturnType<import('./useRoutines.js').useRoutines>, variant?: 'app'|'web', onOpenProduct, onCheckIn, emptyNote? }} props
 */
export default function NeedRoutines({ state, variant = 'app', onOpenProduct, onCheckIn, id = 'ay-routines', showEmpty = false }) {
  const { routines, note, act } = state;
  if (!routines.length) {
    return showEmpty ? <section id={id} className={`ay-rxr is-${variant} is-empty`}><p className="ay-rx__empty">Your routines appear here once you tell ayna what you want help with, like period pain, PMS or sleep.</p></section> : null;
  }
  return (
    <div id={id} className={`ay-rxr is-${variant}`}>
      {routines.map((r) => <OneRoutine key={r.need} routine={r} act={act} note={note} onOpenProduct={onOpenProduct} onCheckIn={onCheckIn} />)}
    </div>
  );
}
