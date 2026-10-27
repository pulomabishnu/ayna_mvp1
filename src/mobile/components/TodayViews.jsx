import { useState } from 'react';
import { PillTabs, pillPanelProps } from '../../components/ui/ay/index.js';
import './today-views.css';

/**
 * Home's one toggle (founder Oct 26: "toggles instead of stacking"): Your
 * week (her metrics), Today (her 1 to 3 things and her log), Routine (her day
 * timeline). One view at a time; every panel stays mounted (hidden), so
 * nothing is removed. Her products are the shortcut tile above, so they are
 * not a view here. The chosen view is remembered for the session; with health
 * data the first view is Your week (the data leads, founder 21:46).
 */
const KEY = 'ayna_today_view_v1';
const VIEWS = ['today', 'week', 'routine'];
const readView = (fallback) => { try { const v = sessionStorage.getItem(KEY); return VIEWS.includes(v) ? v : fallback; } catch { return fallback; } };
const saveView = (v) => { try { sessionStorage.setItem(KEY, v); } catch { /* private mode */ } };

export default function TodayViews({ today, todayCount = 0, week, routine, initial = 'today' }) {
  const tabs = [
    ...(week ? [{ id: 'week', label: 'Your week' }] : []),
    { id: 'today', label: 'Today', count: todayCount },
    { id: 'routine', label: 'Routine' },
  ];
  const [view, setView] = useState(() => readView(initial));
  const current = tabs.some((t) => t.id === view) ? view : tabs[0].id;
  const pick = (v) => { setView(v); saveView(v); };
  return (
    <section className="ay-tv" aria-label="Your day">
      <PillTabs tabs={tabs} active={current} onChange={pick} label="Your day" idBase="ay-tv" />
      {week && <div {...pillPanelProps('ay-tv', 'week', current)} className="ay-tv__panel">{week}</div>}
      <div {...pillPanelProps('ay-tv', 'today', current)} className="ay-tv__panel">{today}</div>
      <div {...pillPanelProps('ay-tv', 'routine', current)} className="ay-tv__panel">{routine}</div>
    </section>
  );
}
