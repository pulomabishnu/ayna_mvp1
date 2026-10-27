import { useRef, useState } from 'react';
import './card-deck.css';

/**
 * Home's "For today" as a stack of passes (founder Oct 26 22:52 and 23:39: "stacked a little, but show
 * the question", "I meant having the title peek out of each one"; Apple Wallet). The other cards sit
 * above as overlapping title strips (one-line title on the butter surface), so every item reads
 * at a glance; the front card shows in full at the bottom with its answers. Tapping a strip brings
 * that card to the front. Answering on the front card, "Later", or swiping it up sends it away and
 * the next one comes forward. "Show all" lists them normally; nothing is removed. Safety and care
 * never go in here (TodayFeed keeps them above, in full).
 *
 *   <CardDeck items={[{ key, title, node }]} storageKey="…" />
 *
 * The front card leaves on its own answer buttons (any button in it but "Read more", the "…" menu and
 * disclosures); its answer handlers run first, unchanged.
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
  const [frontKey, setFrontKey] = useState(null);
  const [entered, setEntered] = useState(0);
  const [say, setSay] = useState('');
  const drag = useRef(null);
  const [dy, setDy] = useState(0);

  const left = items.filter((it) => !gone.includes(it.key));
  const front = left.find((it) => it.key === frontKey) || left[0] || null;
  const behind = left.filter((it) => it !== front);
  const total = items.length;
  const announce = (it, n) => setSay(it ? `${it.title}. ${n} of ${total} left for today.` : `${doneText}.`);

  const bringForward = (it) => {
    setFrontKey(it.key);
    setEntered((n) => n + 1);
    announce(it, left.length);
  };
  const dismiss = (key) => {
    if (!key || leaving) return;
    const finish = () => {
      setGone((g) => { const next = g.includes(key) ? g : [...g, key]; write(storageKey, next); return next; });
      setLeaving(null);
      setDy(0);
      const after = left.filter((it) => it.key !== key);
      setFrontKey(after[0]?.key || null);
      setEntered((n) => n + 1);
      announce(after[0], after.length);
    };
    if (reduced()) { finish(); return; }
    setLeaving(key);
    window.setTimeout(finish, 260);
  };
  const reset = () => { setGone([]); write(storageKey, []); setFrontKey(null); announce(items[0], total); };

  // Her answer on the front card (chips, the primary action) sends it on after its own handler runs.
  const onFrontClick = (e) => {
    const b = e.target.closest('button, a');
    if (!b || !e.currentTarget.contains(b) || b.closest(STAYS)) return;
    window.setTimeout(() => dismiss(front?.key), 0);
  };
  // Swipe up (optional; the buttons always work). Not started from a control.
  const onDown = (e) => { if (e.target.closest('button, a, input, select, textarea')) return; drag.current = { y: e.clientY, id: e.pointerId }; };
  const onMove = (e) => { if (!drag.current || drag.current.id !== e.pointerId) return; setDy(Math.min(0, e.clientY - drag.current.y)); };
  const onUp = () => { if (!drag.current) return; drag.current = null; if (dy < -60) dismiss(front?.key); else setDy(0); };

  if (!total) return null;

  if (all) {
    return (
      <div className="ay-fdeck is-all">
        <ul className="ay-today__list is-compact ay-fdeck__list" aria-label={label}>{items.map((it) => it.node)}</ul>
        <div className="ay-fdeck__bar">
          <span className="ay-fdeck__count">{total} for today</span>
          <button type="button" className="ay-fdeck__text" onClick={() => setAll(false)}>Stack them</button>
        </div>
      </div>
    );
  }

  return (
    <div className="ay-fdeck">
      <p className="sr-only" aria-live="polite">{say}</p>
      {front ? (
        <div className="ay-fdeck__stack">
          {/* The passes behind: one line each, tap to bring it to the front. */}
          {behind.length > 0 && (
            <ul className="ay-fdeck__strips" aria-label={`Also for today (${behind.length})`}>
              {/* One colour rule (review, Oct 26): the passes are the butter surface; only the front card, the one for now, is pink. */}
              {behind.map((it) => (
                <li key={it.key}>
                  <button type="button" className="ay-fdeck__strip" onClick={() => bringForward(it)} aria-label={`Open: ${it.title}`}>
                    <span className="ay-fdeck__stitle" aria-hidden="true">{it.title}</span>
                    <svg className="ay-fdeck__sgo" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 15 6-6 6 6" /></svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {/* The front card, in full. */}
          <ul
            key={`${front.key}-${entered}`}
            className={`ay-today__list is-compact ay-fdeck__list ay-fdeck__top is-pink${leaving === front.key ? ' is-leaving' : ''}${behind.length ? ' has-strips' : ''}`}
            aria-label={`${label}: ${front.title}`}
            style={dy ? { transform: `translateY(${dy}px)`, transition: 'none' } : undefined}
            onClickCapture={onFrontClick}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          >
            {front.node}
          </ul>
        </div>
      ) : (
        <div className="ay-fdeck__done" role="status">
          <span className="ay-fdeck__tick" aria-hidden="true"><svg viewBox="0 0 24 24"><path d={CHECK} /></svg></span>
          <b>{doneText}</b>
          <button type="button" className="ay-fdeck__text" onClick={reset}>See them again</button>
        </div>
      )}
      {front && (
        <div className="ay-fdeck__bar">
          <button type="button" className="ay-fdeck__btn" onClick={() => dismiss(front.key)} aria-label={behind.length ? `Later. Next: ${behind[0].title}` : 'Later'}>Later<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6" /></svg></button>
          <button type="button" className="ay-fdeck__text" onClick={() => setAll(true)} aria-expanded="false">Show all</button>
        </div>
      )}
    </div>
  );
}
