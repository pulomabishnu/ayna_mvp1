import { useEffect, useMemo, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { RECORD_TYPES, parseClinicalRecords } from '../../../health/records.js';
import { readClinicalRecords, recordsAvailability, requestRecordsAccess } from '../../../health/recordsNative.js';
import { logRecordsEvent } from '../../../health/healthApi.js';
import { forgetHealthRecords, keepHealthRecords } from '../../hooks/useHealthData.js';

/**
 * Apple Health Records (You -> Health data -> Apple Health Records).
 *
 * 1. She picks which record types to read (all off).
 * 2. Apple shows its own clinical-records permission sheet.
 * 3. ayna reads and parses the FHIR records ON THE PHONE and lists them.
 * 4. She ticks what to keep (nothing pre-ticked). Only those names are saved,
 *    on this iPhone. The server only logs that she saved records (types and a
 *    count), never what they are.
 */

const TYPES = Object.keys(RECORD_TYPES);
const PLURAL_KEY = { allergy: 'allergies', condition: 'conditions', medication: 'medications' };

const UNAVAILABLE = {
  web: 'Apple Health Records can only be read in the ayna app on your iPhone.',
  not_ios: 'Apple Health Records are only on iPhone.',
  plugin_missing: "This version of the app can't read health records yet. Update ayna to use them.",
  records_not_supported: "This iPhone can't show health records. Health Records are available in some countries only, and need a hospital or clinic connected in the Health app.",
  not_supported: "Health records aren't available on this device.",
};

function Head({ source }) {
  return <div className="ay-hc-detail-head"><div><h2>{source.name}</h2><p>{source.kind}</p></div></div>;
}

function SavedList({ saved }) {
  return (
    <div className="ay-hc-card">
      {TYPES.map((t) => {
        const items = saved[PLURAL_KEY[t]];
        if (!items.length) return null;
        return (
          <div key={t} className="ay-hc-row is-static">
            <span className="ay-hc-row-text">
              <span className="ay-hc-row-title">{RECORD_TYPES[t].label}</span>
              <span className="ay-hc-row-sub">{items.join(', ')}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function HealthRecordsScreen({ source, userId, saved, onSignIn, onDone }) {
  const isNative = Capacitor.isNativePlatform();
  const [avail, setAvail] = useState(null);
  const [step, setStep] = useState(saved ? 'saved' : 'pick'); // pick | reading | review | saved
  const [types, setTypes] = useState([]);
  const [found, setFound] = useState(null);
  const [picked, setPicked] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    let alive = true;
    recordsAvailability().then((a) => { if (alive) setAvail(a); }).catch(() => { if (alive) setAvail({ available: false, reason: 'plugin_missing' }); });
    return () => { alive = false; };
  }, []);

  const total = useMemo(() => (found ? TYPES.reduce((n, t) => n + found[t].length, 0) : 0), [found]);
  const toggleType = (t) => setTypes((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]));
  const togglePick = (id) => setPicked((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const read = async () => {
    setError(null); setStep('reading');
    try {
      await requestRecordsAccess(types);
      const raw = await readClinicalRecords(types);
      setFound(parseClinicalRecords(raw));
      setPicked([]);
      setStep('review');
    } catch {
      setError("Couldn't read your health records. Try again.");
      setStep('pick');
    }
  };

  const keep = async () => {
    setBusy(true); setError(null);
    const chosen = { allergies: [], conditions: [], medications: [] };
    for (const t of TYPES) chosen[PLURAL_KEY[t]] = found[t].filter((i) => picked.includes(i.id)).map((i) => i.name);
    const count = chosen.allergies.length + chosen.conditions.length + chosen.medications.length;
    try {
      // Consent log first (types and count only). If it fails, nothing is kept.
      await logRecordsEvent('records_saved', types, count);
      keepHealthRecords(userId, { ...chosen, types });
      onDone?.(`Saved ${count} ${count === 1 ? 'record' : 'records'} on this iPhone.`);
    } catch {
      setError("Couldn't save. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    const count = saved ? saved.allergies.length + saved.conditions.length + saved.medications.length : 0;
    forgetHealthRecords(userId); // delete first; never blocked by the network
    logRecordsEvent('records_deleted', saved?.types || [], count).catch(() => {});
    setBusy(false);
    onDone?.('Deleted your health records from ayna on this iPhone. Your records in the Health app are unchanged.');
  };

  const facts = (
    <div className="ay-hc-facts">
      <p><b>What ayna reads.</b> {source.reads}</p>
      <p><b>Never.</b> {source.never}</p>
      <p>{source.note}</p>
    </div>
  );

  if (!userId) {
    return (
      <div className="ay-hc-detail">
        <Head source={source} />{facts}
        <button type="button" className="ay-hc-primary" onClick={onSignIn}>Sign in to use health records</button>
      </div>
    );
  }

  if (step === 'saved' && saved) {
    return (
      <div className="ay-hc-detail">
        <Head source={source} />
        <p className="ay-hc-note">Saved on this iPhone{saved.savedAt ? ` on ${new Date(saved.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}. Used only for your own matches.</p>
        <SavedList saved={saved} />
        {confirmDelete ? (
          <div className="ay-hc-confirm" role="alertdialog" aria-label="Delete health records">
            <p>Delete these from ayna? Your records in the Health app stay as they are. To also stop ayna reading them, open the Health app, tap your picture, then Privacy, Apps, ayna.</p>
            <div className="ay-hc-stack">
              <button type="button" className="ay-hc-danger is-solid" onClick={remove} disabled={busy}>Delete from ayna</button>
              <button type="button" className="ay-hc-link" onClick={() => setConfirmDelete(false)} disabled={busy}>Keep them</button>
            </div>
          </div>
        ) : (
          <>
            <button type="button" className="ay-hc-primary" onClick={() => setStep('pick')} disabled={!avail?.available}>Read again from Apple Health</button>
            <button type="button" className="ay-hc-ghost" onClick={() => setConfirmDelete(true)}>Delete from ayna</button>
          </>
        )}
      </div>
    );
  }

  if (step === 'review' && found) {
    return (
      <div className="ay-hc-detail">
        <Head source={source} />
        {total === 0 ? (
          <>
            <p className="ay-hc-note">No records came back. Either there are none of these types in your Health app, or ayna isn't allowed to read them. Apple doesn't tell apps which. To check, open the Health app, tap your picture, then Privacy, Apps, ayna.</p>
            <button type="button" className="ay-hc-ghost" onClick={() => setStep('pick')}>Back</button>
          </>
        ) : (
          <>
            <p className="ay-hc-intro">Check what ayna may keep. Nothing is kept unless you tick it.</p>
            {TYPES.filter((t) => types.includes(t)).map((t) => (
              <section key={t} className="ay-hc-group" aria-label={RECORD_TYPES[t].label}>
                <h2>{RECORD_TYPES[t].label}</h2>
                {found[t].length === 0 ? <p className="ay-hc-small">None found.</p> : (
                  <div className="ay-hc-card">
                    {found[t].map((item) => (
                      <label key={item.id} className="ay-hc-row is-static ay-hc-check">
                        <span className="ay-hc-row-text">
                          <span className="ay-hc-row-title">{item.name}</span>
                          {item.sources.length > 0 && <span className="ay-hc-row-sub">From {item.sources.join(', ')}</span>}
                        </span>
                        <input type="checkbox" checked={picked.includes(item.id)} onChange={() => togglePick(item.id)} />
                      </label>
                    ))}
                  </div>
                )}
              </section>
            ))}
            {found.skipped > 0 && <p className="ay-hc-small">{found.skipped} older, resolved or unreadable {found.skipped === 1 ? 'record was' : 'records were'} left out.</p>}
            <button type="button" className="ay-hc-primary" onClick={keep} disabled={busy || !picked.length}>{busy ? 'Saving…' : `Keep ${picked.length || ''} on this iPhone`.replace('  ', ' ')}</button>
            <button type="button" className="ay-hc-ghost" onClick={() => onDone?.('Nothing was saved.')} disabled={busy}>Don't keep any</button>
          </>
        )}
        {error && <p className="ay-hc-error" role="alert">{error}</p>}
      </div>
    );
  }

  const ready = avail?.available;
  return (
    <div className="ay-hc-detail">
      <Head source={source} />
      {facts}
      {avail && !ready && <p className="ay-hc-note">{UNAVAILABLE[avail.reason] || UNAVAILABLE.not_supported}</p>}
      {(ready || !isNative) && (
        <>
          <p className="ay-hc-small">Choose what ayna may read. Apple will then ask you to confirm.</p>
          <div className="ay-hc-card">
            {TYPES.map((t) => (
              <label key={t} className="ay-hc-row is-static ay-hc-check">
                <span className="ay-hc-row-text"><span className="ay-hc-row-title">{RECORD_TYPES[t].label}</span><span className="ay-hc-row-sub">{RECORD_TYPES[t].why}</span></span>
                <input type="checkbox" checked={types.includes(t)} onChange={() => toggleType(t)} disabled={!ready} />
              </label>
            ))}
          </div>
          <button type="button" className="ay-hc-primary" onClick={read} disabled={!ready || !types.length || step === 'reading'}>{step === 'reading' ? 'Reading…' : 'Read my records'}</button>
        </>
      )}
      {error && <p className="ay-hc-error" role="alert">{error}</p>}
    </div>
  );
}
