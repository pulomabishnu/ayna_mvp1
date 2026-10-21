import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import FinishQuizCard from '../../../components/FinishQuizCard.jsx';
import { Capacitor } from '@capacitor/core';
import { getSupabaseClient } from '../../../utils/supabaseClient.js';
import { apiUrl } from '../../../utils/apiUrl.js';
import { getBrandAffinity, getCategoryInsights, getSafetyAlerts } from '../../utils/shopperProfileData.js';
import { ROUTINE_BUCKET_LABELS, ROUTINE_BUCKETS, useRoutine } from '../../hooks/useRoutine.js';
import { getProfileCompletionPct } from '../../utils/profileCompleteness.js';
import { TEXT_SIZE_STEPS } from '../../hooks/useTextSize.js';
import '../../settings.css';
import EmptyState from '../../components/EmptyState.jsx';
import MobileHeader from '../../components/MobileHeader.jsx';
import {
  NotSignedInError,
  fetchNotificationPreferences,
  patchNotificationPreferences,
  sendPhoneVerificationCode,
  confirmPhoneVerificationCode,
} from '../../utils/notificationPreferencesApi.js';
import { fetchSmsStatus, startSmsVerify, checkSmsVerify, saveSmsPrefs, removeSmsPhone } from '../../../utils/smsApi.js';
import { fetchDataExport, requestAccountDeletion } from '../../utils/dataExportApi.js';
import { OPEN_SOURCE_PACKAGES, summarizeLicenses } from '../../data/openSourceLicenses.js';
import LegalFooter from '../../components/LegalFooter.jsx';
import InlineError from '../../../components/InlineError.jsx';
import { clearError, errorSummary, firstErrorKey, revealField, warnHaptic } from '../../../utils/formErrors.js';
import HealthConnectionsScreen from './HealthConnectionsScreen.jsx';
import { useHealthMatchPref } from '../../../health/matchPref.js';
import HealthInsightsScreen from './HealthInsightsScreen.jsx';
import { usesHormonalBC } from '../../../health/weekInsights.js';
import { ALL_PRODUCTS, getSelectedNeeds } from '../../../data/products.js';
import './about-scrapbook.css';
import { buildShopperProfile } from '../../utils/shopperProfile.js';
import BadgesPanel from '../../../components/BadgesPanel.jsx';
import ShopperCard from '../../components/ShopperCard.jsx';
import { getMyCommunityProfile, getProfileStats, listPlaylists } from '../../../utils/community/communityStore.js';
import ProductImage from '../../components/ProductImage.jsx';
import { ARTICLES } from '../../../components/Articles.jsx';
import { buildDashboard, formatMetric } from '../../../health/dashboard.js';
import { estimatePhase } from '../../../health/phase.js';
import { localToday, useHealthData } from '../../hooks/useHealthData.js';
import { publicMediaUrl } from '../../../utils/community/imageUpload.js';

const IS_NATIVE_APP = Capacitor.isNativePlatform();

/**
 * Profile hub + its four sub-sections and one detail page, ported from the
 * "Ayna Profile Mobile" design reference. Manages its own internal
 * navigation (hub -> sub-screen -> back) the same way IntakeScreen manages
 * its own steps, so MobileApp only has to mount/unmount ONE overlay instead
 * of tracking a navigation stack.
 *
 * This pass is UI scaffolding, not backend integration: toggles below are
 * local component state with no persistence yet (Notifications, Updates,
 * Night mode, newsletter), since none of that exists server-side yet.
 * Real data is wired in wherever it already exists in the app (ecosystem
 * count, saved count, name); "profile filled %" stays a static placeholder
 * since there's no completeness calculation built yet.
 *
 * Shopper Profile is the one section wired to real backend logic (see
 * shopperProfileData.js): safety alerts, brand affinity and category
 * insights are all derived from the user's actual ecosystem/saved
 * products and quiz answers, not mock data.
 */

// Lets any settings subpage offer a real Sign in button when signed out.
const SignInContext = createContext(null);

function SignedOutCard({ children }) {
  const onSignIn = useContext(SignInContext);
  return (
    <div className="ay-set-signedout">
      <span className="ay-set-signedout-art" aria-hidden="true"><i /><i /></span>
      <p>{children}</p>
      {onSignIn && <button type="button" className="ay-btn" onClick={onSignIn}>Sign in</button>}
    </div>
  );
}

function BackIcon({ stroke = 'var(--ayna-heading)' }) {
  return (
    // CSS custom properties only resolve through the `style` attribute, not
    // a plain SVG presentation attribute`stroke="var(--x)"` silently
    // renders as no stroke at all (Chromium doesn't substitute var() there).
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" style={{ stroke }}>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" style={{ stroke: 'var(--ayna-text-faint)', flex: 'none' }}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

// Line icons for the "Your account" rows, replacing the original emoji
// placeholders (🛍️ ✨ 🔔 ⚙️) with the same stroke-icon language used
// everywhere else in this screen (BackIcon, ChevronIcon).
// You-menu icons, same stroke system as the Settings icons (24 grid, 1.8 stroke, round caps).
const HUB_ICONS = {
  ecosystem: <><circle cx="12" cy="13" r="3" /><circle cx="12" cy="4.5" r="1.8" /><circle cx="5" cy="18" r="1.8" /><circle cx="19" cy="18" r="1.8" /><path d="M12 10V6.3M9.5 14.6l-3 2.2M14.5 14.6l3 2.2" /></>,
  saved: <><path d="M12 19.5s-7-4.3-7-9.3A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.2c0 5-7 9.3-7 9.3Z" /></>,
  checkin: <><rect x="4" y="5" width="16" height="15" rx="2.5" /><path d="M8 3v4M16 3v4M4 10h16M9 14.5l2 2 4-4" /></>,
  healthData: <><path d="M3 12h4l2-5 4 10 2-5h6" /></>,
  shopper: <><path d="M6 9h12l-1 11H7L6 9Z" /><path d="M9.5 9V7a2.5 2.5 0 0 1 5 0v2" /></>,
  startups: <><path d="M12 3.5l2.2 5.3 5.3 2.2-5.3 2.2L12 18.5l-2.2-5.3L4.5 11l5.3-2.2Z" /><path d="M18.5 17.5l.8 1.7 1.7.8-1.7.8-.8 1.7-.8-1.7-1.7-.8 1.7-.8Z" /></>,
  badges: <><circle cx="12" cy="9.5" r="5.5" /><path d="M8.8 14 7.5 21l4.5-2.5 4.5 2.5-1.3-7" /></>,
};

function AccountIcon({ type }) {
  const props = {
    width: 19,
    height: 19,
    viewBox: '0 0 24 24',
    fill: 'none',
    strokeWidth: 1.75,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    style: { stroke: 'var(--ayna-accent-dark)' },
  };
  if (type === 'shopper') {
    return (
      <svg {...props}>
        <path d="M7 9h10l-1 11H8L7 9Z" />
        <path d="M9.5 9V7a2.5 2.5 0 0 1 5 0v2" />
      </svg>
    );
  }
  if (type === 'startups') {
    return (
      <svg {...props}>
        <polyline points="4 16 9 11 13 15 20 7" />
        <polyline points="14 7 20 7 20 13" />
      </svg>
    );
  }
  if (type === 'preferences') {
    return (
      <svg {...props}>
        <path d="M18 16v-5a6 6 0 1 0-12 0v5l-2 3h16l-2-3Z" />
        <path d="M9.5 21a2.5 2.5 0 0 0 5 0" />
      </svg>
    );
  }
  if (type === 'checkin') {
    return (
      <svg {...props}>
        <rect x="4" y="5" width="16" height="16" rx="3" />
        <path d="M4 10h16M8 3v4M16 3v4" />
        <path d="M9 14.5l2 2 4-4" />
      </svg>
    );
  }
  return (
    <svg {...props}>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 3v2.5M12 18.5V21M21 12h-2.5M5.5 12H3M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8M18.4 18.4l-1.8-1.8M7.4 7.4 5.6 5.6" />
    </svg>
  );
}

function BackHeader({ title, onBack, dark }) {
  return (
    <div
      className="ay-set-head"
      style={{
        flex: 'none',
        paddingTop: 'max(20px, env(safe-area-inset-top))',
        paddingLeft: 18,
        paddingRight: 18,
        paddingBottom: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <button
        type="button" aria-label="Back"
        onClick={onBack}
        style={{
          width: 44,
          height: 44,
          borderRadius: 99,
          border: '1px solid ' + (dark ? 'rgba(255,237,172,.28)' : 'var(--ayna-border)'),
          background: dark ? 'rgba(255,237,172,.1)' : 'var(--ayna-surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flex: 'none',
        }}
      >
        <BackIcon stroke={dark ? '#FFEDAC' : 'var(--ayna-heading)'} />
      </button>
      <h1 className="ay-set-head-title" style={{ color: dark ? '#FFEDAC' : 'var(--ayna-heading)' }}>{title}</h1>
    </div>
  );
}

function Toggle({ on, onClick, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!!on}
      aria-label={label}
      className="ay-switch"
      onClick={onClick}
      style={{
        width: 42,
        height: 25,
        borderRadius: 99,
        padding: 3,
        flex: 'none',
        cursor: 'pointer',
        background: on ? 'var(--ayna-cta-bg)' : 'var(--ayna-border)',
        transition: 'background .18s ease',
        border: 0,
      }}
    >
      <div
        style={{
          width: 19,
          height: 19,
          borderRadius: '50%',
          background: on ? 'var(--ayna-cta-text)' : 'var(--ayna-surface)',
          transform: on ? 'translateX(17px)' : 'none',
          transition: 'transform .18s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,.25)',
        }}
      />
    </button>
  );
}

function ToggleRow({ title, sub, on, onClick, first }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        minHeight: 52,
        padding: '12px 0',
        borderTop: first ? 'none' : '1px solid var(--d-hair)',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 'calc(16px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)' }}>{title}</div>
        <div style={{ fontWeight: 400, fontSize: 'calc(14px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', marginTop: 2, lineHeight: 1.4 }}>{sub}</div>
      </div>
      <Toggle on={on} onClick={onClick} label={title} />
    </div>
  );
}

/* ---------------------------- Profile hub ---------------------------- */

/**
 * Her Community profile (photo, @handle), follower counts and her own
 * playlists. Each piece is optional: anything that fails or doesn't exist
 * yet just doesn't render.
 */
function useMyCommunity(userId) {
  const [data, setData] = useState({ userId: null, profile: null, stats: null, playlists: [] });
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !userId) return undefined;
    let cancelled = false;
    (async () => {
      const profile = await getMyCommunityProfile(supabase, userId).catch(() => null);
      if (cancelled) return;
      setData({ userId, profile, stats: null, playlists: [] });
      if (!profile) return;
      const [stats, playlists] = await Promise.allSettled([
        getProfileStats(supabase, userId),
        listPlaylists(supabase, { section: 'mine', limit: HUB_PLAYLIST_LIMIT + 1 }),
      ]);
      if (cancelled) return;
      setData({
        userId,
        profile,
        stats: stats.status === 'fulfilled' ? stats.value : null,
        playlists: playlists.status === 'fulfilled' ? playlists.value || [] : [],
      });
    })();
    return () => { cancelled = true; };
  }, [userId]);
  return data.userId === userId ? data : { profile: null, stats: null, playlists: [] };
}

const HUB_PLAYLIST_LIMIT = 5;
const RECENT_LIMIT = 10;
const READ_DONE = 0.95;
const DAY_MS = 86400000;

/** "Today", "Yesterday", "3 days ago", then a date. Only for real timestamps. */
function relativeDay(iso) {
  const t = Date.parse(iso || '');
  if (!Number.isFinite(t)) return '';
  const start = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };
  const days = Math.round((start(Date.now()) - start(t)) / DAY_MS);
  if (days < 0) return '';
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const CATALOG_BY_ID = new Map(ALL_PRODUCTS.map((p) => [p.id, p]));

/**
 * Her recent things: products in her Ecosystem, products she saved, reads she
 * finished. Only Ecosystem products she added herself carry a date (addedAt);
 * nothing else stores one, so those show without "x days ago".
 */
function buildRecent({ myProducts = [], savedProducts = {}, readProgress = {} }) {
  const eco = [...myProducts].reverse().filter((p) => p?.id).map((p) => ({ key: `eco-${p.id}`, kind: 'eco', label: 'In your Ecosystem', product: p, title: p.name, at: p.addedAt || null }));
  const ecoIds = new Set(myProducts.map((p) => p?.id));
  const saved = Object.values(savedProducts || {}).reverse()
    .filter((p) => p?.id && !ecoIds.has(p.id))
    .map((p) => { const full = { ...(CATALOG_BY_ID.get(p.id) || {}), ...p }; return { key: `saved-${p.id}`, kind: 'saved', label: 'Saved', product: full, title: full.name, at: null }; });
  const reads = Object.entries(readProgress || {})
    .filter(([, v]) => v >= READ_DONE)
    .map(([id]) => ARTICLES.find((a) => a.id === id))
    .filter(Boolean)
    .reverse()
    .map((a) => ({ key: `read-${a.id}`, kind: 'read', label: 'Read', article: a, title: a.title, at: null }));
  // Dated items first, newest first; then the rest, taking turns between lists.
  const dated = eco.filter((i) => i.at).sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  const lists = [eco.filter((i) => !i.at), saved, reads];
  const rest = [];
  for (let i = 0; rest.length < RECENT_LIMIT && lists.some((l) => l.length > i); i += 1) {
    for (const l of lists) if (l[i]) rest.push(l[i]);
  }
  return [...dated, ...rest].filter((i) => i.title).slice(0, RECENT_LIMIT);
}

const fmtCount = (n) => Number(n || 0).toLocaleString('en-US');
const localIso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const WEEK_METRICS = ['sleep_minutes', 'steps', 'active_energy_kcal', 'workout_minutes'];
const SIDE_METRICS = ['readiness_score', 'resting_hr_bpm', 'sleep_minutes', 'steps'];
const METRIC_PER = { sleep_minutes: 'Sleep a night', steps: 'Steps a day', active_energy_kcal: 'Active energy a day', workout_minutes: 'Workouts a day', readiness_score: 'Readiness', resting_hr_bpm: 'Resting heart rate' };
const showMetric = (c) => (c.metric === 'steps' ? fmtCount(Math.round(c.week)) : formatMetric(c.metric, c.week));

/** Seven days ending today. Days with no data stay as a short stub, never an invented bar. */
function WeekBars({ chart, today }) {
  const byDay = new Map(chart.points.map((p) => [p.day, p.value]));
  const end = new Date(`${today}T12:00:00`);
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(end); d.setDate(end.getDate() - 6 + i); return d; });
  const values = days.map((d) => byDay.get(localIso(d)) ?? null);
  const hi = Math.max(...values.filter((v) => v != null), 0) || 1;
  return (
    <div className="ay-you-bars" aria-hidden="true">
      {days.map((d, i) => {
        const v = values[i];
        return (
          <span key={localIso(d)} className={`ay-you-bar${i === 6 ? ' is-today' : ''}${v == null ? ' is-empty' : ''}`}>
            <i style={{ height: v == null ? '4px' : `${Math.max(8, (v / hi) * 100)}%` }} />
            <small>{d.toLocaleDateString('en-US', { weekday: 'narrow' })}</small>
          </span>
        );
      })}
    </div>
  );
}

/** "This week": her cycle day and one or two real metrics, or a locked card. */
function ThisWeek({ authUserId, onOpenDashboard, onConnect }) {
  const health = useHealthData(authUserId || null);
  const today = localToday();
  const week = useMemo(() => buildDashboard(health.insightRows || [], { days: 7, today }), [health.insightRows, today]);
  const month = useMemo(() => buildDashboard(health.insightRows || [], { days: 30, today }), [health.insightRows, today]);
  const charts = week.groups.flatMap((g) => g.charts).filter((c) => c.week != null);
  const barChart = WEEK_METRICS.map((m) => charts.find((c) => c.metric === m)).find(Boolean) || null;
  const cycle = month.cycle?.cycleDay ? month.cycle : null;
  const phase = cycle ? estimatePhase(cycle) : null;
  const side = cycle ? null : SIDE_METRICS.map((m) => charts.find((c) => c.metric === m && c.metric !== barChart?.metric)).find(Boolean) || null;

  const heading = <h2 className="ay-you-h2" id="ay-you-week">This week</h2>;
  if (authUserId && (health.status === 'loading' || health.status === 'idle') && !health.loadedAt) {
    return <section className="ay-you-section" aria-labelledby="ay-you-week">{heading}<div className="ay-you-week is-loading" role="status">Loading your week</div></section>;
  }
  if (!cycle && !barChart && !side) {
    return (
      <section className="ay-you-section" aria-labelledby="ay-you-week">
        {heading}
        <div className="ay-you-locked">
          <svg className="ay-you-locked-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h4l2-5 4 10 2-5h6" /></svg>
          <p>Your health dashboard lives here. Connect Apple Health to see your week.</p>
          <button type="button" className="ay-you-btn" onClick={onConnect}>Connect</button>
        </div>
      </section>
    );
  }
  const first = cycle
    ? { value: `Day ${cycle.cycleDay}`, label: phase ? (phase.id === 'ovulation' ? 'Around ovulation' : phase.name) : 'Of your cycle' }
    : side ? { value: showMetric(side), label: METRIC_PER[side.metric] } : null;
  const second = barChart ? { value: showMetric(barChart), label: METRIC_PER[barChart.metric] } : null;
  const summary = [first && `${first.value}, ${first.label}`, second && `${second.value}, ${second.label}`].filter(Boolean).join('. ');
  return (
    <section className="ay-you-section" aria-labelledby="ay-you-week">
      {heading}
      <button type="button" className="ay-you-week" onClick={onOpenDashboard} aria-label={`${summary}. Open your health dashboard.`}>
        <span className="ay-you-week-nums">
          {first && <span><b>{first.value}</b><small>{first.label}</small></span>}
          {second && <span><b>{second.value}</b><small>{second.label}</small></span>}
        </span>
        {barChart && <WeekBars chart={barChart} today={today} />}
        <span className="ay-you-week-foot">Open your health dashboard<ChevronIcon /></span>
      </button>
    </section>
  );
}

function RecentThumb({ item }) {
  if (item.article) return <span className="ay-you-thumb is-read"><img src={item.article.image} alt="" loading="lazy" /></span>;
  const p = item.product;
  return <span className="ay-you-thumb"><ProductImage product={p} src={p.image || p.imageUrl || p.images?.[0]} alt="" allowBrandLogo={p.type === 'digital'} style={{ objectFit: 'contain' }} /></span>;
}

const COVER_TONES = ['is-sky', 'is-pink'];
function PlaylistCover({ playlist }) {
  if (playlist.cover_url) return <span className="ay-you-cover"><img src={publicMediaUrl(playlist.cover_url)} alt="" loading="lazy" /></span>;
  const picks = (playlist.preview_product_ids || []).map((id) => CATALOG_BY_ID.get(String(id))).filter(Boolean).slice(0, 4);
  if (picks.length) {
    return (
      <span className={`ay-you-cover is-mosaic is-${picks.length}`}>
        {picks.map((p) => <span key={p.id}><ProductImage product={p} src={p.image || p.imageUrl || p.images?.[0]} alt="" allowBrandLogo={p.type === 'digital'} style={{ objectFit: 'contain' }} /></span>)}
      </span>
    );
  }
  const title = String(playlist.title || 'ayna').trim();
  const tone = COVER_TONES[[...title].reduce((n, c) => n + c.charCodeAt(0), 0) % COVER_TONES.length];
  return <span className={`ay-you-cover is-letter ${tone}`}><b>{(title[0] || 'a').toUpperCase()}</b></span>;
}

const pickWord = (n) => `${fmtCount(n)} ${n === 1 ? 'product' : 'products'}`;

function ProfileHub({ authUserId, name, initial, memberSince, ecosystemCount, savedCount, profileFilledPct, shopperAlertsCount, myProducts, savedProducts, readProgress, onOpen, onOpenSettings, onEditProfile, onOpenEcosystem, onOpenSaved, onOpenMonthlyCheckin, onOpenProduct, onOpenArticle, onOpenCommunity, quizDraft = null, onResumeQuiz, onStartOverQuiz }) {
  const { profile, stats, playlists } = useMyCommunity(authUserId);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const showPhoto = profile?.avatar_url && !avatarFailed;
  const recent = useMemo(() => buildRecent({ myProducts, savedProducts, readProgress }), [myProducts, savedProducts, readProgress]);
  const shownPlaylists = playlists.slice(0, HUB_PLAYLIST_LIMIT);
  const openMyProfile = profile?.username && onOpenCommunity ? () => onOpenCommunity({ username: profile.username }) : null;
  const signedIn = !!authUserId;

  const rows = [
    onOpenEcosystem && { key: 'ecosystem', title: 'Ecosystem', value: fmtCount(ecosystemCount), onClick: onOpenEcosystem },
    onOpenSaved && { key: 'saved', title: 'Saved', value: fmtCount(savedCount), onClick: onOpenSaved },
    { key: 'shopper', title: 'Shopper profile', value: shopperAlertsCount > 0 ? `${shopperAlertsCount} ${shopperAlertsCount === 1 ? 'alert' : 'alerts'}` : '', onClick: () => onOpen('shopper') },
    onOpenMonthlyCheckin && { key: 'checkin', title: 'Monthly check-in', onClick: onOpenMonthlyCheckin },
    { key: 'healthData', title: 'Health data', onClick: () => onOpen('healthData') },
    signedIn && { key: 'badges', title: 'Badges', onClick: () => onOpen('badges') },
    { key: 'startups', title: 'Startups', onClick: () => onOpen('startups') },
  ].filter(Boolean);

  return (
    <div className="ayna-fresh-profile-hub ay-you" style={{ flex: 1, minWidth: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <MobileHeader onOpenSettings={onOpenSettings} />
      <header className="ay-you-head">
        <div className="ay-you-id">
          <span className={`ay-you-avatar${showPhoto ? ' has-photo' : ''}`} aria-hidden="true">
            {showPhoto ? <img src={publicMediaUrl(profile.avatar_url)} alt="" onError={() => setAvatarFailed(true)} /> : initial}
          </span>
          <span className="ay-you-names">
            <h1>{name}</h1>
            {profile?.username ? <span>@{profile.username}</span> : memberSince ? <span>{memberSince}</span> : null}
          </span>
        </div>
        {stats && openMyProfile && (
          <button type="button" className="ay-you-counts" onClick={openMyProfile} aria-label={`${fmtCount(stats.followers)} followers, ${fmtCount(stats.following)} following. Open your Community profile.`}>
            <span><b>{fmtCount(stats.followers)}</b> {stats.followers === 1 ? 'follower' : 'followers'}</span>
            <span><b>{fmtCount(stats.following)}</b> following</span>
            {!stats.followers && !stats.following && stats.friends > 0 && <span><b>{fmtCount(stats.friends)}</b> {stats.friends === 1 ? 'friend' : 'friends'}</span>}
          </button>
        )}
        {signedIn && (
          <button type="button" className="ay-you-progress" onClick={onEditProfile} aria-label={`Health profile ${profileFilledPct}% filled in. Edit health profile.`}>
            <span>Health profile {profileFilledPct}%</span>
            <i aria-hidden="true"><i style={{ width: `${profileFilledPct}%` }} /></i>
          </button>
        )}
      </header>

      <div className="ay-you-body">
        {!signedIn && <SignedOutCard>Sign in to keep your Ecosystem, saved products and health data together, on any phone.</SignedOutCard>}

        {quizDraft && onResumeQuiz && <FinishQuizCard progress={quizDraft} onContinue={onResumeQuiz} onStartOver={onStartOverQuiz} />}

        <ThisWeek authUserId={authUserId} onOpenDashboard={() => onOpen('healthInsights')} onConnect={() => onOpen('healthData')} />

        {recent.length > 0 && (
          <section className="ay-you-section" aria-labelledby="ay-you-recent">
            <h2 className="ay-you-h2" id="ay-you-recent">Recently</h2>
            <ul className="ay-you-recent">
              {recent.map((item) => {
                const when = relativeDay(item.at);
                const open = item.article ? onOpenArticle && (() => onOpenArticle(item.article)) : onOpenProduct && (() => onOpenProduct(item.product));
                return (
                  <li key={item.key}>
                    <button type="button" onClick={open || undefined} disabled={!open}>
                      <RecentThumb item={item} />
                      <span className="ay-you-recent-title">{item.title}</span>
                      <small>{item.label}{when && <><br />{when}</>}</small>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {shownPlaylists.length > 0 && (
          <section className="ay-you-section" aria-labelledby="ay-you-playlists">
            <div className="ay-you-h2-row">
              <h2 className="ay-you-h2" id="ay-you-playlists">Your playlists</h2>
              {playlists.length > HUB_PLAYLIST_LIMIT && openMyProfile && <button type="button" className="ay-you-link" onClick={openMyProfile}>See all</button>}
            </div>
            <ul className="ay-you-playlists">
              {shownPlaylists.map((pl) => (
                <li key={pl.id}>
                  <button type="button" onClick={onOpenCommunity ? () => onOpenCommunity({ playlistId: pl.id }) : undefined}>
                    <PlaylistCover playlist={pl} />
                    <span className="ay-you-pl-title">{pl.title}</span>
                    <small>{pickWord(pl.item_count || 0)}</small>
                  </button>
                </li>
              ))}
              {onOpenCommunity && (
                <li>
                  <button type="button" className="ay-you-pl-new" onClick={() => onOpenCommunity({ kind: 'playlist' })}>
                    <span className="ay-you-cover is-new"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg></span>
                    <span className="ay-you-pl-title">New playlist</span>
                  </button>
                </li>
              )}
            </ul>
            {openMyProfile && <button type="button" className="ay-you-posts" onClick={openMyProfile}>Your reviews and posts<ChevronIcon /></button>}
          </section>
        )}

        <nav className="ay-you-section ay-you-list" aria-label="More in You">
          {rows.map((row) => (
            <button type="button" key={row.key} className="ay-you-row" onClick={row.onClick}>
              <svg className="ay-you-row-icon" viewBox="0 0 24 24" aria-hidden="true">{HUB_ICONS[row.key]}</svg>
              <span className="ay-you-row-title">{row.title}</span>
              {row.value && <span className="ay-you-row-value">{row.value}</span>}
              <ChevronIcon />
            </button>
          ))}
        </nav>
      </div>
      <LegalFooter />
    </div>
  );
}

/* ------------------------- Shopper Profile ------------------------- */

function ShopperProfileScreen({ onBack, quizAnswers, myProducts = [], savedProducts = {}, onViewAlternative, onBrowse, shopperProfile = null }) {
  const [dismissedAlerts, setDismissedAlerts] = useState([]);
  const [activeBucket, setActiveBucket] = useState('morning');
  const { routineMap, setProductBucket, removeFromRoutine } = useRoutine();

  const allAlerts = getSafetyAlerts(myProducts, quizAnswers);
  const activeAlerts = allAlerts.filter((a) => !dismissedAlerts.includes(a.id));
  const dismissAlert = (id) => setDismissedAlerts((prev) => [...prev, id]);

  const inBucket = myProducts.filter((p) => routineMap[p.id] === activeBucket);
  const notInBucket = myProducts.filter((p) => routineMap[p.id] !== activeBucket);
  const sortedCount = myProducts.filter((p) => routineMap[p.id]).length;

  const affinityChips = getBrandAffinity(quizAnswers, myProducts);

  const { top: topCategories, low: lowCategories } = getCategoryInsights(myProducts, savedProducts, ALL_PRODUCTS);

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <BackHeader title="Shopper profile" onBack={onBack} />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '0 20px 30px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {shopperProfile && <ShopperCard profile={shopperProfile} />}

        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 11 }}>
            <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-accent-dark)' }}>Safety alerts</div>
            <div style={{ fontWeight: 500, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)' }}>{activeAlerts.length} active</div>
          </div>
          {activeAlerts.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {activeAlerts.map((alert) =>
                alert.kind === 'recall' ? (
                  <div key={alert.id} style={{ borderRadius: 18, padding: 15, background: 'var(--d-pink)', border: 0, color: '#3e2723' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 7, height: 7, borderRadius: 99, background: 'var(--ayna-heading)', flex: 'none' }} />
                      <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-heading)' }}>FDA recall · active</div>
                    </div>
                    <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(17px * var(--ayna-text-scale, 1))', lineHeight: 1.3, margin: '8px 0 5px', color: 'var(--ayna-text)' }}>{alert.title}</div>
                    <div style={{ fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.5 }}>{String(alert.body || '').replace(/^⚠️?\s*/, '')}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <div onClick={() => onViewAlternative && onViewAlternative(alert.product)} style={{ background: 'var(--ayna-heading)', color: '#FFEDAC', fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', padding: '8px 14px', borderRadius: 99, cursor: 'pointer' }}>See swap</div>
                      <div onClick={() => dismissAlert(alert.id)} style={{ border: '1px solid rgba(180,64,42,.35)', color: 'var(--ayna-heading)', fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', padding: '8px 14px', borderRadius: 99, cursor: 'pointer' }}>Dismiss</div>
                    </div>
                  </div>
                ) : (
                  <div key={alert.id} style={{ background: 'var(--d-group)', borderRadius: 20, padding: 15, border: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 7, height: 7, borderRadius: 99, background: 'var(--ayna-accent-dark)', flex: 'none' }} />
                      <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-accent-dark)' }}>Safety note · watching</div>
                    </div>
                    <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(17px * var(--ayna-text-scale, 1))', lineHeight: 1.3, margin: '8px 0 5px', color: 'var(--ayna-text)' }}>{alert.title}</div>
                    <div style={{ fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.5 }}>{String(alert.body || '').replace(/^⚠️?\s*/, '')}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <div onClick={() => dismissAlert(alert.id)} style={{ border: '1px solid var(--ayna-border)', color: 'var(--ayna-text-muted)', fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', padding: '8px 14px', borderRadius: 99, cursor: 'pointer' }}>Dismiss</div>
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div style={{ background: 'var(--d-group)', borderRadius: 20, padding: 15, border: 0, fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.5 }}>
              No alerts. We’ll flag recalls and anything that clashes with your intake.
            </div>
          )}
          {dismissedAlerts.length > 0 && (
            <div style={{ background: 'var(--d-group)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 20, padding: '13px 15px', marginTop: 9, border: 0 }}>
              <div style={{ fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)' }}>Dismissed · {dismissedAlerts.length}</div>
            </div>
          )}
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 11 }}>
            <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-accent-dark)' }}>Your routine</div>
          </div>
          <div style={{ background: 'var(--d-group)', border: 0, borderRadius: 20, padding: 16 }}>
            <div style={{ display: 'flex', gap: 7, overflowX: 'auto', touchAction: 'pan-x', paddingBottom: 2, marginBottom: 14, scrollbarWidth: 'none' }}>
              {ROUTINE_BUCKETS.map((key) => (
                <div
                  key={key}
                  onClick={() => setActiveBucket(key)}
                  style={{
                    flex: 'none',
                    textAlign: 'center',
                    padding: '8px 14px',
                    borderRadius: 99,
                    fontSize: 'calc(13px * var(--ayna-text-scale, 1))',
                    fontWeight: 500,
                    cursor: 'pointer',
                    background: activeBucket === key ? 'var(--ayna-cta-bg)' : 'var(--ayna-chip-bg)',
                    color: activeBucket === key ? 'var(--ayna-cta-text)' : 'var(--ayna-text-muted)',
                  }}
                >
                  {ROUTINE_BUCKET_LABELS[key]}
                </div>
              ))}
            </div>

            {!myProducts.length ? (
              <div style={{ padding: '10px 2px', fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.5 }}>
                Add products to build a routine.
                {onBrowse && (
                  <div onClick={onBrowse} style={{ display: 'inline-block', marginTop: 10, background: 'var(--ayna-cta-bg)', color: 'var(--ayna-cta-text)', fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', padding: '9px 16px', borderRadius: 99, cursor: 'pointer' }}>Browse products</div>
                )}
              </div>
            ) : (
              <>
                {inBucket.length ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
                    {inBucket.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => removeFromRoutine(p.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--ayna-cta-bg)', color: 'var(--ayna-cta-text)', fontSize: 'calc(13px * var(--ayna-text-scale, 1))', fontWeight: 500, padding: '8px 12px', borderRadius: 99, cursor: 'pointer' }}
                      >
                        {p.name} <span style={{ opacity: 0.75, fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))' }}>×</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.5, marginBottom: 16 }}>
                    Nothing in your {ROUTINE_BUCKET_LABELS[activeBucket].toLowerCase()} routine yet, tap a product below to add it.
                  </div>
                )}

                {notInBucket.length > 0 && (
                  <>
                    <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)', marginBottom: 9 }}>Tap to add</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                      {notInBucket.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => setProductBucket(p.id, activeBucket)}
                          style={{ fontSize: 'calc(13px * var(--ayna-text-scale, 1))', fontWeight: 500, padding: '8px 12px', borderRadius: 99, cursor: 'pointer', background: 'transparent', border: '1px solid var(--ayna-border)', color: 'var(--ayna-text-muted)' }}
                        >
                          {p.name}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, paddingTop: 13, borderTop: '1px solid var(--ayna-border)' }}>
              <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 500, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)' }}>{sortedCount} of {myProducts.length} sorted into a routine</div>
            </div>
          </div>
        </div>

        <div>
          <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-accent-dark)', marginBottom: 11 }}>Brand affinity</div>
          <div style={{ background: 'var(--d-group)', border: 0, borderRadius: 20, padding: 16 }}>
            <div style={{ fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.5, marginBottom: 13 }}>Based on your intake and your picks.</div>
            {affinityChips.length ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {affinityChips.map((chip) => {
                  const strong = chip.score >= 70;
                  const outline = chip.score === 0;
                  return (
                    <div
                      key={chip.tag}
                      style={{
                        fontSize: 'calc(13px * var(--ayna-text-scale, 1))',
                        fontWeight: 500,
                        padding: '8px 13px',
                        borderRadius: 99,
                        cursor: 'default',
                        background: outline ? 'transparent' : strong ? 'var(--ayna-cta-bg)' : 'var(--ayna-chip-bg)',
                        color: outline ? 'var(--ayna-text-muted)' : strong ? 'var(--ayna-cta-text)' : 'var(--ayna-accent-dark)',
                        border: outline ? '1px solid var(--ayna-border)' : 'none',
                      }}
                    >
                      {chip.label} <span style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 500, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', opacity: 0.75 }}>{chip.score}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)' }}>
                {quizAnswers ? "You didn't flag any of these during intake." : 'Take the quiz to see what matters most to you.'}
              </div>
            )}
          </div>
        </div>

        <div>
          <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-accent-dark)', marginBottom: 11 }}>Most-represented categories</div>
          {topCategories.length ? (
            <div style={{ background: 'var(--d-group)', border: 0, borderRadius: 20, padding: 16, display: 'flex', flexDirection: 'column', gap: 13 }}>
              {topCategories.map((c) => (
                <div key={c.rank}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                    <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 500, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-accent-dark)', flex: 'none' }}>{c.rank}</div>
                    <div style={{ flex: 1, fontWeight: 400, lineHeight: 1.45, fontSize: 'calc(15px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)' }}>{c.name}</div>
                    <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 500, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', flex: 'none' }}>{c.count}</div>
                  </div>
                  <div style={{ height: 7, borderRadius: 99, background: 'var(--ayna-border)', overflow: 'hidden' }}>
                    <div style={{ width: `${c.pct}%`, height: '100%', background: 'var(--ayna-accent-dark)' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ background: 'var(--d-group)', border: 0, borderRadius: 20, padding: 16, fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.5 }}>
              Save a product to fill this in.
            </div>
          )}
        </div>

        {lowCategories.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 11 }}>
              <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(17px * var(--ayna-text-scale, 1))', color: 'var(--ay-ink)' }}>Least-represented</div>
              <div style={{ fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)' }}>Blind spots</div>
            </div>
            <div style={{ background: 'var(--d-group)', border: 0, borderRadius: 20, padding: '6px 16px' }}>
              {lowCategories.map((c, i) => (
                <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderTop: i === 0 ? 'none' : '1px solid var(--ayna-border)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 400, lineHeight: 1.45, fontSize: 'calc(15px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)' }}>{c.name}</div>
                    <div style={{ fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', marginTop: 2 }}>{c.note}</div>
                  </div>
                </div>
              ))}
              {onBrowse && (
                <div style={{ padding: '12px 0 14px', borderTop: '1px solid var(--ayna-border)' }}>
                  <div onClick={onBrowse} style={{ display: 'inline-block', border: '1px solid var(--ayna-border)', color: 'var(--ayna-brown)', fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', padding: '8px 14px', borderRadius: 99, cursor: 'pointer' }}>Explore a blind spot</div>
                </div>
              )}
            </div>
          </div>
        )}

        <LegalFooter />
      </div>
    </div>
  );
}

/* ----------------------- Early Stage Startups ----------------------- */

function formatCategoryLabel(category) {
  if (!category) return '';
  return category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// Same frustration -> tag vocabulary as the desktop matching logic
// (src/data/startups.js), Airtable's Symptom Tags were filled in against
// this exact vocabulary. This only ranks the real Airtable-sourced startups
// fetched below; it deliberately does not pull in the desktop's separate
// hardcoded STARTUPS catalog, which is a different, much larger list this
// screen was never meant to show.
const FRUSTRATION_TAG_MAP = {
  'Heavy flow': 'heavy-flow',
  'Painful cramps': 'cramps',
  'Hormonal bloating': 'bloating',
  'Irregular cycles': 'irregular',
  'Leaks & staining': 'leaks',
  'General discomfort': 'discomfort',
  'Not sure if products are safe': 'safety-concern',
  'Recurrent UTIs': 'uti',
  'PCOS symptoms': 'pcos',
  'Pelvic pain': 'pelvic-floor',
  'Menopause symptoms': 'menopause',
  'Endometriosis': 'endometriosis',
};

function sortByRelevance(startups, quizAnswers) {
  const userTags = new Set();
  (quizAnswers?.frustrations || []).forEach((f) => {
    const tag = FRUSTRATION_TAG_MAP[f];
    if (tag) userTags.add(tag);
  });
  if (userTags.size === 0) return startups;
  return [...startups].sort((a, b) => {
    const scoreA = (a.tags || []).filter((t) => userTags.has(t)).length;
    const scoreB = (b.tags || []).filter((t) => userTags.has(t)).length;
    return scoreB - scoreA;
  });
}

// "Clinical" reads on real badge data (Airtable's Tags field) rather than a
// field that doesn't exist, there's no dedicated "clinical" flag, so this is
// the closest honest proxy: some form of clinical/medical validation.
const CLINICAL_BADGES = new Set(['Clinically Backed', 'Doctor-Founded', 'FDA-Cleared']);

function matchesFilter(startup, filter) {
  if (filter === 'women') return startup.womenFounded === true;
  if (filter === 'preseed') return startup.stage === 'Pre-Seed';
  if (filter === 'clinical') return (startup.badges || []).some((b) => CLINICAL_BADGES.has(b));
  return true;
}

function EarlyStageScreen({ onBack, quizAnswers }) {
  const [filter, setFilter] = useState('all');
  // Real early-stage startups synced from Airtable via api/startups.js, no
  // hardcoded placeholder companies here; an empty/failed fetch just shows
  // an honest empty state below rather than fake data.
  const [startups, setStartups] = useState([]);
  const [loadState, setLoadState] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    fetch(apiUrl('/api/startups'))
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('bad response'))))
      .then((data) => {
        if (cancelled) return;
        setStartups(data.startups || []);
        setLoadState('ready');
      })
      .catch(() => { if (!cancelled) setLoadState('error'); });
    return () => { cancelled = true; };
  }, []);

  const ranked = useMemo(() => sortByRelevance(startups, quizAnswers), [startups, quizAnswers]);
  const filtered = filter === 'all' ? ranked : ranked.filter((s) => matchesFilter(s, filter));

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <BackHeader title="Startups" onBack={onBack} />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '0 20px 30px' }}>
        <div className="ay-startups-hero">
          <span className="ay-startups-art" aria-hidden="true"><i /><i /><i /></span>
          <h2>Explore startups</h2>
          <p>Early women's health startups you can try.</p>
        </div>

        <div className="ay-startups-filters" role="group" aria-label="Filter startups">
          {['all', 'women', 'preseed', 'clinical'].map((key) => (
            <button type="button" key={key} aria-pressed={filter === key} onClick={() => setFilter(key)}>
              {key === 'all' ? 'All' : key === 'women' ? 'Women-founded' : key === 'preseed' ? 'Pre-seed' : 'Clinical'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loadState === 'loading' && (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--ayna-text-muted)', fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))' }}>Loading startups…</div>
          )}
          {loadState === 'error' && (
            <EmptyState compact art="offline" tone="butter" title="Startups aren’t loading" body="We couldn’t reach the startup list. Check your connection and reopen this page." />
          )}
          {loadState === 'ready' && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--ayna-text-muted)', fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))' }}>No startups match that filter yet.</div>
          )}

          {filtered.map((s) => {
            const href = s.url || s.waitlistUrl;
            const openLink = href ? () => window.open(href, '_blank', 'noopener,noreferrer') : undefined;
            return s.featured ? (
              <div key={s.id} onClick={openLink} style={{ background: 'var(--d-group)', border: 0, borderRadius: 20, overflow: 'hidden', cursor: openLink ? 'pointer' : 'default' }}>
                <div style={{ height: 168, background: s.image ? undefined : 'linear-gradient(160deg,transparent,transparent)', backgroundImage: s.image ? `url(${s.image})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                  {s.foundedYear && (
                    <div style={{ position: 'absolute', left: 12, top: 12, background: 'rgba(255,237,172,.93)', color: '#3e2723', fontFamily: "var(--ayna-font-ui)", fontWeight: 500, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', padding: '5px 9px', borderRadius: 99 }}>FOUNDED {s.foundedYear}</div>
                  )}
                </div>
                <div style={{ padding: '15px 16px 17px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-accent-dark)' }}>{formatCategoryLabel(s.category)}</div>
                    {s.stage && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--ayna-heading)' }} />
                        <div style={{ fontWeight: 500, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-heading)' }}>{s.stage}</div>
                      </div>
                    )}
                  </div>
                  <div style={{ fontFamily: "var(--ayna-font-display)", fontWeight: 400, fontSize: 'calc(22px * var(--ayna-text-scale, 1))', lineHeight: 1.15, margin: '7px 0 6px', color: 'var(--ayna-text)' }}>{s.name}</div>
                  <div style={{ fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.5 }}>{s.description || s.tagline}</div>
                  {s.badges?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                      {s.badges.map((t) => (
                        <div key={t} style={{ background: 'var(--ayna-chip-bg)', color: 'var(--ayna-accent-dark)', fontWeight: 500, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', padding: '5px 10px', borderRadius: 99 }}>{t}</div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                    <div style={{ flex: 1, background: 'var(--ayna-cta-bg)', color: 'var(--ayna-cta-text)', fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', padding: 11, borderRadius: 99, textAlign: 'center', cursor: 'pointer' }}>
                      {s.productReleased ? 'View brand' : 'Join waitlist'}
                    </div>
                    <div style={{ width: 44, border: '1px solid var(--ayna-border)', borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" style={{ stroke: 'var(--ayna-brown)' }}><path d="M12 20s-7-4.5-7-9.4A4.1 4.1 0 0 1 12 7.6a4.1 4.1 0 0 1 7 3c0 4.9-7 9.4-7 9.4Z" /></svg>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div key={s.id} onClick={openLink} style={{ background: 'var(--d-group)', border: 0, borderRadius: 20, overflow: 'hidden', display: 'flex', cursor: openLink ? 'pointer' : 'default' }}>
                <div style={{ width: 120, flex: 'none', background: s.image ? undefined : 'linear-gradient(160deg,transparent,transparent)', backgroundImage: s.image ? `url(${s.image})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                <div style={{ flex: 1, minWidth: 0, padding: '14px 15px' }}>
                  <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-accent-dark)' }}>{formatCategoryLabel(s.category)}</div>
                  <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(17px * var(--ayna-text-scale, 1))', lineHeight: 1.2, margin: '6px 0 5px', color: 'var(--ayna-text)' }}>{s.name}</div>
                  <div style={{ fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.45 }}>{s.description || s.tagline}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    {(s.badges || []).slice(0, 2).map((t) => (
                      <div key={t} style={{ background: 'var(--ayna-chip-bg)', color: 'var(--ayna-accent-dark)', fontWeight: 500, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', padding: '4px 9px', borderRadius: 99 }}>{t}</div>
                    ))}
                    {s.stage && <div style={{ fontWeight: 500, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-heading)' }}>{s.stage}</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <LegalFooter />
      </div>
    </div>
  );
}

// Ayna's confirmed brand partnerships live only on the web today
// (BrandPartners.jsx at aynahealth.co/startups), Settings links straight
// out to that real page (see SettingsScreen's "About Ayna" rows) rather
// than duplicating its hardcoded partner list in a native screen, so it
// never drifts out of sync with the actual list.
const BRAND_PARTNERSHIPS_URL = 'https://www.aynahealth.co/startups';

/* ---------------------------- Preferences ---------------------------- */

// Substack has no API to subscribe someone by a toggle, this opens the
// real publication's public subscribe page instead, the same
// window.open(url, '_blank', 'noopener,noreferrer') pattern the Startups
// hub already uses for its external links.
const NEWSLETTER_URL = 'https://aynahealth.substack.com/subscribe';
// There's no webhook back from Substack telling the app someone actually
// completed the subscribe form on their site, so "Subscribed" is only ever
// shown once the user explicitly says so, a "Yes, I'm in" tap after
// they've been sent to the real subscribe page, rather than assumed the
// moment they tap through, which they might not follow through on. Kept
// entirely client-side (localStorage), independent of the real
// notification-preferences backend below: that backend has no way to know
// whether someone actually subscribed on Substack either.
const NEWSLETTER_CONFIRMED_KEY = 'ayna_mobile_newsletter_confirmed_v1';

function loadNewsletterConfirmed() {
  try { return localStorage.getItem(NEWSLETTER_CONFIRMED_KEY) === '1'; } catch { return false; }
}

function ExternalLinkIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: 'var(--ayna-text-faint)', flex: 'none' }}>
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}

// Shared with the phone-verify panel below, same error vocabulary as
// src/components/PhoneVerification.jsx's ERROR_MESSAGES, since both call
// the same /api/phone-verify-send and /api/phone-verify-confirm routes.
const PHONE_ERROR_MESSAGES = {
  invalid_phone_number: 'Please enter a valid 10-digit phone number.',
  rate_limited: 'Too many attempts. Please try again in an hour.',
  twilio_send_failed: "We couldn't send a code right now. Please try again.",
  twilio_check_failed: "We couldn't check that code right now. Please try again.",
  invalid_or_expired_code: 'That code is wrong or expired. Please try again.',
  code_required: 'Please enter the code we texted you.',
  phone_already_linked: 'That phone number is already linked to another account.',
  too_many_attempts: 'Too many attempts. Please request a new code.',
  auth_required: 'Please sign in first.',
  not_signed_in: 'Please sign in first.',
};

function friendlyPhoneError(code) {
  return PHONE_ERROR_MESSAGES[code] || 'We couldn’t verify your phone just now. Check the number and try again.';
}

const RESEND_COOLDOWN_SECONDS = 30;

// Two-step phone verification, reusing the same real endpoints as the
// desktop flow (src/components/PhoneVerification.jsx), not a separate
// implementation, just this app's own visual language.
function PhoneVerifyPanel({ onBack, onVerified }) {
  const [step, setStep] = useState('phone'); // 'phone' | 'code'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const sendCode = async () => {
    setError('');
    setSending(true);
    try {
      await sendPhoneVerificationCode(phoneNumber);
      setStep('code');
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (e) {
      setError(friendlyPhoneError(e.code || e.message));
    } finally {
      setSending(false);
    }
  };

  const confirmCode = async () => {
    setError('');
    setSending(true);
    try {
      await confirmPhoneVerificationCode(phoneNumber, code);
      onVerified(phoneNumber);
    } catch (e) {
      setError(friendlyPhoneError(e.code || e.message));
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <BackHeader title="Verify your phone" onBack={onBack} />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '0 20px 30px' }}>
        {step === 'phone' ? (
          <>
            <div style={{ fontWeight: 400, fontSize: 'calc(15px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.45, marginBottom: 18 }}>
              We'll text a 6-digit code to confirm this number before texts can be your delivery channel.
            </div>
            <div style={{ fontSize: 'calc(13px * var(--ayna-text-scale, 1))', fontWeight: 500, color: 'var(--ayna-text)', marginBottom: 7 }}>Phone number</div>
            <input
              type="tel"
              inputMode="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="(555) 555-5555"
              style={{ width: '100%', boxSizing: 'border-box', padding: '14px 16px', borderRadius: 14, border: '1px solid var(--ayna-border)', fontSize: 'max(16px, calc(15px * var(--ayna-text-scale, 1)))', color: 'var(--ayna-text)', background: 'var(--ayna-surface)', outline: 'none' }}
            />
            {error && <div style={{ color: 'var(--ayna-heading)', fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', marginTop: 10 }}>{error}</div>}
            <div
              onClick={() => !sending && phoneNumber.trim() && sendCode()}
              style={{ marginTop: 18, textAlign: 'center', background: sending || !phoneNumber.trim() ? 'var(--ayna-border)' : 'var(--ayna-cta-bg)', color: sending || !phoneNumber.trim() ? 'var(--ayna-text-muted)' : 'var(--ayna-cta-text)', fontWeight: 600, fontSize: 'calc(17px * var(--ayna-text-scale, 1))', padding: 15, borderRadius: 99, cursor: sending || !phoneNumber.trim() ? 'not-allowed' : 'pointer' }}
            >
              {sending ? 'Sending…' : 'Send code'}
            </div>
          </>
        ) : (
          <>
            <div style={{ fontWeight: 400, fontSize: 'calc(15px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.45, marginBottom: 18 }}>
              We texted a code to {phoneNumber}. Enter it below.
            </div>
            <div style={{ fontSize: 'calc(13px * var(--ayna-text-scale, 1))', fontWeight: 500, color: 'var(--ayna-text)', marginBottom: 7 }}>Verification code</div>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              style={{ width: '100%', boxSizing: 'border-box', padding: '14px 16px', borderRadius: 14, border: '1px solid var(--ayna-border)', fontWeight: 600, fontSize: 'calc(17px * var(--ayna-text-scale, 1))', letterSpacing: 4, textAlign: 'center', color: 'var(--ayna-text)', background: 'var(--ayna-surface)', outline: 'none' }}
            />
            {error && <div style={{ color: 'var(--ayna-heading)', fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', marginTop: 10 }}>{error}</div>}
            <div
              onClick={() => !sending && code.length === 6 && confirmCode()}
              style={{ marginTop: 18, textAlign: 'center', background: sending || code.length !== 6 ? 'var(--ayna-border)' : 'var(--ayna-cta-bg)', color: sending || code.length !== 6 ? 'var(--ayna-text-muted)' : 'var(--ayna-cta-text)', fontWeight: 600, fontSize: 'calc(17px * var(--ayna-text-scale, 1))', padding: 15, borderRadius: 99, cursor: sending || code.length !== 6 ? 'not-allowed' : 'pointer' }}
            >
              {sending ? 'Verifying…' : 'Verify'}
            </div>
            <div
              onClick={() => cooldown === 0 && !sending && sendCode()}
              style={{ marginTop: 16, textAlign: 'center', fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: cooldown === 0 ? 'var(--ayna-brown)' : 'var(--ayna-text-faint)', cursor: cooldown === 0 ? 'pointer' : 'default' }}
            >
              {cooldown === 0 ? 'Resend code' : `Resend code in ${cooldown}s`}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const PREFERENCES_ERROR_MESSAGES = {
  ...PHONE_ERROR_MESSAGES,
  load_failed: "Couldn't load your preferences. Try again shortly.",
  save_failed: "That didn't save, try again.",
  phone_not_verified: 'Verify your phone first.',
};

function friendlyPreferencesError(code) {
  return PREFERENCES_ERROR_MESSAGES[code] || "That didn't save, try again.";
}

function SectionLabel({ children }) {
  return (
    <div className="ay-set-label" style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(14px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)', margin: '28px 0 8px' }}>
      {children}
    </div>
  );
}

function DrillRow({ title, sub, onClick, first }) {
  return (
    <button
      type="button"
      className="ay-set-drill"
      onClick={onClick}
      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, minHeight: 52, padding: '12px 0', border: 0, borderTop: first ? 'none' : '1px solid var(--d-hair)', background: 'transparent', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 'calc(16px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)' }}>{title}</div>
        {sub && <div style={{ fontWeight: 400, fontSize: 'calc(14px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', marginTop: 2, lineHeight: 1.4 }}>{sub}</div>}
      </div>
      <ChevronIcon />
    </button>
  );
}

const THEME_SWATCHES = [
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
];

function ThemeSwatch({ mode, selected, onClick }) {
  const bg = mode === 'light' ? '#FFEDAC' : '#2E1C18';
  const barColor = mode === 'dark' ? 'rgba(255,249,242,.35)' : 'rgba(41,37,36,.25)';
  return (
    <button type="button" aria-label={mode === 'dark' ? 'Dark theme' : 'Light theme'} aria-pressed={selected} onClick={onClick} style={{ border: 0, padding: 0, background: 'transparent', color: 'var(--ayna-text)', cursor: 'pointer', textAlign: 'center' }}>
      <div
        style={{
          height: 58,
          borderRadius: 14,
          background: bg,
          border: selected ? '2px solid var(--ayna-cta-bg)' : '1px solid var(--ayna-border)',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 5,
          boxSizing: 'border-box',
        }}
      >
        <div style={{ height: 3, width: '75%', borderRadius: 2, background: barColor }} />
        <div style={{ height: 3, width: '50%', borderRadius: 2, background: barColor }} />
      </div>
      <div style={{ marginTop: 7, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', fontWeight: selected ? 600 : 500, color: selected ? 'var(--ayna-heading)' : 'var(--ayna-text-muted)' }}>
        {THEME_SWATCHES.find((s) => s.key === mode)?.label}
      </div>
    </button>
  );
}

// Real backend: GET/PATCH api/notification-preferences.js (a real Supabase
// table, RLS-scoped to the signed-in user). Each toggle updates optimistic
// local state immediately, then rolls back with a toast if the PATCH fails.
// Mobile has no real Supabase sign-in flow yet (see useEcosystemSession.js),
// so until that exists this correctly shows "sign in" rather than pretending
// to work, the API and table are real and ready the moment mobile auth is.
// Join newsletter is deliberately NOT part of this backend-synced list: it
// links out to the real Substack subscribe page instead (see NEWSLETTER_URL
// above) rather than a toggle that can't actually enroll anyone.
function PreferencesScreen({
  onBack,
  theme,
  onToggleTheme,
  onOpenChannels,
  personalizeWithData,
  onPersonalizeWithDataChange,
  askAynaHistoryCount,
  onClearAskAynaHistory,
  textSizeIndex,
  onTextSizeChange,
}) {
  const [loadState, setLoadState] = useState('loading'); // 'loading' | 'signed_out' | 'error' | 'ready'
  const [prefs, setPrefs] = useState(null);
  const [toast, setToast] = useState('');
  // Session-only nudge to ask "did you subscribe?" after sending them to
  // Substack, not persisted, since it's just prompting for the confirm
  // tap below, not the subscribed state itself.
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);
  const [newsletterConfirmed, setNewsletterConfirmed] = useState(loadNewsletterConfirmed);
  const [clearHistoryConfirm, setClearHistoryConfirm] = useState(false);
  // Shared with MobileApp and the website (src/health/matchPref.js); MobileApp loads it for her account.
  const healthPref = useHealthMatchPref();

  // Initial state is already 'loading', so the mount effect below doesn't
  // need to (and per the react-hooks lint rule, shouldn't) set it again
  // synchronously, only the retry button, which isn't running inside an
  // effect, does that explicitly.
  const fetchPrefs = () => {
    fetchNotificationPreferences()
      .then((data) => { setPrefs(data); setLoadState('ready'); })
      .catch((e) => setLoadState(e instanceof NotSignedInError ? 'signed_out' : 'error'));
  };

  useEffect(() => { fetchPrefs(); }, []);

  const retry = () => {
    setLoadState('loading');
    fetchPrefs();
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3500);
  };

  const patchField = (apiField, value, clientField) => {
    const previous = prefs;
    setPrefs((p) => ({ ...p, [clientField]: value }));
    patchNotificationPreferences({ [apiField]: value }).catch((e) => {
      setPrefs(previous);
      showToast(friendlyPreferencesError(e.code || e.message));
    });
  };

  // Mirrors the toggle into MobileApp's app-wide `personalizeWithData` state
  // immediately (so match %, For You toggles, and Ask Ayna's context react
  // right away everywhere, not just once this screen's own `prefs` update
  // lands) and rolls that mirror back too if the save fails.
  const handlePersonalizeToggle = () => {
    const next = !personalizeWithData;
    onPersonalizeWithDataChange && onPersonalizeWithDataChange(next);
    patchNotificationPreferences({ personalize_with_data_enabled: next }).catch((e) => {
      onPersonalizeWithDataChange && onPersonalizeWithDataChange(!next);
      showToast(friendlyPreferencesError(e.code || e.message));
    });
  };

  // Best-effort mirror only, same as Night mode above, the real local
  // change (onTextSizeChange, working with no account) is what actually
  // scales the app; a failed save here never blocks or rolls back the
  // visual change, it just leaves the synced value stale until next edit.
  const handleTextSizeChange = (index) => {
    onTextSizeChange && onTextSizeChange(index);
    patchNotificationPreferences({ text_size_index: index }).catch(() => {});
  };

  const handleClearHistory = () => {
    onClearAskAynaHistory && onClearAskAynaHistory();
    setClearHistoryConfirm(false);
    showToast('Ask ayna history cleared.');
  };

  const handleJoinNewsletter = () => {
    window.open(NEWSLETTER_URL, '_blank', 'noopener,noreferrer');
    setAwaitingConfirm(true);
  };

  const handleConfirmSubscribed = (e) => {
    e.stopPropagation();
    setAwaitingConfirm(false);
    setNewsletterConfirmed(true);
    try { localStorage.setItem(NEWSLETTER_CONFIRMED_KEY, '1'); } catch { /* private mode */ }
  };

  const channelsSummary = prefs
    ? [{ push: 'Push', sms: 'Text message', email: 'Email' }[prefs.deliveryChannel], prefs.quietHoursEnabled ? `Quiet ${prefs.quietHoursStart}–${prefs.quietHoursEnd}` : null]
        .filter(Boolean)
        .join(' · ')
    : '';

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <BackHeader title="Preferences" onBack={onBack} />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '0 20px 30px' }}>
        {/* Appearance, always local, no account needed. */}
        <SectionLabel>Appearance</SectionLabel>
        <div style={{ background: 'transparent', border: 0, borderBottom: '1px solid var(--ayna-border)', borderRadius: 0, padding: '18px 0' }}>
          <div style={{ fontWeight: 600, fontSize: 'calc(17px * var(--ayna-text-scale, 1))', marginBottom: 12 }}>Theme</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
            {THEME_SWATCHES.map((s) => (
              <ThemeSwatch key={s.key} mode={s.key} selected={theme === s.key} onClick={() => onToggleTheme(s.key)} />
            ))}
          </div>
        </div>

        <div style={{ background: 'transparent', border: 0, borderBottom: '1px solid var(--ayna-border)', borderRadius: 0, padding: '18px 0', marginTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 'calc(17px * var(--ayna-text-scale, 1))' }}>Text size</div>
            <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 500, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-accent-dark)', background: 'var(--ayna-chip-bg)', padding: '3px 9px', borderRadius: 99 }}>
              {TEXT_SIZE_STEPS[textSizeIndex]?.label}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)', flex: 'none' }}>A</span>
            <input className="ay-range" type="range" aria-label="Text size" min="0" max={TEXT_SIZE_STEPS.length - 1} step="1" value={textSizeIndex} aria-valuetext={TEXT_SIZE_STEPS[textSizeIndex]?.label} onChange={(event) => handleTextSizeChange(Number(event.target.value))} style={{ flex: 1, minWidth: 0, height: 44, accentColor: 'var(--ayna-heading)' }} />
            <span style={{ fontWeight: 600, fontSize: 'calc(17px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)', flex: 'none' }}>A</span>
          </div>
          <div style={{ marginTop: 14, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', fontWeight: 500, color: 'var(--ayna-text)', lineHeight: 1.5 }}>
            This is what body text looks like across ayna.
          </div>
        </div>

        {IS_NATIVE_APP && <SectionLabel>Notifications</SectionLabel>}
        {IS_NATIVE_APP && loadState === 'loading' && (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--ayna-text-muted)', fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))' }}>Loading your preferences…</div>
        )}
        {IS_NATIVE_APP && loadState === 'signed_out' && (
          <SignedOutCard>Sign in to choose how ayna reaches you.</SignedOutCard>
        )}
        {IS_NATIVE_APP && loadState === 'error' && (
          <div style={{ background: 'var(--d-group)', border: 0, borderRadius: 20, padding: 18, textAlign: 'center' }}>
            <div style={{ fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.55, marginBottom: 12 }}>Couldn't load your preferences.</div>
            <div onClick={retry} style={{ display: 'inline-block', background: 'var(--ayna-cta-bg)', color: 'var(--ayna-cta-text)', fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', padding: '9px 16px', borderRadius: 99, cursor: 'pointer' }}>Try again</div>
          </div>
        )}
        {IS_NATIVE_APP && loadState === 'ready' && prefs && (
            <div style={{ background: 'var(--d-group)', border: 0, borderRadius: 20, padding: '4px 18px' }}>
              <ToggleRow first title="Notifications" sub="Recalls and safety flags on things you own." on={prefs.notificationsEnabled} onClick={() => patchField('notifications_enabled', !prefs.notificationsEnabled, 'notificationsEnabled')} />
              <ToggleRow title="Updates" sub="New matches and restocks, weekly digest." on={prefs.updatesEnabled} onClick={() => patchField('updates_enabled', !prefs.updatesEnabled, 'updatesEnabled')} />
              <DrillRow title="Channels & quiet hours" sub={channelsSummary} onClick={onOpenChannels} />
            </div>
        )}
        <SectionLabel>AI & personalization</SectionLabel>
        {loadState === 'ready' && prefs && <div style={{ background: 'var(--d-group)', border: 0, borderRadius: 20, padding: '4px 18px' }}>
          <ToggleRow first title="Personalize with my data" sub="Your quiz answers, cycle logs and connected health data shape your matches and Ask ayna replies. Off: none of it is used." on={personalizeWithData} onClick={handlePersonalizeToggle} />
          <ToggleRow title="Use my health data in my matches" sub={!personalizeWithData ? 'Turn on Personalize with my data first.' : healthPref.on ? 'Sleep and cycle trends from apps like Apple Health can move picks up inside goals you chose. Never a new goal, never past safety, never shared with brands.' : 'Off. Matches use only your answers. Your health data still shows in your insights.'} on={personalizeWithData && healthPref.on} onClick={() => { if (personalizeWithData) healthPref.set(!healthPref.on).then((ok) => { if (!ok) showToast(friendlyPreferencesError('save_failed')); }); }} />
        </div>}

        {/* Clearing Ask Ayna history is purely local (in-memory chat state in
            MobileApp.jsx, nothing is stored server-side for this feature),
            so unlike the toggles above it needs no account and works whether
            or not the fetch above succeeded. */}
        <div style={{ background: 'var(--d-group)', border: 0, borderRadius: 20, padding: '4px 18px', marginTop: loadState === 'ready' ? 20 : 0 }}>
          <div onClick={() => setClearHistoryConfirm(true)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '17px 0', cursor: 'pointer' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 'calc(17px * var(--ayna-text-scale, 1))', color: 'var(--ayna-accent-dark)' }}>Clear Ask ayna history</div>
              <div style={{ fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', marginTop: 3, lineHeight: 1.45 }}>
                {askAynaHistoryCount} conversation{askAynaHistoryCount === 1 ? '' : 's'} this session. Deleted for good, not archived.
              </div>
            </div>
            <ChevronIcon />
          </div>
          {clearHistoryConfirm && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '0 0 14px' }}>
              <div
                onClick={() => setClearHistoryConfirm(false)}
                style={{ fontSize: 'calc(13px * var(--ayna-text-scale, 1))', fontWeight: 500, color: 'var(--ayna-text-muted)', cursor: 'pointer', padding: '6px 12px' }}
              >
                Cancel
              </div>
              <div
                onClick={handleClearHistory}
                style={{ fontSize: 'calc(13px * var(--ayna-text-scale, 1))', fontWeight: 500, color: 'var(--ayna-accent-dark)', cursor: 'pointer', padding: '6px 12px', background: 'rgba(180,64,42,.1)', borderRadius: 99, flex: 'none' }}
              >
                Yes, clear it
              </div>
            </div>
          )}
        </div>
        <div style={{ fontWeight: 500, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)', lineHeight: 1.5, margin: '10px 2px 0' }}>
          Analytics choices are in Privacy & data.
        </div>

        <SectionLabel>Newsletter</SectionLabel>
        {/* Always visible regardless of the notification-preferences backend's
            load state below, Substack subscription has nothing to do with
            being signed into Ayna. */}
        <div style={{ background: 'var(--d-group)', border: 0, borderRadius: 20, padding: '4px 18px', marginBottom: 20 }}>
          <div
            onClick={handleJoinNewsletter}
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '17px 0', cursor: 'pointer' }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 'calc(17px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)' }}>Join newsletter</div>
                {newsletterConfirmed && (
                  <div style={{ fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', fontWeight: 500, color: 'var(--ayna-heading)', background: 'var(--ayna-chip-bg)', padding: '2px 8px', borderRadius: 99 }}>Subscribed</div>
                )}
              </div>
              <div style={{ fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', marginTop: 3, lineHeight: 1.45 }}>
                {newsletterConfirmed ? "You're on the list, The Mirror lands monthly." : 'The Mirror, one letter a month, no products pushed.'}
              </div>
            </div>
            <ExternalLinkIcon />
          </div>
          {awaitingConfirm && !newsletterConfirmed && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '0 0 14px' }}>
              <div style={{ fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)' }}>Subscribed on Substack?</div>
              <div
                onClick={handleConfirmSubscribed}
                style={{ fontSize: 'calc(13px * var(--ayna-text-scale, 1))', fontWeight: 500, color: 'var(--ayna-heading)', cursor: 'pointer', padding: '6px 12px', background: 'var(--ayna-chip-bg)', borderRadius: 99, flex: 'none' }}
              >
                Yes, I'm in
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop: 20, fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.55, textAlign: 'center', padding: '0 10px' }}>Ayna never sells your health data.</div>

        {toast && (
          <div style={{ position: 'fixed', left: 20, right: 20, bottom: 24, background: 'var(--ayna-heading)', color: '#FFEDAC', fontSize: 'calc(13px * var(--ayna-text-scale, 1))', fontWeight: 500, padding: '12px 16px', borderRadius: 14, textAlign: 'center', boxShadow: '0 14px 30px -12px rgba(180,64,42,.5)' }}>
            {toast}
          </div>
        )}
        <LegalFooter />
      </div>
    </div>
  );
}

// Split out of PreferencesScreen so "delivery channel" and "quiet hours"
// both real, account-scoped fields on the same notification_preferences row
//, get their own focused screen, matching the design's IA. Owns its own
// fetch/patch rather than receiving `prefs` as a prop from PreferencesScreen,
// since the two screens are never mounted at the same time (screenStack
// navigation swaps one for the other), sharing state would need lifting it
// to the orchestrator for no real benefit.
function ChannelsScreen({ onBack }) {
  const [loadState, setLoadState] = useState('loading');
  const [prefs, setPrefs] = useState(null);
  const [toast, setToast] = useState('');
  const [phoneVerifyOpen, setPhoneVerifyOpen] = useState(false);

  const fetchPrefs = () => {
    fetchNotificationPreferences()
      .then((data) => { setPrefs(data); setLoadState('ready'); })
      .catch((e) => setLoadState(e instanceof NotSignedInError ? 'signed_out' : 'error'));
  };

  useEffect(() => { fetchPrefs(); }, []);

  const retry = () => {
    setLoadState('loading');
    fetchPrefs();
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3500);
  };

  const patchField = (apiField, value, clientField) => {
    const previous = prefs;
    setPrefs((p) => ({ ...p, [clientField]: value }));
    patchNotificationPreferences({ [apiField]: value }).catch((e) => {
      setPrefs(previous);
      showToast(friendlyPreferencesError(e.code || e.message));
    });
  };

  const selectChannel = (key) => {
    if (!prefs || key === prefs.deliveryChannel) return;
    if (key === 'sms' && !prefs.phoneVerified) {
      setPhoneVerifyOpen(true);
      return;
    }
    patchField('delivery_channel', key, 'deliveryChannel');
  };

  const patchQuietHoursTime = (field, value) => {
    if (!prefs || !value) return;
    patchField(field, value, field === 'quiet_hours_start' ? 'quietHoursStart' : 'quietHoursEnd');
  };

  if (phoneVerifyOpen) {
    return (
      <PhoneVerifyPanel
        onBack={() => setPhoneVerifyOpen(false)}
        onVerified={() => {
          setPhoneVerifyOpen(false);
          setPrefs((p) => (p ? { ...p, phoneVerified: true, deliveryChannel: 'sms' } : p));
          patchNotificationPreferences({ delivery_channel: 'sms' }).catch((e) => {
            showToast(friendlyPreferencesError(e.code || e.message));
          });
        }}
      />
    );
  }

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <BackHeader title="Channels & quiet hours" onBack={onBack} />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '0 20px 30px' }}>
        {loadState === 'loading' && (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--ayna-text-muted)', fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))' }}>Loading…</div>
        )}
        {loadState === 'signed_out' && (
          <SignedOutCard>Sign in to manage channels and quiet hours.</SignedOutCard>
        )}
        {loadState === 'error' && (
          <div style={{ background: 'var(--d-group)', marginTop: 16, border: 0, borderRadius: 20, padding: 18, textAlign: 'center' }}>
            <div style={{ fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.55, marginBottom: 12 }}>Couldn't load this.</div>
            <div onClick={retry} style={{ display: 'inline-block', background: 'var(--ayna-cta-bg)', color: 'var(--ayna-cta-text)', fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', padding: '9px 16px', borderRadius: 99, cursor: 'pointer' }}>Try again</div>
          </div>
        )}
        {loadState === 'ready' && prefs && (
          <>
            <SectionLabel>Delivery channel</SectionLabel>
            <div style={{ background: 'var(--d-group)', border: 0, borderRadius: 20, padding: '5px 18px' }}>
              {[
                ['push', 'Push', null],
                ['sms', 'Text message', prefs.phoneVerified ? 'Verified' : 'Verify to use'],
                ['email', 'Email only', null],
              ].map(([key, label, badge], i) => (
                <div key={key} onClick={() => selectChannel(key)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '15px 0', borderTop: i === 0 ? 'none' : '1px solid var(--ayna-border)', cursor: 'pointer' }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid ' + (prefs.deliveryChannel === key ? 'var(--ayna-cta-bg)' : 'var(--ayna-border)'), flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {prefs.deliveryChannel === key && <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--ayna-cta-bg)' }} />}
                  </div>
                  <div style={{ flex: 1, lineHeight: 1.45, fontSize: 'calc(15px * var(--ayna-text-scale, 1))', fontWeight: 400, color: 'var(--ayna-text)' }}>{label}</div>
                  {badge && <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 500, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', border: '1px solid var(--ayna-border)', borderRadius: 99, padding: '3px 7px' }}>{badge}</div>}
                </div>
              ))}
            </div>

            <SectionLabel>Quiet hours</SectionLabel>
            <div style={{ background: 'var(--d-group)', border: 0, borderRadius: 20, padding: '4px 18px' }}>
              <ToggleRow first title="Quiet hours" sub="Hold notifications overnight; they'll still be there when it opens." on={prefs.quietHoursEnabled} onClick={() => patchField('quiet_hours_enabled', !prefs.quietHoursEnabled, 'quietHoursEnabled')} />
              {prefs.quietHoursEnabled && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0 16px' }}>
                  <label style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', marginBottom: 4 }}>From</div>
                    <input
                      type="time"
                      value={prefs.quietHoursStart}
                      onChange={(e) => patchQuietHoursTime('quiet_hours_start', e.target.value)}
                      style={{ width: '100%', border: '1px solid var(--ayna-border)', borderRadius: 12, padding: '9px 10px', fontWeight: 400, lineHeight: 1.45, fontSize: 'calc(15px * var(--ayna-text-scale, 1))', background: 'var(--ayna-bg-alt)', color: 'var(--ayna-text)', boxSizing: 'border-box' }}
                    />
                  </label>
                  <label style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', marginBottom: 4 }}>To</div>
                    <input
                      type="time"
                      value={prefs.quietHoursEnd}
                      onChange={(e) => patchQuietHoursTime('quiet_hours_end', e.target.value)}
                      style={{ width: '100%', border: '1px solid var(--ayna-border)', borderRadius: 12, padding: '9px 10px', fontWeight: 400, lineHeight: 1.45, fontSize: 'calc(15px * var(--ayna-text-scale, 1))', background: 'var(--ayna-bg-alt)', color: 'var(--ayna-text)', boxSizing: 'border-box' }}
                    />
                  </label>
                </div>
              )}
            </div>
          </>
        )}

        {toast && (
          <div style={{ position: 'fixed', left: 20, right: 20, bottom: 24, background: 'var(--ayna-heading)', color: '#FFEDAC', fontSize: 'calc(13px * var(--ayna-text-scale, 1))', fontWeight: 500, padding: '12px 16px', borderRadius: 14, textAlign: 'center', boxShadow: '0 14px 30px -12px rgba(180,64,42,.5)' }}>
            {toast}
          </div>
        )}
        <LegalFooter />
      </div>
    </div>
  );
}

/* ------------------------------ Settings ------------------------------ */

// One line-icon set for settings rows (24px grid, 1.8 stroke).
const SET_ICONS = {
  appearance: <><circle cx="12" cy="12" r="8" /><path d="M12 4a8 8 0 0 0 0 16Z" fill="currentColor" stroke="none" /></>,
  how: <><path d="M4 6h16M7 12h10M10 18h4" /></>,
  about: <><circle cx="12" cy="12" r="8" /><path d="M12 11v5M12 8h.01" /></>,
  brands: <><path d="M5 9h14l-1 11H6L5 9Z" /><path d="M9 9V7a3 3 0 0 1 6 0v2" /></>,
  account: <><circle cx="12" cy="9" r="3.5" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></>,
  privacy: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8.5 10V8a3.5 3.5 0 0 1 7 0v2" /></>,
  legal: <><path d="M7 3h7l4 4v14H7Z" /><path d="M14 3v4h4M10 12h5M10 16h5" /></>,
  texts: <><path d="M5 5h14v10H10l-4 4v-4H5Z" /><path d="M9 10h.01M12 10h.01M15 10h.01" /></>,
  contact: <><rect x="4" y="6" width="16" height="12" rx="2" /><path d="m4.5 7 7.5 6 7.5-6" /></>,
};

function SettingsScreen({ onBack, onOpenTexts, onOpenPreferences, onOpenHowItWorks, onOpenAboutAyna, onOpenContact, onOpenAccountInfo, onOpenPrivacyData, onOpenLegal, authUser, onSignOut, onSignIn }) {
  const groups = [
    ['Preferences', 'butter', [{ icon: 'appearance', title: 'Appearance & preferences', onClick: onOpenPreferences }, ...(onOpenTexts ? [{ icon: 'texts', title: 'Text messages', onClick: onOpenTexts }] : [])]],
    ['About', 'pink', [{ icon: 'how', title: 'How it works', onClick: onOpenHowItWorks }, { icon: 'about', title: 'About ayna', onClick: onOpenAboutAyna }, { icon: 'brands', title: 'Brand partnerships', href: BRAND_PARTNERSHIPS_URL }]],
    ['Account', 'mint', [{ icon: 'account', title: 'Account information', onClick: onOpenAccountInfo }, { icon: 'privacy', title: 'Privacy & data', onClick: onOpenPrivacyData }, { icon: 'legal', title: 'Legal', onClick: onOpenLegal }, { icon: 'contact', title: 'Contact', onClick: onOpenContact }]],
  ];
  const rowInner = (row) => <>
    <span className="ay-set-icon" aria-hidden="true"><svg viewBox="0 0 24 24">{SET_ICONS[row.icon]}</svg></span>
    <span className="ay-set-title">{row.title}</span>
    {row.href ? <ExternalLinkIcon /> : <ChevronIcon />}
  </>;
  return <div className="ayna-settings-index" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
    <BackHeader title="Settings" onBack={onBack} />
    <div className="ayna-settings-scroll ay-set-scroll">
      {groups.map(([title, tone, rows]) => <section key={title} aria-label={title} className={`ay-set-group is-${tone}`}>
        <h2>{title}</h2>
        <div className="ay-set-card">
          {rows.map((row) => row.href
            ? <a key={row.title} className="ay-set-row" href={row.href} target="_blank" rel="noopener noreferrer">{rowInner(row)}</a>
            : <button type="button" key={row.title} className="ay-set-row" onClick={row.onClick}>{rowInner(row)}</button>)}
        </div>
      </section>)}
      <button type="button" className={`ayna-account-session ay-set-session${authUser ? ' is-out' : ''}`} onClick={authUser ? onSignOut : onSignIn}>{authUser ? 'Sign out' : 'Sign in'}</button>
      <LegalFooter />
    </div>
  </div>;
}

/* ------------------------------ Text messages ------------------------------ */
// Backed by /api/sms (api/sms.js). Consent wording follows carrier (CTIA) rules.
const SMS_ERRORS = {
  invalid_phone_number: 'That number doesn’t look right. Use a US mobile number.',
  invalid_or_expired_code: 'That code didn’t work or has expired. Send a new one.',
  phone_already_linked: 'That number is already linked to another ayna account.',
  rate_limited: 'Too many tries. Wait a few minutes, then try again.',
  too_many_attempts: 'Too many tries. Wait a few minutes, then try again.',
  sms_not_configured: 'Text messages aren’t switched on yet.',
  not_signed_in: 'Sign in again to manage your texts.',
  auth_required: 'Sign in again to manage your texts.',
  invalid_session: 'Sign in again to manage your texts.',
  network: 'Couldn’t reach ayna. Check your connection and try again.',
  texts_stopped: 'You replied STOP. Text START to ayna first, then try again.',
  phone_not_verified: 'Verify your number first.',
};
const smsError = (e) => SMS_ERRORS[e?.code] || 'We couldn’t update text alerts. Check your connection and try again.';
const SMS_PREF_ROWS = [
  ['reminders', 'Reminders', 'Restock and routine reminders you set up.'],
  ['orders', 'Order updates', 'When an order ships or needs you.'],
  ['chat', 'Text ayna', 'Ask ayna questions by text, up to 5 texts a day.'],
  ['healthDetails', 'Include health details', 'Texts aren’t as private as the app. Leave this off to keep texts general.'],
];

function TextMessagesScreen({ onBack, authUser }) {
  const [status, setStatus] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // Required-field errors on the number step (shown inline, not by
  // disabling Send code, so she can tap it and see what's missing).
  const [fieldErrors, setFieldErrors] = useState({});
  const load = () => {
    setLoadError('');
    fetchSmsStatus().then(setStatus).catch((e) => setLoadError(smsError(e)));
  };
  useEffect(() => { if (authUser) load(); }, [authUser]);
  const run = async (fn) => {
    setBusy(true); setError('');
    try { await fn(); } catch (e) { setError(smsError(e)); } finally { setBusy(false); }
  };
  const SMS_IDS = { phone: 'ay-sms-phone', agree: 'ay-sms-agree' };
  const send = () => {
    const next = {};
    if (phone.replace(/\D/g, '').length < 10) next.phone = phone.trim() ? 'Check your number. It needs all 10 digits, like (555) 555-0123.' : 'Add your mobile number.';
    if (!agreed) next.agree = 'Tick this box to agree to get texts from ayna.';
    setFieldErrors(next);
    const first = firstErrorKey(next, ['phone', 'agree']);
    if (first) {
      setError('');
      warnHaptic();
      window.requestAnimationFrame(() => revealField(document.getElementById(SMS_IDS[first])));
      return;
    }
    run(async () => { await startSmsVerify(phone.trim()); setSent(true); });
  };
  const smsSummary = errorSummary(fieldErrors, [], 'get a code');
  const verify = () => run(async () => {
    await checkSmsVerify(phone.trim(), code.trim());
    setSent(false); setCode('');
    setStatus(await fetchSmsStatus());
  });
  const toggle = (key) => run(async () => {
    const prefs = { ...status.prefs, [key]: !status.prefs[key] };
    const body = status.prefsSaved ? { [key]: prefs[key] } : prefs;
    await saveSmsPrefs(body);
    setStatus((s) => ({ ...s, prefs, prefsSaved: true }));
  });
  const remove = () => run(async () => { await removeSmsPhone(); setStatus(await fetchSmsStatus()); setPhone(''); });

  let content;
  if (!authUser) content = <SignedOutCard>Sign in to get texts from ayna.</SignedOutCard>;
  else if (loadError) content = <div className="ay-sms-card"><p className="ay-hc-error" role="alert">{loadError}</p><button type="button" className="ay-qc-skip" onClick={load}>Try again</button></div>;
  else if (!status) content = <p className="ay-sms-muted" role="status">Loading…</p>;
  else if (!status.configured) content = <div className="ay-sms-card"><h2>Text messages aren’t switched on yet</h2><p className="ay-sms-muted">We’re still setting up texts. Your notification settings in the app keep working in the meantime.</p></div>;
  else if (!status.verified) {
    content = (
      <div className="ay-sms-card">
        <h2>Get texts from ayna</h2>
        <p className="ay-sms-muted">Reminders, order updates and a way to text ayna. You choose which ones.</p>
        {!sent ? <>
          <label htmlFor="ay-sms-phone">Mobile number</label>
          <input id="ay-sms-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="(555) 555-0123" value={phone}
            className={fieldErrors.phone ? 'is-invalid' : undefined}
            aria-invalid={fieldErrors.phone ? true : undefined} aria-describedby={fieldErrors.phone ? 'ay-sms-phone-err' : undefined}
            onChange={(e) => { setPhone(e.target.value); setFieldErrors((prev) => clearError(prev, 'phone')); }} />
          <InlineError id="ay-sms-phone-err">{fieldErrors.phone}</InlineError>
          <label className={`ay-sms-agree${fieldErrors.agree ? ' ay-check-invalid' : ''}`}>
            <input id="ay-sms-agree" type="checkbox" checked={agreed}
              aria-invalid={fieldErrors.agree ? true : undefined} aria-describedby={fieldErrors.agree ? 'ay-sms-agree-err' : undefined}
              onChange={(e) => { setAgreed(e.target.checked); setFieldErrors((prev) => clearError(prev, 'agree')); }} />
            <span>I agree to get texts from ayna at this number, including reminders, order updates and replies when I text ayna. Msg &amp; data rates may apply. Message frequency varies. Reply STOP to opt out, HELP for help. See our <a href="https://www.aynahealth.co/terms-of-use" target="_blank" rel="noopener noreferrer">Terms</a> and <a href="https://www.aynahealth.co/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.</span>
          </label>
          <InlineError id="ay-sms-agree-err">{fieldErrors.agree}</InlineError>
          <InlineError className="ay-inline-err--summary">{smsSummary}</InlineError>
          <button type="button" className="ay-qc-primary" disabled={busy} onClick={send}>{busy ? 'Sending…' : 'Send code'}</button>
        </> : <>
          <label htmlFor="ay-sms-code">Code we texted to {phone}</label>
          <input id="ay-sms-code" inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
          <div className="ay-sms-row">
            <button type="button" className="ay-qc-primary" disabled={busy || code.length < 4} onClick={verify}>{busy ? 'Checking…' : 'Verify'}</button>
            <button type="button" className="ay-qc-skip" disabled={busy} onClick={() => { setSent(false); setCode(''); setError(''); }}>Change number</button>
          </div>
        </>}
        {error && <p className="ay-hc-error" role="alert">{error}</p>}
      </div>
    );
  } else {
    content = <>
      <div className="ay-sms-card">
        <p className="ay-sms-phone"><span>Texts go to</span><b>{status.phone}</b></p>
        {status.stopped && <p className="ay-sms-note">You replied STOP, so texts are paused. Text START to {status.textNumber || 'ayna'} to turn them back on.</p>}
      </div>
      <SectionLabel>What we text you</SectionLabel>
      <div className="ay-sms-card ay-sms-prefs">
        {SMS_PREF_ROWS.map(([key, title, sub], i) => <ToggleRow key={key} first={i === 0} title={title} sub={sub} on={Boolean(status.prefs?.[key])} onClick={() => !busy && !status.stopped && toggle(key)} />)}
        {error && <p className="ay-hc-error" role="alert">{error}</p>}
      </div>
      {status.prefs?.chat && status.textNumber && !status.stopped && <p className="ay-sms-muted ay-sms-chat">Text ayna at <a href={`sms:${status.textNumber}`}>{status.textNumber}</a>.</p>}
      <button type="button" className="ay-sms-remove" disabled={busy} onClick={remove}>Remove this number</button>
    </>;
  }
  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <BackHeader title="Text messages" onBack={onBack} />
      <div className={`ayna-settings-scroll ay-sms${status?.stopped ? ' is-stopped' : ''}`}>{content}</div>
    </div>
  );
}

/* ------------------------------ Privacy & data ------------------------------ */

const DELETE_ACCOUNT_MAILTO = 'mailto:puloma@aynahealth.co?subject=Account%20Deletion%20Request';
const PRIVACY_POLICY_URL = 'https://www.aynahealth.co/privacy-policy';
const TERMS_URL = 'https://www.aynahealth.co/terms-of-use';

// Real toggle: PostHog's own opt-out API (posthog-js exposes
// opt_out_capturing/opt_in_capturing/has_opted_out_capturing, see
// src/main.jsx for the real init). Not a stored per-user backend flag, but
// a genuine SDK call, not invented state, and this app has no analytics
// consent UI anywhere yet, so this is the first place it's wired up.
// window.posthog may be undefined if VITE_PUBLIC_POSTHOG_KEY isn't set
// (e.g. this dev environment), every call below is guarded for that.
function isAnalyticsOptedOut() {
  try { return typeof window !== 'undefined' && window.posthog?.has_opted_out_capturing?.() === true; } catch { return false; }
}

function PrivacyDataScreen({ onBack, onOpenDeleteAccount, onOpenHealthData }) {
  const [analyticsOptedOut, setAnalyticsOptedOut] = useState(isAnalyticsOptedOut);

  const toggleAnalytics = () => {
    const nextOptedOut = !analyticsOptedOut;
    setAnalyticsOptedOut(nextOptedOut);
    try {
      if (nextOptedOut) window.posthog?.opt_out_capturing?.();
      else window.posthog?.opt_in_capturing?.();
    } catch { /* posthog not initialized in this environment */ }
  };

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <BackHeader title="Privacy & data" onBack={onBack} />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '8px 20px 30px' }}>
        <div style={{ fontWeight: 400, fontSize: 'calc(15px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.45, marginBottom: 20 }}>
          Your health answers are the most sensitive thing you give us. Here is everything we hold, and every way to take it back.
        </div>

        <div style={{ margin: '0 0 11px', fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-accent-dark)' }}>Your data</div>
        <div style={{ background: 'var(--d-group)', border: 0, borderRadius: 20, padding: '0 18px' }}>
          {onOpenHealthData && <AccountRow
            borderTop={false}
            title="Connected health data"
            sub="See what's connected, stop syncing, or delete health data ayna holds."
            onClick={onOpenHealthData}
          />}
          <AccountRow
            borderTop={Boolean(onOpenHealthData)}
            title={<span style={{ color: 'var(--ayna-heading)' }}>Delete my account & data</span>}
            sub="We'll process it within a week, nothing kept after."
            onClick={onOpenDeleteAccount}
          />
        </div>
        <div style={{ fontWeight: 500, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)', lineHeight: 1.55, marginTop: 9, padding: '0 4px' }}>
          Deletion removes your account and health answers from our active systems. We may keep limited records where the law requires it, never your health data.
        </div>

        <div style={{ margin: '24px 0 11px', fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-accent-dark)' }}>What you share</div>
        <div style={{ background: 'var(--d-group)', border: 0, borderRadius: 20, padding: '4px 18px' }}>
          <ToggleRow
            first
            title="Share data for analytics"
            sub="Anonymised product usage, so we can see which screens confuse people. Never your health answers."
            on={!analyticsOptedOut}
            onClick={toggleAnalytics}
          />
        </div>

        <div style={{ background: 'var(--d-group)', marginTop: 14, border: 0, borderRadius: 20, padding: '16px 18px' }}>
          <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-accent-dark)', marginBottom: 8 }}>How AI is used</div>
          <div style={{ fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.6 }}>
            Ask ayna and match explanations are powered by a third-party AI provider (Anthropic). Your questions and relevant profile details are shared with them to generate a response, never sold, and never used to train anyone else's model.
          </div>
          <div onClick={() => window.open(PRIVACY_POLICY_URL, '_blank', 'noopener,noreferrer')} style={{ fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-heading)', fontWeight: 500, marginTop: 10, cursor: 'pointer' }}>
            Read the full privacy policy
          </div>
        </div>

        <div style={{ fontWeight: 500, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)', lineHeight: 1.55, marginTop: 16, padding: '0 4px' }}>
          Privacy questions? Email <a href="mailto:puloma@aynahealth.co">puloma@aynahealth.co</a>.
        </div>
        <LegalFooter />
      </div>
    </div>
  );
}

/* ---------------------------------- Legal ---------------------------------- */

function LegalScreen({ onBack, onOpenConsumerHealthData, onOpenOpenSourceLicenses, onOpenTypefaces, onOpenResearchSources }) {
  const licenseFamilies = summarizeLicenses();
  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <BackHeader title="Legal" onBack={onBack} />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '8px 20px 30px' }}>
        <div style={{ margin: '4px 0 11px', fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-accent-dark)' }}>Policies</div>
        <div style={{ background: 'var(--d-group)', border: 0, borderRadius: 20, padding: '0 18px' }}>
          <AccountRow
            title="Privacy Policy"
            sub="How we collect, use and protect your information."
            borderTop={false}
            onClick={() => window.open(PRIVACY_POLICY_URL, '_blank', 'noopener,noreferrer')}
          />
          <AccountRow
            title="Terms of Service"
            sub="The rules for using ayna."
            onClick={() => window.open(TERMS_URL, '_blank', 'noopener,noreferrer')}
          />
          <AccountRow
            title="Consumer Health Data Policy"
            sub="Required under Washington's MHMDA."
            onClick={onOpenConsumerHealthData}
          />
        </div>

        <div style={{ margin: '24px 0 11px', fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-accent-dark)' }}>Attributions</div>
        <div style={{ background: 'var(--d-group)', border: 0, borderRadius: 20, padding: '0 18px' }}>
          <AccountRow
            title="Open-source licences"
            sub={`${OPEN_SOURCE_PACKAGES.length} packages · ${licenseFamilies.join(', ')}.`}
            borderTop={false}
            onClick={onOpenOpenSourceLicenses}
          />
          <AccountRow title="Typefaces" sub="ayna Display, Figtree and Bricolage Grotesque, Google Fonts, SIL Open Font Licence." onClick={onOpenTypefaces} />
          <AccountRow title="Research and data sources" sub="Where ayna's product and safety information comes from." onClick={onOpenResearchSources} />
        </div>

        <div style={{ background: 'var(--d-group)', marginTop: 22, border: 0, borderRadius: 20, padding: '17px 18px' }}>
          <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-accent-dark)', marginBottom: 8 }}>Not medical advice</div>
          <div style={{ fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.6 }}>
            Ayna is a discovery and education tool. Nothing here diagnoses, treats or prevents a condition, and no match replaces a conversation with your clinician.
          </div>
        </div>

        <div style={{ fontWeight: 500, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)', lineHeight: 1.55, marginTop: 16, padding: '0 4px' }}>
          Questions about these policies? Email <a href="mailto:puloma@aynahealth.co">puloma@aynahealth.co</a>.
        </div>

        <div style={{ textAlign: 'center', marginTop: 22, fontFamily: "var(--ayna-font-ui)", fontWeight: 500, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.9 }}>
          AYNA HEALTH, INC.<br />DELAWARE, USA<br />APP 0.9.4
        </div>
        <LegalFooter />
      </div>
    </div>
  );
}

/* ------------------------ Consumer Health Data Policy ------------------------ */

// Real disclosures reflecting how ayna actually works today, the third
// parties named here (Supabase, Anthropic/OpenAI/Gemini, PostHog, Twilio,
// Resend) are the app's actual real integrations (see .env.example), and
// the rights described map to screens that already exist and work (Manage
// my data / Download my data, the analytics opt-out toggle in Privacy &
// data, account deletion via the email below) rather than promises of
// features that don't exist yet.
//
// This is a good-faith draft written to cover Washington's My Health My
// Data Act's (MHMDA) required disclosures. It has NOT been reviewed by a
// lawyer, that review should happen before this is relied on as ayna's
// actual compliance policy, the same as the Termly-generated Privacy
// Policy/Terms of Service linked above were presumably reviewed before
// publishing.
const HEALTH_DATA_PROCESSORS = [
  { initial: 'S', name: 'Supabase', role: 'Hosts your account and stored data.', bg: 'var(--ayna-border)', fg: 'var(--ayna-heading)' },
  { initial: 'A', name: 'Anthropic, OpenAI, Google', role: 'Generate product summaries and Ask Ayna answers.', bg: 'var(--ay-pink)', fg: 'var(--ay-ink)' },
  { initial: 'T', name: 'Twilio', role: 'Sends verification codes and opt-in safety-recall texts.', bg: 'var(--ayna-border)', fg: 'var(--ayna-heading)' },
  { initial: 'R', name: 'Resend', role: 'Delivers email, including contact-form messages.', bg: 'var(--ayna-border)', fg: 'var(--ayna-heading)' },
  { initial: 'P', name: 'PostHog', role: 'Anonymised usage analytics, off any time in Privacy & data.', bg: 'var(--ayna-border)', fg: 'var(--ayna-text-muted)' },
];

const HEALTH_DATA_RIGHTS = [
  { title: 'See or download what we hold', how: 'Email puloma@aynahealth.co, we will send it directly' },
  { title: 'Withdraw consent for analytics', how: 'Settings → Privacy & data → the analytics toggle' },
  { title: 'Delete your account and data', how: 'Email puloma@aynahealth.co, providers are directed too' },
];

function NumberedCard({ n, title, children }) {
  return (
    <div style={{ background: 'var(--d-group)', marginTop: 14, border: 0, borderRadius: 20, padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 26, height: 26, borderRadius: 99, background: 'var(--ay-pink)', color: 'var(--ay-ink)', fontFamily: "var(--ayna-font-ui)", fontWeight: 500, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>{n}</div>
        <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(17px * var(--ayna-text-scale, 1))', color: 'var(--ayna-heading)' }}>{title}</div>
      </div>
      {children}
    </div>
  );
}

function ConsumerHealthDataPolicyScreen({ onBack }) {
  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <BackHeader title="Health data policy" onBack={onBack} />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '6px 20px 30px' }}>
        <div style={{ background: 'var(--d-group)', position: 'relative', overflow: 'hidden', border: 0, borderRadius: 20, padding: 20 }}>
          <div style={{ position: 'absolute', right: -30, top: -34, width: 110, height: 110, borderRadius: 99, background: 'rgba(255,237,172,.4)' }} />
          <div style={{ position: 'relative', width: 38, height: 38, borderRadius: 99, background: 'var(--ayna-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 5px rgba(63,107,74,.14)' }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--ayna-heading)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v6c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6z" /><path d="M9 12l2 2 4-4" /></svg>
          </div>
          <div style={{ position: 'relative', fontFamily: "var(--ayna-font-display)", fontWeight: 400, fontSize: 'calc(22px * var(--ayna-text-scale, 1))', lineHeight: 1.15, marginTop: 13, color: 'var(--ayna-heading)' }}>Your health answers stay yours.</div>
          <div style={{ position: 'relative', fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', lineHeight: 1.6, color: 'var(--ayna-text-muted)', marginTop: 8 }}>We never sell them, and we never trade them for advertising. Here is the whole picture, in plain words.</div>
          <div style={{ position: 'relative', display: 'inline-flex', gap: 6, marginTop: 13 }}>
            <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 500, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', background: 'var(--ayna-surface)', color: 'var(--ayna-heading)', borderRadius: 99, padding: '5px 10px' }}>Effective 10 Sep 2026</div>
            <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 500, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', background: 'var(--ayna-surface)', color: 'var(--ayna-heading)', borderRadius: 99, padding: '5px 10px' }}>WA MHMDA</div>
          </div>
        </div>

        <NumberedCard n="01" title="What counts as health data">
          <div style={{ fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', lineHeight: 1.65, color: 'var(--ayna-text-muted)', marginTop: 11 }}>
            Anything linked to you that says something about your past, present or future physical or mental health, including reproductive and sexual health, conditions, diagnoses, symptoms, and whatever you tell Ask Ayna about any of it.
          </div>
        </NumberedCard>

        <NumberedCard n="02" title="What we collect, and why">
          <div style={{ fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', lineHeight: 1.65, color: 'var(--ayna-text-muted)', marginTop: 11 }}>
            Your intake answers, your questions to Ask Ayna, and the products you save. We use them to build your matches, explain why a product fits, and flag safety recalls on what you own, nothing else.
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
            {['Intake answers', 'Ask ayna', 'Saved products'].map((t) => (
              <div key={t} style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 500, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', background: 'var(--ayna-chip-bg)', color: 'var(--ayna-text-muted)', borderRadius: 99, padding: '5px 9px' }}>{t}</div>
            ))}
          </div>
        </NumberedCard>

        <NumberedCard n="03" title="Who touches it">
          <div style={{ fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', lineHeight: 1.65, color: 'var(--ayna-text-muted)', marginTop: 11 }}>Five service providers, each doing exactly one job for us.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 13 }}>
            {HEALTH_DATA_PROCESSORS.map((p) => (
              <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 11, background: 'var(--ayna-chip-bg)', borderRadius: 18, padding: '11px 13px' }}>
                <div style={{ width: 34, height: 34, borderRadius: 12, flex: 'none', background: p.bg, color: p.fg, fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(17px * var(--ayna-text-scale, 1))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{p.initial}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 'calc(13px * var(--ayna-text-scale, 1))', fontWeight: 500, color: 'var(--ayna-text)' }}>{p.name}</div>
                  <div style={{ fontWeight: 500, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.45, marginTop: 2 }}>{p.role}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontWeight: 500, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)', lineHeight: 1.55, marginTop: 11 }}>We do not sell your health data, and we do not share it for advertising.</div>
        </NumberedCard>

        <NumberedCard n="04" title="What you can ask for">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 13 }}>
            {HEALTH_DATA_RIGHTS.map((r) => (
              <div key={r.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 20, height: 20, borderRadius: 99, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', marginTop: 1 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--ayna-heading)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 'calc(13px * var(--ayna-text-scale, 1))', fontWeight: 500, color: 'var(--ayna-text)' }}>{r.title}</div>
                  <div style={{ fontWeight: 500, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.5, marginTop: 2 }}>{r.how}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontWeight: 500, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)', lineHeight: 1.55, marginTop: 13 }}>We answer within 45 days, and never lock you out of ayna for asking.</div>
        </NumberedCard>

        <div style={{ background: 'var(--d-group)', marginTop: 14, display: 'flex', alignItems: 'flex-start', gap: 12, border: 0, borderRadius: 20, padding: '16px 18px' }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--ayna-heading)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', marginTop: 1 }}><path d="M12 21s-7-5.1-7-10a7 7 0 1 1 14 0c0 4.9-7 10-7 10z" /><path d="M4 4l16 16" /></svg>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 'calc(13px * var(--ayna-text-scale, 1))', fontWeight: 500, color: 'var(--ayna-heading)' }}>No geofencing. Ever.</div>
            <div style={{ fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.6, marginTop: 4 }}>We don't draw boundaries around clinics to collect your location, message you, or guess that you sought care.</div>
          </div>
        </div>

        <div style={{ marginTop: 14, background: '#3e2723', borderRadius: 24, padding: 19, color: '#FFEDAC' }}>
          <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(17px * var(--ayna-text-scale, 1))' }}>Questions, or an appeal?</div>
          <div style={{ fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', lineHeight: 1.6, color: 'var(--ayna-border)', marginTop: 7 }}>If we deny a request, reply to our decision email and a person will look at it again within 45 days.</div>
          <a
            href={DELETE_ACCOUNT_MAILTO.replace('subject=Account%20Deletion%20Request', 'subject=Consumer%20Health%20Data%20Question')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 14, background: 'var(--ayna-surface)', color: 'var(--ayna-heading)', borderRadius: 99, padding: '11px 17px', fontSize: 'calc(13px * var(--ayna-text-scale, 1))', fontWeight: 500, textDecoration: 'none' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3e2723" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M4 7l8 6 8-6" /></svg>
            puloma@aynahealth.co
          </a>
        </div>
        <LegalFooter />
      </div>
    </div>
  );
}

/* ---------------------------- Open-source licences ---------------------------- */

const LICENSE_GROUP_STYLES = {
  MIT: { tint: 'var(--ay-pink)', ink: 'var(--ay-ink)' },
  'Apache-2.0': { tint: 'var(--ayna-border)', ink: 'var(--ayna-heading)' },
  '(MPL-2.0 OR Apache-2.0)': { tint: 'var(--ayna-border)', ink: 'var(--ayna-heading)' },
  '(Apache-2.0 AND MIT)': { tint: 'var(--ayna-border)', ink: 'var(--ayna-heading)' },
  '0BSD': { tint: 'var(--ayna-border)', ink: 'var(--ayna-text-muted)' },
};

function downloadText(content, filename) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function buildLicensesText(grouped) {
  const lines = ['ayna, open-source licences', `Generated ${new Date().toISOString().slice(0, 10)}`, ''];
  for (const [license, packages] of grouped) {
    lines.push(`${license} (${packages.length})`, '-'.repeat(40));
    for (const pkg of packages) lines.push(`  ${pkg.name}@${pkg.version}`);
    lines.push('');
  }
  return lines.join('\n');
}

function OpenSourceLicensesScreen({ onBack }) {
  const grouped = useMemo(() => {
    const byLicense = new Map();
    for (const pkg of OPEN_SOURCE_PACKAGES) {
      if (!byLicense.has(pkg.license)) byLicense.set(pkg.license, []);
      byLicense.get(pkg.license).push(pkg);
    }
    return [...byLicense.entries()].sort((a, b) => b[1].length - a[1].length);
  }, []);

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <BackHeader title="Open-source licences" onBack={onBack} />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '6px 20px 30px' }}>
        <div style={{ background: 'var(--d-group)', position: 'relative', overflow: 'hidden', border: 0, borderRadius: 20, padding: '20px 20px 18px' }}>
          <div style={{ position: 'absolute', right: -34, top: -30, width: 118, height: 118, borderRadius: 99, background: 'rgba(255,237,172,.42)' }} />
          <div style={{ position: 'absolute', right: 26, bottom: -42, width: 74, height: 74, borderRadius: 99, background: 'rgba(255,237,172,.3)' }} />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'baseline', gap: 9 }}>
            <div style={{ fontFamily: "var(--ayna-font-display)", fontWeight: 400, fontSize: 'calc(28px * var(--ayna-text-scale, 1))', lineHeight: 1.15, color: 'var(--ayna-heading)' }}>{OPEN_SOURCE_PACKAGES.length}</div>
            <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ay-ink-soft)', paddingBottom: 5 }}>packages<br />inside ayna</div>
          </div>
          <div style={{ position: 'relative', fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', lineHeight: 1.6, color: 'var(--ayna-text-muted)', marginTop: 12, maxWidth: 250 }}>These are the ones actually bundled into what runs on your device, not build tooling.</div>
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 14, background: 'var(--ayna-surface)', borderRadius: 99, padding: '7px 13px 7px 10px', boxShadow: '0 1px 4px rgba(122,68,16,.12)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#F7BADD" style={{ flex: 'none' }}><path d="M12 21s-7.5-4.7-9.5-9A5.2 5.2 0 0 1 12 6.6 5.2 5.2 0 0 1 21.5 12c-2 4.3-9.5 9-9.5 9z" /></svg>
            <div style={{ fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-heading)', fontWeight: 500 }}>Thank you to everyone who maintains them</div>
          </div>
        </div>

        {grouped.map(([license, packages]) => {
          const style = LICENSE_GROUP_STYLES[license] || { tint: 'var(--ayna-chip-bg)', ink: 'var(--ayna-text-muted)' };
          return (
            <div key={license} style={{ margin: '22px 0 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 4px 9px' }}>
                <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', background: style.tint, color: style.ink, borderRadius: 99, padding: '5px 10px' }}>{license}</div>
                <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 500, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: style.ink, background: 'var(--ayna-surface)', border: `1px solid ${style.tint}`, borderRadius: 99, minWidth: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px' }}>{packages.length}</div>
                <div style={{ flex: 1, height: 1, background: 'var(--ayna-border)' }} />
              </div>
              <div style={{ background: 'var(--d-group)', border: 0, borderRadius: 20, padding: '6px 8px' }}>
                {packages.map((pkg, i) => (
                  <div key={pkg.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 10px', borderRadius: 14, boxShadow: i ? '0 -1px 0 var(--ayna-border)' : 'none' }}>
                    <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pkg.name}</div>
                    <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 500, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: style.ink, background: style.tint, borderRadius: 99, padding: '4px 8px', flex: 'none' }}>{pkg.version}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <div style={{ background: 'var(--d-group)', marginTop: 24, border: 0, borderRadius: 20, padding: '16px 18px', textAlign: 'center' }}>
          <div style={{ fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.6 }}>Full licence texts ship with every build.</div>
          <div
            onClick={() => downloadText(buildLicensesText(grouped), 'ayna-open-source-licences.txt')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 10, background: '#3e2723', color: '#FFEDAC', borderRadius: 99, padding: '10px 17px', fontSize: 'calc(13px * var(--ayna-text-scale, 1))', fontWeight: 500, cursor: 'pointer' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFEDAC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12" /><path d="M7 11l5 5 5-5" /><path d="M4 21h16" /></svg>
            Download licences.txt
          </div>
        </div>
        <LegalFooter />
      </div>
    </div>
  );
}

/* ---------------------------------- Typefaces ---------------------------------- */

// The faces the mobile app actually renders (brand kit, Oct 2026).
const TYPEFACES = [
  {
    key: 'serif', name: 'ayna Display', role: 'Headlines and big moments',
    designer: 'Colophon Foundry, for Google Fonts', weights: '400 and italic',
    font: "'ayna Display','Figtree',sans-serif", size: 26,
  },
  {
    key: 'sans', name: 'Figtree', role: 'Body copy and interface',
    designer: 'Colophon Foundry, for Google Fonts', weights: '400, 500, 600, 700, 800',
    font: "'Figtree',sans-serif", size: 21,
  },
  {
    key: 'bg', name: 'Bricolage Grotesque', role: 'The ayna wordmark',
    designer: 'Mathieu Triay, for Google Fonts', weights: '800',
    font: "'ayna Display',sans-serif", size: 22,
  },
];

const SIL_OFL_URL = 'https://scripts.sil.org/OFL';

function TypefaceRow({ face, open, onToggle }) {
  return (
    <div style={{ background: 'var(--d-group)', marginTop: 14, border: 0, borderRadius: 20, overflow: 'hidden' }}>
      <div onClick={onToggle} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', cursor: 'pointer' }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, flex: 'none', background: 'var(--ay-pink)', color: 'var(--ay-ink)', fontFamily: face.font, fontWeight: 600, fontSize: 'calc(17px * var(--ayna-text-scale, 1))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Ag</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 'calc(17px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)' }}>{face.name}</div>
          <div style={{ fontWeight: 500, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', marginTop: 2, lineHeight: 1.45 }}>{face.role}</div>
        </div>
        <div style={{ flex: 'none', transition: 'transform .2s ease', transform: `rotate(${open ? 180 : 0}deg)` }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ayna-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
        </div>
      </div>
      {open && (
        <div style={{ padding: '0 18px 18px' }}>
          <div style={{ fontFamily: face.font, fontSize: face.size, lineHeight: 1.35, color: 'var(--ayna-text)', borderTop: '1px solid var(--ayna-border)', paddingTop: 15 }}>
            Nothing reaches you unchecked.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
            {[['Designer', face.designer], ['Licence', 'SIL Open Font Licence 1.1'], ['Weights', face.weights]].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', gap: 10, fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))' }}>
                <div style={{ width: 64, flex: 'none', fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)', paddingTop: 2 }}>{label}</div>
                <div style={{ flex: 1, color: 'var(--ayna-text-muted)' }}>{value}</div>
              </div>
            ))}
          </div>
          <div onClick={() => window.open(SIL_OFL_URL, '_blank', 'noopener,noreferrer')} style={{ fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-heading)', fontWeight: 500, marginTop: 14, cursor: 'pointer' }}>
            Read the licence
          </div>
        </div>
      )}
    </div>
  );
}

function TypefacesScreen({ onBack }) {
  const [openFace, setOpenFace] = useState({ pf: true });
  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <BackHeader title="Typefaces" onBack={onBack} />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '6px 20px 30px' }}>
        <div style={{ background: 'var(--d-group)', position: 'relative', overflow: 'hidden', border: 0, borderRadius: 20, padding: 20 }}>
          <div style={{ position: 'absolute', right: -30, top: -36, width: 116, height: 116, borderRadius: 99, background: 'rgba(255,237,172,.4)' }} />
          <div style={{ position: 'relative', fontFamily: "var(--ayna-font-display)", fontWeight: 400, fontSize: 'calc(28px * var(--ayna-text-scale, 1))', lineHeight: 1.15, color: 'var(--ayna-heading)' }}>Aa</div>
          <div style={{ position: 'relative', fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', lineHeight: 1.6, color: 'var(--ayna-text-muted)', marginTop: 11, maxWidth: 250 }}>Three faces, all openly licensed under the SIL Open Font Licence.</div>
        </div>

        {TYPEFACES.map((face) => (
          <TypefaceRow
            key={face.key}
            face={face}
            open={!!openFace[face.key]}
            onToggle={() => setOpenFace((s) => ({ ...s, [face.key]: !s[face.key] }))}
          />
        ))}

        <div style={{ background: 'var(--d-group)', marginTop: 16, border: 0, borderRadius: 20, padding: '16px 18px' }}>
          <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-accent-dark)', marginBottom: 7 }}>Loaded via Google Fonts</div>
          <div style={{ fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.6 }}>
            Served from Google's font CDN over HTTPS, the standard way Google Fonts are delivered, not bundled with the app itself.
          </div>
        </div>
        <LegalFooter />
      </div>
    </div>
  );
}

/* ---------------------------- Research & data sources ---------------------------- */

// Accurate to what ayna actually does today, verified against the real
// codebase rather than copied from the design mockup's placeholder text,
// which claimed things that aren't true yet: fonts "self-hosted" (they load
// from Google's CDN, see index.html), a manufacturer-vs-independently-
// verified marking on product pages (no such UI exists), a human reviewing
// AI output before it reaches a user (no such step exists in the code), and
// a specific review cadence with invented dates (no real cadence exists to
// cite). Each left out rather than asserted.
const RESEARCH_SOURCES = [
  {
    key: 'clin', num: '01', title: 'Clinical guidance', blurb: 'The bodies whose guidance we follow.',
    body: "Menstrual, reproductive and sexual health information is grounded in guidance from ACOG, the CDC, and NIH (including NICHD), plus peer-reviewed literature indexed in PubMed, the same sources cited directly on individual articles and product pages throughout the app.",
    tags: ['ACOG', 'CDC', 'NIH / NICHD', 'PUBMED'],
    note: "ayna's advisory board includes Dr. David Orbach, MD.",
  },
  {
    key: 'safe', num: '02', title: 'Product & ingredient safety', blurb: 'What we check a product against.',
    body: 'Recall checks run live against OpenFDA. Supplement products are checked against the NIH Dietary Supplement Label Database (DSLD). Ingredient and condition-specific concerns are checked against the clinical sources above.',
    tags: ['OPENFDA', 'NIH DSLD', 'PUBMED'],
    note: "We don't yet mark manufacturer-reported claims separately from independently verified ones on the product page, treat an ingredient claim as manufacturer-reported unless a citation says otherwise.",
  },
  {
    key: 'ai', num: '03', title: 'How AI answers are grounded', blurb: 'Models read our sources, not the open web.',
    body: "In-app recommendations and Ask Ayna's answers are generated with Anthropic, OpenAI, or Google models, retrieved against the clinical knowledge base above rather than answering from open-ended AI opinion.",
    tags: ['ANTHROPIC', 'OPENAI', 'GOOGLE'],
    note: 'AI outputs are not currently reviewed by a person before you see them.',
  },
  {
    key: 'you', num: '04', title: 'Your own data', blurb: 'The part of a match that is only yours.',
    body: "Personalised insights also draw on what you've told ayna, your intake answers, the products you've saved, and what you've asked Ask Ayna. That's why two people can see different matches for the same product. It is never used to advertise to you.",
    tags: ['Intake answers', 'Ask ayna', 'Saved products'],
    note: 'Read the Privacy Policy for how it is stored and deleted.',
  },
];

function ResearchSourceRow({ source, open, onToggle }) {
  return (
    <div style={{ background: 'var(--d-group)', marginTop: 14, border: 0, borderRadius: 20, overflow: 'hidden' }}>
      <div onClick={onToggle} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', cursor: 'pointer' }}>
        <div style={{ width: 30, height: 30, borderRadius: 99, flex: 'none', background: open ? 'var(--ay-pink)' : 'var(--ayna-chip-bg)', color: open ? 'var(--ay-ink)' : 'var(--ayna-text-faint)', fontFamily: "var(--ayna-font-ui)", fontWeight: 500, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .2s ease' }}>{source.num}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 'calc(17px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)' }}>{source.title}</div>
          <div style={{ fontWeight: 500, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', marginTop: 2, lineHeight: 1.45 }}>{source.blurb}</div>
        </div>
        <div style={{ flex: 'none', transition: 'transform .2s ease', transform: `rotate(${open ? 180 : 0}deg)` }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ayna-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
        </div>
      </div>
      {open && (
        <div style={{ padding: '2px 18px 18px' }}>
          <div style={{ fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.65 }}>{source.body}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
            {source.tags.map((t) => (
              <div key={t} style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 500, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', background: 'var(--ayna-chip-bg)', color: 'var(--ayna-text-muted)', borderRadius: 99, padding: '5px 9px' }}>{t}</div>
            ))}
          </div>
          <div style={{ fontWeight: 500, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)', lineHeight: 1.55, marginTop: 11, borderTop: '1px solid var(--ayna-border)', paddingTop: 11 }}>{source.note}</div>
        </div>
      )}
    </div>
  );
}

function ResearchSourcesScreen({ onBack }) {
  const [openSrc, setOpenSrc] = useState({ clin: true });
  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <BackHeader title="Research & sources" onBack={onBack} />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '6px 20px 30px' }}>
        <div style={{ background: 'var(--d-group)', position: 'relative', overflow: 'hidden', border: 0, borderRadius: 20, padding: 20 }}>
          <div style={{ position: 'absolute', right: -30, top: -34, width: 110, height: 110, borderRadius: 99, background: 'rgba(255,237,172,.4)' }} />
          <div style={{ position: 'relative', width: 38, height: 38, borderRadius: 99, background: 'var(--ayna-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 5px rgba(63,107,74,.14)' }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--ayna-heading)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5z" /><path d="M8 8h7" /><path d="M8 12h5" /></svg>
          </div>
          <div style={{ position: 'relative', fontFamily: "var(--ayna-font-display)", fontWeight: 400, fontSize: 'calc(22px * var(--ayna-text-scale, 1))', lineHeight: 1.15, marginTop: 13, color: 'var(--ayna-heading)' }}>Where our answers come from.</div>
          <div style={{ position: 'relative', fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', lineHeight: 1.6, color: 'var(--ayna-text-muted)', marginTop: 8 }}>Every match, warning and explanation traces back to something on this page.</div>
        </div>

        {RESEARCH_SOURCES.map((source) => (
          <ResearchSourceRow
            key={source.key}
            source={source}
            open={!!openSrc[source.key]}
            onToggle={() => setOpenSrc((s) => ({ ...s, [source.key]: !s[source.key] }))}
          />
        ))}

        <div style={{ background: 'var(--d-group)', marginTop: 14, display: 'flex', alignItems: 'flex-start', gap: 12, border: 0, borderRadius: 20, padding: '16px 18px' }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', marginTop: 1 }}><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 7.6v.1" /></svg>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 'calc(13px * var(--ayna-text-scale, 1))', fontWeight: 500, color: 'var(--ayna-text-muted)' }}>Not a substitute for medical advice</div>
            <div style={{ fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.6, marginTop: 4 }}>Ayna is a discovery and education tool. Nothing here diagnoses or treats a condition, talk to your clinician about anything that worries you.</div>
          </div>
        </div>

        <div style={{ fontWeight: 500, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)', lineHeight: 1.55, marginTop: 14, padding: '0 4px', textAlign: 'center' }}>
          Spotted something out of date? <a href={DELETE_ACCOUNT_MAILTO.replace('subject=Account%20Deletion%20Request', 'subject=Research%20source%20question')}>Tell us</a> and we'll check it.
        </div>
        <LegalFooter />
      </div>
    </div>
  );
}

/* ------------------------------ Manage my data ------------------------------ */

function humanizeKey(key) {
  return String(key)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

// Recursive on purpose, the health intake profile in particular nests
// arrays of objects (productHistory, trustRanking, etc.), and this is a
// generic "show me everything" viewer rather than a hand-built form field
// per intake question (that's IntakeScreen's job, not this screen's).
function formatValue(value) {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) {
    if (!value.length) return '-';
    return value.map((v) => formatValue(v)).join(' · ');
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value).filter(([, v]) => v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0));
    if (!entries.length) return '-';
    return entries.map(([k, v]) => `${humanizeKey(k)}: ${formatValue(v)}`).join(', ');
  }
  return String(value);
}

function DataSection({ title, rows }) {
  const visibleRows = rows.filter(([, v]) => v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0));
  if (!visibleRows.length) return null;
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-accent-dark)', marginBottom: 11 }}>{title}</div>
      <div style={{ background: 'var(--d-group)', border: 0, borderRadius: 20, padding: '0 18px' }}>
        {visibleRows.map(([key, value], i) => (
          <div key={key} style={{ display: 'flex', gap: 14, padding: '13px 0', borderTop: i === 0 ? 'none' : '1px solid var(--ayna-border)' }}>
            <div style={{ flex: 'none', width: 120, fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)' }}>{humanizeKey(key)}</div>
            <div style={{ flex: 1, minWidth: 0, fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)', lineHeight: 1.5, wordBreak: 'break-word' }}>{formatValue(value)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function downloadJson(data, filenamePrefix) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Real backend: GET /api/export-data, service-role-authenticated, pulling
// live from the same tables the rest of the app writes to (phone_numbers,
// notification_preferences, health_intakes, user_ecosystems), nothing
// here is placeholder or cached. Also serves "Download my data": both the
// Privacy & data screen's two separate rows and Account information's
// "Download a copy" row all land here now, rather than three different
// half-built flows for the same real feature.
function ManageDataScreen({ onBack }) {
  const [loadState, setLoadState] = useState('loading'); // 'loading' | 'signed_out' | 'error' | 'ready'
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(false);

  // Initial state is already 'loading', so the mount effect below doesn't
  // need to (and per the react-hooks lint rule, shouldn't) set it again
  // synchronously, only the retry button, which isn't running inside an
  // effect, does that explicitly. Same pattern as PreferencesScreen above.
  const fetchData = () => {
    fetchDataExport()
      .then((result) => { setData(result); setLoadState('ready'); })
      .catch((e) => setLoadState(e instanceof NotSignedInError ? 'signed_out' : 'error'));
  };

  useEffect(() => { fetchData(); }, []);

  const retry = () => {
    setLoadState('loading');
    fetchData();
  };

  const handleDownload = () => data && downloadJson(data, 'ayna-my-data');
  const handleCopy = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* clipboard unavailable in this context, download still works */ }
  };

  const hasAnyData = data && (data.phone || data.healthIntake || (data.savedProducts || []).length || data.notificationPreferences);

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <BackHeader title="Manage my data" onBack={onBack} />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '8px 20px 30px' }}>
        <div style={{ fontWeight: 400, fontSize: 'calc(15px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.45, marginBottom: 20 }}>
          Every field below is read live from your account, nothing here is cached or approximate.
        </div>

        {loadState === 'loading' && (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--ayna-text-muted)', fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))' }}>Loading your data…</div>
        )}

        {loadState === 'signed_out' && (
          <SignedOutCard>Sign in to see and download your data.</SignedOutCard>
        )}

        {loadState === 'error' && (
          <div style={{ background: 'var(--d-group)', border: 0, borderRadius: 20, padding: 18, textAlign: 'center' }}>
            <div style={{ fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.55, marginBottom: 12 }}>Couldn't load your data.</div>
            <div onClick={retry} style={{ display: 'inline-block', background: 'var(--ayna-cta-bg)', color: 'var(--ayna-cta-text)', fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', padding: '9px 16px', borderRadius: 99, cursor: 'pointer' }}>Try again</div>
          </div>
        )}

        {loadState === 'ready' && data && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
              <div onClick={handleDownload} style={{ flex: 1, textAlign: 'center', padding: '13px 0', borderRadius: 99, background: 'var(--ayna-cta-bg)', color: 'var(--ayna-cta-text)', fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', cursor: 'pointer' }}>
                Download as JSON
              </div>
              <div onClick={handleCopy} style={{ flex: 1, textAlign: 'center', padding: '13px 0', borderRadius: 99, border: '1px solid var(--ayna-border)', color: 'var(--ayna-heading)', fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', cursor: 'pointer' }}>
                {copied ? 'Raw data copied' : 'Copy raw data'}
              </div>
            </div>

            <DataSection title="Account" rows={[
              ['email', data.account?.email],
              ['emailVerified', data.account?.emailVerified],
              ['createdAt', data.account?.createdAt],
              ['signInMethods', (data.account?.signInMethods || []).map((m) => m.provider)],
            ]} />

            <DataSection title="Phone" rows={[
              ['number', data.phone?.number],
              ['verified', data.phone?.verified],
            ]} />

            <DataSection title="Notification preferences" rows={Object.entries(data.notificationPreferences || {})} />

            <DataSection title="Health intake" rows={Object.entries(data.healthIntake || {})} />

            <DataSection
              title="Saved products"
              rows={(data.savedProducts || []).map((p, i) => [`item${i + 1}`, { name: p.product_name, brand: p.brand, category: p.category, saved: p.is_saved }])}
            />

            {!hasAnyData && (
              <div style={{ fontWeight: 500, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)', lineHeight: 1.55, padding: '0 4px' }}>
                Nothing else on file yet, this fills in as you use ayna.
              </div>
            )}
          </>
        )}
        <LegalFooter />
      </div>
    </div>
  );
}

/* --------------------------- Account information --------------------------- */

function formatMemberSince(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return `Member since ${d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
}

// Same E.164 phone_numbers.phone_number column PhoneVerifyPanel already
// writes to, just masked for display, never shown in full.
function maskPhone(e164) {
  const digits = String(e164 || '').replace(/^\+1/, '').replace(/\D/g, '');
  if (digits.length < 10) return e164 || '';
  return `+1 (${digits.slice(0, 3)}) •••• ${digits.slice(-2)}`;
}

// Same slugs as IntakeScreen.jsx's FSA_HSA_REVERSE, the real stored value
// (quizAnswers.fullHealthIntake.fsaHsa), not a separately-invented field.
const FSA_HSA_LABELS = { fsa: 'FSA', hsa: 'HSA', both: 'Both', none: 'No', unsure: 'Not sure' };

function AccountRow({ title, sub, value, badge, badgeTone = 'neutral', onClick, borderTop = true, dimmed = false }) {
  const TONES = {
    verified: { color: 'var(--ayna-heading)', background: 'var(--d-page)' },
    unverified: { color: '#3e2723', background: 'var(--d-pink)' },
    neutral: { color: 'var(--ayna-text-muted)', background: 'var(--ayna-chip-bg)' },
  };
  const tone = TONES[badgeTone] || TONES.neutral;
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, minHeight: 52, padding: '12px 0',
        borderTop: borderTop ? '1px solid var(--d-hair)' : 'none',
        cursor: onClick ? 'pointer' : 'default',
        opacity: dimmed ? 0.55 : 1,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, lineHeight: 1.35, fontSize: 'calc(16px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)' }}>{title}</div>
        {sub && <div style={{ fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', marginTop: 2, lineHeight: 1.45 }}>{sub}</div>}
      </div>
      {value && <div style={{ fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', flex: 'none' }}>{value}</div>}
      {badge && (
        <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 500, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: tone.color, background: tone.background, borderRadius: 99, padding: '4px 8px', flex: 'none' }}>
          {badge}
        </div>
      )}
      {onClick && <ChevronIcon />}
    </div>
  );
}

// Real fields only: email/phone/password/Google identity from the actual
// Supabase session (src/mobile/hooks/useSupabaseAuth.js), phone number read
// straight from phone_numbers (RLS-scoped to the caller, same table
// PhoneVerifyPanel writes to), age/zip/FSA-HSA from the real intake
// snapshot. No "Security" section here (session list, two-step verification)
// since neither has a backend yet, showing a row that just says "coming
// soon" isn't something to ship, not even as a placeholder; add it back once
// either is real. Delete account opens a real in-app confirm flow
// (DeleteAccountScreen) backed by account_deletion_requests, not an email
// link.
function AccountInfoScreen({ onBack, authUser, name, onNameChanged, quizAnswers, onOpenPassword, onEditProfile, onOpenDeleteAccount }) {
  const [phoneVerifyOpen, setPhoneVerifyOpen] = useState(false);
  const [phone, setPhone] = useState({ loading: true, number: '', verified: false });
  // Real Supabase auth.updateUser() call, same first_name/full_name fields
  // the email/password signup form writes (see useSupabaseAuth.js), the
  // one place that data can be set for Google sign-ins, which never get a
  // name-entry step of their own since the OAuth redirect leaves the app
  // entirely. onNameChanged mirrors the save into the app's own session
  // state immediately, so "You" doesn't linger elsewhere until next login.
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState('');

  const saveName = async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed) { setNameError('Please enter a name.'); return; }
    setNameSaving(true);
    setNameError('');
    try {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Not available right now.');
      const { error } = await supabase.auth.updateUser({ data: { first_name: trimmed, full_name: trimmed } });
      if (error) throw error;
      onNameChanged?.(trimmed);
      setEditingName(false);
    } catch (e) {
      setNameError(e.message || "That didn't save, try again.");
    } finally {
      setNameSaving(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const supabase = getSupabaseClient();
    if (!supabase || !authUser?.id) {
      setPhone({ loading: false, number: '', verified: false });
      return undefined;
    }
    supabase
      .from('phone_numbers')
      .select('phone_number, is_verified')
      .eq('user_id', authUser.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setPhone({ loading: false, number: data?.phone_number || '', verified: data?.is_verified === true });
      })
      .catch(() => { if (!cancelled) setPhone({ loading: false, number: '', verified: false }); });
    return () => { cancelled = true; };
  }, [authUser?.id]);

  if (phoneVerifyOpen) {
    return (
      <PhoneVerifyPanel
        onBack={() => setPhoneVerifyOpen(false)}
        onVerified={(number) => {
          setPhone({ loading: false, number, verified: true });
          setPhoneVerifyOpen(false);
        }}
      />
    );
  }

  if (!authUser) {
    return (
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <BackHeader title="Account information" onBack={onBack} />
        <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '8px 20px 30px' }}>
          <SignedOutCard>Sign in to see your account details.</SignedOutCard>
          <LegalFooter />
        </div>
      </div>
    );
  }

  const initial = (name || 'Y').trim().charAt(0).toUpperCase() || 'Y';
  const identities = authUser.identities || [];
  const hasPasswordAuth = identities.length === 0 || identities.some((i) => i.provider === 'email');
  const googleIdentity = identities.find((i) => i.provider === 'google');
  const intake = quizAnswers?.fullHealthIntake || null;
  const fsaHsaLabel = intake?.fsaHsa ? (FSA_HSA_LABELS[intake.fsaHsa] || intake.fsaHsa) : null;

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <BackHeader title="Account information" onBack={onBack} />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '8px 20px 30px' }}>

        <div style={{ background: 'var(--d-group)', display: 'flex', alignItems: 'center', gap: 14, border: 0, borderRadius: 20, padding: '16px 18px' }}>
          <div style={{ width: 52, height: 52, borderRadius: 99, flex: 'none', background: 'linear-gradient(140deg,#F7BADD,var(--ayna-surface))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "var(--ayna-font-display)", fontWeight: 400, lineHeight: 1.15, fontSize: 'calc(22px * var(--ayna-text-scale, 1))', color: 'var(--ayna-heading)' }}>{initial}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--ayna-font-display)", fontWeight: 400, fontSize: 'calc(22px * var(--ayna-text-scale, 1))', lineHeight: 1.15, color: 'var(--ayna-heading)' }}>{name || 'You'}</div>
            {authUser.created_at && (
              <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', marginTop: 4 }}>{formatMemberSince(authUser.created_at)}</div>
            )}
          </div>
        </div>

        <div style={{ margin: '24px 0 11px', fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-accent-dark)' }}>Login &amp; contact</div>
        <div style={{ background: 'var(--d-group)', border: 0, borderRadius: 20, padding: '0 18px' }}>
          <AccountRow
            borderTop={false}
            title="Email"
            sub={authUser.email}
            badge={authUser.email_confirmed_at ? 'Verified' : 'Unverified'}
            badgeTone={authUser.email_confirmed_at ? 'verified' : 'unverified'}
          />
          <AccountRow
            title="Phone number"
            sub={phone.loading ? 'Checking…' : phone.number ? maskPhone(phone.number) : 'Not added yet'}
            badge={phone.loading ? undefined : phone.number ? (phone.verified ? 'Verified' : 'Unverified') : undefined}
            badgeTone={phone.verified ? 'verified' : 'unverified'}
            onClick={() => setPhoneVerifyOpen(true)}
          />
          {hasPasswordAuth && (
            <AccountRow title="Password" sub="Change your password" onClick={onOpenPassword} />
          )}
          {googleIdentity && (
            <AccountRow title="Google" sub={`Connected · ${googleIdentity.identity_data?.email || authUser.email || ''}`} />
          )}
        </div>
        <div style={{ fontWeight: 500, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)', lineHeight: 1.5, marginTop: 9, padding: '0 4px' }}>
          Verify your phone to get alerts by text. You still sign in with your email{googleIdentity ? ' or Google login' : ''}.
        </div>

        <div style={{ margin: '24px 0 11px', fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-accent-dark)' }}>About you</div>
        <div style={{ background: 'var(--d-group)', border: 0, borderRadius: 20, padding: editingName ? '16px 18px' : '0 18px' }}>
          {editingName ? (
            <div>
              <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)', marginBottom: 7 }}>Name</div>
              <input
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !nameSaving) saveName(); }}
                placeholder="Your first name"
                style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--ayna-border)', fontSize: 'max(16px, calc(14.5px * var(--ayna-text-scale, 1)))', color: 'var(--ayna-text)', background: 'var(--ayna-bg)', outline: 'none' }}
              />
              {nameError && <div style={{ color: 'var(--ayna-heading)', fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', marginTop: 8 }}>{nameError}</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <div
                  onClick={nameSaving ? undefined : saveName}
                  style={{ flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: 99, background: nameSaving ? 'var(--ayna-border)' : 'var(--ayna-cta-bg)', color: nameSaving ? 'var(--ayna-text-muted)' : 'var(--ayna-cta-text)', fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', cursor: nameSaving ? 'not-allowed' : 'pointer' }}
                >
                  {nameSaving ? 'Saving…' : 'Save'}
                </div>
                <div
                  onClick={() => { setEditingName(false); setNameError(''); }}
                  style={{ flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: 99, border: '1px solid var(--ayna-border)', color: 'var(--ayna-text-muted)', fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', cursor: 'pointer' }}
                >
                  Cancel
                </div>
              </div>
            </div>
          ) : (
            <AccountRow
              borderTop={false}
              title="Name"
              value={name || 'Add your name'}
              onClick={() => { setNameDraft(name || ''); setNameError(''); setEditingName(true); }}
            />
          )}
        </div>
        <div style={{ fontWeight: 500, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)', lineHeight: 1.5, marginTop: 9, padding: '0 4px' }}>
          {authUser?.identities?.some((i) => i.provider === 'google') ? "Google didn't share a name with us, or you'd like to change it, set it here." : "What ayna calls you, everywhere in the app."}
        </div>

        <div style={{ margin: '24px 0 11px', fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-accent-dark)' }}>From your intake</div>
        <div style={{ background: 'var(--d-group)', border: 0, borderRadius: 20, padding: '0 18px' }}>
          <AccountRow borderTop={false} title="Age" value={intake?.age ? String(intake.age) : 'Not set'} onClick={onEditProfile} />
          <AccountRow title="Zip code" value={intake?.zipcode || 'Not set'} onClick={onEditProfile} />
          <AccountRow title="FSA / HSA account" sub="We'll show the lower price you'd pay." value={fsaHsaLabel || 'Not set'} onClick={onEditProfile} />
        </div>
        <div style={{ fontWeight: 500, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)', lineHeight: 1.5, marginTop: 9, padding: '0 4px' }}>
          Tap any of these to update your health profile.
        </div>

        <div style={{ margin: '24px 0 11px', fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-accent-dark)' }}>Your data</div>
        <div style={{ background: 'var(--d-group)', border: 0, borderRadius: 20, padding: '0 18px' }}>
          <AccountRow borderTop={false} title={<span style={{ color: 'var(--ayna-heading)' }}>Delete account</span>} sub="Removes your profile and health answers." onClick={onOpenDeleteAccount} />
        </div>

        <div style={{ fontWeight: 500, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)', lineHeight: 1.55, marginTop: 14, padding: '0 4px' }}>
          Questions about your account? Email <a href="mailto:puloma@aynahealth.co" style={{ color: 'var(--ayna-brown)' }}>puloma@aynahealth.co</a>.
        </div>
        <LegalFooter />
      </div>
    </div>
  );
}

/* ---------------------------- Delete account ---------------------------- */

// Real in-app action, files a row in account_deletion_requests via
// api/export-data.js's POST branch, instead of a mailto: link with no
// record on our side unless the email is actually sent and read. Requires
// typing DELETE (not just a tap) before the button enables, since this is
// irreversible. Signs out and closes the profile overlay after a successful
// request, same as the real "Sign out" action elsewhere in Settings.
function DeleteAccountScreen({ onBack, onSignOut, onClose }) {
  const [confirmText, setConfirmText] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'submitting' | 'error' | 'success'
  const [errorMsg, setErrorMsg] = useState('');
  const canSubmit = confirmText.trim().toUpperCase() === 'DELETE';

  const handleSubmit = async () => {
    if (!canSubmit || status === 'submitting') return;
    setStatus('submitting');
    setErrorMsg('');
    try {
      await requestAccountDeletion();
      setStatus('success');
    } catch (e) {
      setStatus('error');
      setErrorMsg(e instanceof NotSignedInError ? 'Please sign in again, then retry.' : (e.message || "That didn't go through, try again."));
    }
  };

  const handleDone = () => {
    onSignOut && onSignOut();
    onClose && onClose();
  };

  if (status === 'success') {
    return (
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <BackHeader title="Delete account" onBack={onBack} />
        <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '30px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 99, background: 'var(--ayna-chip-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 'calc(17px * var(--ayna-text-scale, 1))', marginBottom: 18 }}>Done</div>
          <div style={{ fontFamily: "var(--ayna-font-display)", fontWeight: 400, lineHeight: 1.15, fontSize: 'calc(22px * var(--ayna-text-scale, 1))', marginBottom: 10, color: 'var(--ayna-heading)' }}>Request received.</div>
          <div style={{ fontWeight: 400, fontSize: 'calc(15px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.45, maxWidth: 280 }}>
            We'll process it within a week, nothing kept after. You're being signed out now.
          </div>
          <div
            onClick={handleDone}
            style={{ marginTop: 26, width: '100%', maxWidth: 280, textAlign: 'center', padding: '14px 0', borderRadius: 99, background: 'var(--ayna-cta-bg)', color: 'var(--ayna-cta-text)', fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', cursor: 'pointer' }}
          >
            Done
          </div>
          <LegalFooter />
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <BackHeader title="Delete account" onBack={onBack} />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '8px 20px 30px' }}>
        <div style={{ fontFamily: "var(--ayna-font-display)", fontWeight: 400, fontSize: 'calc(22px * var(--ayna-text-scale, 1))', lineHeight: 1.15, marginBottom: 12, color: 'var(--ayna-heading)' }}>
          This can't be undone.
        </div>
        <div style={{ fontWeight: 400, fontSize: 'calc(15px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.45, marginBottom: 20 }}>
          Deleting your account removes your profile, health intake answers, saved products, and ecosystem from our active systems. We may keep limited records where the law requires it, never your health data. We process requests within a week.
        </div>

        <div style={{ fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', marginBottom: 8 }}>
          Type <strong style={{ color: 'var(--ayna-text)' }}>DELETE</strong> to confirm.
        </div>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => { setConfirmText(e.target.value); if (status === 'error') setStatus('idle'); }}
          placeholder="DELETE"
          autoCapitalize="characters"
          autoCorrect="off"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            border: '1.5px solid var(--ayna-border)',
            borderRadius: 14,
            padding: '13px 16px',
            fontSize: 'max(16px, calc(15px * var(--ayna-text-scale, 1)))',
            fontFamily: "var(--ayna-font-ui)",
            background: 'var(--ayna-surface)',
            color: 'var(--ayna-text)',
          }}
        />

        {errorMsg && <div style={{ color: 'var(--ayna-heading)', fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', marginTop: 10 }}>{errorMsg}</div>}

        <div
          onClick={handleSubmit}
          style={{
            marginTop: 20,
            textAlign: 'center',
            padding: '14px 0',
            borderRadius: 99,
            fontWeight: 500,
            fontSize: 'calc(13px * var(--ayna-text-scale, 1))',
            cursor: canSubmit && status !== 'submitting' ? 'pointer' : 'default',
            background: canSubmit ? 'var(--ayna-heading)' : 'var(--ayna-chip-bg)',
            color: canSubmit ? '#FFEDAC' : 'var(--ayna-text-faint)',
            transition: 'background .15s, color .15s',
          }}
        >
          {status === 'submitting' ? 'Submitting…' : 'Delete my account'}
        </div>
        <LegalFooter />
      </div>
    </div>
  );
}

/* ------------------------------- Password ------------------------------- */

function getPasswordStrength(pw) {
  const hasDigitOrSymbol = /[0-9]/.test(pw) || /[^A-Za-z0-9]/.test(pw);
  const hasDigitAndSymbol = /[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw);
  if (pw.length >= 12 && hasDigitAndSymbol) return 3;
  if (pw.length >= 8 && hasDigitOrSymbol) return 2;
  if (pw.length >= 8) return 1;
  return 0;
}

const PASSWORD_ERROR_MESSAGES = {
  invalid_credentials: 'That current password is wrong.',
  weak_password: 'Choose a stronger password (at least 8 characters).',
  same_password: "That's already your password, try a new one.",
  over_request_rate_limit: 'Too many attempts. Please try again in a bit.',
};

function friendlyPasswordError(code) {
  return PASSWORD_ERROR_MESSAGES[code] || 'We couldn’t change your password. Check your connection and try again.';
}

// Real Supabase auth calls, not a mock form: the current-password field is
// verified with a real signInWithPassword() (Supabase's client SDK has no
// separate "check password" call) before updateUser() actually changes it.
// isRecovery covers the "Forgot your current password?" link's real
// resetPasswordForEmail() flow: clicking the emailed link fires a real
// PASSWORD_RECOVERY auth event, which is when there's no "current password"
// to ask for at all.
function PasswordScreen({ onBack, authUser }) {
  const [isRecovery, setIsRecovery] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return undefined;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setIsRecovery(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const strength = getPasswordStrength(next);
  const canSubmit = (isRecovery || current.length > 0) && next.length >= 8 && next === confirm && !saving;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError('');
    setSaving(true);
    try {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Sign-in is not configured right now.');
      if (!isRecovery) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: authUser?.email, password: current });
        if (signInError) {
          const err = new Error(signInError.message);
          err.code = 'invalid_credentials';
          throw err;
        }
      }
      const { error: updateError } = await supabase.auth.updateUser({ password: next });
      if (updateError) throw updateError;
      setDone(true);
    } catch (e) {
      setError(friendlyPasswordError(e.code || e.message));
    } finally {
      setSaving(false);
    }
  };

  const handleForgot = async () => {
    setError('');
    try {
      const supabase = getSupabaseClient();
      if (!supabase || !authUser?.email) throw new Error('no_email');
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(authUser.email, {
        redirectTo: `${window.location.origin}/mobile-preview`,
      });
      if (resetError) throw resetError;
      setResetSent(true);
    } catch {
      setError('Could not send a reset email right now. Please try again.');
    }
  };

  if (done) {
    return (
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <BackHeader title="Password" onBack={onBack} />
        <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontFamily: "var(--ayna-font-display)", fontWeight: 400, lineHeight: 1.15, fontSize: 'calc(22px * var(--ayna-text-scale, 1))', marginBottom: 10, color: 'var(--ayna-heading)' }}>Password updated.</div>
          <div style={{ fontWeight: 400, fontSize: 'calc(15px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.45 }}>You're signed in on this device with the new password.</div>
          <LegalFooter />
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <BackHeader title="Password" onBack={onBack} />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '0 20px 30px' }}>
        <div style={{ fontWeight: 400, fontSize: 'calc(15px * var(--ayna-text-scale, 1))', lineHeight: 1.45, color: 'var(--ayna-text-muted)', marginBottom: 20 }}>
          {isRecovery ? "You're resetting your password from the link we emailed you." : 'Enter your current password, then choose a new one.'}
        </div>

        <div style={{ background: 'var(--d-group)', border: 0, borderRadius: 20, padding: 18, display: 'flex', flexDirection: 'column', gap: 15 }}>
          {!isRecovery && (
            <div>
              <div style={{ fontSize: 'calc(13px * var(--ayna-text-scale, 1))', fontWeight: 500, color: 'var(--ayna-text-muted)', marginBottom: 7 }}>Current password</div>
              <div className="ay-pw-field" style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--ayna-border)', borderRadius: 12, background: 'var(--ayna-bg-alt)', padding: '13px 14px' }}>
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'none', fontSize: 'max(16px, calc(15px * var(--ayna-text-scale, 1)))', color: 'var(--ayna-text)' }}
                />
                <div onClick={() => setShowCurrent((v) => !v)} style={{ fontSize: 'calc(13px * var(--ayna-text-scale, 1))', fontWeight: 500, color: 'var(--ayna-brown)', cursor: 'pointer', flex: 'none' }}>{showCurrent ? 'Hide' : 'Show'}</div>
              </div>
            </div>
          )}
          <div>
            <div style={{ fontSize: 'calc(13px * var(--ayna-text-scale, 1))', fontWeight: 500, color: 'var(--ayna-text-muted)', marginBottom: 7 }}>New password</div>
            <div className="ay-pw-field" style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--ayna-border)', borderRadius: 12, background: 'var(--ayna-bg-alt)', padding: '13px 14px' }}>
              <input
                type={showNext ? 'text' : 'password'}
                value={next}
                onChange={(e) => setNext(e.target.value)}
                placeholder="At least 8 characters"
                style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'none', fontSize: 'max(16px, calc(15px * var(--ayna-text-scale, 1)))', color: 'var(--ayna-text)' }}
              />
              <div onClick={() => setShowNext((v) => !v)} style={{ fontSize: 'calc(13px * var(--ayna-text-scale, 1))', fontWeight: 500, color: 'var(--ayna-brown)', cursor: 'pointer', flex: 'none' }}>{showNext ? 'Hide' : 'Show'}</div>
            </div>
            {next.length > 0 && (
              <>
                <div style={{ display: 'flex', gap: 5, marginTop: 9 }}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} style={{ flex: 1, height: 4, borderRadius: 99, background: strength >= i ? '#3e2723' : 'var(--ayna-border)' }} />
                  ))}
                </div>
                <div style={{ fontWeight: 500, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)', marginTop: 7 }}>
                  {strength < 2 ? 'Add a number or symbol to make it stronger.' : strength < 3 ? 'Longer, with a number and a symbol, is stronger still.' : 'Strong password.'}
                </div>
              </>
            )}
          </div>
          <div>
            <div style={{ fontSize: 'calc(13px * var(--ayna-text-scale, 1))', fontWeight: 500, color: 'var(--ayna-text-muted)', marginBottom: 7 }}>Confirm new password</div>
            <input
              type={showNext ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter it"
              style={{ width: '100%', boxSizing: 'border-box', border: '1px solid var(--ayna-border)', borderRadius: 12, background: 'var(--ayna-bg-alt)', padding: '13px 14px', fontSize: 'max(16px, calc(15px * var(--ayna-text-scale, 1)))', color: 'var(--ayna-text)', outline: 'none' }}
            />
          </div>
          {error && <div style={{ color: 'var(--ayna-heading)', fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))' }}>{error}</div>}
          <div
            onClick={handleSubmit}
            style={{ background: canSubmit ? 'var(--ayna-cta-bg)' : 'transparent', boxShadow: canSubmit ? 'none' : 'inset 0 0 0 2px var(--ayna-border)', color: canSubmit ? 'var(--ayna-cta-text)' : 'var(--ayna-text-muted)', textAlign: 'center', padding: 15, borderRadius: 99, fontWeight: 600, fontSize: 'calc(17px * var(--ayna-text-scale, 1))', cursor: canSubmit ? 'pointer' : 'not-allowed' }}
          >
            {saving ? 'Updating…' : 'Update password'}
          </div>
        </div>

        {!isRecovery && (
          resetSent ? (
            <div style={{ textAlign: 'center', marginTop: 18, fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)' }}>Check your email for a reset link.</div>
          ) : (
            <div onClick={handleForgot} style={{ textAlign: 'center', marginTop: 18, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-brown)', fontWeight: 500, cursor: 'pointer' }}>Forgot your current password?</div>
          )
        )}
        <LegalFooter />
      </div>
    </div>
  );
}

/* ------------------------- How it works / About / Contact ------------------------- */
// Ported from the real desktop pages (src/components/HowItWorks.jsx,
// HowItWorksFunnel.jsx, About.jsx, Contact.jsx) so this content and data
// can't drift from what's actually live on aynahealth.co, only the layout
// below is new, re-flowed for a phone per the mobile design reference.
// Copy for the two headline moments ("Nothing reaches you unchecked." here,
// vs. desktop's older "No mystery box." on this same page) is intentionally
// different: that's the actual content update this pass shipped, not a
// mismatch to fix.


// Real numbers from HowItWorksFunnel.jsx: a plain linear scale would make
// the 14-product final stage nearly invisible next to 3,140 (a real problem
// found in an August 2026 bug bash), so widths use a sqrt scale instead
// ported here rather than reimplemented, not the design reference's static
// illustrative percentages.
const NARROWING_STAGES = [
  { label: 'Pulled in from the open market', value: 3140, fill: '#769EBE', ink: '#3e2723' },
  { label: 'Relevant to your profile', value: 212, fill: '#F7BADD', ink: '#3e2723' },
  { label: 'In your ecosystem', value: 14, fill: 'var(--ayna-heading)', ink: 'var(--ayna-bg)' },
];

function NarrowingFunnel() {
  const maxWidth = Math.sqrt(NARROWING_STAGES[0].value);
  return (
    <div style={{ background: 'var(--d-group)', border: 0, borderRadius: 20, padding: '22px 18px 24px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
        {NARROWING_STAGES.map((stage, i) => {
          const widthPct = Math.max(14, (Math.sqrt(stage.value) / maxWidth) * 100);
          return (
            <div key={stage.label} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div style={{ width: `${widthPct}%`, height: 44, borderRadius: 11, background: stage.fill, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "var(--ayna-font-ui)", fontWeight: 400, lineHeight: 1.45, fontSize: 'calc(15px * var(--ayna-text-scale, 1))', color: stage.ink }}>
                {stage.value.toLocaleString()}
              </div>
              <div style={{ fontWeight: 500, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', textAlign: 'center', lineHeight: 1.4 }}>{stage.label}</div>
              {i < NARROWING_STAGES.length - 1 && <div style={{ color: 'var(--ayna-text-faint)', fontWeight: 400, fontSize: 'calc(15px * var(--ayna-text-scale, 1))', lineHeight: 1.45 }}>↓</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HowItWorksScreen({ onBack }) {
  const steps = [
    {
      n: '01', title: 'You tell us', body: 'Stage of life, goals, sensitivities, city.',
      content: <div style={{ marginTop: 12, borderTop: '1px solid var(--d-hair)', padding: '12px 0 0', fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)' }}>Postpartum · 8 weeks · sensitive skin · NYC</div>,
    },
    {
      n: '02', title: 'We scan the market', body: 'Everything pulled in, then cut down.',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '1px solid var(--d-hair)', padding: '10px 0' }}>
            <div style={{ fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)' }}>Pulled in</div>
            <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 400, lineHeight: 1.45, fontSize: 'calc(15px * var(--ayna-text-scale, 1))', color: 'var(--ayna-heading)' }}>3,140</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '1px solid var(--d-hair)', padding: '10px 0' }}>
            <div style={{ fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)' }}>Relevant to you</div>
            <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 400, lineHeight: 1.45, fontSize: 'calc(15px * var(--ayna-text-scale, 1))', color: 'var(--ayna-heading)' }}>212</div>
          </div>
        </div>
      ),
    },
    {
      n: '03', title: 'Evidence check', body: 'Checked against published guidance.',
      content: (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 14 }}>
          {['NIH research', 'ACOG guidance', 'CDC data'].map((t) => (
            <div key={t} style={{ border: '1.5px solid var(--ayna-heading)', borderRadius: 99, padding: '7px 12px', fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)' }}>{t}</div>
          ))}
          <div style={{ border: '1.5px dashed var(--ayna-border)', borderRadius: 99, padding: '7px 12px', fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)' }}>Fails → dropped</div>
        </div>
      ),
    },
    {
      n: '04', title: 'Your ecosystem', body: "What's left is ranked, with the reason attached.",
      content: (
        <div style={{ marginTop: 12, borderTop: '1px solid var(--d-hair)', padding: '12px 0 0' }}>
          <div style={{ fontFamily: "var(--ayna-font-display)", fontWeight: 400, fontSize: 'calc(28px * var(--ayna-text-scale, 1))', color: 'var(--ayna-heading)', lineHeight: 1.15 }}>14</div>
          <div style={{ fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', lineHeight: 1.45, color: 'var(--ayna-text-muted)', marginTop: 5 }}>products, each with its match reason</div>
        </div>
      ),
    },
  ];

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <BackHeader title="How it works" onBack={onBack} />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '0 20px 36px' }}>
        <div style={{ fontFamily: "var(--ayna-font-display)", fontWeight: 400, fontSize: 'calc(28px * var(--ayna-text-scale, 1))', lineHeight: 1.15, color: 'var(--ayna-heading)', margin: '9px 0 10px' }}>Nothing reaches you unchecked.</div>
        <div style={{ fontWeight: 400, fontSize: 'calc(15px * var(--ayna-text-scale, 1))', lineHeight: 1.45, color: 'var(--ayna-text-muted)', marginBottom: 24 }}>
          ayna filters the open market against your profile, then against published research. Anything that fails a step never reaches your shop.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {steps.map((step) => (
            <div key={step.n} style={{ background: 'var(--d-group)', border: 0, borderRadius: 20, padding: '18px 18px 19px' }}>
              <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)' }}>Step {Number(step.n)}</div>
              <div style={{ fontFamily: "var(--ayna-font-display)", fontWeight: 400, lineHeight: 1.15, fontSize: 'calc(22px * var(--ayna-text-scale, 1))', color: 'var(--ayna-heading)', margin: '7px 0 5px' }}>{step.title}</div>
              <div style={{ fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)' }}>{step.body}</div>
              {step.content}
            </div>
          ))}
        </div>

        <div style={{ fontFamily: "var(--ayna-font-display)", fontWeight: 400, lineHeight: 1.15, fontSize: 'calc(22px * var(--ayna-text-scale, 1))', color: 'var(--ayna-heading)', margin: '30px 0 14px' }}>The narrowing down, in one picture</div>
        <NarrowingFunnel />

        <div style={{ background: 'var(--d-group)', marginTop: 22, border: 0, borderRadius: 20, padding: 18 }}>
          <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(17px * var(--ayna-text-scale, 1))', lineHeight: 1.3, color: 'var(--ayna-heading)' }}>ayna is not a doctor, and never pretends to be.</div>
          <div style={{ fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', marginTop: 8, lineHeight: 1.5 }}>Summaries are AI-written from cited sources and clinician input.</div>
        </div>
        <LegalFooter />
      </div>
    </div>
  );
}

// Ported from About.jsx's own FUNNEL/GATES/DIFFERENCES/ADVISORS, same real
// content the live "About ayna" page uses.
const CONCEPT_FUNNEL = [
  { label: 'Open market', width: '100%', fill: '#3e2723' },
  { label: 'Fits your profile', width: '68%', fill: '#F7BADD' },
  { label: 'Passes evidence checks', width: '42%', fill: '#3e2723' },
  { label: 'Reaches your shop', width: '24%', fill: '#F7BADD' },
];
const TRUST_GATES = [
  { n: '01', title: 'Your profile', body: 'Goals, stage of life, sensitivities, preferences.' },
  { n: '02', title: 'The market', body: 'Relevant products across the open market.' },
  { n: '03', title: 'The evidence', body: 'Research, guidance, clinician and community signals.' },
  { n: '04', title: 'Your shop', body: 'The strongest fits, with clear reasons.' },
];
const WHY_AYNA_DIFFERENCES = [
  'Matched to your profile',
  'Evidence-aware',
  'Clinician + community context',
  'Sponsored placement never changes match',
];
const ADVISORS = [
  { name: 'Dr. David Orbach', title: 'BME, MD, Startup Advisor', photo: '/advisors/david-orbach.png' },
  { name: 'Gwyn Blanton', title: 'Former Director of Ethics & Compliance, Deloitte', photo: '/advisors/gwyn-blanton.png' },
  { name: 'Albert Charles', title: 'Co-Founder, Gorges Ventures', photo: '/advisors/albert-charles.png' },
  { name: 'Erika Demonsant', title: 'Healthcare Consultant, Huron', photo: '/advisors/erika-demonsant.png' },
  { name: 'Pamela Nasr', title: 'Product Lead, Benchling', photo: '/advisors/pamela-nasr.png' },
  { name: 'Nishtha Kaushik', title: 'Ex-Amazon Marketing', photo: '/advisors/nishtha-kaushik.png' },
  { name: 'Navneet Kaur', title: 'TechThrive Ventures', photo: '/advisors/navneet-kaur.png' },
];
function advisorInitials(name) {
  return name.replace(/^Dr\.\s*/i, '').split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

function AdvisorAvatar({ advisor }) {
  const [failed, setFailed] = useState(false);
  if (advisor.photo && !failed) {
    return (
      <img
        src={advisor.photo}
        alt={advisor.name}
        onError={() => setFailed(true)}
        className="ayna-scrapbook__advisor-avatar"
      />
    );
  }
  return (
    <div className="ayna-scrapbook__advisor-avatar ayna-scrapbook__advisor-avatar--initials" aria-label={advisor.name}>
      {advisorInitials(advisor.name)}
    </div>
  );
}

export function AboutAynaScreen({ onBack }) {
  return (
    <div className="ayna-scrapbook">
      <BackHeader title="About us" onBack={onBack} />
      <div className="ayna-scrapbook__scroll">
        <section className="ayna-scrapbook__hero">
          <div className="ayna-scrapbook__tape" aria-hidden="true" />
          <span className="ayna-scrapbook__eyebrow">Hello from ayna</span>
          <h1>Made for the whole you.</h1>
          <p>Women's health isn't one-size-fits-all. Ayna helps you explore options with the context, evidence, and explanations you deserve.</p>
          <div className="ayna-scrapbook__scribble" aria-hidden="true" />
        </section>

        <section className="ayna-scrapbook__paper ayna-scrapbook__paper--intro">
          <span className="ayna-scrapbook__eyebrow">The short version</span>
          <h2>What is ayna?</h2>
          <p>Ayna is a place to discover women's health products with more context. You tell us about your goals and preferences; we help you find relevant options and show why they may fit.</p>
          <div className="ayna-scrapbook__intro-stamp">Made around you</div>
        </section>

        <section className="ayna-scrapbook__team" aria-label="The people behind ayna">
          <div className="ayna-scrapbook__polaroid">
            <div className="ayna-scrapbook__photo"><img src="/team/ayna-team-app.jpg" alt="The ayna team together outdoors" /></div>
            <div className="ayna-scrapbook__handwriting">the people behind ayna</div>
          </div>
          <div className="ayna-scrapbook__team-note">
            <span className="ayna-scrapbook__eyebrow">Meet the team</span>
            <h2>Ameera, Eliz &amp; Puloma</h2>
            <p>Real people building a place to explore women's health with more clarity, care, and community.</p>
          </div>
        </section>

        <section className="ayna-scrapbook__paper ayna-scrapbook__paper--chart">
          <span className="ayna-scrapbook__eyebrow">01 / the little map</span>
          <h2>From a big market to your shop.</h2>
          <p>Each step narrows what you see and makes the reason visible.</p>
          <div className="ayna-scrapbook__chart" role="img" aria-label="Illustration of four stages: open market, fits your profile, passes evidence checks, reaches your shop">
            {CONCEPT_FUNNEL.map((row, index) => <div className="ayna-scrapbook__chart-row" key={row.label}>
              <span className="ayna-scrapbook__chart-num">0{index + 1}</span>
              <div className="ayna-scrapbook__chart-track"><div style={{ width: row.width, background: row.fill }} /></div>
              <span className="ayna-scrapbook__chart-label">{row.label}</span>
            </div>)}
          </div>
          <small>Illustration of the process · bar lengths are not measured data.</small>
        </section>

        <section className="ayna-scrapbook__paper ayna-scrapbook__paper--lavender">
          <span className="ayna-scrapbook__eyebrow">02 / how it works</span>
          <h2>Four little checkpoints.</h2>
          <div className="ayna-scrapbook__gate-grid">
            {TRUST_GATES.map((gate) => <div className="ayna-scrapbook__gate" key={gate.n}>
              <span>{gate.n}</span><strong>{gate.title}</strong><p>{gate.body}</p>
            </div>)}
          </div>
        </section>

        <section className="ayna-scrapbook__paper ayna-scrapbook__paper--match">
          <span className="ayna-scrapbook__eyebrow">03 / what shapes a match</span>
          <h2>More than one signal.</h2>
          <div className="ayna-scrapbook__orbit" role="img" aria-label="Your profile, evidence, clinician context, and community context all shape a match">
            <div className="ayna-scrapbook__orbit-center">your<br />match</div>
            <span>Your profile</span><span>Evidence</span><span>Clinician context</span><span>Community context</span>
          </div>
          <div className="ayna-scrapbook__sticky">Paid placement never changes your match. <span aria-hidden="true">↗</span></div>
        </section>

        <section className="ayna-scrapbook__paper ayna-scrapbook__paper--questions">
          <span className="ayna-scrapbook__eyebrow">Questions we hear</span>
          <h2>A few things to know.</h2>
          <div className="ayna-scrapbook__question-list">
            <div><strong>Who is it for?</strong><p>Anyone exploring products for their own women's health needs, goals, and stage of life.</p></div>
            <div><strong>What's my ecosystem?</strong><p>Your personal space for the products and explanations that fit the profile you build in Ayna.</p></div>
            <div><strong>How do you choose what I see?</strong><p>We compare your profile with relevant products and available evidence, then explain the match in your shop.</p></div>
            <div><strong>What information do you look at?</strong><p>Published research, clinical guidance, clinician input, and community experience all add context.</p></div>
            <div><strong>What can I do in Community?</strong><p>Find people and conversations, share posts and reviews, and make playlists of products.</p></div>
            <div><strong>Can a brand pay for a better match?</strong><p>No. Sponsorship is never an input to your match.</p></div>
            <div><strong>Is ayna medical advice?</strong><p>No. Ayna helps with discovery; medical decisions stay with you and your clinician.</p></div>
          </div>
        </section>

        <section className="ayna-scrapbook__paper">
          <span className="ayna-scrapbook__eyebrow">04 / why ayna</span>
          <h2>Discovery with context.</h2>
          <div className="ayna-scrapbook__difference-list">
            {WHY_AYNA_DIFFERENCES.map((text, index) => <div key={text}><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>{text}</div>)}
          </div>
        </section>

        <section className="ayna-scrapbook__paper ayna-scrapbook__paper--advisors">
          <span className="ayna-scrapbook__eyebrow">People who guide us</span>
          <h2>Real expertise, real names.</h2>
          <p>Meet the people whose experience helps guide ayna.</p>
          <div className="ayna-scrapbook__advisors">
            {ADVISORS.map((advisor) => <div key={advisor.name}>
              <AdvisorAvatar advisor={advisor} />
              <div className="ayna-scrapbook__advisor-copy"><strong>{advisor.name}</strong><small>{advisor.title}</small></div>
            </div>)}
          </div>
        </section>
        <div className="ayna-scrapbook__footer">Ayna is not a doctor. Medical decisions stay with you and your clinician.</div>
        <LegalFooter />
      </div>
    </div>
  );
}

// Real reasons + real endpoint, ported from Contact.jsx/api/contact.js
// this posts to the same live /api/contact route (Resend email to the ayna
// team) the desktop contact page uses, not a local-only mock.
const CONTACT_REASONS = ['Partnerships', 'Help & Support', 'Feedback or Feature Request', 'Press & Media', 'Other'];

function ContactScreen({ onBack }) {
  const [form, setForm] = useState({ name: '', email: '', reason: '', subject: '', message: '' });
  const [reasonOpen, setReasonOpen] = useState(false);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async () => {
    if (status === 'sending') return;
    setStatus('sending');
    setError('');
    try {
      const res = await fetch(apiUrl('/api/contact'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'We could not send your message. Please try again.');
      setStatus('sent');
      setForm({ name: '', email: '', reason: '', subject: '', message: '' });
    } catch (err) {
      setStatus('error');
      setError(err?.message || 'We could not send your message. Please try again.');
    }
  };

  const canSend = form.name.trim().length >= 2 && form.email.trim() && form.reason && form.subject.trim().length >= 2 && form.message.trim().length >= 10;
  const sendReady = canSend && status !== 'sending';

  const fieldStyle = { border: '1px solid var(--ayna-border)', borderRadius: 10, background: 'var(--ayna-surface)', padding: 14, fontWeight: 400, lineHeight: 1.45, fontSize: 'calc(15px * var(--ayna-text-scale, 1))', color: 'var(--ayna-heading)', width: '100%', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' };
  const labelStyle = { fontSize: 'calc(13px * var(--ayna-text-scale, 1))', fontWeight: 500, color: 'var(--ayna-heading)', marginBottom: 7 };

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: 'var(--ayna-surface)' }}>
      <BackHeader title="Contact" onBack={onBack} />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '4px 20px 40px' }}>
        <div style={{ fontFamily: "var(--ayna-font-display)", fontWeight: 400, fontSize: 'calc(28px * var(--ayna-text-scale, 1))', lineHeight: 1.15, color: 'var(--ayna-heading)', margin: '11px 0 0' }}>How can we help?</div>
        <div style={{ fontWeight: 400, fontSize: 'calc(15px * var(--ayna-text-scale, 1))', lineHeight: 1.45, color: 'var(--ayna-text-muted)', marginTop: 13 }}>
          Send us a note and we'll make sure it reaches the right person on the ayna team.
        </div>
        <div style={{ marginTop: 18, paddingTop: 15, borderTop: '1px solid var(--ayna-border)', fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', lineHeight: 1.65, color: 'var(--ayna-text-muted)' }}>
          For brand collaborations, choose <strong style={{ color: 'var(--ayna-heading)' }}>Partnerships</strong>. For questions about using ayna, choose <strong style={{ color: 'var(--ayna-heading)' }}>Help &amp; Support</strong>.
        </div>

        <div style={{ background: 'var(--d-group)', border: 0, borderRadius: 20, padding: '20px 18px 22px', marginTop: 22 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            <div>
              <div style={labelStyle}>Name</div>
              <input value={form.name} onChange={update('name')} placeholder="Your name" style={fieldStyle} />
            </div>
            <div>
              <div style={labelStyle}>Email</div>
              <input value={form.email} onChange={update('email')} placeholder="you@example.com" type="email" style={fieldStyle} />
            </div>
            <div style={{ position: 'relative' }}>
              <div style={labelStyle}>What can we help with?</div>
              <div onClick={() => setReasonOpen((v) => !v)} style={{ ...fieldStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <div style={{ color: form.reason ? '#3e2723' : 'var(--ayna-text-muted)' }}>{form.reason || 'Select one'}</div>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: 'var(--ayna-text-muted)', transform: reasonOpen ? 'rotate(180deg)' : 'none' }}>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
              {reasonOpen && (
                <div style={{ marginTop: 6, border: '1px solid var(--ayna-border)', borderRadius: 10, background: 'var(--ayna-surface)', overflow: 'hidden', boxShadow: '0 14px 28px -18px rgba(42,31,78,.45)' }}>
                  {CONTACT_REASONS.map((r, i) => (
                    <div key={r} onClick={() => { setForm((f) => ({ ...f, reason: r })); setReasonOpen(false); }} style={{ padding: '12px 14px', fontWeight: 400, lineHeight: 1.45, fontSize: 'calc(15px * var(--ayna-text-scale, 1))', color: 'var(--ayna-heading)', cursor: 'pointer', borderTop: i === 0 ? 'none' : '1px solid var(--ayna-border)' }}>{r}</div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <div style={labelStyle}>Subject</div>
              <input value={form.subject} onChange={update('subject')} placeholder="What is this about?" style={fieldStyle} />
            </div>
            <div>
              <div style={labelStyle}>Message</div>
              <textarea value={form.message} onChange={update('message')} placeholder="Tell us how we can help." rows={5} style={{ ...fieldStyle, resize: 'vertical', minHeight: 118, lineHeight: 1.5 }} />
            </div>
          </div>

          {status === 'sent' && (
            <div style={{ marginTop: 16, padding: '11px 13px', borderRadius: 9, background: 'transparent', color: 'var(--ayna-text-muted)', fontWeight: 400, lineHeight: 1.45, fontSize: 'calc(15px * var(--ayna-text-scale, 1))' }}>
              Thanks. Your message has been sent to the ayna team.
            </div>
          )}
          {status === 'error' && (
            <div style={{ marginTop: 16, padding: '11px 13px', borderRadius: 9, background: 'transparent', color: 'var(--ayna-heading)', fontWeight: 400, lineHeight: 1.45, fontSize: 'calc(15px * var(--ayna-text-scale, 1))' }}>
              {error}
            </div>
          )}

          <div
            onClick={() => sendReady && submit()}
            role="button"
            aria-label="Send message"
            style={{
              marginTop: 20, textAlign: 'center', borderRadius: 99, padding: 16, fontWeight: 600, fontSize: 'calc(17px * var(--ayna-text-scale, 1))',
              background: sendReady ? '#3e2723' : 'transparent',
              color: sendReady ? '#FFEDAC' : 'var(--ayna-text-muted)',
              cursor: sendReady ? 'pointer' : 'not-allowed',
              boxShadow: sendReady ? '0 14px 26px -14px rgba(36,42,82,.7)' : 'none',
            }}
          >
            {status === 'sending' ? 'Sending…' : 'Send message'}
          </div>
        </div>
        <LegalFooter />
      </div>
    </div>
  );
}

/* ------------------------------- Orchestrator ------------------------------- */

export default function ProfileFlow({
  onClose,
  theme,
  onToggleTheme,
  onSignOut,
  onSignIn,
  authUser = null,
  name = 'You',
  onNameChanged,
  ecosystemCount = 0,
  savedCount = 0,
  quizAnswers = null,
  myProducts = [],
  matchProducts = [],
  savedProducts = {},
  onViewAlternative,
  onBrowse,
  onGoEcosystem,
  onOpenSaved,
  onEditProfile,
  onAddGoal,
  onOpenRoutine,
  onOpenMonthlyCheckin,
  quizDraft = null,
  onResumeQuiz,
  onStartOverQuiz,
  personalizeWithData = true,
  onPersonalizeWithDataChange,
  askAynaHistoryCount = 0,
  onClearAskAynaHistory,
  textSizeIndex = 1,
  onTextSizeChange,
  initialScreen = null,
  readProgress = {},
  onOpenProduct,
  onOpenArticle,
  onOpenCommunity,
}) {
  // A real back-navigation stack rather than a static single-parent map
  // several screens (Preferences/Notifications, in particular) are now
  // reachable from more than one place (ProfileHub's own row, and Settings'
  // "Notifications" row), so "back" has to return to wherever the user
  // actually came from, not a fixed screen.
  const [screenStack, setScreenStack] = useState(() => {
    if (initialScreen) return ['hub', ...(initialScreen === 'healthInsights' ? ['healthData'] : []), initialScreen];
    const sub = import.meta.env.DEV && new URLSearchParams(window.location.search).get('pscreen');
    return sub ? ['hub', sub] : ['hub'];
  });
  const screen = screenStack[screenStack.length - 1];
  const pushScreen = (next) => setScreenStack((stack) => [...stack, next]);
  const initial = (name || 'Y').trim().charAt(0).toUpperCase() || 'Y';

  const goBack = () => setScreenStack((stack) => (stack.length > 1 ? stack.slice(0, -1) : stack));

  const profileFilledPct = getProfileCompletionPct(quizAnswers?.fullHealthIntake || quizAnswers);
  const selectedNeedIds = useMemo(() => { try { return quizAnswers ? getSelectedNeeds(quizAnswers).map((n) => n.id) : []; } catch { return []; } }, [quizAnswers]);
  const shopperAlertsCount = getSafetyAlerts(myProducts, quizAnswers).length;

  let body;
  if (screen === 'hub') {
    body = (
      <ProfileHub
        authUserId={authUser?.id}
        name={name}
        initial={initial}
        memberSince={authUser?.created_at ? formatMemberSince(authUser.created_at) : ''}
        ecosystemCount={ecosystemCount}
        savedCount={savedCount}
        profileFilledPct={profileFilledPct}
        shopperAlertsCount={shopperAlertsCount}
        myProducts={myProducts}
        savedProducts={savedProducts}
        readProgress={readProgress}
        onOpen={pushScreen}
        onOpenSettings={() => pushScreen('settings')}
        onEditProfile={onEditProfile ? () => { onClose(); onEditProfile(); } : undefined}
        onOpenEcosystem={onGoEcosystem ? () => { onClose(); onGoEcosystem(); } : undefined}
        onOpenSaved={onOpenSaved ? () => { onClose(); onOpenSaved(); } : undefined}
        onOpenMonthlyCheckin={onOpenMonthlyCheckin ? () => { onClose(); onOpenMonthlyCheckin(); } : undefined}
        quizDraft={quizDraft}
        onResumeQuiz={onResumeQuiz}
        onStartOverQuiz={onStartOverQuiz}
        onOpenProduct={onOpenProduct}
        onOpenArticle={onOpenArticle}
        onOpenCommunity={onOpenCommunity}
      />
    );
  } else if (screen === 'badges') {
    body = (
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <BackHeader title="Badges" onBack={goBack} />
        <div className="ay-you-badges">
          <BadgesPanel userId={authUser?.id} myProducts={myProducts} quizAnswers={quizAnswers} variant="app" />
        </div>
      </div>
    );
  } else if (screen === 'shopper') {
    body = (
      <ShopperProfileScreen
        onBack={goBack}
        quizAnswers={quizAnswers}
        myProducts={myProducts}
        savedProducts={savedProducts}
        onViewAlternative={onViewAlternative ? (product) => { onClose(); onViewAlternative(product); } : undefined}
        onBrowse={onBrowse ? () => { onClose(); onBrowse(); } : undefined}
        shopperProfile={buildShopperProfile(quizAnswers?.fullHealthIntake, myProducts)}
      />
    );
  } else if (screen === 'startups') {
    body = <EarlyStageScreen onBack={goBack} quizAnswers={quizAnswers} />;
  } else if (screen === 'preferences') {
    body = (
      <PreferencesScreen
        onBack={goBack}
        theme={theme}
        onToggleTheme={onToggleTheme}
        onOpenChannels={() => pushScreen('channels')}
        personalizeWithData={personalizeWithData}
        onPersonalizeWithDataChange={onPersonalizeWithDataChange}
        askAynaHistoryCount={askAynaHistoryCount}
        onClearAskAynaHistory={onClearAskAynaHistory}
        textSizeIndex={textSizeIndex}
        onTextSizeChange={onTextSizeChange}
      />
    );
  } else if (screen === 'channels') {
    body = <ChannelsScreen onBack={goBack} />;
  } else if (screen === 'settings') {
    body = (
      <SettingsScreen
        onBack={goBack}
        onOpenPreferences={() => pushScreen('preferences')}
        onOpenTexts={() => pushScreen('texts')}
        onOpenHowItWorks={() => pushScreen('howItWorks')}
        onOpenAboutAyna={() => pushScreen('aboutAyna')}
        onOpenContact={() => pushScreen('contact')}
        onOpenAccountInfo={() => pushScreen('accountInfo')}
        onOpenPrivacyData={() => pushScreen('privacyData')}
        onOpenLegal={() => pushScreen('legal')}
        authUser={authUser}
        onSignOut={onSignOut}
        onSignIn={onSignIn ? () => { onClose(); onSignIn(); } : undefined}
      />
    );
  } else if (screen === 'texts') {
    body = <TextMessagesScreen onBack={goBack} authUser={authUser} />;
  } else if (screen === 'howItWorks') {
    body = <HowItWorksScreen onBack={goBack} />;
  } else if (screen === 'aboutAyna') {
    body = <AboutAynaScreen onBack={goBack} />;
  } else if (screen === 'contact') {
    body = <ContactScreen onBack={goBack} />;
  } else if (screen === 'accountInfo') {
    body = (
      <AccountInfoScreen
        onBack={goBack}
        authUser={authUser}
        name={name}
        onNameChanged={onNameChanged}
        quizAnswers={quizAnswers}
        onOpenPassword={() => pushScreen('password')}
        onEditProfile={onEditProfile ? () => { onClose(); onEditProfile(); } : undefined}
        onOpenManageData={() => pushScreen('manageData')}
        onOpenDeleteAccount={() => pushScreen('deleteAccount')}
      />
    );
  } else if (screen === 'password') {
    body = <PasswordScreen onBack={goBack} authUser={authUser} />;
  } else if (screen === 'privacyData') {
    body = (
      <PrivacyDataScreen
        onBack={goBack}
        onOpenManageData={() => pushScreen('manageData')}
        onOpenDeleteAccount={() => pushScreen('deleteAccount')}
        onOpenHealthData={() => pushScreen('healthData')}
      />
    );
  } else if (screen === 'deleteAccount') {
    body = <DeleteAccountScreen onBack={goBack} onSignOut={onSignOut} onClose={onClose} />;
  } else if (screen === 'legal') {
    body = (
      <LegalScreen
        onBack={goBack}
        onOpenConsumerHealthData={() => pushScreen('consumerHealthData')}
        onOpenOpenSourceLicenses={() => pushScreen('openSourceLicenses')}
        onOpenTypefaces={() => pushScreen('typefaces')}
        onOpenResearchSources={() => pushScreen('researchSources')}
      />
    );
  } else if (screen === 'consumerHealthData') {
    body = <ConsumerHealthDataPolicyScreen onBack={goBack} />;
  } else if (screen === 'openSourceLicenses') {
    body = <OpenSourceLicensesScreen onBack={goBack} />;
  } else if (screen === 'typefaces') {
    body = <TypefacesScreen onBack={goBack} />;
  } else if (screen === 'researchSources') {
    body = <ResearchSourcesScreen onBack={goBack} />;
  } else if (screen === 'healthData' || screen.startsWith('healthData:')) {
    const sourceId = screen.slice('healthData:'.length) || null;
    body = (
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <BackHeader title="Health data" onBack={goBack} />
        <div className="ay-hc-scroll">
          <HealthConnectionsScreen
            selectedId={screen === 'healthData' ? null : sourceId}
            onSelect={(id) => pushScreen(`healthData:${id}`)}
            onBack={goBack}
            authUser={authUser}
            onSignIn={onSignIn ? () => { onClose(); onSignIn(); } : undefined}
            onOpenInsights={() => pushScreen('healthInsights')}
          />
        </div>
      </div>
    );
  } else if (screen === 'healthInsights') {
    body = (
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <BackHeader title="Your health" onBack={goBack} />
        <div className="ay-hc-scroll">
          <HealthInsightsScreen
            authUser={authUser}
            selectedNeedIds={selectedNeedIds}
            hormonalBC={usesHormonalBC(quizAnswers)}
            products={myProducts}
            matches={matchProducts}
            onOpenProduct={onOpenProduct}
            onConnect={() => pushScreen('healthData')}
            onAddGoal={onAddGoal}
            onOpenRoutine={onOpenRoutine ? () => { onClose(); onOpenRoutine(); } : undefined}
          />
        </div>
      </div>
    );
  } else if (screen === 'manageData') {
    body = <ManageDataScreen onBack={goBack} />;
  }

  return (
    <div className="ayna-fresh-profile-overlay" style={{ position: 'fixed', inset: 0, bottom: 'var(--ayna-bottom-nav-height)', zIndex: 55, background: 'var(--ayna-bg)', display: 'flex' }}>
      {/* Keyed on `screen` so each push/pop within this overlay (hub -> Shopper
          Profile -> Preferences -> Settings, etc.) remounts this wrapper and
          replays the entrance animation, without the key, only the overlay's
          own first mount would ever animate, since `body` swapping alone
          doesn't restart a running CSS animation. */}
      <div key={screen} className="ay-set-page" data-page={screen} style={{ flex: 1, minWidth: 0, display: 'flex', animation: 'ay-page .22s ease-out' }}>
        <SignInContext.Provider value={onSignIn || null}>{body}</SignInContext.Provider>
      </div>
    </div>
  );
}
