import { useMemo, useState } from 'react';
import { ALL_PRODUCTS } from '../data/products';
import { getSupabaseClient } from '../utils/supabaseClient';
import { buildShopperProfile } from '../mobile/utils/shopperProfile.js';
import { getBrandAffinity, getCategoryInsights, getSafetyAlerts } from '../mobile/utils/shopperProfileData.js';
import { getProfileCompletionPct } from '../mobile/utils/profileCompleteness.js';
import { ROUTINE_BUCKETS, ROUTINE_BUCKET_LABELS, useRoutine } from '../mobile/hooks/useRoutine.js';
import { fetchDataExport } from '../mobile/utils/dataExportApi.js';
import { ShelfDonut, TrustBars } from '../mobile/components/ShopperCharts.jsx';
import './WebYou.css';

// The app's "You" tab, built for the website: profile progress, shopper
// type card with charts, badges, routine + safety alerts, and account
// settings. All numbers come from the same helpers the app uses.

function firstName(user) {
  const m = user?.user_metadata || {};
  return String(m.first_name || m.firstName || m.given_name || m.full_name || m.name || '').trim().split(/\s+/)[0] || '';
}
function memberSince(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : `Member since ${d.toLocaleString('en-US', { month: 'short', year: 'numeric' })}`;
}

const EMBLEMS = {
  researcher: <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3M7.5 15h9" />,
  listener: <><path d="M4 5h12v9H8l-4 3V5Z" /><path d="M20 9v10l-3-2h-7v-1" /></>,
  curator: <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8Z" />,
  explorer: <><circle cx="12" cy="12" r="8.5" /><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" /></>,
  original: <path d="M12 3.5l2.2 5.3 5.3 2.2-5.3 2.2L12 18.5l-2.2-5.3L4.5 11l5.3-2.2Z" />,
};

function Badges({ savedCount, ecosystemCount, pct }) {
  const badges = [
    { key: 'eco', label: 'Ecosystem built', hint: 'Finish the quiz', earned: ecosystemCount > 0, tone: 'butter' },
    { key: 'save', label: 'First save', hint: 'Save a product', earned: savedCount > 0, tone: 'pink' },
    { key: 'profile', label: 'Profile complete', hint: `${pct}% done`, earned: pct >= 100, tone: 'mint' },
    { key: 'collector', label: 'Collector', hint: `${Math.min(savedCount, 10)}/10 saved`, earned: savedCount >= 10, tone: 'peri' },
  ];
  return <section className="wyou-card">
    <div className="wyou-card-head"><h2>Badges</h2><span>{badges.filter((b) => b.earned).length} of {badges.length}</span></div>
    <ul className="wyou-badges">{badges.map((b, i) => <li key={b.key} className={`tone-${b.tone}${b.earned ? ' is-earned' : ''}`}>
      <span aria-hidden="true">{b.earned ? '✓' : i + 1}</span><strong>{b.label}</strong><small>{b.earned ? 'Earned' : b.hint}</small>
    </li>)}</ul>
  </section>;
}

function Routine({ products }) {
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

export default function WebYou({ user, quizResults, myProducts = {}, savedProducts = {}, onEditProfile, onOpenEcosystem, onOpenSaved, onOpenCheckin, onOpenStartups, onOpenProduct, onSignOut, onDeleteAccount, onStartQuiz }) {
  const products = useMemo(() => Object.values(myProducts || {}).filter(Boolean), [myProducts]);
  const intake = quizResults?.fullHealthIntake || null;
  const pct = getProfileCompletionPct(intake);
  const shopper = buildShopperProfile(intake, products);
  const alerts = getSafetyAlerts(products, quizResults);
  const affinity = getBrandAffinity(quizResults, products);
  const { top, low } = getCategoryInsights(products, savedProducts, ALL_PRODUCTS);
  const savedCount = Object.keys(savedProducts || {}).length;
  const [name, setName] = useState(firstName(user));
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

  const initial = (name || user.email || 'Y').charAt(0).toUpperCase();
  return <section className="wyou">
    <header className="wyou-hero">
      <div className="wyou-avatar" aria-hidden="true">{initial}</div>
      <div className="wyou-who"><h1>{name || 'You'}</h1><small>{memberSince(user.created_at)}</small></div>
      <button type="button" className="wyou-progress" onClick={onEditProfile} aria-label={`Health profile ${pct}% complete. Edit`}>
        <span>Health profile</span><b>{pct}%</b><i aria-hidden="true"><em style={{ width: `${pct}%` }} /></i>
      </button>
      <span className="wyou-shapes" aria-hidden="true"><i /><i /><i /></span>
    </header>

    <div className="wyou-grid">
      <div className="wyou-col">
        {shopper ? <section className={`wyou-shopper is-${shopper.kind}`}>
          <header>
            <span className="wyou-emblem" aria-hidden="true"><svg viewBox="0 0 24 24">{EMBLEMS[shopper.kind]}</svg></span>
            <small>Your shopper type</small><h2>{shopper.title}</h2><p>{shopper.tagline}</p>
          </header>
          <div className="wyou-charts"><ShelfDonut shelf={shopper.shelf} total={shopper.total} /><TrustBars trust={shopper.trust} /></div>
          <dl>{shopper.rows.map((r) => <div key={r.key} className={`tone-${r.tone}`}><dt>{r.label}</dt><dd>{r.value}</dd></div>)}</dl>
        </section> : <section className="wyou-card"><h2>Your shopper type</h2><p className="wyou-muted">Take the quiz to see it.</p><button type="button" className="wyou-btn" onClick={onStartQuiz}>Take the quiz</button></section>}
        <Badges savedCount={savedCount} ecosystemCount={products.length} pct={pct} />
      </div>

      <div className="wyou-col">
        <nav className="wyou-links" aria-label="Your things">
          <button type="button" className="tone-butter" onClick={onOpenEcosystem}><strong>{products.length}</strong><span>Ecosystem</span></button>
          <button type="button" className="tone-pink" onClick={onOpenSaved}><strong>{savedCount}</strong><span>Saved</span></button>
          <button type="button" className="tone-mint" onClick={onOpenCheckin}><strong>✓</strong><span>Check-in</span></button>
          <button type="button" className="tone-peri" onClick={onOpenStartups}><strong>★</strong><span>Startups</span></button>
        </nav>

        <section className="wyou-card">
          <div className="wyou-card-head"><h2>Safety alerts</h2><span>{alerts.length} active</span></div>
          {alerts.length ? <ul className="wyou-alerts">{alerts.map((a) => <li key={a.id} className={`is-${a.kind}`}><strong>{a.title}</strong><p>{a.body}</p>{a.product && <button type="button" onClick={() => onOpenProduct?.(a.product)}>View product</button>}</li>)}</ul> : <p className="wyou-muted">No alerts on your ecosystem.</p>}
        </section>

        {products.length > 0 && <Routine products={products} />}

        {(affinity.length > 0 || top.length > 0) && <section className="wyou-card">
          <div className="wyou-card-head"><h2>What you’re into</h2></div>
          {top.length > 0 && <ol className="wyou-top">{top.map((t) => <li key={t.name}><b>{t.rank}</b><span>{t.name}</span><i aria-hidden="true"><em style={{ width: `${t.pct}%` }} /></i><small>{t.count}</small></li>)}</ol>}
          {affinity.length > 0 && <div className="wyou-chips">{affinity.map((a) => <span key={a.tag}>{a.label} · {a.score}%</span>)}</div>}
          {low.length > 0 && <p className="wyou-muted">Not explored yet: {low.map((l) => l.name).join(', ')}</p>}
        </section>}

        <section className="wyou-card">
          <div className="wyou-card-head"><h2>Account</h2></div>
          <div className="wyou-rows">
            <div><span>Name</span>{nameDraft === null ? <><b>{name || 'Not set'}</b><button type="button" onClick={() => setNameDraft(name)}>Edit</button></> : <form onSubmit={(e) => { e.preventDefault(); saveName(); }}><input autoFocus value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} maxLength={40} aria-label="First name" /><button type="submit">Save</button></form>}</div>
            <div><span>Email</span><b>{user.email}</b></div>
            <div><span>Health profile</span><b>{pct}% complete</b><button type="button" onClick={onEditProfile}>Update</button></div>
            <div><span>Password</span><b>••••••••</b><button type="button" onClick={resetPassword}>Send reset link</button></div>
            <div><span>Your data</span><b>Everything we store about you</b><button type="button" onClick={downloadData}>Download</button></div>
          </div>
          {note && <p className="wyou-note" role="status">{note}</p>}
          <div className="wyou-actions">
            <button type="button" className="wyou-btn is-ghost" onClick={onSignOut}>Log out</button>
            <button type="button" className="wyou-link-danger" onClick={onDeleteAccount}>Delete account</button>
          </div>
          <p className="wyou-legal"><a href="/privacy-policy">Privacy</a> · <a href="/terms-of-use">Terms</a> · <a href="/how-we-make-money">How we make money</a> · <a href="/contact">Contact</a></p>
        </section>
      </div>
    </div>
  </section>;
}
