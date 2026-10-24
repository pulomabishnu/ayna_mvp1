import { useMemo, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { CATEGORIES, METRICS } from '../../../health/metrics.js';
import { categoriesFor, fileKind, foundSummary, originFor, parseHealthFile } from '../../../health/manualImport.js';
import { confirmImport, extractFromImage, extractionStatus } from '../../../health/healthApi.js';
import { formatValue, parseEdited } from '../../../health/format.js';

/**
 * "Upload health data". The file is read on her device; nothing is saved until
 * she has checked every value and ticked what may be saved. The file itself is
 * never stored by ayna.
 */

const MAX_REVIEW_ROWS = 400;
const fmtDay = (day) => new Date(`${day}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const TYPEABLE = ['sleep_minutes', 'steps', 'resting_hr_bpm', 'hrv_rmssd_ms', 'basal_temp_c', 'menstrual_flow', 'workout_minutes', 'active_energy_kcal', 'readiness_score'];

function ManualEntry({ onAdd, declaredOrigin }) {
  const today = new Date().toISOString().slice(0, 10);
  const [day, setDay] = useState(today);
  const [metric, setMetric] = useState('sleep_minutes');
  const [text, setText] = useState('');
  const [err, setErr] = useState(null);
  const placeholder = { min: 'e.g. 6h 32m', bpm: 'e.g. 68', count: 'e.g. 7420', degC: 'e.g. 36.4 or 97.6 F', flow_level: 'Light, Medium or Heavy', ms: 'e.g. 45', kcal: 'e.g. 350', score: 'e.g. 78' }[METRICS[metric].unit];
  const add = (e) => {
    e.preventDefault();
    const v = parseEdited(metric, text);
    if (v == null || !day || day > today) { setErr("That value doesn't look right."); return; }
    setErr(null);
    onAdd({ metric, day, value: v, origin: declaredOrigin, label: METRICS[metric].label });
    setText('');
  };
  return (
    <form className="ay-hc-manual" onSubmit={add}>
      <div className="ay-hc-manual-row">
        <label>Date<input type="date" value={day} max={today} onChange={(e) => setDay(e.target.value)} /></label>
        <label>What<select value={metric} onChange={(e) => { setMetric(e.target.value); setText(''); }}>{TYPEABLE.map((m) => <option key={m} value={m}>{METRICS[m].label}</option>)}</select></label>
      </div>
      <label>Value<input value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} inputMode="text" /></label>
      {err && <p className="ay-hc-error" role="alert">{err}</p>}
      <button type="submit" className="ay-hc-ghost" disabled={!text.trim()}>Add</button>
    </form>
  );
}

function ReviewRow({ row, onChange, onRemove }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(() => formatValue(row.metric, row.value));
  const [bad, setBad] = useState(false);
  const commit = () => {
    const v = parseEdited(row.metric, text);
    if (v == null) { setBad(true); return; }
    setBad(false); setEditing(false); onChange(v);
  };
  return (
    <div className="ay-hc-review-row">
      <span className="ay-hc-review-label"><b>{METRICS[row.metric].label}</b><small>{fmtDay(row.day)}{row.note ? ` · ${row.note}` : ''}</small></span>
      {editing
        ? <span className="ay-hc-review-edit"><input aria-label={`${METRICS[row.metric].label} on ${fmtDay(row.day)}`} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); } }} aria-invalid={bad} autoFocus /><button type="button" className="ay-hc-link" onClick={commit}>Done</button></span>
        : <button type="button" className="ay-hc-review-value" onClick={() => setEditing(true)} aria-label={`Edit ${METRICS[row.metric].label}, ${formatValue(row.metric, row.value)}`}>{formatValue(row.metric, row.value)}</button>}
      <button type="button" className="ay-hc-remove" onClick={onRemove} aria-label={`Remove ${METRICS[row.metric].label} on ${fmtDay(row.day)}`}>×</button>
      {bad && <span className="ay-hc-error is-inline">Not a valid value</span>}
    </div>
  );
}

export default function HealthUploadScreen({ signedIn, onSignIn, onDone, presetApp = '' }) {
  const [app, setApp] = useState(presetApp);
  const [step, setStep] = useState('pick'); // pick | review
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ kind: 'manual', unrecognized: 0, ignored: [] });
  const [consent, setConsent] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [typing, setTyping] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);
  const origin = originFor(app);

  const cats = useMemo(() => categoriesFor(rows), [rows]);
  const saveable = rows.filter((r) => consent.includes(METRICS[r.metric].category));

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    const kind = fileKind(file.name, file.type);
    if (!kind) { setError('ayna can read CSV, JSON and TXT files, and screenshots.'); return; }
    if (file.size > 20 * 1024 * 1024) { setError('That file is over 20 MB. Export a shorter date range and try again.'); return; }
    setBusy(true);
    try {
      if (kind === 'pdf') { setError("ayna can't read PDFs yet. Export a CSV or JSON, or type the numbers in below."); setTyping(true); return; }
      if (kind === 'image') {
        const enabled = await extractionStatus();
        if (!enabled) { setError("ayna can't read screenshots yet. Type in what you see below; it only takes a minute."); setTyping(true); return; }
        setPendingImage(file);
        return;
      }
      const text = await file.text();
      const out = parseHealthFile({ name: file.name, type: file.type, text, declaredApp: app });
      if (out.error) {
        setError({ empty: 'That file is empty.', invalid_json: "That JSON file couldn't be read. It may be damaged or not a data export.", no_date_column: "We couldn't find a date column in that file.", too_large: 'That file is too large.' }[out.error] || "We couldn't read that file.");
        return;
      }
      if (!out.candidates.length) { setError("We read the file but didn't recognize any health values in it."); return; }
      setRows(out.candidates.slice(0, MAX_REVIEW_ROWS));
      setMeta({ kind, unrecognized: out.unrecognized, ignored: out.ignoredColumns || [], truncated: out.candidates.length > MAX_REVIEW_ROWS });
      setStep('review');
    } finally { setBusy(false); }
  };

  const readImage = async () => {
    const file = pendingImage;
    setPendingImage(null);
    setBusy(true); setError(null);
    try {
      const out = await extractFromImage(file, app);
      if (!out.candidates?.length) { setError("We couldn't find any health numbers in that image. Type them in below instead."); setTyping(true); return; }
      setRows(out.candidates.map((c) => ({ ...c, origin })));
      setMeta({ kind: 'image', unrecognized: 0, ignored: [], fromImage: true });
      setStep('review');
    } catch {
      setError("We couldn't read that image. Type in what you see below instead.");
      setTyping(true);
    } finally { setBusy(false); }
  };

  const save = async () => {
    setBusy(true); setError(null);
    try {
      const out = await confirmImport({
        declaredApp: app.trim() || null,
        fileKind: meta.kind,
        categories: consent.filter((c) => cats.includes(c)),
        rows: saveable.map(({ metric, day, value, origin: o }) => ({ metric, day, value, origin: o || origin })),
        platform: Capacitor.isNativePlatform() ? Capacitor.getPlatform() : 'web',
      });
      setRows([]);
      const used = consent.filter((c) => cats.includes(c)).map((c) => CATEGORIES[c].label.toLowerCase());
      onDone?.(`Saved ${out.saved} ${out.saved === 1 ? 'value' : 'values'}${used.length ? ` (${used.join(', ')})` : ''}. ayna now uses them for your insights and routine. Your file wasn't kept.`);
    } catch (e) {
      setError(e?.code === 'not_signed_in' ? 'Sign in to save.' : 'Saving failed. Nothing was saved. Try again.');
    } finally { setBusy(false); }
  };

  if (step === 'review') {
    return (
      <div className="ay-hc-detail">
        <div className="ay-hc-detail-head"><span className="ay-hc-icon is-lg"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg></span><div><h2>We found</h2><p>Check each value. Tap one to fix it, × to drop it.</p></div></div>
        {meta.fromImage && <p className="ay-hc-note">Read from your image, so mistakes are possible. Check every number before saving.</p>}
        {rows.length > 0 && (
          <div className="ay-hc-facts" role="status">
            <p><b>What ayna found in your file</b></p>
            <ul className="ay-hc-steps">{foundSummary(rows).map((f) => <li key={f.metric}>{f.line}</li>)}</ul>
            <p className="ay-hc-small">ayna reads the numbers only. It doesn't interpret them or diagnose anything from a file.</p>
          </div>
        )}
        <div className="ay-hc-card ay-hc-review">
          {rows.map((r, i) => (
            <ReviewRow
              key={`${r.metric}|${r.day}`}
              row={r}
              onChange={(v) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, value: v } : x)))}
              onRemove={() => setRows((rs) => rs.filter((_, j) => j !== i))}
            />
          ))}
          {!rows.length && <p className="ay-hc-small" style={{ padding: 14 }}>Nothing left to save.</p>}
        </div>
        {(meta.unrecognized > 0 || meta.ignored.length > 0 || meta.truncated) && (
          <p className="ay-hc-small">
            {meta.unrecognized > 0 && `${meta.unrecognized} ${meta.unrecognized === 1 ? 'entry' : 'entries'} we couldn't read were left out. `}
            {meta.ignored.length > 0 && `Not read: ${meta.ignored.slice(0, 6).join(', ')}${meta.ignored.length > 6 ? '…' : ''}. `}
            {meta.truncated && `Only the first ${MAX_REVIEW_ROWS} values are shown; upload a shorter range for the rest.`}
          </p>
        )}
        <button type="button" className="ay-hc-link" onClick={() => setTyping((t) => !t)}>{typing ? 'Hide' : 'Add a value by hand'}</button>
        {typing && <ManualEntry declaredOrigin={origin} onAdd={(r) => setRows((rs) => [...rs.filter((x) => !(x.metric === r.metric && x.day === r.day)), r])} />}

        {cats.length > 0 && (
          <section className="ay-hc-group is-peri" aria-label="What should ayna use this for?">
            <h2>What should ayna use this for?</h2>
            <p className="ay-hc-usedfor">Tick what you want ayna to use to personalize your insights and routine. Anything you leave unticked is not saved.</p>
            <div className="ay-hc-card">
              {cats.map((c) => (
                <label key={c} className="ay-hc-row is-static ay-hc-check">
                  <span className="ay-hc-row-text"><span className="ay-hc-row-title">{CATEGORIES[c].label}</span><span className="ay-hc-row-sub">{CATEGORIES[c].why}</span></span>
                  <input type="checkbox" checked={consent.includes(c)} onChange={() => setConsent((s) => (s.includes(c) ? s.filter((x) => x !== c) : [...s, c]))} />
                </label>
              ))}
            </div>
            <p className="ay-hc-consent">Only the categories you tick are saved, as {app.trim() ? `"${app.trim()}" data you uploaded` : 'data you uploaded'}. Used for your matches and insights only, never shared with brands. You can delete it from Health data any time.</p>
          </section>
        )}
        {signedIn
          ? <button type="button" className="ay-hc-primary" onClick={save} disabled={busy || !saveable.length}>{busy ? 'Saving…' : saveable.length ? `Save ${saveable.length} ${saveable.length === 1 ? 'value' : 'values'}` : 'Tick what to save'}</button>
          : <button type="button" className="ay-hc-primary" onClick={onSignIn}>Sign in to save</button>}
        <button type="button" className="ay-hc-ghost" onClick={() => { setRows([]); setConsent([]); setStep('pick'); }} disabled={busy}>Discard</button>
        {error && <p className="ay-hc-error" role="alert">{error}</p>}
      </div>
    );
  }

  return (
    <div className="ay-hc-detail ay-hc-form">
      <div className="ay-hc-detail-head"><span className="ay-hc-icon is-lg"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V4M7.5 8.5 12 4l4.5 4.5" /><path d="M5 14v5h14v-5" /></svg></span><div><h2>Upload health data</h2><p>For apps ayna can't connect to directly</p></div></div>
      <label htmlFor="ay-hc-app">Which app or device is it from? (optional)</label>
      <input id="ay-hc-app" value={app} onChange={(e) => setApp(e.target.value)} maxLength={60} placeholder="e.g. Flo, WHOOP, Fitbit" />
      <label className="ay-hc-file">
        <input type="file" accept=".csv,.json,.txt,text/csv,application/json,text/plain,image/*" onChange={onFile} disabled={busy} />
        <span>{busy ? 'Reading…' : 'Choose a file or screenshot'}</span>
      </label>
      <p className="ay-hc-small">CSV, JSON or TXT exports are read on your device. ayna shows you what it found and saves only what you confirm. Files aren't kept.</p>
      {pendingImage && (
        <div className="ay-hc-confirm" role="alertdialog" aria-label="Read screenshot">
          <p>To read a screenshot, ayna sends it to its AI provider (Anthropic), which pulls out the numbers. The image isn't stored by ayna and you check every value before anything is saved.</p>
          <div>
            <button type="button" className="ay-hc-ghost" onClick={() => { setPendingImage(null); setTyping(true); }}>Type it in instead</button>
            <button type="button" className="ay-hc-primary" onClick={readImage}>Read it</button>
          </div>
        </div>
      )}
      <button type="button" className="ay-hc-link" onClick={() => setTyping((t) => !t)}>{typing ? 'Hide' : 'Or type it in'}</button>
      {typing && <ManualEntry declaredOrigin={origin} onAdd={(r) => { setRows((rs) => [...rs.filter((x) => !(x.metric === r.metric && x.day === r.day)), r]); setMeta({ kind: 'manual', unrecognized: 0, ignored: [] }); setStep('review'); }} />}
      {error && <p className="ay-hc-error" role="alert">{error}</p>}
    </div>
  );
}
