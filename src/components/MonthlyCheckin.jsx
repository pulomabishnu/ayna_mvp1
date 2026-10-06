import React, { useEffect, useMemo, useState } from 'react';
import { findGlossaryTermInText } from '../data/glossary';
import { useEscapeToClose } from '../utils/useEscapeToClose';
import { toProductList } from '../utils/shopperInsights';
import {
  guestCheckinDoneThisMonth,
  loadMonthlyCheckinStatus,
  monthKey,
  monthLabel,
  saveMonthlyCheckin,
} from '../utils/monthlyCheckinStore';
import {
  PRODUCT_VERDICTS,
  ROUTINE_GREAT,
  SAFETY_OPTIONS,
  SCREENING_FOCUS,
  buildCheckinAnswers,
  buildInitialCheckinState,
  computeCheckinSteps,
  hasPrefill,
  summarizeVerdicts,
} from '../utils/monthlyCheckinFlow';

/**
 * Monthly check-in. Signed-in accounts save to Supabase
 * (supabase/monthly_checkins.sql via monthlyCheckinStore.js): last month
 * prefills this one, and a month that's already done shows its summary
 * instead of the wizard. Guests (signed out or community guest sessions)
 * keep the older browser-only behavior: App.jsx's onComplete stores
 * `ayna_checkin_completed_at`, which is also how "already done" is detected.
 *
 * Props (unchanged contract, new ones optional):
 *   onComplete(answers), onClose(), currentProfile, onProfileUpdate(profile)
 *   myProducts  optional id → product of the ecosystem, for per-product verdicts
 */

// Map check-in focus options → quiz frustrations (for getRecommendations)
const FOCUS_TO_FRUSTRATION = {
  'Heavier flow': 'Heavy flow',
  'More cramps': 'Painful cramps',
  'More bloating': 'Hormonal bloating',
  'Irregular cycles': 'Irregular cycles',
  'UTIs': 'Recurrent UTIs',
  'Mood or sleep': null, // tip only
  'Skin irritation': null,
  'Different period product': null,
  'Different supplement': null,
  'Different app': null,
  [SCREENING_FOCUS]: null,
};

// Map focus → newSymptoms for Screenings component
const FOCUS_TO_SYMPTOM = {
  'Heavier flow': 'Heavier flow',
  'More cramps': 'Increased cramps',
  'More bloating': 'Bloating',
  'Irregular cycles': 'Irregular timing',
  'UTIs': 'UTI',
  'Mood or sleep': 'Mood changes',
  'Skin irritation': 'Skin irritation',
};

const ROUTINE_OPTIONS = [
  ROUTINE_GREAT,
  'Okay, could be better',
  'New symptoms or frustrations',
  'I want to switch some products',
];

const FOCUS_OPTIONS = [
  'Heavier flow',
  'More cramps',
  'More bloating',
  'Irregular cycles',
  'UTIs',
  'Mood or sleep',
  'Skin irritation',
  'Different period product',
  'Different supplement',
  'Different app',
  SCREENING_FOCUS,
];

const STEP_COPY = {
  routine: { question: "How's your current routine working?" },
  products: { question: 'How did each product do this month?', subtitle: 'Skip any you didn’t use. This is the answer that shapes your matches most.' },
  focus: { question: 'What should we focus on this month?', subtitle: 'Pick everything that fits. We’ll update your recommendations' },
  screening: { question: 'Quick screening info', subtitle: 'Helps us remind you when care is due' },
  safety: { question: 'Any new, worsening or significant symptoms right now?', subtitle: 'One question, every month, for the things that shouldn’t wait.' },
};

const WARN = '#9A3520';
const WARN_BG = 'rgba(180, 64, 42, 0.07)';

const overlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem',
};
const panelStyle = { maxWidth: '520px', width: '100%', maxHeight: 'min(90vh, 680px)', display: 'flex', flexDirection: 'column', padding: 'clamp(1.1rem, 4vw, 2rem)', boxSizing: 'border-box' };
const scrollStyle = { display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', minHeight: 0, marginBottom: '1rem' };
const selectStyle = { width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '1rem', background: '#fff' };
const labelStyle = { fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.35rem' };

function optionStyle(selected, tone) {
  const warn = tone === 'warning' && selected;
  return {
    justifyContent: 'flex-start',
    textAlign: 'left',
    padding: '0.85rem 1.1rem',
    fontSize: '0.95rem',
    flexShrink: 0,
    whiteSpace: 'normal',
    borderColor: selected ? (warn ? WARN : 'var(--color-navy)') : 'var(--color-border)',
    backgroundColor: selected ? (warn ? WARN_BG : 'var(--color-secondary-fade)') : 'transparent',
  };
}

function Shell({ onClose, children, label = 'Monthly check-in' }) {
  return (
    <div style={overlayStyle} onClick={onClose}>
      <div
        className="card animate-fade-in-up"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        style={panelStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function VerdictRow({ product, value, onChange }) {
  return (
    <div style={{ padding: '0.7rem 0', borderTop: '1px solid var(--color-border)', minWidth: 0 }}>
      <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--color-navy)', marginBottom: '0.45rem', overflowWrap: 'anywhere' }}>{product.name}</div>
      <div role="group" aria-label={`How ${product.name} did`} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
        {PRODUCT_VERDICTS.map(([v, label]) => {
          const on = value === v;
          const warn = v === 'worse';
          return (
            <button
              key={v}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? null : v)}
              style={{
                minHeight: 34,
                padding: '0.35rem 0.8rem',
                borderRadius: 'var(--radius-pill)',
                border: `1px solid ${on ? (warn ? WARN : 'var(--color-navy)') : 'var(--color-border)'}`,
                background: on ? (warn ? WARN : 'var(--color-navy)') : 'transparent',
                color: on ? '#fff' : 'var(--color-text-main)',
                font: '500 0.8rem var(--font-body)',
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ClinicianNote() {
  return (
    <div style={{ marginTop: '0.25rem', padding: '1rem', borderRadius: 'var(--radius-md)', background: WARN_BG, border: `1px solid ${WARN}` }}>
      <p style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: WARN }}>Please talk to a clinician</p>
      <p style={{ margin: '0.4rem 0 0', fontSize: '0.88rem', lineHeight: 1.5, color: 'var(--color-text-main)' }}>
        ayna is a discovery tool, not a diagnosis. We’ll keep your check-in, but nothing here should replace being seen,
        especially for something new or getting worse. If it feels like an emergency, call 911.
      </p>
      <a
        href="https://www.google.com/maps/search/?api=1&query=urgent+care+near+me"
        target="_blank"
        rel="noreferrer"
        className="btn btn-outline"
        style={{ marginTop: '0.75rem', width: '100%', borderColor: WARN, color: WARN, boxSizing: 'border-box' }}
      >
        Find urgent care near me
      </a>
    </div>
  );
}

export default function MonthlyCheckin({ onComplete, onClose, currentProfile, onProfileUpdate, myProducts = null }) {
  useEscapeToClose(true, onClose);
  const products = useMemo(() => toProductList(myProducts), [myProducts]);
  const productIds = useMemo(() => products.map((p) => p.id), [products]);

  // loading | ready | already-done | complete
  const [status, setStatus] = useState('loading');
  const [signedIn, setSignedIn] = useState(false);
  const [doneThisMonth, setDoneThisMonth] = useState(null); // this month's saved answers (signed in) or {} (guest)
  const [prefilled, setPrefilled] = useState(false);
  const [state, setState] = useState(() => buildInitialCheckinState(null, []));
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveNote, setSaveNote] = useState('');
  const [finalAnswers, setFinalAnswers] = useState(null);

  useEffect(() => {
    let active = true;
    loadMonthlyCheckinStatus()
      .then(({ signedIn: isSignedIn, thisMonthCheckin, lastCheckin }) => {
        if (!active) return;
        setSignedIn(isSignedIn);
        if (isSignedIn && thisMonthCheckin) {
          setDoneThisMonth(thisMonthCheckin.answers || {});
          setStatus('already-done');
          return;
        }
        if (!isSignedIn && guestCheckinDoneThisMonth()) {
          setDoneThisMonth({});
          setStatus('already-done');
          return;
        }
        const initial = buildInitialCheckinState(lastCheckin?.answers, productIds);
        setState(initial);
        setPrefilled(hasPrefill(initial));
        setStatus('ready');
      })
      .catch(() => {
        if (!active) return;
        setStatus('ready');
      });
    return () => { active = false; };
    // Load once per open; productIds only shapes the prefill.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const steps = computeCheckinSteps({ howIsRoutine: state.howIsRoutine, focusAreas: state.focusAreas, hasProducts: products.length > 0 });
  const stepId = steps[Math.min(stepIndex, steps.length - 1)];
  const isLast = stepIndex >= steps.length - 1;
  const progress = ((Math.min(stepIndex, steps.length - 1) + 1) / steps.length) * 100;

  const set = (patch) => setState((prev) => ({ ...prev, ...patch }));

  const startUpdate = () => {
    // Redo this month (signed in: upsert over this month's row), prefilled
    // from what was saved for it.
    const initial = buildInitialCheckinState(doneThisMonth, productIds);
    setState(initial);
    setPrefilled(hasPrefill(initial));
    setStepIndex(0);
    setStatus('ready');
  };

  const finish = async () => {
    const answers = buildCheckinAnswers(state, { products, focusToSymptom: FOCUS_TO_SYMPTOM });
    setSaving(true);
    if (signedIn) {
      const result = await saveMonthlyCheckin(answers);
      if (!result.saved) setSaveNote('We couldn’t sync this check-in to your account just now. Your recommendations still updated.');
    }
    setSaving(false);

    onComplete?.(answers);

    if (currentProfile && onProfileUpdate && answers.focusAreas.length) {
      const newFrustrations = answers.focusAreas.map((o) => FOCUS_TO_FRUSTRATION[o]).filter(Boolean);
      const existing = Array.isArray(currentProfile.frustrations) ? currentProfile.frustrations : [];
      const merged = [...new Set([...existing, ...newFrustrations])];
      if (merged.length > 0) {
        onProfileUpdate({ ...currentProfile, frustrations: merged });
      }
    }
    setFinalAnswers(answers);
    setStatus('complete');
  };

  const goNext = () => {
    if (saving) return;
    if (isLast) finish();
    else setStepIndex((i) => i + 1);
  };
  const goBack = () => setStepIndex((i) => Math.max(0, i - 1));

  if (status === 'loading') {
    return (
      <Shell onClose={onClose}>
        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', margin: '1.5rem 0' }}>Loading your check-in…</p>
      </Shell>
    );
  }

  if (status === 'already-done') {
    const counts = summarizeVerdicts(doneThisMonth?.productVerdicts);
    const rated = counts.helped + counts.no_change + counts.worse;
    return (
      <Shell onClose={onClose}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontFamily: 'var(--font-serif)', color: 'var(--color-navy)' }}>
          {monthLabel(monthKey())} is already logged
        </h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
          Come back next month for your next check-in.
          {signedIn ? ' You can still update this month’s answers.' : ''}
        </p>
        {rated > 0 && (
          <p style={{ fontSize: '0.92rem', marginBottom: '1rem' }}>
            You rated {rated} product{rated === 1 ? '' : 's'}: {counts.helped} helped, {counts.no_change} no change, {counts.worse} made it worse.
          </p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button type="button" className="btn btn-primary" onClick={onClose} style={{ width: '100%' }}>Done</button>
          <button type="button" className="btn btn-outline" onClick={startUpdate} style={{ width: '100%' }}>
            {signedIn ? 'Update this month' : 'Check in again'}
          </button>
        </div>
      </Shell>
    );
  }

  if (status === 'complete' && finalAnswers) {
    const great = finalAnswers.howIsRoutine === ROUTINE_GREAT;
    const focusAreas = finalAnswers.focusAreas;
    const tips = [];
    if (focusAreas.includes('More cramps')) tips.push('Magnesium glycinate may help. It can reduce cramps.');
    if (focusAreas.includes('Heavier flow')) tips.push('Iron-rich foods or a supplement can help if you’re losing more blood than usual.');
    if (focusAreas.includes('UTIs')) tips.push('Wisp and Planned Parenthood Direct offer same-day UTI treatment.');
    if (focusAreas.includes('Mood or sleep')) tips.push('Tracking your cycle can help. We’ve updated your recommendations.');
    if (focusAreas.includes('Different period product') || focusAreas.includes('Different supplement') || focusAreas.includes('Different app')) {
      tips.push('Your product recommendations have been updated. Check your list.');
    }
    const worse = Object.entries(finalAnswers.productVerdicts)
      .filter(([, v]) => v === 'worse')
      .map(([id]) => finalAnswers.productNames[id])
      .filter(Boolean);
    const title = great ? 'You’re all set' : 'Updated for you';
    const message = great
      ? 'We’ll keep watching for recalls and new products that fit you.'
      : 'We’ve updated your profile and recommendations based on this check-in.';

    return (
      <Shell onClose={onClose}>
        <div style={{ overflowY: 'auto', minHeight: 0 }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontFamily: 'var(--font-serif)', color: 'var(--color-navy)' }}>{title}</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
            {`That’s ${monthLabel(finalAnswers.month)} logged. `}{message}
          </p>
          {finalAnswers.safetyConcern === 'Yes' && (
            <p style={{ fontSize: '0.92rem', color: WARN, marginBottom: '1rem' }}>
              You said something new or worsening is going on. Please get it checked by a clinician.
            </p>
          )}
          {worse.length > 0 && (
            <p style={{ fontSize: '0.92rem', marginBottom: '1rem' }}>
              You said {worse.join(', ')} made things worse. If you had a reaction, stop using it and check with a clinician.
            </p>
          )}
          {tips.length > 0 && (
            <ul style={{ paddingLeft: '1.25rem', marginBottom: '1.25rem', fontSize: '0.95rem', lineHeight: 1.6 }}>
              {tips.map((t) => <li key={t} title={findGlossaryTermInText(t) || undefined}>{t}</li>)}
            </ul>
          )}
          {saveNote && <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>{saveNote}</p>}
        </div>
        <button type="button" className="btn btn-primary" onClick={onClose} style={{ width: '100%', flexShrink: 0 }}>Done</button>
      </Shell>
    );
  }

  const copy = STEP_COPY[stepId];
  const canContinue =
    stepId === 'routine' ? !!state.howIsRoutine
      : stepId === 'focus' ? state.focusAreas.length > 0
        : stepId === 'safety' ? !!state.safetyConcern
          : true;

  return (
    <Shell onClose={onClose}>
      <div style={{ flexShrink: 0 }}>
        <div style={{ width: '100%', background: 'var(--color-border)', height: '4px', borderRadius: 'var(--radius-pill)', marginBottom: '0.75rem', overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'var(--color-primary)', transition: 'width 0.3s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '0.5rem' }}>
          {stepIndex > 0 ? (
            <button type="button" onClick={goBack} style={{ border: 0, background: 'none', padding: 0, cursor: 'pointer', color: 'var(--color-text-muted)', font: '600 0.8rem var(--font-body)' }}>← Back</button>
          ) : <span />}
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{stepIndex + 1} of {steps.length}</span>
        </div>
        <h2 style={{ fontSize: '1.35rem', marginBottom: '0.5rem', textAlign: 'center' }}>{copy.question}</h2>
        {copy.subtitle && <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.95rem', marginBottom: '1rem' }}>{copy.subtitle}</p>}
        {prefilled && stepIndex === 0 && (
          <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-plum)', marginBottom: '0.75rem' }}>
            Carried over from your last check-in. Change anything that’s different.
          </p>
        )}
      </div>

      {stepId === 'routine' && (
        <div style={scrollStyle}>
          {ROUTINE_OPTIONS.map((option) => (
            <button key={option} type="button" className="btn btn-outline" aria-pressed={state.howIsRoutine === option} style={optionStyle(state.howIsRoutine === option)} onClick={() => set({ howIsRoutine: option })}>
              {option}
            </button>
          ))}
        </div>
      )}

      {stepId === 'products' && (
        <div style={{ ...scrollStyle, gap: 0 }}>
          {products.map((p) => (
            <VerdictRow
              key={p.id}
              product={p}
              value={state.productVerdicts[p.id] || null}
              onChange={(v) => setState((prev) => {
                const next = { ...prev.productVerdicts };
                if (v) next[p.id] = v; else delete next[p.id];
                return { ...prev, productVerdicts: next };
              })}
            />
          ))}
        </div>
      )}

      {stepId === 'focus' && (
        <div style={scrollStyle}>
          {FOCUS_OPTIONS.map((option) => {
            const on = state.focusAreas.includes(option);
            return (
              <button
                key={option}
                type="button"
                className="btn btn-outline"
                aria-pressed={on}
                style={optionStyle(on)}
                onClick={() => set({ focusAreas: on ? state.focusAreas.filter((x) => x !== option) : [...state.focusAreas, option] })}
              >
                <span style={{ marginRight: '0.5rem' }} aria-hidden>{on ? '✓' : '○'}</span>
                {option}
              </button>
            );
          })}
        </div>
      )}

      {stepId === 'screening' && (
        <div style={{ ...scrollStyle, gap: '1rem' }}>
          <div>
            <label htmlFor="mc-sexually-active" style={labelStyle}>Sexually active?</label>
            <select id="mc-sexually-active" value={state.screening.sexuallyActive} onChange={(e) => set({ screening: { ...state.screening, sexuallyActive: e.target.value } })} style={selectStyle}>
              <option value="">Select</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
              <option value="Prefer not to answer">Prefer not to answer</option>
            </select>
          </div>
          <div>
            <label htmlFor="mc-last-sti" style={labelStyle} title={findGlossaryTermInText('STI screening')}>Last STI screening?</label>
            <select id="mc-last-sti" value={state.screening.lastSTI} onChange={(e) => set({ screening: { ...state.screening, lastSTI: e.target.value } })} style={selectStyle}>
              <option value="">Select</option>
              <option value="Within 6 months">Within 6 months</option>
              <option value="6-12 months">6–12 months ago</option>
              <option value="1+ years ago">1+ years ago</option>
              <option value="Never">Never</option>
            </select>
          </div>
          <div>
            <label htmlFor="mc-last-pap" style={labelStyle} title={findGlossaryTermInText('Pap smear')}>Last Pap smear?</label>
            <select id="mc-last-pap" value={state.screening.lastPap} onChange={(e) => set({ screening: { ...state.screening, lastPap: e.target.value } })} style={selectStyle}>
              <option value="">Select</option>
              <option value="Within 1 year">Within 1 year</option>
              <option value="1-3 years ago">1–3 years ago</option>
              <option value="3+ years ago">3+ years ago</option>
              <option value="Never / Not sure">Never / Not sure</option>
            </select>
          </div>
        </div>
      )}

      {stepId === 'safety' && (
        <div style={scrollStyle}>
          {SAFETY_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              className="btn btn-outline"
              aria-pressed={state.safetyConcern === option}
              style={optionStyle(state.safetyConcern === option, option === 'Yes' ? 'warning' : undefined)}
              onClick={() => set({ safetyConcern: option })}
            >
              {option}
            </button>
          ))}
          {state.safetyConcern === 'Yes' && <ClinicianNote />}
        </div>
      )}

      {canContinue ? (
        <button type="button" className="btn btn-primary" style={{ width: '100%', flexShrink: 0 }} onClick={goNext}>
          {saving ? 'Saving…' : isLast ? 'Finish check-in' : 'Continue →'}
        </button>
      ) : (
        <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: 0, flexShrink: 0 }}>
          {stepId === 'focus' ? 'Pick at least one to continue.' : 'Choose an answer to continue.'}
        </p>
      )}
    </Shell>
  );
}
