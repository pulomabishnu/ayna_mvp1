import React, { useMemo, useState } from 'react';
import {
  CONCERN_AREAS,
  CYCLE_STATUSES,
  CYCLE_SYMPTOMS,
  DIAGNOSED_CONDITIONS,
  FLOW_LEVELS,
  GOALS,
  PREFERRED_PRODUCT_TYPES,
  PRODUCT_PREFERENCES,
  mapIntakeToLegacyQuizProfile,
  validateHealthIntake,
} from '../utils/healthIntake';
import { saveHealthIntakeForCurrentUser } from '../utils/healthIntakeStore';

const baseIntake = {
  age: '',
  location: '',
  primaryConcern: '',
  menstrualCycle: '',
  averageCycleLength: '',
  averagePeriodLength: '',
  flowLevel: '',
  painLevel: '',
  symptoms: [],
  conditions: [],
  tryingToConceive: '',
  hormonalBirthControl: '',
  hormonalBirthControlType: '',
  productPreferences: [],
  preferredProductTypes: [],
  currentProductsText: '',
  dislikedProductsText: '',
  dislikedReason: '',
  goals: [],
};

function toggle(arr, value) {
  if (arr.includes(value)) return arr.filter((x) => x !== value);
  return [...arr, value];
}

function parseCsvLike(value) {
  return String(value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function HealthIntakeForm({ onComplete }) {
  const [intake, setIntake] = useState(baseIntake);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const normalizedIntake = useMemo(() => {
    const currentProducts = parseCsvLike(intake.currentProductsText);
    const dislikedProducts = parseCsvLike(intake.dislikedProductsText);
    return { ...intake, currentProducts, dislikedProducts };
  }, [intake]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = validateHealthIntake(normalizedIntake);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSaving(true);
    setSaveMessage('');
    try {
      const saveResult = await saveHealthIntakeForCurrentUser(normalizedIntake);
      if (!saveResult.saved) {
        setSaveMessage('Profile completed. Sign in with Supabase auth to persist this profile to your account.');
      } else {
        setSaveMessage('Profile saved to your Supabase account.');
      }
    } catch (_error) {
      setSaveMessage('Profile completed, but we could not save to Supabase right now.');
    } finally {
      setSaving(false);
      onComplete(mapIntakeToLegacyQuizProfile(normalizedIntake));
    }
  };

  return (
    <section className="container animate-fade-in-up" style={{ padding: 'var(--spacing-xl) var(--spacing-md)', maxWidth: '860px' }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', textAlign: 'center' }}>Health intake form</h2>
      <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
        Required fields: age and primary concern.
      </p>
      <form onSubmit={handleSubmit} className="card" style={{ display: 'grid', gap: '1rem' }}>
        <h3>BASIC INFO</h3>
        <label>Age *
          <input value={intake.age} onChange={(e) => setIntake((p) => ({ ...p, age: e.target.value }))} placeholder="e.g. 29" />
        </label>
        {errors.age && <p style={{ color: '#b42318', margin: 0 }}>{errors.age}</p>}
        <label>Location (optional, for telehealth availability)
          <input value={intake.location} onChange={(e) => setIntake((p) => ({ ...p, location: e.target.value }))} />
        </label>
        <label>Primary concern *
          <select value={intake.primaryConcern} onChange={(e) => setIntake((p) => ({ ...p, primaryConcern: e.target.value }))}>
            <option value="">Select one</option>
            {CONCERN_AREAS.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </label>
        {errors.primaryConcern && <p style={{ color: '#b42318', margin: 0 }}>{errors.primaryConcern}</p>}

        <h3>CYCLE</h3>
        <label>Do you have a menstrual cycle?
          <select value={intake.menstrualCycle} onChange={(e) => setIntake((p) => ({ ...p, menstrualCycle: e.target.value }))}>
            <option value="">Select one</option>
            {CYCLE_STATUSES.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </label>
        <label>Average cycle length <input value={intake.averageCycleLength} onChange={(e) => setIntake((p) => ({ ...p, averageCycleLength: e.target.value }))} /></label>
        <label>Average period length <input value={intake.averagePeriodLength} onChange={(e) => setIntake((p) => ({ ...p, averagePeriodLength: e.target.value }))} /></label>
        <label>Flow level
          <select value={intake.flowLevel} onChange={(e) => setIntake((p) => ({ ...p, flowLevel: e.target.value }))}>
            <option value="">Select one</option>
            {FLOW_LEVELS.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </label>
        <label>Pain level during period (1-10)
          <input type="number" min="1" max="10" value={intake.painLevel} onChange={(e) => setIntake((p) => ({ ...p, painLevel: e.target.value }))} />
        </label>
        <div>
          <div>Symptoms</div>
          {CYCLE_SYMPTOMS.map((v) => (
            <label key={v} style={{ display: 'block' }}>
              <input type="checkbox" checked={intake.symptoms.includes(v)} onChange={() => setIntake((p) => ({ ...p, symptoms: toggle(p.symptoms, v) }))} /> {v}
            </label>
          ))}
        </div>

        <h3>CONDITIONS</h3>
        <div>
          <div>Diagnosed conditions</div>
          {DIAGNOSED_CONDITIONS.map((v) => (
            <label key={v} style={{ display: 'block' }}>
              <input type="checkbox" checked={intake.conditions.includes(v)} onChange={() => setIntake((p) => ({ ...p, conditions: toggle(p.conditions, v) }))} /> {v}
            </label>
          ))}
        </div>
        <label>Are you currently trying to conceive?
          <select value={intake.tryingToConceive} onChange={(e) => setIntake((p) => ({ ...p, tryingToConceive: e.target.value }))}>
            <option value="">Select one</option>
            <option value="yes">yes</option>
            <option value="no">no</option>
            <option value="not sure">not sure</option>
          </select>
        </label>
        <label>Are you on hormonal birth control?
          <select value={intake.hormonalBirthControl} onChange={(e) => setIntake((p) => ({ ...p, hormonalBirthControl: e.target.value }))}>
            <option value="">Select one</option>
            <option value="yes">yes</option>
            <option value="no">no</option>
          </select>
        </label>
        {intake.hormonalBirthControl === 'yes' && (
          <label>Birth control type
            <input value={intake.hormonalBirthControlType} onChange={(e) => setIntake((p) => ({ ...p, hormonalBirthControlType: e.target.value }))} />
          </label>
        )}

        <h3>PREFERENCES</h3>
        <div>
          <div>Product preferences</div>
          {PRODUCT_PREFERENCES.map((v) => (
            <label key={v} style={{ display: 'block' }}>
              <input type="checkbox" checked={intake.productPreferences.includes(v)} onChange={() => setIntake((p) => ({ ...p, productPreferences: toggle(p.productPreferences, v) }))} /> {v}
            </label>
          ))}
        </div>
        <div>
          <div>Preferred product types</div>
          {PREFERRED_PRODUCT_TYPES.map((v) => (
            <label key={v} style={{ display: 'block' }}>
              <input type="checkbox" checked={intake.preferredProductTypes.includes(v)} onChange={() => setIntake((p) => ({ ...p, preferredProductTypes: toggle(p.preferredProductTypes, v) }))} /> {v}
            </label>
          ))}
        </div>
        <label>Products you currently use (comma-separated)
          <input value={intake.currentProductsText} onChange={(e) => setIntake((p) => ({ ...p, currentProductsText: e.target.value }))} placeholder="Always pads, Midol, Flo app" />
        </label>
        <label>Products you have tried and disliked (comma-separated)
          <input value={intake.dislikedProductsText} onChange={(e) => setIntake((p) => ({ ...p, dislikedProductsText: e.target.value }))} />
        </label>
        <label>Why didn&apos;t it work?
          <textarea value={intake.dislikedReason} onChange={(e) => setIntake((p) => ({ ...p, dislikedReason: e.target.value }))} />
        </label>

        <h3>GOALS</h3>
        <div>
          <div>What are you hoping Ayna helps you with?</div>
          {GOALS.map((v) => (
            <label key={v} style={{ display: 'block' }}>
              <input type="checkbox" checked={intake.goals.includes(v)} onChange={() => setIntake((p) => ({ ...p, goals: toggle(p.goals, v) }))} /> {v}
            </label>
          ))}
        </div>

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Build My Recommendations'}
        </button>
        {saveMessage && <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>{saveMessage}</p>}
      </form>
    </section>
  );
}
