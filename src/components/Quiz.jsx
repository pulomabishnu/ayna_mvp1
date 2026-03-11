import React, { useState, useRef, useMemo } from 'react';

const AGE_OPTIONS = ['Under 25', '25-34', '35-44', '45-50', '51-55', '56+'];
const AGE_50_OR_BELOW = new Set(['Under 25', '25-34', '35-44', '45-50']);

function isAge50OrBelow(ageValue) {
  return ageValue && AGE_50_OR_BELOW.has(ageValue);
}

// Base steps used after age (and optional contraception). Keys match getRecommendations.
const REST_STEPS = [
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

const CONTRACEPTION_USE_STEP = {
  id: 'contraceptionUse',
  question: "Are you currently using or interested in birth control?",
  subtitle: "We'll include contraception options in your recommendations if relevant.",
  type: 'single',
  options: ['Yes', 'No', 'Prefer not to say']
};

const CONTRACEPTION_PREFERENCE_STEP = {
  id: 'contraceptionPreference',
  question: "What type do you prefer or use?",
  subtitle: "Select all that apply",
  type: 'multi',
  options: ['Pill', 'IUD', 'Implant', 'Ring', 'Patch', 'Condoms', 'Natural / FAM', 'None', 'Not sure']
};

function buildSteps(answers) {
  const ageStep = {
    id: 'age',
    question: "What's your age range?",
    subtitle: "So we can tailor recommendations (e.g. contraception for under 50).",
    type: 'single',
    options: AGE_OPTIONS
  };
  const contraceptionSteps = [];
  if (isAge50OrBelow(answers.age)) {
    contraceptionSteps.push(CONTRACEPTION_USE_STEP);
    // Only ask contraception type if they said Yes to using or interested in birth control
    if (answers.contraceptionUse === 'Yes') {
      contraceptionSteps.push(CONTRACEPTION_PREFERENCE_STEP);
    }
  }
  return [ageStep, ...contraceptionSteps, ...REST_STEPS];
}

// Guiding questions for voice profile
const VOICE_GUIDING_QUESTIONS = [
  "What are your main period or health concerns? (e.g. heavy flow, cramps, irregular cycles, menopause symptoms)",
  "Any product preferences? (organic, lower cost, comfort, privacy, sustainability)",
  "Are you comfortable with internal products like tampons or cups?",
  "What do you use today? (pads, tampons, cup, apps like Clue or Flo)",
  "Any sensitivities or allergies? (fragrance, latex, etc.)",
  "If you're 50 or under: are you using or interested in birth control? What type?"
];

// Parse voice transcript into quiz-answer shape (frustrations, preference, sensitivities, age, contraception, etc.)
function parseTranscriptToProfile(transcript) {
  const text = (transcript || '').toLowerCase().trim();
  const out = {
    frustrations: [],
    preference: null,
    sensitivities: [],
    internalComfort: null,
    currentUse: [],
    budget: null,
    age: null,
    contraceptionUse: null,
    contraceptionPreference: []
  };
  const frustrationPhrases = [
    { keys: ['heavy', 'heavy flow', 'heavy period'], value: 'Heavy flow' },
    { keys: ['cramp', 'pain', 'painful period'], value: 'Painful cramps' },
    { keys: ['irregular', 'cycle', 'period irregular'], value: 'Irregular cycles' },
    { keys: ['leak', 'stain', 'leaks'], value: 'Leaks & staining' },
    { keys: ['discomfort', 'uncomfortable'], value: 'General discomfort' },
    { keys: ['safe', 'safety', 'product safe'], value: 'Not sure if products are safe' },
    { keys: ['uti', 'urinary', 'bladder infection'], value: 'Recurrent UTIs' },
    { keys: ['pcos'], value: 'PCOS symptoms' },
    { keys: ['pelvic', 'pelvic pain'], value: 'Pelvic pain' },
    { keys: ['menopause', 'menopausal', 'hot flash'], value: 'Menopause symptoms' },
    { keys: ['endometriosis', 'endo'], value: 'Endometriosis' },
    { keys: ['fertility', 'ttc', 'trying to conceive'], value: 'Fertility / TTC' }
  ];
  frustrationPhrases.forEach(({ keys, value }) => {
    if (keys.some(k => text.includes(k)) && !out.frustrations.includes(value)) out.frustrations.push(value);
  });
  if (text.includes('organic') || text.includes('natural') || text.includes('clean')) out.preference = 'Organic/Natural only';
  else if (text.includes('cost') || text.includes('cheap') || text.includes('budget')) out.preference = 'Lower cost';
  else if (text.includes('comfort') || text.includes('convenience')) out.preference = 'Comfort/Convenience';
  else if (text.includes('privacy') || text.includes('data')) out.preference = 'Privacy & data security';
  else if (text.includes('sustainab') || text.includes('eco') || text.includes('zero waste')) out.preference = 'Sustainability/Zero-waste';
  if (text.includes('fragrance') || text.includes('scent')) out.sensitivities.push('Fragrance sensitivity');
  if (text.includes('latex')) out.sensitivities.push('Latex allergy');
  if (text.includes('synthetic') || text.includes('plastic')) out.sensitivities.push('Synthetic materials');
  if (text.includes('tampon') && (text.includes('comfortable') || text.includes('yes') || text.includes('ok'))) out.internalComfort = 'Yes';
  if (text.includes('tampon') && (text.includes('not') || text.includes('no ') || text.includes("don't"))) out.internalComfort = 'No';
  if (text.includes('open to try') || text.includes('trying')) out.internalComfort = 'Open to trying';
  if (text.includes('pad')) out.currentUse.push('Pads');
  if (text.includes('tampon')) out.currentUse.push('Tampons');
  if (text.includes('cup') || text.includes('menstrual cup')) out.currentUse.push('Menstrual cup');
  if (text.includes('disc')) out.currentUse.push('Menstrual disc');
  if (text.includes('period underwear') || text.includes('thinx')) out.currentUse.push('Period underwear');
  if (text.includes('clue') || text.includes('flo') || text.includes('stardust')) out.currentUse.push('Flo / Clue / Stardust');
  if (text.includes('apple health') || text.includes('garmin') || text.includes('fitbit')) out.currentUse.push('Apple Health / Garmin / Fitbit');
  if (text.match(/\bunder\s*25\b/) || text.match(/\b(19|20|21|22|23|24)\s*(years?|y\.?o\.?)/)) out.age = 'Under 25';
  else if (text.match(/\b(25|26|27|28|29|30|31|32|33|34)\s*(years?|y\.?o\.?)/) || (text.includes('25') && text.includes('34'))) out.age = '25-34';
  else if (text.match(/\b(35|36|37|38|39|40|41|42|43|44)\s*(years?|y\.?o\.?)/) || text.includes('35') || text.includes('40')) out.age = '35-44';
  else if (text.match(/\b(45|46|47|48|49|50)\s*(years?|y\.?o\.?)/) || text.includes('45') || text.includes('50')) out.age = '45-50';
  else if (text.match(/\b(51|52|53|54|55)\s*(years?|y\.?o\.?)/)) out.age = '51-55';
  else if (text.match(/\b(56|57|58|59|60|61|62|63|64|65)\s*(years?|y\.?o\.?)/) || text.includes('60') || text.includes('menopause')) out.age = '56+';
  // Birth control: detect "no" / "don't use" first so we don't show contraception questions
  const noBcPhrases = ["don't use", "do not use", "not using", "no birth control", "not on birth control", "not interested", "no contraception", "not taking", "don't take", "no i'm not", "no im not", "nope", " no "];
  const saysNoBc = noBcPhrases.some(phrase => text.includes(phrase)) || /\bno\b.*(birth control|contraception|pill|iud)/.test(text) || /(birth control|contraception).*\bno\b/.test(text);
  if (saysNoBc) {
    out.contraceptionUse = 'No';
  } else if (text.includes('birth control') || text.includes('contraception') || text.includes('pill') || text.includes('iud')) {
    if (text.includes('yes') || text.includes('use') || text.includes('taking') || text.includes('on the pill') || text.includes('have an iud')) out.contraceptionUse = 'Yes';
    if (out.contraceptionUse === 'Yes') {
      if (text.includes('pill')) out.contraceptionPreference.push('Pill');
      if (text.includes('iud')) out.contraceptionPreference.push('IUD');
      if (text.includes('implant')) out.contraceptionPreference.push('Implant');
      if (text.includes('ring')) out.contraceptionPreference.push('Ring');
      if (text.includes('patch')) out.contraceptionPreference.push('Patch');
      if (text.includes('condom')) out.contraceptionPreference.push('Condoms');
      if (text.includes('natural') || text.includes('fam')) out.contraceptionPreference.push('Natural / FAM');
    }
  }
  if (text.includes('under $20') || text.includes('20 dollar')) out.budget = 'Under $20';
  else if (text.includes('20') && text.includes('50')) out.budget = '$20–$50';
  else if (text.includes('50') && text.includes('100')) out.budget = '$50–$100';
  else if (text.includes('100+') || text.includes('over 100')) out.budget = '$100+';
  if (out.frustrations.length === 0) out.frustrations = ['General discomfort'];
  return out;
}

export default function Quiz({ onComplete }) {
  const [completionMode, setCompletionMode] = useState(null); // null | 'step' | 'voice'
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [multiSelections, setMultiSelections] = useState(new Set());
  const [emailValue, setEmailValue] = useState('');

  // Voice flow state
  const [voicePhase, setVoicePhase] = useState('prompt'); // 'prompt' | 'recording' | 'confirm'
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceProfile, setVoiceProfile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);
  const transcriptAccumRef = useRef('');

  const steps = useMemo(() => buildSteps(answers), [answers]);
  const step = steps[currentStep];
  const progress = completionMode === 'step' ? ((currentStep + 1) / steps.length) * 100 : 0;

  const handleSingle = (option) => {
    setAnswers(prev => ({ ...prev, [step.id]: option }));
  };

  const handleSingleNext = () => {
    const newAnswers = { ...answers, [step.id]: answers[step.id] };
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
    if (currentStep < steps.length - 1) {
      setTimeout(() => setCurrentStep(prev => prev + 1), 250);
    } else if (step.id !== 'email') {
      setTimeout(() => onComplete(newAnswers), 250);
    }
  };

  const handleVoiceStart = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setVoiceTranscript('Voice input is not supported in this browser. Try Chrome or Edge.');
      setVoicePhase('confirm');
      return;
    }
    transcriptAccumRef.current = '';
    setVoiceTranscript('');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        const transcript = result[0].transcript;
        // Only append final results to avoid duplicate text (interim results get re-sent as final)
        if (result.isFinal && transcript.trim()) {
          const sep = transcriptAccumRef.current ? ' ' : '';
          transcriptAccumRef.current += sep + transcript.trim();
        }
      }
      setVoiceTranscript(transcriptAccumRef.current);
    };
    rec.onerror = () => {};
    rec.start();
    recognitionRef.current = rec;
    setIsRecording(true);
    setVoicePhase('recording');
  };

  const handleVoiceStop = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
    const parsed = parseTranscriptToProfile(voiceTranscript);
    setVoiceProfile(parsed);
    setVoicePhase('confirm');
  };

  const handleVoiceConfirm = () => {
    onComplete(voiceProfile || parseTranscriptToProfile(voiceTranscript));
  };

  // —— Mode choice (step-by-step vs voice) ——
  if (completionMode === null) {
    return (
      <section className="container animate-fade-in-up" style={{ padding: 'var(--spacing-xl) var(--spacing-md)', maxWidth: '700px' }}>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', textAlign: 'center' }}>How do you want to complete your profile?</h2>
        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: '2rem' }}>Choose the option that works best for you.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button
            type="button"
            className="btn btn-primary"
            style={{ padding: '1.25rem 1.5rem', fontSize: '1.1rem' }}
            onClick={() => { setCompletionMode('step'); }}
          >
            Step-by-step (click through questions)
          </button>
          <button
            type="button"
            className="btn btn-outline"
            style={{ padding: '1.25rem 1.5rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            onClick={() => { setCompletionMode('voice'); setVoicePhase('prompt'); }}
          >
            <span>🎤</span> Speak in my own words (voice)
          </button>
        </div>
      </section>
    );
  }

  // —— Voice flow: guiding questions + record + confirm ——
  if (completionMode === 'voice') {
    if (voicePhase === 'prompt') {
      return (
        <section className="container animate-fade-in-up" style={{ padding: 'var(--spacing-xl) var(--spacing-md)', maxWidth: '720px' }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', textAlign: 'center' }}>Tell us about your health in your own words</h2>
          <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
            Click the microphone and speak. We'll build your profile from what you say. You can cover any of these:
          </p>
          <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem', textAlign: 'left', maxWidth: '520px', marginLeft: 'auto', marginRight: 'auto' }}>
            {VOICE_GUIDING_QUESTIONS.map((q, i) => (
              <li key={i} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.95rem', color: 'var(--color-text-main)' }}>
                {i + 1}. {q}
              </li>
            ))}
          </ul>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <button type="button" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }} onClick={handleVoiceStart}>
              🎤 Start speaking
            </button>
            <button type="button" style={{ color: 'var(--color-text-muted)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setCompletionMode(null)}>
              ← Back to options
            </button>
          </div>
        </section>
      );
    }
    if (voicePhase === 'recording') {
      return (
        <section className="container animate-fade-in-up" style={{ padding: 'var(--spacing-xl) var(--spacing-md)', maxWidth: '720px' }}>
          <p style={{ textAlign: 'center', fontSize: '1.1rem', marginBottom: '1rem' }}>Listening… speak clearly. When you're done, click Stop.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontWeight: '600' }}>You can cover any of these:</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem', color: 'var(--color-text-main)' }}>
                {VOICE_GUIDING_QUESTIONS.map((q, i) => (
                  <li key={i} style={{ padding: '0.35rem 0', borderBottom: '1px solid var(--color-border)' }}>{i + 1}. {q}</li>
                ))}
              </ul>
            </div>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontWeight: '600' }}>Live transcript:</p>
              <div style={{ minHeight: '120px', padding: '1rem', background: 'var(--color-surface-soft)', borderRadius: 'var(--radius-md)', whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>
                {voiceTranscript || '(speak now)'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                <button type="button" className="btn btn-primary" style={{ padding: '1rem 2rem' }} onClick={handleVoiceStop}>
                  Stop and build my profile
                </button>
              </div>
            </div>
          </div>
        </section>
      );
    }
    if (voicePhase === 'confirm' && (voiceProfile || voiceTranscript)) {
      const profile = voiceProfile || parseTranscriptToProfile(voiceTranscript);
      return (
        <section className="container animate-fade-in-up" style={{ padding: 'var(--spacing-xl) var(--spacing-md)', maxWidth: '640px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', textAlign: 'center' }}>Here's your profile — confirm or edit</h2>
          <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>We interpreted what you said. Confirm to see recommendations, or go back to add more.</p>
          <div style={{ background: 'var(--color-surface-soft)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', marginBottom: '1.5rem', border: '1px solid var(--color-border)' }}>
            {profile.age && <p><strong>Age range:</strong> {profile.age}</p>}
            {profile.frustrations?.length > 0 && <p><strong>Concerns:</strong> {profile.frustrations.join(', ')}</p>}
            {profile.preference && <p><strong>Priority:</strong> {profile.preference}</p>}
            {profile.contraceptionUse && <p><strong>Birth control:</strong> {profile.contraceptionUse}</p>}
            {profile.contraceptionPreference?.length > 0 && <p><strong>Contraception type:</strong> {profile.contraceptionPreference.join(', ')}</p>}
            {profile.internalComfort && <p><strong>Internal products:</strong> {profile.internalComfort}</p>}
            {profile.currentUse?.length > 0 && <p><strong>Currently use:</strong> {profile.currentUse.join(', ')}</p>}
            {profile.sensitivities?.length > 0 && <p><strong>Sensitivities:</strong> {profile.sensitivities.join(', ')}</p>}
            {profile.budget && <p><strong>Budget:</strong> {profile.budget}</p>}
            {(!profile.frustrations?.length && !profile.preference && !profile.age) && (
              <p style={{ color: 'var(--color-text-muted)' }}>We didn't catch much — we'll show general recommendations. You can refine your profile later in My Account.</p>
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.75rem' }}>
            <button type="button" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }} onClick={handleVoiceConfirm}>
              Confirm and see recommendations
            </button>
            <button type="button" className="btn btn-outline" onClick={() => { setVoicePhase('prompt'); setVoiceTranscript(''); setVoiceProfile(null); }}>
              Record again
            </button>
            <button type="button" style={{ color: 'var(--color-text-muted)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setCompletionMode(null)}>
              ← Back to options
            </button>
          </div>
        </section>
      );
    }
  }

  return (
    <section className="container animate-fade-in-up" style={{ padding: 'var(--spacing-xl) var(--spacing-md)', maxWidth: '800px' }}>
      <div style={{ width: '100%', background: 'var(--color-border)', height: '6px', borderRadius: 'var(--radius-pill)', marginBottom: '1rem', overflow: 'hidden' }}>
        <div style={{ width: `${progress}%`, height: '100%', background: 'var(--color-primary)', transition: 'width 0.4s ease' }} />
      </div>
      <p style={{ textAlign: 'right', fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-lg)' }}>
        {currentStep + 1} of {steps.length}
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
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {step.options.map((option, idx) => {
                const isSelected = answers[step.id] === option;
                return (
                  <button
                    key={option}
                    type="button"
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
            {answers[step.id] != null && (
              <button
                type="button"
                className="btn btn-primary"
                style={{ marginTop: '1.5rem', alignSelf: 'center' }}
                onClick={handleSingleNext}
              >
                Continue →
              </button>
            )}
          </>
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
