import { useEffect, useRef, useState } from 'react';
import './how-it-works-demo.css';

/**
 * "How ayna works" (founder, Nov 4: "a demo video"). A real screen recording of ayna on a
 * phone: the landing page, Sign up free, the quiz, the 3 safety questions and the matches,
 * with captions in it. 47 seconds, no sound, 1.5 MB (public/videos/ayna-demo.mp4, made with
 * scripts/record-demo.cjs + ffmpeg). It plays muted when it scrolls into view and pauses when it
 * leaves; the three chapters jump to that part. Reduced motion: it doesn't autoplay.
 */
const CHAPTERS = [
  { t: 0, label: 'Answer a few questions', d: 'What you want help with. About a minute.' },
  { t: 26.5, label: '3 safety questions', d: 'Conditions, allergies and medicines, before any match.' },
  { t: 38, label: 'See your matches', d: 'What fits you and why. Save them free.' },
];

const motionOff = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return true; }
};

export default function HowItWorksDemo({ onStart, startLabel = 'Sign up free', onViewHowItWorks }) {
  const box = useRef(null);
  const vid = useRef(null);
  const [now, setNow] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = box.current; const v = vid.current;
    if (!el || !v || typeof IntersectionObserver === 'undefined' || motionOff()) return undefined;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) v.play().catch(() => {}); else v.pause();
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const at = CHAPTERS.reduce((a, c, i) => (now >= c.t ? i : a), 0);
  const jump = (t) => { const v = vid.current; if (!v) return; v.currentTime = t; v.play().catch(() => {}); };
  const toggle = () => { const v = vid.current; if (!v) return; if (v.paused) v.play().catch(() => {}); else v.pause(); };

  return (
    <section id="ay-demo" ref={box} className="hd hd--video" aria-labelledby="hd-title">
      <div className="hd-v">
        <div className="hd-v__copy">
          <h2 id="hd-title" className="hd-title">See how ayna works</h2>
          <p className="hd-v__sub">A real 45-second run through the app.</p>
          <ol className="hd-v__ch">
            {CHAPTERS.map((c, i) => (
              <li key={c.label}>
                <button type="button" className={i === at ? 'is-on' : ''} aria-current={i === at ? 'step' : undefined} onClick={() => jump(c.t)}>
                  <span className="hd-n">{i + 1}</span>
                  <span><b>{c.label}</b><small>{c.d}</small></span>
                </button>
              </li>
            ))}
          </ol>
          <div className="hd-actions">
            {onStart && <button type="button" className="hd-start" onClick={onStart}>{startLabel}</button>}
            {onViewHowItWorks && <a className="hd-more" href="/how-it-works" onClick={(e) => { e.preventDefault(); onViewHowItWorks(); }}>How we match</a>}
          </div>
        </div>
        <div className="hd-v__stage">
          <div className="hd-v__phone">
            <video ref={vid} src="/videos/ayna-demo.mp4" poster="/videos/ayna-demo-poster.jpg" muted playsInline loop preload="metadata"
              aria-label="Screen recording: signing up, answering the quiz and the safety questions, and seeing matches on ayna"
              onTimeUpdate={(e) => setNow(e.currentTarget.currentTime)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onClick={toggle} />
            <button type="button" className={`hd-v__play${playing ? ' is-playing' : ''}`} onClick={toggle} aria-label={playing ? 'Pause the video' : 'Play the video'}>
              {playing ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7L8 5Z" /></svg>}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
