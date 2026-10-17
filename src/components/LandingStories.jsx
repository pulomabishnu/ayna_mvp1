import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getDailyFact } from '../data/welcomeSlides.js';
import { getSupabaseClient } from '../utils/supabaseClient';
import { listAnnouncements } from '../utils/community/announcementsStore';
import { ALL_PRODUCTS } from '../data/products';

/**
 * "On ayna" slideshow: ayna news, today's fact, what ayna does, Community.
 * Photo-led like the rest of the landing, one fixed height so nothing below
 * moves, the same font on every tab, and changing slides never scrolls the
 * page. It advances on its own, stops on hover or focus, and follows
 * the site's one motion switch (footer "Pause motion") and reduced motion.
 */

// Advances on its own (Oct 16: Ameera asked for it, not too slow); stops on hover, focus, Pause motion or reduced motion.
const DURATION = 5000;

// Three real period products for the little shelf widget (photos on white).
const SHELF = (() => {
  const want = ['tampon', 'pad', 'cup'];
  return want.map((c) => ALL_PRODUCTS.find((p) => p.category === c && p.image && /^https?:|^\//.test(p.image))).filter(Boolean);
})();

function useLatestAnnouncement() {
  const [item, setItem] = useState(null);
  useEffect(() => {
    let live = true;
    const supabase = getSupabaseClient();
    if (!supabase) return undefined;
    listAnnouncements(supabase, { limit: 1 })
      .then(({ rows }) => { const a = rows?.[0]; if (live && a?.title) setItem({ title: String(a.title).slice(0, 120), body: String(a.body || '').slice(0, 200) }); })
      .catch(() => {});
    return () => { live = false; };
  }, []);
  return item;
}

export default function LandingStories({ paused = false, onStartQuiz, onViewArticles, onViewCommunity }) {
  const fact = useMemo(() => getDailyFact(), []);
  const news = useLatestAnnouncement();
  const slides = useMemo(() => [
    news
      ? { key: 'news', tab: 'ayna news', tone: 'rose', kicker: 'ayna news', title: news.title, body: news.body, cta: 'Read it in Community', go: onViewCommunity, img: '/landing/curlers-call.webp', alt: 'A woman in hair curlers laughing on the phone in her bathroom' }
      : { key: 'news', tab: 'ayna news', tone: 'rose', kicker: 'ayna news', title: 'ayna Community is open.', body: 'Ask questions, review what you use and share playlists with women who get it.', cta: 'See Community', go: onViewCommunity, img: '/landing/stalls-trio.webp', alt: 'Three friends chatting from neighboring bathroom stalls' },
    ...(fact ? [{ key: 'fact', tab: 'Word of the day', tone: 'butter', kicker: 'Word of the day', title: 'One health word, in plain English.', body: 'A new term from the ayna glossary every day.', cta: 'Read more in the Library', go: onViewArticles, visual: 'glossary', term: fact.term, def: fact.text }] : []),
    { key: 'about', tab: 'What ayna does', tone: 'sky', kicker: 'What ayna does', title: 'Health, matched to you.', body: 'Answer six questions. See the products that fit your body, with the research and real reviews beside each one.', cta: 'See my matches', go: onStartQuiz, visual: 'shelf' },
    { key: 'community', tab: 'Real reviews', tone: 'ink', kicker: 'Community', title: 'Real talk about what women actually use.', body: 'Reviews, questions and routines from the ayna community, in one place.', cta: 'Read reviews', go: onViewCommunity, img: '/landing/story-reviews-phones.webp', alt: 'Friends in a circle looking down at their phones, blue sky above' },
  ], [fact, news, onStartQuiz, onViewArticles, onViewCommunity]);

  const [i, setI] = useState(0);
  const [hold, setHold] = useState(false);
  const [progress, setProgress] = useState(0);
  const [reduced] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  const rootRef = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const playing = !paused && !hold && !reduced && inView;
  const n = slides.length;
  const go = (k) => { setI(((k % n) + n) % n); setProgress(0); };
  useEffect(() => {
    if (!playing) return undefined;
    const start = performance.now() - progress * DURATION;
    let raf = 0;
    const tick = (t) => {
      const p = (t - start) / DURATION;
      if (p >= 1) { setI((v) => (v + 1) % n); setProgress(0); return; }
      setProgress(p);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, i, n]); // eslint-disable-line react-hooks/exhaustive-deps
  const s = slides[Math.min(i, n - 1)];
  const onKey = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(i + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(i - 1); }
  };

  return (
    <div className={`lst-band is-${s.tone}`}>
    <h2 className="lst-band__h">What’s new <em>on ayna</em></h2>
    <section ref={rootRef} className={`lst lst--open is-${s.tone}`} aria-roledescription="carousel" aria-label="On ayna" onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)} onFocus={() => setHold(true)} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setHold(false); }} onKeyDown={onKey}>
      <div className="lst__tabs" role="tablist" aria-label="Stories">
        {slides.map((x, k) => (
          <button key={x.key} type="button" role="tab" aria-selected={k === i} aria-controls="lst-slide" className={k === i ? 'is-on' : ''} onClick={() => go(k)}>
            <span>{x.tab}</span>
            <i aria-hidden="true"><b style={{ width: k === i ? `${(playing || progress ? progress : 0) * 100}%` : k < i ? '100%' : '0%' }} /></i>
          </button>
        ))}
      </div>
      <div id="lst-slide" className="lst__slide" role="tabpanel" aria-roledescription="slide" aria-label={`${i + 1} of ${n}: ${s.tab}`} key={s.key}>
        <div className="lst__copy">
          <p className="lst__kicker">{s.kicker}</p>
          <h3 className="lst__title">{s.title}</h3>
          {s.body && <p className="lst__body">{s.body}</p>}
          {s.note && <p className="lst__note">{s.note}</p>}
          {s.go && <button type="button" className="lst__cta" onClick={s.go}>{s.cta} <span aria-hidden="true">→</span></button>}
        </div>
        {s.visual === 'glossary' ? (
          <div className="lst__widget lst__widget--word">
            <span className="lst__burst" aria-hidden="true">word of<br />the day</span>
            <strong>{s.term}</strong>
            <p>{s.def}</p>
            <small>From the ayna glossary. General information, not medical advice.</small>
          </div>
        ) : s.visual === 'shelf' && SHELF.length >= 2 ? (
          <div className="lst__widget lst__widget--shelf" aria-hidden="true">
            <span className="lst__widget-tab">Your shelf</span>
            <ul>{SHELF.map((p) => <li key={p.id}><img src={p.image} alt="" loading="lazy" /><span>{p.brand || p.name}</span></li>)}</ul>
            <i className="lst__ledge" />
            <span className="lst__burst lst__burst--sky">matched<br />to you</span>
          </div>
        ) : (
          <figure className="lst__photo"><img src={s.img || '/landing/blue-sink.webp'} alt={s.alt || ''} loading="lazy" /></figure>
        )}
      </div>
      <div className="lst__nav">
        <button type="button" onClick={() => go(i - 1)} aria-label="Previous story">←</button>
        <span>{i + 1} / {n}</span>
        <button type="button" onClick={() => go(i + 1)} aria-label="Next story">→</button>
      </div>
    </section>
    </div>
  );
}
