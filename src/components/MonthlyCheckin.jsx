import React, { useState } from 'react';
import { findGlossaryTermInText } from '../data/glossary';
import { useEscapeToClose } from '../utils/useEscapeToClose';
import { useFocusTrap } from '../utils/useFocusTrap';

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
  subtitle: 'Tell us how it’s going.',
  type: 'single',
  options: [
    'Great. No changes',
    'Okay, could be better',
    'New symptoms or frustrations',
    'I want to switch some products',
  ],
};

const STEP_FOCUS = {
  id: 'focusAreas',
  question: 'What should we focus on this month?',
  subtitle: 'Pick everything that fits.',
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
  useEscapeToClose(true, onClose);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [multiSelections, setMultiSelections] = useState(new Set());
  const [screeningValues, setScreeningValues] = useState({ sexuallyActive: '', lastSTI: '', lastPap: '' });
  const [isComplete, setIsComplete] = useState(false);
  const trapRef = useFocusTrap(isComplete ? 'done' : 'asking');

  const showFocusStep = answers.howIsRoutine && answers.howIsRoutine !== 'Great. No changes';
  const focusIncludesScreening = multiSelections.has('Remind me about Pap / STI screenings');
  const steps = [
    STEP_MAIN,
    ...(showFocusStep ? [STEP_FOCUS] : []),
    ...(showFocusStep && focusIncludesScreening ? [STEP_SCREENING] : []),
  ];
  const step = steps[stepIndex];

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
    if (step.id === 'howIsRoutine' && next.howIsRoutine === 'Great. No changes') {
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
    // Every tip is worded to its source (founder rule, Oct 24: .gov for health
    // claims, the brand's own site for what a brand offers). Checked Oct 24 2026.
    // Cramps: MedlinePlus "Painful menstrual periods"
    //   https://medlineplus.gov/ency/article/003150.htm ("Apply a heating pad to
    //   your lower belly area, below your belly button"; "Try vitamin B6, calcium,
    //   and magnesium supplements, especially if your pain is from PMS").
    //   Was "Magnesium glycinate may help. It can reduce cramps.": no .gov source
    //   says that, and the 2016 Cochrane review found no high-quality evidence for
    //   any supplement for period pain.
    if (focusAreas.includes('More cramps')) tips.push('Try a heating pad on your lower belly, below your belly button. If your cramps come with PMS, you could also try vitamin B6, calcium or magnesium supplements.');
    // Heavier flow: womenshealth.gov "Iron-deficiency anemia"
    //   https://womenshealth.gov/a-z-topics/iron-deficiency-anemia ("heavy bleeding
    //   during their periods"; "Good sources of iron include meat, fish, eggs,
    //   beans, peas, and fortified foods"; "Do not take any iron pills without
    //   first talking to your doctor or nurse").
    if (focusAreas.includes('Heavier flow')) tips.push('Heavy periods can lead to low iron. Iron is in meat, fish, eggs, beans, peas and fortified foods. Talk to your doctor or nurse before taking iron pills.');
    // UTIs: worded as each brand's own offer, from its own site.
    //   Wisp: https://hellowisp.com/products/uti-antibiotics ("If prescribed,
    //   treatment will be sent same-day to your local pharmacy").
    //   Planned Parenthood Direct: https://www.plannedparenthood.org/get-care/ppdirect/ppd-app-one
    //   ("UTI treatment sent to the pharmacy of your choice"; no same-day claim).
    if (focusAreas.includes('UTIs')) tips.push('Wisp says that after an online visit, a prescribed UTI treatment is sent to your local pharmacy the same day. The Planned Parenthood Direct app says it sends UTI treatment to the pharmacy you choose.');
    // Mood or sleep: womenshealth.gov "Premenstrual syndrome (PMS)"
    //   https://womenshealth.gov/menstrual-cycle/premenstrual-syndrome ("Write down
    //   your symptoms each day on a calendar or with an app on your phone";
    //   "Take this information with you when you see your doctor").
    //   Was "Tracking your cycle can help." (no claim of what it helps).
    if (focusAreas.includes('Mood or sleep')) tips.push('Write down your symptoms each day for a few months, on a calendar or in an app, and take it with you when you see your doctor.');
    if (focusAreas.includes('Different period product') || focusAreas.includes('Different supplement') || focusAreas.includes('Different app')) {
      tips.push('Your picks haven’t changed for this. Browse to compare other options.');
    }
    // Only promise what happens: focus areas with a FOCUS_TO_FRUSTRATION
    // mapping change her picks (onProfileUpdate); the rest are saved only.
    const changedPicks = focusAreas.some((f) => FOCUS_TO_FRUSTRATION[f]);
    const title = satisfaction === 'Great. No changes' ? 'You’re all set' : changedPicks ? 'Updated for you' : 'Saved';
    const message = satisfaction === 'Great. No changes'
      ? 'We keep checking your products for recalls.'
      : changedPicks ? 'Your picks now include what you told us.' : 'Saved with this month’s check-in.';

    return (
      <div
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem',
        }}
        onClick={onClose}
      >
        <div ref={trapRef} className="card animate-fade-in-up ay-checkin" role="dialog" aria-modal="true" aria-labelledby="ay-checkin-done" style={{ maxWidth: '520px', width: '100%', padding: '2rem' }} onClick={e => e.stopPropagation()}>
          <h2 id="ay-checkin-done" style={{ fontSize: 'var(--ay-fs-section)', marginBottom: '0.75rem' }}>{title}</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>{message}</p>
          {tips.length > 0 && (
            <ul style={{ paddingLeft: '1.25rem', marginBottom: '1.5rem', fontSize: 16, lineHeight: 1.6 }}>
              {tips.map((t, i) => <li key={i} title={findGlossaryTermInText(t) || undefined}>{t}</li>)}
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
      <div ref={trapRef} className="card animate-fade-in-up ay-checkin" role="dialog" aria-modal="true" aria-labelledby="ay-checkin-q" style={{ position: 'relative', maxWidth: '520px', width: '100%', maxHeight: 'min(90vh, 600px)', display: 'flex', flexDirection: 'column', padding: '2rem' }} onClick={e => e.stopPropagation()}>
        <button type="button" className="ay-checkin__close" onClick={onClose} aria-label="Close" autoFocus>×</button>
        <div style={{ flexShrink: 0 }}>
          {/* A one-question check-in doesn't need wizard chrome; later steps just say where she is. */}
          {steps.length > 1 && stepIndex > 0 && (
            <p style={{ fontSize: 12.5, marginBottom: '0.75rem' }}>Step {stepIndex + 1} of {steps.length}</p>
          )}

          <h2 id="ay-checkin-q" style={{ fontSize: 'var(--ay-fs-section)', margin: '0 2.5rem 0.5rem', textAlign: 'center' }}>{step.question}</h2>
          {step.subtitle && <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 16, marginBottom: '1.25rem' }}>{step.subtitle}</p>}
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
                      fontSize: 16,
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
                Next question →
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
                      justifyContent: 'flex-start', padding: '0.85rem 1.25rem', fontSize: 16,
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
              Save my focus areas →
            </button>
          </>
        )}

        {step.type === 'screening' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: 14, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.35rem' }}>Sexually active?</label>
              <select
                value={screeningValues.sexuallyActive}
                onChange={e => setScreeningValues(s => ({ ...s, sexuallyActive: e.target.value }))}
                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 16 }}
              >
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Prefer not to answer">Prefer not to answer</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 14, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.35rem' }} title={findGlossaryTermInText('STI screening')}>Last STI screening?</label>
              <select
                value={screeningValues.lastSTI}
                onChange={e => setScreeningValues(s => ({ ...s, lastSTI: e.target.value }))}
                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 16 }}
              >
                <option value="">Select</option>
                <option value="Within 6 months">Within 6 months</option>
                <option value="6-12 months">6–12 months ago</option>
                <option value="1+ years ago">1+ years ago</option>
                <option value="Never">Never</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 14, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.35rem' }} title={findGlossaryTermInText('Pap smear')}>Last Pap smear?</label>
              <select
                value={screeningValues.lastPap}
                onChange={e => setScreeningValues(s => ({ ...s, lastPap: e.target.value }))}
                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 16 }}
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
