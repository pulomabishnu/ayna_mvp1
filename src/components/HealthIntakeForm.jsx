import React, { useMemo, useRef, useState } from 'react';
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
  primaryConcerns: [],
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

const AUTO_ADVANCE_MS = 450;

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
  const [currentStep, setCurrentStep] = useState(0);
  const timerRef = useRef(null);

  const steps = useMemo(() => {
    const all = [
      { id: 'age', question: 'How old are you?', subtitle: 'Required', type: 'input', required: true, inputMode: 'number', placeholder: 'e.g. 29' },
      { id: 'location', question: 'Where are you located?', subtitle: 'Optional, used for telehealth availability', type: 'input', placeholder: 'City, State or ZIP' },
      { id: 'primaryConcerns', question: 'What are your top concerns right now?', subtitle: 'Required. Select all that apply.', type: 'multi', required: true, options: CONCERN_AREAS },
      { id: 'menstrualCycle', question: 'Do you have a menstrual cycle?', type: 'single', options: CYCLE_STATUSES },
      { id: 'averageCycleLength', question: 'Average cycle length', subtitle: 'Optional', type: 'input', placeholder: 'e.g. 28 days' },
      { id: 'averagePeriodLength', question: 'Average period length', subtitle: 'Optional', type: 'input', placeholder: 'e.g. 5 days' },
      { id: 'flowLevel', question: 'Flow level', type: 'single', options: FLOW_LEVELS },
      { id: 'painLevel', question: 'Pain level during period (1-10)', type: 'single', options: ['1','2','3','4','5','6','7','8','9','10'] },
      { id: 'symptoms', question: 'Symptoms', subtitle: 'Select all that apply', type: 'multi', options: CYCLE_SYMPTOMS },
      { id: 'conditions', question: 'Diagnosed conditions', subtitle: 'Select all that apply', type: 'multi', options: DIAGNOSED_CONDITIONS },
      { id: 'tryingToConceive', question: 'Are you currently trying to conceive?', type: 'single', options: ['yes', 'no', 'not sure'] },
      { id: 'hormonalBirthControl', question: 'Are you on hormonal birth control?', type: 'single', options: ['yes', 'no'] },
      { id: 'productPreferences', question: 'Product preferences', subtitle: 'Select all that apply', type: 'multi', options: PRODUCT_PREFERENCES },
      { id: 'preferredProductTypes', question: 'Preferred product types', subtitle: 'Select all that apply', type: 'multi', options: PREFERRED_PRODUCT_TYPES },
      { id: 'currentProductsText', question: 'Products you currently use', subtitle: 'Optional, comma-separated', type: 'input', placeholder: 'Always pads, Midol, Flo app' },
      { id: 'dislikedProductsText', question: 'Products you tried and disliked', subtitle: 'Optional, comma-separated', type: 'input', placeholder: 'Brand/product names' },
      { id: 'dislikedReason', question: "Why didn't it work?", subtitle: 'Optional', type: 'input', placeholder: 'Brief reason' },
      { id: 'goals', question: 'What are you hoping Ayna helps you with?', subtitle: 'Select all that apply', type: 'multi', options: GOALS },
    ];
    if (intake.hormonalBirthControl === 'yes') {
      all.splice(12, 0, { id: 'hormonalBirthControlType', question: 'If yes, what type?', type: 'input', placeholder: 'e.g. pill, IUD' });
    }
    return all;
  }, [intake.hormonalBirthControl]);

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const normalizedIntake = useMemo(() => {
    const currentProducts = parseCsvLike(intake.currentProductsText);
    const dislikedProducts = parseCsvLike(intake.dislikedProductsText);
    return { ...intake, currentProducts, dislikedProducts };
  }, [intake]);

  const finish = async () => {
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

  const [multiSelections, setMultiSelections] = useState(new Set());
  const [inputValue, setInputValue] = useState('');

  const updateValue = (id, value) => {
    setIntake((p) => ({ ...p, [id]: value }));
    if (errors[id]) setErrors((p) => ({ ...p, [id]: null }));
  };

  const goNext = async (nextIntake = intake) => {
    const value = nextIntake[step.id];
    const isEmpty = Array.isArray(value) ? value.length === 0 : !String(value || '').trim();
    if (step.required && isEmpty) {
      setErrors((p) => ({ ...p, [step.id]: `${step.question} is required.` }));
      return;
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
      return;
    }
    await finish();
  };

  const onSinglePick = (value) => {
    updateValue(step.id, value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      goNext();
    }, AUTO_ADVANCE_MS);
  };
  const handleInputConfirm = () => {
    const nextValue = inputValue.trim();
    const nextIntake = { ...intake, [step.id]: nextValue };
    setIntake(nextIntake);
    if (errors[step.id]) setErrors((p) => ({ ...p, [step.id]: null }));
    goNext(nextIntake);
  };

  const handleMultiToggle = (option) => {
    setMultiSelections((prev) => {
      const next = new Set(prev);
      if (next.has(option)) next.delete(option);
      else next.add(option);
      return next;
    });
  };

  const handleMultiConfirm = () => {
    const nextValue = Array.from(multiSelections);
    const nextIntake = { ...intake, [step.id]: nextValue };
    setIntake(nextIntake);
    if (errors[step.id]) setErrors((p) => ({ ...p, [step.id]: null }));
    setMultiSelections(new Set());
    goNext(nextIntake);
  };

  const handleBack = () => {
    if (currentStep <= 0) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setCurrentStep((s) => s - 1);
  };

  React.useEffect(() => {
    if (!step) return;
    if (step.type === 'multi') {
      setMultiSelections(new Set(Array.isArray(intake[step.id]) ? intake[step.id] : []));
      setInputValue('');
    } else if (step.type === 'input') {
      setInputValue(String(intake[step.id] || ''));
    } else {
      setMultiSelections(new Set());
      setInputValue('');
    }
  }, [currentStep, step?.id, step?.type, intake]);

  return (
    <section className="container animate-fade-in-up" style={{ padding: 'var(--spacing-xl) var(--spacing-md)', maxWidth: '820px' }}>
      <div style={{ width: '100%', background: 'var(--color-border)', height: '6px', borderRadius: 'var(--radius-pill)', marginBottom: 'var(--spacing-lg)', overflow: 'hidden' }}>
        <div style={{ width: `${progress}%`, height: '100%', background: 'var(--color-primary)', transition: 'width 0.35s ease' }} />
      </div>
      <div className="card" style={{ minHeight: '430px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h2 style={{ textAlign: 'center', fontSize: '1.7rem', marginBottom: '0.5rem' }}>{step.question}</h2>
        {step.subtitle && (
          <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-md)' }}>
            {step.subtitle}
          </p>
        )}
        {errors[step.id] && <p style={{ color: '#b42318', textAlign: 'center' }}>{errors[step.id]}</p>}

        {step.type === 'single' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {step.options.map((opt) => {
              const selected = intake[step.id] === opt;
              return (
                <button
                  type="button"
                  key={opt}
                  className="btn btn-outline"
                  onClick={() => onSinglePick(opt)}
                  style={{ justifyContent: 'flex-start', padding: '1rem 1.4rem', fontSize: '1rem', borderColor: selected ? 'var(--color-primary)' : 'var(--color-border)', backgroundColor: selected ? 'var(--color-secondary-fade)' : 'transparent' }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {step.type === 'input' && (
          <div style={{ maxWidth: '500px', margin: '0 auto', width: '100%' }}>
            <input
              type={step.inputMode === 'number' ? 'number' : 'text'}
              value={inputValue}
              placeholder={step.placeholder || ''}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleInputConfirm();
                }
              }}
              style={{ width: '100%', padding: '0.9rem 1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)' }}
            />
          </div>
        )}

        {step.type === 'multi' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {step.options.map((opt) => {
              const selected = multiSelections.has(opt);
              return (
                <button
                  type="button"
                  key={opt}
                  className="btn btn-outline"
                  onClick={() => handleMultiToggle(opt)}
                  style={{ justifyContent: 'flex-start', padding: '0.95rem 1.25rem', fontSize: '1rem', borderColor: selected ? 'var(--color-primary)' : 'var(--color-border)', backgroundColor: selected ? 'var(--color-secondary-fade)' : 'transparent' }}
                >
                  <span style={{ marginRight: '0.55rem' }}>{selected ? '✓' : '○'}</span> {opt}
                </button>
              );
            })}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', marginTop: '1.4rem', alignItems: 'center' }}>
          <button type="button" onClick={handleBack} style={{ visibility: currentStep === 0 ? 'hidden' : 'visible', border: 'none', background: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600 }}>
            ← Back
          </button>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{currentStep + 1} of {steps.length}</p>
          {step.type === 'multi' && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleMultiConfirm}
              disabled={step.required ? multiSelections.size === 0 : false}
            >
              Continue →
            </button>
          )}
          {step.type === 'input' && (
            <button type="button" className="btn btn-primary" onClick={handleInputConfirm} disabled={saving || (step.required && !String(inputValue || '').trim())}>
              {currentStep === steps.length - 1 ? (saving ? 'Saving...' : 'Build My Recommendations') : 'Continue →'}
            </button>
          )}
          {step.type === 'single' && <span style={{ width: 90 }} />}
        </div>
        {saveMessage && <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>{saveMessage}</p>}
      </div>
    </section>
  );
}
