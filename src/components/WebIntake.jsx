import { useEffect, useMemo, useRef, useState } from 'react';
import { mapIntakeToLegacyQuizProfile } from '../utils/healthIntake.js';
import { saveHealthIntakeForCurrentUser } from '../utils/healthIntakeStore.js';
import { defineOption } from '../mobile/data/glossary.js';
import {
  ALLERGY_STATUS, SAFETY_ANSWER_LABELS, CONDITION_EXCLUSIVE, AVOID_LABELS, CHECKPOINT_STEP, LIFE_STAGE_EXCLUSIVE, MEDICATION_STATUS, URGENT_STATUS,
  firstOptionalResumeStepId, firstUnansweredStepId, isStepAnswered, markSkipped, splitIntakeSteps, toggleLifeStageSelection,
  ALLERGIES, AVOID_GROUPS, AVOID_INGREDIENTS, AVOID_PAIRS, BRAND_OPENNESS, BREASTFEEDING_STATUS,
  CONDITIONS, EMPTY, FOLLOWUP_QUESTIONS, FREE_TEXT_PROMPTS, FSA_HSA, INTAKE_DRAFT_KEY, LARGE_PURCHASE_FREQUENCY, LIFE_STAGES,
  LIFE_STAGE_LABELS, LIFE_STAGE_VALUE_BY_LABEL, MEDICATION_SUGGESTIONS, MIDLIFE_LIFE_STAGES, PERIMENOPAUSE_LAST_PERIOD,
  PERIOD_FLOW, PERIOD_PAIN, POSTPARTUM_TIMING, PREGNANCY_TRIMESTER, PRICE_RANGES, PRODUCT_FORMATS,
  STOP_REASONS, SUPPORT_GROUPS, VASOMOTOR_TIMING_OPTIONS, needsVasomotorTiming, toggleVasomotorTiming,
  UTI_FREQUENCY, buildSnapshot, isMultiSelectStep,
  getLifeStages, isMinorAge, normalizeSuggestion, readIntakeDraft, reconstructIntakeFromSnapshot,
  requiredReady, missingAnswerHint, FIRST_NAME_MAX, AGE_MIN, AGE_MAX, asksBreastfeedingOnTiming, ttcDurationOptions, resumeStepId, withSavedOption, isValidUsZip, setPerimenopausePeriods, syncPerimenopausePeriods,
  LEARN_INTERESTS,
} from '../mobile/data/intakeModel.js';
import { BRAND_SUGGESTIONS, CATALOG_PRODUCT_NAMES, PRODUCT_OR_BRAND_SUGGESTIONS } from '../mobile/data/intakeCatalog.js';
import { WEB_FOLLOWUP_STEP_IDS } from '../mobile/data/quizDraftProgress.js';
import SmartSearchInput from './search/SmartSearchInput.jsx';
import { rankSearchOptions as rankedSuggestions, matchesSearchOption } from '../utils/search/index.js';
import { commonNeedOptions } from '../matching/commonNeeds.js';
import '../styles/loop-a-quiz.css';
import { GOALS, HELP_TOPICS, NOTHING_SPECIFIC, ONBOARDING_SCREENS, SOMETHING_ELSE, getOnboardingSteps, onboardingProgress, supportGroupsForTopics } from '../mobile/data/onboardingFlow.js';
import { CATEGORIES } from '../health/metrics.js';
import ReadyReveal from './onboarding/ReadyReveal.jsx';
import { QuizFrame, QuizBlock, Chips as KitChips, Rows as KitRows, SubQuestion, GlossaryCard } from './quiz/QuizKit.jsx';
import { isShortHelper } from './quiz/quizText.js';
import MedicalNote from './MedicalNote.jsx';
import { trackQuizStep } from '../utils/funnelEvents.js';
import { proNow } from '../pro/proDoor.js';
import { rememberProReturn } from '../pro/paywall.js';
import '../styles/onboarding.css';
import './WebIntake.audit.css';
// Questions whose options have a plain meaning on press-and-hold (glossary.js): the answers get data-tour="quiz-hold" and the quiz tip points there.
const HOLD_TIP_TYPES = new Set(['aboutYou', 'lifeStage', 'support', 'topics', 'conditions', 'allergies', 'formats', 'price', 'avoidOnly', 'wantOnly', 'fsaHsa']);
// Website-only conditions that change what is safe (condition research, Oct 17).
const WEB_EXTRA_CONDITIONS = ['Kidney disease', 'Bleeding or clotting disorder', 'History of blood clots', 'Heart disease', 'Liver disease', 'Stomach ulcer or stomach bleeding', 'Asthma'];

// The website's quiz. Same questions, order, branching and saved answers as
// the app (all of that lives in mobile/data/intakeModel.js); only the layout
// and controls are built for a browser.

/* ------------------------------ Controls ------------------------------ */

// Answer controls come from the shared quiz kit (same look as the app).
function Chips({ items, selected = [], onToggle, labels = {}, small = false, single = false, label, expand, muted }) {
  return <KitChips items={items} selected={selected} onToggle={onToggle} labels={labels} compact={small} single={single} label={label} expand={expand} muted={muted} />;
}

function Rows({ options, value, onChange, labels = {}, label }) {
  return <KitRows options={options} value={value} onChange={onChange} labels={labels} label={label} />;
}

function Tiles({ items, selected = [], onToggle, labels = {}, label }) {
  return <KitChips items={items} selected={selected} onToggle={onToggle} labels={labels} label={label} />;
}

function Search({ value, onChange, placeholder }) {
  return <label className="qz-search">
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
    <SmartSearchInput value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
    {value && <button type="button" aria-label="Clear" onClick={() => onChange('')}>×</button>}
  </label>;
}

function AddCustom({ query, options, onAdd }) {
  const value = query.trim().replace(/\s+/g, ' ');
  if (value.length < 2 || options.some((item) => item.toLowerCase() === value.toLowerCase())) return null;
  return <button type="button" className="qz-chip is-dashed" onClick={() => onAdd(value)}>+ Add “{value}”</button>;
}

function Tokens({ values, onChange, placeholder, suggestions = [], limit = 8 }) {
  const [draft, setDraft] = useState('');
  const matches = useMemo(() => rankedSuggestions(draft, suggestions.filter((o) => !values.some((v) => normalizeSuggestion(v) === normalizeSuggestion(o))), limit), [draft, suggestions, values, limit]);
  const add = (raw) => {
    const next = String(raw || '').trim();
    if (!next || values.some((v) => normalizeSuggestion(v) === normalizeSuggestion(next))) return;
    onChange([...values, next]);
    setDraft('');
  };
  return <div className="qz-tokens-wrap">
    <label className="qz-search">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
      <SmartSearchInput vocabulary={suggestions} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && draft.trim()) { e.preventDefault(); add(draft); } }} placeholder={placeholder} aria-label={placeholder} />
    </label>
    {draft.trim() && <div className="qz-suggest" role="listbox">
      <button type="button" className="is-add" onClick={() => add(draft)}>+ Add “{draft.trim()}”</button>
      {matches.map((m) => <button type="button" key={m} onClick={() => add(m)}>{m}</button>)}
    </div>}
    {values.length > 0 && <div className="qz-tokens">{values.map((v, i) => <span key={`${v}-${i}`} className="qz-token">{v}<button type="button" aria-label={`Remove ${v}`} onClick={() => onChange(values.filter((_, idx) => idx !== i))}>×</button></span>)}</div>}
  </div>;
}

function AddOwn({ placeholder, onAdd }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  if (!open) return <button type="button" className="qz-chip is-dashed" onClick={() => setOpen(true)}>+ Add your own</button>;
  const submit = () => { if (text.trim().length >= 2) onAdd(text.trim()); setText(''); setOpen(false); };
  return <form className="qz-addown" onSubmit={(e) => { e.preventDefault(); submit(); }}>
    <input autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} maxLength={60} onBlur={() => { if (!text.trim()) setOpen(false); }} />
    <button type="submit" disabled={text.trim().length < 2}>Add</button>
  </form>;
}

function AgeField({ value, onChange, underage, onOpenGate }) {
  // P1-28: one control, the slider the founder asked for (no second text box).
  // A native range input: arrow keys, Page Up/Down and Home/End move it, a tap
  // anywhere on the track jumps there (WCAG 2.5.7 single-pointer alternative),
  // and the big readout shows the value. − and + nudge it one year for anyone
  // who finds dragging to an exact number hard.
  const n = Number.parseInt(value, 10);
  const set = Number.isFinite(n);
  // One range with the app (intakeModel AGE_MIN / AGE_MAX).
  const slider = set ? Math.min(AGE_MAX, Math.max(AGE_MIN, n)) : AGE_MIN;
  const label = set ? (n >= AGE_MAX ? `${AGE_MAX} or older` : `${n}`) : 'Not set';
  const nudge = (d) => onChange(String(Math.min(AGE_MAX, Math.max(AGE_MIN, (set ? slider : AGE_MIN - 1) + d))));
  return <div className={`qz-age is-slider${underage ? ' is-under' : ''}`}>
    <div className="qz-age-top">
      <label className="qz-age-label" htmlFor="qz-age-range">Your age</label>
      <output className={`qz-age-out${set ? '' : ' is-empty'}`} htmlFor="qz-age-range" aria-live="polite">{set ? <>{label}{n < AGE_MAX && <small> years</small>}</> : 'Slide to set'}</output>
    </div>
    <div className={`qz-age-slide${set ? '' : ' is-empty'}`}>
      <button type="button" className="qz-age-step" aria-label="One year younger" onClick={() => nudge(-1)} disabled={set && slider <= AGE_MIN}>−</button>
      <input id="qz-age-range" type="range" min={AGE_MIN} max={AGE_MAX} step={1} value={slider} name="age"
        aria-valuetext={set ? (n >= AGE_MAX ? `${AGE_MAX} or older` : `${n} years`) : 'Not set'} aria-describedby={underage ? 'qz-age-alert' : 'qz-age-ends'} aria-invalid={underage || undefined}
        style={{ '--qz-fill': `${((slider - AGE_MIN) / (AGE_MAX - AGE_MIN)) * 100}%` }}
        onChange={(e) => onChange(String(e.target.value))} />
      <button type="button" className="qz-age-step" aria-label="One year older" onClick={() => nudge(1)} disabled={set && slider >= AGE_MAX}>+</button>
    </div>
    <p className="qz-age-ends" id="qz-age-ends"><span>{AGE_MIN}</span><span>{AGE_MAX}+</span></p>
    {/* Team direction, Oct 24 (section 32): type it, or use the slider. Whichever is faster. */}
    <label className="qz-age-type">Or type it <input type="text" inputMode="numeric" autoComplete="off" maxLength={3} value={value} placeholder="e.g. 34" onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 3))} /></label>
    {underage
      ? <p className="qz-alert" id="qz-age-alert">ayna is for people 18 and over. <button type="button" onClick={onOpenGate}>What you can do instead</button></p>
      : <button type="button" className="qz-age-under" onClick={onOpenGate}>Under 18?</button>}
  </div>;
}

function ProductHistory({ products, onChange }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(null);
  const suggestions = useMemo(() => {
    const added = new Set(products.map((p) => normalizeSuggestion(p.name)));
    return rankedSuggestions(query, CATALOG_PRODUCT_NAMES.filter((n) => !added.has(normalizeSuggestion(n))), 6);
  }, [query, products]);
  const add = (name) => {
    const t = String(name || '').trim();
    if (!t || products.some((p) => normalizeSuggestion(p.name) === normalizeSuggestion(t))) return;
    onChange([...products, { name: t, current: '', worked: '', reaction: '', reactionText: '', stopReasons: [], stopOther: '' }]);
    setQuery('');
    setOpen(products.length);
  };
  const update = (i, patch) => onChange(products.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  const one = (v) => (v ? [v] : []);
  return <div className="qz-history">
    <label className="qz-search">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
      <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && query.trim()) { e.preventDefault(); add(query); } }} placeholder="Search products you've used" aria-label="Search products" />
    </label>
    {query.trim() && <div className="qz-suggest"><button type="button" className="is-add" onClick={() => add(query)}>+ Add “{query.trim()}”</button>{suggestions.map((s) => <button type="button" key={s} onClick={() => add(s)}>{s}</button>)}</div>}
    {products.map((p, i) => {
      const expanded = open === i;
      const summary = [p.current && (p.current === 'Yes' ? 'Using now' : 'Stopped'), p.worked, p.reaction && p.reaction !== 'No' ? `${p.reaction} reaction` : ''].filter(Boolean);
      return <div key={`${p.name}-${i}`} className={`qz-hcard${expanded ? ' is-open' : ''}`}>
        <button type="button" className="qz-hcard-head" aria-expanded={expanded} onClick={() => setOpen(expanded ? null : i)}>
          <span><strong>{p.name}</strong><small>{summary.length ? summary.join(' · ') : 'Add details (optional)'}</small></span><i aria-hidden="true">{expanded ? '−' : '+'}</i>
        </button>
        {expanded && <div className="qz-hcard-body">
          <div><b>Using it now?</b><Chips small single items={['Yes', 'No']} selected={one(p.current)} onToggle={(v) => update(i, { current: v })} /></div>
          <div><b>Did it help?</b><Chips small single items={['Helped a lot', 'Helped somewhat', 'No difference', 'Made it worse', 'Not sure']} selected={one(p.worked)} onToggle={(v) => update(i, { worked: v })} /></div>
          <div><b>Any reaction?</b><Chips small single items={['No', 'Mild', 'Serious', 'Not sure']} selected={one(p.reaction)} onToggle={(v) => update(i, { reaction: v })} /></div>
          {['Mild', 'Serious'].includes(p.reaction) && <input className="qz-input" value={p.reactionText} onChange={(e) => update(i, { reactionText: e.target.value })} placeholder="What happened? (optional)" aria-label="What happened" />}
          {p.current === 'No' && <div><b>Why did you stop?</b><Chips small items={STOP_REASONS} selected={p.stopReasons || []} onToggle={(r) => update(i, { stopReasons: (p.stopReasons || []).includes(r) ? p.stopReasons.filter((x) => x !== r) : [...(p.stopReasons || []), r] })} /></div>}
          <button type="button" className="qz-link-danger" onClick={() => { onChange(products.filter((_, idx) => idx !== i)); setOpen(null); }}>Remove</button>
        </div>}
      </div>;
    })}
  </div>;
}

function TrustRank({ order, onChange, onTouch }) {
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
    onTouch();
  };
  const dragFrom = useRef(null);
  return <ol className="qz-rank">
    {order.map((item, i) => <li key={item} draggable onDragStart={() => { dragFrom.current = i; }} onDragOver={(e) => e.preventDefault()}
      onDrop={() => { const from = dragFrom.current; if (from == null || from === i) return; const next = [...order]; const [x] = next.splice(from, 1); next.splice(i, 0, x); onChange(next); onTouch(); dragFrom.current = null; }}
      className={`tone-${i}`}>
      <b>{i + 1}</b><span>{item}</span>
      <span className="qz-rank-moves">
        <button type="button" aria-label={`Move ${item} up`} disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
        <button type="button" aria-label={`Move ${item} down`} disabled={i === order.length - 1} onClick={() => move(i, 1)}>↓</button>
      </span>
    </li>)}
  </ol>;
}

function MinorGate({ onChangeAge, onBrowseLibrary }) {
  return <div className="qz-gate">
    <h2>We can’t take you through the quiz</h2>
    <p>ayna is built for people 18 and over. Because the quiz leads to supplement and product guidance, we don’t create profiles for minors. That’s a conversation for a parent, guardian or clinician who knows your history.</p>
    <ol>
      <li><b>Talk to someone who can help.</b> A parent, guardian, school nurse or your own doctor can look at symptoms with your full history in front of them.</li>
      <li><b>Read, without a profile.</b> Our explainers on cycles, sleep and nutrition stay open to everyone. Nothing personalized, nothing stored.</li>
      <li><b>Come back at 18.</b> We’ll still be here.</li>
    </ol>
    <p className="qz-fine">If you’re in immediate distress, contact a local emergency service or a crisis line.</p>
    <div className="qz-gate-actions">
      <button type="button" className="qz-btn" onClick={onBrowseLibrary}>Browse the reading library</button>
      <button type="button" className="qz-btn is-ghost" onClick={onChangeAge}>Change my age</button>
    </div>
  </div>;
}

/* ------------------------------ Quiz ------------------------------ */

const TOPIC_SHORT = {
  'Period + cycle': 'Period',
  'Hormonal + reproductive': 'Hormones',
  'Sexual + reproductive health': 'Sexual health',
  'Perimenopause + menopause + post-menopause': 'Menopause',
  'Mood + mental wellbeing': 'Mood',
  'Sleep + energy + cognition': 'Sleep + energy',
  'Metabolic + physical wellness': 'Wellness',
  'Care access': 'Care',
};

// Website flow: the required minimum first (age and life stage share one
// screen here), then a checkpoint (see results, or make the matches more
// personal), then the optional refinements, each one skippable. The steps,
// required/optional rules and follow-ups come from intakeModel.js, the same
// list the app uses.
const CHECKPOINT = CHECKPOINT_STEP;

const FOLLOWUP_STEP_IDS = WEB_FOLLOWUP_STEP_IDS;
// Q2 opens on the needs most people start with; "More topics" shows every group.
const COMMON_NEEDS = ['Period product support', 'Cramps or period pain', 'Heavy periods', 'Vaginal dryness', 'Bladder leakage or incontinence', 'Trouble sleeping'];

function splitSteps(intake) {
  const { required, optional } = splitIntakeSteps(intake);
  const core = required.filter((s) => s.id !== 'lifeStage').map((s) => (s.id === 'age'
    ? { ...s, title: 'About you', type: 'aboutYou', info: 'Your age and life stage. We use them to skip products that are not meant for you, for example pregnancy-safe picks only, or midlife support. Not sure, or rather not say? Those count too.' }
    : s));
  return { core, more: optional };
}

// Where to start when editing an existing profile: the first required step
// still missing an answer, else the checkpoint.
function firstUnansweredStep(intake) {
  const id = firstUnansweredStepId(intake);
  return id === 'lifeStage' ? 'age' : id;
}
// A saved step id as the website shows it: follow-ups that moved under the
// life stage, and the life stage itself, open the About you screen.
function webResumeStep(intake, id) {
  const next = resumeStepId(intake, id);
  return next === 'lifeStage' ? 'age' : next;
}

// Website first run (no intro card, onboarding audit #5): the seven setup screens (onboardingFlow.js) with age and
// life stage on one screen, then health data, then the reveal.
const ONBOARDING_ONLY = ['helpTopics', 'goals'];
const SAFETY_IDS = ['conditions', 'allergies', 'medications'];
/** The optional preference questions ("Answer N more questions"), without the health-data step or her name. */
const isPrefStep = (s) => s?.obPart === 'more' && !SAFETY_IDS.includes(s.id) && !['connect', 'name', 'ready'].includes(s.id);
// Minimum questions, health data, the reveal; then, only if she asks for it
// ("Make my matches more personal"), the optional ones, and back to the reveal.
function webOnboardingSteps(intake) {
  const web = (list, obPart) => list.filter((s) => s.id !== 'lifeStage').map((s) => ({ ...(s.id === 'age'
    ? { ...s, title: 'About you', type: 'aboutYou', why: 'Some products are not meant for every age or stage, for example pregnancy-safe picks only, or midlife support. You can be in perimenopause and still have regular periods. Not sure, or rather not say? Those count too.' }
    : s), obPart }));
  // Starts at question 1: no intro card (onboarding audit #5).
  // Nov 3: four screens, then her matches. Health data is offered after the
  // safety questions, not before the reveal.
  const more = web(getOnboardingSteps(intake, { part: 'more', surface: 'web' }), 'more');
  const afterSafety = Math.max(0, more.findIndex((st) => !st.afterReveal || st.id === 'name'));
  // Nov 4 (founder: "why would you save your matches then do safety, the order doesn't make
  // sense"): the 3 safety questions come before the matches, so what she sees is already checked.
  return [
    ...web(getOnboardingSteps(intake, { part: 'core', surface: 'web' }), 'core'),
    ...more.slice(0, afterSafety),
    { id: 'ready', section: 'ready', type: 'ready', screen: 7, title: '', optional: false, required: false, obPart: 'core' },
    { id: 'connect', section: 'connect', type: 'connect', screen: 7, title: 'Connect health data', subtitle: 'Optional. Quick check-ins work too.', optional: true, required: false, obPart: 'more' },
    ...more.slice(afterSafety),
  ];
}

export default function WebIntake({ onComplete, onBrowseLibrary, onExplore = null, initialSnapshot = null, startAtOptional = false, startAtStep = '', signedIn = true }) {
  const singleStep = Boolean(initialSnapshot && ONBOARDING_ONLY.includes(startAtStep));
  const onboarding = !initialSnapshot || singleStep;
  const [savedDraft] = useState(() => (initialSnapshot ? null : readIntakeDraft()));
  const [intake, setIntake] = useState(() => (savedDraft ? { ...EMPTY, ...savedDraft.intake } : reconstructIntakeFromSnapshot(initialSnapshot)));
  const [stepId, setStepId] = useState(() => {
    if (singleStep) return startAtStep;
    if (onboarding) {
      const draftId = savedDraft?.stepId ? webResumeStep({ ...EMPTY, ...savedDraft.intake }, savedDraft.stepId) : savedDraft?.stepId;
      return draftId && webOnboardingSteps({ ...EMPTY, ...(savedDraft?.intake || {}) }).some((s) => s.id === draftId && s.id !== 'ready') ? draftId : 'age';
    }
    if (savedDraft?.stepId) return webResumeStep({ ...EMPTY, ...savedDraft.intake }, savedDraft.stepId);
    if (!initialSnapshot) return 'age';
    // "Make my matches more personal": the first optional question still open.
    const resumed = reconstructIntakeFromSnapshot(initialSnapshot);
    if (startAtStep) return webResumeStep(resumed, startAtStep);
    if (startAtOptional) { const id = firstOptionalResumeStepId(resumed); return id === 'lifeStage' ? 'age' : id; }
    return firstUnansweredStep(resumed);
  });
  // Opened from "Update life stages": bring the life stage question into view.
  useEffect(() => {
    if (startAtStep !== 'lifeStage') return undefined;
    const t = setTimeout(() => document.getElementById('qz-stage-q')?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 250);
    return () => clearTimeout(t);
  }, [startAtStep]);
  const [search, setSearch] = useState('');
  const [direction, setDirection] = useState('forward');
  // Age and life stage share one website step ("About you"); they show as two screens, one question each.
  const [aboutPart, setAboutPart] = useState(startAtStep === 'lifeStage' ? 'stage' : 'age');
  // A colour-block break between first-run sections. UI only: not a step, not saved.
  const [sectionBreak, setSectionBreak] = useState(null);
  const [glossary, setGlossary] = useState(null);
  // Escape closes the meaning card, like every other dialog on the site.
  useEffect(() => {
    if (!glossary) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setGlossary(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [glossary]);
  const [minorGate, setMinorGate] = useState(false);
  // ZIP: Next is live from the first digit; a bad ZIP is caught on Next, not before.
  const [zipError, setZipError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [avoidTab, setAvoidTab] = useState('avoid');
  const [supportTab, setSupportTab] = useState(null);
  const [showAllNeeds, setShowAllNeeds] = useState(false);
  const [helpOtherOpen, setHelpOtherOpen] = useState(false);

  // quiz_started fires from the landing's entry points (landing agent); the
  // reveal sends first_match_shown (once per device), so nothing fires here.
  // Same draft the app keeps, so an unfinished quiz resumes on either.
  useEffect(() => {
    if (initialSnapshot) return;
    const hasProgress = !['age', 'helpTopics', 'welcome'].includes(stepId) || JSON.stringify(intake) !== JSON.stringify(EMPTY);
    try {
      if (hasProgress) localStorage.setItem(INTAKE_DRAFT_KEY, JSON.stringify({ version: 1, intake, stepId: stepId === 'ready' ? 'connect' : stepId }));
      else localStorage.removeItem(INTAKE_DRAFT_KEY);
    } catch { /* storage unavailable */ }
  }, [intake, stepId, initialSnapshot]);

  const { core: coreSteps, more: moreSteps } = useMemo(() => splitSteps(intake), [intake]);
  const obSteps = useMemo(() => (onboarding ? webOnboardingSteps(intake) : []), [onboarding, intake]);
  const atCheckpoint = !onboarding && stepId === CHECKPOINT;
  const phase = onboarding ? 'onboarding' : moreSteps.some((s) => s.id === stepId) ? 'more' : 'core';
  const steps = onboarding ? obSteps : phase === 'more' ? moreSteps : coreSteps;
  const index = Math.max(0, steps.findIndex((s) => s.id === stepId));
  const step = steps[index] || steps[0];
  const isLast = index === steps.length - 1;
  // A follow-up (flow, pain, timing…) keeps its parent's number, so the
  // count never grows mid-quiz: always "N of 6" for the core questions.
  const isFollowUp = (st) => FOLLOWUP_STEP_IDS.has(st.id);
  const shownTotal = phase === 'more' ? steps.length : steps.filter((st) => !isFollowUp(st)).length;
  const shownIndex = phase === 'more' ? index + 1 : Math.max(1, steps.slice(0, index + 1).filter((st) => !isFollowUp(st)).length);

  // Drop-off (Nov 3): which question is on screen (its name only, never an answer).
  // Pro status for the health-data step: open only for Pro members or while Pro gates are off.
  const [connectOpen, setConnectOpen] = useState(false);
  useEffect(() => {
    if (step.type !== 'connect') return undefined;
    let live = true;
    const check = () => proNow().then((st) => { if (live) setConnectOpen(Boolean(st && (st.active || !st.gates))); }).catch(() => {});
    check();
    window.addEventListener('focus', check);
    return () => { live = false; window.removeEventListener('focus', check); };
  }, [step.type]);
  // Typeform-style keys (Nov 3): a letter picks that answer, Enter continues. Never while typing in a field.
  const keyRef = useRef({ ready: false, next: null });
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
      const t = e.target;
      if (t && (t.closest?.('input, textarea, select, [contenteditable="true"], [role="dialog"]'))) return;
      if (e.key === 'Enter') {
        if (t && t.closest?.('button, a')) return;
        if (keyRef.current.ready && keyRef.current.next) { e.preventDefault(); keyRef.current.next(); }
        return;
      }
      if (/^[a-z]$/i.test(e.key)) {
        const opts = [...document.querySelectorAll('.aq--web .aq-answer .aq-chip')];
        const btn = opts[e.key.toUpperCase().charCodeAt(0) - 65];
        if (btn) { e.preventDefault(); btn.click(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const viewedId = step.type === 'aboutYou' ? `aboutYou_${aboutPart}` : step.id;
  useEffect(() => {
    trackQuizStep({ stepId: viewedId, number: shownIndex, total: shownTotal, part: step.obPart === 'more' || phase === 'more' ? 'more' : 'core', surface: 'web' });
  }, [viewedId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Age and life stage share one screen here, so that screen checks both.
  const answerId = step.type === 'aboutYou' ? 'aboutYou' : step.id;
  const set = (key, value) => setIntake((prev) => ({ ...prev, [key]: value }));
  const toggleLifeStage = (value) => setIntake((prev) => {
    const n = toggleLifeStageSelection(getLifeStages(prev), value);
    // Same as the app: Regular periods next to Perimenopause answers "How are your periods now?" for her.
    return syncPerimenopausePeriods({ ...prev, lifeStageSelections: n, lifeStage: n.find((v) => !LIFE_STAGE_EXCLUSIVE.includes(v)) || '' });
  });
  const toggleExclusive = (key, value, exclusive = []) => setIntake((prev) => {
    const cur = Array.isArray(prev[key]) ? prev[key] : (prev[key] ? [prev[key]] : []);
    const next = cur.includes(value) ? cur.filter((x) => x !== value) : exclusive.includes(value) ? [value] : [...cur.filter((x) => !exclusive.includes(x)), value];
    return { ...prev, [key]: next };
  });
  const addCustom = (key, raw, exclusive = []) => {
    const value = String(raw || '').trim().replace(/\s+/g, ' ').slice(0, 80);
    if (value.length < 2) return;
    setIntake((prev) => {
      const cur = Array.isArray(prev[key]) ? prev[key] : [];
      if (cur.some((i) => i.toLowerCase() === value.toLowerCase())) return prev;
      const next = [...cur.filter((i) => !exclusive.includes(i)), value];
      return key === 'lifeStageSelections' ? { ...prev, [key]: next, lifeStage: next[0] || '' } : { ...prev, [key]: next };
    });
    setSearch('');
  };

  const go = (id, dir = 'forward') => { setSearch(''); setZipError(''); setSectionBreak(null); setDirection(dir); setAboutPart(dir === 'back' ? 'stage' : 'age'); setStepId(id); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const back = () => {
    if (step.type === 'aboutYou' && aboutPart === 'stage' && !atCheckpoint) { setDirection('back'); setAboutPart('age'); window.scrollTo({ top: 0 }); return; }
    if (onboarding) { if (index > 0) go(steps[index - 1].id, 'back'); return; }
    if (atCheckpoint) { go(coreSteps[coreSteps.length - 1].id, 'back'); return; }
    if (index > 0) go(steps[index - 1].id, 'back');
    else if (phase === 'more') go(CHECKPOINT, 'back');
  };
  // Nov 3: the first 4 questions run straight through (a divider screen asked nothing and cost a tap).
  // One break is left, before "Your preferences" in the optional part after the matches.
  const breakBefore = (from, to, list) => {
    if (!to || to.screen === from.screen || to.obPart !== from.obPart || from.obPart !== 'more' || to.screen !== 5) return null;
    const label = ONBOARDING_SCREENS.find((sc) => sc.n === to.screen)?.label;
    return label ? { label, count: list.filter((st) => st.screen === to.screen && st.obPart === to.obPart).length, nextId: to.id } : null;
  };
  // After the six core questions: a checkpoint. In "more detail", the last step finishes.
  // Editing one answer from the summary returns to the summary.
  const [fromSummary, setFromSummary] = useState(false);
  // Nov 3 (founder: "it says answer 3 safety questions but it's more than 3"): the results
  // page starts either just the 3 safety questions, or just the preference questions;
  // each one comes back to the results page when it's done.
  const [moreScope, setMoreScope] = useState(null);
  const [prefsDone, setPrefsDone] = useState(false);
  const advance = (answers = intake) => {
    if (singleStep) { finish(answers); return; }
    if (onboarding) {
      const list = webOnboardingSteps(answers);
      const at = list.findIndex((s) => s.id === step.id);
      if (step.id === 'ready') return;
      if (moreScope === 'safety' && SAFETY_IDS.includes(step.id) && !SAFETY_IDS.includes(list[at + 1]?.id)) { setMoreScope(null); go('ready'); return; }
      // Nov 4 (founder: "the extra questions didn't change my match"): the preference questions
      // run straight through (no health-data step, no divider screens) and come back to the
      // matches, which are rebuilt from the new answers.
      if (moreScope === 'prefs') {
        const nxt = list.slice(at + 1).find((s) => isPrefStep(s));
        if (nxt) { go(nxt.id); return; }
        setMoreScope(null); setPrefsDone(true); go('ready'); return;
      }
      if (at >= 0 && at < list.length - 1) {
        const brk = breakBefore(step, list[at + 1], list);
        if (brk) { setDirection('forward'); setSectionBreak(brk); window.scrollTo({ top: 0 }); return; }
        go(list[at + 1].id);
      } else go('ready');
      return;
    }
    if (fromSummary) { setFromSummary(false); go(CHECKPOINT); return; }
    if (!isLast) { go(steps[index + 1].id); return; }
    if (phase === 'core') go(CHECKPOINT); else finish(answers);
  };
  const finish = async (answers = intake, opts = {}) => {
    const snapshot = buildSnapshot(answers);
    setSaving(true);
    try {
      const result = await saveHealthIntakeForCurrentUser(snapshot);
      if (result && result.saved === false && result.localSaved !== true && result.reason !== 'no_authenticated_user') throw new Error(result.reason || 'save_failed');
    } catch (e) {
      console.error('[Ayna] intake save failed:', e);
      setSaving(false);
      setSaveError("Couldn't save yet. Try again.");
      return;
    }
    try { localStorage.removeItem(INTAKE_DRAFT_KEY); } catch { /* storage unavailable */ }
    setSaving(false);
    onComplete(mapIntakeToLegacyQuizProfile(snapshot), opts);
  };
  const next = () => {
    // Connect health data has nothing to answer on the website: Next goes on, same as Skip.
    if (step.type === 'connect') { skip(); return; }
    if (step.id === 'age' && isMinorAge(intake.age)) return;
    if (step.type === 'aboutYou' && aboutPart === 'age') {
      if (!requiredReady('age', intake)) return;
      setDirection('forward'); setAboutPart('stage'); window.scrollTo({ top: 0 });
      return;
    }
    if (step.id === 'zip') {
      if (!intake.zipcode) return;
      if (!isValidUsZip(intake.zipcode)) { setZipError('Invalid ZIP code'); return; }
      advance();
      return;
    }
    if (!requiredReady(answerId, intake) || !isStepAnswered(answerId, intake)) return;
    advance();
  };
  // Skip (optional steps only) never validates; a half-typed ZIP is dropped
  // rather than saved. The step is stored as skipped, which is neutral.
  const skip = () => {
    const next = markSkipped(step.id === 'zip' && !isValidUsZip(intake.zipcode) ? { ...intake, zipcode: '' } : intake, step.id);
    setIntake(next);
    advance(next);
  };

  // Hold any option for its plain-language meaning (same definitions as the app).
  const hold = useRef({ timer: null, fired: false });
  const startHold = (event) => {
    const el = event.target.closest('button');
    const raw = el ? el.textContent.replace(/\s+/g, ' ').replace(/^✓/, '').trim() : '';
    const value = LIFE_STAGE_VALUE_BY_LABEL[raw] || raw;
    const hit = el && (defineOption(value, step.type === 'aboutYou' ? 'lifeStage' : step.type) || (step.type === 'price' && defineOption(value, 'largePurchase')));
    clearTimeout(hold.current.timer);
    hold.current.fired = false;
    if (!hit) return;
    hold.current.timer = setTimeout(() => { hold.current.fired = true; setGlossary({ ...hit, term: hit.term === value ? raw : hit.term }); }, 450);
  };
  const endHold = () => clearTimeout(hold.current.timer);
  const swallow = (e) => { if (hold.current.fired) { e.preventDefault(); e.stopPropagation(); hold.current.fired = false; } };

  const lifeStages = getLifeStages(intake);
  const lifeStageOptions = intake.age !== '' && Number(intake.age) >= 40 ? [...MIDLIFE_LIFE_STAGES, ...LIFE_STAGES.filter((i) => !MIDLIFE_LIFE_STAGES.includes(i))] : LIFE_STAGES;

  const helpOther = helpOtherOpen || String(intake.supportOtherText || '').trim();
  const toggleHelpTopic = (value) => {
    if (value === SOMETHING_ELSE) { setHelpOtherOpen(!helpOther); if (helpOther) set('supportOtherText', ''); return; }
    setIntake((prev) => ({ ...prev, helpTopics: (prev.helpTopics || []).includes(value) ? prev.helpTopics.filter((x) => x !== value) : [...(prev.helpTopics || []), value] }));
  };
  const body = () => {
    // Optional contextual timing belongs with the selected symptom, never
    // with an assumed life stage or diagnosis.
    const temperatureTiming = needsVasomotorTiming(intake) ? (
      <section className="qz-group">
        <h3>When do you notice the hot flashes or sweats? (optional)</h3>
        <Chips small items={VASOMOTOR_TIMING_OPTIONS} selected={intake.vasomotorTimingSelections || []}
          onToggle={(v) => set('vasomotorTimingSelections', toggleVasomotorTiming(intake.vasomotorTimingSelections, v))} />
        <p className="qz-subtitle">Choose any that apply. Timing doesn't establish the cause.</p>
      </section>
    ) : null;
    switch (step.type) {
      case 'topics': return <>
        <Chips label={step.title} items={HELP_TOPICS} selected={[...(intake.helpTopics || []), ...(helpOther ? [SOMETHING_ELSE] : [])]} onToggle={toggleHelpTopic}
          expand={{ [SOMETHING_ELSE]: <label className="ip-other-text"><span>Tell us in your own words</span><input value={intake.supportOtherText} maxLength={80} placeholder="For example, migraines" onChange={(e) => set('supportOtherText', e.target.value)} /></label> }} />
      </>;
      case 'goals': return <Chips label={step.title} items={GOALS} selected={intake.goals || []} onToggle={(v) => setIntake((prev) => ({ ...prev, goals: (prev.goals || []).includes(v) ? prev.goals.filter((x) => x !== v) : [...(prev.goals || []), v] }))} />;
      // Nov 3 (founder): connecting health data takes three steps on the website: get ayna Pro
      // (checkout brings her back here and the step ticks itself), get the iPhone app, then log in
      // there with the same account and connect. Then she carries on here.
      case 'connect': return <ol className="qz-conn">
        <li className={connectOpen ? 'is-done' : 'is-now'}>
          <span className="qz-conn__n" aria-hidden="true">{connectOpen ? '✓' : '1'}</span>
          <div>
            <b>Get ayna Pro</b>
            {connectOpen ? <small>Done. You have ayna Pro.</small> : <>
              <small>Health data is part of ayna Pro. After you pay, you come right back here.</small>
              <button type="button" className="qz-conn__btn" onClick={() => { rememberProReturn('wearables'); window.location.href = '/pro'; }}>Get ayna Pro</button>
            </>}
          </div>
        </li>
        <li className={connectOpen ? 'is-now' : 'is-later'}>
          <span className="qz-conn__n" aria-hidden="true">2</span>
          <div>
            <b>Get the ayna app on your iPhone</b>
            <small>Scan this with your phone camera, or open the link on your iPhone. It installs through TestFlight, Apple’s app for beta apps.</small>
            <div className="qz-conn__app">
              <img src="/testflight-qr.svg" alt="QR code for the ayna iPhone app on TestFlight" width="132" height="132" />
              <a className="qz-conn__link" href="https://testflight.apple.com/join/f3C9PypD" target="_blank" rel="noopener noreferrer">Open the TestFlight link<span className="sr-only"> (opens in a new tab)</span></a>
            </div>
          </div>
        </li>
        <li className="is-later">
          <span className="qz-conn__n" aria-hidden="true">3</span>
          <div>
            <b>Log in and connect</b>
            <small>In the app, log in with this same account. Go to You, then Health data, and connect Apple Health or Oura. Then come back here and continue.</small>
          </div>
        </li>
      </ol>;
      // First run: her name is its own screen (critique, Oct 27).
      case 'name': return <label className="qz-name">
        <span>Your first name <small>Optional</small></span>
        <input className="qz-input" type="text" autoComplete="given-name" maxLength={FIRST_NAME_MAX} value={intake.name || ''} onChange={(e) => set('name', e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); next(); } }} />
      </label>;
      case 'aboutYou':
      case 'age':
      case 'lifeStage': {
        if (step.type === 'aboutYou' && aboutPart === 'age') return <>
          {/* Her first name, asked here only (sign-up never asks again). */}
          {!onboarding && <label className="qz-name">
            <span>Your first name <small>Optional</small></span>
            <input className="qz-input" type="text" autoComplete="given-name" maxLength={FIRST_NAME_MAX} value={intake.name || ''} onChange={(e) => set('name', e.target.value)} />
          </label>}
          <AgeField value={intake.age} onChange={(v) => set('age', v)} underage={isMinorAge(intake.age)} onOpenGate={() => setMinorGate(true)} />
        </>;
        // Each stage's follow-up opens right under its chip (asked once, never again later).
        const one = (v) => (v ? [v] : []);
        const expand = {
          'I am trying to conceive': <SubQuestion title={FOLLOWUP_QUESTIONS.ttcDuration}><Chips small single items={withSavedOption(ttcDurationOptions(intake), intake.ttcDuration)} selected={one(intake.ttcDuration)} onToggle={(v) => set('ttcDuration', v)} /></SubQuestion>,
          'I am pregnant': <SubQuestion title={FOLLOWUP_QUESTIONS.pregnancyTrimester}><Chips small single items={withSavedOption(PREGNANCY_TRIMESTER, intake.pregnancyTrimester)} selected={one(intake.pregnancyTrimester)} onToggle={(v) => set('pregnancyTrimester', v)} /></SubQuestion>,
          'I am postpartum': <>
            <SubQuestion title={FOLLOWUP_QUESTIONS.postpartumTiming}><Chips small single items={withSavedOption(POSTPARTUM_TIMING, intake.postpartumTiming)} selected={one(intake.postpartumTiming)} onToggle={(v) => set('postpartumTiming', v)} /></SubQuestion>
            <SubQuestion title={FOLLOWUP_QUESTIONS.breastfeedingStatus}><Chips small single items={BREASTFEEDING_STATUS} selected={one(intake.breastfeedingStatus)} onToggle={(v) => set('breastfeedingStatus', v)} /></SubQuestion>
          </>,
          'I am in perimenopause': <SubQuestion title={FOLLOWUP_QUESTIONS.perimenopauseLastPeriod}><Chips small single items={PERIMENOPAUSE_LAST_PERIOD} selected={one(intake.perimenopauseLastPeriod)} onToggle={(v) => setIntake((prev) => setPerimenopausePeriods(prev, v))} /></SubQuestion>,
        };
        return <div id="qz-stage-q">
          <Chips label="Your life stage" items={[...lifeStageOptions, ...LIFE_STAGE_EXCLUSIVE]} selected={lifeStages} labels={LIFE_STAGE_LABELS} muted={LIFE_STAGE_EXCLUSIVE} onToggle={toggleLifeStage} expand={expand} />
        </div>;
      }
      case 'zip': return <div className="qz-zip-wrap">
        <input className="qz-input qz-zip" inputMode="numeric" autoComplete="postal-code" value={intake.zipcode} placeholder="e.g. 10027" aria-label="ZIP code"
          aria-invalid={zipError ? true : undefined} aria-describedby={zipError ? 'qz-zip-err' : undefined}
          onChange={(e) => { setZipError(''); set('zipcode', e.target.value.replace(/\D/g, '').slice(0, 5)); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); next(); } }} />
        {zipError && <p className="qz-alert qz-zip-err" id="qz-zip-err" role="alert">{zipError}</p>}
      </div>;
      // Nov 3: with no topic picked first (the new 4-question start), show the short
      // "Common at your stage" list with More topics, not every group at once.
      case 'support': if (onboarding && (intake.helpTopics || []).length) {
        const groups = supportGroupsForTopics(intake.helpTopics);
        const q = search.trim().toLowerCase();
        const known = new Set(groups.flatMap((g) => g.items));
        const custom = intake.supportSelections.filter((i) => !known.has(i) && i !== NOTHING_SPECIFIC);
        const pick = (v) => toggleExclusive('supportSelections', v, [NOTHING_SPECIFIC]);
        return <>
          <Search value={search} onChange={setSearch} placeholder="Search, e.g. cramps, sleep, acne" />
          <AddCustom query={search} options={[...known, ...intake.supportSelections]} onAdd={(v) => addCustom('supportSelections', v, [NOTHING_SPECIFIC])} />
          <div className="qz-groups">
            {(q ? SUPPORT_GROUPS : groups).map((g) => {
              const items = q ? g.items.filter((i) => matchesSearchOption(q, i)) : g.items;
              if (!items.length) return null;
              return <section key={g.label} className="qz-group"><h3>{g.label}</h3><Chips label={g.label} items={items} selected={intake.supportSelections} onToggle={pick} /></section>;
            })}
          </div>
          {custom.length > 0 && <section className="qz-group"><h3>Added by you</h3><Chips small items={custom} selected={custom} onToggle={pick} /></section>}
          <Chips small items={[NOTHING_SPECIFIC]} selected={intake.supportSelections} onToggle={pick} />
          {(intake.supportSelections || []).includes(NOTHING_SPECIFIC) && (
            <section className="qz-group"><h3>Anything you&rsquo;d like to learn about? (optional)</h3>
              <Chips small items={LEARN_INTERESTS} selected={intake.learnInterests || []} onToggle={(v) => set('learnInterests', (intake.learnInterests || []).includes(v) ? intake.learnInterests.filter((x) => x !== v) : [...(intake.learnInterests || []), v])} />
            </section>
          )}
          {temperatureTiming}
        </>;
      } else {
        const q = search.trim().toLowerCase();
        const known = new Set(SUPPORT_GROUPS.flatMap((g) => g.items));
        const stageCommon = commonNeedOptions(intake, [...known], COMMON_NEEDS);
        // Nov 3: if she gets periods, cramps is always on the short list. (The research priors
        // have a cramps row for 18-24 only, so 25+ never saw it; this is from her answer, not a rate.)
        const getsPeriods = (intake.lifeStageSelections || []).some((x) => x === 'I get periods regularly' || x === 'My periods are irregular');
        const tailoredCommon = getsPeriods && !stageCommon.includes('Cramps or period pain') ? ['Cramps or period pain', ...stageCommon].slice(0, 6) : stageCommon;
        const custom = intake.supportSelections.filter((i) => !known.has(i));
        return <>
          <Search value={search} onChange={setSearch} placeholder="Search, e.g. cramps, sleep, acne" />
          <AddCustom query={search} options={[...known, ...intake.supportSelections]} onAdd={(v) => addCustom('supportSelections', v, ['Nothing right now'])} />
          {q ? (
            <div className="qz-groups">
              {SUPPORT_GROUPS.map((g) => {
                const items = g.items.filter((i) => matchesSearchOption(q, i));
                if (!items.length) return null;
                return <section key={g.label} className="qz-group"><h3>{g.label}</h3><Chips items={items} selected={intake.supportSelections} onToggle={(v) => toggleExclusive('supportSelections', v, ['Nothing right now'])} /></section>;
              })}
            </div>
          ) : !showAllNeeds ? <>
            <Tiles label={tailoredCommon !== COMMON_NEEDS ? 'Common at your stage' : 'Common needs'} items={[...tailoredCommon, ...intake.supportSelections.filter((i) => known.has(i) && !tailoredCommon.includes(i) && i !== 'Nothing right now')]} selected={intake.supportSelections} onToggle={(v) => toggleExclusive('supportSelections', v, ['Nothing right now'])} />
            <div className="qz-chips is-small">
              <button type="button" className="qz-chip is-dashed" aria-expanded="false" onClick={() => setShowAllNeeds(true)}>More topics</button>
              <Chips small items={['Nothing right now']} selected={intake.supportSelections} onToggle={(v) => toggleExclusive('supportSelections', v, ['Nothing right now'])} />
            </div>
          </> : (() => {
            const activeLabel = supportTab || SUPPORT_GROUPS.find((g) => g.items.some((i) => intake.supportSelections.includes(i)))?.label || SUPPORT_GROUPS[0]?.label;
            const group = SUPPORT_GROUPS.find((g) => g.label === activeLabel) || SUPPORT_GROUPS[0];
            return <>
              <div className="qz-topic-tabs" role="tablist" aria-label="Topics">
                {SUPPORT_GROUPS.map((g) => {
                  const count = g.items.filter((i) => intake.supportSelections.includes(i)).length;
                  return <button type="button" role="tab" key={g.label} aria-selected={g.label === group.label} className={g.label === group.label ? 'is-on' : ''} onClick={() => setSupportTab(g.label)}>{TOPIC_SHORT[g.label] || g.label}{count > 0 && <b>{count}</b>}</button>;
                })}
              </div>
              <div className="qz-topic-panel" role="tabpanel" key={group.label}>
                <Chips items={group.items} selected={intake.supportSelections} onToggle={(v) => toggleExclusive('supportSelections', v, ['Nothing right now'])} />
              </div>
            </>;
          })()}
          {custom.length > 0 && <section className="qz-group"><h3>Added by you</h3><Chips small items={custom} selected={custom} onToggle={(v) => toggleExclusive('supportSelections', v)} /></section>}
          {temperatureTiming}
        </>;
      }
      // House Blend slider (uniqueness pass A): the same options, saved verbatim.
      case 'flow': return <Rows label={step.title} options={PERIOD_FLOW} value={intake.periodFlow} onChange={(v) => set('periodFlow', v)} />;
      case 'pain': return <Rows label={step.title} options={PERIOD_PAIN} value={intake.periodPain} onChange={(v) => set('periodPain', v)} />;
      case 'utiFrequency': return <Rows options={UTI_FREQUENCY} value={intake.utiFrequency} onChange={(v) => set('utiFrequency', v)} />;
      case 'ttcDuration': return <Rows options={ttcDurationOptions(intake)} value={intake.ttcDuration} onChange={(v) => set('ttcDuration', v)} />;
      case 'postpartumTiming': return <>
        <Rows options={POSTPARTUM_TIMING} value={intake.postpartumTiming} onChange={(v) => set('postpartumTiming', v)} />
        {asksBreastfeedingOnTiming(intake) && <div className="aq-subq--under"><SubQuestion title={FOLLOWUP_QUESTIONS.breastfeedingStatus}><Chips single items={BREASTFEEDING_STATUS} selected={intake.breastfeedingStatus ? [intake.breastfeedingStatus] : []} onToggle={(v) => set('breastfeedingStatus', v)} /></SubQuestion></div>}
      </>;
      case 'pregnancyTrimester': return <Rows options={PREGNANCY_TRIMESTER} value={intake.pregnancyTrimester} onChange={(v) => set('pregnancyTrimester', v)} />;
      case 'conditions': {
        const items = [...CONDITION_EXCLUSIVE, ...CONDITIONS.filter((i) => ![...CONDITION_EXCLUSIVE, 'Other / not listed'].includes(i)), ...WEB_EXTRA_CONDITIONS, 'Other / not listed'];
        const q = search.trim().toLowerCase();
        const custom = intake.diagnosisSelections.filter((i) => !items.includes(i));
        return <>
          <Search value={search} onChange={setSearch} placeholder="Search conditions" />
          <AddCustom query={search} options={[...items, ...intake.diagnosisSelections]} onAdd={(v) => addCustom('diagnosisSelections', v, CONDITION_EXCLUSIVE)} />
          <Chips items={[...(q ? items.filter((i) => matchesSearchOption(q, i)) : items), ...custom]} selected={intake.diagnosisSelections} labels={SAFETY_ANSWER_LABELS} onToggle={(v) => toggleExclusive('diagnosisSelections', v, CONDITION_EXCLUSIVE)} />
        </>;
      }
      case 'allergies': return <>
        <Rows options={ALLERGY_STATUS} labels={SAFETY_ANSWER_LABELS} value={intake.allergyStatus} onChange={(v) => setIntake((prev) => ({ ...prev, allergyStatus: v, allergyItems: v === 'Yes' ? prev.allergyItems : [] }))} />
        {intake.allergyStatus === 'Yes' && <Tokens values={intake.allergyItems} onChange={(v) => set('allergyItems', v)} placeholder="Type an allergy or sensitivity" suggestions={ALLERGIES} />}
      </>;
      case 'medications': return <>
        <Rows options={MEDICATION_STATUS} labels={SAFETY_ANSWER_LABELS} value={intake.takesCurrent} onChange={(v) => setIntake((prev) => ({ ...prev, takesCurrent: v, currentMedicationItems: v === 'Yes' ? prev.currentMedicationItems : [] }))} />
        {intake.takesCurrent === 'Yes' && <Tokens values={intake.currentMedicationItems} onChange={(v) => set('currentMedicationItems', v)} placeholder="Medication, supplement, or birth control" suggestions={MEDICATION_SUGGESTIONS} limit={10} />}
      </>;
      case 'products': return <ProductHistory products={intake.productHistory} onChange={(v) => set('productHistory', v)} />;
      case 'avoidRepeat': {
        const history = [...new Set((intake.productHistory || []).map((p) => p.name).filter(Boolean))].filter((n) => !intake.avoidRepeat.includes(n));
        return <>
          <Tokens values={intake.avoidRepeat} onChange={(v) => set('avoidRepeat', v)} placeholder="Product or brand" suggestions={PRODUCT_OR_BRAND_SUGGESTIONS} />
          {history.length > 0 && <div className="qz-follow"><b>From what you tried</b><div className="qz-chips is-small">{history.map((n) => <button type="button" key={n} className="qz-chip is-dashed" onClick={() => set('avoidRepeat', [...intake.avoidRepeat, n])}>+ {n}</button>)}</div></div>}
        </>;
      }
      case 'trustedBrands': return <Tokens values={intake.trustedBrands} onChange={(v) => set('trustedBrands', v)} placeholder="Type a brand" suggestions={BRAND_SUGGESTIONS} />;
      case 'safety': return <>
        <Rows options={URGENT_STATUS} value={intake.safetyConcern} onChange={(v) => set('safetyConcern', v)} />
        {['Yes', 'Not sure'].includes(intake.safetyConcern) && <div className="aq-note-card" role="note"><b>Worth a closer look</b><p>Some new or worsening symptoms need a clinician. ayna helps you find products and doesn’t diagnose. If it feels urgent or severe, get care promptly.{intake.safetyConcern === 'Yes' ? ' We’ll show care options first.' : ''}</p><p className="qz-urgent">If you’re soaking a pad every hour, fainting, or in severe pain, <a href="tel:911">call 911</a> or go to urgent care.</p></div>}
      </>;
      case 'formats': {
        const custom = intake.preferredFormats.filter((f) => !PRODUCT_FORMATS.includes(f));
        return <>
          <Tiles label={step.title} items={PRODUCT_FORMATS} selected={intake.preferredFormats} onToggle={(v) => toggleExclusive('preferredFormats', v, ['No preference'])} />
          <div className="qz-chips is-small qz-format-own">
            {custom.length > 0 && <Chips small items={custom} selected={custom} onToggle={(v) => toggleExclusive('preferredFormats', v)} />}
            <AddOwn placeholder="Add a format" onAdd={(v) => addCustom('preferredFormats', v, ['No preference'])} />
          </div>
        </>;
      }
      case 'recommendationCount': return <div className="qz-count">{[1, 2, 3, 5].map((c) => <button type="button" key={c} className={Number(intake.recommendedProductsPerArea) === c ? 'is-on' : ''} aria-pressed={Number(intake.recommendedProductsPerArea) === c} onClick={() => setIntake((prev) => ({ ...prev, recommendedProductsPerArea: c, recommendationCountTouched: true }))}><strong>{c}</strong><span>{c === 1 ? 'pick' : 'picks'}</span></button>)}</div>;
      case 'price': {
        const sel = Array.isArray(intake.priceRange) ? intake.priceRange : (intake.priceRange ? [intake.priceRange] : []);
        const notAFactor = 'Price is not a major factor for me';
        return <>
          <Chips label={step.title} items={PRICE_RANGES} muted={[notAFactor]} selected={sel} onToggle={(v) => toggleExclusive('priceRange', v, [notAFactor])} />
          <div className="aq-subq--under"><SubQuestion title={FOLLOWUP_QUESTIONS.largePurchaseFrequency}><Rows label={FOLLOWUP_QUESTIONS.largePurchaseFrequency} options={LARGE_PURCHASE_FREQUENCY} value={intake.largePurchaseFrequency} onChange={(v) => set('largePurchaseFrequency', v)} /></SubQuestion></div>
        </>;
      }
      case 'brand': return <Rows label={step.title} options={BRAND_OPENNESS} value={intake.brandOpenness} onChange={(v) => set('brandOpenness', v)} />;
      case 'avoidOnly':
      case 'wantOnly':
      case 'avoidIngredients': {
        const sel = intake.avoidIngredients || [];
        const isOn = (v) => sel.includes(v) || (AVOID_PAIRS[v] && sel.includes(AVOID_PAIRS[v]));
        const known = new Set([...AVOID_INGREDIENTS, ...Object.values(AVOID_PAIRS)]);
        const customs = sel.filter((v) => !known.has(v) && v !== 'Other');
        const customAvoid = customs.filter((v) => /^No /.test(v));
        const customWant = customs.filter((v) => !/^No /.test(v));
        const toggle = (v) => setIntake((prev) => {
          const cur = (Array.isArray(prev.avoidIngredients) ? prev.avoidIngredients : []).filter((x) => x !== 'No preference');
          if (v === 'No preference') return { ...prev, avoidIngredients: sel.includes('No preference') ? [] : ['No preference'] };
          const pair = AVOID_PAIRS[v];
          const on = cur.includes(v) || (pair && cur.includes(pair));
          return { ...prev, avoidIngredients: on ? cur.filter((x) => x !== v && x !== pair) : [...cur, v, ...(pair ? [pair] : [])] };
        });
        const avoidSel = [...AVOID_GROUPS.avoid.filter(isOn), ...customAvoid];
        const wantSel = [...AVOID_GROUPS.want.filter(isOn), ...customWant];
        const onAvoid = avoidTab === 'avoid';
        // First run: two plain questions instead of one with tabs (team direction, section 30).
        if (step.type !== 'avoidIngredients') {
          const isAvoid = step.type === 'avoidOnly';
          return <div className={`qz-avoid${isAvoid ? ' is-avoid' : ''}`}>
            <Chips label={step.title} items={isAvoid ? [...AVOID_GROUPS.avoid, ...customAvoid] : [...AVOID_GROUPS.want, ...customWant]} selected={isAvoid ? avoidSel : wantSel} onToggle={toggle} labels={AVOID_LABELS} />
            <div className="qz-avoid-foot">
              {isAvoid
                ? <AddOwn key="avoid" placeholder="Add something to avoid" onAdd={(v) => addCustom('avoidIngredients', `No ${v.replace(/^no\s+/i, '')}`, ['No preference'])} />
                : <AddOwn key="want" placeholder="Add something you prefer" onAdd={(v) => addCustom('avoidIngredients', v, ['No preference'])} />}
            </div>
          </div>;
        }
        return <div className={`qz-avoid${onAvoid ? ' is-avoid' : ''}`}>
          <div className="qz-avoid-tabs" role="tablist" aria-label="Leave out or should be">
            <button type="button" role="tab" aria-selected={onAvoid} className={`is-avoid${onAvoid ? ' is-on' : ''}`} onClick={() => setAvoidTab('avoid')}>Leave out{avoidSel.length > 0 && <span>{avoidSel.length}</span>}</button>
            <button type="button" role="tab" aria-selected={!onAvoid} className={`is-want${!onAvoid ? ' is-on' : ''}`} onClick={() => setAvoidTab('want')}>Should be{wantSel.length > 0 && <span>{wantSel.length}</span>}</button>
          </div>
          <div className="qz-avoid-panel" role="tabpanel" key={avoidTab}>
            <Chips label={onAvoid ? 'Leave out' : 'Should be'} items={onAvoid ? [...AVOID_GROUPS.avoid, ...customAvoid] : [...AVOID_GROUPS.want, ...customWant]} selected={onAvoid ? avoidSel : wantSel} onToggle={toggle} labels={AVOID_LABELS} />
          </div>
          <div className="qz-avoid-foot">
            {onAvoid
              ? <AddOwn key="avoid" placeholder="Add something to leave out" onAdd={(v) => addCustom('avoidIngredients', `No ${v.replace(/^no\s+/i, '')}`, ['No preference'])} />
              : <AddOwn key="want" placeholder="Add a must-have" onAdd={(v) => addCustom('avoidIngredients', v, ['No preference'])} />}
            <Chips items={['No preference']} selected={sel.includes('No preference') ? ['No preference'] : []} onToggle={toggle} />
          </div>
        </div>;
      }
      case 'fsa': return <Rows label={step.title} options={FSA_HSA} value={intake.fsaHsaAnswer} onChange={(v) => set('fsaHsaAnswer', v)} />;
      case 'trust': return <TrustRank order={intake.trustRanking} onChange={(o) => set('trustRanking', o)} onTouch={() => set('trustRankingTouched', true)} />;
      case 'textarea': return <>
        <textarea className="qz-input qz-textarea" value={intake.anythingElse} onChange={(e) => set('anythingElse', e.target.value)} placeholder="A goal, a worry, something that didn’t work…" rows={5} />
        <div className="qz-chips is-small">{FREE_TEXT_PROMPTS.map((p) => <button type="button" key={p} className="qz-chip is-dashed" onClick={() => set('anythingElse', `${intake.anythingElse ? `${intake.anythingElse.trim()} ` : ''}${p}: `)}>{p}</button>)}</div>
      </>;
      default: return null;
    }
  };

  if (minorGate) return <div className="ct qz-page"><MinorGate onChangeAge={() => setMinorGate(false)} onBrowseLibrary={onBrowseLibrary} /></div>;

  const minorBlocked = step.id === 'age' && isMinorAge(intake.age);
  const agePart = step.type === 'aboutYou' && aboutPart === 'age';
  const ready = step.type === 'connect' ? true : agePart ? requiredReady('age', intake) && !minorBlocked : step.id === 'zip' ? String(intake.zipcode || '').length > 0 : requiredReady(answerId, intake) && isStepAnswered(answerId, intake) && !minorBlocked;
  keyRef.current = { ready: ready && !saving, next };

  // First run, last screen: the reveal. "See my Today" saves and opens Today.
  if (onboarding && step.type === 'ready') {
    const preview = mapIntakeToLegacyQuizProfile(buildSnapshot(intake));
    return <div className="ct qz-page" data-step="ready">
      <ReadyReveal variant="web" answers={preview} signedIn={signedIn} onSeeToday={() => finish(intake, { land: 'today' })} onWatchWrapped={() => finish(intake)} onCreateAccount={() => finish(intake, { land: 'save' })} onBack={back} onSafety={() => { const first = steps.find((s) => s.obPart === 'more' && SAFETY_IDS.includes(s.id) && !isStepAnswered(s.id, intake)) || steps.find((s) => SAFETY_IDS.includes(s.id)); setMoreScope('safety'); if (first) go(first.id); }} onMorePersonal={() => { const more = steps.find(isPrefStep); setMoreScope('prefs'); if (more) go(more.id); }} prefsDone={prefsDone} onConnect={() => { const c = steps.find((x) => x.id === 'connect'); if (c) { setMoreScope('prefs'); go('connect'); } }} />
      {saveError && <p className="qz-alert">{saveError}</p>}
    </div>;
  }

  // A returning person editing her profile sees her answers, each with Edit,
  // not the first-timer's "matches are ready" celebration.
  if (atCheckpoint && initialSnapshot) {
    const all = [...coreSteps, ...moreSteps];
    return <div className="ct qz-page" data-step="summary">
      <div className="qz-stage qz-stage--summary">
      <div className="qz-card qz-summary">
        <h1 className="qz-title">Your health profile</h1>
        <p className="qz-subtitle">Change any answer. Nothing is saved until you select Save.</p>
        <ul className="qz-summary__list">
          {all.map((st) => {
            const done = isStepAnswered(st.type === 'aboutYou' ? 'aboutYou' : st.id, intake);
            return <li key={st.id}>
              <span className={`qz-summary__state${done ? ' is-done' : ''}`} aria-hidden="true">{done ? '✓' : '·'}</span>
              <span className="qz-summary__q">{st.title}<small>{done ? 'Answered' : 'Not answered yet'}</small></span>
              <button type="button" className="qz-summary__edit" onClick={() => { setFromSummary(true); go(st.id); }}>{done ? 'Edit' : 'Answer'}</button>
            </li>;
          })}
        </ul>
        {saveError && <p className="qz-alert">{saveError}</p>}
        <div className="qz-checkpoint-actions">
          <button type="button" className="qz-btn" onClick={() => finish()} disabled={saving}>{saving ? 'Saving…' : 'Save and see my matches'} <span aria-hidden="true">→</span></button>
        </div>
      </div>
      </div>
    </div>;
  }

  if (sectionBreak) {
    return <div className="ct qz-page aq-page">
      <QuizBlock surface="web" kicker="Next" title={sectionBreak.label} body={`${sectionBreak.count} question${sectionBreak.count === 1 ? '' : 's'}`}
        onBack={() => { setDirection('back'); setSectionBreak(null); }}
        cta={{ label: 'Continue', onClick: () => go(sectionBreak.nextId) }} />
    </div>;
  }

  if (atCheckpoint) {
    return <div className="ct qz-page aq-page">
      <QuizBlock surface="web" stepKey="checkpoint" title="Your first matches are ready" onBack={back}
        body={intake.safetyConcern === 'Yes' ? 'You said something may be urgent, so care options come first.' : 'That’s enough for your first picks. Add more now for closer ones, or any time later from your profile.'}
        cta={{ label: saving ? 'Saving…' : 'See my results', onClick: () => finish(), disabled: saving }}
        secondary={<button type="button" className="aq-ghost" onClick={() => go(moreSteps[0].id)} disabled={saving || !moreSteps.length}>Make my matches more personal</button>}>
        {saveError && <p className="aq-err">{saveError}</p>}
        <div className="aq-note-card"><p>Make my matches more personal adds your budget, formats and ingredient preferences. {moreSteps.length} optional questions, skip any of them.</p></div>
      </QuizBlock>
    </div>;
  }

  const obProgress = (() => {
    if (!onboarding) return null;
    if (SAFETY_IDS.includes(step.id)) {
      const n = SAFETY_IDS.indexOf(step.id) + 1;
      return { now: n, total: SAFETY_IDS.length, label: `Safety question ${n} of ${SAFETY_IDS.length}` };
    }
    if (step.obPart === 'more' && moreScope) {
      const list = steps.filter((s) => (moreScope === 'safety' ? s.obPart === 'more' && SAFETY_IDS.includes(s.id) : isPrefStep(s)));
      const now = Math.max(1, list.findIndex((s) => s.id === step.id) + 1);
      return { now, total: list.length, label: `${moreScope === 'safety' ? 'Safety question' : 'Question'} ${now} of ${list.length}` };
    }
    const part = step.obPart === 'more' ? 'more' : 'core';
    const pr = onboardingProgress(step, part, steps.filter((s) => s.obPart === part && !SAFETY_IDS.includes(s.id)));
    // The website shows age and life stage as two screens of one step: count them as two questions.
    if (part === 'core' && steps.some((s) => s.type === 'aboutYou')) {
      const total = pr.total + 1;
      const now = step.type === 'aboutYou' ? (aboutPart === 'age' ? 1 : 2) : pr.now + 1;
      // Nov 4 (founder: the counts weren't accurate). What she picks for help can add a
      // follow-up (cramps, heavy periods, UTIs), so the total is only shown once it can't change.
      const known = isStepAnswered('support', intake) && step.id !== 'support' && step.type !== 'aboutYou';
      return { now, total, label: known ? `Question ${now} of ${total}` : `Question ${now}` };
    }
    return pr;
  })();
  // About you shows as two screens on the website: age, then life stage (titles from the first-run question set).
  const view = step.type === 'aboutYou'
    ? (aboutPart === 'age' ? { title: 'How old are you?', subtitle: '' } : { title: 'Which of these is you right now?', subtitle: 'Not sure is OK.' })
    : step.type === 'connect' ? { title: 'Connect your health data', subtitle: 'Optional. 3 steps, about 5 minutes.' }
    : { title: step.title, subtitle: step.subtitle };
  const multi = isMultiSelectStep(step) || (step.type === 'aboutYou' && aboutPart === 'stage');
  const helperShort = isShortHelper(view.subtitle) ? view.subtitle : '';
  const why = [
    view.subtitle && !helperShort ? view.subtitle : '',
    onboarding ? step.why : '',
    step.info && step.info !== step.why ? step.info : '',
    { helpTopics: 'Not sure? Select Continue and we will show everything.', medications: 'Check with a clinician before starting anything new.', avoidRepeat: 'These never show up in your picks.', connect: 'Connecting is never required. Apple Health and Health Connect connect in the ayna app. On the website you can upload a file or connect Oura from You, Health data, once you have an account. Brands never see it.' }[step.id] || '',
    step.type === 'name' || step.optional || step.type === 'topics' || step.type === 'connect' ? '' : step.section === 'safety' ? 'Needed for safety.' : 'Needed for your matches.',
    !initialSnapshot ? 'Answers are saved on this device.' : '',
  ];
  const progress = onboarding
    ? { now: obProgress.now, total: obProgress.total, label: obProgress.label }
    : { now: shownIndex, total: shownTotal, label: `${phase === 'more' ? 'Optional question' : 'Question'} ${shownIndex} of ${shownTotal}` };
  const canBack = index > 0 || phase === 'more' || (step.type === 'aboutYou' && aboutPart === 'stage');
  const hintId = agePart ? 'age' : answerId;
  return <div className="ct qz-page aq-page" data-phase={phase}>
    <QuizFrame
      surface="web" stepKey={step.id} sub={step.type === 'aboutYou' ? aboutPart : undefined} direction={direction} progress={progress}
      onBack={canBack ? back : null} onSkip={step.optional || step.type === 'topics' ? skip : null}
      title={view.title} helper={helperShort || (multi ? 'Pick all that apply' : '')} why={why}
      lead={onboarding && index === 0 && (step.type !== 'aboutYou' || aboutPart === 'age') ? <MedicalNote className="qz-med-note" /> : null}
      hint={!ready && !saving ? missingAnswerHint(hintId, intake) : null}
      cta={{ label: saving ? 'Saving…' : singleStep ? 'Save' : step.type === 'connect' ? (connectOpen ? 'I’m done, continue' : 'Not now') : isLast && phase === 'more' ? 'See my results' : 'Continue', onClick: next, disabled: !ready || saving }}
      below={<>
        {saveError && <p className="aq-err">{saveError}</p>}
        {onboarding && index === 0 && onExplore && <button type="button" className="aq-link" onClick={onExplore}>Explore first</button>}
        {phase === 'more' && !isLast && <button type="button" className="aq-link" onClick={() => finish()} disabled={saving}>See my results now</button>}
      </>}
      answerProps={{ ...(HOLD_TIP_TYPES.has(step.type) && (step.type !== 'aboutYou' || aboutPart === 'stage') ? { 'data-tour': 'quiz-hold' } : {}), onPointerDown: startHold, onPointerUp: endHold, onPointerLeave: endHold, onPointerCancel: endHold, onPointerMove: (e) => { if (Math.abs(e.movementX) + Math.abs(e.movementY) > 6) endHold(); }, onClickCapture: swallow, onContextMenu: (e) => { if (hold.current.fired) e.preventDefault(); } }}
      overlay={glossary && <GlossaryCard term={glossary.term} definition={glossary.definition} onClose={() => setGlossary(null)} />}
    >
            {body()}
    </QuizFrame>
  </div>;
}
