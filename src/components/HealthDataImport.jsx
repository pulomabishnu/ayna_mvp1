import React, { useState } from 'react';
import Disclaimer from './Disclaimer';
import { loadHealthProfile, saveHealthProfile, parseFhirBundleText } from '../utils/healthDataProfile';

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

  const persist = (patch = {}) => {
    const existing = loadHealthProfile();
    const mergedFhir = patch.fhirSummary !== undefined ? patch.fhirSummary : (existing?.fhirSummary || { conditions: [], medications: [] });
    const saved = saveHealthProfile({
      conditions: parseCommaLines(conditions),
      medications: parseCommaLines(medications),
      allergies: parseCommaLines(allergies),
      notes,
      wearableSummary: { text: wearableText.trim() },
      sources: {
        appleHealth,
        googleFit,
        fhir: fhirConnected || (mergedFhir.conditions?.length > 0 || mergedFhir.medications?.length > 0),
        manual:
          parseCommaLines(conditions).length > 0 ||
          parseCommaLines(medications).length > 0 ||
          !!notes.trim() ||
          !!wearableText.trim(),
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
    <div style={{ maxWidth: '800px', margin: '0 auto 3rem', padding: '1.5rem', background: 'var(--color-surface-soft)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
      <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Health data import</h3>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: 1.55, marginBottom: '1.25rem' }}>
        Connect EHR exports, manual conditions, and wearable summaries so your ecosystem ranking matches what you share with your care team. Data stays in this browser unless you choose to sync (premium). We never sell health data.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Apple Health</p>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
            <input type="checkbox" checked={appleHealth} onChange={(e) => setAppleHealth(e.target.checked)} />
            I export summaries from Apple Health (Health app → Profile → Export) and will paste key facts below or attach when Ayna mobile supports files.
          </label>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', marginBottom: 0 }}>
            On the web we cannot read Apple Health directly; use export + notes, or FHIR if your provider offers it.
          </p>
        </div>
        <div style={{ padding: '1rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Google Fit &amp; other apps</p>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
            <input type="checkbox" checked={googleFit} onChange={(e) => setGoogleFit(e.target.checked)} />
            I use Google Fit, Apple Watch, Oura, or similar — I’ll paste a short summary below (sleep, steps, cycle estimates).
          </label>
        </div>
        <div style={{ padding: '1rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Electronic health record (FHIR)</p>
          <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
            Many Epic / MyChart portals offer &quot;Download my data&quot; as a FHIR JSON bundle. Upload it here — we parse conditions and medication statements locally in your browser; the file is not sent to our servers.
          </p>
          <label style={{ fontSize: '0.9rem', cursor: 'pointer', display: 'inline-block' }}>
            <span className="btn btn-outline" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}>Choose FHIR JSON file</span>
            <input type="file" accept=".json,application/json" onChange={handleFhirFile} style={{ display: 'none' }} />
          </label>
          {fhirError && <p style={{ color: '#b91c1c', fontSize: '0.85rem', marginTop: '0.5rem' }}>{fhirError}</p>}
          {fhirConnected && !fhirError && (
            <p style={{ fontSize: '0.85rem', color: 'var(--color-primary)', marginTop: '0.5rem' }}>FHIR summary saved — used only to improve ranking on top of your quiz.</p>
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
        Paste averages or trends from Apple Health, Google Fit, Oura, Garmin, etc. (e.g. sleep 6.5h/night, 7k steps, resting HR 62). Used with your quiz and chat to tune recommendations — stays in this browser.
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
