import { useEffect, useRef, useState } from 'react';
import { buildSteps, bucketAge, DECORATIVE_GOALS_STEP } from '../data/intakeSteps.js';
import AskAynaChip from '../components/AskAynaChip.jsx';

// Mirrors AUTO_ADVANCE_SINGLE_MS in src/components/Quiz.jsx.
const AUTO_ADVANCE_SINGLE_MS = 500;

export default function IntakeScreen({ onBack, onComplete, onAskAyna }) {
  const [answers, setAnswers] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [ageSliderValue, setAgeSliderValue] = useState(28);
  const [zip, setZip] = useState('');
  const advanceTimer = useRef(null);

  // Recomputed every render from current answers, mirroring Quiz.jsx's
  // useMemo(() => buildSteps(answers), [answers]) — steps grow/shrink live
  // as the age/contraception answers change. The decorative goals-grid step
  // (not part of the real quiz) is spliced in locally, right after age.
  const realSteps = buildSteps(answers);
  const steps = [realSteps[0], DECORATIVE_GOALS_STEP, ...realSteps.slice(1)];
  const stepIndex = Math.min(currentStep, steps.length - 1);
  const step = steps[stepIndex];

  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []);

  const goNext = () => {
    if (advanceTimer.current) {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
    if (stepIndex < steps.length - 1) {
      setCurrentStep(stepIndex + 1);
    } else if (onComplete) {
      onComplete(answers);
    }
  };

  const goBack = () => {
    if (stepIndex > 0) setCurrentStep(stepIndex - 1);
    else if (onBack) onBack();
  };

  const setSingle = (value) => {
    setAnswers((prev) => ({ ...prev, [step.id]: value }));
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(goNext, AUTO_ADVANCE_SINGLE_MS);
  };

  const toggleMulti = (value) => {
    setAnswers((prev) => {
      const arr = Array.isArray(prev[step.id]) ? prev[step.id].slice() : [];
      const i = arr.indexOf(value);
      if (i >= 0) arr.splice(i, 1);
      else arr.push(value);
      return { ...prev, [step.id]: arr };
    });
  };

  const setFieldText = (value) => {
    setAnswers((prev) => ({ ...prev, [step.id]: value }));
  };

  // Design's slider widget, bucketed into the real 6 age-range answers so
  // buildSteps()' branching (contraception steps) still works correctly.
  const setAge = (n) => {
    const clamped = Math.max(13, Math.min(90, n));
    setAgeSliderValue(clamped);
    setAnswers((prev) => ({ ...prev, age: bucketAge(clamped) }));
  };
  const decAge = () => setAge(ageSliderValue - 1);
  const incAge = () => setAge(ageSliderValue + 1);
  const onSlide = (e) => setAge(Number(e.target.value));

  const currentValue = answers[step.id];
  const selectedCount = (step.type === 'multi' || step.type === 'goals') && Array.isArray(currentValue) ? currentValue.length : 0;
  const isLastStep = stepIndex === steps.length - 1;
  const nextLabel = isLastStep ? 'Build my ecosystem' : 'Continue';
  const isAgeStep = step.id === 'age';

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(168deg,#242A52 0%,#4E3866 52%,#A2603C 100%)',
        color: '#FFF9F2',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'DM Sans',system-ui,sans-serif",
        animation: 'ay-page .25s ease-out',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -60,
          right: -60,
          width: 220,
          height: 220,
          borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(255,199,116,.4),rgba(255,199,116,0) 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -50,
          left: -50,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(255,249,242,.16),rgba(255,249,242,0) 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '58px 24px 0', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
          <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 20 }}>ayna</span>
          <span style={{ fontSize: 10, color: 'rgba(255,249,242,.6)' }}>beta</span>
        </div>
        <div onClick={goBack} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'rgba(255,249,242,.8)', cursor: 'pointer', padding: '4px 2px' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,249,242,.8)" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
          Back
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '22px 24px 0', position: 'relative' }}>
        {steps.map((s, i) => (
          <div
            key={s.id}
            style={{ flex: 1, height: 6, borderRadius: 3, background: i <= stepIndex ? '#FFC774' : 'rgba(255,249,242,.24)', transition: 'background .3s ease' }}
          />
        ))}
      </div>
      <div style={{ padding: '8px 24px 0', fontSize: 12, color: 'rgba(255,249,242,.72)', position: 'relative' }}>
        {`Step ${stepIndex + 1} of ${steps.length}`}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', padding: '0 0 8px' }}>
        <div style={{ padding: '20px 24px 0' }}>
          {/* Plain div, not <h1> — a semantic heading here would pick up the
              real site's own global heading color rule (a stylesheet rule
              beats mere CSS inheritance from this component's own inline
              color), rendering dark text on this dark gradient. */}
          <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 500, fontSize: 26, lineHeight: 1.26, margin: '0 0 8px', color: '#FFF9F2' }}>
            {step.question}
          </div>
          {step.subtitle && <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,249,242,.78)', lineHeight: 1.5 }}>{step.subtitle}</p>}
        </div>

        {isAgeStep ? (
          <>
            <div
              style={{
                margin: '24px 24px 0',
                padding: '22px 20px 20px',
                background: '#FFFFFF',
                border: '1.5px solid rgba(26,23,20,.08)',
                borderRadius: 24,
                boxShadow: '0 16px 34px -22px rgba(26,23,20,.35)',
                position: 'relative',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: '#78716C', marginBottom: 16, textAlign: 'center' }}>
                How old are you?
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
                <button
                  onClick={decAge}
                  aria-label="decrease"
                  style={{ width: 44, height: 44, borderRadius: '50%', border: '1.5px solid rgba(26,23,20,.12)', background: '#FFEFD6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flex: 'none' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A1714" strokeWidth="2.25" strokeLinecap="round">
                    <path d="M5 12h14" />
                  </svg>
                </button>
                <div style={{ minWidth: 80, textAlign: 'center', fontFamily: "'Playfair Display',serif", fontSize: 46, lineHeight: 1, color: '#1A1714' }}>
                  {ageSliderValue}
                </div>
                <button
                  onClick={incAge}
                  aria-label="increase"
                  style={{ width: 44, height: 44, borderRadius: '50%', border: '1.5px solid rgba(26,23,20,.12)', background: '#FFEFD6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flex: 'none' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A1714" strokeWidth="2.25" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              </div>
              <input type="range" min="13" max="90" value={ageSliderValue} onChange={onSlide} style={{ width: '100%', marginTop: 20, display: 'block' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#A8A29E', marginTop: 4 }}>
                <span>13</span>
                <span>90</span>
              </div>
            </div>
            <div style={{ margin: '16px 24px 0', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: '#FFFFFF', border: '1.5px solid rgba(26,23,20,.1)', borderRadius: 16 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A2603C" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
                  <path d="M12 21s7-7.2 7-12a7 7 0 1 0-14 0c0 4.8 7 12 7 12Z" />
                  <circle cx="12" cy="9" r="2.3" />
                </svg>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: '#78716C' }}>
                    Zip code <span style={{ textTransform: 'none', fontWeight: 400 }}>· optional</span>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. 10001"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 15, color: '#1A1714', marginTop: 2, width: '100%', padding: 0 }}
                  />
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,249,242,.66)', margin: '8px 4px 0', lineHeight: 1.45 }}>
                Not used yet — reserved for a future "what's near you" feature.
              </div>
            </div>
          </>
        ) : step.type === 'goals' ? (
          <div style={{ margin: '22px 24px 0', display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12, position: 'relative' }}>
            {step.options.map((g) => {
              const arr = Array.isArray(currentValue) ? currentValue : [];
              const on = arr.includes(g.key);
              return (
                <div
                  key={g.key}
                  onClick={() => toggleMulti(g.key)}
                  style={{
                    cursor: 'pointer',
                    padding: '18px 16px',
                    borderRadius: 20,
                    position: 'relative',
                    border: '1.5px solid ' + (on ? '#1A1714' : 'rgba(26,23,20,.08)'),
                    background: on ? g.tint : '#FFFFFF',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    color: '#1A1714',
                    transition: 'border-color .15s ease, background-color .15s ease',
                  }}
                >
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: g.tint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={g.stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d={g.path} />
                    </svg>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1714' }}>{g.label}</div>
                  {on && (
                    <div style={{ position: 'absolute', top: 12, right: 12, width: 20, height: 20, borderRadius: '50%', background: '#1A1714', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12l4 4 10-10" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : step.type === 'single' ? (
          <div style={{ margin: '22px 24px 0', display: 'flex', flexDirection: 'column', gap: 9 }}>
            {step.options.map((opt) => {
              const on = currentValue === opt;
              return (
                <div
                  key={opt}
                  onClick={() => setSingle(opt)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 16px',
                    borderRadius: 18,
                    cursor: 'pointer',
                    background: on ? '#FFF6E6' : '#FFFFFF',
                    border: '1.5px solid ' + (on ? '#1A1714' : 'rgba(26,23,20,.08)'),
                    color: '#1A1714',
                    transition: 'border-color .15s ease, background-color .15s ease',
                  }}
                >
                  <div style={{ flex: 1, fontSize: 14.5, lineHeight: 1.35, fontWeight: 500 }}>{opt}</div>
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 99,
                      flexShrink: 0,
                      border: '1.5px solid ' + (on ? '#1A1714' : 'rgba(26,23,20,.18)'),
                      background: on ? '#1A1714' : 'transparent',
                      boxShadow: on ? 'inset 0 0 0 3px #FAF6F1' : 'none',
                    }}
                  />
                </div>
              );
            })}
          </div>
        ) : step.type === 'multi' ? (
          <div style={{ margin: '22px 24px 0', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {step.options.map((opt) => {
              const arr = Array.isArray(currentValue) ? currentValue : [];
              const on = arr.includes(opt);
              return (
                <div
                  key={opt}
                  onClick={() => toggleMulti(opt)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '11px 15px',
                    borderRadius: 999,
                    cursor: 'pointer',
                    fontSize: 13.5,
                    fontWeight: 500,
                    background: on ? '#1A1714' : '#FFFFFF',
                    color: on ? '#FFF9F2' : '#1A1714',
                    border: '1.5px solid ' + (on ? '#1A1714' : 'rgba(26,23,20,.1)'),
                    transition: 'background-color .15s ease, color .15s ease',
                  }}
                >
                  {opt}
                </div>
              );
            })}
          </div>
        ) : step.type === 'text' ? (
          <div style={{ margin: '22px 24px 0' }}>
            <textarea
              value={currentValue || ''}
              onChange={(e) => setFieldText(e.target.value)}
              placeholder={step.placeholder}
              rows={5}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '14px 16px',
                background: '#FFFFFF',
                border: '1.5px solid rgba(26,23,20,.1)',
                borderRadius: 16,
                fontSize: 14,
                color: '#1A1714',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
          </div>
        ) : step.type === 'email' ? (
          <div style={{ margin: '22px 24px 0' }}>
            <input
              type="email"
              value={currentValue || ''}
              onChange={(e) => setFieldText(e.target.value)}
              placeholder="you@email.com"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: 16,
                background: '#FFFFFF',
                border: '1.5px solid rgba(26,23,20,.1)',
                borderRadius: 16,
                fontSize: 15,
                color: '#1A1714',
                fontFamily: 'inherit',
              }}
            />
          </div>
        ) : null}
      </div>

      <div style={{ padding: '14px 24px 34px', position: 'relative', background: 'linear-gradient(to top,rgba(36,42,82,.35),rgba(36,42,82,0))' }}>
        <button
          onClick={goNext}
          style={{
            width: '100%',
            padding: 16,
            border: 'none',
            borderRadius: 16,
            background: 'linear-gradient(135deg,#F0A84B,#E8A94F)',
            color: '#1A1714',
            fontFamily: "'DM Sans',sans-serif",
            fontWeight: 600,
            fontSize: 15,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: 'pointer',
            boxShadow: '0 16px 28px -14px rgba(232,169,79,.9)',
          }}
        >
          <span>{nextLabel}</span>
          {selectedCount > 0 && (
            <span style={{ background: 'rgba(26,23,20,.14)', borderRadius: 999, padding: '2px 9px', fontSize: 12 }}>{selectedCount}</span>
          )}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A1714" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
        <div onClick={goNext} style={{ textAlign: 'center', fontSize: 12.5, color: 'rgba(255,249,242,.7)', padding: '12px 0 0', cursor: 'pointer' }}>
          Skip this step
        </div>
      </div>

      <AskAynaChip onClick={onAskAyna} />
    </div>
  );
}
