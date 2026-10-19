import { avatarInitials } from '../utils/avatarInitials';
import { useMemo, useState } from 'react';
import { ALL_PRODUCTS } from '../data/products';
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
import FreeProductAccountCard from './freeProduct/FreeProductAccountCard';
import { getCareProfile } from '../utils/careProfile';
import EmailSettings from './EmailSettings';
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
  return ((full.type || p?.type) === 'physical' || p?.userAdded === true) && full.category !== 'telehealth';
};

/* At a glance: what she told us, in a few facts, and her shelves by the same
   names My Ecosystem uses. No personality label (she never asked for one). */
/* Badges are gone from the website until the app ships (a badge for an app
   people can't get, and points for a health profile, didn't fit). The invite
   link stays. No network calls: the link is built from her account id. */
function InviteCard({ userId }) {
  const link = inviteLinkFor(userId, typeof window !== 'undefined' ? window.location.origin : 'https://www.aynahealth.co');
  const [copied, setCopied] = useState(false);
  if (!link) return null;
  return <section className="wyou-card wyou-invite" aria-labelledby="wyou-invite-h">
    <div className="wyou-card-head"><h2 id="wyou-invite-h">Invite a friend</h2></div>
    <p className="wyou-muted">Friends who join get their own private profile.</p>
    <div className="wyou-invite__row">
      <input readOnly value={link} aria-label="Your invite link" onFocus={(e) => e.currentTarget.select()} />
      <button type="button" className="wyou-btn" onClick={async () => { try { await navigator.clipboard.writeText(link); setCopied(true); window.setTimeout(() => setCopied(false), 2000); } catch { /* clipboard blocked */ } }}>{copied ? 'Copied' : 'Copy link'}</button>
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
  return <section className="wyou-card wyou-glance" aria-labelledby="wyou-glance-h">
    <div className="wyou-card-head"><h2 id="wyou-glance-h">At a glance</h2></div>
    {shelves.length > 0 && <p className="wyou-glance__shelves"><b>Your shelves:</b> {shelves.map(([k, n]) => `${k} ${n}`).join(' · ')}</p>}
    {rows.length > 0 && <dl className="wyou-glance__facts">{rows.map((r) => <div key={r.key}><dt>{r.label}</dt><dd>{r.value}</dd></div>)}</dl>}
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
  return <section className="wyou-card">
    <div className="wyou-card-head"><h2>Routine</h2><span>{placed} of {products.length} placed <small className="wyou-sub">(things you use on a schedule; apps and services aren't counted)</small></span></div>
    <div className="wyou-tabs" role="tablist">{ROUTINE_BUCKETS.map((b) => <button type="button" key={b} role="tab" aria-selected={bucket === b} className={bucket === b ? 'is-on' : ''} onClick={() => setBucket(b)}>{ROUTINE_BUCKET_LABELS[b]}</button>)}</div>
    {inBucket.length ? <ul className="wyou-list">{inBucket.map((p) => <li key={p.id}><span title={p.name}>{shortName(p)}</span><button type="button" onClick={() => removeFromRoutine(p.id)}>Remove</button></li>)}</ul>
      : <p className="wyou-muted">Nothing in {ROUTINE_BUCKET_LABELS[bucket].toLowerCase()} yet.</p>}
    {shared.length > 0 && <div className="wyou-shared" role="note"><strong>Same active ingredient</strong>{shared.map(([a, names]) => <p key={a}><span className="wyou-shared__a">{a}</span> is in {names.join(' and ')}. Worth checking you need both.</p>)}</div>}
    {others.length > 0 && <div className="wyou-add"><small>Add from your ecosystem</small><div>{others.map((p) => <button type="button" key={p.id} onClick={() => setProductBucket(p.id, bucket)} title={p.name} aria-label={`Add ${p.name} to ${ROUTINE_BUCKET_LABELS[bucket].toLowerCase()}`}>+ {shortName(p)}</button>)}</div></div>}
  </section>;
}

export default function WebYou({ user, quizResults, myProducts = {}, savedProducts = {}, onEditProfile, onOpenEcosystem, onOpenSaved, onOpenCheckin, onOpenProduct, onOpenPhoneVerify, onSignOut, onDeleteAccount, onStartQuiz, onSignIn, theme = 'light', onThemeChange, onOpenFreeProduct, onOpenHealthData, healthSummary = null, healthConnectedCount = 0 }) {
  const products = useMemo(() => Object.values(myProducts || {}).filter(Boolean), [myProducts]);
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
  // Google and Apple accounts have no ayna password; checking every linked identity, not just the first.
  const providers = [user?.app_metadata?.provider, ...(user?.app_metadata?.providers || []), ...((user?.identities || []).map((i) => i?.provider))].filter(Boolean);
  const provider = providers.includes('email') ? 'email' : (providers.find((x) => x === 'google' || x === 'apple') || user?.app_metadata?.provider || 'email');
  const [emailDraft, setEmailDraft] = useState(null);
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

  if (!user) {
    return <section className="wyou"><div className="wyou-card wyou-signedout"><h1>You</h1><p>Your profile, safety alerts and settings live here once you have an account.</p><div className="wyou-signedout__doors"><button type="button" className="wyou-btn" onClick={onStartQuiz}>New here? See my matches</button>{onSignIn && <button type="button" className="wyou-btn is-ghost" onClick={onSignIn}>Sign in</button>}</div></div></section>;
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
      const TIER = { recall: [0, 'Recall'], sensitivity: [1, 'Your sensitivity'], accuracy: [2, 'Accuracy note'], note: [3, 'FYI'] };
      const sorted = [...alerts].sort((x, y) => (TIER[x.kind]?.[0] ?? 3) - (TIER[y.kind]?.[0] ?? 3));
      const active = alerts.filter((a) => a.kind !== 'note').length;
      const fyi = alerts.length - active;
      // First sentence, without cutting at "v." or "e.g." (it used to stop at "Manson v."), and no emoji.
      const firstLine = (t) => {
        const text = String(t || '').replace(/^(?:\u26a0\ufe0f?|\s)+/, '').trim();
        const re = /[.!?](?=\s+[A-Z(]|$)/g; let m;
        while ((m = re.exec(text))) {
          const before = text.slice(0, m.index + 1);
          if (/\b(v|vs|e\.g|i\.e|etc|inc|no|dr|st)\.$/i.test(before) || before.length < 10) continue;
          return before;
        }
        return text;
      };
      return <section className="wyou-card is-safety wyou-safety-top">
        <div className="wyou-card-head"><h2>Safety alerts</h2><span>{active ? `${active} to check` : 'Nothing urgent'}{fyi > 0 ? ` · ${fyi} FYI` : ''}</span></div>
        {sorted.length ? <ul className="wyou-alerts">{sorted.map((a) => {
          const one = a.kind === 'note' ? '' : firstLine(a.body);
          return <li key={a.id} className={`is-${a.kind}`}>
            <span className="wyou-tier">{TIER[a.kind]?.[1] || 'Note'}</span>
            <strong>{a.title}</strong>
            {one && <p>{one}</p>}
            {one !== a.body && <details><summary>Details</summary><p>{a.body}</p></details>}
            {a.kind === 'sensitivity' ? (() => {
              const named = products.filter((p) => p?.name && String(a.body).includes(p.name));
              return named.length > 1
                ? <div className="wyou-alert-links">{named.map((p) => <button key={p.id} type="button" onClick={() => onOpenProduct?.(p)}>{p.name}</button>)}</div>
                : a.product && <button type="button" onClick={() => onOpenProduct?.(a.product)}>View product</button>;
            })() : a.product && <button type="button" onClick={() => onOpenProduct?.(a.product)}>View product</button>}
          </li>;
        })}</ul> : <p className="wyou-muted">No alerts on your ecosystem.</p>}
      </section>;
    })()}

    {onOpenFreeProduct && <FreeProductAccountCard onOpen={onOpenFreeProduct} />}

    <div className="wyou-grid">
      <div className="wyou-col">
        {shopper ? <Glance profile={shopper} products={products} quizResults={quizResults} /> : <section className="wyou-card is-shopper-empty"><h2>At a glance</h2><p className="wyou-muted">Take the quiz to see it.</p><button type="button" className="wyou-btn" onClick={onStartQuiz}>Take the quiz</button></section>}
        <InviteCard userId={user.id} />
      </div>

      <div className="wyou-col">
        <nav className="wyou-links wyou-stats" aria-label="Your things">
          <button type="button" className="tone-butter" onClick={onOpenEcosystem}><strong>{products.length}</strong><span>In your Ecosystem</span></button>
          <button type="button" className="tone-pink" onClick={onOpenSaved}><strong>{savedCount}</strong><span>Saved</span></button>
          <div className="wyou-quick">
            <button type="button" className="wyou-btn is-ghost wyou-quickbtn" onClick={onOpenCheckin}>Log how this month went</button>
          </div>
        </nav>

        {onOpenHealthData && <button type="button" className="wyou-card wyou-health" onClick={onOpenHealthData}>
          <span>
            <h2>Health data</h2>
            <small>{healthSummary ? `${healthSummary.title}: ${healthSummary.headline}` : healthConnectedCount ? 'Connected. Your trends appear after about two weeks of data.' : 'Connect Apple Health, Oura or upload a file, and see your sleep, cycle and activity trends.'}</small>
          </span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
        </button>}


        {consumables.length > 0 && <Routine products={consumables} />}

        {/* The per-type counts repeated "Your shelves" in At a glance (audit), so only the interest chips stay. */}
        {affinity.length > 0 && <section className="wyou-card">
          <div className="wyou-card-head"><h2>What you’re into</h2></div>
          {affinity.length > 0 && <div className="wyou-chips">{affinity.map((a) => <span key={a.tag}>{a.label} · {a.score}%</span>)}</div>}
        </section>}

        <EmailSettings user={user} />

        <section className="wyou-card is-account" id="wyou-account">
          <div className="wyou-card-head"><h2>Account</h2></div>
          <div className="wyou-rows">
            <div><span>Name</span>{nameDraft === null ? <><b>{name || 'Not set'}</b><button type="button" onClick={() => setNameDraft(name)}>Edit</button></> : <form onSubmit={(e) => { e.preventDefault(); saveName(); }}><input autoFocus value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} maxLength={40} aria-label="First name" /><button type="submit">Save</button></form>}</div>
            <div><span>Email</span>{emailDraft === null ? <><b>{user.email}{provider === 'google' ? <small className="wyou-sub">Signed in with Google</small> : provider === 'apple' ? <small className="wyou-sub">Signed in with Apple</small> : null}</b>{provider === 'email' && <button type="button" onClick={() => setEmailDraft('')}>Change</button>}</> : <form onSubmit={(e) => { e.preventDefault(); changeEmail(); }}><input type="email" autoFocus value={emailDraft} onChange={(e) => setEmailDraft(e.target.value)} placeholder="New email" aria-label="New email" required /><button type="submit">Send link</button></form>}</div>
            <div><span>Health profile</span><b>{pct}% complete</b><button type="button" onClick={onEditProfile}>Update</button></div>
            {provider === 'email' && <div><span>Password</span><b>••••••••</b><button type="button" onClick={resetPassword}>Send reset link</button></div>}
            {onOpenPhoneVerify && <div><span>Text ayna</span><b>Get quick answers by text<small className="wyou-sub">Optional. Add and verify your phone number.</small></b><button type="button" onClick={onOpenPhoneVerify}>Set up</button></div>}
            {onThemeChange && <div><span>Appearance</span><b>{theme === 'dark' ? 'Dark' : theme === 'system' ? 'Match my device' : 'Light'}</b><span className="wyou-seg">{[['light', 'Light'], ['dark', 'Dark'], ['system', 'Match my device']].map(([m, l]) => <button type="button" key={m} aria-pressed={theme === m} onClick={() => onThemeChange(m)}>{l}</button>)}</span></div>}
            <div><span>Usage analytics</span><b>Anonymous, no session recording</b><AnalyticsToggle /></div>
            <div><span>Your data</span><b>Everything we store about you<small className="wyou-sub">A JSON file: your health profile, ecosystem, reviews, phone and text settings, and AI usage.</small></b><button type="button" onClick={downloadData}>Download</button></div>
          </div>
          {note && <p className="wyou-note" role="status">{note}</p>}
          <div className="wyou-actions">
            <button type="button" className="wyou-btn is-ghost" onClick={onSignOut}>Log out</button>
            <button type="button" className="wyou-link-danger" onClick={onDeleteAccount}>Delete account</button>
          </div>
        </section>
      </div>
    </div>
  </section>;
}
