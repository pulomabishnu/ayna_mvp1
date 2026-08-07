import React, { useState, useMemo } from 'react';
import {
  CONCERN_AREAS,
  CYCLE_SYMPTOMS,
  DIAGNOSED_CONDITIONS,
  GOALS,
  PRODUCT_PREFERENCES,
  INSURANCE_TYPES,
  FSA_HSA_OPTIONS,
  OTHER_CONCERN_OPTION,
  mapIntakeToLegacyQuizProfile,
} from '../utils/healthIntake';
import { saveHealthIntakeForCurrentUser } from '../utils/healthIntakeStore';
import { ALL_PRODUCTS } from '../data/products';

// ─── Condensed symptom list (top clinical signals) ───────────────────────────
const KEY_SYMPTOMS = [
  'Cramps', 'Severe cramps', 'Bloating', 'Mood changes', 'Anxiety before period',
  'Depression before period', 'Fatigue', 'Brain fog', 'Headaches', 'Migraines',
  'Clots', 'Spotting between periods', 'Back pain', 'Nausea', 'Insomnia before period',
  'Breast tenderness',
];

const FLOW_OPTIONS = ['Light', 'Medium', 'Heavy', 'Very heavy'];
const CYCLE_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'irregular', label: 'Irregular' },
  { value: 'irregular_perimenopause', label: 'Irregular (Perimenopause)' },
  { value: 'no_menopause', label: 'No (Menopause)' },
];

const FAMILY_HISTORY_OPTIONS = [
  'PCOS', 'Endometriosis', 'Thyroid disorder', 'Uterine fibroids',
  'Premature ovarian insufficiency', 'BRCA1/BRCA2', 'Osteoporosis', 'None of the above',
];
const SYMPTOM_DURATION_OPTIONS = [
  { value: 'new', label: 'New (< 6 months)' },
  { value: 'ongoing', label: 'Ongoing (6 mo – 2 yrs)' },
  { value: 'chronic', label: 'Chronic (2+ years)' },
];
const LAST_OBGYN_OPTIONS = [
  { value: 'within_year', label: 'Within the past year' },
  { value: '1_3_years', label: '1–3 years ago' },
  { value: 'over_3_years', label: 'More than 3 years ago' },
  { value: 'never', label: 'Never' },
];
const TTC_OPTIONS = ['Yes', 'No', 'Not right now'];
const BC_OPTIONS = ['Yes', 'No'];

const SCREEN_ORDER = ['basics', 'concerns', 'period', 'health', 'products', 'healthdata'];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScreenHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.45rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '0.35rem', lineHeight: 1.25 }}>
        {title}
      </h2>
      {subtitle && <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{subtitle}</p>}
    </div>
  );
}

function FieldLabel({ children, optional }) {
  return (
    <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '0.6rem', marginTop: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
      {children}
      {optional && <span style={{ fontWeight: 400, textTransform: 'none', color: 'var(--color-text-muted)', marginLeft: '0.4rem' }}>optional</span>}
    </p>
  );
}

function Chip({ label, selected, onClick, small }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: small ? '0.35rem 0.8rem' : '0.45rem 1rem',
        borderRadius: 'var(--radius-pill)',
        border: selected ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
        background: selected ? 'var(--color-secondary-fade)' : 'var(--color-surface)',
        color: selected ? 'var(--color-primary)' : 'var(--color-text-main)',
        cursor: 'pointer',
        fontSize: small ? '0.8rem' : '0.86rem',
        fontWeight: selected ? 700 : 400,
        fontFamily: 'var(--font-body)',
        transition: 'border-color 0.15s, background 0.15s',
        textAlign: 'left',
        lineHeight: 1.3,
      }}
    >
      {label}
    </button>
  );
}

function ChipGrid({ items, selected = [], onToggle, small }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
      {items.map((item) => (
        <Chip key={item} label={item} selected={selected.includes(item)} onClick={() => onToggle(item)} small={small} />
      ))}
    </div>
  );
}

function SingleSelect({ options, value, onSelect }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
      {options.map((opt) => {
        const v = typeof opt === 'object' ? opt.value : opt;
        const label = typeof opt === 'object' ? opt.label : opt;
        return (
          <Chip key={v} label={label} selected={value === v} onClick={() => onSelect(v)} />
        );
      })}
    </div>
  );
}

function PainScale({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(String(n))}
          style={{
            width: '2.4rem', height: '2.4rem', borderRadius: '50%',
            border: value === String(n) ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
            background: value === String(n) ? 'var(--color-primary)' : 'var(--color-surface)',
            color: value === String(n) ? '#fff' : 'var(--color-text-main)',
            fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {n}
        </button>
      ))}
      <span style={{ alignSelf: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: '0.25rem' }}>
        {value ? (Number(value) <= 3 ? '(mild)' : Number(value) <= 6 ? '(moderate)' : '(severe)') : ''}
      </span>
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%', padding: '0.7rem 1rem', fontSize: '0.92rem',
        border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
        background: 'var(--color-surface-soft)', color: 'var(--color-text-main)',
        fontFamily: 'var(--font-body)', outline: 'none',
      }}
    />
  );
}

function ProductSearchPicker({ selected = [], onAdd, onRemove, placeholder }) {
  const [query, setQuery] = useState('');

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return ALL_PRODUCTS
      .filter((p) => p.name && p.name.toLowerCase().includes(q) && !selected.includes(p.name))
      .slice(0, 6);
  }, [query, selected]);

  const addAndClear = (name) => {
    const trimmed = String(name || '').trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setQuery('');
  };

  return (
    <div>
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.6rem' }}>
          {selected.map((name) => (
            <span key={name} style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              background: 'var(--color-secondary-fade)', color: 'var(--color-primary)',
              padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-pill)',
              fontSize: '0.82rem', fontWeight: 700,
            }}>
              {name}
              <button
                type="button"
                onClick={() => onRemove(name)}
                aria-label={`Remove ${name}`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '0.95rem', lineHeight: 1, padding: 0 }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            addAndClear(suggestions[0]?.name || query);
          }
        }}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '0.7rem 1rem', fontSize: '0.92rem',
          border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
          background: 'var(--color-surface-soft)', color: 'var(--color-text-main)',
          fontFamily: 'var(--font-body)', outline: 'none',
        }}
      />
      {suggestions.length > 0 && (
        <div style={{ marginTop: '0.4rem', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
          {suggestions.map((p, idx) => (
            <button
              key={p.id}
              type="button"
              onClick={() => addAndClear(p.name)}
              style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '0.6rem 0.85rem',
                background: 'var(--color-surface)', border: 'none',
                borderTop: idx === 0 ? 'none' : '1px solid var(--color-border)',
                cursor: 'pointer', fontSize: '0.88rem', color: 'var(--color-text-main)', fontFamily: 'var(--font-body)',
              }}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}
      {query.trim().length >= 2 && suggestions.length === 0 && (
        <button
          type="button"
          onClick={() => addAndClear(query)}
          style={{
            marginTop: '0.4rem', background: 'none', border: 'none', padding: 0,
            color: 'var(--color-primary)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
            fontFamily: 'var(--font-body)', textDecoration: 'underline',
          }}
        >
          Add "{query.trim()}" anyway
        </button>
      )}
    </div>
  );
}

function TextArea({ value, onChange, placeholder, rows = 4 }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: '100%', padding: '0.7rem 1rem', fontSize: '0.88rem',
        border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
        background: 'var(--color-surface-soft)', color: 'var(--color-text-main)',
        fontFamily: 'var(--font-body)', outline: 'none', resize: 'vertical', lineHeight: 1.55,
      }}
    />
  );
}

function ContinueButton({ onClick, disabled, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        marginTop: '1.75rem', width: '100%', padding: '0.85rem',
        background: disabled ? 'var(--color-border)' : 'var(--color-primary)',
        color: disabled ? 'var(--color-text-muted)' : '#fff',
        border: 'none', borderRadius: 'var(--radius-sm)', cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '0.95rem', fontWeight: 700, fontFamily: 'var(--font-body)',
        transition: 'background 0.15s',
      }}
    >
      {children}
    </button>
  );
}

function SkipLink({ onClick, label = 'Skip this step →' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        marginTop: '0.75rem', width: '100%', background: 'none', border: 'none',
        color: 'var(--color-text-muted)', fontSize: '0.82rem', cursor: 'pointer',
        textDecoration: 'underline', fontFamily: 'var(--font-body)',
      }}
    >
      {label}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const emptyIntake = {
  age: '',
  location: '',
  zipcode: '',
  primaryConcerns: [],
  customConcernsText: '',
  menstrualCycle: '',
  flowLevel: '',
  painLevel: '',
  symptoms: [],
  symptomDuration: '',
  conditions: [],
  conditionOtherText: '',
  familyHistory: [],
  currentMedications: '',
  lastObgynVisit: '',
  insurancePlan: '',
  insuranceType: '',
  fsaHsa: '',
  tryingToConceive: '',
  hormonalBirthControl: '',
  hormonalBirthControlType: '',
  productPreferences: [],
  preferredProductTypes: [],
  currentProducts: [],
  dislikedProductsText: '',
  dislikedReason: '',
  goals: [],
  goalsOtherText: '',
  healthDataText: '',
};

export default function HealthIntakeForm({ onComplete }) {
  const [intake, setIntake] = useState(emptyIntake);
  const [screenId, setScreenId] = useState('basics');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const hasPeriod = intake.menstrualCycle !== 'no' && intake.menstrualCycle !== 'no_menopause';

  const screens = SCREEN_ORDER.filter((s) => {
    if (s === 'period' && !hasPeriod && intake.menstrualCycle !== '') return false;
    return true;
  });

  const currentIndex = screens.indexOf(screenId);
  const total = screens.length;
  const progressPct = Math.round(((currentIndex + 1) / total) * 100);

  const set = (field, value) => setIntake((prev) => ({ ...prev, [field]: value }));
  const toggle = (field, value) => setIntake((prev) => {
    const arr = prev[field] || [];
    return { ...prev, [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] };
  });

  const goNext = () => {
    if (currentIndex < screens.length - 1) {
      setScreenId(screens[currentIndex + 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleFinish();
    }
  };

  const goBack = () => {
    if (currentIndex > 0) {
      setScreenId(screens[currentIndex - 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    const snapshot = {
      ...intake,
      dislikedProducts: intake.dislikedProductsText ? intake.dislikedProductsText.split(',').map((s) => s.trim()).filter(Boolean) : [],
      customConcerns: intake.customConcernsText ? intake.customConcernsText.split(',').map((s) => s.trim()).filter(Boolean) : [],
      concernFollowups: {},
      ...(intake.healthDataText ? { wearableSummary: { text: intake.healthDataText } } : {}),
      personalizationCompleted: true,
      personalizationCompletedAt: new Date().toISOString(),
    };
    // A silent `catch (_) {}` here meant a signed-in user could complete the
    // entire ~20-question intake, have the upsert fail (expired token, RLS,
    // network), and be taken straight to her ecosystem as if it had saved —
    // because the LLM builds from the in-memory copy. On her next visit
    // quizResults is null and she is asked to retake the whole thing.
    // saveHealthIntakeForCurrentUser also RETURNS {saved:false} without throwing
    // when there is no session, which was discarded too.
    try {
      const result = await saveHealthIntakeForCurrentUser(snapshot);
      if (result && result.saved === false && result.reason !== 'no_authenticated_user') {
        throw new Error(result.reason || 'save_failed');
      }
    } catch (e) {
      console.error('[Ayna] intake save failed:', e);
      setSaving(false);
      setSaveError(
        "We couldn't save your profile just now. Your answers are still here — check your connection and tap Finish again."
      );
      return;
    }
    setSaveError('');
    setSaving(false);
    onComplete(mapIntakeToLegacyQuizProfile(snapshot));
  };

  const isLastScreen = currentIndex === screens.length - 1;
  const isHealthDataScreen = screenId === 'healthdata';

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 1rem 4rem' }}>
      <div style={{ width: '100%', maxWidth: '560px' }}>

        {/* Progress bar */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            {currentIndex > 0 && (
              <button type="button" onClick={goBack} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '0.82rem', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-body)' }}>
                ← Back
              </button>
            )}
            <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
              {currentIndex + 1} of {total}
            </span>
          </div>
          <div style={{ height: '4px', background: 'var(--color-border)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progressPct}%`, background: 'var(--color-primary)', borderRadius: 'var(--radius-pill)', transition: 'width 0.3s ease' }} />
          </div>
        </div>

        {/* Screen: basics */}
        {screenId === 'basics' && (
          <div>
            <ScreenHeader title="Let's build your ecosystem." subtitle="A few quick questions — takes about 20 seconds." />
            <FieldLabel>How old are you?</FieldLabel>
            <TextInput type="number" value={intake.age} onChange={(v) => set('age', v)} placeholder="e.g. 28" />
            <FieldLabel optional>Where are you based?</FieldLabel>
            <TextInput value={intake.location} onChange={(v) => set('location', v)} placeholder="e.g. New York, NY" />
            <FieldLabel optional>ZIP code</FieldLabel>
            <TextInput
              value={intake.zipcode}
              onChange={(v) => set('zipcode', v.replace(/\D/g, '').slice(0, 5))}
              placeholder="e.g. 10001"
            />
            <ContinueButton onClick={goNext} disabled={!intake.age.trim()}>Continue →</ContinueButton>
          </div>
        )}

        {/* Screen: concerns */}
        {screenId === 'concerns' && (
          <div>
            <ScreenHeader title="What do you most want support with?" subtitle="Pick everything that applies — this shapes every recommendation Ayna makes for you." />
            <ChipGrid
              items={CONCERN_AREAS.filter((c) => c !== OTHER_CONCERN_OPTION)}
              selected={intake.primaryConcerns}
              onToggle={(v) => toggle('primaryConcerns', v)}
            />
            {intake.primaryConcerns.includes(OTHER_CONCERN_OPTION) && (
              <div style={{ marginTop: '0.75rem' }}>
                <TextInput value={intake.customConcernsText} onChange={(v) => set('customConcernsText', v)} placeholder="Describe your concern..." />
              </div>
            )}

            <FieldLabel>Do you have a menstrual cycle?</FieldLabel>
            <SingleSelect options={CYCLE_OPTIONS} value={intake.menstrualCycle} onSelect={(v) => set('menstrualCycle', v)} />

            <FieldLabel optional>Goals — what are you hoping Ayna helps you with?</FieldLabel>
            <ChipGrid items={GOALS} selected={intake.goals} onToggle={(v) => toggle('goals', v)} small />
            <div style={{ marginTop: '0.75rem' }}>
              <TextInput value={intake.goalsOtherText} onChange={(v) => set('goalsOtherText', v)} placeholder="Anything else you're looking for? (optional)" />
            </div>

            <ContinueButton onClick={goNext} disabled={!intake.primaryConcerns.length || !intake.menstrualCycle}>
              Continue →
            </ContinueButton>
          </div>
        )}

        {/* Screen: period */}
        {screenId === 'period' && (
          <div>
            <ScreenHeader title="Tell us about your period." subtitle="All on one screen — about 30 seconds." />

            <FieldLabel>How heavy is your flow?</FieldLabel>
            <SingleSelect options={FLOW_OPTIONS} value={intake.flowLevel} onSelect={(v) => set('flowLevel', v)} />

            <FieldLabel>Period pain level</FieldLabel>
            <PainScale value={intake.painLevel} onChange={(v) => set('painLevel', v)} />
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.35rem' }}>1 = no pain &nbsp;·&nbsp; 10 = debilitating</p>

            <FieldLabel optional>What you've been experiencing (pick all that apply)</FieldLabel>
            <ChipGrid items={KEY_SYMPTOMS} selected={intake.symptoms} onToggle={(v) => toggle('symptoms', v)} small />

            <ContinueButton onClick={goNext}>Continue →</ContinueButton>
          </div>
        )}

        {/* Screen: health */}
        {screenId === 'health' && (
          <div>
            <ScreenHeader title="Your health history." subtitle="The more context you give, the more personalized Ayna's recommendations." />

            <FieldLabel optional>Diagnosed conditions</FieldLabel>
            <ChipGrid
              items={DIAGNOSED_CONDITIONS.filter((c) => c !== 'other' && c !== 'none')}
              selected={intake.conditions}
              onToggle={(v) => toggle('conditions', v)}
              small
            />
            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Chip label="None" selected={intake.conditions.includes('none')} onClick={() => set('conditions', ['none'])} small />
              <Chip label="Other" selected={intake.conditions.includes('other')} onClick={() => toggle('conditions', 'other')} small />
            </div>
            {intake.conditions.includes('other') && (
              <div style={{ marginTop: '0.6rem' }}>
                <TextInput value={intake.conditionOtherText} onChange={(v) => set('conditionOtherText', v)} placeholder="Describe your condition..." />
              </div>
            )}

            <FieldLabel optional>Family history — any of these in close relatives?</FieldLabel>
            <ChipGrid items={FAMILY_HISTORY_OPTIONS} selected={intake.familyHistory} onToggle={(v) => toggle('familyHistory', v)} small />

            <FieldLabel optional>How long have you been dealing with this?</FieldLabel>
            <SingleSelect options={SYMPTOM_DURATION_OPTIONS} value={intake.symptomDuration} onSelect={(v) => set('symptomDuration', v)} />

            <FieldLabel optional>Current medications or supplements</FieldLabel>
            <TextInput value={intake.currentMedications} onChange={(v) => set('currentMedications', v)} placeholder="e.g. metformin, levothyroxine, vitamin D, fish oil…" />

            <FieldLabel optional>Last OB/GYN visit</FieldLabel>
            <SingleSelect options={LAST_OBGYN_OPTIONS} value={intake.lastObgynVisit} onSelect={(v) => set('lastObgynVisit', v)} />

            <FieldLabel optional>Are you trying to conceive?</FieldLabel>
            <SingleSelect options={TTC_OPTIONS} value={intake.tryingToConceive} onSelect={(v) => set('tryingToConceive', v)} />

            <FieldLabel optional>Hormonal birth control?</FieldLabel>
            <SingleSelect options={BC_OPTIONS} value={intake.hormonalBirthControl} onSelect={(v) => set('hormonalBirthControl', v)} />
            {intake.hormonalBirthControl === 'Yes' && (
              <div style={{ marginTop: '0.6rem' }}>
                <TextInput value={intake.hormonalBirthControlType} onChange={(v) => set('hormonalBirthControlType', v)} placeholder="e.g. Mirena IUD, combination pill, patch…" />
              </div>
            )}

            <FieldLabel optional>Insurance type</FieldLabel>
            <select
              value={intake.insuranceType || ''}
              onChange={e => set('insuranceType', e.target.value)}
              style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.95rem', background: 'var(--color-surface)', color: 'var(--color-text-main)' }}
            >
              <option value=''>Select insurance type…</option>
              {INSURANCE_TYPES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <TextInput value={intake.insurancePlan} onChange={(v) => set('insurancePlan', v)} placeholder="Insurance provider name (e.g. Aetna, Blue Cross, United)" style={{ marginTop: '0.5rem' }} />
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.3rem' }}>Used to show realistic out-of-pocket costs for telehealth recommendations.</p>

            <FieldLabel optional>FSA / HSA account</FieldLabel>
            <select
              value={intake.fsaHsa || ''}
              onChange={e => set('fsaHsa', e.target.value)}
              style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.95rem', background: 'var(--color-surface)', color: 'var(--color-text-main)' }}
            >
              <option value=''>Select…</option>
              {FSA_HSA_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.3rem' }}>FSA/HSA-eligible products show your effective pre-tax price.</p>

            <ContinueButton onClick={goNext}>Continue →</ContinueButton>
          </div>
        )}

        {/* Screen: products */}
        {screenId === 'products' && (
          <div>
            <ScreenHeader title="What matters to you in products?" subtitle="Ayna uses this to filter recommendations and flag ingredient concerns." />

            <FieldLabel optional>What do you currently use?</FieldLabel>
            <ProductSearchPicker
              selected={intake.currentProducts}
              onAdd={(name) => toggle('currentProducts', name)}
              onRemove={(name) => toggle('currentProducts', name)}
              placeholder="Search products (e.g. Diva Cup, Always Infinity, Flo app)..."
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.35rem' }}>
              We'll avoid recommending things you already have.
            </p>

            <FieldLabel optional>Ingredient & material preferences</FieldLabel>
            <ChipGrid items={PRODUCT_PREFERENCES} selected={intake.productPreferences} onToggle={(v) => toggle('productPreferences', v)} small />

            <FieldLabel optional>What have you tried that didn't work?</FieldLabel>
            <TextInput
              value={intake.dislikedProductsText}
              onChange={(v) => set('dislikedProductsText', v)}
              placeholder="e.g. Always pads, Diva Cup, spearmint tea…"
            />

            <FieldLabel optional>Why didn't it work?</FieldLabel>
            <TextInput
              value={intake.dislikedReason}
              onChange={(v) => set('dislikedReason', v)}
              placeholder="e.g. caused a rash, too expensive, leaked, uncomfortable…"
            />

            <ContinueButton onClick={goNext}>Continue →</ContinueButton>
          </div>
        )}

        {/* Screen: healthdata */}
        {screenId === 'healthdata' && (
          <div>
            <ScreenHeader
              title="Got health app data?"
              subtitle="Optional — but it helps Claude give you dramatically better recommendations."
            />

            <div style={{ padding: '1rem 1.25rem', background: 'var(--color-secondary-fade)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', borderLeft: '3px solid var(--color-primary)' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-main)', lineHeight: 1.6, margin: 0 }}>
                Paste any summary from <strong>Apple Health, Oura, Whoop, Fitbit, Clue, Flo, PCOS Diary</strong>, or any wearable.
                Or just describe in plain English: <em>"My Oura shows I average 5h 40m sleep, resting HR 68, HRV 22. Clue shows 35-day cycles."</em>
              </p>
            </div>

            <TextArea
              value={intake.healthDataText}
              onChange={(v) => set('healthDataText', v)}
              placeholder="Paste your health data or describe it here… (lab results, cycle app summaries, wearable stats, anything relevant)"
              rows={5}
            />

            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', lineHeight: 1.4 }}>
              Your data is stored securely and never shared or sold. It's used only to personalize your ecosystem.
            </p>

            {saveError && (
              <p role="alert" style={{ color: '#B91C1C', fontSize: '0.85rem', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                {saveError}
              </p>
            )}
            <ContinueButton onClick={goNext} disabled={saving}>
              {saving ? 'Building your ecosystem…' : 'Build my ecosystem →'}
            </ContinueButton>
            <SkipLink onClick={goNext} label={saving ? '' : 'Skip — build my ecosystem without health data →'} />
          </div>
        )}

      </div>
    </div>
  );
}
