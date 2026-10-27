import { useEffect, useMemo, useRef, useState } from 'react';
import posthog from 'posthog-js';
import CustomizeHomeSheet from './CustomizeHomeSheet.jsx';
import { Widget } from './widgets/index.jsx';
import { REGISTRY } from './widgets/registry.js';
import { effectiveLayout, resetHomeLayout, setHomeLayoutOwner, writeHomeLayout } from './homeLayout.js';
import { useHomeRemote } from './useHomeRemote.js';
import { readLog, todayKey } from '../health/dailyLog.js';
import { readTries } from '../health/outcomes.js';
import { followedTopicsFor } from '../mobile/hooks/useRundownCommunity.js';
import { liveAnnouncements } from '../data/announcements.js';
import './home-widgets.css';

/**
 * Her widgets under the fixed part of Home (app) or Today (website), and the
 * small "Edit" that opens Customize Home. Everything a widget shows comes
 * from `data` (what the screen already has) plus her log and tries on this
 * device; see widgets/index.jsx.
 *
 * data: { healthRows, healthSummary, healthConnectedCount, hormonalBC, saved: [], myProducts: [],
 *         routineSource, askHistory, readProgress, articles, newPosts, quizAnswers }
 * on:   { ask, openLog, openHealth, connect, openProduct, openSaved, openEcosystem, openRoutine,
 *         openPost, openPlaylist, openCommunity, openArticle, openDoctorPrep }
 */
export default function HomeWidgets({ surface = 'app', userId = null, data = {}, on = {}, editLabel = 'Edit', children = null, hideDefault = [] }) {
  const [owner, setOwner] = useState(userId || 'device');
  const [layout, setLayout] = useState(() => { setHomeLayoutOwner(userId); return effectiveLayout(surface, REGISTRY); });
  if (owner !== (userId || 'device')) { setHomeLayoutOwner(userId); setOwner(userId || 'device'); setLayout(effectiveLayout(surface, REGISTRY)); }
  const [open, setOpen] = useState(false);
  const before = useRef(null);
  const today = todayKey();
  const topics = useMemo(() => followedTopicsFor(userId, data.quizAnswers || null), [userId, data.quizAnswers]);
  const ids = layout.widgets.map((w) => w.id);
  const remote = useHomeRemote({ ids, open, userId, topics, hasNewPosts: Array.isArray(data.newPosts) });

  // Her log and tries change on Today; read them fresh each render (small, local).
  const ctx = {
    surface, userId, today,
    healthRows: data.healthRows || [], healthSummary: data.healthSummary || null, healthConnectedCount: data.healthConnectedCount || 0,
    hormonalBC: Boolean(data.hormonalBC), saved: data.saved || [], myProducts: data.myProducts || [], routineSource: data.routineSource || null,
    askHistory: data.askHistory || [], readProgress: data.readProgress || {}, articles: data.articles || [],
    newPosts: Array.isArray(data.newPosts) ? data.newPosts : remote.newPosts || [],
    topics, news: liveAnnouncements(undefined, today), remote,
    log: readLog(), tries: readTries({ today }),
    on,
  };

  const change = (widgets) => { writeHomeLayout(surface, widgets); setLayout({ widgets, custom: true }); };
  const reset = () => { resetHomeLayout(surface); setLayout(effectiveLayout(surface, REGISTRY)); };
  const openSheet = () => { before.current = JSON.stringify(layout.widgets); setOpen(true); };
  const closeSheet = () => {
    setOpen(false);
    const now = layout.widgets;
    if (before.current !== JSON.stringify(now)) {
      // Widget ids and sizes only: never what a widget shows.
      try { posthog.capture('home_customized', { source: surface, widgets: now.map((w) => w.id).join(','), sizes: now.map((w) => w.size).join(','), count: now.length, reset: !layout.custom }); } catch { /* analytics off */ }
    }
  };

  useEffect(() => { if (!open) before.current = null; }, [open]);

  return (
    <section className={`ay-homewidgets is-${surface}`} aria-label={surface === 'web' ? 'Your widgets' : 'Your widgets on Today'} data-count={layout.widgets.length}>
      {layout.widgets.length > 0 && (
        <div className="ay-homewidgets__grid">
          {/* A row-shaped widget alone (today's health row) keeps the full width. */}
          {layout.widgets.filter((w) => layout.custom || !hideDefault.includes(w.id)).map((w) => <div key={w.id} className={`ay-homewidgets__cell is-${w.size}${layout.widgets.length === 1 && w.id === 'health' ? ' is-wide' : ''}`}><Widget widget={w} ctx={ctx} /></div>)}
        </div>
      )}
      {/* children: the screen's own links (Home's My dashboard / Your matches) share the row with Edit. */}
      <div className={`ay-homewidgets__bar${children ? ' has-links' : ''}`}>
        {children}
        <button type="button" className="ay-homewidgets__edit" aria-haspopup="dialog" onClick={openSheet}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4l10-10-4-4L4 16v4zM14 6l4 4" /></svg>
          <span>{layout.widgets.length ? editLabel : surface === 'web' ? 'Add widgets to Home' : 'Add widgets'}</span>
          {layout.widgets.length > 0 && <span className="sr-only"> Today</span>}
        </button>
      </div>
      {open && <CustomizeHomeSheet surface={surface} widgets={layout.widgets} custom={layout.custom} onChange={change} onReset={reset} onClose={closeSheet} ctx={ctx} />}
    </section>
  );
}
