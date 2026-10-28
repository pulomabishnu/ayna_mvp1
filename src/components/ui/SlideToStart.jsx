import { useRef, useState } from 'react';
import { motionOff } from '../../utils/motion.js';
import './slide-to-start.css';

/**
 * Slide to start (founder, Oct 27 01:10): a big pill with a pink thumb you
 * drag to the end. Sliding is optional: the whole pill is one real <button>,
 * so a tap, a click, Enter or Space starts it too, and screen readers hear
 * one clear action ("Get my matches"). The "or tap to start" hint is always
 * visible. Under reduced motion the thumb does not glide.
 *
 *   <SlideToStart label="Slide to get your matches" onComplete={start} />
 *
 * tone: 'butter' (a butter pill, for espresso bands) | 'ink' (an espresso
 * pill, for butter pages). size: 'md' | 'lg' (the landing's hero action:
 * taller, a bigger knob and label, the pink sticker shadow).
 */
const THUMB = 56;
const PAD = 6;
const DONE_AT = 0.7;

export default function SlideToStart({ label = 'Slide to get your matches', actionLabel = 'Get my matches', hint = 'or tap to start', onComplete, tone = 'butter', size = 'md', className = '', id, tour }) {
  const trackRef = useRef(null);
  const thumbRef = useRef(null);
  const drag = useRef({ on: false, x0: 0, moved: false, done: false });
  const [pos, setPos] = useState({ x: 0, p: 0 });
  const setX = (x) => { const t = travel(); setPos({ x, p: t ? Math.min(1, x / t) : 0 }); };
  const [dragging, setDragging] = useState(false);
  const [finished, setFinished] = useState(false);

  // How far the thumb can go: the track's inner width less the thumb (sizes come from the CSS).
  const travel = () => {
    const track = trackRef.current; const thumb = thumbRef.current;
    if (!track) return 0;
    const w = thumb?.offsetWidth || THUMB; const pad = thumb ? thumb.offsetLeft : PAD;
    return Math.max(0, track.clientWidth - w - pad * 2);
  };
  const finish = () => {
    if (drag.current.done) return;
    drag.current.done = true;
    setFinished(true);
    setX(travel());
    // Let the thumb arrive (180ms) before the next screen takes over.
    const wait = motionOff() ? 0 : 180;
    window.setTimeout(() => { onComplete?.(); drag.current.done = false; setFinished(false); setX(0); }, wait);
  };

  const onPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    drag.current = { ...drag.current, on: true, x0: e.clientX, moved: false };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* old browser */ }
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d.on) return;
    const dx = e.clientX - d.x0;
    if (!d.moved && Math.abs(dx) < 6) return;
    if (!d.moved) { d.moved = true; setDragging(true); }
    setX(Math.max(0, Math.min(travel(), dx)));
  };
  const onPointerUp = (e) => {
    const d = drag.current;
    if (!d.on) return;
    d.on = false;
    setDragging(false);
    if (!d.moved) return; // a tap: the click handler starts it
    const dx = Math.max(0, Math.min(travel(), e.clientX - d.x0));
    if (travel() && dx >= travel() * DONE_AT) finish();
    else setX(0);
  };
  const onPointerCancel = () => { drag.current.on = false; setDragging(false); setX(0); };
  const onClick = () => {
    // The click that ends a drag is not a tap.
    if (drag.current.moved) { drag.current.moved = false; return; }
    finish();
  };

  return (
    <div className={`ay-sts is-${tone}${size === 'lg' ? ' is-lg' : ''}${className ? ` ${className}` : ''}`} id={id} data-tour={tour}>
      <button
        ref={trackRef}
        type="button"
        className={`ay-sts__track${dragging ? ' is-dragging' : ''}${finished ? ' is-done' : ''}`}
        aria-label={`${actionLabel}. Slide or tap to start.`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onClick={onClick}
        style={{ '--ay-sts-x': `${pos.x}px`, '--ay-sts-p': pos.p.toFixed(3) }}
      >
        <span className="ay-sts__fill" aria-hidden="true" />
        <span className="ay-sts__label" aria-hidden="true">{label}<svg viewBox="0 0 24 24"><path d="M5 12h13M13 6l6 6-6 6" /></svg></span>
        <span className="ay-sts__thumb" aria-hidden="true" ref={thumbRef}>
          <span className="ay-sts__knob"><svg viewBox="0 0 24 24"><path d="M5 12h13M13 6l6 6-6 6" /></svg></span>
        </span>
      </button>
      {hint && <p className="ay-sts__hint" aria-hidden="true">{hint}</p>}
    </div>
  );
}
