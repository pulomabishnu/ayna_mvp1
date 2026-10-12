import { useEffect, useMemo, useRef, useState } from 'react';
import { mapIntakeToLegacyQuizProfile } from '../utils/healthIntake.js';
import { saveHealthIntakeForCurrentUser } from '../utils/healthIntakeStore.js';
import { selectLifeStage } from '../utils/intakeSelections.js';
import { defineOption } from '../mobile/data/glossary.js';
import {
  ALLERGIES, AVOID_GROUPS, AVOID_INGREDIENTS, AVOID_PAIRS, BRAND_OPENNESS, BRAND_SUGGESTIONS, CATALOG_PRODUCT_NAMES,
  CONDITIONS, EMPTY, FREE_TEXT_PROMPTS, FSA_HSA, INTAKE_DRAFT_KEY, LARGE_PURCHASE_FREQUENCY, LIFE_STAGES,
  LIFE_STAGE_LABELS, LIFE_STAGE_VALUE_BY_LABEL, MEDICATION_SUGGESTIONS, MIDLIFE_LIFE_STAGES, PERIMENOPAUSE_LAST_PERIOD,
  PERIOD_FLOW, PERIOD_PAIN, POSTPARTUM_TIMING, PREGNANCY_TRIMESTER, PRICE_RANGES, PRODUCT_FORMATS,
  PRODUCT_OR_BRAND_SUGGESTIONS, STOP_REASONS, SUPPORT_GROUPS, UTI_FREQUENCY, buildSnapshot, getIntakeSteps,
  getLifeStages, isMinorAge, normalizeSuggestion, rankedSuggestions, readIntakeDraft, reconstructIntakeFromSnapshot,
  requiredReady,
} from '../mobile/data/intakeModel.js';
import './WebIntake.css';

// The website's quiz. Same questions, order, branching and saved answers as
// the app (all of that lives in mobile/data/intakeModel.js); only the layout
// and controls are built for a browser.

const SECTION_NAMES = { core: 'The basics', support: 'Your needs', safety: 'Safety', history: 'What you tried', preferences: 'Your preferences', trust: 'Last bits' };
const SECTION_TONES = { core: 'peri', support: 'pink', safety: 'butter', history: 'mint', preferences: 'peri', trust: 'pink' };

/* ------------------------------ Controls ------------------------------ */

function Chips({ items, selected = [], onToggle, labels = {}, small = false }) {
  return <div className={`wq-chips${small ? ' is-small' : ''}`}>
    {items.map((item) => <button type="button" key={item} className={`wq-chip${selected.includes(item) ? ' is-on' : ''}`} aria-pressed={selected.includes(item)} onClick={() => onToggle(item)}>{labels[item] || item}</button>)}
  </div>;
}

function Rows({ options, value, onChange }) {
  return <div className="wq-rows" role="radiogroup">
    {options.map((option) => <button type="button" role="radio" key={option} aria-checked={value === option} className={`wq-row${value === option ? ' is-on' : ''}`} onClick={() => onChange(option)}>
      <span className="wq-radio" aria-hidden="true" />{option}
    </button>)}
  </div>;
}

function Tiles({ items, selected = [], onToggle, labels = {} }) {
  return <div className="wq-tiles">
    {items.map((item, i) => <button type="button" key={item} className={`wq-tile tone-${i % 4}${selected.includes(item) ? ' is-on' : ''}`} aria-pressed={selected.includes(item)} onClick={() => onToggle(item)}>
      <span className="wq-check" aria-hidden="true">✓</span>{labels[item] || item}
    </button>)}
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
    {extras.length > 0 && <Chips items={extras} selected={value ? [value] : []} onToggle={onChange} small />}
  </div>;
}

function Search({ value, onChange, placeholder }) {
  return <label className="wq-search">
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
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
      <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && draft.trim()) { e.preventDefault(); add(draft); } }} placeholder={placeholder} aria-label={placeholder} />
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
  const n = value === '' ? null : Number(value);
  const set = (v) => onChange(v === '' ? '' : String(Math.max(13, Math.min(99, Math.round(Number(v) || 0)))));
  return <div className={`wq-age${underage ? ' is-under' : ''}`}>
    <div className="wq-age-row">
      <button type="button" aria-label="Younger" onClick={() => set(n == null ? 25 : n - 1)}>−</button>
      <input inputMode="numeric" value={value} placeholder="?" aria-label="Your age" onChange={(e) => { const d = e.target.value.replace(/\D/g, '').slice(0, 2); onChange(d); }} />
      <button type="button" aria-label="Older" onClick={() => set(n == null ? 25 : n + 1)}>+</button>
    </div>
    <input type="range" min="18" max="90" value={n && n >= 18 ? n : 18} onChange={(e) => onChange(e.target.value)} aria-label="Age slider" />
    {underage && <p className="wq-alert">ayna is for people 18 and over. <button type="button" onClick={onOpenGate}>What you can do instead</button></p>}
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
          <div><b>Using it now?</b><Chips small items={['Yes', 'No']} selected={one(p.current)} onToggle={(v) => update(i, { current: v })} /></div>
          <div><b>Did it help?</b><Chips small items={['Helped a lot', 'Helped somewhat', 'No difference', 'Made it worse', 'Not sure']} selected={one(p.worked)} onToggle={(v) => update(i, { worked: v })} /></div>
          <div><b>Any reaction?</b><Chips small items={['No', 'Mild', 'Serious', 'Not sure']} selected={one(p.reaction)} onToggle={(v) => update(i, { reaction: v })} /></div>
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

export default function WebIntake({ onComplete, onBrowseLibrary, initialSnapshot = null }) {
  const [savedDraft] = useState(() => (initialSnapshot ? null : readIntakeDraft()));
  const [intake, setIntake] = useState(() => (savedDraft ? { ...EMPTY, ...savedDraft.intake } : reconstructIntakeFromSnapshot(initialSnapshot)));
  const [stepId, setStepId] = useState(() => savedDraft?.stepId || 'age');
  const [search, setSearch] = useState('');
  const [infoOpen, setInfoOpen] = useState(false);
  const [glossary, setGlossary] = useState(null);
  const [minorGate, setMinorGate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [avoidTab, setAvoidTab] = useState('avoid');
  const [supportTab, setSupportTab] = useState(null);

  // Same draft the app keeps, so an unfinished quiz resumes on either.
  useEffect(() => {
    if (initialSnapshot) return;
    const hasProgress = stepId !== 'age' || JSON.stringify(intake) !== JSON.stringify(EMPTY);
    try {
      if (hasProgress) localStorage.setItem(INTAKE_DRAFT_KEY, JSON.stringify({ version: 1, intake, stepId }));
      else localStorage.removeItem(INTAKE_DRAFT_KEY);
    } catch { /* storage unavailable */ }
  }, [intake, stepId, initialSnapshot]);

  const steps = useMemo(() => getIntakeSteps(intake), [intake]);
  const index = Math.max(0, steps.findIndex((s) => s.id === stepId));
  const step = steps[index] || steps[0];
  const isLast = index === steps.length - 1;

  const set = (key, value) => setIntake((prev) => ({ ...prev, [key]: value }));
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

  const go = (id) => { setSearch(''); setInfoOpen(false); setStepId(id); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const back = () => { if (index > 0) go(steps[index - 1].id); };
  const finish = async () => {
    const snapshot = buildSnapshot(intake);
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
    if (!requiredReady(step.id, intake)) return;
    if (isLast) { finish(); return; }
    go(steps[index + 1].id);
  };

  // Hold any option for its plain-language meaning (same definitions as the app).
  const hold = useRef({ timer: null, fired: false });
  const startHold = (event) => {
    const el = event.target.closest('button');
    const raw = el ? el.textContent.replace(/\s+/g, ' ').replace(/^✓/, '').trim() : '';
    const value = LIFE_STAGE_VALUE_BY_LABEL[raw] || raw;
    const hit = el && (defineOption(value, step.type) || (step.type === 'price' && defineOption(value, 'largePurchase')));
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
      case 'age': return <AgeField value={intake.age} onChange={(v) => set('age', v)} underage={isMinorAge(intake.age)} onOpenGate={() => setMinorGate(true)} />;
      case 'lifeStage': return <>
        <Tiles items={lifeStageOptions} selected={lifeStages} labels={LIFE_STAGE_LABELS} onToggle={(v) => setIntake((prev) => { const n = selectLifeStage(getLifeStages(prev), v); return { ...prev, lifeStageSelections: n, lifeStage: n[0] || '' }; })} />
        {lifeStages.includes('I am postpartum') && <div className="wq-follow"><b>Breastfeeding right now?</b><Chips small items={['Yes', 'No', 'Prefer not to say']} selected={intake.breastfeedingStatus ? [intake.breastfeedingStatus] : []} onToggle={(v) => set('breastfeedingStatus', v)} /></div>}
        {lifeStages.includes('I am in perimenopause') && <div className="wq-follow"><b>When was your last period?</b><Chips small items={PERIMENOPAUSE_LAST_PERIOD} selected={intake.perimenopauseLastPeriod ? [intake.perimenopauseLastPeriod] : []} onToggle={(v) => set('perimenopauseLastPeriod', v)} /></div>}
      </>;
      case 'zip': return <input className="wq-input wq-zip" inputMode="numeric" value={intake.zipcode} onChange={(e) => set('zipcode', e.target.value.replace(/\D/g, '').slice(0, 5))} placeholder="e.g. 10027" aria-label="ZIP code" />;
      case 'support': {
        const q = search.trim().toLowerCase();
        const known = new Set(SUPPORT_GROUPS.flatMap((g) => g.items));
        const custom = intake.supportSelections.filter((i) => !known.has(i));
        return <>
          <Search value={search} onChange={setSearch} placeholder="Search, e.g. cramps, sleep, acne" />
          <AddCustom query={search} options={[...known, ...intake.supportSelections]} onAdd={(v) => addCustom('supportSelections', v, ['Nothing right now'])} />
          {q ? (
            <div className="wq-groups">
              {SUPPORT_GROUPS.map((g) => {
                const items = g.items.filter((i) => i.toLowerCase().includes(q));
                if (!items.length) return null;
                return <section key={g.label} className="wq-group"><h3>{g.label}</h3><Chips items={items} selected={intake.supportSelections} onToggle={(v) => toggleExclusive('supportSelections', v, ['Nothing right now'])} /></section>;
              })}
            </div>
          ) : (() => {
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
      case 'postpartumTiming': return <Rows options={POSTPARTUM_TIMING} value={intake.postpartumTiming} onChange={(v) => set('postpartumTiming', v)} />;
      case 'pregnancyTrimester': return <Rows options={PREGNANCY_TRIMESTER} value={intake.pregnancyTrimester} onChange={(v) => set('pregnancyTrimester', v)} />;
      case 'conditions': {
        const items = ['None that I know of', 'Prefer not to say', ...CONDITIONS.filter((i) => !['None that I know of', 'Prefer not to say'].includes(i))];
        const q = search.trim().toLowerCase();
        const custom = intake.diagnosisSelections.filter((i) => !items.includes(i));
        return <>
          <Search value={search} onChange={setSearch} placeholder="Search conditions" />
          <AddCustom query={search} options={[...items, ...intake.diagnosisSelections]} onAdd={(v) => addCustom('diagnosisSelections', v, ['None that I know of', 'Prefer not to say'])} />
          <Chips items={[...(q ? items.filter((i) => i.toLowerCase().includes(q)) : items), ...custom]} selected={intake.diagnosisSelections} onToggle={(v) => toggleExclusive('diagnosisSelections', v, ['None that I know of', 'Prefer not to say'])} />
        </>;
      }
      case 'allergies': return <>
        <Rows options={['Yes', 'No', "I'm not sure", 'Prefer not to say']} value={intake.allergyStatus} onChange={(v) => setIntake((prev) => ({ ...prev, allergyStatus: v, allergyItems: v === 'Yes' ? prev.allergyItems : [] }))} />
        {intake.allergyStatus === 'Yes' && <Tokens values={intake.allergyItems} onChange={(v) => set('allergyItems', v)} placeholder="Type an allergy or sensitivity" suggestions={ALLERGIES} />}
      </>;
      case 'medications': return <>
        <Rows options={['Yes', 'No', 'Prefer not to say']} value={intake.takesCurrent} onChange={(v) => set('takesCurrent', v)} />
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
        <Rows options={['Yes', 'No', 'Not sure']} value={intake.safetyConcern} onChange={(v) => set('safetyConcern', v)} />
        {['Yes', 'Not sure'].includes(intake.safetyConcern) && <div className="wq-alert-card" role="note"><b>Worth a closer look</b><p>Some new or worsening symptoms need a clinician. ayna helps you discover products and doesn’t diagnose. If it feels urgent or severe, get care promptly.</p></div>}
      </>;
      case 'formats': return <Tiles items={PRODUCT_FORMATS} selected={intake.preferredFormats} onToggle={(v) => toggleExclusive('preferredFormats', v, ['No preference'])} />;
      case 'recommendationCount': return <div className="wq-count">{[1, 2, 3, 5].map((c) => <button type="button" key={c} className={Number(intake.recommendedProductsPerArea) === c ? 'is-on' : ''} aria-pressed={Number(intake.recommendedProductsPerArea) === c} onClick={() => set('recommendedProductsPerArea', c)}><strong>{c}</strong><span>{c === 1 ? 'pick' : 'picks'}</span></button>)}</div>;
      case 'price': {
        const sel = Array.isArray(intake.priceRange) ? intake.priceRange : (intake.priceRange ? [intake.priceRange] : []);
        const notAFactor = 'Price is not a major factor for me';
        return <>
          <Chips items={PRICE_RANGES} selected={sel} onToggle={(v) => toggleExclusive('priceRange', v, [notAFactor])} />
          <div className="wq-follow"><b>How often do you spend $75+?</b><Chips small items={LARGE_PURCHASE_FREQUENCY} selected={intake.largePurchaseFrequency ? [intake.largePurchaseFrequency] : []} onToggle={(v) => set('largePurchaseFrequency', v)} /></div>
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
            {onAvoid
              ? <><Chips items={[...AVOID_GROUPS.avoid, ...customAvoid]} selected={avoidSel} onToggle={toggle} /><AddOwn placeholder="Add something to leave out" onAdd={(v) => addCustom('avoidIngredients', `No ${v.replace(/^no\s+/i, '')}`, ['No preference'])} /></>
              : <><Chips items={[...AVOID_GROUPS.want, ...customWant]} selected={wantSel} onToggle={toggle} /><AddOwn placeholder="Add a must-have" onAdd={(v) => addCustom('avoidIngredients', v, ['No preference'])} /></>}
          </div>
          <div className="wq-avoid-none"><Chips small items={['No preference']} selected={sel.includes('No preference') ? ['No preference'] : []} onToggle={toggle} /></div>
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
  const ready = requiredReady(step.id, intake) && !minorBlocked;
  const tone = SECTION_TONES[step.section] || 'peri';

  return <div className={`wq-page tone-${tone}`} data-step={step.id}>
    <div className="wq-card">
      <header className="wq-head">
        <button type="button" className="wq-round" aria-label="Previous question" onClick={back} disabled={index === 0}>←</button>
        <div className="wq-progress" aria-hidden="true">{steps.map((s, i) => <span key={s.id} className={i < index ? 'is-done' : i === index ? 'is-now' : ''} />)}</div>
        <span className="wq-count" aria-label={`Question ${index + 1} of ${steps.length}`}>{index + 1}<i>/{steps.length}</i></span>
      </header>

      <div className="wq-label-row">
        <span className="wq-section">{SECTION_NAMES[step.section]}</span>
        {step.info && <button type="button" className="wq-info" aria-label={`About this question: ${step.title}`} aria-expanded={infoOpen} onClick={() => setInfoOpen((v) => !v)}>i</button>}
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
        {step.optional ? <button type="button" className="wq-skip" onClick={() => (isLast ? finish() : go(steps[index + 1].id))}>Skip</button> : <span />}
        <button type="button" className="wq-btn" onClick={next} disabled={!ready || saving}>{saving ? 'Saving…' : isLast ? 'See my results' : 'Next'} <span aria-hidden="true">→</span></button>
      </footer>
    </div>

    {glossary && <div className="wq-glossary" role="dialog" aria-label={glossary.term} onClick={() => setGlossary(null)}>
      <div onClick={(e) => e.stopPropagation()}><strong>{glossary.term}</strong><p>{glossary.definition}</p><button type="button" className="wq-btn" onClick={() => setGlossary(null)}>Got it</button></div>
    </div>}
  </div>;
}
