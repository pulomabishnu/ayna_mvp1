import { useState } from 'react';
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

/** One line under every main button: what it costs her (nothing) and how long it takes. */
export function CtaNote({ className = '' }) {
  return <p className={`ls-note ${className}`.trim()}>Free · about 1 minute · no card needed</p>;
}

/* ---------- the problem, from her side ---------- */
export function Problem({ cta }) {
  return (
    <section className="lb-sec t-pink ls-pain" aria-labelledby="ls-pain-h">
      <div className="lb-wrap">
        <p className="ls-kick">Sound familiar?</p>
        <h2 id="ls-pain-h" className="lb-h2 ls-h">Shopping for your health shouldn’t feel like homework.</h2>
        <ul className="ls-notes">
          {PAINS.map((p, i) => (
            <li key={p.t} className={`ls-sticky is-${i % 2 ? 'ink' : 'butter'}`} style={{ '--r': `${[-2.5, 1.8, -1.2][i]}deg` }}>
              <span className="ls-tape" aria-hidden="true" />
              <span className="ls-ic" aria-hidden="true"><svg viewBox="0 0 24 24">{PAIN_ICONS[p.icon]}</svg></span>
              <strong>{p.t}</strong>
              <span>{p.d}</span>
            </li>
          ))}
        </ul>
        <div className="ls-fix">
          <p className="ls-fix__p"><b>ayna fixes that.</b> One quiz, then products and care that fit your body, each with a % and the reason why.</p>
          {cta && <span className="ls-fix__act"><button type="button" className="ls-btn" onClick={cta.go}>{cta.label}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" /></svg></button><CtaNote /></span>}
        </div>
      </div>
    </section>
  );
}

/* ---------- what beta testers say ---------- */
export function Testimonials({ cta }) {
  return (
    <section className="lb-sec t-ink ls-love" aria-labelledby="ls-love-h">
      <div className="lb-wrap">
        <p className="ls-kick is-pink">From our weekly focus group</p>
        <h2 id="ls-love-h" className="lb-h2 ls-h">What beta testers say</h2>
        <ul className="ls-quotes">
          {BETA_QUOTES.map((x, i) => (
            <li key={x.q} className={`ls-quote is-${x.tone}`} style={{ '--r': `${[-2, 1.5, -1, 2.2][i]}deg` }}>
              <span className="ls-mark" aria-hidden="true">“</span>
              <blockquote><p>{x.q}</p></blockquote>
              <span className="ls-by">Beta tester</span>
            </li>
          ))}
        </ul>
        {cta && <div className="ls-center"><button type="button" className="ls-btn is-butter" onClick={cta.go}>{cta.label}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" /></svg></button><CtaNote className="is-light" /></div>}
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
          <p className="ls-faq__more">Something else? <a href="/contact">Ask us</a></p>
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
