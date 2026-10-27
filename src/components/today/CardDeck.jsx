import { useRef, useState } from 'react';
import './card-deck.css';

/**
 * The stacked card deck for Home's "For today" (founder Oct 26 22:52: "put them
 * stacked a little, but show the question, and when you click out of it the
 * card goes up"; Apple Wallet / iOS notification stack). Only the top card is
 * shown in full; the next one or two peek behind it (their top edge, in their
 * own colour). Answering on the top card, "Later", or swiping it up sends it up
 * and away, and the next comes forward. "Show all" fans them into the normal
 * list; nothing is removed. Safety and care never go in a deck (TodayFeed keeps
 * them on top, in full).
 *
 *   <CardDeck items={[{ key, title, tone: 'pink' | 'butter', node }]} storageKey="…" />
 *
 * A card leaves on its own answer buttons (any button in it but "Read more",
 * the "…" menu and links out); its answer handlers run first, unchanged.
 */
const reduced = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };
const read = (k) => { try { return JSON.parse(sessionStorage.getItem(k) || '[]'); } catch { return []; } };
const write = (k, v) => { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } };
const STAYS = '.ay-today__readmore, .ay-today__menu, [aria-haspopup], [aria-expanded]';
const CHECK = 'M5 12.5l4.5 4.5L19 7.5';

export default function CardDeck({ items = [], storageKey = 'ayna_deck_v1', label = 'For today', doneText = 'All done for today' }) {
  const [gone, setGone] = useState(() => read(storageKey));
  const [all, setAll] = useState(false);
  const [leaving, setLeaving] = useState(null);
  const [say, setSay] = useState('');
  const drag = useRef(null);
  const [dy, setDy] = useState(0);

  const left = items.filter((it) => !gone.includes(it.key));
  const top = left[0] || null;
  const total = items.length;
  const position = total - left.length + 1;

  const dismiss = (key) => {
    if (!key || leaving) return;
    const finish = () => {
      setGone((g) => { const next = g.includes(key) ? g : [...g, key]; write(storageKey, next); return next; });
      setLeaving(null);
      setDy(0);
      const after = left.filter((it) => it.key !== key);
      setSay(after.length ? `Card ${total - after.length + 1} of ${total}: ${after[0].title}` : `${doneText}.`);
    };
    if (reduced()) { finish(); return; }
    setLeaving(key);
    window.setTimeout(finish, 280);
  };
  const reset = () => { setGone([]); write(storageKey, []); setSay(`Card 1 of ${total}: ${items[0]?.title || ''}`); };

  // Her answer on the top card (chips, the primary action) sends it on after its own handler runs.
  const onTopClick = (e) => {
    const b = e.target.closest('button, a');
    if (!b || !e.currentTarget.contains(b) || b.closest(STAYS) || b.classList.contains('ay-fdeck__btn')) return;
    window.setTimeout(() => dismiss(top?.key), 0);
  };
  // Swipe up (optional; the buttons always work). Not started from a control.
  const onDown = (e) => { if (e.target.closest('button, a, input, select, textarea')) return; drag.current = { y: e.clientY, id: e.pointerId }; };
  const onMove = (e) => { if (!drag.current || drag.current.id !== e.pointerId) return; setDy(Math.min(0, e.clientY - drag.current.y)); };
  const onUp = () => { if (!drag.current) return; drag.current = null; if (dy < -60) dismiss(top?.key); else setDy(0); };

  if (!total) return null;

  if (all) {
    return (
      <div className="ay-fdeck is-all">
        <div className="ay-fdeck__bar">
          <span className="ay-fdeck__count">{total} for today</span>
          <button type="button" className="ay-fdeck__text" onClick={() => setAll(false)}>Stack them</button>
        </div>
        <ul className="ay-today__list is-compact ay-fdeck__list" aria-label={label}>{items.map((it) => it.node)}</ul>
      </div>
    );
  }

  return (
    <div className="ay-fdeck">
      <div className="ay-fdeck__bar">
        <span className="ay-fdeck__count">{top ? `${position} of ${total}` : `${total} done`}</span>
        <button type="button" className="ay-fdeck__text" onClick={() => setAll(true)} aria-expanded="false">Show all</button>
      </div>
      <p className="sr-only" aria-live="polite">{say}</p>
      {top ? (
        <div className="ay-fdeck__stack" style={{ '--ay-fdeck-peek': Math.min(2, left.length - 1) }}>
          {/* The top card, in full; the list itself carries the motion and the swipe. */}
          <ul
            key={top.key}
            className={`ay-today__list is-compact ay-fdeck__list ay-fdeck__top is-${top.tone || 'butter'}${leaving === top.key ? ' is-leaving' : ''}`}
            aria-label={`${label}, ${position} of ${total}`}
            style={dy ? { transform: `translateY(${dy}px)`, transition: 'none' } : undefined}
            onClickCapture={onTopClick}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          >
            {top.node}
          </ul>
          {/* The next one or two: only their top edge, in their own colour (decoration; the count says how many). */}
          {left.slice(1, 3).map((it, i) => <span key={it.key} className={`ay-fdeck__peek is-${it.tone || 'butter'} is-${i + 1}`} aria-hidden="true" />)}
        </div>
      ) : (
        <div className="ay-fdeck__done" role="status">
          <span className="ay-fdeck__tick" aria-hidden="true"><svg viewBox="0 0 24 24"><path d={CHECK} /></svg></span>
          <b>{doneText}</b>
          <button type="button" className="ay-fdeck__text" onClick={reset}>See them again</button>
        </div>
      )}
      {top && (
        <div className="ay-fdeck__nav">
          <button type="button" className="ay-fdeck__btn" onClick={() => dismiss(top.key)} aria-label={left.length > 1 ? `Later. Next: ${left[1].title}` : 'Later'}>Later<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6" /></svg></button>
        </div>
      )}
    </div>
  );
}
