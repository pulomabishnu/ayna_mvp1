import React, { useState } from 'react';
import { loadHealthProfile, saveHealthProfile, parseFhirBundleText } from '../utils/healthDataProfile.js';
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
    <div id="health-data-import" className="hdi">
      <h3 className="hdi-h">Health data import</h3>
      {/* P1-12: the point first, the full notice (every word kept) one tap below. */}
      <p className="hdi-sum">Raw files are read in this browser and not uploaded. We never sell health data.</p>
      <details className="hdi-full">
        <summary>How what you add is used</summary>
        <p>
          Connect EHR exports, manual conditions, and wearable summaries so your ecosystem ranking matches what you share with your care team. Raw Apple Health and FHIR files are parsed locally in this browser and are not uploaded. The summaries and health details you choose to save may be used by ayna and its AI providers when you request personalized AI features. We never sell health data.
        </p>
      </details>

      <div className="hdi-sources">
        <div className="hdi-card">
          <p className="hdi-card__t">Apple Health</p>
          <p className="hdi-card__p">
            ayna doesn’t have a phone app, so we can’t read Apple Health directly off your device. Instead: open the <strong>Health app → your profile picture (top right) → Export All Health Data</strong>, then unzip the download to find <strong>export.xml</strong> and upload it below. We parse steps, sleep, heart rate, and cycle tracking data locally in your browser. The raw file is not sent to our servers.
          </p>
          <label className="hdi-file">
            <span className="ay-btn ay-btn--secondary">Choose export.xml</span>
            <input type="file" accept=".xml,text/xml,application/xml" onChange={handleAppleHealthFile} className="sr-only" />
          </label>
          {appleHealthError && <p className="hdi-err" role="alert">{appleHealthError}</p>}
          {appleHealthSummary && !appleHealthError && (
            <p className="hdi-ok" role="status">Parsed and saved below. {appleHealthSummary}</p>
          )}
        </div>
        <div className="hdi-card">
          <p className="hdi-card__t">Google Fit &amp; other apps</p>
          <label className="hdi-check">
            <input type="checkbox" checked={googleFit} onChange={(e) => setGoogleFit(e.target.checked)} />
            I use Google Fit, Apple Watch, Oura, or similar. I’ll paste a short summary below (sleep, steps, cycle estimates).
          </label>
        </div>
        <div className="hdi-card">
          <p className="hdi-card__t">Electronic health record (FHIR)</p>
          <p className="hdi-card__p">
            Many Epic / MyChart portals offer a <strong>Download my data</strong> export as a FHIR JSON bundle. Upload it here. We parse conditions and medication statements locally in your browser; the raw file is not sent to our servers.
          </p>
          <label className="hdi-file">
            <span className="ay-btn ay-btn--secondary">Choose FHIR JSON file</span>
            <input type="file" accept=".json,application/json" onChange={handleFhirFile} className="sr-only" />
          </label>
          {fhirError && <p className="hdi-err" role="alert">{fhirError}</p>}
          {fhirConnected && !fhirError && (
            <p className="hdi-ok" role="status">FHIR summary saved. It can improve ranking and may be included as context when you request personalized AI features.</p>
          )}
        </div>
      </div>

      <label className="hdi-label">Conditions (one per line or comma-separated)</label>
      <textarea
        value={conditions}
        onChange={(e) => setConditions(e.target.value)}
        rows={3}
        className="hdi-input"
        placeholder="e.g. endometriosis, iron deficiency anemia"
      />

      <label className="hdi-label">Medications &amp; supplements</label>
      <textarea
        value={medications}
        onChange={(e) => setMedications(e.target.value)}
        rows={3}
        className="hdi-input"
        placeholder="e.g. levothyroxine 50 mcg, magnesium glycinate"
      />

      <label className="hdi-label">Allergies</label>
      <textarea
        value={allergies}
        onChange={(e) => setAllergies(e.target.value)}
        rows={2}
        className="hdi-input"
        placeholder="e.g. latex, penicillin"
      />

      <label className="hdi-label">Freeform notes (cycle length, symptoms, app exports)</label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        className="hdi-input"
        placeholder="Anything else ayna should weigh when ranking products for you."
      />

      <label className="hdi-label">Wearable &amp; activity summary (optional)</label>
      <p className="hdi-card__p">
        Paste averages or trends from Apple Health, Google Fit, Oura, Garmin, etc. (e.g. sleep 6.5h/night, 7k steps, resting HR 62). Used with your quiz and chat to tune recommendations. The summary is saved locally and may be sent with your request when a personalized AI feature needs that context.
      </p>
      <textarea
        value={wearableText}
        onChange={(e) => setWearableText(e.target.value)}
        rows={3}
        className="hdi-input"
        placeholder="e.g. Last 30 days: avg sleep 6h20m; cycle app predicts period ±2 days; walking 8k steps/day."
      />

      <div className="hdi-actions">
        <button type="button" className="ay-btn ay-btn--primary" onClick={() => persist()}>
          Save to this browser
        </button>
        {savedAt && (
          <span className="hdi-card__p">
            Last saved {new Date(savedAt).toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
}
