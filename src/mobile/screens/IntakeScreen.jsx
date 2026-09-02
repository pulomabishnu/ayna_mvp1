import { useEffect, useRef, useState } from 'react';
import { buildSteps } from '../data/intakeSteps.js';
import AskAynaChip from '../components/AskAynaChip.jsx';

// Mirrors AUTO_ADVANCE_SINGLE_MS in src/components/Quiz.jsx.
const AUTO_ADVANCE_SINGLE_MS = 500;

export default function IntakeScreen({ onBack, onComplete, onAskAyna }) {
  const [answers, setAnswers] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const advanceTimer = useRef(null);

  // Recomputed every render from current answers, mirroring Quiz.jsx's
  // useMemo(() => buildSteps(answers), [answers]) — steps grow/shrink live
  // as the age/contraception answers change.
  const steps = buildSteps(answers);
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

  const currentValue = answers[step.id];
  const selectedCount = step.type === 'multi' && Array.isArray(currentValue) ? currentValue.length : 0;
  const isLastStep = stepIndex === steps.length - 1;
  const nextLabel = isLastStep ? 'Build my ecosystem' : 'Continue';

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
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 500, fontSize: 26, lineHeight: 1.26, margin: '0 0 8px' }}>{step.question}</h1>
          {step.subtitle && <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,249,242,.78)', lineHeight: 1.5 }}>{step.subtitle}</p>}
        </div>

        {step.type === 'single' && (
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
        )}

        {step.type === 'multi' && (
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
        )}

        {step.type === 'text' && (
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
        )}

        {step.type === 'email' && (
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
        )}
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
