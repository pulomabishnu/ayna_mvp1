import React, { useState } from 'react';

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
  'Remind me about Pap / STI screenings': null,
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

const STEP_MAIN = {
  id: 'howIsRoutine',
  question: "How's your current routine working?",
  type: 'single',
  options: [
    'Great — no changes',
    'Okay, could be better',
    'New symptoms or frustrations',
    'I want to switch some products',
  ],
};

const STEP_FOCUS = {
  id: 'focusAreas',
  question: 'What should we focus on this month?',
  subtitle: 'Select all that apply — we’ll update your recommendations',
  type: 'multi',
  options: [
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
    'Remind me about Pap / STI screenings',
  ],
};

const STEP_SCREENING = {
  id: 'screening',
  question: 'Quick screening info',
  subtitle: 'Helps us remind you when care is due',
  type: 'screening',
};

export default function MonthlyCheckin({ onComplete, onClose, currentProfile, onProfileUpdate }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [multiSelections, setMultiSelections] = useState(new Set());
  const [screeningValues, setScreeningValues] = useState({ sexuallyActive: '', lastSTI: '', lastPap: '' });
  const [isComplete, setIsComplete] = useState(false);

  const showFocusStep = answers.howIsRoutine && answers.howIsRoutine !== 'Great — no changes';
  const focusIncludesScreening = multiSelections.has('Remind me about Pap / STI screenings');
  const steps = [
    STEP_MAIN,
    ...(showFocusStep ? [STEP_FOCUS] : []),
    ...(showFocusStep && focusIncludesScreening ? [STEP_SCREENING] : []),
  ];
  const step = steps[stepIndex];
  const progress = steps.length ? ((stepIndex + 1) / steps.length) * 100 : 100;

  const finish = (finalAnswers) => {
    const checkinPayload = {
      howIsRoutine: finalAnswers.howIsRoutine,
      focusAreas: finalAnswers.focusAreas || [],
      newSymptoms: (finalAnswers.focusAreas || []).map(o => FOCUS_TO_SYMPTOM[o]).filter(Boolean),
      sexuallyActive: finalAnswers.sexuallyActive ?? screeningValues.sexuallyActive,
      lastSTI: finalAnswers.lastSTI ?? screeningValues.lastSTI,
      lastPap: finalAnswers.lastPap ?? screeningValues.lastPap,
      productFeedback: finalAnswers.productFeedback,
    };

    onComplete(checkinPayload);

    if (currentProfile && onProfileUpdate && finalAnswers.focusAreas?.length) {
      const newFrustrations = finalAnswers.focusAreas
        .map(o => FOCUS_TO_FRUSTRATION[o])
        .filter(Boolean);
      const existing = Array.isArray(currentProfile.frustrations) ? currentProfile.frustrations : [];
      const merged = [...new Set([...existing, ...newFrustrations])];
      if (merged.length > 0) {
        onProfileUpdate({ ...currentProfile, frustrations: merged });
      }
    }
    setIsComplete(true);
  };

  const handleSingle = (option) => {
    setAnswers(prev => ({ ...prev, [step.id]: option }));
  };

  const handleSingleNext = () => {
    const next = { ...answers, [step.id]: answers[step.id] };
    if (step.id === 'howIsRoutine' && next.howIsRoutine === 'Great — no changes') {
      finish({ ...next, focusAreas: [] });
      return;
    }
    if (stepIndex < steps.length - 1) {
      setStepIndex(i => i + 1);
    } else {
      finish(next);
    }
  };

  const handleMultiToggle = (option) => {
    setMultiSelections(prev => {
      const next = new Set(prev);
      if (next.has(option)) next.delete(option);
      else next.add(option);
      return next;
    });
  };

  const handleMultiConfirm = () => {
    const focusAreas = Array.from(multiSelections);
    const next = { ...answers, focusAreas };
    setAnswers(next);
    if (focusIncludesScreening) {
      setStepIndex(i => i + 1);
    } else {
      finish(next);
    }
  };

  const handleScreeningDone = () => {
    const next = {
      ...answers,
      focusAreas: Array.from(multiSelections),
      sexuallyActive: screeningValues.sexuallyActive,
      lastSTI: screeningValues.lastSTI,
      lastPap: screeningValues.lastPap,
    };
    finish(next);
  };

  if (isComplete) {
    const satisfaction = answers.howIsRoutine;
    const focusAreas = answers.focusAreas || [];
    const tips = [];
    if (focusAreas.includes('More cramps')) tips.push('Consider magnesium glycinate — shown to reduce cramps.');
    if (focusAreas.includes('Heavier flow')) tips.push('Iron-rich foods or a supplement can help if you’re losing more blood.');
    if (focusAreas.includes('UTIs')) tips.push('Wisp and Planned Parenthood Direct offer same-day UTI treatment.');
    if (focusAreas.includes('Mood or sleep')) tips.push('Cycle-aware tracking can help; we’ve refreshed your recommendations.');
    if (focusAreas.includes('Different period product') || focusAreas.includes('Different supplement') || focusAreas.includes('Different app')) {
      tips.push('Your product recommendations have been updated — check your list.');
    }
    const title = satisfaction === 'Great — no changes' ? '🎉 You’re all set' : '📋 Updated for you';
    const message = satisfaction === 'Great — no changes'
      ? 'We’ll keep monitoring for recalls and new products that match your profile.'
      : 'We’ve updated your profile and recommendations based on this check-in.';

    return (
      <div
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem',
        }}
        onClick={onClose}
      >
        <div className="card animate-fade-in-up" style={{ maxWidth: '520px', width: '100%', padding: '2rem' }} onClick={e => e.stopPropagation()}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>{title}</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>{message}</p>
          {tips.length > 0 && (
            <ul style={{ paddingLeft: '1.25rem', marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: 1.6 }}>
              {tips.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          )}
          <button type="button" className="btn btn-primary" onClick={onClose} style={{ width: '100%' }}>Done</button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem',
      }}
      onClick={onClose}
    >
      <div className="card animate-fade-in-up" style={{ maxWidth: '520px', width: '100%', maxHeight: 'min(90vh, 600px)', display: 'flex', flexDirection: 'column', padding: '2rem' }} onClick={e => e.stopPropagation()}>
        <div style={{ flexShrink: 0 }}>
          <div style={{ width: '100%', background: 'var(--color-border)', height: '4px', borderRadius: 'var(--radius-pill)', marginBottom: '0.75rem', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'var(--color-primary)', transition: 'width 0.3s ease' }} />
          </div>
          <p style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
            {stepIndex + 1} of {steps.length}
          </p>

          <h2 style={{ fontSize: '1.35rem', marginBottom: '0.5rem', textAlign: 'center' }}>{step.question}</h2>
          {step.subtitle && <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.95rem', marginBottom: '1.25rem' }}>{step.subtitle}</p>}
        </div>

        {step.type === 'single' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', maxHeight: 'min(50vh, 320px)', marginBottom: '1rem' }}>
              {step.options.map((option) => {
                const isSelected = answers[step.id] === option;
                return (
                  <button
                    key={option}
                    type="button"
                    className="btn btn-outline"
                    style={{
                      justifyContent: 'flex-start',
                      padding: '0.85rem 1.25rem',
                      fontSize: '0.95rem',
                      flexShrink: 0,
                      borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                      backgroundColor: isSelected ? 'var(--color-secondary-fade)' : 'transparent',
                    }}
                    onClick={() => handleSingle(option)}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            {answers[step.id] != null && (
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', flexShrink: 0 }}
                onClick={handleSingleNext}
              >
                Continue →
              </button>
            )}
          </>
        )}

        {step.type === 'multi' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', maxHeight: 'min(50vh, 320px)', marginBottom: '1rem' }}>
              {step.options.map((option) => {
                const isSelected = multiSelections.has(option);
                return (
                  <button
                    key={option}
                    type="button"
                    className="btn btn-outline"
                    style={{
                      justifyContent: 'flex-start', padding: '0.85rem 1.25rem', fontSize: '0.95rem',
                      flexShrink: 0,
                      borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                      backgroundColor: isSelected ? 'var(--color-secondary-fade)' : 'transparent',
                    }}
                    onClick={() => handleMultiToggle(option)}
                  >
                    <span style={{ marginRight: '0.5rem' }}>{isSelected ? '✓' : '○'}</span>
                    {option}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%', flexShrink: 0, opacity: multiSelections.size === 0 ? 0.5 : 1 }}
              disabled={multiSelections.size === 0}
              onClick={handleMultiConfirm}
            >
              Continue →
            </button>
          </>
        )}

        {step.type === 'screening' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.35rem' }}>Sexually active?</label>
              <select
                value={screeningValues.sexuallyActive}
                onChange={e => setScreeningValues(s => ({ ...s, sexuallyActive: e.target.value }))}
                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '1rem' }}
              >
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Prefer not to answer">Prefer not to answer</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.35rem' }}>Last STI screening?</label>
              <select
                value={screeningValues.lastSTI}
                onChange={e => setScreeningValues(s => ({ ...s, lastSTI: e.target.value }))}
                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '1rem' }}
              >
                <option value="">Select</option>
                <option value="Within 6 months">Within 6 months</option>
                <option value="6-12 months">6–12 months ago</option>
                <option value="1+ years ago">1+ years ago</option>
                <option value="Never">Never</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.35rem' }}>Last Pap smear?</label>
              <select
                value={screeningValues.lastPap}
                onChange={e => setScreeningValues(s => ({ ...s, lastPap: e.target.value }))}
                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '1rem' }}
              >
                <option value="">Select</option>
                <option value="Within 1 year">Within 1 year</option>
                <option value="1-3 years ago">1–3 years ago</option>
                <option value="3+ years ago">3+ years ago</option>
                <option value="Never / Not sure">Never / Not sure</option>
              </select>
            </div>
            <button type="button" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={handleScreeningDone}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
