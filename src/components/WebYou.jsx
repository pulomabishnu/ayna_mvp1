import { avatarInitials } from '../utils/avatarInitials';
import { useMemo, useState } from 'react';
import { ALL_PRODUCTS } from '../data/products';
import { getSupabaseClient } from '../utils/supabaseClient';
import { buildShopperProfile } from '../mobile/utils/shopperProfile.js';
import { getBrandAffinity, getSafetyAlerts } from '../mobile/utils/shopperProfileData.js';
import { getProfileCompletionPct } from '../mobile/utils/profileCompleteness.js';
import { ROUTINE_BUCKETS, ROUTINE_BUCKET_LABELS, useRoutine } from '../mobile/hooks/useRoutine.js';
import { fetchDataExport } from '../mobile/utils/dataExportApi.js';
import ShopperCard from '../mobile/components/ShopperCard.jsx';
import BadgesPanel from './BadgesPanel';
import './WebYou.css';
import '../styles/audit-qya.css';

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
  return (full.type || p?.type) === 'physical' && full.category !== 'telehealth';
};

/** Category counts from the Ecosystem only, so they always match the Ecosystem number. */
function ecosystemInsights(products) {
  const counts = new Map();
  products.forEach((p) => { const c = p?.category || PRODUCT_BY_ID.get(p?.id)?.category; if (c) counts.set(c, (counts.get(c) || 0) + 1); });
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const max = sorted.length ? sorted[0][1] : 0;
  const top = sorted.slice(0, 4).map(([cat, n], i) => ({ rank: String(i + 1).padStart(2, '0'), name: CATEGORY_LABEL(cat), count: n, pct: max ? Math.round((n / max) * 100) : 0 }));
  const allCats = [...new Set(ALL_PRODUCTS.map((p) => p?.category).filter(Boolean))];
  const missing = allCats.filter((c) => !counts.has(c)).slice(0, 3).map(CATEGORY_LABEL);
  return { top, missing };
}

function Routine({ products }) {
  // Only things you use up get a routine slot (services like telehealth are left out).
  const [bucket, setBucket] = useState('morning');
  const { routineMap, setProductBucket, removeFromRoutine } = useRoutine();
  const inBucket = products.filter((p) => routineMap[p.id] === bucket);
  const others = products.filter((p) => routineMap[p.id] !== bucket);
  return <section className="wyou-card">
    <div className="wyou-card-head"><h2>Routine</h2><span>{products.filter((p) => routineMap[p.id]).length}/{products.length} sorted</span></div>
    <div className="wyou-tabs" role="tablist">{ROUTINE_BUCKETS.map((b) => <button type="button" key={b} role="tab" aria-selected={bucket === b} className={bucket === b ? 'is-on' : ''} onClick={() => setBucket(b)}>{ROUTINE_BUCKET_LABELS[b]}</button>)}</div>
    {inBucket.length ? <ul className="wyou-list">{inBucket.map((p) => <li key={p.id}><span>{p.name}</span><button type="button" onClick={() => removeFromRoutine(p.id)}>Remove</button></li>)}</ul>
      : <p className="wyou-muted">Nothing in {ROUTINE_BUCKET_LABELS[bucket].toLowerCase()} yet.</p>}
    {others.length > 0 && <div className="wyou-add"><small>Add from your ecosystem</small><div>{others.slice(0, 12).map((p) => <button type="button" key={p.id} onClick={() => setProductBucket(p.id, bucket)}>+ {p.name}</button>)}</div></div>}
  </section>;
}

export default function WebYou({ user, quizResults, myProducts = {}, savedProducts = {}, onEditProfile, onOpenEcosystem, onOpenSaved, onOpenCheckin, onOpenStartups, onOpenProduct, onSignOut, onDeleteAccount, onStartQuiz, theme = 'light', onThemeChange }) {
  const products = useMemo(() => Object.values(myProducts || {}).filter(Boolean), [myProducts]);
  const consumables = useMemo(() => products.filter(isConsumable), [products]);
  const intake = quizResults?.fullHealthIntake || null;
  const pct = getProfileCompletionPct(intake);
  const shopper = buildShopperProfile(intake, products);
  const alerts = getSafetyAlerts(products, quizResults);
  const affinity = getBrandAffinity(quizResults, products);
  const { top, missing } = useMemo(() => ecosystemInsights(products), [products]);
  const savedCount = Object.values(savedProducts || {}).filter(Boolean).length;
  // Same source as the header greeting (user_metadata), read on every render so a
  // late-arriving session (after a reload) shows the name instead of "Not set".
  const [savedName, setName] = useState('');
  const name = savedName || firstName(user);
  const [nameDraft, setNameDraft] = useState(null);
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

  if (!user) {
    return <section className="wyou"><div className="wyou-card wyou-signedout"><h1>You</h1><p>Sign in to see your shopper profile, badges, routine and settings.</p><button type="button" className="wyou-btn" onClick={onStartQuiz}>Take the quiz</button></div></section>;
  }

  const initial = avatarInitials(user, (name || 'Y').charAt(0).toUpperCase());
  return <section className="wyou">
    <header className="wyou-hero">
      <div className="wyou-avatar" aria-hidden="true">{initial}</div>
      <div className="wyou-who"><h1>{name || 'You'}</h1><small>{memberSince(user.created_at)}</small></div>
      <button type="button" className="wyou-progress" onClick={onEditProfile} aria-label={`Health profile ${pct}% complete. Edit`}>
        <span>Health profile</span><b>{pct}%</b><i aria-hidden="true"><em style={{ width: `${pct}%` }} /></i>
      </button>
      <span className="wyou-shapes" aria-hidden="true"><i /><i /><i /></span>
    </header>

    {(() => {
      const TIER = { recall: [0, 'Recall'], sensitivity: [1, 'Your sensitivity'], note: [2, 'FYI'] };
      const sorted = [...alerts].sort((x, y) => (TIER[x.kind]?.[0] ?? 3) - (TIER[y.kind]?.[0] ?? 3));
      const active = alerts.filter((a) => a.kind !== 'note').length;
      const firstLine = (t) => { const m = String(t || '').match(/^(.{10,160}?[.!?])(\s|$)/); return m ? m[1] : String(t || ''); };
      return <section className="wyou-card is-safety wyou-safety-top">
        <div className="wyou-card-head"><h2>Safety alerts</h2><span>{active ? `${active} to check` : 'Nothing urgent'}{alerts.length - active > 0 ? ` · ${alerts.length - active} FYI` : ''}</span></div>
        {sorted.length ? <ul className="wyou-alerts">{sorted.map((a) => {
          const one = firstLine(a.body);
          return <li key={a.id} className={`is-${a.kind}`}>
            <span className="wyou-tier">{TIER[a.kind]?.[1] || 'Note'}</span>
            <strong>{a.title}</strong>
            <p>{one}</p>
            {one !== a.body && <details><summary>Details</summary><p>{a.body}</p></details>}
            {a.product && <button type="button" onClick={() => onOpenProduct?.(a.product)}>View product</button>}
          </li>;
        })}</ul> : <p className="wyou-muted">No alerts on your ecosystem.</p>}
      </section>;
    })()}

    <div className="wyou-grid">
      <div className="wyou-col">
        {shopper ? <ShopperCard profile={shopper} /> : <section className="wyou-card is-shopper-empty"><h2>At a glance</h2><p className="wyou-muted">Take the quiz to see it.</p><button type="button" className="wyou-btn" onClick={onStartQuiz}>Take the quiz</button></section>}
        <BadgesPanel userId={user.id} myProducts={products} quizAnswers={quizResults} variant="web" />
      </div>

      <div className="wyou-col">
        <nav className="wyou-links wyou-stats" aria-label="Your things">
          <button type="button" className="tone-butter" onClick={onOpenEcosystem}><strong>{products.length}</strong><span>In your Ecosystem</span></button>
          <button type="button" className="tone-pink" onClick={onOpenSaved}><strong>{savedCount}</strong><span>Saved</span></button>
          <div className="wyou-quick">
            <button type="button" className="wyou-btn is-ghost wyou-quickbtn" onClick={onOpenCheckin}>Do a check-in<small>Tell us what changed so your picks keep up</small></button>
            <button type="button" className="wyou-btn is-ghost wyou-quickbtn" onClick={onOpenStartups}>Meet the startups<small>The brands ayna works with</small></button>
          </div>
        </nav>


        {consumables.length > 0 && <Routine products={consumables} />}

        {(affinity.length > 0 || top.length > 0) && <section className="wyou-card">
          <div className="wyou-card-head"><h2>What you’re into</h2>{top.length > 0 && <span>From your Ecosystem</span>}</div>
          {top.length > 0 && <ol className="wyou-top">{top.map((t) => <li key={t.name}><b>{t.rank}</b><span>{t.name}</span><i aria-hidden="true"><em style={{ width: `${t.pct}%` }} /></i><small>{t.count} {t.count === 1 ? 'item' : 'items'}</small></li>)}</ol>}
          {affinity.length > 0 && <div className="wyou-chips">{affinity.map((a) => <span key={a.tag}>{a.label} · {a.score}%</span>)}</div>}
          {top.length > 0 && missing.length > 0 && <p className="wyou-muted">Not in your Ecosystem yet: {missing.join(', ')}</p>}
        </section>}

        <section className="wyou-card is-account">
          <div className="wyou-card-head"><h2>Account</h2></div>
          <div className="wyou-rows">
            <div><span>Name</span>{nameDraft === null ? <><b>{name || 'Not set'}</b><button type="button" onClick={() => setNameDraft(name)}>Edit</button></> : <form onSubmit={(e) => { e.preventDefault(); saveName(); }}><input autoFocus value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} maxLength={40} aria-label="First name" /><button type="submit">Save</button></form>}</div>
            <div><span>Email</span><b>{user.email}</b></div>
            <div><span>Health profile</span><b>{pct}% complete</b><button type="button" onClick={onEditProfile}>Update</button></div>
            <div><span>Password</span><b>••••••••</b><button type="button" onClick={resetPassword}>Send reset link</button></div>
            {onThemeChange && <div><span>Appearance</span><b>{theme === 'dark' ? 'Dark' : 'Light'}</b><span className="wyou-seg">{['light', 'dark'].map((m) => <button type="button" key={m} aria-pressed={theme === m} onClick={() => onThemeChange(m)}>{m === 'dark' ? 'Dark' : 'Light'}</button>)}</span></div>}
            <div><span>Your data</span><b>Everything we store about you</b><button type="button" onClick={downloadData}>Download</button></div>
          </div>
          {note && <p className="wyou-note" role="status">{note}</p>}
          <div className="wyou-actions">
            <button type="button" className="wyou-btn is-ghost" onClick={onSignOut}>Log out</button>
            <button type="button" className="wyou-link-danger" onClick={onDeleteAccount}>Delete account</button>
          </div>
          <p className="wyou-legal"><a href="/privacy-policy">Privacy</a> · <a href="/terms-of-use">Terms</a> · <a href="/how-we-make-money">How we make money</a> · <a href="/contact">Contact</a> · <a href="/campus-resources">Campus resources</a></p>
        </section>
      </div>
    </div>
  </section>;
}
