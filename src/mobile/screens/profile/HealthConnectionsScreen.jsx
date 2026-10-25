import { useEffect, useMemo, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { CATEGORIES } from '../../../health/metrics.js';
import {
  HEALTH_SOURCES, SOURCE_GROUPS, apiSourceFor, availabilityFor, connectSteps, lastSyncedLine, providesFor, providesLine, sourceById, statusLine,
} from '../../data/healthConnections.js';
import {
  HealthApiError, connectDeviceSource, deleteAllHealthData, disconnectSource, pauseSource, requestSource, resumeSource,
  startOAuth, updateSourceCategories,
} from '../../../health/healthApi.js';
import { healthStoreAvailability, openHealthPermissions, requestHealthAccess } from '../../../health/native.js';
import { setHealthFlash, syncCloudSource, syncPhoneSource, takeHealthFlash, useHealthData } from '../../hooks/useHealthData.js';
import HealthUploadScreen from './HealthUploadScreen.jsx';
import HealthRecordsScreen from './HealthRecordsScreen.jsx';
import './health-connections.css';
import HealthMatchToggle from '../../../components/health/HealthMatchToggle.jsx';

/**
 * Health data (You -> Health data). Real connections only: a source is
 * connectable here only when its integration actually exists in this build.
 * Consent is per category, every toggle starts off, and nothing syncs until
 * she connects. See docs/wearables-ehr-integration.md.
 */

const ICONS = {
  heart: <path d="M12 19.5s-7-4.3-7-9.3A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.2c0 5-7 9.3-7 9.3Z" />,
  phone: <><rect x="7" y="3" width="10" height="18" rx="2.5" /><path d="M11 17.5h2" /></>,
  ring: <><circle cx="12" cy="13" r="6" /><path d="M9.5 7.5 12 4l2.5 3.5" /></>,
  watch: <><rect x="7" y="7" width="10" height="10" rx="3" /><path d="M9 7l.7-4h4.6l.7 4M9 17l.7 4h4.6l.7-4M12 10v2.2l1.4 1" /></>,
  run: <><circle cx="14" cy="4.5" r="1.8" /><path d="M8 21l3-6 3 2v4M6 12l3-3 4 1 2 3 3 1" /></>,
  upload: <><path d="M12 15V4M7.5 8.5 12 4l4.5 4.5" /><path d="M5 14v5h14v-5" /></>,
  cycle: <><circle cx="12" cy="12" r="7.5" /><path d="M12 4.5a7.5 7.5 0 0 1 0 15" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  clinic: <><path d="M4 20V9l8-5 8 5v11Z" /><path d="M12 10.5v5M9.5 13h5M4 20h16" /></>,
};

const Icon = ({ name, lg }) => <span className={`ay-hc-icon${lg ? ' is-lg' : ''}`}><svg viewBox="0 0 24 24" aria-hidden="true">{ICONS[name]}</svg></span>;
const Chevron = () => <svg className="ay-hc-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>;

function Switch({ on, onClick, label, disabled }) {
  return <button type="button" role="switch" aria-checked={!!on} aria-label={label} className="ay-hc-switch" onClick={onClick} disabled={disabled}><span /></button>;
}

const ERRORS = {
  not_signed_in: 'Sign in to connect health data.',
  network: "Couldn't reach ayna. Check your connection and try again.",
  provider_not_configured: "This connection isn't switched on yet. We're finishing setup with the provider.",
  rate_limited: 'Too many tries. Give it a few minutes.',
};
const errorText = (e) => ERRORS[e?.code] || 'We couldn’t reach your health data. Check your connection and try again.';

/* --------------------------------- List ---------------------------------- */
function SourceList({ connections, records, onOpen, onOpenInsights, hasInsights, signedIn, onSignIn, onRefresh, compact = false, userId = null, tabName = 'Home' }) {
  const [now] = useState(() => Date.now());
  const [query, setQuery] = useState('');
  const byId = Object.fromEntries(connections.map((c) => [c.source, c]));
  const q = query.trim().toLowerCase();
  const matches = (source) => !q || [source.name, source.kind, source.note, source.reads].some((t) => String(t || '').toLowerCase().includes(q));
  const anyMatch = HEALTH_SOURCES.some((src) => src.id !== 'request' && matches(src));
  return (
    <>
      {!compact && <p className="ay-hc-intro">Optional. Connect an app or wearable if you want ayna to personalize your insights and routine with it. Quick check-ins on {tabName} work without it. You choose what to share, and brands never see it.</p>}
      {signedIn && !compact && <div className="ay-hc-matchpref"><HealthMatchToggle userId={userId} /></div>}
      {!signedIn && (
        <div className="ay-hc-note">Sign in to connect apps and upload data. <button type="button" className="ay-hc-link" onClick={onSignIn}>Sign in</button></div>
      )}
      {hasInsights && !compact && (
        <button type="button" className="ay-hc-insights-link" onClick={onOpenInsights}>
          <span><b>Your health dashboard</b><small>Charts for sleep, cycle, heart and activity</small></span><Chevron />
        </button>
      )}
      <div className="ay-hc-search" role="search">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></svg>
        <label htmlFor="ay-hc-search-input" className="ay-sl-sr">Search apps and wearables</label>
        <input id="ay-hc-search-input" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search apps and wearables" autoComplete="off" enterKeyHint="search" />
        {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search">×</button>}
      </div>
      {q && !anyMatch && (
        <div className="ay-hc-nomatch" role="status">
          <p><b>We don't connect to “{query.trim()}” yet.</b> Tell us you use it and the team will hear about it.</p>
          <button type="button" className="ay-hc-primary" onClick={() => onOpen(`request:${encodeURIComponent(query.trim().slice(0, 60))}`)}>Request {query.trim().slice(0, 30)}</button>
        </div>
      )}
      {SOURCE_GROUPS.map((group) => {
        const list = HEALTH_SOURCES.filter((s) => s.group === group.id && (matches(s) || (s.id === 'request' && q)));
        if (!list.length || (q && !anyMatch)) return null;
        return (
        <section key={group.id} className={`ay-hc-group is-${group.tone}`} aria-label={group.title}>
          <h2>{group.title}</h2>
          <div className="ay-hc-card">
            {list.map((source) => {
              const connection = byId[apiSourceFor(source.id)];
              const recordCount = records ? records.allergies.length + records.conditions.length + records.medications.length : 0;
              const status = source.id === 'records' ? (recordCount ? { text: `${recordCount} saved on this iPhone`, tone: 'on' } : null)
                : source.id === 'upload' || source.id === 'flo' ? null : statusLine(connection, now);
              // Found through its note ("Fitbit ... come through here"), not its name: say so.
              const via = q && !source.name.toLowerCase().includes(q) && String(source.note || '').toLowerCase().includes(q) ? `${query.trim()} data can come through ${source.name}` : null;
              const sub = via || status?.text
                || (source.availability === 'needs_approval' ? 'Waiting on Garmin approval'
                  : source.availability === 'later' ? 'Coming later'
                  : source.availability === 'blocked' ? 'Not available' : source.kind);
              return (
                <button type="button" key={source.id} className="ay-hc-row" onClick={() => onOpen(source.id)}>
                  <Icon name={source.icon} />
                  <span className="ay-hc-row-text">
                    <span className="ay-hc-row-title">{source.name}</span>
                    <span className={`ay-hc-row-sub is-${status?.tone || 'off'}`}>{sub}</span>
                    {providesLine(source) && source.availability !== 'blocked' && <span className="ay-hc-row-provides">Can provide: {providesLine(source)}</span>}
                  </span>
                  {status?.tone === 'on' ? <span className="ay-hc-pill is-on">On</span> : source.availability === 'blocked' && !via ? <span className="ay-hc-row-end" aria-hidden="true" /> : <Chevron />}
                </button>
              );
            })}
          </div>
        </section>
        );
      })}
      <ul className="ay-hc-promises">
        <li>Used only for your own matches and insights.</li>
        <li>Never shared with or sold to brands, and never changes what partners pay for or where they show up.</li>
        <li>Disconnect any time. You choose whether ayna keeps or deletes what it already has.</li>
      </ul>
      {signedIn && connections.some((c) => c.status !== 'disconnected') && <DeleteAll onRefresh={onRefresh} />}
    </>
  );
}

function DeleteAll({ onRefresh }) {
  const [step, setStep] = useState('idle');
  const [message, setMessage] = useState('');
  const run = async () => {
    setStep('busy');
    try {
      const out = await deleteAllHealthData();
      await onRefresh?.();
      setMessage(`Deleted. ${out.deleted ? 'Every health record ayna held for you is gone.' : 'ayna had no stored health records.'}`);
      setStep('done');
    } catch (e) { setMessage(errorText(e)); setStep('idle'); }
  };
  if (step === 'done') return <p className="ay-hc-done" role="status">{message}</p>;
  return (
    <div className="ay-hc-deleteall">
      {step === 'confirm' || step === 'busy' ? (
        <div className="ay-hc-confirm" role="alertdialog" aria-label="Delete all health data">
          <p>Disconnect every source and delete all health data ayna has stored for you? Your quiz answers stay. This can't be undone.</p>
          <div>
            <button type="button" className="ay-hc-ghost" onClick={() => setStep('idle')} disabled={step === 'busy'}>Cancel</button>
            <button type="button" className="ay-hc-danger is-solid" onClick={run} disabled={step === 'busy'}>{step === 'busy' ? 'Deleting…' : 'Delete all'}</button>
          </div>
        </div>
      ) : <button type="button" className="ay-hc-textdanger" onClick={() => setStep('confirm')}>Delete all my health data</button>}
      {message && step !== 'done' && <p className="ay-hc-error" role="alert">{message}</p>}
    </div>
  );
}

/* -------------------------------- Detail --------------------------------- */
function CategoryToggles({ source, selected, onToggle, disabled }) {
  // In the four groups she reads about (Sleep, Cycle and temperature, Activity,
  // Heart rate and recovery); each switch is still one consent category.
  const ordered = providesFor(source).flatMap((g) => g.cats.filter((c) => source.categories.includes(c)).map((id, i) => ({ id, group: i === 0 ? g.label : null })));
  return (
    <div className="ay-hc-card">
      {ordered.map(({ id, group }) => (
        <div key={id} className="ay-hc-row is-static">
          <span className="ay-hc-row-text">
            {group && <span className="ay-hc-catgroup">{group}</span>}
            <span className="ay-hc-row-title">{CATEGORIES[id].label}</span>
            <span className="ay-hc-row-sub">{CATEGORIES[id].why}</span>
          </span>
          <Switch on={selected.includes(id)} onClick={() => onToggle(id)} label={`Share ${CATEGORIES[id].label}`} disabled={disabled} />
        </div>
      ))}
    </div>
  );
}

function DisconnectChoice({ source, onCancel, onConfirm, busy }) {
  const device = source.availability === 'device';
  return (
    <div className="ay-hc-confirm" role="alertdialog" aria-label={`Disconnect ${source.name}`}>
      <p><b>Disconnect {source.name}?</b> ayna stops syncing new data.{source.availability === 'oauth' ? ` We also remove ayna's access in ${source.name}.` : ''}</p>
      {device && <p className="ay-hc-small">{source.platform === 'ios' ? 'To also stop iOS from letting ayna read, open the Health app, tap your picture, then Privacy, Apps, ayna.' : 'To also remove the permission on your phone, open Health Connect, App permissions, ayna.'}</p>}
      <div className="ay-hc-stack">
        <button type="button" className="ay-hc-ghost" onClick={() => onConfirm(false)} disabled={busy}>Disconnect only</button>
        <button type="button" className="ay-hc-danger is-solid" onClick={() => onConfirm(true)} disabled={busy}>Disconnect and delete my ayna data from {source.name}</button>
        <p className="ay-hc-small">Deleting removes the days ayna saved from {source.name}. Insights and match changes built from them go too, because ayna works them out from those days each time.</p>
        <button type="button" className="ay-hc-link" onClick={onCancel} disabled={busy}>Keep connected</button>
      </div>
    </div>
  );
}

function SourceDetail({ source, connection, signedIn, onSignIn, onDone, onRefresh, message = null, setMessage = () => {} }) {
  const isNative = Capacitor.isNativePlatform();
  const availability = availabilityFor(source, { isNative, nativePlatform: Capacitor.getPlatform() });
  const live = connection && connection.status !== 'disconnected';
  const [selected, setSelected] = useState(() => (live ? connection.categories : []));
  const [busy, setBusy] = useState(false);
  // The success message lives in the parent: connecting reloads the connection,
  // which remounts this view (see the key below). Kept here, the "Connected"
  // line vanished the moment it appeared, so people tapped Connect again
  // (the Apple Health retry friction from the focus group).
  const [error, setError] = useState(null);
  const [denied, setDenied] = useState(false);
  const [confirming, setConfirming] = useState(null); // 'disconnect' | { remove: cat }
  const [storeState, setStoreState] = useState(null);

  useEffect(() => {
    if (source.availability === 'device' && isNative) healthStoreAvailability().then(setStoreState).catch(() => setStoreState({ available: false }));
  }, [source.availability, isNative]);

  const apiSource = apiSourceFor(source.id);
  const refresh = () => onRefresh?.();

  const toggle = (id) => {
    if (!live) { setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id])); return; }
    if (selected.includes(id)) setConfirming({ remove: id });
    else saveCategories([...selected, id]);
  };

  const saveCategories = async (next) => {
    setBusy(true); setError(null);
    try {
      if (!next.length) { setConfirming('disconnect'); return; }
      if (source.availability === 'device') await requestHealthAccess(next);
      await updateSourceCategories(apiSource, next);
      setSelected(next);
      await refresh();
      if (source.availability === 'device') await syncPhoneSource({ force: true });
    } catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  };

  const connect = async () => {
    setBusy(true); setError(null); setMessage(null); setDenied(false);
    try {
      if (source.availability === 'oauth') {
        const { url } = await startOAuth(apiSource, selected, isNative ? 'app' : 'web');
        if (isNative) {
          const { Browser } = await import('@capacitor/browser');
          await Browser.open({ url });
        } else window.location.assign(url);
        return;
      }
      if (source.availability === 'device') {
        if (storeState && !storeState.available) { setError(storeMessage(storeState.reason, source)); return; }
        // Each step has a time limit and logs where it is, so a stuck step shows a
        // clear message (and a line in the Xcode console) instead of spinning forever.
        const step = async (name, p, ms) => {
          console.info('[ayna health] start', name);
          let timer;
          try {
            return await Promise.race([p, new Promise((_, rej) => { timer = setTimeout(() => rej(Object.assign(new Error(`timeout:${name}`), { step: name })), ms); })]);
          } catch (err) { console.warn('[ayna health] failed', name, err?.message || err); throw Object.assign(err || new Error(name), { step: err?.step || name }); }
          finally { clearTimeout(timer); console.info('[ayna health] done', name); }
        };
        const access = await step('permission', requestHealthAccess(selected), 200000);
        // Android says what was allowed. Nothing allowed: stop here, nothing saved, offer a retry.
        if (Array.isArray(access?.granted) && access.granted.length === 0) {
          setDenied(true);
          setError(`${source.name} didn't give ayna access, so nothing was shared. That's fine: ayna works without it. You can try again, or allow it in Health Connect.`);
          return;
        }
        // Saving the connection: one automatic retry for a flaky network.
        try { await step('save_connection', connectDeviceSource(apiSource, selected, Capacitor.getPlatform()), 30000); }
        catch (first) {
          if (first instanceof HealthApiError && first.status && first.status < 500 && first.status !== 0) throw first;
          await step('save_connection', connectDeviceSource(apiSource, selected, Capacitor.getPlatform()), 30000);
        }
        // Connected. Reloading the list and reading her data happen in the
        // background, so the button never waits on them.
        setMessage('Connected. Your data is syncing now. Your trends show on the Dashboard tab of your ecosystem.');
        step('refresh', refresh(), 30000)
          .then(() => step('sync', syncPhoneSource({ force: true }), 120000))
          .then((out) => {
            if (out?.empty) { setDenied(true); setMessage(`Connected, but no data came through yet. Either access was turned off in the ${source.name} sheet or there is no data yet for what you picked. ${source.platform === 'ios' ? 'To check, open the Health app, tap your picture, then Privacy, Apps, ayna, and turn on what you want. Then tap Check again.' : 'To check, open Health Connect, App permissions, ayna. Then tap Check again.'}`); }
            else if (out && !out.skipped) setMessage('Connected and synced. Your trends show on the Dashboard tab of your ecosystem.');
            return refresh();
          })
          .catch(() => setMessage('Connected. Reading your data is taking a while; tap Sync now in a minute.'));
      }
    } catch (e) {
      const stepMsg = {
        permission: `The ${source.name} permission sheet didn't finish. Try again, and if no sheet appears, open the Health app, tap your picture, Privacy, Apps, and check ayna.`,
        save_connection: 'Your phone gave access, but ayna couldn’t save the connection. Check your internet and try again.',
        refresh: 'Connected, but your connections list didn’t reload. Pull down or reopen this screen.',
        sync: 'Connected, but reading your data took too long. Tap Sync now in a minute.',
      };
      setError(e instanceof HealthApiError ? errorText(e) : (stepMsg[e?.step] || 'The permission sheet was closed or failed. Nothing was shared.'));
    } finally { setBusy(false); }
  };

  const syncNow = async () => {
    setBusy(true); setError(null);
    try {
      const out = source.availability === 'device' ? await syncPhoneSource({ force: true }) : await syncCloudSource(apiSource, { force: true });
      setMessage(out?.empty ? 'Synced. Nothing new came through.' : 'Synced. Your insights use the new data.');
      if (!out?.empty) setDenied(false);
    } catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  };

  const pauseResume = async () => {
    setBusy(true); setError(null);
    try { await (connection.status === 'paused' ? resumeSource(apiSource) : pauseSource(apiSource)); await refresh(); } catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  };

  const disconnect = async (deleteData) => {
    setBusy(true); setError(null);
    try {
      const out = await disconnectSource(apiSource, deleteData);
      await refresh();
      setConfirming(null);
      onDone?.(deleteData ? `${source.name} disconnected and ${out.deleted} days of data deleted.` : `${source.name} disconnected. Data already in ayna was kept.`);
    } catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  };

  const status = statusLine(connection);
  const canConnect = signedIn && availability.ok && selected.length > 0 && !(storeState && !storeState.available);

  return (
    <div className="ay-hc-detail">
      <div className="ay-hc-detail-head">
        <Icon name={source.icon} lg />
        <div>
          <h2>{source.name}</h2>
          <p>{live ? (connection.status === 'active' || !connection.status ? `Connected · ${lastSyncedLine(connection.last_synced_at)}` : status?.text) : source.kind}</p>
        </div>
      </div>

      {!availability.ok && <p className="ay-hc-note">{live && (source.availability === 'device' || source.availability === 'records') ? `Connected from your ${source.platform === 'ios' ? 'iPhone' : 'Android phone'}. Change what you share in the ayna app there.` : availability.reason}</p>}
      {availability.ok && storeState && !storeState.available && <p className="ay-hc-note">{storeMessage(storeState.reason, source)}</p>}
      {connection?.status === 'needs_reauth' && <p className="ay-hc-note is-alert">{source.name} stopped letting ayna sync. Reconnect to keep your data current.</p>}
      {connection?.status === 'error' && <p className="ay-hc-note is-alert">The last sync failed. Try Sync now; if it keeps failing, reconnect.</p>}

      <div className="ay-hc-facts">
        {providesLine(source) && <p><b>Can provide.</b> {providesLine(source)}.</p>}
        <p><b>What ayna reads.</b> {source.reads}</p>
        <p><b>What ayna never reads.</b> {source.never}</p>
        {source.note && <p className="ay-hc-small">{source.note}</p>}
      </div>

      <section className="ay-hc-group is-peri" aria-label="What to share">
        <h2>{live ? 'You share' : 'Choose what ayna can use'}</h2>
        <p className="ay-hc-usedfor">Used to personalize your insights and routine. Turn on only what you want. You can change this any time.</p>
        <CategoryToggles source={source} selected={selected} onToggle={toggle} disabled={busy || !availability.ok} />
      </section>

      {confirming?.remove && (
        <div className="ay-hc-confirm" role="alertdialog" aria-label="Stop sharing">
          <p>Stop sharing {CATEGORIES[confirming.remove].label.toLowerCase()} from {source.name}? ayna stops collecting it and deletes what it already has from this source.</p>
          <div>
            <button type="button" className="ay-hc-ghost" onClick={() => setConfirming(null)}>Keep sharing</button>
            <button type="button" className="ay-hc-danger is-solid" onClick={() => { const next = selected.filter((x) => x !== confirming.remove); setConfirming(null); saveCategories(next); }}>Stop and delete</button>
          </div>
        </div>
      )}

      {!live && availability.ok && connectSteps(source).length > 0 && (
        <div className="ay-hc-facts">
          <p><b>How connecting works</b></p>
          <ol className="ay-hc-steps">{connectSteps(source).map((t) => <li key={t}>{t}</li>)}</ol>
          <p className="ay-hc-small">If you change your mind, nothing breaks. Disconnect any time, and choose whether ayna keeps or deletes what it has.</p>
        </div>
      )}

      {!live && availability.ok && (
        <>
          <p className="ay-hc-consent">
            {selected.length
              ? `ayna will collect ${selected.map((c) => CATEGORIES[c].label.toLowerCase()).join(', ')} from ${source.name} to personalize your insights, routine and matches. Not used for ads, not shared with brands. You can stop or delete it any time.`
              : 'Turn on at least one to connect. Nothing is collected until you do.'}
          </p>
          {signedIn
            ? <button type="button" className="ay-hc-primary" disabled={!canConnect || busy} onClick={connect}>{busy ? 'Connecting…' : error ? 'Try again' : `Connect ${source.name}`}</button>
            : <button type="button" className="ay-hc-primary" onClick={onSignIn}>Sign in to connect</button>}
        </>
      )}

      {live && (
        <div className="ay-hc-stack">
          {connection.status !== 'paused' && <button type="button" className="ay-hc-primary" onClick={syncNow} disabled={busy}>{busy ? 'Working…' : denied ? 'Check again' : 'Sync now'}</button>}
          {connection.status === 'needs_reauth' && source.availability === 'oauth' && <button type="button" className="ay-hc-primary" onClick={connect} disabled={busy}>Reconnect {source.name}</button>}
          {source.availability === 'device' && Capacitor.getPlatform() === 'android' && <button type="button" className="ay-hc-ghost" onClick={() => openHealthPermissions()}>Manage permissions in Health Connect</button>}
          {source.availability === 'device' && Capacitor.getPlatform() === 'ios' && denied && <p className="ay-hc-small">iOS has no direct link to these settings. In the Health app: your picture, Privacy, Apps, ayna.</p>}
          <button type="button" className="ay-hc-ghost" onClick={pauseResume} disabled={busy}>{connection.status === 'paused' ? 'Resume syncing' : 'Pause syncing'}</button>
          {confirming === 'disconnect'
            ? <DisconnectChoice source={source} busy={busy} onCancel={() => setConfirming(null)} onConfirm={disconnect} />
            : <button type="button" className="ay-hc-danger" onClick={() => setConfirming('disconnect')} disabled={busy}>Disconnect</button>}
        </div>
      )}

      {!live && denied && source.availability === 'device' && Capacitor.getPlatform() === 'android' && <button type="button" className="ay-hc-ghost" onClick={() => openHealthPermissions()}>Open Health Connect permissions</button>}
      {message && <p className="ay-hc-done" role="status">{message}</p>}
      {error && <p className="ay-hc-error" role="alert">{error}</p>}
    </div>
  );
}

function storeMessage(reason, source) {
  if (reason === 'not_installed') return 'Health Connect isn\'t installed. Install it from the Play Store, then come back.';
  if (reason === 'update_required') return 'Health Connect needs an update from the Play Store first.';
  if (reason === 'not_supported') return `${source.name} isn't available on this device.`;
  if (reason === 'plugin_missing') return 'This version of the app can\'t read health data yet. Update ayna to connect.';
  return `${source.name} isn't available right now.`;
}

/* ------------------------------ Unavailable ------------------------------ */
function PendingDetail({ source }) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  return (
    <div className="ay-hc-detail">
      <div className="ay-hc-detail-head"><Icon name={source.icon} lg /><div><h2>{source.name}</h2><p>{source.kind}</p></div></div>
      <p className="ay-hc-note">{source.pending}</p>
      {source.reads && <div className="ay-hc-facts"><p><b>What ayna would read.</b> {source.reads}</p>{source.never && <p><b>Never.</b> {source.never}</p>}</div>}
      {source.availability === 'blocked' ? null : sent ? <p className="ay-hc-done" role="status">Got it. We'll count your vote.</p>
        : <button type="button" className="ay-hc-primary" onClick={() => requestSource(source.name, 'from waiting screen').then(() => setSent(true)).catch((e) => setError(errorText(e)))}>I want this</button>}
      {error && <p className="ay-hc-error" role="alert">{error}</p>}
    </div>
  );
}

/* --------------------------------- Flo ----------------------------------- */
function FloImport({ onUpload }) {
  return (
    <div className="ay-hc-detail">
      <div className="ay-hc-detail-head"><Icon name="cycle" lg /><div><h2>Import from Flo</h2><p>Cycle app</p></div></div>
      <div className="ay-hc-facts">
        <p>Flo doesn't let other apps connect to it directly, so you bring your data over yourself.</p>
        <ol className="ay-hc-steps">
          <li>In Flo, open the menu (your picture), then Help, then Contact us, and ask for a copy of your data.</li>
          <li>Ask for the machine-readable JSON file. A TXT file works too.</li>
          <li>Upload it here. ayna reads it on your device, shows you what it found, and saves only what you confirm.</li>
        </ol>
        <p className="ay-hc-small">Flo doesn't send period logs to Apple Health, so connecting Apple Health won't bring in your Flo cycle history. The export is the way to get it. Natural Cycles (CSV) and Clue (JSON) exports work the same way through Upload health data.</p>
      </div>
      <button type="button" className="ay-hc-primary" onClick={onUpload}>Upload my Flo file</button>
    </div>
  );
}

/* -------------------------------- Request -------------------------------- */
const POPULAR = ['Fitbit', 'Samsung Health', 'Natural Cycles', 'Clue', 'Apple Watch', 'Ultrahuman', 'Withings'];
function RequestSource({ signedIn, onSignIn, presetName = '' }) {
  const [name, setName] = useState(presetName);
  const [note, setNote] = useState('');
  const [state, setState] = useState('idle');
  const [error, setError] = useState(null);
  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setState('busy'); setError(null);
    try { await requestSource(name.trim(), note.trim() || null); setState('done'); } catch (err) { setError(errorText(err)); setState('idle'); }
  };
  if (state === 'done') return <p className="ay-hc-done" role="status">Sent to the ayna team. Requests decide what we connect next.</p>;
  return (
    <form className="ay-hc-detail ay-hc-form" onSubmit={submit}>
      <div className="ay-hc-detail-head"><Icon name="plus" lg /><div><h2>Request an app or wearable</h2><p>Tell us what you use</p></div></div>
      <label htmlFor="ay-hc-req-name">App or wearable</label>
      <input id="ay-hc-req-name" list="ay-hc-req-list" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="e.g. Fitbit" autoComplete="off" />
      <datalist id="ay-hc-req-list">{POPULAR.map((p) => <option key={p} value={p} />)}</datalist>
      <label htmlFor="ay-hc-req-note">Note (optional)</label>
      <textarea id="ay-hc-req-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={280} rows={3} placeholder="What would you want ayna to do with it?" />
      {signedIn
        ? <button type="submit" className="ay-hc-primary" disabled={!name.trim() || state === 'busy'}>{state === 'busy' ? 'Sending…' : 'Send request'}</button>
        : <button type="button" className="ay-hc-primary" onClick={onSignIn}>Sign in to send</button>}
      {error && <p className="ay-hc-error" role="alert">{error}</p>}
    </form>
  );
}

/* --------------------------------- Screen -------------------------------- */
// tabName: the app's tab is Home; the website passes Today (QA, Oct 25).
export default function HealthConnectionsScreen({ selectedId, onSelect, onBack, authUser, onSignIn, onOpenInsights, compact = false, tabName = 'Home' }) {
  const health = useHealthData(authUser?.id || null);
  const [flash] = useState(takeHealthFlash);
  const [notice, setNotice] = useState(null); // { sourceId, text }: survives SourceDetail remounts
  const [baseId, preset] = String(selectedId || '').split(':');
  const source = useMemo(() => (baseId ? sourceById(baseId) : null), [baseId]);
  const signedIn = Boolean(authUser?.id);
  const done = (msg) => { setHealthFlash(msg); onBack?.(); };

  if (!source) {
    return (
      <>
        {flash && <p className="ay-hc-done" role="status">{flash}</p>}
        <SourceList
          connections={health.connections}
          records={health.records}
          onOpen={onSelect}
          onOpenInsights={onOpenInsights}
          hasInsights={health.insights.sections.length > 0}
          signedIn={signedIn}
          onSignIn={onSignIn}
          onRefresh={health.refresh}
          compact={compact}
          tabName={tabName}
          userId={authUser?.id || null}
        />
        {health.status === 'error' && signedIn && <p className="ay-hc-error" role="alert">{"Couldn't load your health data."} <button type="button" className="ay-hc-link" onClick={health.refresh}>Try again</button></p>}
      </>
    );
  }

  if (source.id === 'upload') return <HealthUploadScreen signedIn={signedIn} onSignIn={onSignIn} presetApp={preset === 'flo' ? 'Flo' : ''} onDone={(msg) => { health.refresh(); done(msg); }} />;
  if (source.id === 'flo') return <FloImport onUpload={() => onSelect('upload:flo')} />;
  if (source.id === 'request') return <RequestSource signedIn={signedIn} onSignIn={onSignIn} presetName={preset ? decodeURIComponent(preset) : ''} />;
  if (source.id === 'records') return <HealthRecordsScreen source={source} userId={authUser?.id || null} saved={health.records} onSignIn={onSignIn} onDone={done} />;
  if (source.availability === 'needs_approval' || source.availability === 'later' || source.availability === 'blocked') return <PendingDetail source={source} />;

  const connection = health.connections.find((c) => c.source === apiSourceFor(source.id));
  return (
    <SourceDetail
      key={`${source.id}:${connection?.status || 'none'}:${(connection?.categories || []).join(',')}`}
      source={source}
      connection={connection}
      signedIn={signedIn}
      onSignIn={onSignIn}
      onDone={done}
      onRefresh={health.refresh}
      message={notice?.sourceId === source.id ? notice.text : null}
      setMessage={(text) => setNotice(text ? { sourceId: source.id, text } : null)}
    />
  );
}

