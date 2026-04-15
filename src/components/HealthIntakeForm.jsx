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
  OTHER_CONCERN_OPTION,
  mapIntakeToLegacyQuizProfile,
  validateHealthIntake,
} from '../utils/healthIntake';
import { saveHealthIntakeForCurrentUser } from '../utils/healthIntakeStore';

const baseIntake = {
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
};

const AUTO_ADVANCE_MS = 450;
const NONE_OPTION = 'None';
const GENERIC_OTHER_OPTION = 'Other (type your own)';
const CONCERN_FOLLOWUP_DEFAULT_HISTORY_OPTIONS = ['first time', 'occasional', 'recurring for 6+ months', 'recurring for 1+ year', 'not sure'];
const CONCERN_FOLLOWUP_CONFIG = {
  'UTI support': {
    symptoms: ['burning urination', 'frequent urination', 'urgency', 'pelvic pressure', 'odor changes', 'recurring after sex'],
    historyQuestion: 'How often have your UTI symptoms happened recently?',
  },
  'PCOS management (supplements, telehealth, apps)': {
    symptoms: ['irregular periods', 'acne', 'hair thinning', 'facial hair growth', 'weight changes', 'insulin resistance concerns'],
    historyQuestion: 'How long have PCOS symptoms been affecting you?',
  },
  'Endometriosis management (supplements, devices, telehealth)': {
    symptoms: ['severe period pain', 'pain between periods', 'pain with sex', 'pain with bowel movements', 'fatigue', 'nausea'],
    historyQuestion: 'How long have these endometriosis-related symptoms been present?',
  },
  'Period care (pads, tampons, cups, discs, underwear)': {
    symptoms: ['leaks/staining', 'comfort issues', 'odor concerns', 'skin irritation', 'overnight protection issues', 'fit/sizing issues'],
    historyQuestion: 'How long have period product issues been a concern?',
  },
  'Cramp and pain relief (devices, supplements, heat)': {
    symptoms: ['cramps', 'lower back pain', 'radiating leg pain', 'nausea', 'headaches', 'missed work/school from pain'],
    historyQuestion: 'How frequently do these pain symptoms impact you?',
  },
  'Fertility and conception (supplements, trackers, telehealth)': {
    symptoms: ['irregular ovulation signs', 'short luteal phase concerns', 'difficulty timing intercourse', 'pregnancy loss history concern', 'age-related concern', 'stress around TTC'],
    historyQuestion: 'How long have you been trying or planning to conceive?',
  },
  'STI support': {
    symptoms: ['discharge changes', 'pelvic discomfort', 'burning', 'itching', 'odor changes', 'concern after unprotected sex'],
    historyQuestion: 'How recent are these STI-related concerns?',
  },
  'Gut and vaginal health (probiotics, pH balance)': {
    symptoms: ['recurrent BV/yeast symptoms', 'bloating', 'constipation', 'pH imbalance concern', 'odor changes', 'sensitivity to products'],
    historyQuestion: 'How long have gut/vaginal health symptoms been recurring?',
  },
  'Perimenopause and menopause support': {
    symptoms: ['hot flashes', 'night sweats', 'sleep disruption', 'vaginal dryness', 'mood changes', 'brain fog'],
    historyQuestion: 'How long have menopause-related symptoms affected you?',
  },
  'Sexual health and comfort (lubricants, pelvic floor)': {
    symptoms: ['pain with intercourse', 'dryness', 'low libido', 'pelvic tightness', 'post-sex irritation', 'anxiety around intimacy'],
    historyQuestion: 'How long have sexual comfort concerns been present?',
  },
  'Mental health and cycle mood support': {
    symptoms: ['anxiety', 'low mood', 'irritability', 'mood swings before period', 'panic symptoms', 'sleep-related mood impact'],
    historyQuestion: 'How frequently do mood symptoms interfere with daily life?',
  },
  'Sleep and energy': {
    symptoms: ['trouble falling asleep', 'night waking', 'morning fatigue', 'daytime crashes', 'brain fog', 'low stamina'],
    historyQuestion: 'How long have sleep/energy symptoms been affecting you?',
  },
  'Skin and hair (hormone-related)': {
    symptoms: ['hormonal acne', 'hair shedding', 'scalp oil changes', 'dry skin', 'chin/jawline breakouts', 'cycle-linked flare-ups'],
    historyQuestion: 'How long have skin/hair symptoms been recurring?',
  },
  'Telehealth and provider matching': {
    symptoms: ['hard to find specialist', 'long wait times', 'cost concerns', 'not feeling heard by providers', 'need second opinion', 'care coordination issues'],
    historyQuestion: 'How long have provider access issues been affecting your care?',
  },
  'Hormone balance (supplements, lifestyle)': {
    symptoms: ['cycle irregularity', 'bloating', 'mood swings', 'sleep disruption', 'acne', 'energy crashes'],
    historyQuestion: 'How long have hormone-related symptoms been recurring?',
  },
};

const OTHER_TEXT_BY_STEP = {
  primaryConcerns: {
    option: OTHER_CONCERN_OPTION,
    field: 'customConcernsText',
    label: 'Type your other concern(s)',
    placeholder: 'e.g. breast tenderness, migraines before period',
  },
  conditions: {
    option: 'other',
    field: 'conditionOtherText',
    label: 'Type your other diagnosed condition',
    placeholder: 'e.g. PMDD, chronic pelvic inflammatory disease',
  },
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

function concernSlug(concern) {
  return String(concern || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function extractConcernFollowups(intakeObj = {}) {
  const out = {};
  Object.entries(intakeObj).forEach(([k, v]) => {
    if (!k.startsWith('cf__')) return;
    const parts = k.split('__');
    if (parts.length < 3) return;
    const slug = parts[1];
    const type = parts[2];
    if (!out[slug]) out[slug] = {};
    out[slug][type] = v;
  });
  Object.entries(intakeObj).forEach(([k, v]) => {
    if (!k.startsWith('otherText__cf__')) return;
    const rest = k.replace('otherText__', '');
    const parts = rest.split('__');
    if (parts.length < 3) return;
    const slug = parts[1];
    const type = parts[2];
    if (!out[slug]) out[slug] = {};
    out[slug][`${type}OtherText`] = String(v || '').trim();
  });
  return out;
}

function withNoneAndOther(options = [], { includeNone = true, includeOther = true } = {}) {
  const out = [...options];
  if (includeNone && !out.includes(NONE_OPTION)) out.push(NONE_OPTION);
  if (includeOther && !out.includes(GENERIC_OTHER_OPTION)) out.push(GENERIC_OTHER_OPTION);
  return out;
}

export default function HealthIntakeForm({ onComplete }) {
  const [intake, setIntake] = useState(baseIntake);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const timerRef = useRef(null);

  const steps = useMemo(() => {
    const concernOptions = [...CONCERN_AREAS, OTHER_CONCERN_OPTION];
    const concernFollowupSteps = (Array.isArray(intake.primaryConcerns) ? intake.primaryConcerns : [])
      .filter((c) => c && c !== OTHER_CONCERN_OPTION)
      .flatMap((concern) => {
        const cfg = CONCERN_FOLLOWUP_CONFIG[concern] || {
          symptoms: ['pain', 'discomfort', 'irregularity', 'daily impact', 'cost burden', 'product side effects'],
          historyQuestion: `How long have ${concern.toLowerCase()} symptoms been affecting you?`,
        };
        const slug = concernSlug(concern);
        return [
          {
            id: `cf__${slug}__symptoms`,
            question: `${concern}: which symptoms/issues are most relevant for you?`,
            subtitle: 'Select all that apply',
            type: 'multi',
            options: withNoneAndOther(cfg.symptoms),
          },
          {
            id: `cf__${slug}__history`,
            question: cfg.historyQuestion,
            subtitle: 'Helps us prioritize recommendations for your symptom history',
            type: 'single',
            options: CONCERN_FOLLOWUP_DEFAULT_HISTORY_OPTIONS,
          },
        ];
      });
    const all = [
      { id: 'age', question: 'How old are you?', subtitle: 'Required', type: 'input', required: true, inputMode: 'number', placeholder: 'e.g. 29' },
      { id: 'location', question: 'Where are you located?', subtitle: 'Optional, used for telehealth availability', type: 'input', placeholder: 'City, State or ZIP' },
      { id: 'primaryConcerns', question: 'What are your top concerns right now?', subtitle: 'Required. Select all that apply.', type: 'multi', required: true, options: concernOptions },
      ...concernFollowupSteps,
      { id: 'menstrualCycle', question: 'Do you have a menstrual cycle?', type: 'single', options: CYCLE_STATUSES },
      { id: 'averageCycleLength', question: 'Average cycle length', subtitle: 'Optional', type: 'input', placeholder: 'e.g. 28 days' },
      { id: 'averagePeriodLength', question: 'Average period length', subtitle: 'Optional', type: 'input', placeholder: 'e.g. 5 days' },
      { id: 'flowLevel', question: 'Flow level', type: 'single', options: [...FLOW_LEVELS, 'not sure / not applicable'] },
      { id: 'painLevel', question: 'Pain level during period (1-10)', type: 'single', options: ['1','2','3','4','5','6','7','8','9','10', 'not sure / not applicable'] },
      { id: 'symptoms', question: 'Symptoms', subtitle: 'Select all that apply', type: 'multi', options: withNoneAndOther(CYCLE_SYMPTOMS) },
      { id: 'conditions', question: 'Diagnosed conditions', subtitle: 'Select all that apply', type: 'multi', options: DIAGNOSED_CONDITIONS },
      { id: 'tryingToConceive', question: 'Are you currently trying to conceive?', type: 'single', options: ['yes', 'no', 'not sure'] },
      { id: 'hormonalBirthControl', question: 'Are you on hormonal birth control?', type: 'single', options: ['yes', 'no', 'not sure'] },
      { id: 'productPreferences', question: 'Product preferences', subtitle: 'Select all that apply', type: 'multi', options: withNoneAndOther(PRODUCT_PREFERENCES) },
      { id: 'preferredProductTypes', question: 'Preferred product types', subtitle: 'Select all that apply', type: 'multi', options: withNoneAndOther(PREFERRED_PRODUCT_TYPES) },
      { id: 'currentProductsText', question: 'Products you currently use', subtitle: 'Optional, comma-separated', type: 'input', placeholder: 'Always pads, Midol, Flo app' },
      { id: 'dislikedProductsText', question: 'Products you tried and disliked', subtitle: 'Optional, comma-separated', type: 'input', placeholder: 'Brand/product names' },
      { id: 'dislikedReason', question: "Why didn't it work?", subtitle: 'Optional', type: 'input', placeholder: 'Brief reason' },
      { id: 'goals', question: 'What are you hoping Ayna helps you with?', subtitle: 'Select all that apply', type: 'multi', options: withNoneAndOther(GOALS) },
    ];
    if (intake.hormonalBirthControl === 'yes') {
      all.splice(12, 0, { id: 'hormonalBirthControlType', question: 'If yes, what type?', type: 'input', placeholder: 'e.g. pill, IUD' });
    }
    return all;
  }, [intake.hormonalBirthControl, intake.primaryConcerns]);

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const normalizedIntake = useMemo(() => {
    const currentProducts = parseCsvLike(intake.currentProductsText);
    const dislikedProducts = parseCsvLike(intake.dislikedProductsText);
    const customConcerns = parseCsvLike(intake.customConcernsText);
    const concernFollowups = extractConcernFollowups(intake);
    return { ...intake, currentProducts, dislikedProducts, customConcerns, concernFollowups };
  }, [intake]);

  const finish = async (intakeSnapshot = normalizedIntake) => {
    const nextErrors = validateHealthIntake(intakeSnapshot);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSaving(true);
    setSaveMessage('');
    try {
      const saveResult = await saveHealthIntakeForCurrentUser(intakeSnapshot);
      if (!saveResult.saved) {
        setSaveMessage('Profile completed. Sign in with Supabase auth to persist this profile to your account.');
      } else {
        setSaveMessage('Profile saved to your Supabase account.');
      }
    } catch (_error) {
      setSaveMessage('Profile completed, but we could not save to Supabase right now.');
    } finally {
      setSaving(false);
      onComplete(mapIntakeToLegacyQuizProfile(intakeSnapshot));
    }
  };

  const [multiSelections, setMultiSelections] = useState(new Set());
  const [inputValue, setInputValue] = useState('');
  const stepOtherCfg = useMemo(() => {
    if (!step?.id || step?.type !== 'multi') return null;
    if (OTHER_TEXT_BY_STEP[step.id]) return OTHER_TEXT_BY_STEP[step.id];
    return {
      option: GENERIC_OTHER_OPTION,
      field: `otherText__${step.id}`,
      label: 'Type your other answer',
      placeholder: 'Type your answer',
    };
  }, [step?.id, step?.type]);

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
    await finish(nextIntake);
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
      const selectingNone = option === NONE_OPTION;
      if (next.has(option)) {
        next.delete(option);
      } else {
        if (selectingNone) {
          next.clear();
          next.add(NONE_OPTION);
        } else {
          next.delete(NONE_OPTION);
          next.add(option);
        }
      }
      return next;
    });
  };

  const handleMultiConfirm = () => {
    const nextValue = Array.from(multiSelections);
    const needsOther = !!stepOtherCfg && nextValue.includes(stepOtherCfg.option);
    const nextIntake = {
      ...intake,
      [step.id]: nextValue,
      ...(stepOtherCfg ? { [stepOtherCfg.field]: needsOther ? intake[stepOtherCfg.field] : '' } : {}),
    };
    setIntake(nextIntake);
    if (errors[step.id]) setErrors((p) => ({ ...p, [step.id]: null }));
    if (stepOtherCfg && !needsOther && errors[stepOtherCfg.field]) {
      setErrors((p) => ({ ...p, [stepOtherCfg.field]: null }));
    }
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
  }, [currentStep, step?.id, step?.type]);

  return (
    <section className="container animate-fade-in-up" style={{ padding: 'var(--spacing-xl) var(--spacing-md)', maxWidth: '820px' }}>
      <div style={{ width: '100%', background: 'var(--color-border)', height: '6px', borderRadius: 'var(--radius-pill)', marginBottom: 'var(--spacing-lg)', overflow: 'hidden' }}>
        <div style={{ width: `${progress}%`, height: '100%', background: 'var(--color-primary)', transition: 'width 0.35s ease' }} />
      </div>
      <div className="card" style={{ minHeight: '430px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center' }}>
          <button type="button" onClick={handleBack} style={{ visibility: currentStep === 0 ? 'hidden' : 'visible', border: 'none', background: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600 }}>
            ← Back
          </button>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{currentStep + 1} of {steps.length}</p>
          {step.type === 'multi' && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleMultiConfirm}
              disabled={
                step.required
                  ? (
                    multiSelections.size === 0 ||
                    (stepOtherCfg &&
                      multiSelections.has(stepOtherCfg.option) &&
                      !String(intake[stepOtherCfg.field] || '').trim())
                  )
                  : false
              }
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
            {stepOtherCfg && multiSelections.has(stepOtherCfg.option) && (
              <div style={{ marginTop: '0.25rem', padding: '0.85rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-soft)' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-text-main)', marginBottom: '0.45rem', fontWeight: 600 }}>
                  {stepOtherCfg.label}
                </label>
                <input
                  type="text"
                  value={intake[stepOtherCfg.field] || ''}
                  placeholder={stepOtherCfg.placeholder}
                  onChange={(e) => updateValue(stepOtherCfg.field, e.target.value)}
                  style={{ width: '100%', padding: '0.8rem 0.95rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)' }}
                />
                {errors[stepOtherCfg.field] && (
                  <p style={{ color: '#b42318', fontSize: '0.85rem', marginTop: '0.45rem', marginBottom: 0 }}>
                    {errors[stepOtherCfg.field]}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {saveMessage && <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>{saveMessage}</p>}
      </div>
    </section>
  );
}
