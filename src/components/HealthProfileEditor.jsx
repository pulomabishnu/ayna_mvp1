import React, { useMemo, useState } from 'react';
import {
  CONCERN_AREAS,
  mapIntakeToLegacyQuizProfile,
  validateHealthIntake,
} from '../utils/healthIntake';
import { saveHealthIntakeForCurrentUser } from '../utils/healthIntakeStore';

const BASE_INTAKE = {
  age: '',
  location: '',
  primaryConcerns: [],
  customConcernsText: '',
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
  conditionOtherText: '',
  goals: [],
  concernFollowups: {},
};

function toCsv(list) {
  return Array.isArray(list) ? list.filter(Boolean).join(', ') : '';
}

function fromCsv(value) {
  return String(value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildInitial(profile) {
  const src = profile?.fullHealthIntake && typeof profile.fullHealthIntake === 'object'
    ? profile.fullHealthIntake
    : {};
  return {
    ...BASE_INTAKE,
    ...src,
    primaryConcerns: Array.isArray(src.primaryConcerns) ? src.primaryConcerns : [],
    symptomsText: toCsv(src.symptoms),
    conditionsText: toCsv(src.conditions),
    goalsText: toCsv(src.goals),
    productPreferencesText: toCsv(src.productPreferences),
    preferredProductTypesText: toCsv(src.preferredProductTypes),
    currentProductsText: src.currentProductsText || toCsv(src.currentProducts),
    dislikedProductsText: src.dislikedProductsText || toCsv(src.dislikedProducts),
    customConcernsText: src.customConcernsText || toCsv(src.customConcerns),
  };
}

export default function HealthProfileEditor({ currentProfile, onSave, onCancel }) {
  const [draft, setDraft] = useState(() => buildInitial(currentProfile));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const concernSet = useMemo(() => new Set(draft.primaryConcerns || []), [draft.primaryConcerns]);

  const setField = (key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: null }));
    }
  };

  const toggleConcern = (concern) => {
    setDraft((prev) => {
      const next = new Set(Array.isArray(prev.primaryConcerns) ? prev.primaryConcerns : []);
      if (next.has(concern)) next.delete(concern);
      else next.add(concern);
      return { ...prev, primaryConcerns: Array.from(next) };
    });
    if (errors.primaryConcerns) {
      setErrors((prev) => ({ ...prev, primaryConcerns: null }));
    }
  };

  const handleSave = async () => {
    const normalized = {
      ...draft,
      primaryConcerns: Array.isArray(draft.primaryConcerns) ? draft.primaryConcerns : [],
      customConcerns: fromCsv(draft.customConcernsText),
      symptoms: fromCsv(draft.symptomsText),
      conditions: fromCsv(draft.conditionsText),
      goals: fromCsv(draft.goalsText),
      productPreferences: fromCsv(draft.productPreferencesText),
      preferredProductTypes: fromCsv(draft.preferredProductTypesText),
      currentProducts: fromCsv(draft.currentProductsText),
      dislikedProducts: fromCsv(draft.dislikedProductsText),
      personalizationCompleted: true,
      personalizationCompletedAt: new Date().toISOString(),
    };

    const nextErrors = validateHealthIntake(normalized);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setSaveMessage('');
    try {
      const saveResult = await saveHealthIntakeForCurrentUser(normalized);
      if (!saveResult.saved) {
        setSaveMessage('Saved locally. Sign in to sync this profile.');
      } else {
        setSaveMessage('Profile updated.');
      }
      onSave?.(mapIntakeToLegacyQuizProfile(normalized));
    } catch {
      setSaveMessage('Profile updated locally, but cloud save failed.');
      onSave?.(mapIntakeToLegacyQuizProfile(normalized));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="container animate-fade-in-up" style={{ padding: 'var(--spacing-xl) var(--spacing-md)', maxWidth: '920px' }}>
      <div className="card" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.45rem' }}>Update Health Profile</h2>
          <button type="button" className="btn btn-outline" onClick={onCancel}>
            Back to Ecosystem
          </button>
        </div>
        <p style={{ marginTop: 0, color: 'var(--color-text-muted)' }}>
          Edit your saved intake directly without stepping through quiz screens.
        </p>

        <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span>Age</span>
            <input value={draft.age || ''} onChange={(e) => setField('age', e.target.value)} />
            {errors.age && <span style={{ color: '#b42318', fontSize: '0.8rem' }}>{errors.age}</span>}
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span>Location</span>
            <input value={draft.location || ''} onChange={(e) => setField('location', e.target.value)} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span>Menstrual cycle</span>
            <input value={draft.menstrualCycle || ''} onChange={(e) => setField('menstrualCycle', e.target.value)} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span>Flow level</span>
            <input value={draft.flowLevel || ''} onChange={(e) => setField('flowLevel', e.target.value)} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span>Pain level (1-10)</span>
            <input value={draft.painLevel || ''} onChange={(e) => setField('painLevel', e.target.value)} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span>Trying to conceive</span>
            <input value={draft.tryingToConceive || ''} onChange={(e) => setField('tryingToConceive', e.target.value)} />
          </label>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <div style={{ fontWeight: 600, marginBottom: '0.35rem' }}>Primary concerns</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {CONCERN_AREAS.map((concern) => {
              const selected = concernSet.has(concern);
              return (
                <button
                  key={concern}
                  type="button"
                  onClick={() => toggleConcern(concern)}
                  style={{
                    border: `1px solid ${selected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    background: selected ? 'var(--color-secondary-fade)' : 'var(--color-surface-soft)',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '0.8rem',
                    padding: '0.35rem 0.7rem',
                    cursor: 'pointer',
                  }}
                >
                  {selected ? '✓ ' : ''}{concern}
                </button>
              );
            })}
          </div>
          {errors.primaryConcerns && <p style={{ color: '#b42318', fontSize: '0.8rem', marginBottom: 0 }}>{errors.primaryConcerns}</p>}
        </div>

        <div style={{ display: 'grid', gap: '0.7rem', marginTop: '1rem' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span>Additional concerns (comma separated)</span>
            <textarea rows={2} value={draft.customConcernsText || ''} onChange={(e) => setField('customConcernsText', e.target.value)} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span>Symptoms (comma separated)</span>
            <textarea rows={2} value={draft.symptomsText || ''} onChange={(e) => setField('symptomsText', e.target.value)} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span>Diagnosed conditions (comma separated)</span>
            <textarea rows={2} value={draft.conditionsText || ''} onChange={(e) => setField('conditionsText', e.target.value)} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span>Goals (comma separated)</span>
            <textarea rows={2} value={draft.goalsText || ''} onChange={(e) => setField('goalsText', e.target.value)} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span>Product preferences (comma separated)</span>
            <textarea rows={2} value={draft.productPreferencesText || ''} onChange={(e) => setField('productPreferencesText', e.target.value)} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span>Preferred product types (comma separated)</span>
            <textarea rows={2} value={draft.preferredProductTypesText || ''} onChange={(e) => setField('preferredProductTypesText', e.target.value)} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span>Current products (comma separated)</span>
            <textarea rows={2} value={draft.currentProductsText || ''} onChange={(e) => setField('currentProductsText', e.target.value)} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span>Disliked products (comma separated)</span>
            <textarea rows={2} value={draft.dislikedProductsText || ''} onChange={(e) => setField('dislikedProductsText', e.target.value)} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span>Why they did not work</span>
            <textarea rows={2} value={draft.dislikedReason || ''} onChange={(e) => setField('dislikedReason', e.target.value)} />
          </label>
        </div>

        {saveMessage && <p style={{ marginTop: '0.75rem', color: 'var(--color-text-muted)' }}>{saveMessage}</p>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
          <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save profile updates'}
          </button>
        </div>
      </div>
    </section>
  );
}
