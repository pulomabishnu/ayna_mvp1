import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BellMark } from '../nav/tabs.jsx';
import { getSupabaseClient } from '../../utils/supabaseClient.js';
import * as community from '../../utils/community/communityStore.js';
import { loadMonthlyCheckinStatus, monthKey } from '../../utils/monthlyCheckinStore.js';
import { factsToAsk } from '../../health/healthRefresh.js';
import { useLatestAnnouncement } from '../../hooks/useLatestAnnouncement.js';
import { relTime } from '../../utils/community/notes.js';
import { buildUpdates, hasUnseen, readSeen, writeSeen, GROUP_LABEL } from './updatesModel.js';
import './updates.css';

/**
 * The bell and its list (src/components/updates/updatesModel.js says what goes in it).
 * The same on the app header and the website header. `onGo(kind)` is called with
 * 'home' | 'checkin' | 'community' | 'news' | 'signin' when she taps an item.
 */
export default function UpdatesBell({ userId = null, quizAnswers = null, onGo, className = '', theme }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [unread, setUnread] = useState(0);
  const [checkinDue, setCheckinDue] = useState(false);
  const [seen, setSeen] = useState(() => readSeen());
  const news = useLatestAnnouncement();
  const btnRef = useRef(null);
  const panelRef = useRef(null);

  // Signed in: unread community count and this month's check-in.
  useEffect(() => {
    if (!userId) return undefined;
    let live = true;
    const supabase = getSupabaseClient();
    if (supabase) {
      community.listNotifications(supabase, 12).then((r) => { if (live) setRows(Array.isArray(r) ? r : []); }).catch(() => {});
      community.countUnreadNotifications(supabase).then((n) => { if (live) setUnread(n); }).catch(() => {});
    }
    // Only once she has done a first check-in: a brand-new account has nothing to check in on (same rule as the website).
    loadMonthlyCheckinStatus().then((st) => { if (live) setCheckinDue(Boolean(st?.lastCheckin) && !st?.thisMonthCheckin); }).catch(() => {});
    return () => { live = false; };
  }, [userId]);

  const facts = useMemo(() => {
    if (!quizAnswers) return [];
    try { return factsToAsk(quizAnswers); } catch { return []; }
  }, [quizAnswers]);

  // Signed out, nothing of an earlier account shows.
  const myUnread = userId ? unread : 0;
  const items = useMemo(() => buildUpdates({
    facts, checkinDue: Boolean(userId) && checkinDue, checkinMonth: monthKey(), community: userId ? rows : [], news,
  }), [facts, checkinDue, userId, rows, news]);
  const dot = hasUnseen(items, seen, myUnread);

  const close = useCallback(() => { setOpen(false); btnRef.current?.focus?.({ preventScroll: true }); }, []);
  const openList = () => {
    setOpen(true);
    // Opening the list counts as seeing it.
    const next = new Set([...seen, ...items.map((i) => i.key)]);
    writeSeen(next);
    setSeen(next);
    if (myUnread) {
      setUnread(0);
      const supabase = getSupabaseClient();
      if (supabase) community.markNotificationsRead(supabase).catch(() => {});
    }
  };

  useEffect(() => {
    if (!open) return undefined;
    panelRef.current?.querySelector('h2')?.focus?.({ preventScroll: true });
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  const go = (kind) => { setOpen(false); onGo?.(kind); };
  const groups = ['you', 'community', 'ayna'].map((g) => [g, items.filter((i) => i.group === g)]).filter(([, list]) => list.length);

  return <>
    <button
      ref={btnRef}
      type="button"
      className={`ay-bell ${className}${dot ? ' has-new' : ''}`}
      aria-label={dot ? 'Updates, new' : 'Updates'}
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={() => (open ? close() : openList())}
      data-tour="updates-bell"
    >
      <BellMark />
      {dot && <span className="ay-bell__dot" aria-hidden="true" />}
    </button>
    {open && typeof document !== 'undefined' && createPortal(
      <div className="ay-updates" data-theme={theme}>
        <div className="ay-updates__dim" aria-hidden="true" onClick={close} />
        <section ref={panelRef} className="ay-updates__panel" role="dialog" aria-modal="true" aria-labelledby="ay-updates-h">
          <header className="ay-updates__head">
            <h2 id="ay-updates-h" tabIndex={-1}>Updates</h2>
            <button type="button" className="ay-updates__x" aria-label="Close updates" onClick={close}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
          </header>
          <div className="ay-updates__body">
            {groups.length === 0 && <p className="ay-updates__empty"><b>You're all caught up.</b><span>Replies, check-ins and changes to your matches show up here.</span></p>}
            {groups.map(([g, list]) => (
              <section key={g} className="ay-updates__group" aria-label={GROUP_LABEL[g]}>
                <h3>{GROUP_LABEL[g]}</h3>
                <ul>
                  {list.map((i) => (
                    <li key={i.key}>
                      <button type="button" className={`ay-updates__item${i.unread ? ' is-unread' : ''}`} onClick={() => go(i.go)}>
                        <span className="ay-updates__text">
                          <span className="ay-updates__title">{i.title}</span>
                          {i.body && <span className="ay-updates__sub">{i.body}</span>}
                          {i.whenIso && <span className="ay-updates__when">{relTime(i.whenIso)}</span>}
                        </span>
                        {i.action && <span className="ay-updates__act">{i.action}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            {!userId && <p className="ay-updates__foot">Sign in to get replies and your monthly check-in here. <button type="button" onClick={() => go('signin')}>Sign in</button></p>}
          </div>
        </section>
      </div>,
      document.body,
    )}
  </>;
}
