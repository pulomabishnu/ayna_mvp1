import { avatarInitials } from '../utils/avatarInitials';
import ProTag from '../pro/ProTag.jsx';
import WebSettingsSearch from './you/WebSettingsSearch.jsx';
import WhatAynaKnows from './you/WhatAynaKnows.jsx';
import DailyCheckin from './you/DailyCheckin.jsx';
import BoxWaitlist, { SHOW_BOX_WAITLIST } from './you/BoxWaitlist.jsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ALL_PRODUCTS } from '../data/products.js';
import { getSupabaseClient } from '../utils/supabaseClient';
import { buildShopperProfile } from '../mobile/utils/shopperProfile.js';
import { getBrandAffinity, getSafetyAlerts } from '../mobile/utils/shopperProfileData.js';
import { getProfileCompletionPct } from '../mobile/utils/profileCompleteness.js';
import { ROUTINE_BUCKETS, ROUTINE_BUCKET_LABELS, useRoutine } from '../mobile/hooks/useRoutine.js';
import { fetchDataExport } from '../mobile/utils/dataExportApi.js';
import { AnalyticsToggle } from './SiteFooter';
import { findSharedActives } from '../utils/sharedActives';
import { ECOSYSTEM_AREAS, resolveEcosystemProductArea } from './EcosystemBubbles';
import { inviteLinkFor } from '../utils/badges';
import { useHealthMatchPref } from '../health/matchPref.js';
import FreeProductAccountCard from './freeProduct/FreeProductAccountCard';
import { getCareProfile } from '../utils/careProfile';
import EmailSettings from './EmailSettings';
import TipsSettings from '../mobile/tutorial/TipsSettings.jsx';
import { getMyCommunityProfile, getProfileStats, listPlaylists } from '../utils/community/communityStore.js';
import { publicMediaUrl } from '../utils/community/imageUpload.js';
import { buildDashboard, formatMetric } from '../health/dashboard.js';
import { estimatePhase } from '../health/phase.js';
import { localToday, useHealthData } from '../mobile/hooks/useHealthData.js';
import ProductTileImage, { ProductImageFallback } from './ProductTileImage';
import RelativeTime from './ui/RelativeTime.jsx';
import { ArchAvatar, HouseBlend } from './you/YouBits.jsx';
import YouBento from './you/YouBento.jsx';
import { Shout } from './ui/ay';
import { setupSteps, knowsLine, countAnswers, connectedNames } from './you/setupSteps.js';
import '../styles/you-hub.css';
import '../styles/unique-b.css';
import { useSavedPosts, postLine } from '../hooks/useSavedPosts.js';
import { recentQuestions } from '../utils/askRecent.js';
import usePersistentState from '../hooks/usePersistentState.js';
import { useCheckinCountStatus } from '../hooks/useCheckinCount.js';
import { localDayKey } from '../utils/localDate.js';
import { RundownSetting } from './today/RundownNotifyAsk.jsx';

// The app's "You" tab, built for the website: profile progress, your shelf
// (charts from real data), badges, routine + safety alerts, and account
// settings. Every count on this page comes from one source: the myProducts
// (Ecosystem) and savedProducts props.

function firstName(user) {
  const m = user?.user_metadata || {};
  return String(m.first_name || m.firstName || m.given_name || m.full_name || m.name || '').trim().split(/\s+/)[0] || '';
}
function memberSince(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : `Member since ${d.toLocaleString('en-US', { month: 'short', year: 'numeric' })}`;
}

const PRODUCT_BY_ID = new Map(ALL_PRODUCTS.map((p) => [p.id, p]));
const CATEGORY_LABEL = (c) => String(c || '').replace(/-/g, ' ').replace(/^\w/, (m) => m.toUpperCase());
// Routine is for things you use up (pads, supplements...). Telehealth, apps and other services are left out.
const isConsumable = (p) => {
  const full = PRODUCT_BY_ID.get(p?.id) || p || {};
  return ((full.type || p?.type) === 'physical' || p?.userAdded === true) && full.category !== 'telehealth';
};

/* At a glance: what she told us, in a few facts, and her shelves by the same
   names My ecosystem uses. No personality label (she never asked for one). */
/* Badges are gone from the website until the app ships (a badge for an app
   people can't get, and points for a health profile, didn't fit). The invite
   link stays. No network calls: the link is built from her account id. */
function InviteCard({ userId }) {
  const link = inviteLinkFor(userId, typeof window !== 'undefined' ? window.location.origin : 'https://www.aynahealth.co');
  const [copied, setCopied] = useState(false);
  if (!link) return null;
  return <section className="wy-sec" aria-labelledby="wyou-invite-h">
    <h2 className="ay-group__title" id="wyou-invite-h">Invite a friend</h2>
    <div className="ay-group is-padded wy-invite">
      <p className="wy-note">Friends who join get their own private profile.</p>
      <div className="wy-invite__row">
        <input readOnly value={link} aria-label="Your invite link" onFocus={(e) => e.currentTarget.select()} />
        <button type="button" className="ay-btn ay-btn--secondary" onClick={async () => { try { await navigator.clipboard.writeText(link); setCopied(true); window.setTimeout(() => setCopied(false), 2000); } catch { /* clipboard blocked */ } }}>{copied ? 'Copied' : 'Copy link'}</button>
      </div>
    </div>
  </section>;
}

function Glance({ profile, products, quizResults }) {
  // Every sensitivity in one place, read the same way the product pages and Appointment prep read it.
  const care = getCareProfile(quizResults);
  const avoid = [...new Set([...care.allergies, ...(care.prefersFragranceFree ? ['Fragrance'] : [])].map((x) => x.replace(/^\w/, (c) => c.toUpperCase())))];
  const rows = [
    ...(profile?.rows || []).filter((r) => r.key !== 'type' && r.key !== 'non'),
    avoid.length ? { key: 'avoid', label: 'Sensitivities', value: avoid.join(' · ') } : null,
  ].filter(Boolean).slice(0, 5);
  const counts = new Map();
  products.forEach((p) => { const a = resolveEcosystemProductArea(p, ECOSYSTEM_AREAS); const k = a ? a.label : 'Other'; counts.set(k, (counts.get(k) || 0) + 1); });
  const shelves = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return <section className="wy-sec" aria-labelledby="wyou-glance-h">
    <h2 className="ay-group__title" id="wyou-glance-h">At a glance</h2>
    <dl className="ay-group wy-rows">
      {shelves.length > 0 && <div className="ay-group__row"><span className="ay-group__text"><dt className="ay-group__label">Your shelves</dt><dd className="ay-group__value">{shelves.map(([k, n]) => `${k} (${n})`).join(', ')}</dd></span></div>}
      {rows.map((r) => <div className="ay-group__row" key={r.key}><span className="ay-group__text"><dt className="ay-group__label">{r.label}</dt><dd className="ay-group__value">{r.value}</dd></span></div>)}
    </dl>
  </section>;
}

// "Citracal Maximum Plus Calcium Citrate + D3, 120 Caplets" → "Citracal Maximum Plus Calcium" (full name on hover).
const shortName = (p) => {
  const base = String(p?.name || '').split(/,|\(| - /)[0].trim();
  const words = base.split(/\s+/);
  return words.length > 4 ? `${words.slice(0, 4).join(' ')}…` : base;
};

function Routine({ products }) {
  // Only things you use up get a routine slot (services like telehealth are left out).
  const [bucket, setBucket] = useState('morning');
  const { routineMap, setProductBucket, removeFromRoutine } = useRoutine();
  const inBucket = products.filter((p) => routineMap[p.id] === bucket);
  const others = products.filter((p) => routineMap[p.id] !== bucket);
  const placed = products.filter((p) => routineMap[p.id]).length;
  // Overlaps among the things she places in her routine (e.g. two chasteberry products).
  const shared = findSharedActives(products.filter((p) => routineMap[p.id]), 3);
  return <section className="wy-sec" aria-labelledby="wy-routine-h">
    <div className="wy-sec__head"><h2 className="ay-group__title" id="wy-routine-h">Routine</h2><span className="wy-count">{placed} of {products.length} placed</span></div>
    <div className="ay-group wy-routine">
      <p className="wy-note">Things you use on a schedule. Apps and services aren’t counted.</p>
      <div className="ay-chip-row" role="tablist" aria-label="Time of day">{ROUTINE_BUCKETS.map((b) => <button type="button" key={b} role="tab" aria-selected={bucket === b} className="ay-chip" onClick={() => setBucket(b)}>{ROUTINE_BUCKET_LABELS[b]}</button>)}</div>
      {inBucket.length ? <ul className="wy-list">{inBucket.map((p) => <li key={p.id}><span title={p.name}>{shortName(p)}</span><button type="button" className="ct-link" onClick={() => removeFromRoutine(p.id)}>Remove</button></li>)}</ul>
        : <p className="wy-note">Nothing in {ROUTINE_BUCKET_LABELS[bucket].toLowerCase()} yet.</p>}
      {shared.length > 0 && <div className="ay-alert wy-shared" role="note"><span aria-hidden="true">!</span><span><strong>Same active ingredient</strong>{shared.map(([a, names]) => <span key={a} className="wy-shared__line"><b>{a}</b> is in {names.join(' and ')}. Worth checking you need both.</span>)}</span></div>}
      {others.length > 0 && <div className="wy-add"><small>Add from your ecosystem</small><div>{others.map((p) => <button type="button" key={p.id} className="wy-add__btn" onClick={() => setProductBucket(p.id, bucket)} title={p.name} aria-label={`Add ${p.name} to ${ROUTINE_BUCKET_LABELS[bucket].toLowerCase()}`}>+ {shortName(p)}</button>)}</div></div>}
    </div>
  </section>;
}

/* Her Community profile (photo, @handle), follower counts and her own
   playlists. Each piece is optional: anything that fails just doesn't show. */
function useMyCommunity(userId) {
  const [data, setData] = useState({ userId: null, profile: null, stats: null, playlists: [] });
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !userId) return undefined;
    let cancelled = false;
    (async () => {
      const profile = await getMyCommunityProfile(supabase, userId).catch(() => null);
      if (cancelled || !profile) { if (!cancelled) setData({ userId, profile: null, stats: null, playlists: [] }); return; }
      const [stats, playlists] = await Promise.allSettled([getProfileStats(supabase, userId), listPlaylists(supabase, { section: 'mine', limit: 7 })]);
      if (cancelled) return;
      setData({ userId, profile, stats: stats.status === 'fulfilled' ? stats.value : null, playlists: playlists.status === 'fulfilled' ? playlists.value || [] : [] });
    })();
    return () => { cancelled = true; };
  }, [userId]);
  return data.userId === userId ? data : { profile: null, stats: null, playlists: [] };
}

const fmtCount = (n) => Number(n || 0).toLocaleString('en-US');
const READ_DONE = 0.95;
function readProgressFor(userId) {
  try { return JSON.parse(localStorage.getItem(`ayna_read_progress_v1:${userId || 'guest'}`) || '{}') || {}; } catch { return {}; }
}
function relativeDay(iso) {
  const t = Date.parse(iso || '');
  if (!Number.isFinite(t)) return '';
  const start = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };
  const days = Math.round((start(Date.now()) - start(t)) / 86400000);
  if (days < 0) return '';
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
/* Same as the app's "Recently": Ecosystem products (dated ones first), saved
   products and finished reads, taking turns. Only real dates are shown. */
function buildRecent(products, savedProducts, progress, articles) {
  const eco = [...products].reverse().filter((p) => p?.id).map((p) => ({ key: `eco-${p.id}`, label: (p.intakeGenerated || p.llmGenerated) && !p._userSwapped && !p.userAdded ? 'Suggested for you' : 'In your routine', product: { ...(PRODUCT_BY_ID.get(p.id) || {}), ...p }, at: p.addedAt || null }));
  const ecoIds = new Set(products.map((p) => p?.id));
  const saved = Object.values(savedProducts || {}).filter(Boolean).reverse().filter((p) => p?.id && !ecoIds.has(p.id))
    .map((p) => ({ key: `saved-${p.id}`, label: 'Saved', product: { ...(PRODUCT_BY_ID.get(p.id) || {}), ...p }, at: null }));
  const reads = Object.entries(progress || {}).filter(([, v]) => v >= READ_DONE).map(([id]) => (articles || []).find((a) => a.id === id)).filter(Boolean).reverse()
    .map((a) => ({ key: `read-${a.id}`, label: 'Read', article: a, at: null }));
  const dated = eco.filter((i) => i.at).sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  const lists = [eco.filter((i) => !i.at), saved, reads];
  const rest = [];
  for (let i = 0; rest.length < 10 && lists.some((l) => l.length > i); i += 1) for (const l of lists) if (l[i]) rest.push(l[i]);
  return [...dated, ...rest].filter((i) => i.product?.name || i.article?.title).slice(0, 10);
}

const WEEK_METRICS = ['sleep_minutes', 'steps', 'active_energy_kcal', 'workout_minutes'];
const SIDE_METRICS = ['readiness_score', 'resting_hr_bpm', 'sleep_minutes', 'steps'];
const METRIC_PER = { sleep_minutes: 'Sleep a night', steps: 'Steps a day', active_energy_kcal: 'Active energy a day', workout_minutes: 'Workouts a day', readiness_score: 'Readiness', resting_hr_bpm: 'Resting heart rate' };
const showMetric = (c) => (c.metric === 'steps' ? fmtCount(Math.round(c.week)) : formatMetric(c.metric, c.week));
const isoDay = (d) => localDayKey(d);

/* "This week": cycle day and one or two real metrics from connected data, or
   the way to connect. Days with no data stay as a stub, never an invented bar. */
function ThisWeek({ userId, onOpen, onConnect }) {
  const health = useHealthData(userId || null);
  const today = localToday();
  const week = useMemo(() => buildDashboard(health.insightRows || [], { days: 7, today }), [health.insightRows, today]);
  const month = useMemo(() => buildDashboard(health.insightRows || [], { days: 30, today }), [health.insightRows, today]);
  const charts = week.groups.flatMap((g) => g.charts).filter((c) => c.week != null);
  const bar = WEEK_METRICS.map((m) => charts.find((c) => c.metric === m)).find(Boolean) || null;
  const cycle = month.cycle?.cycleDay ? month.cycle : null;
  const phase = cycle ? estimatePhase(cycle) : null;
  const side = cycle ? null : SIDE_METRICS.map((m) => charts.find((c) => c.metric === m && c.metric !== bar?.metric)).find(Boolean) || null;
  const head = <h2 className="ay-group__title" id="wy-week-h">This week</h2>;
  if ((health.status === 'loading' || health.status === 'idle') && !health.loadedAt) return <section className="wy-sec" aria-labelledby="wy-week-h">{head}<div className="ay-group is-padded wy-week" role="status"><span className="wy-note">Getting your week…</span></div></section>;
  if (!cycle && !bar && !side) {
    return <section className="wy-sec" aria-labelledby="wy-week-h">{head}
      <div className="ay-group is-padded wy-week is-empty">
        <svg className="wy-week__icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h4l2-5 4 10 2-5h6" /></svg>
        <p className="wy-note">Your health dashboard lives here. Connect Apple Health, Oura or upload a file to see your week.</p>
        {onConnect && <button type="button" className="ay-btn ay-btn--secondary cm-small" onClick={onConnect}>Connect<ProTag /></button>}
      </div>
    </section>;
  }
  const first = cycle ? { value: `Day ${cycle.cycleDay}`, label: phase ? (phase.id === 'ovulation' ? 'Around ovulation' : phase.name) : 'Of your cycle' } : side ? { value: showMetric(side), label: METRIC_PER[side.metric] } : null;
  const second = bar ? { value: showMetric(bar), label: METRIC_PER[bar.metric] } : null;
  const end = new Date(`${today}T12:00:00`);
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(end); d.setDate(end.getDate() - 6 + i); return d; });
  const byDay = new Map((bar?.points || []).map((p) => [p.day, p.value]));
  const values = days.map((d) => byDay.get(isoDay(d)) ?? null);
  const hi = Math.max(...values.filter((v) => v != null), 0) || 1;
  return <section className="wy-sec" aria-labelledby="wy-week-h">{head}
    <button type="button" className="ay-group is-padded wy-week" onClick={onOpen}>
      <span className="wy-week__nums">
        {first && <span><b>{first.value}</b><small>{first.label}</small></span>}
        {second && <span><b>{second.value}</b><small>{second.label}</small></span>}
      </span>
      {bar && <span className="wy-bars" aria-hidden="true">{days.map((d, i) => <span key={isoDay(d)} className={`${i === 6 ? 'is-today' : ''}${values[i] == null ? ' is-empty' : ''}`}><i style={{ height: values[i] == null ? '4px' : `${Math.max(8, (values[i] / hi) * 100)}%` }} /><small>{d.toLocaleDateString('en-US', { weekday: 'narrow' })}</small></span>)}</span>}
      <span className="wy-week__go">Open your health dashboard <span aria-hidden="true">→</span></span>
    </button>
  </section>;
}

function PlaylistCover({ playlist }) {
  if (playlist.cover_url) return <span className="cm-cover"><img src={publicMediaUrl(playlist.cover_url)} alt="" loading="lazy" /></span>;
  const picks = (playlist.preview_product_ids || []).map((id) => PRODUCT_BY_ID.get(String(id))).filter(Boolean).slice(0, 4);
  if (!picks.length) return <span className="cm-cover">ayna</span>;
  return <span className="cm-cover is-mosaic">{picks.map((p) => <span key={p.id} className="cm-cover-tile"><ProductTileImage product={p} imgStyle={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} letterNode={<ProductImageFallback style={{ position: 'absolute', inset: 0 }} />} /></span>)}</span>;
}

const Chev = () => <svg className="wy-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>;

function HealthMatchStatus({ userId, onOpen }) {
  const pref = useHealthMatchPref(userId);
  return (
    <div className="ay-group is-padded wy-hmatch">
      <p><b>{pref.on ? 'On' : 'Off'}.</b> {pref.on ? 'Trends from apps like Apple Health can move picks up inside goals you chose.' : 'Your matches use only your answers.'}</p>
      {onOpen && <button type="button" className="ay-btn ay-btn--text" onClick={onOpen}>Change in Health data</button>}
    </div>
  );
}

export default function WebYou({ onUpdateIntakeLocal = null, onEditAnswerAt = null, healthConnected = [], section = null, nav = null, onOpenSection, recentAsks = [], savedSlot = null, onOpenPost, onUpdateIntake = null, onOpenCommunity, onOpenArticle, user, quizResults, myProducts = {}, savedProducts = {}, onEditProfile, onOpenEcosystem, onOpenSaved, onOpenCheckin, onOpenProduct, onOpenPhoneVerify, onSignOut, onDeleteAccount, onStartQuiz, onSignIn, theme = 'light', onThemeChange, onOpenFreeProduct, onOpenHealthData, onConnectHealth = null, onOpenHealth, healthSummary = null, healthConnectedCount = 0, quizSlot = null, signedOutSlot = null }) {
  const settingsRef = useRef(null);
  const products = useMemo(() => Object.values(myProducts || {}).filter(Boolean), [myProducts]);
  const checkin = useCheckinCountStatus(user?.id);
  const checkinCount = checkin.count;
  const consumables = useMemo(() => products.filter(isConsumable), [products]);
  const intake = quizResults?.fullHealthIntake || null;
  const pct = getProfileCompletionPct(intake);
  // "No unscented" read as the opposite of a fragrance sensitivity. Say what it must be.
  const shopper = (() => {
    const sp = buildShopperProfile(intake, products);
    if (!sp?.rows) return sp;
    return { ...sp, rows: sp.rows.map((r) => (r.key !== 'non' ? r : {
      ...r,
      label: 'Must be',
      value: String(r.value).split(' · ').map((v) => (/unscented|fragrance/i.test(v) ? 'Fragrance-free' : v)).join(' · '),
    })) };
  })();
  // A note that says "(not a recall)" is never labelled Recall.
  const alerts = getSafetyAlerts(products, quizResults)
    .map((a) => (a.kind === 'recall' && /not a recall/i.test(`${a.title} ${a.body}`) ? { ...a, kind: 'accuracy' } : a))
    // A lawsuit (dropped or not) is not a safety alert; it stays on the product's own page.
    .filter((a) => !(a.kind === 'note' && /lawsuit|class action/i.test(a.body)))
    // A sensitivity is flagged only when the product contains it ("fragrance-free" used to trip "fragrance").
    .map((a) => {
      if (a.kind !== 'sensitivity') return a;
      const word = /fragrance/i.test(a.id) ? 'fragrance' : /latex/i.test(a.id) ? 'latex' : /synthetic/i.test(a.id) ? 'synthetic' : '';
      if (!word) return a;
      const hits = products.filter((p) => {
        const text = `${p?.safety?.allergens || ''} ${(p?.tags || []).join(' ')} ${p?.ingredients || ''}`.toLowerCase()
          .replace(new RegExp(`(${word})[- ]?free|no (added )?${word}|without ${word}|${word}s? not (added|used)|unscented`, 'g'), ' ');
        return text.includes(word);
      });
      if (!hits.length) return null;
      const label = word.charAt(0).toUpperCase() + word.slice(1);
      return { ...a, title: `${label} flagged in ${hits.length} item${hits.length === 1 ? '' : 's'}`, body: `You told us to avoid ${word}. Listed in: ${hits.map((m) => m.name).join(', ')}.`, product: hits[0] };
    })
    .filter(Boolean);
  const affinity = getBrandAffinity(quizResults, products);
  // (Category counts now live only in At a glance.)
  const savedCount = Object.values(savedProducts || {}).filter(Boolean).length;
  // Same source as the header greeting (user_metadata), read on every render so a
  // late-arriving session (after a reload) shows the name instead of "Not set".
  const [savedName, setName] = useState('');
  const name = savedName || firstName(user);
  // An open edit (name, email) survives a refresh, per account. Its field
  // takes focus only when she just tapped Edit (no keyboard on page load).
  const openedEditRef = useRef(false);
  const [nameDraft, setNameDraft] = usePersistentState(user?.id ? `you:name-draft:${user.id}` : null, null);
  const [note, setNote] = useState('');

  const flash = (text) => { setNote(text); window.setTimeout(() => setNote(''), 2600); };
  const saveName = async () => {
    const next = String(nameDraft || '').trim();
    if (!next) return;
    try {
      const { error } = await getSupabaseClient().auth.updateUser({ data: { first_name: next, full_name: next } });
      if (error) throw error;
      setName(next); setNameDraft(null); flash('Name saved');
    } catch { flash('Could not save your name right now'); }
  };
  // Google and Apple accounts have no ayna password; checking every linked identity, not just the first.
  const providers = [user?.app_metadata?.provider, ...(user?.app_metadata?.providers || []), ...((user?.identities || []).map((i) => i?.provider))].filter(Boolean);
  const provider = providers.includes('email') ? 'email' : (providers.find((x) => x === 'google' || x === 'apple') || user?.app_metadata?.provider || 'email');
  const [emailDraft, setEmailDraft] = usePersistentState(user?.id ? `you:email-draft:${user.id}` : null, null);
  const changeEmail = async () => {
    const next = String(emailDraft || '').trim();
    if (!next) return;
    try {
      const { error } = await getSupabaseClient().auth.updateUser({ email: next });
      if (error) throw error;
      setEmailDraft(null); flash(`Check ${next} for a link to confirm the change`);
    } catch { flash('Could not change your email right now'); }
  };
  const resetPassword = async () => {
    try {
      const { error } = await getSupabaseClient().auth.resetPasswordForEmail(user.email, { redirectTo: `${window.location.origin}/you` });
      if (error) throw error;
      flash(`Reset link sent to ${user.email}`);
    } catch { flash('Could not send a reset email right now'); }
  };
  const downloadData = async () => {
    try {
      const data = await fetchDataExport();
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url; a.download = 'ayna-my-data.json'; a.click();
      URL.revokeObjectURL(url);
    } catch { flash('Could not download your data right now'); }
  };

  const community = useMyCommunity(user?.id || null);
  const [progress] = useState(() => readProgressFor(user?.id));
  const [articles, setArticles] = useState(null);
  const hasReads = Object.values(progress).some((v) => v >= READ_DONE);
  useEffect(() => {
    if (!hasReads) return undefined;
    let live = true;
    import('./Articles.jsx').then((m) => { if (live) setArticles(m.ARTICLES || []); }).catch(() => {});
    return () => { live = false; };
  }, [hasReads]);
  const recent = useMemo(() => buildRecent(products, savedProducts, progress, articles), [products, savedProducts, progress, articles]);
  const savedPosts = useSavedPosts(user?.id || null, 6);
  const asks = recentQuestions(recentAsks || [], 4);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const goSection = (key) => onOpenSection?.(key);

  if (!user) {
    // Signed out (You audit P2): the example shelves and the 3 steps, the same honest preview My ecosystem shows.
    return <section className="ct wy yh ay-container is-signedout" data-tour="you">
      {quizSlot}
      {signedOutSlot || <div className="wy-signedout">
        <h1 className="ay-h1">Build your health ecosystem</h1>
        <p className="ct-lede">Keep your concerns, matches, saved products and health insights connected in one place.</p>
        <div className="wy-signedout__doors">{!quizSlot && <button type="button" className="ay-btn ay-btn--primary" onClick={onStartQuiz}>Build mine</button>}{onSignIn && <button type="button" className="ay-btn ay-btn--secondary" onClick={onSignIn}>Sign in</button>}</div>
      </div>}
      {/* Her answers already work on this device, so she can see and change them. */}
      {quizResults?.fullHealthIntake && <div className="wy-know" data-tour="you-know"><WhatAynaKnows variant="web" quizAnswers={quizResults} connected={healthConnected} onUpdateIntake={onUpdateIntakeLocal} onEditStep={onEditAnswerAt || (() => onEditProfile?.())} onManageData={onOpenHealthData} /></div>}
    </section>;
  }

  const initial = avatarInitials(user, (name || 'Y').charAt(0).toUpperCase());
  const { profile: cp, stats, playlists } = community;
  const openMyProfile = cp?.username && onOpenCommunity ? () => onOpenCommunity({ username: cp.username }) : null;
  const TIER = { recall: [0, 'Recall'], sensitivity: [1, 'Your sensitivity'], accuracy: [2, 'Accuracy note'], note: [3, 'FYI'] };
  const sortedAlerts = [...alerts].sort((x, y) => (TIER[x.kind]?.[0] ?? 3) - (TIER[y.kind]?.[0] ?? 3));
  const activeAlerts = alerts.filter((a) => a.kind !== 'note').length;
  const fyi = alerts.length - activeAlerts;
  // First sentence, without cutting at "v." or "e.g." (it used to stop at "Manson v."), and no emoji.
  const firstLine = (t) => {
    const text = String(t || '').replace(/^(?:⚠️?|\s)+/, '').trim();
    const re = /[.!?](?=\s+[A-Z(]|$)/g; let m;
    while ((m = re.exec(text))) {
      const before = text.slice(0, m.index + 1);
      if (/\b(v|vs|e\.g|i\.e|etc|inc|no|dr|st)\.$/i.test(before) || before.length < 10) continue;
      return before;
    }
    return text;
  };
  const row = (key, label, value, end, extra = {}) => <div className="ay-group__row wy-row" key={key} {...extra}><span className="ay-group__text"><span className="ay-group__label">{label}</span><span className="ay-group__value">{value}</span></span>{end && <span className="ay-group__end">{end}</span>}</div>;
  const linkRow = (key, label, value, onClick, note) => onClick && <li key={key}><button type="button" className="ay-group__row ay-group__row--link wy-row" onClick={onClick}><span className="ay-group__text"><span className="ay-group__value">{label}</span>{note && <span className="ay-group__note">{note}</span>}</span><span className="ay-group__end">{value != null && <span className="wy-rowval">{value}</span>}<Chev /></span></button></li>;

  // Set-up as a count that starts with what she already did (You audit 12, endowed progress).
  const setup = setupSteps({ hasAnswers: !!intake, productCount: products.length, connectedCount: healthConnectedCount, checkinCount });
  const SETUP_GO = { quiz: intake ? onEditProfile : onStartQuiz, ecosystem: onOpenEcosystem, connect: onOpenHealthData, checkin: onOpenCheckin };
  const knows = knowsLine({ answerCount: countAnswers(intake), connectedNames: connectedNames(healthConnected), savedCount });
  const care = getCareProfile(quizResults);
  const avoid = [...new Set([...care.allergies, ...(care.prefersFragranceFree ? ['Fragrance'] : [])].map((x) => x.replace(/^\w/, (c) => c.toUpperCase())))];

  // Safety alerts lead the You hub (what matters right now).
  const safetySection = <section className="wy-sec" aria-labelledby="wy-safety-h">
    <div className="wy-sec__head"><h2 className="ay-group__title" id="wy-safety-h">Safety alerts</h2><span className="wy-count">{activeAlerts ? `${activeAlerts} to check` : 'Nothing urgent'}{fyi > 0 ? ` · ${fyi} FYI` : ''}</span></div>
    {sortedAlerts.length ? <ul className="ay-group wy-alerts">{sortedAlerts.map((a) => {
      const one = a.kind === 'note' ? '' : firstLine(a.body);
      const named = a.kind === 'sensitivity' ? products.filter((p) => p?.name && String(a.body).includes(p.name)) : [];
      return <li key={a.id} className={`wy-alert is-${a.kind}`}>
        <span className="wy-alert__tier">{TIER[a.kind]?.[1] || 'Note'}</span>
        <strong>{a.title}</strong>
        {one && <p>{one}</p>}
        {one !== a.body && <details><summary>Details</summary><p>{a.body}</p></details>}
        {named.length > 1
          ? <div className="wy-alert__links">{named.map((p) => <button key={p.id} type="button" className="ct-link" onClick={() => onOpenProduct?.(p)}>{p.name}</button>)}</div>
          : a.product && <button type="button" className="ct-link" onClick={() => onOpenProduct?.(a.product)}>View product</button>}
      </li>;
    })}</ul> : <p className="ay-group is-padded wy-note">No alerts on your ecosystem.</p>}
  </section>;

  const facts = [
    { key: 'picks', value: fmtCount(products.length), caption: 'In your ecosystem', onClick: onOpenEcosystem },
    { key: 'saved', value: fmtCount(savedCount), caption: savedCount === 1 ? 'Saved product' : 'Saved products', onClick: onOpenSaved || (() => goSection('saved')) },
    { key: 'checkins', value: checkinCount != null ? fmtCount(checkinCount) : checkin.settled ? '–' : '…', caption: checkinCount === 1 ? 'Monthly check-in' : 'Monthly check-ins', onClick: onOpenCheckin },
  ];

  return <section className="ct wy yh ay-container" data-tour="you">
    <header className="yh-head ay-pagehead ay-band--calm">
      <ArchAvatar className="wy-arch" src={cp?.avatar_url && !avatarFailed ? publicMediaUrl(cp.avatar_url) : ''} initial={initial} onError={() => setAvatarFailed(true)} />
      <div className="wy-who">
        {/* The page's one shout (uniqueness pass): her name, oversized, on the espresso band. */}
        <Shout as="h1" size="l" className="wy-shout">{name || 'You'}</Shout>
        <p className="wy-who__meta">{[cp?.username ? `@${cp.username}` : null, memberSince(user.created_at)].filter(Boolean).join(' · ')}</p>
        {stats && openMyProfile && <button type="button" className="wy-counts" onClick={openMyProfile} aria-label={`${fmtCount(stats.followers)} followers, ${fmtCount(stats.following)} following. Open your Community profile.`}>
          <span><b>{fmtCount(stats.followers)}</b> {stats.followers === 1 ? 'follower' : 'followers'}</span>
          <span><b>{fmtCount(stats.following)}</b> following</span>
        </button>}
      </div>
      {/* GlowCare #15: the profile as a count with one next step. */}
      <button type="button" className="yh-profile" onClick={onEditProfile} aria-label={`Health profile ${pct}% complete. ${pct >= 100 ? 'Review answers' : 'Finish it'}`}>
        <span className="yh-profile__top"><span>Health profile</span><b>{pct}% complete</b></span>
        <i aria-hidden="true"><em style={{ width: `${pct}%` }} /></i>
        <span className="yh-profile__go">{pct >= 100 ? 'Review answers' : 'Finish it'} <span aria-hidden="true">→</span></span>
      </button>
    </header>

    {quizSlot}

    {nav}

    <div ref={settingsRef} className={`wy-grid is-${section || 'ov2'}`}>
      {!section && <>
      {/* You overview, cleaned up (founder, Oct 27: "fix the profile page too"). Left: her things as one
          feature card and one grouped list (same rows as the app), Settings and Log out last. Right: her
          set-up, what ayna knows and safety alerts. Every row has the same style and weight; each
          link appears once (the health profile bar sits in the header). */}
      <div className="wy-col">
        <div className="wy-bento" data-tour="you-sections">
          <YouBento
            layout="list"
            products={products}
            intake={intake}
            onOpenBlend={() => goSection('health')}
            tiles={{
              eco: onOpenEcosystem || products.length ? { caption: 'My ecosystem', value: fmtCount(products.length), sub: products.length === 1 ? 'product, grouped by need' : 'products, grouped by need', onClick: onOpenEcosystem } : null,
              saved: { caption: 'Saved', value: fmtCount(savedCount), sub: 'Products and posts', onClick: onOpenSaved || (() => goSection('saved')) },
              checkins: { caption: checkinCount === 1 ? 'Monthly check-in' : 'Monthly check-ins', value: facts[2].value, sub: 'Done so far', onClick: onOpenCheckin },
              health: { caption: 'My health', sub: 'Dashboard, tracking, apps', onClick: () => goSection('health') },
              activity: { caption: 'Activity', sub: 'Questions, posts, reviews', onClick: () => goSection('activity') },
              settings: { caption: 'Settings & privacy', sub: 'Account and your data', onClick: () => goSection('settings') },
              logout: onSignOut ? { caption: 'Log out', onClick: onSignOut } : null,
            }}
          />
        </div>
      </div>
      <div className="wy-col">
        {/* Pai #12: her set-up as "2 of 4" with a tick per step and one next step. Gone once all are done. */}
        {setup.next && <section className="wy-sec yh-setup" aria-labelledby="yh-setup-h">
          <div className="wy-sec__head"><h2 className="ay-group__title" id="yh-setup-h">Your set-up</h2><span className="wy-count">{setup.done} of {setup.total} steps done</span></div>
          <div className="yh-card">
            <span className="yh-setup__bar" aria-hidden="true">{setup.steps.map((st) => <i key={st.key} className={st.done ? 'is-done' : ''} />)}</span>
            <ol className="yh-setup__list">{setup.steps.map((st) => <li key={st.key} className={st.done ? 'is-done' : ''}><span className="yh-tick" aria-hidden="true">{st.done ? <svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg> : null}</span><span>{st.label}<span className="sr-only">{st.done ? ', done' : ', not done yet'}</span></span></li>)}</ol>
            {SETUP_GO[setup.next.key] && <button type="button" className="ay-btn ay-btn--primary yh-setup__go" onClick={SETUP_GO[setup.next.key]}>{setup.next.label}</button>}
          </div>
        </section>}
        <section className="wy-sec" aria-labelledby="yh-knows-h">
          <h2 className="ay-group__title" id="yh-knows-h">Your data</h2>
          <ul className="ay-group wy-rows">{linkRow('knows', knows || 'Nothing yet', null, () => goSection('health'), 'What ayna knows. See, change or remove anything ayna uses')}</ul>
        </section>
        {safetySection}
        {onOpenFreeProduct && <FreeProductAccountCard onOpen={onOpenFreeProduct} />}
      </div>
      </>}

      {section === 'saved' && <>
      <div className="wy-col">
        {savedSlot}
      </div>
      <div className="wy-col">
        <section className="wy-sec" aria-labelledby="wy-savedposts-h">
          <h2 className="ay-group__title" id="wy-savedposts-h">Saved posts</h2>
          {savedPosts.posts.length
            ? <ul className="wy-postlist">{savedPosts.posts.map((p) => { const line = postLine(p, 160); return <li key={p.id}><a href={`/community/p/${p.id}`} onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return; e.preventDefault(); onOpenPost?.(p.id); }}><small>{line.kind}</small><span>{line.text}</span></a></li>; })}</ul>
            : <p className="ay-group is-padded wy-note">{savedPosts.loaded ? 'Nothing saved yet. When a post helps, tap Save and it lives here.' : 'Getting your saved posts…'}</p>}
        </section>
        {recent.some((r) => r.article) && <section className="wy-sec" aria-labelledby="wy-keepreading-h">
          <h2 className="ay-group__title" id="wy-keepreading-h">Reads you started</h2>
          <ul className="ay-group wy-rows">{recent.filter((r) => r.article).map((r) => linkRow(r.key, r.article.title, null, onOpenArticle ? () => onOpenArticle(r.article) : null, r.label))}</ul>
        </section>}
      </div>
      </>}

      {/* My health = the old My health, Tracking and Connected data tabs, in one place (You audit P1). */}
      {section === 'health' && <>
      <div className="wy-col">
        <ThisWeek userId={user.id} onOpen={onOpenHealth || onOpenHealthData} onConnect={onConnectHealth || onOpenHealthData || onOpenHealth} />
        <section className="wy-sec" aria-labelledby="wy-things-h">
          <h2 className="ay-group__title" id="wy-things-h">Connected apps</h2>
          <ul className="ay-group wy-rows">
            {linkRow('health', onOpenHealth ? 'Your health dashboard' : 'Health data', null, onOpenHealth || onOpenHealthData, healthSummary ? `${healthSummary.title}: ${healthSummary.headline}` : healthConnectedCount ? 'Connected. Your trends appear after about two weeks of data.' : 'Connect Apple Health, Oura or upload a file, and see your sleep, cycle and activity trends.')}
            {onOpenHealth && linkRow('manage', 'Manage connected apps and uploads', healthConnectedCount ? fmtCount(healthConnectedCount) : null, onOpenHealthData)}
          </ul>
          {/* One setting in one place (P1-19): the switch is on Health data; this row says where it stands. */}
          <h3 className="yh-h3" id="wy-hmatch-h">Health data in your matches</h3>
          <HealthMatchStatus userId={user.id} onOpen={onOpenHealthData} />
        </section>
        <DailyCheckin userId={user?.id || null} />
        <section className="wy-sec" aria-labelledby="wy-checkins-h">
          <h2 className="ay-group__title" id="wy-checkins-h">Check-ins</h2>
          <ul className="ay-group wy-rows">{linkRow('checkin', 'Monthly check-in', checkinCount != null ? fmtCount(checkinCount) : null, onOpenCheckin, 'A few quick questions so your matches keep up with how you feel')}</ul>
        </section>
        {consumables.length > 0 && <Routine products={consumables} />}
        {SHOW_BOX_WAITLIST && <BoxWaitlist email={user?.email || ''} />}
      </div>
      <div className="wy-col">
        <section className="wy-sec" aria-labelledby="wy-profile-h">
          <h2 className="ay-group__title" id="wy-profile-h">Health profile</h2>
          <div className="ay-group wy-rows">{row('profile', 'Symptoms, goals, life stage and preferences', `${pct}% complete`, <button type="button" className="ct-link" onClick={onEditProfile}>Update</button>)}</div>
        </section>
        {/* Food-scan #17: what she avoids, as crossed chips. */}
        {avoid.length > 0 && <section className="wy-sec" aria-labelledby="yh-avoid-h">
          <h2 className="ay-group__title" id="yh-avoid-h">You avoid</h2>
          <ul className="yh-avoid">{avoid.map((a) => <li key={a}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M6 18 18 6" /></svg>{a}</li>)}</ul>
        </section>}
        {shopper ? <Glance profile={shopper} products={products} quizResults={quizResults} /> : <section className="wy-sec"><h2 className="ay-group__title">At a glance</h2><div className="ay-group is-padded wy-week is-empty"><p className="wy-note">Take the quiz to see it.</p><button type="button" className="ay-btn ay-btn--secondary cm-small" onClick={onStartQuiz}>Take the quiz</button></div></section>}
        {affinity.length > 0 && <section className="wy-sec" aria-labelledby="wy-into-h">
          <h2 className="ay-group__title" id="wy-into-h">What you’re into</h2>
          <ul className="ay-group wy-into">{affinity.map((a) => <li key={a.tag}><span>{a.label}</span><span className="wy-into__bar" aria-hidden="true"><i style={{ width: `${Math.max(4, Math.min(100, a.score))}%` }} /></span><b>{a.score}%</b></li>)}</ul>
        </section>}
        <HouseBlend className="wy-sec" intake={intake} onSave={onUpdateIntake} />
      </div>
      {/* See and edit what ayna believes about you (UX spec 29, trust center). */}
      <div className="wy-know" data-tour="you-know"><WhatAynaKnows variant="web" quizAnswers={quizResults} userId={user?.id || null} connected={healthConnected} onUpdateIntake={onUpdateIntakeLocal || onUpdateIntake} onEditStep={(step) => (step && onEditAnswerAt ? onEditAnswerAt(step) : onEditProfile?.())} onManageData={onOpenHealthData} /></div>
      </>}

      {section === 'activity' && <>
      <div className="wy-col">
        <section className="wy-sec" aria-labelledby="wy-asks-h">
          <h2 className="ay-group__title" id="wy-asks-h">Recent questions</h2>
          {asks.length ? <ul className="wy-postlist">{asks.map((q) => <li key={q}><span><small>You asked</small><span>{q}</span></span></li>)}</ul> : <p className="ay-group is-padded wy-note">Questions you ask ayna show up here.</p>}
        </section>
        {recent.length > 0 ? <section className="wy-sec" aria-labelledby="wy-recent-h">
          <div className="wy-sec__head"><h2 className="ay-group__title" id="wy-recent-h">Recently</h2><span className="wy-count">{recent.length}</span></div>
          <ul className="wy-recent">{recent.map((item) => {
            const when = item.at ? relativeDay(item.at) : '';
            const open = item.article ? onOpenArticle && (() => onOpenArticle(item.article)) : onOpenProduct && (() => onOpenProduct(item.product));
            return <li key={item.key}><button type="button" onClick={open || undefined} disabled={!open}>
              <span className="wy-recent__tile">{item.article ? <img src={item.article.image} alt="" loading="lazy" /> : <ProductTileImage product={item.product} imgStyle={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', padding: 10 }} letterNode={<ProductImageFallback style={{ position: 'absolute', inset: 0 }} />} />}</span>
              <span className="wy-recent__title">{item.article ? item.article.title : item.product.name}</span>
              <small>{item.label}{when ? <>, <RelativeTime at={item.at} /></> : ''}</small>
            </button></li>;
          })}</ul>
        </section> : <section className="wy-sec"><h2 className="ay-group__title">Recently</h2><p className="ay-group is-padded wy-note">What you look at and add shows up here.</p></section>}
      </div>
      <div className="wy-col">
        {(playlists.length > 0 || (cp && onOpenCommunity)) && <section className="wy-sec" aria-labelledby="wy-pl-h">
          <div className="wy-sec__head"><h2 className="ay-group__title" id="wy-pl-h">Your playlists</h2>{openMyProfile && <button type="button" className="ct-shelf__all" onClick={openMyProfile}>Your reviews and posts</button>}</div>
          <ul className="wy-pls">
            {playlists.slice(0, 5).map((pl) => <li key={pl.id}><button type="button" onClick={openMyProfile || undefined} disabled={!openMyProfile}>
              <PlaylistCover playlist={pl} /><span className="wy-recent__title">{pl.title}</span><small>{fmtCount(pl.item_count || 0)} {(pl.item_count || 0) === 1 ? 'product' : 'products'}{pl.is_collaborator && !pl.is_mine ? ' · shared with you' : ''}</small>
            </button></li>)}
            {onOpenCommunity && <li><button type="button" className="wy-pl-new" onClick={() => onOpenCommunity({ kind: 'playlist' })}><span className="cm-cover is-new"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg></span><span className="wy-recent__title">New playlist</span></button></li>}
          </ul>
        </section>}
        <section className="wy-sec" aria-labelledby="wy-cp-h">
          <h2 className="ay-group__title" id="wy-cp-h">Community</h2>
          <ul className="ay-group wy-rows">{linkRow('community', 'Community profile', cp?.username ? `@${cp.username}` : null, openMyProfile, 'Your posts and reviews')}</ul>
        </section>
      </div>
      </>}

      {section === 'settings' && <>
      <div className="wy-settings-search-row"><WebSettingsSearch scopeRef={settingsRef} /></div>
      <div className="wy-col yh-calm">
        <section className="wy-sec" id="wyou-account" aria-labelledby="wy-account-h">
          <div className="wy-sec__head"><h2 className="ay-group__title" id="wy-account-h">Account</h2>{note && <span className="wy-count" role="status">{note}</span>}</div>
          <div className="ay-group wy-rows">
            {nameDraft === null ? row('name', 'Name', name || 'Not set', <button type="button" className="ct-link" onClick={() => { openedEditRef.current = true; setNameDraft(name); }}>Edit</button>)
              : <form className="ay-group__row wy-row wy-form" onSubmit={(e) => { e.preventDefault(); saveName(); }}><label className="ay-group__text"><span className="ay-group__label">Name</span><input autoFocus={openedEditRef.current} value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} maxLength={40} aria-label="First name" /></label><span className="ay-group__end"><button type="submit" className="ct-link">Save</button></span></form>}
            {emailDraft === null ? row('email', 'Email', <>{user.email}{provider === 'google' ? <small className="ay-group__note">Signed in with Google</small> : provider === 'apple' ? <small className="ay-group__note">Signed in with Apple</small> : null}</>, provider === 'email' && <button type="button" className="ct-link" onClick={() => { openedEditRef.current = true; setEmailDraft(''); }}>Change</button>)
              : <form className="ay-group__row wy-row wy-form" onSubmit={(e) => { e.preventDefault(); changeEmail(); }}><label className="ay-group__text"><span className="ay-group__label">New email</span><input type="email" autoFocus={openedEditRef.current} value={emailDraft} onChange={(e) => setEmailDraft(e.target.value)} placeholder="New email" aria-label="New email" required /></label><span className="ay-group__end"><button type="submit" className="ct-link">Send link</button></span></form>}
            {row('profile', 'Health profile', `${pct}% complete`, <button type="button" className="ct-link" onClick={onEditProfile}>Update</button>)}
            {provider === 'email' && row('password', 'Password', '••••••••', <button type="button" className="ct-link" onClick={resetPassword}>Send reset link</button>)}
            {onOpenPhoneVerify && row('text', 'Text ayna', <>Get quick answers by text<small className="ay-group__note">Optional. Add and verify your phone number.</small></>, <button type="button" className="ct-link" onClick={onOpenPhoneVerify}>Set up</button>)}
            {onThemeChange && <div className="ay-group__row wy-row wy-row--stack"><span className="ay-group__text"><span className="ay-group__label">Appearance</span><span className="ay-group__value">{theme === 'dark' ? 'Dark' : theme === 'system' ? 'Match my device' : 'Light'}</span></span><span className="wy-seg" role="group" aria-label="Appearance">{[['light', 'Light'], ['dark', 'Dark'], ['system', 'Match my device']].map(([m, l]) => <button type="button" key={m} className="ay-chip" aria-pressed={theme === m} onClick={() => onThemeChange(m)}>{l}</button>)}</span></div>}
          </div>
        </section>
        <section className="wy-sec" aria-labelledby="yh-privacy-h">
          <h2 className="ay-group__title" id="yh-privacy-h">Privacy and your data</h2>
          <div className="ay-group wy-rows">
            {row('analytics', 'Usage analytics', 'Anonymous, no session recording', <AnalyticsToggle />)}
            {onOpenHealthData && row('healthdata', 'Health data', healthConnectedCount ? `${fmtCount(healthConnectedCount)} connected` : 'Nothing connected', <button type="button" className="ct-link" onClick={onOpenHealthData}>Manage</button>)}
            {row('data', 'Your data', <>Everything we store about you<small className="ay-group__note">A JSON file: your health profile, ecosystem, reviews, phone and text settings, and AI usage.</small></>, <button type="button" className="ct-link" onClick={downloadData}>Download</button>)}
          </div>
          <div className="wy-actions">
            <button type="button" className="ay-btn ay-btn--secondary" onClick={onSignOut}>Log out</button>
            <button type="button" className="ct-link" onClick={onDeleteAccount}>Delete account</button>
          </div>
        </section>
      </div>
      <div className="wy-col yh-calm">
        <RundownSetting today={localDayKey()} />
        <TipsSettings variant="web" />
        <EmailSettings user={user} />
        <InviteCard userId={user.id} />
      </div>
      </>}
    </div>
  </section>;
}
