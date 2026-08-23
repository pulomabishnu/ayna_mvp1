import React, { useState } from 'react';
import Disclaimer from './Disclaimer';
import { loadHealthProfile, saveHealthProfile, parseFhirBundleText } from '../utils/healthDataProfile';
import { summarizeAppleHealthExport } from '../utils/parseAppleHealthExport';

function parseCommaLines(text) {
  return text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function readInitialFields() {
  const p = loadHealthProfile();
  if (!p) {
    return {
      conditions: '',
      medications: '',
      allergies: '',
      notes: '',
      wearableText: '',
      appleHealth: false,
      googleFit: false,
      fhirConnected: false,
      savedAt: null,
    };
  }
  return {
    conditions: p.conditions.join('\n'),
    medications: p.medications.join('\n'),
    allergies: p.allergies.join('\n'),
    notes: p.notes || '',
    wearableText: p.wearableSummary?.text || '',
    appleHealth: !!p.sources?.appleHealth,
    googleFit: !!p.sources?.googleFit,
    fhirConnected: !!p.sources?.fhir,
    savedAt: p.updatedAt,
  };
}

export default function HealthDataImport({ onUpdate }) {
  const init = readInitialFields();
  const [conditions, setConditions] = useState(init.conditions);
  const [medications, setMedications] = useState(init.medications);
  const [allergies, setAllergies] = useState(init.allergies);
  const [notes, setNotes] = useState(init.notes);
  const [wearableText, setWearableText] = useState(init.wearableText);
  const [appleHealth, setAppleHealth] = useState(init.appleHealth);
  const [googleFit, setGoogleFit] = useState(init.googleFit);
  const [fhirConnected, setFhirConnected] = useState(init.fhirConnected);
  const [fhirError, setFhirError] = useState('');
  const [savedAt, setSavedAt] = useState(init.savedAt);

  const [appleHealthError, setAppleHealthError] = useState('');
  const [appleHealthSummary, setAppleHealthSummary] = useState('');

  const handleAppleHealthFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAppleHealthError('');
    setAppleHealthSummary('');
    if (!/\.xml$/i.test(file.name)) {
      setAppleHealthError('That doesn’t look like export.xml. Unzip the Apple Health export and pick the .xml file inside it.');
      return;
    }
    if (file.size > 150 * 1024 * 1024) {
      setAppleHealthError('That export is too large to parse in the browser (over 150MB).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = summarizeAppleHealthExport(String(reader.result || ''));
      if (result.error === 'not_apple_health_export') {
        setAppleHealthError('That file doesn’t look like an Apple Health export.xml.');
        return;
      }
      if (result.error === 'file_too_large') {
        setAppleHealthError('That export is too large to parse in the browser.');
        return;
      }
      if (result.error === 'no_recognized_records' || !result.summaryText) {
        setAppleHealthError('No steps, sleep, heart rate, or cycle data found in the last 30 days of this export.');
        return;
      }
      setAppleHealth(true);
      setWearableText(result.summaryText);
      setAppleHealthSummary(result.summaryText);
      persist({ appleHealthOverride: true, wearableTextOverride: result.summaryText });
    };
    reader.onerror = () => setAppleHealthError('Could not read that file.');
    reader.readAsText(file, 'UTF-8');
  };

  const persist = (patch = {}) => {
    const existing = loadHealthProfile();
    const mergedFhir = patch.fhirSummary !== undefined ? patch.fhirSummary : (existing?.fhirSummary || { conditions: [], medications: [] });
    const effectiveWearableText = patch.wearableTextOverride !== undefined ? patch.wearableTextOverride : wearableText;
    const saved = saveHealthProfile({
      conditions: parseCommaLines(conditions),
      medications: parseCommaLines(medications),
      allergies: parseCommaLines(allergies),
      notes,
      intakeSummary: (existing && typeof existing.intakeSummary === 'string') ? existing.intakeSummary : '',
      wearableSummary: { text: effectiveWearableText.trim() },
      sources: {
        appleHealth: patch.appleHealthOverride !== undefined ? patch.appleHealthOverride : appleHealth,
        googleFit,
        fhir: fhirConnected || (mergedFhir.conditions?.length > 0 || mergedFhir.medications?.length > 0),
        manual:
          parseCommaLines(conditions).length > 0 ||
          parseCommaLines(medications).length > 0 ||
          !!notes.trim() ||
          !!effectiveWearableText.trim(),
      },
      fhirSummary: mergedFhir,
    });
    if (saved) {
      setSavedAt(saved.updatedAt);
      onUpdate?.(saved);
    }
  };

  const handleFhirFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFhirError('');
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      const parsed = parseFhirBundleText(text);
      if (parsed.error) {
        setFhirError(parsed.error);
        return;
      }
      if (parsed.conditions.length === 0 && parsed.medications.length === 0) {
        setFhirError('No conditions or medications found in this bundle. Try an export that includes Problem List or Medications.');
        return;
      }
      setFhirConnected(true);
      persist({ fhirSummary: { conditions: parsed.conditions, medications: parsed.medications } });
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  return (
    <div id="health-data-import" style={{ maxWidth: '800px', margin: '0 auto 3rem', padding: '1.5rem', background: 'var(--color-surface-soft)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', scrollMarginTop: '1rem' }}>
      <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Health data import</h3>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: 1.55, marginBottom: '1.25rem' }}>
        Connect EHR exports, manual conditions, and wearable summaries so your ecosystem ranking matches what you share with your care team. Data stays in this browser unless you choose to sync (premium). We never sell health data.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Apple Health</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
            Ayna doesn’t have a phone app, so we can’t read Apple Health directly off your device. Instead: open the <strong>Health app → your profile picture (top right) → Export All Health Data</strong>, then unzip the download to find <strong>export.xml</strong> and upload it below. We parse steps, sleep, heart rate, and cycle tracking data locally in your browser. The file is not sent to our servers.
          </p>
          <label style={{ fontSize: '0.9rem', cursor: 'pointer', display: 'inline-block' }}>
            <span className="btn btn-outline" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}>Choose export.xml</span>
            <input type="file" accept=".xml,text/xml,application/xml" onChange={handleAppleHealthFile} style={{ display: 'none' }} />
          </label>
          {appleHealthError && <p style={{ color: '#b91c1c', fontSize: '0.85rem', marginTop: '0.5rem' }}>{appleHealthError}</p>}
          {appleHealthSummary && !appleHealthError && (
            <p style={{ fontSize: '0.85rem', color: 'var(--color-primary)', marginTop: '0.5rem' }}>Parsed and saved below. {appleHealthSummary}</p>
          )}
        </div>
        <div style={{ padding: '1rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Google Fit &amp; other apps</p>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
            <input type="checkbox" checked={googleFit} onChange={(e) => setGoogleFit(e.target.checked)} />
            I use Google Fit, Apple Watch, Oura, or similar. I’ll paste a short summary below (sleep, steps, cycle estimates).
          </label>
        </div>
        <div style={{ padding: '1rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Electronic health record (FHIR)</p>
          <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
            Many Epic / MyChart portals offer a <strong>Download my data</strong> export as a FHIR JSON bundle. Upload it here. We parse conditions and medication statements locally in your browser; the file is not sent to our servers.
          </p>
          <label style={{ fontSize: '0.9rem', cursor: 'pointer', display: 'inline-block' }}>
            <span className="btn btn-outline" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}>Choose FHIR JSON file</span>
            <input type="file" accept=".json,application/json" onChange={handleFhirFile} style={{ display: 'none' }} />
          </label>
          {fhirError && <p style={{ color: '#b91c1c', fontSize: '0.85rem', marginTop: '0.5rem' }}>{fhirError}</p>}
          {fhirConnected && !fhirError && (
            <p style={{ fontSize: '0.85rem', color: 'var(--color-primary)', marginTop: '0.5rem' }}>FHIR summary saved. Used only to improve ranking on top of your quiz.</p>
          )}
        </div>
      </div>

      <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.35rem', fontSize: '0.9rem' }}>Conditions (one per line or comma-separated)</label>
      <textarea
        value={conditions}
        onChange={(e) => setConditions(e.target.value)}
        rows={3}
        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: '1rem', fontSize: '0.9rem' }}
        placeholder="e.g. endometriosis, iron deficiency anemia"
      />

      <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.35rem', fontSize: '0.9rem' }}>Medications &amp; supplements</label>
      <textarea
        value={medications}
        onChange={(e) => setMedications(e.target.value)}
        rows={3}
        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: '1rem', fontSize: '0.9rem' }}
        placeholder="e.g. levothyroxine 50 mcg, magnesium glycinate"
      />

      <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.35rem', fontSize: '0.9rem' }}>Allergies</label>
      <textarea
        value={allergies}
        onChange={(e) => setAllergies(e.target.value)}
        rows={2}
        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: '1rem', fontSize: '0.9rem' }}
        placeholder="e.g. latex, penicillin"
      />

      <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.35rem', fontSize: '0.9rem' }}>Freeform notes (cycle length, symptoms, app exports)</label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: '1rem', fontSize: '0.9rem' }}
        placeholder="Anything else Ayna should weigh when ranking products for you."
      />

      <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.35rem', fontSize: '0.9rem' }}>Wearable &amp; activity summary (optional)</label>
      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', lineHeight: 1.5 }}>
        Paste averages or trends from Apple Health, Google Fit, Oura, Garmin, etc. (e.g. sleep 6.5h/night, 7k steps, resting HR 62). Used with your quiz and chat to tune recommendations. Stays in this browser.
      </p>
      <textarea
        value={wearableText}
        onChange={(e) => setWearableText(e.target.value)}
        rows={3}
        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: '1rem', fontSize: '0.9rem' }}
        placeholder="e.g. Last 30 days: avg sleep 6h20m; cycle app predicts period ±2 days; walking 8k steps/day."
      />

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" className="btn btn-primary" onClick={() => persist()}>
          Save to this browser
        </button>
        {savedAt && (
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Last saved {new Date(savedAt).toLocaleString()}
          </span>
        )}
      </div>
      <Disclaimer compact style={{ marginTop: '1rem' }} />
    </div>
  );
}
