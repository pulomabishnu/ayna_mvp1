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
  STOP_REASONS, SUPPORT_GROUPS, UTI_FREQUENCY, buildSnapshot,
  getLifeStages, isMinorAge, normalizeSuggestion, readIntakeDraft, reconstructIntakeFromSnapshot,
  requiredReady, missingAnswerHint, FIRST_NAME_MAX, AGE_MIN, AGE_MAX, asksBreastfeedingOnTiming, ttcDurationOptions, resumeStepId, withSavedOption, isValidUsZip, setPerimenopausePeriods, syncPerimenopausePeriods,
} from '../mobile/data/intakeModel.js';
import { BRAND_SUGGESTIONS, CATALOG_PRODUCT_NAMES, PRODUCT_OR_BRAND_SUGGESTIONS } from '../mobile/data/intakeCatalog.js';
import { WEB_FOLLOWUP_STEP_IDS } from '../mobile/data/quizDraftProgress.js';
import SmartSearchInput from './search/SmartSearchInput.jsx';
import { rankSearchOptions as rankedSuggestions, matchesSearchOption } from '../utils/search/index.js';
import { commonNeedOptions } from '../matching/commonNeeds.js';
import '../styles/loop-a-quiz.css';
import { GOALS, HELP_TOPICS, NOTHING_SPECIFIC, SOMETHING_ELSE, getOnboardingSteps, onboardingProgress, supportGroupsForTopics } from '../mobile/data/onboardingFlow.js';
import { CATEGORIES } from '../health/metrics.js';
import ReadyReveal from './onboarding/ReadyReveal.jsx';
import '../styles/onboarding.css';
import './WebIntake.audit.css';
// Website-only conditions that change what is safe (condition research, Oct 17).
const WEB_EXTRA_CONDITIONS = ['Kidney disease', 'Bleeding or clotting disorder', 'History of blood clots', 'Heart disease', 'Liver disease', 'Stomach ulcer or stomach bleeding', 'Asthma'];

// The website's quiz. Same questions, order, branching and saved answers as
// the app (all of that lives in mobile/data/intakeModel.js); only the layout
// and controls are built for a browser.

/* ------------------------------ Controls ------------------------------ */

function Chips({ items, selected = [], onToggle, labels = {}, small = false, single = false, label }) {
  // Multi-select chips are checkboxes; single-choice chips (follow-ups) are radios.
  return <div className={`qz-chips${small ? ' is-small' : ''}`} role={single ? 'radiogroup' : 'group'} aria-label={label}>
    {items.map((item) => <button type="button" key={item} role={single ? 'radio' : 'checkbox'} aria-checked={selected.includes(item)} className={`qz-chip${selected.includes(item) ? ' is-on' : ''}`} onClick={() => onToggle(item)}>{labels[item] || item}</button>)}
  </div>;
}

function Rows({ options, value, onChange, labels = {} }) {
  return <div className="qz-rows" role="radiogroup">
    {options.map((option) => <button type="button" role="radio" key={option} aria-checked={value === option} className={`qz-row${value === option ? ' is-on' : ''}`} onClick={() => onChange(option)}>
      <span className="qz-radio" aria-hidden="true" />{labels[option] || option}
    </button>)}
  </div>;
}

function Tiles({ items, selected = [], onToggle, labels = {}, label }) {
  // Multi-select: square checkboxes. Press and hold a tile for its definition (taught in the quiz intro).
  return <div className="qz-tiles" role="group" aria-label={label}>
    {items.map((item, i) => {
      const text = labels[item] || item;
      return <div key={item} className="qz-tile-wrap">
        <button type="button" role="checkbox" aria-label={text} className={`qz-tile tone-${i % 4}${selected.includes(item) ? ' is-on' : ''}`} aria-checked={selected.includes(item)} onClick={() => onToggle(item)}>
          <span className="qz-check" aria-hidden="true">✓</span><span className="qz-tile-text">{text}</span>
        </button>
      </div>;
    })}
  </div>;
}

function Scale({ options, value, onChange }) {
  // Ordered levels as a stepped bar; anything that is not a level (e.g. "It varies") sits underneath as a chip.
  const levels = options.slice(0, 5);
  const extras = options.slice(5);
  return <div className="qz-scale">
    <div className="qz-scale-bars">
      {levels.map((option, i) => <button type="button" key={option} className={`qz-bar${value === option ? ' is-on' : ''}`} style={{ '--h': `${28 + i * 18}px` }} aria-pressed={value === option} onClick={() => onChange(option)}>
        <i aria-hidden="true" /><span>{option}</span>
      </button>)}
    </div>
    {extras.length > 0 && <Chips items={extras} selected={value ? [value] : []} onToggle={onChange} small single />}
  </div>;
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
// Minimum questions, health data, the reveal; then, only if she asks for it
// ("Make my matches more personal"), the optional ones, and back to the reveal.
function webOnboardingSteps(intake) {
  const web = (list, obPart) => list.filter((s) => s.id !== 'lifeStage').map((s) => ({ ...(s.id === 'age'
    ? { ...s, title: 'About you', type: 'aboutYou', why: 'Some products are not meant for every age or stage, for example pregnancy-safe picks only, or midlife support. You can be in perimenopause and still have regular periods. Not sure, or rather not say? Those count too.' }
    : s), obPart }));
  // Starts at question 1: no intro card (onboarding audit #5).
  return [
    ...web(getOnboardingSteps(intake, { part: 'core', surface: 'web' }), 'core'),
    { id: 'connect', section: 'connect', type: 'connect', screen: 7, title: 'Connect health data', subtitle: 'Optional. Quick check-ins work too.', optional: true, required: false, obPart: 'core' },
    { id: 'ready', section: 'ready', type: 'ready', screen: 7, title: '', optional: false, required: false, obPart: 'core' },
    ...web(getOnboardingSteps(intake, { part: 'more', surface: 'web' }), 'more'),
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
      return draftId && webOnboardingSteps({ ...EMPTY, ...(savedDraft?.intake || {}) }).some((s) => s.id === draftId && s.id !== 'ready') ? draftId : 'helpTopics';
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
  const [infoOpen, setInfoOpen] = useState(false);
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

  const go = (id) => { setSearch(''); setInfoOpen(false); setZipError(''); setStepId(id); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const back = () => {
    if (onboarding) { if (index > 0) go(steps[index - 1].id); return; }
    if (atCheckpoint) { go(coreSteps[coreSteps.length - 1].id); return; }
    if (index > 0) go(steps[index - 1].id);
    else if (phase === 'more') go(CHECKPOINT);
  };
  // After the six core questions: a checkpoint. In "more detail", the last step finishes.
  // Editing one answer from the summary returns to the summary.
  const [fromSummary, setFromSummary] = useState(false);
  const advance = (answers = intake) => {
    if (singleStep) { finish(answers); return; }
    if (onboarding) {
      const list = webOnboardingSteps(answers);
      const at = list.findIndex((s) => s.id === step.id);
      if (step.id === 'ready') return;
      if (at >= 0 && at < list.length - 1) go(list[at + 1].id); else go('ready');
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
    if (step.id === 'age' && isMinorAge(intake.age)) return;
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
    switch (step.type) {
      case 'topics': return <>
        <Chips label={step.title} items={HELP_TOPICS} selected={[...(intake.helpTopics || []), ...(helpOther ? [SOMETHING_ELSE] : [])]} onToggle={toggleHelpTopic} />
        {helpOther && <label className="ip-other-text"><span>Tell us in your own words</span><input value={intake.supportOtherText} maxLength={80} placeholder="For example, migraines" onChange={(e) => set('supportOtherText', e.target.value)} /></label>}
        <p className="qz-note">Not sure? Select Next and we will show everything.</p>
      </>;
      case 'goals': return <Chips label={step.title} items={GOALS} selected={intake.goals || []} onToggle={(v) => setIntake((prev) => ({ ...prev, goals: (prev.goals || []).includes(v) ? prev.goals.filter((x) => x !== v) : [...(prev.goals || []), v] }))} />;
      case 'connect': return <>
        <dl className="ay-qc-uses">
          {['sleep', 'cycle', 'temperature', 'heart', 'activity'].filter((k) => CATEGORIES[k]).map((k) => <div key={k}><dt>{CATEGORIES[k].label}</dt><dd>Used {CATEGORIES[k].why.charAt(0).toLowerCase()}{CATEGORIES[k].why.slice(1)}</dd></div>)}
        </dl>
        <p className="qz-note">Connecting is never required. Apple Health and Health Connect connect in the ayna app. On the website you can upload a file or connect Oura from You, Health data, once you have an account. Brands never see it.</p>
      </>;
      case 'aboutYou':
      case 'age':
      case 'lifeStage': return <>
        {/* Her first name, asked here only (sign-up never asks again). */}
        {step.type === 'aboutYou' && <label className="qz-name">
          <span>Your first name <small>Optional</small></span>
          <input className="qz-input" type="text" autoComplete="given-name" maxLength={FIRST_NAME_MAX} value={intake.name || ''} onChange={(e) => set('name', e.target.value)} />
        </label>}
        <AgeField value={intake.age} onChange={(v) => set('age', v)} underage={isMinorAge(intake.age)} onOpenGate={() => setMinorGate(true)} />
        <p className="qz-sub-q" id="qz-stage-q">Your life stage <small>Pick every stage that fits</small></p>
        <Tiles label="Your life stage" items={lifeStageOptions} selected={lifeStages} labels={LIFE_STAGE_LABELS} onToggle={toggleLifeStage} />
        <Chips small label="Other answers" items={LIFE_STAGE_EXCLUSIVE} selected={lifeStages} onToggle={toggleLifeStage} />
        {/* Each stage's follow-up sits right under the tiles (asked once, never again later). */}
        {lifeStages.includes('I am trying to conceive') && <div className="qz-follow"><b>{FOLLOWUP_QUESTIONS.ttcDuration}</b><Chips small single items={withSavedOption(ttcDurationOptions(intake), intake.ttcDuration)} selected={intake.ttcDuration ? [intake.ttcDuration] : []} onToggle={(v) => set('ttcDuration', v)} /></div>}
        {lifeStages.includes('I am pregnant') && <div className="qz-follow"><b>{FOLLOWUP_QUESTIONS.pregnancyTrimester}</b><Chips small single items={withSavedOption(PREGNANCY_TRIMESTER, intake.pregnancyTrimester)} selected={intake.pregnancyTrimester ? [intake.pregnancyTrimester] : []} onToggle={(v) => set('pregnancyTrimester', v)} /></div>}
        {lifeStages.includes('I am postpartum') && <div className="qz-follow"><b>{FOLLOWUP_QUESTIONS.postpartumTiming}</b><Chips small single items={withSavedOption(POSTPARTUM_TIMING, intake.postpartumTiming)} selected={intake.postpartumTiming ? [intake.postpartumTiming] : []} onToggle={(v) => set('postpartumTiming', v)} /></div>}
        {lifeStages.includes('I am postpartum') && <div className="qz-follow"><b>{FOLLOWUP_QUESTIONS.breastfeedingStatus}</b><Chips small single items={BREASTFEEDING_STATUS} selected={intake.breastfeedingStatus ? [intake.breastfeedingStatus] : []} onToggle={(v) => set('breastfeedingStatus', v)} /></div>}
        {lifeStages.includes('I am in perimenopause') && <div className="qz-follow"><b>{FOLLOWUP_QUESTIONS.perimenopauseLastPeriod}</b><Chips small single items={PERIMENOPAUSE_LAST_PERIOD} selected={intake.perimenopauseLastPeriod ? [intake.perimenopauseLastPeriod] : []} onToggle={(v) => setIntake((prev) => setPerimenopausePeriods(prev, v))} /></div>}
      </>;
      case 'zip': return <div className="qz-zip-wrap">
        <input className="qz-input qz-zip" inputMode="numeric" autoComplete="postal-code" value={intake.zipcode} placeholder="e.g. 10027" aria-label="ZIP code"
          aria-invalid={zipError ? true : undefined} aria-describedby={zipError ? 'qz-zip-err' : undefined}
          onChange={(e) => { setZipError(''); set('zipcode', e.target.value.replace(/\D/g, '').slice(0, 5)); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); next(); } }} />
        {zipError && <p className="qz-alert qz-zip-err" id="qz-zip-err" role="alert">{zipError}</p>}
      </div>;
      case 'support': if (onboarding) {
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
        </>;
      } else {
        const q = search.trim().toLowerCase();
        const known = new Set(SUPPORT_GROUPS.flatMap((g) => g.items));
        const tailoredCommon = commonNeedOptions(intake, [...known], COMMON_NEEDS);
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
        </>;
      }
      case 'flow': return <Scale options={PERIOD_FLOW} value={intake.periodFlow} onChange={(v) => set('periodFlow', v)} />;
      case 'pain': return <Scale options={PERIOD_PAIN} value={intake.periodPain} onChange={(v) => set('periodPain', v)} />;
      case 'utiFrequency': return <Rows options={UTI_FREQUENCY} value={intake.utiFrequency} onChange={(v) => set('utiFrequency', v)} />;
      case 'ttcDuration': return <Rows options={ttcDurationOptions(intake)} value={intake.ttcDuration} onChange={(v) => set('ttcDuration', v)} />;
      case 'postpartumTiming': return <>
        <Rows options={POSTPARTUM_TIMING} value={intake.postpartumTiming} onChange={(v) => set('postpartumTiming', v)} />
        {asksBreastfeedingOnTiming(intake) && <div className="qz-follow"><b>{FOLLOWUP_QUESTIONS.breastfeedingStatus}</b><Chips small single items={BREASTFEEDING_STATUS} selected={intake.breastfeedingStatus ? [intake.breastfeedingStatus] : []} onToggle={(v) => set('breastfeedingStatus', v)} /></div>}
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
        <p className="qz-note">Check with a clinician before starting anything new.</p>
      </>;
      case 'products': return <ProductHistory products={intake.productHistory} onChange={(v) => set('productHistory', v)} />;
      case 'avoidRepeat': {
        const history = [...new Set((intake.productHistory || []).map((p) => p.name).filter(Boolean))].filter((n) => !intake.avoidRepeat.includes(n));
        return <>
          <Tokens values={intake.avoidRepeat} onChange={(v) => set('avoidRepeat', v)} placeholder="Product or brand" suggestions={PRODUCT_OR_BRAND_SUGGESTIONS} />
          {history.length > 0 && <div className="qz-follow"><b>From what you tried</b><div className="qz-chips is-small">{history.map((n) => <button type="button" key={n} className="qz-chip is-dashed" onClick={() => set('avoidRepeat', [...intake.avoidRepeat, n])}>+ {n}</button>)}</div></div>}
          <p className="qz-note">These never show up in your picks.</p>
        </>;
      }
      case 'trustedBrands': return <Tokens values={intake.trustedBrands} onChange={(v) => set('trustedBrands', v)} placeholder="Type a brand" suggestions={BRAND_SUGGESTIONS} />;
      case 'safety': return <>
        <Rows options={URGENT_STATUS} value={intake.safetyConcern} onChange={(v) => set('safetyConcern', v)} />
        {['Yes', 'Not sure'].includes(intake.safetyConcern) && <div className="qz-alert-card" role="note"><b>Worth a closer look</b><p>Some new or worsening symptoms need a clinician. ayna helps you find products and doesn’t diagnose. If it feels urgent or severe, get care promptly.{intake.safetyConcern === 'Yes' ? ' We’ll show care options first.' : ''}</p><p className="qz-urgent">If you’re soaking a pad every hour, fainting, or in severe pain, <a href="tel:911">call 911</a> or go to urgent care.</p></div>}
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
          <Chips items={PRICE_RANGES} selected={sel} onToggle={(v) => toggleExclusive('priceRange', v, [notAFactor])} />
          <div className="qz-follow"><b>{FOLLOWUP_QUESTIONS.largePurchaseFrequency}</b><Chips small single items={LARGE_PURCHASE_FREQUENCY} selected={intake.largePurchaseFrequency ? [intake.largePurchaseFrequency] : []} onToggle={(v) => set('largePurchaseFrequency', v)} /></div>
        </>;
      }
      case 'brand': return <Rows options={BRAND_OPENNESS} value={intake.brandOpenness} onChange={(v) => set('brandOpenness', v)} />;
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
      case 'fsa': return <div className="qz-fsa">{FSA_HSA.map((o) => <button type="button" key={o} className={intake.fsaHsaAnswer === o ? 'is-on' : ''} aria-pressed={intake.fsaHsaAnswer === o} onClick={() => set('fsaHsaAnswer', o)}>{o}</button>)}</div>;
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
  const ready = step.id === 'zip' ? String(intake.zipcode || '').length > 0 : requiredReady(answerId, intake) && isStepAnswered(answerId, intake) && !minorBlocked;

  // First run, last screen: the reveal. "See my Today" saves and opens Today.
  if (onboarding && step.type === 'ready') {
    const preview = mapIntakeToLegacyQuizProfile(buildSnapshot(intake));
    return <div className="ct qz-page" data-step="ready">
      <ReadyReveal variant="web" answers={preview} signedIn={signedIn} onSeeToday={() => finish(intake, { land: 'today' })} onCreateAccount={() => finish(intake, { land: 'save' })} onBack={back} onMorePersonal={() => { const more = steps.find((s) => s.obPart === 'more'); if (more) go(more.id); }} />
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

  if (atCheckpoint) {
    return <div className="ct qz-page" data-step="checkpoint">
      <div className="qz-stage">
      <div className="qz-card qz-checkpoint">
        <header className="qz-head">
          <button type="button" className="qz-round" aria-label="Previous question" onClick={back}>←</button>
          <div className="qz-progress" aria-hidden="true">{coreSteps.map((s) => <span key={s.id} className="is-done" />)}</div>
          <span className="qz-count">{coreSteps.filter((st) => !FOLLOWUP_STEP_IDS.has(st.id)).length}<i>/{coreSteps.filter((st) => !FOLLOWUP_STEP_IDS.has(st.id)).length}</i></span>
        </header>
        <h1 className="qz-title">Your first matches are ready</h1>
        <p className="qz-subtitle">{intake.safetyConcern === 'Yes' ? 'You said something may be urgent, so care options come first.' : 'That’s enough for your first picks. Add more now for closer ones, or any time later from your profile.'}</p>
        {saveError && <p className="qz-alert">{saveError}</p>}
        <div className="qz-checkpoint-actions">
          <button type="button" className="qz-btn" onClick={() => finish()} disabled={saving}>{saving ? 'Saving…' : 'See my results'} <span aria-hidden="true">→</span></button>
          <button type="button" className="qz-btn is-ghost" onClick={() => go(moreSteps[0].id)} disabled={saving || !moreSteps.length}>Make my matches more personal</button>
        </div>
        <p className="qz-note">{moreSteps.length} more quick questions, all optional. Skip any of them.</p>
      </div>
      </div>
    </div>;
  }

  const obProgress = onboarding ? onboardingProgress(step, step.obPart === 'more' ? 'more' : 'core', steps.filter((s) => s.obPart === 'more')) : null;
  return <div className="ct qz-page" data-step={step.id} data-phase={phase}>
    <div className="qz-stage">
    <div className="qz-card" key={step.id}>
      <header className="qz-head">
        {index === 0 && (phase === 'core' || phase === 'onboarding') ? <span className="qz-round is-spacer" aria-hidden="true" /> : <button type="button" className="qz-round" aria-label="Previous question" onClick={back}>←</button>}
        {onboarding ? <>
          <div className="qz-progress" aria-hidden="true">{Array.from({ length: obProgress.total }, (_, i) => <span key={i} className={i + 1 < obProgress.now ? 'is-done' : i + 1 === obProgress.now ? 'is-now' : ''} />)}</div>
          <span className="qz-count" aria-label={obProgress.label}>{obProgress.now}<i>/{obProgress.total}</i></span>
        </> : <>
          <div className="qz-progress" aria-hidden="true">{Array.from({ length: shownTotal }, (_, i) => <span key={i} className={i + 1 < shownIndex ? 'is-done' : i + 1 === shownIndex ? 'is-now' : ''} />)}</div>
          <span className="qz-count" aria-label={`${phase === 'more' ? 'Optional question' : 'Question'} ${shownIndex} of ${shownTotal}`}>{shownIndex}<i>/{shownTotal}</i></span>
        </>}
        {!initialSnapshot && <p className="qz-saved-note">Answers are saved on this device</p>}
        {onboarding && index === 0 && onExplore && <button type="button" className="qz-skip qz-explore" onClick={onExplore}>Explore first</button>}
      </header>

      {/* No eyebrow label above the question (onboarding audit #4); the row keeps only its tools. */}
      {(phase === 'more' || (step.info && !onboarding)) && <div className="qz-label-row">
        <span className="qz-label-tools">
          {phase === 'more' && <button type="button" className="qz-skip qz-to-results" onClick={() => finish()} disabled={saving}>See my results</button>}
          {step.info && !onboarding && <button type="button" className="qz-info" aria-label={`About this question: ${step.title}`} aria-expanded={infoOpen} onClick={() => setInfoOpen((v) => !v)}>i</button>}
        </span>
      </div>}
      <h1 className="qz-title">{step.title}</h1>
      {step.subtitle && <p className="qz-subtitle">{step.subtitle}</p>}
      {infoOpen && step.info && <p className="qz-info-pop" role="note">{step.info}</p>}
      {onboarding && step.why && <p className="ip-why"><b>Why we ask:</b> {step.why}</p>}

      <div className="qz-answer" onPointerDown={startHold} onPointerUp={endHold} onPointerLeave={endHold} onPointerCancel={endHold}
        onPointerMove={(e) => { if (Math.abs(e.movementX) + Math.abs(e.movementY) > 6) endHold(); }} onClickCapture={swallow}
        onContextMenu={(e) => { if (hold.current.fired) e.preventDefault(); }}>
        {body()}
      </div>

      {saveError && <p className="qz-alert">{saveError}</p>}
      <footer className="qz-foot">
        {step.optional || step.type === 'topics' ? <button type="button" className="qz-skip" onClick={skip} disabled={saving}>Skip for now</button> : <span className="qz-required">{step.section === 'safety' ? 'Needed for safety' : 'Needed for your matches'}</span>}
        {ready && !saving && <span className="qz-noted" aria-hidden="true">noted</span>}
        {!ready && missingAnswerHint(answerId, intake) && <p className="ip-why" role="status">{missingAnswerHint(answerId, intake)}</p>}
        <button type="button" className="qz-btn" onClick={next} disabled={!ready || saving}>{saving ? 'Saving…' : (isLast && phase === 'more') || singleStep ? (singleStep ? 'Save' : 'See my results') : 'Next'} <span aria-hidden="true">→</span></button>
      </footer>
    </div>
    </div>

    {glossary && <div className="qz-glossary" role="dialog" aria-label={glossary.term} onClick={() => setGlossary(null)}>
      <div onClick={(e) => e.stopPropagation()}><strong>{glossary.term}</strong><p>{glossary.definition}</p><button type="button" className="qz-btn" onClick={() => setGlossary(null)}>Got it</button></div>
    </div>}
  </div>;
}
