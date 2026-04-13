import React, { useState, useRef, useMemo, useEffect } from 'react';

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
      'Hormonal bloating',
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
      'Pregnancy',
      'Postpartum recovery',
    ]
  },
  {
    id: 'preference',
    question: "What matters most to you in a product?",
    subtitle: "Select all that apply — we'll prioritize products that match",
    type: 'multi',
    options: [
      'Organic/Natural only',
      'Non-hormonal / hormone-free',
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
    id: 'currentProductsDetail',
    question: "Add specific brands, medications, or supplements you use",
    subtitle: "These will be added to Your Ecosystem and monitored for safety. One per line or comma-separated. Optional — skip if you prefer.",
    type: 'customProducts'
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
    id: 'productsToAvoid',
    question: "Any products or ingredients you already know you don't want to use?",
    subtitle: "We'll exclude these from your recommendations (e.g. essential oils, certain brands).",
    type: 'multi',
    options: [
      'Essential oils',
      'Fragrance / scented products',
      'Latex',
      'Synthetic materials',
      'None / I\'m open to suggestions',
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
  "What are your main period or health concerns? (e.g. heavy flow, cramps, irregular cycles, menopause symptoms, pregnancy, postpartum)",
  "Any product preferences? (organic, lower cost, comfort, privacy, sustainability, non-hormonal)",
  "Are you comfortable with internal products like tampons or cups?",
  "What do you use today? (pads, tampons, cup, apps like Clue or Flo)",
  "Any sensitivities or allergies? (fragrance, latex, etc.)",
  "Any products or ingredients you already know you don't want to use? (e.g. essential oils, bad experience with a certain ingredient)",
  "If you're 50 or under: are you using or interested in birth control? What type?"
];

// Parse voice transcript into quiz-answer shape (frustrations, preference, sensitivities, age, contraception, etc.)
function parseTranscriptToProfile(transcript) {
  const raw = (transcript || '').trim();
  const text = raw.toLowerCase();
  const out = {
    frustrations: [],
    preference: [],
    sensitivities: [],
    productsToAvoid: [],
    internalComfort: null,
    currentUse: [],
    budget: null,
    age: null,
    contraceptionUse: null,
    contraceptionPreference: []
  };
  const add = (arr, item) => { if (item && !arr.includes(item)) arr.push(item); };

  // Frustrations — broad phrase coverage so profile reflects what was said
  const frustrationPhrases = [
    { keys: ['heavy', 'heavy flow', 'heavy period', 'really heavy', 'bleeding a lot', 'heavy bleeding'], value: 'Heavy flow' },
    { keys: ['cramp', 'cramping', 'pain', 'painful period', 'bad cramps', 'really painful', 'hurt'], value: 'Painful cramps' },
    { keys: ['bloat', 'bloating', 'hormonal bloating', 'water retention', 'puffy', 'swollen belly', 'period bloat'], value: 'Hormonal bloating' },
    { keys: ['irregular', 'irregular cycle', 'irregular period', 'unpredictable', 'cycle is off', 'not regular'], value: 'Irregular cycles' },
    { keys: ['leak', 'stain', 'leaks', 'leaking', 'accidents', 'bleed through'], value: 'Leaks & staining' },
    { keys: ['discomfort', 'uncomfortable', 'uncomfort'], value: 'General discomfort' },
    { keys: ['safe', 'safety', 'product safe', 'are products safe', 'worried about', 'concerned about safety'], value: 'Not sure if products are safe' },
    { keys: ['uti', 'utis', 'urinary', 'bladder infection', 'bladder'], value: 'Recurrent UTIs' },
    { keys: ['pcos'], value: 'PCOS symptoms' },
    { keys: ['pelvic', 'pelvic pain'], value: 'Pelvic pain' },
    { keys: ['menopause', 'menopausal', 'perimenopause', 'hot flash', 'hot flashes', 'night sweat', 'dryness'], value: 'Menopause symptoms' },
    { keys: ['endometriosis', 'endo'], value: 'Endometriosis' },
    { keys: ['fertility', 'ttc', 'trying to conceive', 'trying to get pregnant', 'conceiving'], value: 'Fertility / TTC' },
    { keys: ['pregnant', 'pregnancy', 'expecting', 'prenatal'], value: 'Pregnancy' },
    { keys: ['postpartum', 'post partum', 'after birth', 'new mom', 'new mother', 'recovery after birth', 'breastfeeding', 'nursing', 'lactation'], value: 'Postpartum recovery' }
  ];
  frustrationPhrases.forEach(({ keys = [], value }) => {
    if (value && keys.some(k => text.includes(k)) && !out.frustrations.includes(value)) out.frustrations.push(value);
  });

  // Preference — can select multiple (e.g. organic AND non-hormonal)
  const prefAdd = (p) => { if (p && !out.preference.includes(p)) out.preference.push(p); };
  if (text.includes('organic') || text.includes('natural') || text.includes('clean') || text.includes('chemical')) prefAdd('Organic/Natural only');
  if (text.includes('non-hormonal') || text.includes('nonhormonal') || text.includes('hormone-free') || text.includes('hormone free') || text.includes('no hormones')) prefAdd('Non-hormonal / hormone-free');
  if (text.includes('cost') || text.includes('cheap') || text.includes('budget') || text.includes('affordable') || text.includes('inexpensive')) prefAdd('Lower cost');
  if (text.includes('comfort') || text.includes('convenience') || text.includes('easy') || text.includes('convenient')) prefAdd('Comfort/Convenience');
  if (text.includes('privacy') || text.includes('data') || text.includes('don\'t share')) prefAdd('Privacy & data security');
  if (text.includes('sustainab') || text.includes('eco') || text.includes('zero waste') || text.includes('environment') || text.includes('reusable')) prefAdd('Sustainability/Zero-waste');

  // Sensitivities
  if (text.includes('fragrance') || text.includes('scent') || text.includes('scented') || text.includes('perfume')) add(out.sensitivities, 'Fragrance sensitivity');
  if (text.includes('latex')) add(out.sensitivities, 'Latex allergy');
  if (text.includes('synthetic') || text.includes('plastic') || text.includes('chemicals')) add(out.sensitivities, 'Synthetic materials');
  if (text.includes('allerg') || text.includes('allergic')) add(out.sensitivities, 'Other allergies');
  if (text.includes('none') && (text.includes('sensitivit') || text.includes('allerg'))) add(out.sensitivities, 'None that I know of');

  // Products/ingredients to avoid (don't want to use, bad experience, etc.)
  if (text.includes('essential oil') || text.includes('essential oils') || (text.includes('bad experience') && (text.includes('oil') || text.includes('mint') || text.includes('lavender') || text.includes('herbal')))) add(out.productsToAvoid, 'Essential oils');
  if (text.includes('don\'t want') || text.includes('dont want') || text.includes('won\'t use') || text.includes('wont use') || text.includes('avoid') || text.includes('don\'t use') || text.includes('dont use')) {
    if (text.includes('fragrance') || text.includes('scent')) add(out.productsToAvoid, 'Fragrance / scented products');
    if (text.includes('latex')) add(out.productsToAvoid, 'Latex');
    if (text.includes('synthetic')) add(out.productsToAvoid, 'Synthetic materials');
  }
  if (text.includes('none') && (text.includes('don\'t want') || text.includes('open to'))) add(out.productsToAvoid, 'None / I\'m open to suggestions');

  // Internal comfort
  if (text.includes('tampon') || text.includes('cup') || text.includes('disc') || text.includes('internal')) {
    if (text.includes('comfortable') || text.includes('yes') || text.includes('ok') || text.includes('fine') || text.includes('use tampons') || text.includes('use a cup')) out.internalComfort = 'Yes';
    else if (text.includes('not') || text.includes('no ') || text.includes("don't") || text.includes('uncomfortable') || text.includes('never')) out.internalComfort = 'No';
    else if (text.includes('open to try') || text.includes('open to trying') || text.includes('willing to try')) out.internalComfort = 'Open to trying';
  }
  if (!out.internalComfort && (text.includes('open to try') || text.includes('might try'))) out.internalComfort = 'Open to trying';

  // Current use (avoid duplicates)
  if (text.includes('pad') || text.includes('pads')) add(out.currentUse, 'Pads');
  if (text.includes('tampon')) add(out.currentUse, 'Tampons');
  if (text.includes('menstrual cup') || (text.includes('cup') && (text.includes('period') || text.includes('menstrual') || text.includes('diva')))) add(out.currentUse, 'Menstrual cup');
  if (text.includes('disc') || text.includes('flex')) add(out.currentUse, 'Menstrual disc');
  if (text.includes('period underwear') || text.includes('thinx') || text.includes('period pant')) add(out.currentUse, 'Period underwear');
  if (text.includes('supplement')) add(out.currentUse, 'Supplements');
  if (text.includes('clue') || text.includes('flo') || text.includes('stardust') || text.includes('period app') || text.includes('tracking app')) add(out.currentUse, 'Flo / Clue / Stardust');
  if (text.includes('apple health') || text.includes('garmin') || text.includes('fitbit') || text.includes('fitness tracker')) add(out.currentUse, 'Apple Health / Garmin / Fitbit');
  if (text.includes('wisp') || text.includes('nurx') || text.includes('telehealth') || text.includes('online doctor')) add(out.currentUse, 'Telehealth (Wisp, Nurx, etc.)');
  if (text.includes('nothing') || text.includes('none') && (text.includes('use') || text.includes('currently'))) add(out.currentUse, 'None');

  // Age — more patterns and number ranges
  if (text.match(/\bunder\s*25\b/) || text.match(/\b(19|20|21|22|23|24)\s*(years?|y\.?o\.?|and)/) || text.includes('early 20') || text.includes('early twenties')) out.age = 'Under 25';
  else if (text.match(/\b(25|26|27|28|29|30|31|32|33|34)\s*(years?|y\.?o\.?|and)/) || text.includes('late 20') || text.includes('early 30') || text.includes('twenties') || text.includes('thirties')) out.age = '25-34';
  else if (text.match(/\b(35|36|37|38|39|40|41|42|43|44)\s*(years?|y\.?o\.?|and)/) || text.includes('mid 30') || text.includes('late 30') || text.includes('early 40')) out.age = '35-44';
  else if (text.match(/\b(45|46|47|48|49|50)\s*(years?|y\.?o\.?|and)/) || text.includes('late 40') || text.includes('around 50')) out.age = '45-50';
  else if (text.match(/\b(51|52|53|54|55)\s*(years?|y\.?o\.?|and)/)) out.age = '51-55';
  else if (text.match(/\b(56|57|58|59|60|61|62|63|64|65)\s*(years?|y\.?o\.?|and)/) || text.includes('60') || text.includes('menopause') || text.includes('postmenopausal')) out.age = '56+';

  // Birth control
  const noBcPhrases = ["don't use", "do not use", "not using", "no birth control", "not on birth control", "not interested", "no contraception", "not taking", "don't take", "no i'm not", "no im not", "nope", " no ", "stopped", "off the pill", "no longer"];
  const saysNoBc = noBcPhrases.some(phrase => text.includes(phrase)) || /\bno\b.*(birth control|contraception|pill|iud)/.test(text) || /(birth control|contraception).*\bno\b/.test(text);
  if (saysNoBc) {
    out.contraceptionUse = 'No';
  } else if (text.includes('birth control') || text.includes('contraception') || text.includes('pill') || text.includes('iud') || text.includes('implant') || text.includes('ring') || text.includes('patch')) {
    if (text.includes('yes') || text.includes('use') || text.includes('taking') || text.includes('on the pill') || text.includes('have an iud') || text.includes('have iud') || text.includes('using')) out.contraceptionUse = 'Yes';
    if (out.contraceptionUse === 'Yes') {
      if (text.includes('pill')) add(out.contraceptionPreference, 'Pill');
      if (text.includes('iud')) add(out.contraceptionPreference, 'IUD');
      if (text.includes('implant')) add(out.contraceptionPreference, 'Implant');
      if (text.includes('ring') || text.includes('nuvaring')) add(out.contraceptionPreference, 'Ring');
      if (text.includes('patch')) add(out.contraceptionPreference, 'Patch');
      if (text.includes('condom')) add(out.contraceptionPreference, 'Condoms');
      if (text.includes('natural') || text.includes('fam') || text.includes('tracking')) add(out.contraceptionPreference, 'Natural / FAM');
    }
  }

  // Budget
  if (text.includes('under $20') || text.includes('under 20') || text.includes('20 dollar') || text.includes('cheap')) out.budget = 'Under $20';
  else if ((text.includes('20') && text.includes('50')) || text.includes('$20') || text.includes('$50')) out.budget = '$20–$50';
  else if ((text.includes('50') && text.includes('100')) || text.includes('$50') || text.includes('$100')) out.budget = '$50–$100';
  else if (text.includes('100+') || text.includes('over 100') || text.includes('over $100')) out.budget = '$100+';

  // Only default frustrations when transcript is empty or we truly got nothing
  if (out.frustrations.length === 0 && raw.length > 20) {
    // Leave empty so user sees what we missed and can edit
  } else if (out.frustrations.length === 0) {
    out.frustrations = ['General discomfort'];
  }
  return out;
}

/** Pause after picking a single-select option so the choice registers before advancing */
const AUTO_ADVANCE_SINGLE_MS = 900;

export default function Quiz({ onComplete }) {
  const [completionMode, setCompletionMode] = useState(null); // null | 'step' | 'voice'
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [multiSelections, setMultiSelections] = useState(new Set());
  const [emailValue, setEmailValue] = useState('');
  const [customProductsInput, setCustomProductsInput] = useState({ brands: '', medications: '', supplements: '' });
  const singleAdvanceTimerRef = useRef(null);

  // Voice flow state
  const [voicePhase, setVoicePhase] = useState('prompt'); // 'prompt' | 'recording' | 'confirm'
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceProfile, setVoiceProfile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [appendToTranscript, setAppendToTranscript] = useState(false); // true when "Speak to add more" from confirm
  const [liveRecordingText, setLiveRecordingText] = useState(''); // current session's text so "Adding:" re-renders
  const recognitionRef = useRef(null);
  const transcriptAccumRef = useRef('');

  const steps = useMemo(() => buildSteps(answers), [answers]);
  const step = steps[currentStep];
  const progress = completionMode === 'step' ? ((currentStep + 1) / steps.length) * 100 : 0;

  useEffect(() => {
    if (completionMode !== 'step' || !step || step.type !== 'multi') return;
    const v = answers[step.id];
    setMultiSelections(new Set(Array.isArray(v) ? v : []));
  }, [currentStep, step?.id, completionMode]);

  useEffect(() => {
    return () => {
      if (singleAdvanceTimerRef.current) {
        clearTimeout(singleAdvanceTimerRef.current);
        singleAdvanceTimerRef.current = null;
      }
    };
  }, [currentStep]);

  const handleBack = () => {
    if (currentStep <= 0) return;
    if (singleAdvanceTimerRef.current) {
      clearTimeout(singleAdvanceTimerRef.current);
      singleAdvanceTimerRef.current = null;
    }
    setCurrentStep((prev) => prev - 1);
  };

  const handleSingle = (option) => {
    if (!step || step.type !== 'single') return;
    if (singleAdvanceTimerRef.current) {
      clearTimeout(singleAdvanceTimerRef.current);
      singleAdvanceTimerRef.current = null;
    }
    const stepId = step.id;
    const newAnswers = { ...answers, [stepId]: option };
    setAnswers(newAnswers);
    const stepIndex = currentStep;
    const nextSteps = buildSteps(newAnswers);
    singleAdvanceTimerRef.current = setTimeout(() => {
      singleAdvanceTimerRef.current = null;
      if (stepIndex < nextSteps.length - 1) {
        setCurrentStep((c) => c + 1);
      } else if (stepId !== 'email') {
        onComplete(newAnswers);
      }
    }, AUTO_ADVANCE_SINGLE_MS);
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

  // Parse comma or newline separated list into trimmed non-empty strings
  function parseList(text) {
    if (!text || typeof text !== 'string') return [];
    return text.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
  }

  const handleCustomProductsConfirm = () => {
    const currentProductBrands = parseList(customProductsInput.brands);
    const currentMedications = parseList(customProductsInput.medications);
    const currentSupplements = parseList(customProductsInput.supplements);
    const newAnswers = {
      ...answers,
      currentProductsDetail: true,
      currentProductBrands,
      currentMedications,
      currentSupplements
    };
    setAnswers(newAnswers);
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

  const handleVoiceStart = (append = false) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setVoiceTranscript('Voice input is not supported in this browser. Try Chrome or Edge.');
      setVoicePhase('confirm');
      return;
    }
    setAppendToTranscript(append);
    transcriptAccumRef.current = '';
    setLiveRecordingText('');
    if (!append) setVoiceTranscript('');
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
      setLiveRecordingText(transcriptAccumRef.current);
      if (!append) setVoiceTranscript(transcriptAccumRef.current);
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
    const nextTranscript = appendToTranscript
      ? (voiceTranscript + ' ' + transcriptAccumRef.current).trim()
      : voiceTranscript;
    if (appendToTranscript) {
      setVoiceTranscript(nextTranscript);
      setAppendToTranscript(false);
    }
    setVoiceProfile(parseTranscriptToProfile(nextTranscript));
    setVoicePhase('confirm');
  };

  const handleVoiceConfirm = () => {
    onComplete(voiceProfile || parseTranscriptToProfile(voiceTranscript));
  };

  // When user edits the transcript in confirm phase, re-parse to update the profile
  useEffect(() => {
    if (voicePhase === 'confirm' && voiceTranscript !== undefined) {
      setVoiceProfile(parseTranscriptToProfile(voiceTranscript));
    }
  }, [voicePhase, voiceTranscript]);

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
          <p style={{ textAlign: 'center', fontSize: '1.1rem', marginBottom: '1rem' }}>
            {appendToTranscript ? 'Listening… add more. When you\'re done, click Stop to append to your transcript.' : 'Listening… speak clearly. When you\'re done, click Stop.'}
          </p>
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
              {appendToTranscript && voiceTranscript && (
                <>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem', fontWeight: '600' }}>Current transcript:</p>
                  <div style={{ minHeight: '60px', padding: '0.75rem', background: 'var(--color-surface-soft)', borderRadius: 'var(--radius-md)', whiteSpace: 'pre-wrap', fontSize: '0.85rem', marginBottom: '0.75rem', border: '1px solid var(--color-border)' }}>
                    {voiceTranscript}
                  </div>
                </>
              )}
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontWeight: '600' }}>{appendToTranscript ? 'Adding:' : 'Live transcript:'}</p>
              <div style={{ minHeight: '120px', padding: '1rem', background: 'var(--color-surface-soft)', borderRadius: 'var(--radius-md)', whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>
                {appendToTranscript ? (liveRecordingText || '(speak now)') : (voiceTranscript || liveRecordingText || '(speak now)')}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                <button type="button" className="btn btn-primary" style={{ padding: '1rem 2rem' }} onClick={handleVoiceStop}>
                  {appendToTranscript ? 'Stop and add to transcript' : 'Stop and build my profile'}
                </button>
              </div>
            </div>
          </div>
        </section>
      );
    }
    if (voicePhase === 'confirm' && (voiceProfile || voiceTranscript !== undefined)) {
      const profile = voiceProfile || parseTranscriptToProfile(voiceTranscript);
      return (
        <section className="container animate-fade-in-up" style={{ padding: 'var(--spacing-xl) var(--spacing-md)', maxWidth: '960px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', textAlign: 'center' }}>Your transcript & health profile</h2>
          <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            Edit the transcript (type or speak to add more) — the profile updates as you change it. Confirm when it looks right.
          </p>
          <div className="quiz-confirm-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'stretch', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '280px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontWeight: '600' }}>Transcript (edit or speak to update)</label>
              <textarea
                value={voiceTranscript}
                onChange={(e) => setVoiceTranscript(e.target.value)}
                placeholder="Your recorded words will appear here. You can type to fix or add details."
                style={{
                  flex: 1,
                  minHeight: '260px',
                  padding: '1rem',
                  background: 'var(--color-surface-soft)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.95rem',
                  lineHeight: 1.5,
                  resize: 'vertical',
                  fontFamily: 'var(--font-body)',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                className="btn btn-outline"
                style={{ marginTop: '0.75rem', alignSelf: 'flex-start' }}
                onClick={() => { setVoicePhase('recording'); handleVoiceStart(true); }}
              >
                🎤 Speak to add more
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '280px' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontWeight: '600' }}>Health profile (from transcript)</p>
              <div style={{ flex: 1, background: 'var(--color-surface-soft)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', overflowY: 'auto' }}>
                {profile.age && <p style={{ marginBottom: '0.5rem' }}><strong>Age range:</strong> {profile.age}</p>}
                {profile.frustrations?.length > 0 && <p style={{ marginBottom: '0.5rem' }}><strong>Concerns:</strong> {profile.frustrations.join(', ')}</p>}
                {profile.preference?.length > 0 && <p style={{ marginBottom: '0.5rem' }}><strong>Priority:</strong> {Array.isArray(profile.preference) ? profile.preference.join(', ') : profile.preference}</p>}
                {profile.contraceptionUse && <p style={{ marginBottom: '0.5rem' }}><strong>Birth control:</strong> {profile.contraceptionUse}</p>}
                {profile.contraceptionPreference?.length > 0 && <p style={{ marginBottom: '0.5rem' }}><strong>Contraception type:</strong> {profile.contraceptionPreference.join(', ')}</p>}
                {profile.internalComfort && <p style={{ marginBottom: '0.5rem' }}><strong>Internal products:</strong> {profile.internalComfort}</p>}
                {profile.currentUse?.length > 0 && <p style={{ marginBottom: '0.5rem' }}><strong>Currently use:</strong> {profile.currentUse.join(', ')}</p>}
                {profile.sensitivities?.length > 0 && <p style={{ marginBottom: '0.5rem' }}><strong>Sensitivities:</strong> {profile.sensitivities.join(', ')}</p>}
                {profile.productsToAvoid?.length > 0 && <p style={{ marginBottom: '0.5rem' }}><strong>Prefer to avoid:</strong> {profile.productsToAvoid.join(', ')}</p>}
                {profile.budget && <p style={{ marginBottom: '0.5rem' }}><strong>Budget:</strong> {profile.budget}</p>}
                {(!profile.frustrations?.length && !profile.preference?.length && !profile.age && !profile.internalComfort && !profile.currentUse?.length) && (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Add or edit text in the transcript so we can build your profile. Mention age, concerns, what you use, and preferences.</p>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.75rem' }}>
            <button type="button" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }} onClick={handleVoiceConfirm}>
              Confirm and open my ecosystem
            </button>
            <button type="button" className="btn btn-outline" onClick={() => { setVoicePhase('prompt'); setVoiceTranscript(''); setVoiceProfile(null); setAppendToTranscript(false); }}>
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

  const showTopContinue = step.type === 'multi' || step.type === 'customProducts';

  return (
    <section className="container animate-fade-in-up" style={{ padding: 'var(--spacing-xl) var(--spacing-md)', maxWidth: '800px' }}>
      <div style={{ width: '100%', background: 'var(--color-border)', height: '6px', borderRadius: 'var(--radius-pill)', marginBottom: 'var(--spacing-lg)', overflow: 'hidden' }}>
        <div style={{ width: `${progress}%`, height: '100%', background: 'var(--color-primary)', transition: 'width 0.4s ease' }} />
      </div>

      <div className="card" style={{ minHeight: '380px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', textAlign: 'center' }}>
          {step.question}
        </h2>
        {step.subtitle && (
          <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-md)', fontSize: '1rem' }}>
            {step.subtitle}
          </p>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            marginBottom: 'var(--spacing-lg)',
            minHeight: '2.25rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: '0 0 auto', minWidth: '4.5rem' }}>
            {currentStep > 0 ? (
              <button
                type="button"
                onClick={handleBack}
                style={{
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  color: 'var(--color-primary)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.35rem 0',
                  textDecoration: 'none',
                }}
              >
                ← Back
              </button>
            ) : null}
          </div>
          <p style={{ margin: 0, flex: '1 1 auto', textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-muted)', fontWeight: '500', minWidth: '5rem' }}>
            {currentStep + 1} of {steps.length}
          </p>
          <div style={{ flex: '0 0 auto', minWidth: '4.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            {showTopContinue && step.type === 'multi' && (
              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: '0.45rem 0.9rem', fontSize: '0.9rem', opacity: multiSelections.size === 0 ? 0.5 : 1 }}
                disabled={multiSelections.size === 0}
                onClick={handleMultiConfirm}
              >
                Continue →
              </button>
            )}
            {showTopContinue && step.type === 'customProducts' && (
              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: '0.45rem 0.9rem', fontSize: '0.9rem' }}
                onClick={handleCustomProductsConfirm}
              >
                Continue →
              </button>
            )}
          </div>
        </div>

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
            <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '1rem', marginBottom: 0 }}>
              Next step opens shortly after you choose. Tap <strong>Back</strong> above to edit a previous answer.
            </p>
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
          </>
        )}

        {step.type === 'customProducts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '480px', margin: '0 auto', width: '100%' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Brands or products (e.g. Always, Thinx, Clue)</label>
            <textarea
              placeholder="Always, Thinx, Flo app..."
              value={customProductsInput.brands}
              onChange={e => setCustomProductsInput(prev => ({ ...prev, brands: e.target.value }))}
              rows={2}
              style={{
                padding: '0.75rem 1rem',
                fontSize: '1rem',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                outline: 'none',
                fontFamily: 'var(--font-body)',
                resize: 'vertical'
              }}
            />
            <label style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Medications (e.g. birth control, metformin)</label>
            <textarea
              placeholder="Birth control pill, Synthroid..."
              value={customProductsInput.medications}
              onChange={e => setCustomProductsInput(prev => ({ ...prev, medications: e.target.value }))}
              rows={2}
              style={{
                padding: '0.75rem 1rem',
                fontSize: '1rem',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                outline: 'none',
                fontFamily: 'var(--font-body)',
                resize: 'vertical'
              }}
            />
            <label style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Supplements (e.g. Ritual, magnesium, vitamin D)</label>
            <textarea
              placeholder="Ritual vitamins, magnesium, vitamin D..."
              value={customProductsInput.supplements}
              onChange={e => setCustomProductsInput(prev => ({ ...prev, supplements: e.target.value }))}
              rows={2}
              style={{
                padding: '0.75rem 1rem',
                fontSize: '1rem',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                outline: 'none',
                fontFamily: 'var(--font-body)',
                resize: 'vertical'
              }}
            />
          </div>
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
              Skip — open ecosystem without saving
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
