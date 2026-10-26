import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { onboardingJustFinished } from '../../health/onboardingSignal.js';
import { readRundownMemory } from '../../components/rundown/rundownStore.js';
import { tourDecision, tipsToShow, rundownSettled, screensFor, avoidFor } from './tips.js';
import { readTour, setTourOwner, setTipsEnabled, markScreenSeen, markWelcomeOffered, markOffNoteShown } from './tourStore.js';
import { topDialog, usableAnchor, currentScreen, visibleAvoidRects, placeBubble, EDGE } from './tourDom.js';
import './tutorial.css';
import { localDayKey } from '../../utils/localDate.js';

/**
 * The one overlay for tips (TUTORIAL_RESEARCH.md). It reads the screen from
 * the page (data-tour roots and anchors, src/mobile/tutorial/tips.js), so the
 * screens only carry attributes:
 *   - Home, after setup and once the Daily Rundown has had its chance: a small
 *     welcome card, "Show me tips" / "No thanks".
 *   - Then the first visit to each main screen: 1 to 3 coach marks (spotlight
 *     + bubble, Next / Got it, step dots, "Turn off tips").
 * Tapping outside closes (the tap still reaches the page), Escape closes,
 * focus stays in the bubble and goes back after, reduced motion = no motion.
 * Portaled to <body> so a sheet's inert never reaches it.
 *
 * `surface`: 'app' (src/mobile, the default) or 'web' (src/App.jsx). The web
 * reads its own screens (tips.js WEB_SCREENS) off `.app-container`, keeps
 * bubbles clear of the top nav, and on desktop puts them beside the anchor.
 * `ready` (web): setup is done; before that nothing shows.
 */
const ONBOARDING = new Set(['landing', 'quiz', 'building', 'reveal', 'signin', 'checkin', 'connect', 'plan', 'ready']);
// Website views that are setup or the landing pages, never a tip.
const WEB_SETUP = new Set(['welcome', 'hero', 'quiz', 'profile-edit']);
const visibleBottomOf = (el) => { if (!el) return 0; const r = el.getBoundingClientRect(); return r.height > 0 && r.bottom > 0 ? Math.max(0, r.bottom) : 0; };
const SURFACES = {
  app: {
    host: '.ayna-mobile',
    themeOf: (host) => (host?.dataset.theme === 'dark' ? 'dark' : host?.dataset.theme ? 'light' : null),
    onboarding: (host) => ONBOARDING.has(host?.dataset.screen || ''),
    topInset: () => 0,
    bottomInset: () => { const bar = document.querySelector('.ayna-mobile .ayna-bottom-nav'); return bar ? Math.max(0, window.innerHeight - bar.getBoundingClientRect().top) : 0; },
    beside: () => false,
    busy: () => false,
  },
  web: {
    host: '.app-container',
    themeOf: (host) => (/dark/.test(host?.dataset.theme || '') ? 'dark' : host ? 'light' : null),
    onboarding: (host, ready) => !ready || WEB_SETUP.has(host?.dataset.view || ''),
    // The header slides away on scroll down; while it shows, nothing goes under it.
    topInset: () => { const nav = document.querySelector('.app-nav-wrap'); return nav && !nav.classList.contains('is-away') ? visibleBottomOf(nav) : 0; },
    bottomInset: () => { const bar = document.querySelector('.app-container nav.ay-tabbar--main'); if (!bar || !bar.getClientRects().length) return 0; const top = bar.getBoundingClientRect().top; return top > 0 && top < window.innerHeight ? window.innerHeight - top : 0; },
    beside: () => window.innerWidth >= 900,
    // The floating Ask panel, the auth modal and the wrapped story are hers to finish first.
    busy: () => Boolean(document.querySelector('.ayna-ask-panel:not(.is-page), .ayna-ask-scrim, .ay-auth-overlay, .wwr')),
  },
};
// Same local day string as the Rundown memory uses.
const localToday = (d = new Date()) => localDayKey(d);
const POLL_MS = 450;
const STABLE_POLLS = 2;

const reduceMotion = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };

export default function TutorialLayer({ userId = null, surface = 'app', ready = true }) {
  const cfg = SURFACES[surface] || SURFACES.app;
  const screens = screensFor(surface);
  const avoid = avoidFor(surface);
  const readyRef = useRef(ready);
  useLayoutEffect(() => { readyRef.current = ready; }, [ready]);
  const [run, setRun] = useState(null); // { kind: 'welcome' } | { kind: 'tips', screenId, tips, index }
  const [geo, setGeo] = useState(null);
  const [theme, setTheme] = useState('light');
  const bubbleRef = useRef(null);
  const openerRef = useRef(null);
  const pendingRef = useRef({ key: '', count: 0 });
  const homeSinceRef = useRef(0);
  const runRef = useRef(null);
  useLayoutEffect(() => { runRef.current = run; }, [run]);

  // Seen state is per person: switch owner before the next check reads it.
  useEffect(() => { setTourOwner(userId); }, [userId]);

  const end = useCallback((how = 'done') => {
    const r = runRef.current;
    if (!r) return;
    if (r.kind === 'tips') {
      markScreenSeen(r.screenId);
      if (r.tips.some((t) => t.offNote)) markOffNoteShown();
      if (how === 'off') setTipsEnabled(false);
    } else if (how === 'yes') setTipsEnabled(true);
    else if (how === 'no') setTipsEnabled(false);
    setRun(null);
    setGeo(null);
    pendingRef.current = { key: '', count: 0 };
    const back = openerRef.current;
    openerRef.current = null;
    try { if (back?.isConnected && how !== 'outside') back.focus({ preventScroll: true }); } catch { /* gone */ }
  }, []);

  // Watch the page: which screen, what the decision is, open once it's stable.
  useEffect(() => {
    const tick = () => {
      const host = document.querySelector(cfg.host);
      const th = cfg.themeOf(host);
      if (th) setTheme(th);
      if (runRef.current || document.visibilityState === 'hidden') return;
      const dialog = topDialog();
      const screen = currentScreen(dialog, screens);
      const today = localToday();
      const now = new Date();
      if (screen?.welcome) { if (!homeSinceRef.current) homeSinceRef.current = Date.now(); } else homeSinceRef.current = 0;
      const p = readTour();
      const decision = tourDecision({
        screen, prefs: p, today,
        onboarding: cfg.onboarding(host, readyRef.current),
        rundownOpen: Boolean(document.querySelector('.ay-rd')),
        foreignDialog: Boolean(dialog && !screen) || cfg.busy(),
        settled: rundownSettled({ memory: readRundownMemory(), today, now, justOnboarded: onboardingJustFinished({ hours: 12 }), settledMs: homeSinceRef.current ? Date.now() - homeSinceRef.current : 0 }),
      });
      const key = decision.kind === 'none' ? '' : `${decision.kind}:${decision.screen?.id || ''}`;
      const pending = pendingRef.current;
      pendingRef.current = key === pending.key ? { key, count: pending.count + 1 } : { key, count: 1 };
      if (!key || pendingRef.current.count < STABLE_POLLS) return;
      if (decision.kind === 'welcome') {
        markWelcomeOffered(today);
        openerRef.current = document.activeElement;
        setRun({ kind: 'welcome' });
        return;
      }
      const insets = { topInset: cfg.topInset(), bottomInset: cfg.bottomInset() };
      const tips = tipsToShow(decision.screen, (sel) => Boolean(usableAnchor(sel, { dialog, avoid, ...insets })), { offNoteShown: p.offNoteShown });
      if (!tips.length) return; // try again on a later visit
      openerRef.current = document.activeElement;
      setRun({ kind: 'tips', screenId: decision.screen.id, tips, index: 0 });
    };
    const id = window.setInterval(tick, POLL_MS);
    return () => window.clearInterval(id);
  }, [cfg, screens, avoid]);

  // Follow the anchor while a tip is open (scroll, resize, layout changes).
  const tip = run?.kind === 'tips' ? run.tips[run.index] : null;
  useLayoutEffect(() => {
    if (!tip) return undefined;
    let raf = 0;
    let last = '';
    const frame = () => {
      const el = usableAnchor(tip.anchor, { avoid });
      if (!el) {
        // The anchor went away: skip to the next one that's still there, or finish.
        const r = runRef.current;
        const nextIndex = r.tips.findIndex((t, i) => i > r.index && usableAnchor(t.anchor, { avoid }));
        if (nextIndex > 0) setRun({ ...r, index: nextIndex }); else end('done');
        return;
      }
      const a = el.getBoundingClientRect();
      const b = bubbleRef.current?.getBoundingClientRect();
      const holes = visibleAvoidRects(avoid);
      const place = placeBubble(a, { w: b?.width || Math.min(320, window.innerWidth - 2 * EDGE), h: b?.height || 170 }, { vw: window.innerWidth, vh: window.innerHeight, avoid: holes, bottomInset: cfg.bottomInset(), topInset: cfg.topInset(), beside: cfg.beside() });
      const next = { anchor: { left: a.left, top: a.top, width: a.width, height: a.height }, holes: holes.map((r) => ({ left: r.left, top: r.top, width: r.width, height: r.height })), ...place };
      const sig = JSON.stringify(next);
      if (sig !== last) { last = sig; setGeo(next); }
      raf = window.requestAnimationFrame(frame);
    };
    frame();
    return () => window.cancelAnimationFrame(raf);
  }, [tip, end, cfg, avoid]);

  // Focus in, trap Tab, Escape closes, a tap outside closes (and still reaches the page).
  useEffect(() => {
    if (!run) return undefined;
    const t = window.setTimeout(() => bubbleRef.current?.querySelector('[data-primary]')?.focus({ preventScroll: true }), 30);
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); end('escape'); return; }
      if (e.key !== 'Tab') return;
      e.stopPropagation();
      const nodes = [...(bubbleRef.current?.querySelectorAll('button') || [])];
      if (!nodes.length) return;
      const i = nodes.indexOf(document.activeElement);
      e.preventDefault();
      const next = e.shiftKey ? (i <= 0 ? nodes.length - 1 : i - 1) : (i === -1 || i === nodes.length - 1 ? 0 : i + 1);
      nodes[next].focus();
    };
    const onDown = (e) => { if (!bubbleRef.current?.contains(e.target)) end('outside'); };
    window.addEventListener('keydown', onKey, true);
    document.addEventListener('pointerdown', onDown, true);
    return () => { window.clearTimeout(t); window.removeEventListener('keydown', onKey, true); document.removeEventListener('pointerdown', onDown, true); };
  }, [run, end]);

  if (!run) return null;
  const still = reduceMotion();
  const cls = `ay-tour is-${surface}${still ? ' is-still' : ''}`;

  if (run.kind === 'welcome') {
    return createPortal(
      <div className={cls} data-theme={theme}>
        <div className="ay-tour__dim is-soft" aria-hidden="true" />
        <section ref={bubbleRef} className="ay-tour__card ay-tour__welcome" style={surface === 'web' ? { bottom: cfg.bottomInset() + 24 } : undefined} role="dialog" aria-modal="true" aria-labelledby="ay-tour-w-h" aria-describedby="ay-tour-w-p">
          <span className="ay-tour__mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7z" /></svg></span>
          <h2 id="ay-tour-w-h">Want a quick tour?</h2>
          <p id="ay-tour-w-p">Tips show up the first time you open each page.</p>
          <div className="ay-tour__actions">
            <button type="button" className="ay-tour__ghost" onClick={() => end('no')}>No thanks</button>
            <button type="button" className="ay-tour__go" data-primary onClick={() => end('yes')}>Show me tips</button>
          </div>
        </section>
      </div>,
      document.body,
    );
  }

  const total = run.tips.length;
  const last = run.index === total - 1;
  const g = geo;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 390;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 844;
  const pad = 6;
  return createPortal(
    <div className={cls} data-theme={theme}>
      {g && <svg className="ay-tour__dim" width={vw} height={vh} aria-hidden="true">
        <defs><mask id="ay-tour-mask">
          <rect width={vw} height={vh} fill="white" />
          <rect x={g.anchor.left - pad} y={g.anchor.top - pad} width={g.anchor.width + 2 * pad} height={g.anchor.height + 2 * pad} rx="16" fill="black" />
          {g.holes.map((r, i) => <rect key={i} x={r.left} y={r.top} width={r.width} height={r.height} rx="12" fill="black" />)}
        </mask></defs>
        <rect width={vw} height={vh} mask="url(#ay-tour-mask)" className="ay-tour__shade" />
      </svg>}
      {g && <div className="ay-tour__ring" aria-hidden="true" style={{ left: g.anchor.left - pad, top: g.anchor.top - pad, width: g.anchor.width + 2 * pad, height: g.anchor.height + 2 * pad }} />}
      <section
        ref={bubbleRef}
        key={tip.id}
        className={`ay-tour__card ay-tour__tip is-${g?.side || 'below'}`}
        style={g ? { left: g.left, top: g.top, '--ay-tour-arrow': `${g.arrow}px`, '--ay-tour-arrow-y': `${g.arrowY}px` } : { visibility: 'hidden', left: EDGE, top: EDGE }}
        role="dialog" aria-modal="true" aria-labelledby={`ay-tour-${tip.id}-h`} aria-describedby={tip.offNote ? `ay-tour-${tip.id}-p` : undefined}
        data-tip={tip.id}
      >
        {total > 1 && <p className="ay-tour__dots" aria-label={`Tip ${run.index + 1} of ${total}`}>{run.tips.map((t, i) => <i key={t.id} className={i === run.index ? 'is-on' : ''} aria-hidden="true" />)}</p>}
        <p id={`ay-tour-${tip.id}-h`} className="ay-tour__text">{tip.text}</p>
        {tip.offNote && <p id={`ay-tour-${tip.id}-p`} className="ay-tour__off-note">{tip.offNote}</p>}
        <div className="ay-tour__actions">
          <button type="button" className="ay-tour__link" onClick={() => end('off')}>Turn off tips</button>
          <button type="button" className="ay-tour__go" data-primary onClick={() => (last ? end('done') : setRun({ ...run, index: run.index + 1 }))}>{last ? 'Got it' : 'Next'}</button>
        </div>
      </section>
      <p className="sr-only" aria-live="polite">{`Tip ${run.index + 1} of ${total}. ${tip.text}`}</p>
    </div>,
    document.body,
  );
}
