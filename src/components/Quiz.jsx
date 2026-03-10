import React, { useState } from 'react';

// Optimized: max signal per question, minimal steps. Keys match getRecommendations (frustrations, preference, etc.)
const STEPS = [
  {
    id: 'frustrations',
    question: "What are your main health concerns or goals?",
    subtitle: "Select all that apply — this drives your recommendations",
    type: 'multi',
    options: [
      'Heavy flow',
      'Painful cramps',
      'Irregular cycles',
      'Leaks & staining',
      'General discomfort',
      'Not sure if products are safe',
      'Recurrent UTIs',
      'PCOS symptoms',
      'Pelvic pain',
      'Menopause symptoms',
      'Endometriosis',
      'Fertility / TTC',
    ]
  },
  {
    id: 'preference',
    question: "What matters most to you in a product?",
    type: 'single',
    options: [
      'Organic/Natural only',
      'Lower cost',
      'Comfort/Convenience',
      'Privacy & data security',
      'Sustainability/Zero-waste',
    ]
  },
  {
    id: 'internalComfort',
    question: "Are you comfortable with internal products (tampons, cups, discs)?",
    type: 'single',
    options: ['Yes', 'No', 'Open to trying']
  },
  {
    id: 'currentUse',
    question: "What do you use today?",
    subtitle: "Select all that apply — we'll avoid duplicating what you already have",
    type: 'multi',
    options: [
      'Pads',
      'Tampons',
      'Menstrual cup',
      'Menstrual disc',
      'Period underwear',
      'Supplements',
      'Flo / Clue / Stardust',
      'Apple Health / Garmin / Fitbit',
      'Telehealth (Wisp, Nurx, etc.)',
      'None',
    ]
  },
  {
    id: 'sensitivities',
    question: "Any sensitivities or allergies we should know about?",
    subtitle: "Select all that apply",
    type: 'multi',
    options: [
      'Fragrance sensitivity',
      'Latex allergy',
      'Synthetic materials',
      'Other allergies',
      'None that I know of',
    ]
  },
  {
    id: 'budget',
    question: "Roughly, what's your monthly budget for health & wellness products?",
    type: 'single',
    options: ['Under $20', '$20–$50', '$50–$100', '$100+']
  },
  {
    id: 'email',
    question: "Save your profile (optional)",
    subtitle: "Enter email to save recommendations, or skip to see results now.",
    type: 'email'
  }
];

export default function Quiz({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [multiSelections, setMultiSelections] = useState(new Set());
  const [emailValue, setEmailValue] = useState('');

  const step = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const handleSingle = (option) => {
    const newAnswers = { ...answers, [step.id]: option };
    setAnswers(newAnswers);
    advance(newAnswers);
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
    const selected = Array.from(multiSelections);
    const newAnswers = { ...answers, [step.id]: selected };
    setMultiSelections(new Set());
    setAnswers(newAnswers);
    // Backfill currentPhysical / currentApps for compatibility if needed
    if (step.id === 'currentUse') {
      const physical = ['Pads', 'Tampons', 'Menstrual cup', 'Menstrual disc', 'Period underwear', 'Supplements'];
      const apps = ['Flo / Clue / Stardust', 'Apple Health / Garmin / Fitbit', 'Telehealth (Wisp, Nurx, etc.)'];
      newAnswers.currentPhysical = selected.filter(o => physical.includes(o));
      newAnswers.currentApps = selected.filter(o => apps.includes(o));
    }
    advance(newAnswers);
  };

  const handleEmailSubmit = () => {
    const newAnswers = { ...answers, email: emailValue.trim() };
    setAnswers(newAnswers);
    onComplete(newAnswers);
  };

  const advance = (newAnswers) => {
    if (currentStep < STEPS.length - 1) {
      setTimeout(() => setCurrentStep(prev => prev + 1), 250);
    } else if (step.id !== 'email') {
      setTimeout(() => onComplete(newAnswers), 250);
    }
  };

  return (
    <section className="container animate-fade-in-up" style={{ padding: 'var(--spacing-xl) var(--spacing-md)', maxWidth: '800px' }}>
      <div style={{ width: '100%', background: 'var(--color-border)', height: '6px', borderRadius: 'var(--radius-pill)', marginBottom: '1rem', overflow: 'hidden' }}>
        <div style={{ width: `${progress}%`, height: '100%', background: 'var(--color-primary)', transition: 'width 0.4s ease' }} />
      </div>
      <p style={{ textAlign: 'right', fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-lg)' }}>
        {currentStep + 1} of {STEPS.length}
      </p>

      <div className="card" style={{ minHeight: '380px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', textAlign: 'center' }}>
          {step.question}
        </h2>
        {step.subtitle && (
          <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-lg)', fontSize: '1rem' }}>
            {step.subtitle}
          </p>
        )}

        {step.type === 'single' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {step.options.map((option, idx) => {
              const isSelected = answers[step.id] === option;
              return (
                <button
                  key={option}
                  className="btn btn-outline"
                  style={{
                    justifyContent: 'flex-start',
                    padding: '1rem 1.5rem',
                    fontSize: '1.05rem',
                    borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                    backgroundColor: isSelected ? 'var(--color-secondary-fade)' : 'transparent',
                    animation: `fadeInUp 0.5s ${idx * 0.05}s backwards`
                  }}
                  onClick={() => handleSingle(option)}
                >
                  {option}
                </button>
              );
            })}
          </div>
        )}

        {step.type === 'multi' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {step.options.map((option, idx) => {
                const isSelected = multiSelections.has(option);
                return (
                  <button
                    key={option}
                    type="button"
                    className="btn btn-outline"
                    style={{
                      justifyContent: 'flex-start',
                      padding: '0.9rem 1.25rem',
                      fontSize: '1rem',
                      borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                      backgroundColor: isSelected ? 'var(--color-secondary-fade)' : 'transparent',
                      animation: `fadeInUp 0.5s ${idx * 0.04}s backwards`
                    }}
                    onClick={() => handleMultiToggle(option)}
                  >
                    <span style={{ marginRight: '0.75rem', fontSize: '1.1rem' }}>{isSelected ? '✓' : '○'}</span>
                    {option}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: '1.5rem', alignSelf: 'center', opacity: multiSelections.size === 0 ? 0.5 : 1 }}
              disabled={multiSelections.size === 0}
              onClick={handleMultiConfirm}
            >
              Continue →
            </button>
          </>
        )}

        {step.type === 'email' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px', margin: '0 auto', width: '100%' }}>
            <input
              type="email"
              placeholder="your@email.com"
              value={emailValue}
              onChange={e => setEmailValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleEmailSubmit()}
              style={{
                padding: '1rem',
                fontSize: '1.1rem',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                outline: 'none',
                fontFamily: 'var(--font-body)'
              }}
            />
            <button type="button" className="btn btn-primary" style={{ fontSize: '1.1rem' }} onClick={handleEmailSubmit}>
              Get My Recommendations
            </button>
            <button
              type="button"
              style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', textDecoration: 'underline' }}
              onClick={() => onComplete({ ...answers, email: '' })}
            >
              Skip — show recommendations without saving
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
