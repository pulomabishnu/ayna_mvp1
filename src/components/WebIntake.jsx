import { useEffect, useMemo, useRef, useState } from 'react';
import { mapIntakeToLegacyQuizProfile } from '../utils/healthIntake.js';
import { saveHealthIntakeForCurrentUser } from '../utils/healthIntakeStore.js';
import { defineOption } from '../mobile/data/glossary.js';
import {
  ALLERGY_STATUS, AVOID_LABELS, CHECKPOINT_STEP, LIFE_STAGE_EXCLUSIVE, MEDICATION_STATUS, URGENT_STATUS,
  firstUnansweredStepId, isStepAnswered, markSkipped, splitIntakeSteps, toggleLifeStageSelection,
  ALLERGIES, AVOID_GROUPS, AVOID_INGREDIENTS, AVOID_PAIRS, BRAND_OPENNESS, BRAND_SUGGESTIONS, BREASTFEEDING_STATUS, CATALOG_PRODUCT_NAMES,
  CONDITIONS, EMPTY, FOLLOWUP_QUESTIONS, FREE_TEXT_PROMPTS, FSA_HSA, INTAKE_DRAFT_KEY, LARGE_PURCHASE_FREQUENCY, LIFE_STAGES,
  LIFE_STAGE_LABELS, LIFE_STAGE_VALUE_BY_LABEL, MEDICATION_SUGGESTIONS, MIDLIFE_LIFE_STAGES, PERIMENOPAUSE_LAST_PERIOD,
  PERIOD_FLOW, PERIOD_PAIN, POSTPARTUM_TIMING, PREGNANCY_TRIMESTER, PRICE_RANGES, PRODUCT_FORMATS,
  PRODUCT_OR_BRAND_SUGGESTIONS, STOP_REASONS, SUPPORT_GROUPS, UTI_FREQUENCY, buildSnapshot,
  getLifeStages, isMinorAge, normalizeSuggestion, readIntakeDraft, reconstructIntakeFromSnapshot,
  requiredReady, asksBreastfeedingOnTiming, ttcDurationOptions, isValidUsZip,
} from '../mobile/data/intakeModel.js';
import SmartSearchInput from './search/SmartSearchInput.jsx';
import { rankSearchOptions as rankedSuggestions, matchesSearchOption } from '../utils/search/index.js';
import './WebIntake.css';
import { commonNeedOptions } from '../matching/commonNeeds.js';
// Website-only conditions that change what is safe (condition research, Oct 17).
const WEB_EXTRA_CONDITIONS = ['Kidney disease', 'Bleeding or clotting disorder', 'History of blood clots', 'Heart disease', 'Liver disease', 'Stomach ulcer or stomach bleeding', 'Asthma'];
import '../styles/audit-qya.css';

// The website's quiz. Same questions, order, branching and saved answers as
// the app (all of that lives in mobile/data/intakeModel.js); only the layout
// and controls are built for a browser.

const SECTION_NAMES = { core: 'The basics', support: 'Your needs', safety: 'Safety', history: 'What you tried', preferences: 'Your preferences', trust: 'Last bits' };
const SECTION_PHOTOS = {
  core: ['robe-vanity', 'tub-girls', 'bed-selfie'],
  support: ['curlers-call', 'pajamas-overhead', 'lilies'],
  safety: ['sink-tea', 'marble-counter', 'blue-sink'],
  history: ['bag-tubes', 'sink-flatlay', 'pink-tile-shelf'],
  preferences: ['vanity-hairdryer', 'sink-heels-dryer', 'robe-kiss'],
  trust: ['laundry-duo', 'stalls-trio', 'pink-stripe-floor'],
};

/* Decorative side panel (desktop): big question number, section in handwriting, a pile of photos. */
function QuizSide({ n, total, section, photos }) {
  return <aside className="wq-side" aria-hidden="true">
    <p className="wq-side__q"><span>Q</span>{n}<small>of {total}</small></p>
    <p className="wq-side__sec">{section}</p>
    <div className="wq-side__pile" key={photos.join()}>
      {photos.map((k, i) => <img key={k} className={`is-${i}`} src={`/landing/${k}.webp`} alt="" loading="lazy" />)}
    </div>
  </aside>;
}

const SECTION_TONES = { core: 'peri', support: 'pink', safety: 'butter', history: 'mint', preferences: 'peri', trust: 'pink' };

/* ------------------------------ Controls ------------------------------ */

function Chips({ items, selected = [], onToggle, labels = {}, small = false, single = false, label }) {
  // Multi-select chips are checkboxes; single-choice chips (follow-ups) are radios.
  return <div className={`wq-chips${small ? ' is-small' : ''}`} role={single ? 'radiogroup' : 'group'} aria-label={label}>
    {items.map((item) => <button type="button" key={item} role={single ? 'radio' : 'checkbox'} aria-checked={selected.includes(item)} className={`wq-chip${selected.includes(item) ? ' is-on' : ''}`} onClick={() => onToggle(item)}>{labels[item] || item}</button>)}
  </div>;
}

function Rows({ options, value, onChange }) {
  return <div className="wq-rows" role="radiogroup">
    {options.map((option) => <button type="button" role="radio" key={option} aria-checked={value === option} className={`wq-row${value === option ? ' is-on' : ''}`} onClick={() => onChange(option)}>
      <span className="wq-radio" aria-hidden="true" />{option}
    </button>)}
  </div>;
}

function Tiles({ items, selected = [], onToggle, labels = {}, label }) {
  // Multi-select: square checkboxes. Press and hold a tile for its definition (taught in the quiz intro).
  return <div className="wq-tiles" role="group" aria-label={label}>
    {items.map((item, i) => {
      const text = labels[item] || item;
      return <div key={item} className="wq-tile-wrap">
        <button type="button" role="checkbox" aria-label={text} className={`wq-tile tone-${i % 4}${selected.includes(item) ? ' is-on' : ''}`} aria-checked={selected.includes(item)} onClick={() => onToggle(item)}>
          <span className="wq-check" aria-hidden="true">✓</span><span className="wq-tile-text">{text}</span>
        </button>
      </div>;
    })}
  </div>;
}

function Scale({ options, value, onChange }) {
  // Ordered levels as a stepped bar; anything that is not a level (e.g. "It varies") sits underneath as a chip.
  const levels = options.slice(0, 5);
  const extras = options.slice(5);
  return <div className="wq-scale">
    <div className="wq-scale-bars">
      {levels.map((option, i) => <button type="button" key={option} className={`wq-bar${value === option ? ' is-on' : ''}`} style={{ '--h': `${28 + i * 18}px` }} aria-pressed={value === option} onClick={() => onChange(option)}>
        <i aria-hidden="true" /><span>{option}</span>
      </button>)}
    </div>
    {extras.length > 0 && <Chips items={extras} selected={value ? [value] : []} onToggle={onChange} small single />}
  </div>;
}

function Search({ value, onChange, placeholder }) {
  return <label className="wq-search">
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
    <SmartSearchInput value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
    {value && <button type="button" aria-label="Clear" onClick={() => onChange('')}>×</button>}
  </label>;
}

function AddCustom({ query, options, onAdd }) {
  const value = query.trim().replace(/\s+/g, ' ');
  if (value.length < 2 || options.some((item) => item.toLowerCase() === value.toLowerCase())) return null;
  return <button type="button" className="wq-chip is-dashed" onClick={() => onAdd(value)}>+ Add “{value}”</button>;
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
  return <div className="wq-tokens-wrap">
    <label className="wq-search">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
      <SmartSearchInput vocabulary={suggestions} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && draft.trim()) { e.preventDefault(); add(draft); } }} placeholder={placeholder} aria-label={placeholder} />
    </label>
    {draft.trim() && <div className="wq-suggest" role="listbox">
      <button type="button" className="is-add" onClick={() => add(draft)}>+ Add “{draft.trim()}”</button>
      {matches.map((m) => <button type="button" key={m} onClick={() => add(m)}>{m}</button>)}
    </div>}
    {values.length > 0 && <div className="wq-tokens">{values.map((v, i) => <span key={`${v}-${i}`} className="wq-token">{v}<button type="button" aria-label={`Remove ${v}`} onClick={() => onChange(values.filter((_, idx) => idx !== i))}>×</button></span>)}</div>}
  </div>;
}

function AddOwn({ placeholder, onAdd }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  if (!open) return <button type="button" className="wq-chip is-dashed" onClick={() => setOpen(true)}>+ Add your own</button>;
  const submit = () => { if (text.trim().length >= 2) onAdd(text.trim()); setText(''); setOpen(false); };
  return <form className="wq-addown" onSubmit={(e) => { e.preventDefault(); submit(); }}>
    <input autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} maxLength={60} onBlur={() => { if (!text.trim()) setOpen(false); }} />
    <button type="submit" disabled={text.trim().length < 2}>Add</button>
  </form>;
}

function AgeField({ value, onChange, underage, onOpenGate }) {
  // Type it or slide it, like the app's dial (founder meeting note).
  const n = Number.parseInt(value, 10);
  const set = Number.isFinite(n);
  // The slider and the box never disagree: until she picks an age the slider has no thumb.
  const slider = set ? Math.min(80, Math.max(18, n)) : 18;
  return <div className={`wq-age${underage ? ' is-under' : ''}`}>
    <label className="wq-age-field">
      <span>Your age</span>
      <input type="text" inputMode="numeric" pattern="[0-9]*" autoComplete="off" name="age" aria-label="Your age in years" value={value} placeholder="e.g. 29" maxLength={2} aria-describedby={underage ? 'wq-age-alert' : undefined} aria-invalid={underage || undefined}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 2))} />
      <small>years</small>
    </label>
    <div className={`wq-age-slide${set ? '' : ' is-empty'}`}>
      <span aria-hidden="true">18</span>
      <input type="range" min={18} max={80} step={1} value={slider} aria-label="Slide to pick your age" aria-valuetext={set ? (n >= 80 ? '80 or older' : `${n} years`) : 'Not set'} onChange={(e) => onChange(String(e.target.value))} />
      <span aria-hidden="true">80+</span>
    </div>
    {underage && <p className="wq-alert" id="wq-age-alert">ayna is for people 18 and over. <button type="button" onClick={onOpenGate}>What you can do instead</button></p>}
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
  return <div className="wq-history">
    <label className="wq-search">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
      <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && query.trim()) { e.preventDefault(); add(query); } }} placeholder="Search products you've used" aria-label="Search products" />
    </label>
    {query.trim() && <div className="wq-suggest"><button type="button" className="is-add" onClick={() => add(query)}>+ Add “{query.trim()}”</button>{suggestions.map((s) => <button type="button" key={s} onClick={() => add(s)}>{s}</button>)}</div>}
    {products.map((p, i) => {
      const expanded = open === i;
      const summary = [p.current && (p.current === 'Yes' ? 'Using now' : 'Stopped'), p.worked, p.reaction && p.reaction !== 'No' ? `${p.reaction} reaction` : ''].filter(Boolean);
      return <div key={`${p.name}-${i}`} className={`wq-hcard${expanded ? ' is-open' : ''}`}>
        <button type="button" className="wq-hcard-head" aria-expanded={expanded} onClick={() => setOpen(expanded ? null : i)}>
          <span><strong>{p.name}</strong><small>{summary.length ? summary.join(' · ') : 'Add details (optional)'}</small></span><i aria-hidden="true">{expanded ? '−' : '+'}</i>
        </button>
        {expanded && <div className="wq-hcard-body">
          <div><b>Using it now?</b><Chips small single items={['Yes', 'No']} selected={one(p.current)} onToggle={(v) => update(i, { current: v })} /></div>
          <div><b>Did it help?</b><Chips small single items={['Helped a lot', 'Helped somewhat', 'No difference', 'Made it worse', 'Not sure']} selected={one(p.worked)} onToggle={(v) => update(i, { worked: v })} /></div>
          <div><b>Any reaction?</b><Chips small single items={['No', 'Mild', 'Serious', 'Not sure']} selected={one(p.reaction)} onToggle={(v) => update(i, { reaction: v })} /></div>
          {['Mild', 'Serious'].includes(p.reaction) && <input className="wq-input" value={p.reactionText} onChange={(e) => update(i, { reactionText: e.target.value })} placeholder="What happened? (optional)" aria-label="What happened" />}
          {p.current === 'No' && <div><b>Why did you stop?</b><Chips small items={STOP_REASONS} selected={p.stopReasons || []} onToggle={(r) => update(i, { stopReasons: (p.stopReasons || []).includes(r) ? p.stopReasons.filter((x) => x !== r) : [...(p.stopReasons || []), r] })} /></div>}
          <button type="button" className="wq-link-danger" onClick={() => { onChange(products.filter((_, idx) => idx !== i)); setOpen(null); }}>Remove</button>
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
  return <ol className="wq-rank">
    {order.map((item, i) => <li key={item} draggable onDragStart={() => { dragFrom.current = i; }} onDragOver={(e) => e.preventDefault()}
      onDrop={() => { const from = dragFrom.current; if (from == null || from === i) return; const next = [...order]; const [x] = next.splice(from, 1); next.splice(i, 0, x); onChange(next); onTouch(); dragFrom.current = null; }}
      className={`tone-${i}`}>
      <b>{i + 1}</b><span>{item}</span>
      <span className="wq-rank-moves">
        <button type="button" aria-label={`Move ${item} up`} disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
        <button type="button" aria-label={`Move ${item} down`} disabled={i === order.length - 1} onClick={() => move(i, 1)}>↓</button>
      </span>
    </li>)}
  </ol>;
}

function MinorGate({ onChangeAge, onBrowseLibrary }) {
  return <div className="wq-gate">
    <h2>We can’t take you through the quiz</h2>
    <p>ayna is built for people 18 and over. Because the quiz leads to supplement and product guidance, we don’t create profiles for minors. That’s a conversation for a parent, guardian or clinician who knows your history.</p>
    <ol>
      <li><b>Talk to someone who can help.</b> A parent, guardian, school nurse or your own doctor can look at symptoms with your full history in front of them.</li>
      <li><b>Read, without a profile.</b> Our explainers on cycles, sleep and nutrition stay open to everyone. Nothing personalized, nothing stored.</li>
      <li><b>Come back at 18.</b> We’ll still be here.</li>
    </ol>
    <p className="wq-fine">If you’re in immediate distress, contact a local emergency service or a crisis line.</p>
    <div className="wq-gate-actions">
      <button type="button" className="wq-btn" onClick={onBrowseLibrary}>Browse the reading library</button>
      <button type="button" className="wq-btn is-ghost" onClick={onChangeAge}>Change my age</button>
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

const FOLLOWUP_STEP_IDS = new Set(['periodFlow', 'periodPain', 'utiFrequency', 'ttcDuration', 'postpartumTiming', 'pregnancyTrimester']);
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

export default function WebIntake({ onComplete, onBrowseLibrary, initialSnapshot = null }) {
  const [savedDraft] = useState(() => (initialSnapshot ? null : readIntakeDraft()));
  const [intake, setIntake] = useState(() => (savedDraft ? { ...EMPTY, ...savedDraft.intake } : reconstructIntakeFromSnapshot(initialSnapshot)));
  const [stepId, setStepId] = useState(() => {
    if (savedDraft?.stepId) return savedDraft.stepId === 'lifeStage' ? 'age' : savedDraft.stepId;
    return initialSnapshot ? firstUnansweredStep(reconstructIntakeFromSnapshot(initialSnapshot)) : 'age';
  });
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

  // Same draft the app keeps, so an unfinished quiz resumes on either.
  useEffect(() => {
    if (initialSnapshot) return;
    const hasProgress = stepId !== 'age' || JSON.stringify(intake) !== JSON.stringify(EMPTY);
    try {
      if (hasProgress) localStorage.setItem(INTAKE_DRAFT_KEY, JSON.stringify({ version: 1, intake, stepId }));
      else localStorage.removeItem(INTAKE_DRAFT_KEY);
    } catch { /* storage unavailable */ }
  }, [intake, stepId, initialSnapshot]);

  const { core: coreSteps, more: moreSteps } = useMemo(() => splitSteps(intake), [intake]);
  const atCheckpoint = stepId === CHECKPOINT;
  const phase = moreSteps.some((s) => s.id === stepId) ? 'more' : 'core';
  const steps = phase === 'more' ? moreSteps : coreSteps;
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
    return { ...prev, lifeStageSelections: n, lifeStage: n.find((v) => !LIFE_STAGE_EXCLUSIVE.includes(v)) || '' };
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
    if (atCheckpoint) { go(coreSteps[coreSteps.length - 1].id); return; }
    if (index > 0) go(steps[index - 1].id);
    else if (phase === 'more') go(CHECKPOINT);
  };
  // After the six core questions: a checkpoint. In "more detail", the last step finishes.
  // Editing one answer from the summary returns to the summary.
  const [fromSummary, setFromSummary] = useState(false);
  const advance = (answers = intake) => {
    if (fromSummary) { setFromSummary(false); go(CHECKPOINT); return; }
    if (!isLast) { go(steps[index + 1].id); return; }
    if (phase === 'core') go(CHECKPOINT); else finish(answers);
  };
  const finish = async (answers = intake) => {
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
    onComplete(mapIntakeToLegacyQuizProfile(snapshot));
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

  const body = () => {
    switch (step.type) {
      case 'aboutYou':
      case 'age':
      case 'lifeStage': return <>
        <AgeField value={intake.age} onChange={(v) => set('age', v)} underage={isMinorAge(intake.age)} onOpenGate={() => setMinorGate(true)} />
        <p className="wq-sub-q" id="wq-stage-q">Your life stage <small>Pick every stage that fits</small></p>
        <Tiles label="Your life stage" items={lifeStageOptions} selected={lifeStages} labels={LIFE_STAGE_LABELS} onToggle={toggleLifeStage} />
        <Chips small label="Other answers" items={LIFE_STAGE_EXCLUSIVE} selected={lifeStages} onToggle={toggleLifeStage} />
        {lifeStages.includes('I am postpartum') && <div className="wq-follow"><b>{FOLLOWUP_QUESTIONS.breastfeedingStatus}</b><Chips small single items={BREASTFEEDING_STATUS} selected={intake.breastfeedingStatus ? [intake.breastfeedingStatus] : []} onToggle={(v) => set('breastfeedingStatus', v)} /></div>}
        {lifeStages.includes('I am in perimenopause') && <div className="wq-follow"><b>{FOLLOWUP_QUESTIONS.perimenopauseLastPeriod}</b><Chips small single items={PERIMENOPAUSE_LAST_PERIOD} selected={intake.perimenopauseLastPeriod ? [intake.perimenopauseLastPeriod] : []} onToggle={(v) => set('perimenopauseLastPeriod', v)} /></div>}
      </>;
      case 'zip': return <div className="wq-zip-wrap">
        <input className="wq-input wq-zip" inputMode="numeric" autoComplete="postal-code" value={intake.zipcode} placeholder="e.g. 10027" aria-label="ZIP code"
          aria-invalid={zipError ? true : undefined} aria-describedby={zipError ? 'wq-zip-err' : undefined}
          onChange={(e) => { setZipError(''); set('zipcode', e.target.value.replace(/\D/g, '').slice(0, 5)); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); next(); } }} />
        {zipError && <p className="wq-alert wq-zip-err" id="wq-zip-err" role="alert">{zipError}</p>}
      </div>;
      case 'support': {
        const q = search.trim().toLowerCase();
        const known = new Set(SUPPORT_GROUPS.flatMap((g) => g.items));
        const tailoredCommon = commonNeedOptions(intake, [...known], COMMON_NEEDS);
        const custom = intake.supportSelections.filter((i) => !known.has(i));
        return <>
          <Search value={search} onChange={setSearch} placeholder="Search, e.g. cramps, sleep, acne" />
          <AddCustom query={search} options={[...known, ...intake.supportSelections]} onAdd={(v) => addCustom('supportSelections', v, ['Nothing right now'])} />
          {q ? (
            <div className="wq-groups">
              {SUPPORT_GROUPS.map((g) => {
                const items = g.items.filter((i) => matchesSearchOption(q, i));
                if (!items.length) return null;
                return <section key={g.label} className="wq-group"><h3>{g.label}</h3><Chips items={items} selected={intake.supportSelections} onToggle={(v) => toggleExclusive('supportSelections', v, ['Nothing right now'])} /></section>;
              })}
            </div>
          ) : !showAllNeeds ? <>
            <Tiles label={tailoredCommon !== COMMON_NEEDS ? 'Common at your stage' : 'Common needs'} items={[...tailoredCommon, ...intake.supportSelections.filter((i) => known.has(i) && !tailoredCommon.includes(i) && i !== 'Nothing right now')]} selected={intake.supportSelections} onToggle={(v) => toggleExclusive('supportSelections', v, ['Nothing right now'])} />
            <div className="wq-chips is-small">
              <button type="button" className="wq-chip is-dashed" aria-expanded="false" onClick={() => setShowAllNeeds(true)}>More topics</button>
              <Chips small items={['Nothing right now']} selected={intake.supportSelections} onToggle={(v) => toggleExclusive('supportSelections', v, ['Nothing right now'])} />
            </div>
          </> : (() => {
            const activeLabel = supportTab || SUPPORT_GROUPS.find((g) => g.items.some((i) => intake.supportSelections.includes(i)))?.label || SUPPORT_GROUPS[0]?.label;
            const group = SUPPORT_GROUPS.find((g) => g.label === activeLabel) || SUPPORT_GROUPS[0];
            return <>
              <div className="wq-topic-tabs" role="tablist" aria-label="Topics">
                {SUPPORT_GROUPS.map((g) => {
                  const count = g.items.filter((i) => intake.supportSelections.includes(i)).length;
                  return <button type="button" role="tab" key={g.label} aria-selected={g.label === group.label} className={g.label === group.label ? 'is-on' : ''} onClick={() => setSupportTab(g.label)}>{TOPIC_SHORT[g.label] || g.label}{count > 0 && <b>{count}</b>}</button>;
                })}
              </div>
              <div className="wq-topic-panel" role="tabpanel" key={group.label}>
                <Chips items={group.items} selected={intake.supportSelections} onToggle={(v) => toggleExclusive('supportSelections', v, ['Nothing right now'])} />
              </div>
            </>;
          })()}
          {custom.length > 0 && <section className="wq-group"><h3>Added by you</h3><Chips small items={custom} selected={custom} onToggle={(v) => toggleExclusive('supportSelections', v)} /></section>}
        </>;
      }
      case 'flow': return <Scale options={PERIOD_FLOW} value={intake.periodFlow} onChange={(v) => set('periodFlow', v)} />;
      case 'pain': return <Scale options={PERIOD_PAIN} value={intake.periodPain} onChange={(v) => set('periodPain', v)} />;
      case 'utiFrequency': return <Rows options={UTI_FREQUENCY} value={intake.utiFrequency} onChange={(v) => set('utiFrequency', v)} />;
      case 'ttcDuration': return <Rows options={ttcDurationOptions(intake)} value={intake.ttcDuration} onChange={(v) => set('ttcDuration', v)} />;
      case 'postpartumTiming': return <>
        <Rows options={POSTPARTUM_TIMING} value={intake.postpartumTiming} onChange={(v) => set('postpartumTiming', v)} />
        {asksBreastfeedingOnTiming(intake) && <div className="wq-follow"><b>{FOLLOWUP_QUESTIONS.breastfeedingStatus}</b><Chips small single items={BREASTFEEDING_STATUS} selected={intake.breastfeedingStatus ? [intake.breastfeedingStatus] : []} onToggle={(v) => set('breastfeedingStatus', v)} /></div>}
      </>;
      case 'pregnancyTrimester': return <Rows options={PREGNANCY_TRIMESTER} value={intake.pregnancyTrimester} onChange={(v) => set('pregnancyTrimester', v)} />;
      case 'conditions': {
        const items = ['None that I know of', 'Prefer not to say', ...CONDITIONS.filter((i) => !['None that I know of', 'Prefer not to say', 'Other / not listed'].includes(i)), ...WEB_EXTRA_CONDITIONS, 'Other / not listed'];
        const q = search.trim().toLowerCase();
        const custom = intake.diagnosisSelections.filter((i) => !items.includes(i));
        return <>
          <Search value={search} onChange={setSearch} placeholder="Search conditions" />
          <AddCustom query={search} options={[...items, ...intake.diagnosisSelections]} onAdd={(v) => addCustom('diagnosisSelections', v, ['None that I know of', 'Prefer not to say'])} />
          <Chips items={[...(q ? items.filter((i) => matchesSearchOption(q, i)) : items), ...custom]} selected={intake.diagnosisSelections} onToggle={(v) => toggleExclusive('diagnosisSelections', v, ['None that I know of', 'Prefer not to say'])} />
        </>;
      }
      case 'allergies': return <>
        <Rows options={ALLERGY_STATUS} value={intake.allergyStatus} onChange={(v) => setIntake((prev) => ({ ...prev, allergyStatus: v, allergyItems: v === 'Yes' ? prev.allergyItems : [] }))} />
        {intake.allergyStatus === 'Yes' && <Tokens values={intake.allergyItems} onChange={(v) => set('allergyItems', v)} placeholder="Type an allergy or sensitivity" suggestions={ALLERGIES} />}
      </>;
      case 'medications': return <>
        <Rows options={MEDICATION_STATUS} value={intake.takesCurrent} onChange={(v) => setIntake((prev) => ({ ...prev, takesCurrent: v, currentMedicationItems: v === 'Yes' ? prev.currentMedicationItems : [] }))} />
        {intake.takesCurrent === 'Yes' && <Tokens values={intake.currentMedicationItems} onChange={(v) => set('currentMedicationItems', v)} placeholder="Medication, supplement, or birth control" suggestions={MEDICATION_SUGGESTIONS} limit={10} />}
        <p className="wq-note">Check with a clinician before starting anything new.</p>
      </>;
      case 'products': return <ProductHistory products={intake.productHistory} onChange={(v) => set('productHistory', v)} />;
      case 'avoidRepeat': {
        const history = [...new Set((intake.productHistory || []).map((p) => p.name).filter(Boolean))].filter((n) => !intake.avoidRepeat.includes(n));
        return <>
          <Tokens values={intake.avoidRepeat} onChange={(v) => set('avoidRepeat', v)} placeholder="Product or brand" suggestions={PRODUCT_OR_BRAND_SUGGESTIONS} />
          {history.length > 0 && <div className="wq-follow"><b>From what you tried</b><div className="wq-chips is-small">{history.map((n) => <button type="button" key={n} className="wq-chip is-dashed" onClick={() => set('avoidRepeat', [...intake.avoidRepeat, n])}>+ {n}</button>)}</div></div>}
          <p className="wq-note">These never show up in your picks.</p>
        </>;
      }
      case 'trustedBrands': return <Tokens values={intake.trustedBrands} onChange={(v) => set('trustedBrands', v)} placeholder="Type a brand" suggestions={BRAND_SUGGESTIONS} />;
      case 'safety': return <>
        <Rows options={URGENT_STATUS} value={intake.safetyConcern} onChange={(v) => set('safetyConcern', v)} />
        {['Yes', 'Not sure'].includes(intake.safetyConcern) && <div className="wq-alert-card" role="note"><b>Worth a closer look</b><p>Some new or worsening symptoms need a clinician. ayna helps you discover products and doesn’t diagnose. If it feels urgent or severe, get care promptly.{intake.safetyConcern === 'Yes' ? ' We’ll show care options first.' : ''}</p><p className="wq-urgent">If you’re soaking a pad every hour, fainting, or in severe pain, <a href="tel:911">call 911</a> or go to urgent care.</p></div>}
      </>;
      case 'formats': {
        const custom = intake.preferredFormats.filter((f) => !PRODUCT_FORMATS.includes(f));
        return <>
          <Tiles label={step.title} items={PRODUCT_FORMATS} selected={intake.preferredFormats} onToggle={(v) => toggleExclusive('preferredFormats', v, ['No preference'])} />
          <div className="wq-chips is-small wq-format-own">
            {custom.length > 0 && <Chips small items={custom} selected={custom} onToggle={(v) => toggleExclusive('preferredFormats', v)} />}
            <AddOwn placeholder="Add a format" onAdd={(v) => addCustom('preferredFormats', v, ['No preference'])} />
          </div>
        </>;
      }
      case 'recommendationCount': return <div className="wq-count">{[1, 2, 3, 5].map((c) => <button type="button" key={c} className={Number(intake.recommendedProductsPerArea) === c ? 'is-on' : ''} aria-pressed={Number(intake.recommendedProductsPerArea) === c} onClick={() => setIntake((prev) => ({ ...prev, recommendedProductsPerArea: c, recommendationCountTouched: true }))}><strong>{c}</strong><span>{c === 1 ? 'pick' : 'picks'}</span></button>)}</div>;
      case 'price': {
        const sel = Array.isArray(intake.priceRange) ? intake.priceRange : (intake.priceRange ? [intake.priceRange] : []);
        const notAFactor = 'Price is not a major factor for me';
        return <>
          <Chips items={PRICE_RANGES} selected={sel} onToggle={(v) => toggleExclusive('priceRange', v, [notAFactor])} />
          <div className="wq-follow"><b>{FOLLOWUP_QUESTIONS.largePurchaseFrequency}</b><Chips small single items={LARGE_PURCHASE_FREQUENCY} selected={intake.largePurchaseFrequency ? [intake.largePurchaseFrequency] : []} onToggle={(v) => set('largePurchaseFrequency', v)} /></div>
        </>;
      }
      case 'brand': return <Rows options={BRAND_OPENNESS} value={intake.brandOpenness} onChange={(v) => set('brandOpenness', v)} />;
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
        return <div className="wq-avoid">
          <div className="wq-avoid-tabs" role="tablist" aria-label="Leave out or should be">
            <button type="button" role="tab" aria-selected={onAvoid} className={`is-avoid${onAvoid ? ' is-on' : ''}`} onClick={() => setAvoidTab('avoid')}>Leave out{avoidSel.length > 0 && <span>{avoidSel.length}</span>}</button>
            <button type="button" role="tab" aria-selected={!onAvoid} className={`is-want${!onAvoid ? ' is-on' : ''}`} onClick={() => setAvoidTab('want')}>Should be{wantSel.length > 0 && <span>{wantSel.length}</span>}</button>
          </div>
          <div className="wq-avoid-panel" role="tabpanel" key={avoidTab}>
            <Chips label={onAvoid ? 'Leave out' : 'Should be'} items={onAvoid ? [...AVOID_GROUPS.avoid, ...customAvoid] : [...AVOID_GROUPS.want, ...customWant]} selected={onAvoid ? avoidSel : wantSel} onToggle={toggle} labels={AVOID_LABELS} />
          </div>
          <div className="wq-avoid-foot">
            {onAvoid
              ? <AddOwn key="avoid" placeholder="Add something to leave out" onAdd={(v) => addCustom('avoidIngredients', `No ${v.replace(/^no\s+/i, '')}`, ['No preference'])} />
              : <AddOwn key="want" placeholder="Add a must-have" onAdd={(v) => addCustom('avoidIngredients', v, ['No preference'])} />}
            <Chips items={['No preference']} selected={sel.includes('No preference') ? ['No preference'] : []} onToggle={toggle} />
          </div>
        </div>;
      }
      case 'fsa': return <div className="wq-fsa">{FSA_HSA.map((o) => <button type="button" key={o} className={intake.fsaHsaAnswer === o ? 'is-on' : ''} aria-pressed={intake.fsaHsaAnswer === o} onClick={() => set('fsaHsaAnswer', o)}>{o}</button>)}</div>;
      case 'trust': return <TrustRank order={intake.trustRanking} onChange={(o) => set('trustRanking', o)} onTouch={() => set('trustRankingTouched', true)} />;
      case 'textarea': return <>
        <textarea className="wq-input wq-textarea" value={intake.anythingElse} onChange={(e) => set('anythingElse', e.target.value)} placeholder="A goal, a worry, something that didn’t work…" rows={5} />
        <div className="wq-chips is-small">{FREE_TEXT_PROMPTS.map((p) => <button type="button" key={p} className="wq-chip is-dashed" onClick={() => set('anythingElse', `${intake.anythingElse ? `${intake.anythingElse.trim()} ` : ''}${p}: `)}>{p}</button>)}</div>
      </>;
      default: return null;
    }
  };

  if (minorGate) return <div className="wq-page"><MinorGate onChangeAge={() => setMinorGate(false)} onBrowseLibrary={onBrowseLibrary} /></div>;

  const minorBlocked = step.id === 'age' && isMinorAge(intake.age);
  const ready = step.id === 'zip' ? String(intake.zipcode || '').length > 0 : requiredReady(answerId, intake) && isStepAnswered(answerId, intake) && !minorBlocked;
  const tone = atCheckpoint ? 'mint' : (SECTION_TONES[step.section] || 'peri');

  // A returning person editing her profile sees her answers, each with Edit,
  // not the first-timer's "matches are ready" celebration.
  if (atCheckpoint && initialSnapshot) {
    const all = [...coreSteps, ...moreSteps];
    return <div className="wq-page tone-mint" data-step="summary">
      <div className="wq-stage wq-stage--summary">
      <div className="wq-card wq-summary">
        <h1 className="wq-title">Your health profile</h1>
        <p className="wq-subtitle">Change any answer. Nothing is saved until you select Save.</p>
        <ul className="wq-summary__list">
          {all.map((st) => {
            const done = isStepAnswered(st.type === 'aboutYou' ? 'aboutYou' : st.id, intake);
            return <li key={st.id}>
              <span className={`wq-summary__state${done ? ' is-done' : ''}`} aria-hidden="true">{done ? '✓' : '·'}</span>
              <span className="wq-summary__q">{st.title}<small>{done ? 'Answered' : 'Not answered yet'}</small></span>
              <button type="button" className="wq-summary__edit" onClick={() => { setFromSummary(true); go(st.id); }}>{done ? 'Edit' : 'Answer'}</button>
            </li>;
          })}
        </ul>
        {saveError && <p className="wq-alert">{saveError}</p>}
        <div className="wq-checkpoint-actions">
          <button type="button" className="wq-btn" onClick={() => finish()} disabled={saving}>{saving ? 'Saving…' : 'Save and see my matches'} <span aria-hidden="true">→</span></button>
        </div>
      </div>
      </div>
    </div>;
  }

  if (atCheckpoint) {
    return <div className="wq-page tone-mint" data-step="checkpoint">
      <div className="wq-confetti" aria-hidden="true">{Array.from({ length: 18 }, (_, i) => <i key={i} />)}</div>
      <div className="wq-stage">
      <QuizSide n={coreSteps.length} total={coreSteps.length} section="All done" photos={['robe-kiss', 'tub-girls', 'stalls-trio']} />
      <div className="wq-card wq-checkpoint">
        <header className="wq-head">
          <button type="button" className="wq-round" aria-label="Previous question" onClick={back}>←</button>
          <div className="wq-progress" aria-hidden="true">{coreSteps.map((s) => <span key={s.id} className="is-done" />)}</div>
          <span className="wq-count">{coreSteps.filter((st) => !FOLLOWUP_STEP_IDS.has(st.id)).length}<i>/{coreSteps.filter((st) => !FOLLOWUP_STEP_IDS.has(st.id)).length}</i></span>
        </header>
        <span className="wq-section">Done</span>
        <h1 className="wq-title">Your first matches are ready</h1>
        <p className="wq-subtitle">{intake.safetyConcern === 'Yes' ? 'You said something may be urgent, so care options come first.' : 'That’s enough for your first picks. Add more now for closer ones, or any time later from your profile.'}</p>
        {saveError && <p className="wq-alert">{saveError}</p>}
        <div className="wq-checkpoint-actions">
          <button type="button" className="wq-btn" onClick={() => finish()} disabled={saving}>{saving ? 'Saving…' : 'See my results'} <span aria-hidden="true">→</span></button>
          <button type="button" className="wq-btn is-ghost" onClick={() => go(moreSteps[0].id)} disabled={saving || !moreSteps.length}>Make my matches more personal</button>
        </div>
        <p className="wq-note">{moreSteps.length} more quick questions, all optional. Skip any of them.</p>
      </div>
      </div>
    </div>;
  }

  return <div className={`wq-page tone-${tone}`} data-step={step.id} data-phase={phase}>
    <div className="wq-stage">
    <div className="wq-card" key={step.id}>
      <header className="wq-head">
        {index === 0 && phase === 'core' ? <span className="wq-round is-spacer" aria-hidden="true" /> : <button type="button" className="wq-round" aria-label="Previous question" onClick={back}>←</button>}
        <div className="wq-progress" aria-hidden="true">{Array.from({ length: shownTotal }, (_, i) => <span key={i} className={i + 1 < shownIndex ? 'is-done' : i + 1 === shownIndex ? 'is-now' : ''} />)}</div>
        <span className="wq-count" aria-label={`${phase === 'more' ? 'Optional question' : 'Question'} ${shownIndex} of ${shownTotal}`}>{shownIndex}<i>/{shownTotal}</i></span>
      </header>

      <div className="wq-label-row">
        <span className="wq-section">{phase === 'more' ? 'Optional' : SECTION_NAMES[step.section]}</span>
        <span className="wq-label-tools">
          {phase === 'more' && <button type="button" className="wq-skip wq-to-results" onClick={() => finish()} disabled={saving}>See my results</button>}
          {step.info && <button type="button" className="wq-info" aria-label={`About this question: ${step.title}`} aria-expanded={infoOpen} onClick={() => setInfoOpen((v) => !v)}>i</button>}
        </span>
      </div>
      <h1 className="wq-title">{step.title}</h1>
      {step.subtitle && <p className="wq-subtitle">{step.subtitle}</p>}
      {infoOpen && step.info && <p className="wq-info-pop" role="note">{step.info}</p>}

      <div className="wq-answer" onPointerDown={startHold} onPointerUp={endHold} onPointerLeave={endHold} onPointerCancel={endHold}
        onPointerMove={(e) => { if (Math.abs(e.movementX) + Math.abs(e.movementY) > 6) endHold(); }} onClickCapture={swallow}
        onContextMenu={(e) => { if (hold.current.fired) e.preventDefault(); }}>
        {body()}
      </div>

      {saveError && <p className="wq-alert">{saveError}</p>}
      <footer className="wq-foot">
        {step.optional ? <button type="button" className="wq-skip" onClick={skip} disabled={saving}>Skip</button> : <span className="wq-required">{step.section === 'safety' ? 'Needed for safety' : 'Needed for your matches'}</span>}
        {ready && !saving && <span className="wq-noted" aria-hidden="true">noted</span>}
        <button type="button" className="wq-btn" onClick={next} disabled={!ready || saving}>{saving ? 'Saving…' : (isLast && phase === 'more') ? 'See my results' : 'Next'} <span aria-hidden="true">→</span></button>
      </footer>
    </div>
    </div>

    {glossary && <div className="wq-glossary" role="dialog" aria-label={glossary.term} onClick={() => setGlossary(null)}>
      <div onClick={(e) => e.stopPropagation()}><strong>{glossary.term}</strong><p>{glossary.definition}</p><button type="button" className="wq-btn" onClick={() => setGlossary(null)}>Got it</button></div>
    </div>}
  </div>;
}
