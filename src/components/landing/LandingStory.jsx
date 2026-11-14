import { useEffect, useState } from 'react';
import { motionOff } from '../../utils/motion.js';
import { countJourneyStep } from '../../utils/journeyStep.js';
import { BETA_QUOTES, LANDING_FAQ, PAINS } from './landingData.js';
import './landing-story.css';

/*
 * Nov 6 (founder: "high converting … the color and the fun separation … testimonials from the
 * focus group … FAQ"). The landing's story, in the order the high-converting guides she sent
 * use: hero → the problem in her words → how it works → picks → what testers say → proof →
 * reads → us → questions → Pro and the last ask. Each band has its own ayna colour and a
 * sticker-note detail (the scrapbook inspo), and every band ends in a way to start.
 */

const PAIN_ICONS = {
  tabs: <><rect x="3" y="6" width="14" height="12" rx="2" /><path d="M7 6V4h14v12h-4" /></>,
  stars: <><path d="m8 4 1.3 2.7 3 .4-2.2 2.1.5 3L8 10.8 5.4 12.2l.5-3L3.7 7.1l3-.4L8 4Z" /><path d="m17 11 1 2 2.2.3-1.6 1.6.4 2.2-2-1-2 1 .4-2.2-1.6-1.6L16 13l1-2Z" /></>,
  person: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /><path d="m17 4 3 3M20 4l-3 3" /></>,
};

/* ---------- the problem, from her side ----------
   Nov 6 (founder: "stop with the boxes, use more interactive things"): three pains in big type;
   picking one opens what ayna does about it. No cards, no sticky notes. */
export function Problem({ cta }) {
  const [on, setOn] = useState(0);
  return (
    <section className="lb-sec t-pink ls-pain" aria-labelledby="ls-pain-h">
      <div className="lb-wrap ls-pain__in">
        <div className="ls-pain__side">
          <p className="ls-kick">Sound familiar?</p>
          <h2 id="ls-pain-h" className="lb-h2 ls-h">You’ve done the research. Putting it together is still on you.</h2>
          <p className="ls-pain__lede">ayna connects what you tell us about your body to products and care that fit, and shows you why.</p>
          {cta && <span className="ls-fix__act"><button type="button" className="ls-btn" onClick={cta.go}>{cta.label}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" /></svg></button></span>}
        </div>
        <ul className="ls-pains">
          {PAINS.map((p, i) => {
            const open = on === i;
            return (
              <li key={p.t} className={open ? 'is-on' : ''}>
                <button type="button" aria-expanded={open} aria-controls={`ls-pain-${i}`} onClick={() => setOn(i)}>
                  <span className="ls-ic" aria-hidden="true"><svg viewBox="0 0 24 24">{PAIN_ICONS[p.icon]}</svg></span>
                  <span className="ls-pains__t"><strong>{p.t}</strong><small>{p.d}</small></span>
                </button>
                <div id={`ls-pain-${i}`} className="ls-pains__fix" hidden={!open}>
                  <p><b>With ayna</b>{p.fix}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ---------- what beta testers say ----------
   Nov 6: one quote at a time, big, moving on by itself every 6 seconds (still under reduced
   motion); the dots pick one. No quote boxes. */
export function Testimonials({ cta }) {
  const [i, setI] = useState(0);
  const [held, setHeld] = useState(false);
  useEffect(() => {
    if (held || motionOff?.()) return undefined;
    const t = window.setTimeout(() => setI((n) => (n + 1) % BETA_QUOTES.length), 6000);
    return () => window.clearTimeout(t);
  }, [i, held]);
  const x = BETA_QUOTES[i];
  return (
    <section className="lb-sec t-ink ls-love" aria-labelledby="ls-love-h" onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)} onFocus={() => setHeld(true)}>
      <div className="lb-wrap ls-love__in">
        <p className="ls-kick is-pink">From our weekly focus group</p>
        <h2 id="ls-love-h" className="ls-love__h">What beta testers say</h2>
        <figure className="ls-big" aria-live="polite">
          <blockquote key={i} className="ls-big__q"><p>“{x.q}”</p></blockquote>
          <figcaption>Beta tester</figcaption>
        </figure>
        <div className="ls-dots" role="group" aria-label="Choose a quote">
          {BETA_QUOTES.map((q, n) => <button key={q.q} type="button" aria-label={`Quote ${n + 1} of ${BETA_QUOTES.length}`} aria-pressed={n === i} onClick={() => { setI(n); setHeld(true); }} />)}
        </div>
        {cta && <div className="ls-center"><button type="button" className="ls-btn is-butter" onClick={cta.go}>{cta.label}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" /></svg></button></div>}
      </div>
    </section>
  );
}

/* ---------- questions she has before starting ---------- */
export function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section className="lb-sec t-pink ls-faq" aria-labelledby="ls-faq-h">
      <div className="lb-wrap ls-faq__in">
        <div className="ls-faq__side">
          <p className="ls-kick">Before you start</p>
          <h2 id="ls-faq-h" className="lb-h2 ls-h">Questions, answered</h2>
          <p className="ls-faq__more">Something else? <a href="/contact" onClick={() => countJourneyStep('cta_faq_ask_us')}>Ask us</a></p>
        </div>
        <ul className="ls-faq__list">
          {LANDING_FAQ.map((f, i) => {
            const on = open === i;
            return (
              <li key={f.q} className={on ? 'is-on' : ''}>
                <h3><button type="button" aria-expanded={on} aria-controls={`ls-faq-${i}`} onClick={() => setOpen(on ? -1 : i)}><span>{f.q}</span><i aria-hidden="true" /></button></h3>
                <div id={`ls-faq-${i}`} className="ls-faq__a" hidden={!on}><p>{f.a}</p></div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
