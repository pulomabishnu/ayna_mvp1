import { useEffect, useMemo, useRef, useState } from 'react';
import { defineOption } from '../data/glossary.js';
import { mapIntakeToLegacyQuizProfile } from '../../utils/healthIntake.js';
import { ChipList, StickerGrid, SearchField, ChoiceRows, AgeDial, ZipTicket, LevelMeter, TrackLine, PriceStacks, DotScale, BrandSpectrum, AccountCards, TrustPodium, StickyNote, TopicPicker } from '../components/intake/IntakeControls.jsx';
import IntakeSceneArt from '../components/intake/IntakeSceneArt.jsx';
import { haptic } from '../../utils/haptics.js';
import { INTAKE_SCENES, SECTION_TONES, SECTION_LABELS } from '../components/intake/intakeScenes.js';
import '../intake-play.css';
import '../../styles/onboarding.css';
import RecommendationCountPicker from '../components/RecommendationCountPicker.jsx';
import QuizIntro from './intake/QuizIntro.jsx';
import SmartSearchInput from '../../components/search/SmartSearchInput.jsx';
import { rankSearchOptions as rankedSuggestions, matchesSearchOption } from '../../utils/search/index.js';
import {
  ALLERGIES,
  ALLERGY_STATUS,
  AVOID_GROUPS,
  AVOID_LABELS,
  AVOID_VALUE_BY_LABEL,
  CHECKPOINT_STEP,
  LIFE_STAGE_EXCLUSIVE,
  MEDICATION_STATUS,
  SAFETY_ANSWER_LABELS,
  CONDITION_EXCLUSIVE,
  URGENT_STATUS,
  firstUnansweredStepId,
  firstOptionalResumeStepId,
  optionalProgress,
  setPerimenopausePeriods,
  syncPerimenopausePeriods,
  isStepAnswered,
  markSkipped,
  splitIntakeSteps,
  toggleLifeStageSelection,
  AVOID_INGREDIENTS,
  AVOID_PAIRS,
  BRAND_OPENNESS,
  BREASTFEEDING_STATUS,
  CONDITIONS,
  EMPTY,
  FOLLOWUP_QUESTIONS,
  FREE_TEXT_PROMPTS,
  FSA_HSA,
  INTAKE_DRAFT_KEY,
  isValidUsZip,
  LARGE_PURCHASE_FREQUENCY,
  LIFE_STAGES,
  LIFE_STAGE_GLYPHS,
  LIFE_STAGE_LABELS,
  LIFE_STAGE_VALUE_BY_LABEL,
  MEDICATION_SUGGESTIONS,
  MIDLIFE_LIFE_STAGES,
  PERIMENOPAUSE_LAST_PERIOD,
  PERIOD_FLOW,
  PERIOD_PAIN,
  POSTPARTUM_TIMING,
  PREGNANCY_TRIMESTER,
  PRICE_RANGES,
  PRODUCT_FORMATS,
  STOP_REASONS,
  SUPPORT_GROUPS,
  UTI_FREQUENCY,
  WARNING_BG,
  WARNING_BORDER,
  WARNING_BORDER_SOFT,
  asksBreastfeedingOnTiming,
  buildSnapshot,
  getLifeStages,
  isMinorAge,
  normalizeSuggestion,
  readIntakeDraft,
  reconstructIntakeFromSnapshot,
  requiredReady,
  resumeStepId,
  ttcDurationOptions,
  withSavedOption,
} from '../data/intakeModel.js';
import { BRAND_SUGGESTIONS, CATALOG_PRODUCT_NAMES, PRODUCT_OR_BRAND_SUGGESTIONS } from '../data/intakeCatalog.js';
import { GOALS, HELP_TOPICS, NOTHING_SPECIFIC, ONBOARDING_SCREENS, SOMETHING_ELSE, getOnboardingSteps, onboardingProgress, supportGroupsForTopics } from '../data/onboardingFlow.js';

// The app's quiz. Questions, order, required/optional rules, branching and
// saved answers all live in mobile/data/intakeModel.js (shared with the
// website's WebIntake.jsx). Two parts: the required minimum, a checkpoint
// (see results, or "Make my matches more personal"), then optional steps.
//
// MobileApp owns account persistence when onComplete receives this snapshot.
// The wizard itself keeps draft edits separate until completion.

// One real icon per product format, keyed to the exact option strings above
// (design pattern B1/E1 tiles), line-art only, drawn with `currentColor` so
// each tile's badge can recolor with the tile's own selected/unselected ink.
const FORMAT_ICONS = {
  'Pills or capsules': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="10.5" width="18" height="7" rx="3.5" transform="rotate(-35 12 14)" stroke="currentColor" strokeWidth="1.75" /><path d="M9.5 8.2l5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" /></svg>
  ),
  Gummies: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 4c3 0 5 2.2 5 5 0 1-.3 1.7-.8 2.4.9.5 1.6 1.5 1.6 3 0 2.5-2.1 4.6-4.7 4.6-1 0-1.9-.3-2.6-.8-.7.5-1.6.8-2.6.8-2.6 0-4.7-2-4.7-4.6 0-1.5.7-2.5 1.6-3-.5-.7-.8-1.4-.8-2.4 0-2.8 2-5 5-5" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" /></svg>
  ),
  Powders: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M8 3h8l1 4H7l1-4Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" /><path d="M6 8h12l1.2 10.4a2 2 0 0 1-2 2.6H6.8a2 2 0 0 1-2-2.6L6 8Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" /><path d="M9 12h6M8.5 15.5h7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" /></svg>
  ),
  'Drinks or teas': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 8h11l-1 9.5A2 2 0 0 1 13 19.3H8a2 2 0 0 1-2-1.8L5 8Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" /><path d="M16 9.5h1.5a2.5 2.5 0 0 1 0 5H16" stroke="currentColor" strokeWidth="1.75" /><path d="M8 5.2c.4-.7 0-1-.3-1.5M12 5.2c.4-.7 0-1-.3-1.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" /></svg>
  ),
  'Creams, lotions, or gels': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M8 10c0-3 1.8-6 4-6.8C14.2 4 16 7 16 10v8a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-8Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" /><path d="M8 10h8" stroke="currentColor" strokeWidth="1.75" /></svg>
  ),
  Patches: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="5" stroke="currentColor" strokeWidth="1.75" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" /><path d="M7 7l1.6 1.6M17 7l-1.6 1.6M7 17l1.6-1.6M17 17l-1.6-1.6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" /></svg>
  ),
  Suppositories: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3c2 2 3 5 3 8.5 0 4-1.3 7-3 9.5-1.7-2.5-3-5.5-3-9.5C9 8 10 5 12 3Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" /></svg>
  ),
  'Devices or wearables': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="7" y="2.5" width="10" height="19" rx="2.5" stroke="currentColor" strokeWidth="1.75" /><path d="M10.5 18.5h3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" /></svg>
  ),
  'Period-care products': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3.5c3 4 6 8 6 11.5a6 6 0 1 1-12 0c0-3.5 3-7.5 6-11.5Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" /></svg>
  ),
  'No preference': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.75" /><path d="M6.5 17.5l11-11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" /></svg>
  ),
};
/** Small "type your own" field: shows as a + chip, opens to an input. */
// Avoid or must-have: one list at a time (Leave out / Should be) so the
// screen isn't a wall of chips. Same values and toggle logic as before.
function AvoidMustHave({ avoidItems, avoidSelected, wantItems, wantSelected, onToggle, onAddAvoid, onAddWant, noPref, onNoPref }) {
  const [tab, setTab] = useState('avoid');
  const isAvoid = tab === 'avoid';
  const label = (value) => AVOID_LABELS[value] || value;
  return (
    <div className="ip-avoid">
      <div className="ip-avoid-tabs" role="tablist" aria-label="Leave out or should be">
        <button type="button" role="tab" aria-selected={isAvoid} className={`is-avoid${isAvoid ? ' is-on' : ''}`} onClick={() => setTab('avoid')}>Leave out{avoidSelected.length > 0 && <span>{avoidSelected.length}</span>}</button>
        <button type="button" role="tab" aria-selected={!isAvoid} className={`is-want${!isAvoid ? ' is-on' : ''}`} onClick={() => setTab('want')}>Should be{wantSelected.length > 0 && <span>{wantSelected.length}</span>}</button>
      </div>
      <div className="ip-avoid-panel" role="tabpanel" key={tab}>
        <ChipList items={(isAvoid ? avoidItems : wantItems).map(label)} selected={(isAvoid ? avoidSelected : wantSelected).map(label)} onToggle={(text) => onToggle(AVOID_VALUE_BY_LABEL[text] || text)} />
      </div>
      <div className="ip-avoid-foot">
        <AddOwn key={tab} placeholder={isAvoid ? 'Add something to leave out' : 'Add a must-have'} onAdd={isAvoid ? onAddAvoid : onAddWant} />
        <ChipList items={['No preference']} selected={noPref ? ['No preference'] : []} onToggle={onNoPref} muted={['No preference']} />
      </div>
    </div>
  );
}

function AddOwn({ placeholder, onAdd }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const submit = () => { if (text.trim().length >= 2) onAdd(text.trim()); setText(''); setOpen(false); };
  if (!open) return <button type="button" className="ip-addown" onClick={() => setOpen(true)}>+ Add your own</button>;
  return <form className="ip-addown-form" onSubmit={(e) => { e.preventDefault(); submit(); }}>
    <input autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} maxLength={60} onBlur={() => { if (!text.trim()) setOpen(false); }} />
    <button type="submit" disabled={text.trim().length < 2}>Add</button>
  </form>;
}



/* ---------------------------- Shared style tokens ---------------------------- */
// Values from the intake design reference (Ayna_Intake_Flow.html), which
// turned out to already be the app's own --ayna-* palette (surface, border,
// accent-dark, peach, chip-bg, brown, navy, text-faint), reused as CSS vars
// here rather than re-hardcoded, so this screen gets the app's real dark
// mode for free instead of staying permanently light like the mockup frame.
// Choice colors use the app tokens so selection remains legible in both themes.
const NAVY = 'var(--ayna-heading)';
const CARD_BG = 'var(--ayna-surface)';
const ROW_BORDER = 'var(--ayna-border)';
const PANEL_BG = 'var(--ayna-chip-bg)';
const MUTED = 'var(--ayna-text-faint)';
const LABEL_GOLD = 'var(--ayna-brown)';
const SELECTED_TEXT = 'var(--ayna-color-ink)';
const INK = 'var(--ayna-text)';
const BODY_TEXT = 'var(--ayna-text-muted)';


/* ------------------------------ Shared widgets ------------------------------ */

// 2-column tile grid (design pattern B1/E1). Callers with real per-option
// icon art (currently just product formats, see FORMAT_ICONS above) pass an
// `icons` map to render a small rounded-square badge above the label;
// callers without one (life stages, which have no matching icon set) get the
// plain label-only tile exactly as before.
function ChoiceGrid({ items, selected = [], onToggle, icons, labels, glyphs }) {
  return <StickerGrid items={items} selected={selected} onToggle={onToggle} icons={icons} labels={labels} glyphs={glyphs} />;
}

// Chip spec (design pattern C1/G1), flex-wrapped pills, not vertical rows.
// Used both flat (conditions) and grouped under a label (SearchableGroups).
function RowChoiceList({ items, selected = [], onToggle, labels }) {
  return <ChipList items={items} selected={selected} onToggle={onToggle} labels={labels} />;
}

// Shared search-bar chrome (design rule: "search on every list over ~12
// options"), same pill-shaped input used by SearchableGroups, TokenInput
// and ProductHistoryBuilder, factored out so conditions/avoidIngredients
// (previously ungrouped flat lists with no filtering at all) can use it too.
function SearchBar({ value, onChange, placeholder }) {
  return <SearchField value={value} onChange={onChange} placeholder={placeholder} />;
}

function AddCustomChoice({ query, options, onAdd }) {
  const value = query.trim().replace(/\s+/g, ' ');
  if (value.length < 2 || options.some((item) => item.toLowerCase() === value.toLowerCase())) return null;
  return <button type="button" className="ip-chip is-dashed ip-add" onClick={() => onAdd(value)}>+ Add “{value}”</button>;
}

function SearchableChoices({ items, selected, onToggle, search, onSearch, onAdd, placeholder, layout = 'chips', icons, labels, glyphs, searchable = true }) {
  const query = search.trim().toLowerCase();
  const filtered = query ? items.filter((item) => matchesSearchOption(query, item) || matchesSearchOption(query, labels?.[item])) : items;
  const custom = selected.filter((item) => !items.includes(item));
  return <div className="ip-picker">
    {searchable && <SearchBar value={search} onChange={onSearch} placeholder={placeholder} />}
    <AddCustomChoice query={search} options={[...items, ...selected]} onAdd={onAdd} />
    {filtered.length > 0 ? layout === 'grid' ? <ChoiceGrid items={filtered} selected={selected} onToggle={onToggle} icons={icons} labels={labels} glyphs={glyphs} /> : <RowChoiceList items={filtered} selected={selected} onToggle={onToggle} labels={labels} /> : <p className="ip-empty">No matches</p>}
    {custom.length > 0 && <div className="ip-custom"><small>Added by you</small><RowChoiceList items={custom} selected={selected} onToggle={onToggle} /></div>}
  </div>;
}

// Same chip spec as RowChoiceList, kept as a separate component since
// callers pass a single non-array `selected` list built differently (some
// single-select via toggleExclusive, some genuinely multi), and the
// `compact`/`left` nested-context variants (inside ProductHistoryBuilder)
// need a smaller size without becoming a third visual language.
function Pills({ options, selected, onToggle, compact, exclusiveValues = [] }) {
  return <ChipList items={options} selected={selected} onToggle={onToggle} compact={compact} muted={exclusiveValues} />;
}

// Vertical single-select radio list (design pattern F1), the workhorse
// pattern for every Yes/No/Not-sure-style question, replacing the old
// horizontal segmented-button bar.
function Segmented({ options, value, onChange, labels }) {
  return <ChoiceRows options={options} value={value} onChange={onChange} labels={labels} />;
}

// Pattern K1: price bands as a vertical row list rather than chips, a
// Playfair price label on the left, a descriptive subtitle right-aligned,
// and a trailing checkmark instead of a leading radio circle.


// Under-18 gate (Ayna_Minor_Gate.html design reference), a fixed warm
// warning tone rather than a --ayna-* var, same reasoning as SELECTED_TEXT
// above: the reference keeps this specific color regardless of theme, and
// there's no existing token for it.

// A native age picker keeps the first intake step easy to complete without
// opening the keyboard. Age is optional, but under-18 selections remain gated.

// Five real per-digit inputs (the standard OTP-input pattern), not one
// invisible input overlaid on decorative boxes, that overlay trick proved
// unreliable for actually opening the keyboard/accepting taps on real
// mobile browsers, where each digit box here is itself a genuine,
// correctly-sized, tappable, typeable <input>.


// Pattern D2: rising bars for the first up-to-5 ordered levels; any
// trailing non-ordinal options (e.g. "It varies", "Not sure") render as
// plain chips below instead of getting an arbitrary bar height, same
// options, just not force-fit onto a severity scale they don't belong on.

// Timeline questions (UTI recurrence, postpartum timing, trimester, large-
// purchase frequency) are single-select among ordered options, pattern F1
// (the same vertical radio list as Yes/No questions), not a distinct
// visual language of their own.

// Brand openness is a single-select among ordered options too, F1 again,
// swapping in only the option order it already had.

// Pattern H1: search-styled input, added items as swatch+title cards (not
// small chips), a dashed "Add" affordance implicit in the search bar
// itself, and an × to remove, same values/suggestions/onChange contract.
function SuggestList({ draft, matches, onPick }) {
  if (!draft.trim()) return null;
  return (
    <div className="ip-suggest" role="listbox">
      {matches.map((option) => <button type="button" key={option} onClick={() => onPick(option)}>{option}</button>)}
      {!matches.some((m) => m.toLowerCase() === draft.trim().toLowerCase()) && <button type="button" className="is-add" onClick={() => onPick(draft)}>+ Add “{draft.trim()}”</button>}
    </div>
  );
}

function TokenList({ values, onRemove }) {
  if (!values.length) return null;
  return (
    <div className="ip-tokens">
      {values.map((value, i) => (
        <span key={`${value}-${i}`} className="ip-token">
          <span>{value}</span>
          <button type="button" aria-label={`Remove ${value}`} onClick={() => onRemove(i)}>×</button>
        </span>
      ))}
    </div>
  );
}

function TokenInput({ values, onChange, placeholder, suggestions = [], suggestionLimit = 6 }) {
  const [draft, setDraft] = useState('');
  const matches = useMemo(
    () => rankedSuggestions(draft, suggestions.filter((option) => !values.some((v) => normalizeSuggestion(v) === normalizeSuggestion(option))), suggestionLimit),
    [draft, suggestions, values, suggestionLimit]
  );
  const addValue = (raw) => {
    const next = String(raw || '').trim();
    if (!next || values.some((v) => normalizeSuggestion(v) === normalizeSuggestion(next))) return;
    onChange([...values, next]);
    setDraft('');
  };
  return (
    <div className="ip-token-input">
      <label className="ip-search">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
        <SmartSearchInput vocabulary={suggestions} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && draft.trim()) addValue(matches[0] || draft); }} placeholder={placeholder} aria-label={placeholder} />
        {draft && <button type="button" aria-label="Clear" onClick={() => setDraft('')}>×</button>}
      </label>
      <SuggestList draft={draft} matches={matches} onPick={addValue} />
      <TokenList values={values} onRemove={(index) => onChange(values.filter((_, idx) => idx !== index))} />
    </div>
  );
}

// The "never recommend again" step gets its own H1 variant: a dashed
// "+ Add a product or brand" affordance (rather than an always-open search
// bar) plus a "FROM YOUR HISTORY" quick-add row sourced from the real
// products the person entered earlier in this same form (productHistory),
// not invented data.
function AddProductBuilder({ values, onChange, suggestions, historyNames, footerText }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const matches = useMemo(
    () => rankedSuggestions(draft, suggestions.filter((option) => !values.some((v) => normalizeSuggestion(v) === normalizeSuggestion(option))), 6),
    [draft, suggestions, values]
  );
  const quickAdd = historyNames.filter((name) => !values.some((v) => normalizeSuggestion(v) === normalizeSuggestion(name)));
  const addValue = (raw) => {
    const next = String(raw || '').trim();
    if (!next || values.some((v) => normalizeSuggestion(v) === normalizeSuggestion(next))) return;
    onChange([...values, next]);
    setDraft('');
    setAdding(false);
  };
  return (
    <div className="ip-builder">
      <TokenList values={values} onRemove={(index) => onChange(values.filter((_, idx) => idx !== index))} />
      {!adding ? (
        <button type="button" className="ip-add-row" onClick={() => setAdding(true)}><span aria-hidden="true">+</span>Add a product or brand</button>
      ) : (
        <div>
          <label className="ip-search is-active">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
            <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && draft.trim()) addValue(draft); }} placeholder="Product or brand" aria-label="Product or brand" />
            <button type="button" aria-label="Close search" onClick={() => { setAdding(false); setDraft(''); }}>×</button>
          </label>
          <SuggestList draft={draft} matches={matches} onPick={addValue} />
        </div>
      )}
      {quickAdd.length > 0 && (
        <div className="ip-custom">
          <small>From what you tried</small>
          <div className="ip-chips is-compact">{quickAdd.map((name) => <button type="button" key={name} className="ip-chip is-dashed" onClick={() => addValue(name)}>+ {name}</button>)}</div>
        </div>
      )}
      {footerText && <p className="ip-hint ip-hint--foot">{footerText}</p>}
    </div>
  );
}

// Pattern C1: search bar + grouped chips, each group header showing a live
// "n/m" selected count.

function ProductHistoryBuilder({ products, onChange }) {
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState('');
  const [stopSearch, setStopSearch] = useState('');
  const [expandedIndex, setExpandedIndex] = useState(null);
  const suggestions = useMemo(() => {
    const added = new Set(products.map((p) => normalizeSuggestion(p.name)));
    return rankedSuggestions(query, CATALOG_PRODUCT_NAMES.filter((name) => !added.has(normalizeSuggestion(name))), 6);
  }, [query, products]);

  const addProduct = (name) => {
    const trimmed = String(name || '').trim();
    if (!trimmed || products.some((p) => normalizeSuggestion(p.name) === normalizeSuggestion(trimmed))) return;
    onChange([...products, { name: trimmed, current: '', worked: '', reaction: '', reactionText: '', stopReasons: [], stopOther: '' }]);
    setQuery('');
    setAdding(false);
    setExpandedIndex(products.length);
  };
  const updateProduct = (index, patch) => onChange(products.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  const removeProduct = (index) => {
    onChange(products.filter((_, i) => i !== index));
    setExpandedIndex((cur) => (cur === index ? null : cur > index ? cur - 1 : cur));
  };
  const one = (value) => (value ? [value] : []);

  return (
    <div className="ip-builder">
      {products.length > 0 && (
        <div className="ip-history">
          {products.map((product, index) => {
            const expanded = expandedIndex === index;
            const summary = [product.current && (product.current === 'Yes' ? 'Using now' : 'Stopped'), product.worked, product.reaction && product.reaction !== 'No' ? `${product.reaction} reaction` : ''].filter(Boolean);
            return (
              <div key={`${product.name}-${index}`} className={`ip-history-card${expanded ? ' is-open' : ''}`}>
                <button type="button" className="ip-history-head" aria-expanded={expanded} onClick={() => { setExpandedIndex(expanded ? null : index); setStopSearch(''); }}>
                  <span><strong>{product.name}</strong><small>{summary.length ? summary.join(' · ') : 'Tap to add details (optional)'}</small></span>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
                </button>
                {expanded && (
                  <div className="ip-history-body">
                    <div className="ip-q"><strong>Using it now?</strong><ChipList compact items={['Yes', 'No']} selected={one(product.current)} onToggle={(v) => updateProduct(index, { current: v })} /></div>
                    <div className="ip-q"><strong>Did it help?</strong><ChipList compact items={['Helped a lot', 'Helped somewhat', 'No difference', 'Made it worse', 'Not sure']} selected={one(product.worked)} onToggle={(v) => updateProduct(index, { worked: v })} /></div>
                    <div className="ip-q"><strong>Any reaction?</strong><ChipList compact items={['No', 'Mild', 'Serious', 'Not sure']} selected={one(product.reaction)} onToggle={(v) => updateProduct(index, { reaction: v })} /></div>
                    {['Mild', 'Serious'].includes(product.reaction) && (
                      <input className="ip-input" value={product.reactionText} onChange={(e) => updateProduct(index, { reactionText: e.target.value })} placeholder="What happened? (optional)" aria-label="What happened" />
                    )}
                    {product.current === 'No' && (
                      <div className="ip-q"><strong>Why did you stop?</strong>
                        <SearchableChoices
                          items={STOP_REASONS}
                          selected={product.stopReasons || []}
                          onToggle={(reason) => updateProduct(index, {
                            stopReasons: (product.stopReasons || []).includes(reason) ? product.stopReasons.filter((x) => x !== reason) : [...(product.stopReasons || []), reason],
                          })}
                          search={stopSearch}
                          onSearch={setStopSearch}
                          onAdd={(value) => { updateProduct(index, { stopReasons: [...new Set([...(product.stopReasons || []), value])] }); setStopSearch(''); }}
                          placeholder="Search reasons"
                          searchable={false}
                        />
                      </div>
                    )}
                    <button type="button" className="ip-link-danger" onClick={() => removeProduct(index)}>Remove</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {!adding ? (
        <button type="button" className="ip-add-row" onClick={() => setAdding(true)}><span aria-hidden="true">+</span>{products.length ? 'Add another' : 'Add a product or brand'}</button>
      ) : (
        <div>
          <label className="ip-search is-active">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && query.trim()) addProduct(query); }} placeholder="Search products" aria-label="Search products" />
            <button type="button" aria-label="Close search" onClick={() => { setAdding(false); setQuery(''); }}>×</button>
          </label>
          <SuggestList draft={query} matches={suggestions} onPick={addProduct} />
        </div>
      )}
    </div>
  );
}

// Pattern L1, real drag-to-reorder, built on Pointer Events rather than
// HTML5 native drag-and-drop (which doesn't fire reliably on touchscreens).
// The dragged row tracks the pointer via a CSS transform computed from a
// fixed rect snapshot taken at pointer-down, while the other rows' *live*
// positions (read fresh on every move) decide when to splice the array
// so the list itself reorders live as you drag, not just on release.

// Pattern M1, textarea plus dashed "inspiration only" prompt chips: tapping
// one appends its starter phrase rather than committing an answer, since
// unlike every selectable option elsewhere in this form, these never
// represent a stored choice.


// Under-18 gate, terminal screen (Ayna_Minor_Gate.html design reference).
// Deliberately not styled with the rest of the quiz's dark hero-gradient
// chrome, this is a policy/stop screen, not another question card, so it
// keeps its own light card look from the reference. No progress bar, no
// Skip, and nothing about the intake carries forward from here: leaving
// (Browse the reading library) unmounts this screen entirely the same as
// every other exit from this file, and Change my birthday just returns to
// the still-populated birthday question, nothing was ever cleared.
function MinorGateScreen({ onChangeAge, onBrowseLibrary }) {
  const whatYouCanDo = [
    ['01', 'Talk to someone who can help', 'A parent, guardian, school nurse or your own doctor can look at symptoms with your full history in front of them.'],
    ['02', 'Read, without a profile', 'Our explainers on cycles, sleep and nutrition stay open to everyone. Nothing personalized, nothing stored.'],
    ['03', 'Come back at 18', "We'll still be here, and the quiz only takes a few minutes."],
  ];
  return (
    <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', background: 'var(--ayna-bg)', color: INK, fontFamily: "var(--ayna-font-ui)" }}>
      <div style={{ flex: 'none', padding: 'max(16px, env(safe-area-inset-top)) 20px 12px', borderBottom: '1px solid ' + ROW_BORDER, background: CARD_BG }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" className="ayna-intake-control" aria-label="Change age" onClick={onChangeAge} style={{ width: 30, height: 30, borderRadius: 99, border: '1.5px solid ' + ROW_BORDER, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flex: 'none' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 500, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', letterSpacing: '1.3px', textTransform: 'uppercase', color: LABEL_GOLD }}>About you</div>
            <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 500, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', letterSpacing: '.8px', color: MUTED, marginTop: 2 }}>Quiz paused</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0, minHeight: 0, overflowY: 'auto' }}>
        <div style={{ padding: '38px 24px 30px', background: `linear-gradient(170deg, ${WARNING_BG}, ${CARD_BG})` }}>
          <div style={{ width: 54, height: 54, borderRadius: 99, background: CARD_BG, border: '1.5px solid ' + WARNING_BORDER_SOFT, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px -10px rgba(180,64,42,.3)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={WARNING_BORDER} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l8 4v5c0 4.5-3.2 7.9-8 9-4.8-1.1-8-4.5-8-9V7l8-4z" /><path d="M12 10v3.5" /><path d="M12 16.5h.01" /></svg>
          </div>
          <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 500, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', letterSpacing: '1.3px', textTransform: 'uppercase', color: LABEL_GOLD, marginTop: 20 }}>Age requirement</div>
          <div style={{ fontFamily: "var(--ayna-font-display)", fontWeight: 400, fontSize: 'calc(28px * var(--ayna-text-scale, 1))', lineHeight: 1.15, color: INK, marginTop: 9 }}>We can't take you through the quiz</div>
          <p style={{ fontFamily: 'var(--ayna-font-ui)', fontWeight: 400, fontSize: 'calc(15px * var(--ayna-text-scale, 1))', lineHeight: 1.45, color: BODY_TEXT, margin: '12px 0 0' }}>
            ayna is built for people 18 and over. Because the quiz leads to supplement and product guidance, we don't create profiles for minors. That's a conversation for a parent, guardian or clinician who knows your history.
          </p>
        </div>

        <div style={{ padding: '26px 24px 30px' }}>
          <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: INK }}>What you can do now</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 13 }}>
            {whatYouCanDo.map(([num, title, body]) => (
              <div key={num} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '15px 16px', borderRadius: 18, background: PANEL_BG, border: '1px solid ' + ROW_BORDER }}>
                <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 400, fontSize: 'calc(15px * var(--ayna-text-scale, 1))', color: LABEL_GOLD, flex: 'none', lineHeight: 1.45 }}>{num}</div>
                <div>
                  <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: INK }}>{title}</div>
                  <div style={{ fontFamily: 'var(--ayna-font-ui)', fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', lineHeight: 1.5, color: BODY_TEXT, marginTop: 3 }}>{body}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 22, padding: '15px 16px', borderRadius: 18, background: CARD_BG, border: '1px solid ' + ROW_BORDER }}>
            <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: INK }}>Entered the wrong age?</div>
            <div style={{ fontFamily: 'var(--ayna-font-ui)', fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', lineHeight: 1.5, color: BODY_TEXT, marginTop: 4 }}>Go back one screen and change it. Nothing has been saved yet.</div>
          </div>

          <p style={{ fontFamily: 'var(--ayna-font-ui)', fontWeight: 500, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', lineHeight: 1.55, color: MUTED, margin: '16px 0 0' }}>
            If you're in immediate distress, contact a local emergency service or a crisis line rather than waiting on an answer here.
          </p>
        </div>
      </div>

      <div style={{ flex: 'none', padding: '14px 20px max(20px, env(safe-area-inset-bottom))', borderTop: '1px solid ' + ROW_BORDER, background: CARD_BG }}>
        <button type="button" className="ayna-intake-control" onClick={onBrowseLibrary} style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(17px * var(--ayna-text-scale, 1))', textAlign: 'center', padding: 15, borderRadius: 99, cursor: 'pointer', background: NAVY, color: '#FFEDAC', boxShadow: '0 14px 28px -14px rgba(36,42,82,.65)' }}>
          Browse the reading library
        </button>
        <button type="button" className="ayna-intake-control" onClick={onChangeAge} style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(17px * var(--ayna-text-scale, 1))', textAlign: 'center', padding: 14, borderRadius: 99, cursor: 'pointer', color: NAVY, border: '1.5px solid ' + NAVY, marginTop: 9 }}>
          Change my age
        </button>
      </div>
    </div>
  );
}

/* --------------------------------- Main screen --------------------------------- */


export default function IntakeScreen({ onBack, onComplete, onDraftChange, initialSnapshot = null, startAtBeginning = false, startAtOptional = false, startAtStep = '', introEnabled = true, flow = 'auto' }) {
  // First run (no saved profile): the seven short setup screens
  // (onboardingFlow.js). Editing a saved profile keeps the full quiz.
  // Editing just her topics or goals (only the setup screens ask them): that one screen, then save.
  const singleStep = Boolean(initialSnapshot && ['helpTopics', 'goals'].includes(startAtStep));
  // flow 'more': the optional setup questions, opened from the reveal's
  // "Make my matches more personal" (team direction, section 29).
  const onboarding = flow === 'onboarding' || flow === 'more' || singleStep || (flow === 'auto' && !initialSnapshot && !startAtBeginning);
  const obPart = singleStep ? 'all' : flow === 'more' ? 'more' : 'core';
  const [savedDraft] = useState(() => !initialSnapshot && !startAtBeginning ? readIntakeDraft() : null);
  // Opened from "Make my matches more personal" (Ecosystem): straight into the optional questions.
  const [enteredAtOptional] = useState(() => Boolean(startAtOptional && initialSnapshot && !savedDraft));
  const [intake, setIntake] = useState(() => savedDraft ? { ...EMPTY, ...savedDraft.intake } : reconstructIntakeFromSnapshot(initialSnapshot));
  // A draft or deep link on a follow-up that moved under the life stage opens the life stage.
  const [draftStepId] = useState(() => (savedDraft?.stepId ? resumeStepId({ ...EMPTY, ...savedDraft.intake }, savedDraft.stepId) : ''));
  const [stepId, setStepId] = useState(() => (import.meta.env.DEV && new URLSearchParams(window.location.search).get('step')) || (startAtStep && initialSnapshot ? resumeStepId(reconstructIntakeFromSnapshot(initialSnapshot), startAtStep) : null) || (flow === 'more' ? getOnboardingSteps(reconstructIntakeFromSnapshot(initialSnapshot), { part: 'more' })[0]?.id : null) || (onboarding ? (savedDraft && getOnboardingSteps({ ...EMPTY, ...savedDraft.intake }, { part: 'core' }).some((st) => st.id === draftStepId) ? draftStepId : 'helpTopics') : null) || draftStepId || (startAtOptional && initialSnapshot ? firstOptionalResumeStepId(reconstructIntakeFromSnapshot(initialSnapshot)) : startAtBeginning || !initialSnapshot ? 'age' : firstUnansweredStepId(reconstructIntakeFromSnapshot(initialSnapshot))));
  const [search, setSearch] = useState('');
  // Computed once, from how things stood when this resume started (not
  // re-derived as answers change), so a step's flag clears only by actually
  // reaching and answering it. Skipped optional steps are not flagged.
  const [flaggedStepIds] = useState(() => {
    if (savedDraft || !initialSnapshot) return new Set();
    const resumed = reconstructIntakeFromSnapshot(initialSnapshot);
    const { required, optional } = splitIntakeSteps(resumed);
    return new Set([...required, ...optional].filter((st) => !isStepAnswered(st.id, resumed) && !(resumed.skippedSteps || []).includes(st.id)).map((st) => st.id));
  });
  useEffect(() => {
    if (initialSnapshot || startAtBeginning) return;
    const hasProgress = (stepId !== 'age' && stepId !== 'helpTopics') || JSON.stringify(intake) !== JSON.stringify(EMPTY);
    try {
      if (hasProgress) localStorage.setItem(INTAKE_DRAFT_KEY, JSON.stringify({ version: 1, intake, stepId }));
      else localStorage.removeItem(INTAKE_DRAFT_KEY);
    } catch { /* storage unavailable */ }
    onDraftChange?.(hasProgress);
  }, [intake, stepId, initialSnapshot, startAtBeginning, onDraftChange]);
  const [minorGate, setMinorGate] = useState(false);
  // ZIP: Next is live from the first digit; a bad ZIP is caught on Next, not before.
  const [zipError, setZipError] = useState('');
  const [direction, setDirection] = useState('forward');
  const [infoOpen, setInfoOpen] = useState(null);
  // Hold a word (e.g. "Perimenopause", "PMDD") for a plain-language definition.
  const [glossary, setGlossary] = useState(null);
  const holdRef = useRef({ timer: null, fired: false });
  const startHold = (event) => {
    const el = event.target.closest('button, label, [role="radio"]');
    const raw = el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
    const value = LIFE_STAGE_VALUE_BY_LABEL[raw] || raw;
    const hit = el && (defineOption(value, step.type) || (step.type === 'price' && defineOption(value, 'largePurchase')));
    clearTimeout(holdRef.current.timer);
    holdRef.current.fired = false;
    if (!hit) return;
    holdRef.current.timer = setTimeout(() => { holdRef.current.fired = true; setGlossary({ ...hit, term: hit.term === value ? raw : hit.term }); haptic('selection'); }, 450);
  };
  const endHold = () => clearTimeout(holdRef.current.timer);
  const swallowClickAfterHold = (event) => {
    if (holdRef.current.fired) { event.preventDefault(); event.stopPropagation(); holdRef.current.fired = false; return; }
    // A picked answer gets a selection tick on the phone (no-op on the web).
    if (event.target.closest('button, [role="radio"], [role="checkbox"], label')) haptic('selection');
  };

  // Part 1: the required minimum (with the follow-ups that apply). Then a
  // checkpoint. Part 2: optional refinements, each one skippable.
  const { required: requiredSteps, optional: optionalSteps } = useMemo(() => splitIntakeSteps(intake), [intake]);
  const onboardingSteps = useMemo(() => (onboarding ? getOnboardingSteps(intake, { part: obPart }) : []), [onboarding, obPart, intake]);
  const atCheckpoint = !onboarding && stepId === CHECKPOINT_STEP;
  const phase = onboarding ? 'onboarding' : optionalSteps.some((s) => s.id === stepId) ? 'optional' : 'required';
  const visibleSteps = onboarding ? onboardingSteps : phase === 'optional' ? optionalSteps : requiredSteps;
  const currentIndex = Math.max(0, visibleSteps.findIndex((s) => s.id === stepId));
  const step = atCheckpoint ? { id: CHECKPOINT_STEP, section: 'checkpoint', title: '', type: 'checkpoint' } : (visibleSteps[currentIndex] || visibleSteps[0]);
  const isLast = currentIndex === visibleSteps.length - 1;
  // Every screen is its own numbered step (age and life stage used to share
  // one "About you" number, so the count and bar stood still between them).
  const countedSteps = visibleSteps;
  const countedIndex = Math.max(0, countedSteps.findIndex((s) => s.id === step.id));
  const countedRequiredTotal = requiredSteps.length;

  const set = (key, value) => setIntake((prev) => ({ ...prev, [key]: value }));
  const toggleExclusive = (key, value, exclusiveValues = []) => setIntake((prev) => {
    const current = Array.isArray(prev[key]) ? prev[key] : (prev[key] ? [prev[key]] : []);
    let next;
    if (current.includes(value)) next = current.filter((x) => x !== value);
    else if (exclusiveValues.includes(value)) next = [value];
    else next = [...current.filter((x) => !exclusiveValues.includes(x)), value];
    return { ...prev, [key]: next };
  });
  const toggleLifeStage = (value) => setIntake((prev) => {
    const next = toggleLifeStageSelection(getLifeStages(prev), value);
    return syncPerimenopausePeriods({ ...prev, lifeStageSelections: next, lifeStage: next.find((v) => !LIFE_STAGE_EXCLUSIVE.includes(v)) || '' });
  });
  const addCustomSelection = (key, raw, exclusiveValues = []) => {
    const value = String(raw || '').trim().replace(/\s+/g, ' ').slice(0, 80);
    if (value.length < 2) return;
    setIntake((prev) => {
      const current = Array.isArray(prev[key]) ? prev[key] : [];
      if (current.some((item) => item.toLowerCase() === value.toLowerCase())) return prev;
      const next = [...current.filter((item) => !exclusiveValues.includes(item)), value];
      return key === 'lifeStageSelections' ? { ...prev, [key]: next, lifeStage: next[0] || '' } : { ...prev, [key]: next };
    });
    setSearch('');
  };

  const [helpOtherOpen, setHelpOtherOpen] = useState(false);
  const toggleHelpTopic = (value) => {
    if (value === SOMETHING_ELSE) {
      const open = helpOtherOpen || String(intake.supportOtherText || '').trim();
      setHelpOtherOpen(!open);
      if (open) set('supportOtherText', '');
      return;
    }
    setIntake((prev) => {
      const cur = prev.helpTopics || [];
      return { ...prev, helpTopics: cur.includes(value) ? cur.filter((x) => x !== value) : [...cur, value] };
    });
  };

  const goTo = (id, dir) => { setSearch(''); setZipError(''); setDirection(dir); setStepId(id); };
  const finish = (answers = intake) => {
    try { localStorage.removeItem(INTAKE_DRAFT_KEY); } catch { /* storage unavailable */ }
    onDraftChange?.(false);
    onComplete(mapIntakeToLegacyQuizProfile(buildSnapshot(answers)));
  };
  const goBack = () => {
    if (atCheckpoint) { goTo(requiredSteps[requiredSteps.length - 1].id, 'back'); return; }
    if (onboarding) { if (currentIndex > 0) goTo(visibleSteps[currentIndex - 1].id, 'back'); else if (onBack) onBack(); return; }
    if (currentIndex > 0) goTo(visibleSteps[currentIndex - 1].id, 'back');
    else if (phase === 'optional' && enteredAtOptional && onBack) onBack();
    else if (phase === 'optional') goTo(CHECKPOINT_STEP, 'back');
    else if (onBack) onBack();
  };
  const advance = (answers = intake) => {
    // Recompute: an answer on this step can add or remove follow-ups after it.
    const list = onboarding ? getOnboardingSteps(answers, { part: obPart }) : visibleSteps;
    const at = list.findIndex((s) => s.id === step.id);
    if (singleStep) { finish(answers); return; }
    if (onboarding) { if (at >= 0 && at < list.length - 1) goTo(list[at + 1].id, 'forward'); else finish(answers); return; }
    if (!isLast) { goTo(visibleSteps[currentIndex + 1].id, 'forward'); return; }
    if (phase === 'required') goTo(CHECKPOINT_STEP, 'forward');
    else finish(answers);
  };
  const goNext = () => {
    if (step.id === 'age' && isMinorAge(intake.age)) return;
    if (!requiredReady(step.id, intake)) return;
    if (step.id === 'zip' && intake.zipcode && !isValidUsZip(intake.zipcode)) { setZipError('Invalid ZIP code'); return; }
    // Optional step left empty: same as Skip (stored as skipped, neutral).
    const next = step.optional ? markSkipped(intake, step.id) : intake;
    if (next !== intake) setIntake(next);
    advance(next);
  };
  // Skip never validates; a half-typed ZIP is dropped rather than saved.
  const skipStep = () => {
    const next = markSkipped(step.id === 'zip' && !isValidUsZip(intake.zipcode) ? { ...intake, zipcode: '' } : intake, step.id);
    setIntake(next);
    advance(next);
  };

  const selectedLifeStages = getLifeStages(intake);
  // Perimenopause often starts in the late 30s, so midlife stages move up from 35.
  const showMidlifeFirst = intake.age !== '' && Number(intake.age) >= 35;
  const lifeStageOptions = showMidlifeFirst
    ? [...MIDLIFE_LIFE_STAGES, ...LIFE_STAGES.filter((item) => !MIDLIFE_LIFE_STAGES.includes(item))]
    : LIFE_STAGES;

  const renderBody = () => {
    if (step.type === 'age') return (
      <AgeDial value={intake.age} onChange={(v) => set('age', v)} underage={isMinorAge(intake.age)} onOpenGate={() => setMinorGate(true)} />
    );

    if (step.type === 'lifeStage') return (
      <>
        {showMidlifeFirst && <p className="ip-hint">Midlife stages moved up. You can pick Perimenopause and Regular periods together.</p>}
        <SearchableChoices items={lifeStageOptions} selected={selectedLifeStages} onToggle={toggleLifeStage} search={search} onSearch={setSearch} onAdd={(value) => addCustomSelection('lifeStageSelections', value)} placeholder="Search life stages" layout="grid" labels={LIFE_STAGE_LABELS} glyphs={LIFE_STAGE_GLYPHS} searchable={false} />
        <div className="ip-gap"><ChipList items={LIFE_STAGE_EXCLUSIVE} selected={selectedLifeStages} onToggle={toggleLifeStage} muted={LIFE_STAGE_EXCLUSIVE} compact /></div>
        {/* Each stage's follow-up sits right under the tiles (asked once, never again later). */}
        {selectedLifeStages.includes('I am trying to conceive') && (
          <div className="ip-followup">
            <strong>{FOLLOWUP_QUESTIONS.ttcDuration}</strong>
            <ChipList items={withSavedOption(ttcDurationOptions(intake), intake.ttcDuration)} selected={intake.ttcDuration ? [intake.ttcDuration] : []} onToggle={(v) => set('ttcDuration', v)} compact />
          </div>
        )}
        {selectedLifeStages.includes('I am pregnant') && (
          <div className="ip-followup">
            <strong>{FOLLOWUP_QUESTIONS.pregnancyTrimester}</strong>
            <ChipList items={withSavedOption(PREGNANCY_TRIMESTER, intake.pregnancyTrimester)} selected={intake.pregnancyTrimester ? [intake.pregnancyTrimester] : []} onToggle={(v) => set('pregnancyTrimester', v)} compact />
          </div>
        )}
        {selectedLifeStages.includes('I am postpartum') && (
          <div className="ip-followup">
            <strong>{FOLLOWUP_QUESTIONS.postpartumTiming}</strong>
            <ChipList items={withSavedOption(POSTPARTUM_TIMING, intake.postpartumTiming)} selected={intake.postpartumTiming ? [intake.postpartumTiming] : []} onToggle={(v) => set('postpartumTiming', v)} compact />
          </div>
        )}
        {selectedLifeStages.includes('I am postpartum') && (
          <div className="ip-followup">
            <strong>{FOLLOWUP_QUESTIONS.breastfeedingStatus}</strong>
            <ChipList items={BREASTFEEDING_STATUS} selected={intake.breastfeedingStatus ? [intake.breastfeedingStatus] : []} onToggle={(v) => set('breastfeedingStatus', v)} compact />
          </div>
        )}
        {selectedLifeStages.includes('I am in perimenopause') && (
          <div className="ip-followup">
            <strong>{FOLLOWUP_QUESTIONS.perimenopauseLastPeriod}</strong>
            <ChipList items={withSavedOption(PERIMENOPAUSE_LAST_PERIOD, intake.perimenopauseLastPeriod)} selected={intake.perimenopauseLastPeriod ? [intake.perimenopauseLastPeriod] : []} onToggle={(v) => setIntake((prev) => setPerimenopausePeriods(prev, v))} compact />
          </div>
        )}
      </>
    );

    if (step.type === 'zip') return <div className="ip-zip">
      <ZipTicket value={intake.zipcode} onChange={(v) => { setZipError(''); set('zipcode', v.replace(/\D/g, '').slice(0, 5)); }} />
      {zipError && <div className="ip-zip-err" role="alert">{zipError}</div>}
    </div>;

    if (step.type === 'topics') return (
      <>
        <ChipList items={HELP_TOPICS} selected={[...(intake.helpTopics || []), ...(String(intake.supportOtherText || '').trim() || helpOtherOpen ? [SOMETHING_ELSE] : [])]} onToggle={toggleHelpTopic} />
        {(helpOtherOpen || String(intake.supportOtherText || '').trim()) && (
          <label className="ip-other-text">
            <span>Tell us in your own words</span>
            <input value={intake.supportOtherText} maxLength={80} placeholder="For example, migraines" onChange={(e) => set('supportOtherText', e.target.value)} />
          </label>
        )}
        <p className="ip-hint">Not sure? Tap Next and we will show everything.</p>
      </>
    );
    if (step.type === 'goals') return <ChipList items={GOALS} selected={intake.goals || []} onToggle={(v) => setIntake((prev) => ({ ...prev, goals: (prev.goals || []).includes(v) ? prev.goals.filter((x) => x !== v) : [...(prev.goals || []), v] }))} />;

    if (step.type === 'support' && onboarding) return (
      <>
        <TopicPicker key={(intake.helpTopics || []).join('|')} groups={supportGroupsForTopics(intake.helpTopics)} selected={intake.supportSelections} search={search} onSearch={setSearch} onToggle={(item) => toggleExclusive('supportSelections', item, [NOTHING_SPECIFIC])} onAdd={(value) => addCustomSelection('supportSelections', value, [NOTHING_SPECIFIC])} />
        <div className="ip-gap"><ChipList items={[NOTHING_SPECIFIC]} selected={intake.supportSelections} onToggle={(item) => toggleExclusive('supportSelections', item, [NOTHING_SPECIFIC])} muted={[NOTHING_SPECIFIC]} compact /></div>
      </>
    );
    if (step.type === 'support') return (
      <TopicPicker groups={SUPPORT_GROUPS} selected={intake.supportSelections} search={search} onSearch={setSearch} onToggle={(item) => toggleExclusive('supportSelections', item, ['Nothing right now'])} onAdd={(value) => addCustomSelection('supportSelections', value, ['Nothing right now'])} />
    );

    // First run: named answers instead of an unlabeled level meter (team direction, section 33).
    if (onboarding && (step.type === 'flow' || step.type === 'pain')) {
      const key = step.type === 'flow' ? 'periodFlow' : 'periodPain';
      return <ChipList items={step.type === 'flow' ? PERIOD_FLOW : PERIOD_PAIN} selected={intake[key] ? [intake[key]] : []} onToggle={(v) => set(key, intake[key] === v ? '' : v)} />;
    }
    if (step.type === 'flow') return <LevelMeter options={PERIOD_FLOW} value={intake.periodFlow} onChange={(v) => set('periodFlow', v)} shape="drop" />;
    if (step.type === 'pain') return <LevelMeter options={PERIOD_PAIN} value={intake.periodPain} onChange={(v) => set('periodPain', v)} shape="bar" />;
    if (step.type === 'utiFrequency') return <TrackLine options={UTI_FREQUENCY} value={intake.utiFrequency} onChange={(v) => set('utiFrequency', v)} />;
    if (step.type === 'ttcDuration') return <TrackLine options={ttcDurationOptions(intake)} value={intake.ttcDuration} onChange={(v) => set('ttcDuration', v)} />;
    if (step.type === 'postpartumTiming') return (
      <>
        <TrackLine options={POSTPARTUM_TIMING} value={intake.postpartumTiming} onChange={(v) => set('postpartumTiming', v)} />
        {asksBreastfeedingOnTiming(intake) && (
          <div className="ip-followup">
            <strong>{FOLLOWUP_QUESTIONS.breastfeedingStatus}</strong>
            <ChipList items={BREASTFEEDING_STATUS} selected={intake.breastfeedingStatus ? [intake.breastfeedingStatus] : []} onToggle={(v) => set('breastfeedingStatus', v)} compact />
          </div>
        )}
      </>
    );
    if (step.type === 'pregnancyTrimester') return <TrackLine options={PREGNANCY_TRIMESTER} value={intake.pregnancyTrimester} onChange={(v) => set('pregnancyTrimester', v)} />;

    if (step.type === 'conditions') {
      return (
        <SearchableChoices items={[...CONDITION_EXCLUSIVE, ...CONDITIONS.filter((item) => !CONDITION_EXCLUSIVE.includes(item))]} labels={SAFETY_ANSWER_LABELS} selected={intake.diagnosisSelections} onToggle={(v) => toggleExclusive('diagnosisSelections', v, CONDITION_EXCLUSIVE)} search={search} onSearch={setSearch} onAdd={(value) => addCustomSelection('diagnosisSelections', value, CONDITION_EXCLUSIVE)} placeholder="Search conditions" />
      );
    }

    if (step.type === 'allergies') return (
      <>
        <Segmented
          options={ALLERGY_STATUS}
          labels={SAFETY_ANSWER_LABELS}
          value={intake.allergyStatus}
          onChange={(value) => setIntake((prev) => ({ ...prev, allergyStatus: value, allergyItems: value === 'Yes' ? prev.allergyItems : [] }))}
        />
        {intake.allergyStatus === 'Yes' && (
          <div className="ip-gap">
            <TokenInput values={intake.allergyItems} onChange={(v) => set('allergyItems', v)} placeholder="Allergy or sensitivity" suggestions={ALLERGIES} suggestionLimit={8} />
            {intake.allergyItems.length === 0 && <p className="ip-hint ip-hint--need">Add at least one, or pick None.</p>}
          </div>
        )}
      </>
    );

    if (step.type === 'medications') return (
      <>
        <Segmented options={MEDICATION_STATUS} labels={SAFETY_ANSWER_LABELS} value={intake.takesCurrent} onChange={(value) => setIntake((prev) => ({ ...prev, takesCurrent: value, currentMedicationItems: value === 'Yes' ? prev.currentMedicationItems : [] }))} />
        {intake.takesCurrent === 'Yes' && (
          <div className="ip-gap">
            <TokenInput values={intake.currentMedicationItems} onChange={(v) => set('currentMedicationItems', v)} placeholder="Medicine or supplement" suggestions={MEDICATION_SUGGESTIONS} suggestionLimit={10} />
            {intake.currentMedicationItems.length === 0 && <p className="ip-hint ip-hint--need">Add at least one, or pick None.</p>}
          </div>
        )}
        <p className="ip-callout">Check with a clinician before starting anything new.</p>
      </>
    );

    if (step.type === 'products') return <ProductHistoryBuilder products={intake.productHistory} onChange={(v) => set('productHistory', v)} />;
    if (step.type === 'avoidRepeat') return (
      <AddProductBuilder
        values={intake.avoidRepeat}
        onChange={(v) => set('avoidRepeat', v)}
        suggestions={PRODUCT_OR_BRAND_SUGGESTIONS}
        historyNames={[...new Set((intake.productHistory || []).map((p) => p.name).filter(Boolean))]}
        footerText="These never show up in your picks."
      />
    );
    if (step.type === 'trustedBrands') return <TokenInput values={intake.trustedBrands} onChange={(v) => set('trustedBrands', v)} placeholder="Type a brand" suggestions={BRAND_SUGGESTIONS} />;

    if (step.type === 'safety') return (
      <>
        <Segmented options={URGENT_STATUS} value={intake.safetyConcern} onChange={(v) => set('safetyConcern', v)} />
        {['Yes', 'Not sure'].includes(intake.safetyConcern) && (
          <div className="ip-alert" role="note">
            <strong><span aria-hidden="true">!</span>Worth a closer look</strong>
            <p>Some new or worsening symptoms need a clinician. ayna helps you find products and doesn’t diagnose. If it feels urgent or severe, get care promptly.{intake.safetyConcern === 'Yes' ? ' We’ll show care options first.' : ''}</p>
          </div>
        )}
      </>
    );

    if (step.type === 'formats') return (
      <>
        <SearchableChoices items={PRODUCT_FORMATS} selected={intake.preferredFormats} onToggle={(v) => toggleExclusive('preferredFormats', v, ['No preference'])} search={search} onSearch={setSearch} onAdd={(value) => addCustomSelection('preferredFormats', value, ['No preference'])} placeholder="Search formats" layout="grid" icons={FORMAT_ICONS} searchable={false} />
        <div className="ip-gap"><AddOwn placeholder="Add a format" onAdd={(value) => addCustomSelection('preferredFormats', value, ['No preference'])} /></div>
      </>
    );

    if (step.type === 'price') {
      const selectedPrices = Array.isArray(intake.priceRange) ? intake.priceRange : (intake.priceRange ? [intake.priceRange] : []);
      const notAFactor = 'Price is not a major factor for me';
      return (
        <>
          <PriceStacks options={PRICE_RANGES.filter((opt) => opt !== notAFactor)} selected={selectedPrices} onToggle={(v) => toggleExclusive('priceRange', v, [notAFactor])} />
          <ChipList items={[notAFactor]} selected={selectedPrices} onToggle={(v) => toggleExclusive('priceRange', v, [notAFactor])} compact />
          {onboarding
            ? <div className="ip-followup"><strong>{FOLLOWUP_QUESTIONS.largePurchaseFrequency}</strong><ChipList items={LARGE_PURCHASE_FREQUENCY} selected={intake.largePurchaseFrequency ? [intake.largePurchaseFrequency] : []} onToggle={(v) => set('largePurchaseFrequency', intake.largePurchaseFrequency === v ? '' : v)} compact /></div>
            : <DotScale label={FOLLOWUP_QUESTIONS.largePurchaseFrequency} options={LARGE_PURCHASE_FREQUENCY} value={intake.largePurchaseFrequency} onChange={(v) => set('largePurchaseFrequency', v)} />}
        </>
      );
    }
    if (step.type === 'brand') return <BrandSpectrum options={BRAND_OPENNESS} value={intake.brandOpenness} onChange={(v) => set('brandOpenness', v)} />;
    if (step.type === 'avoidIngredients' || step.type === 'avoidOnly' || step.type === 'wantOnly') {
      // "Leave out: Fragrance" also stores "Fragrance-free", the value the match engine already scores, so logic is unchanged.
      const selected = intake.avoidIngredients || [];
      const isOn = (v) => selected.includes(v) || (AVOID_PAIRS[v] && selected.includes(AVOID_PAIRS[v]));
      const known = new Set([...AVOID_INGREDIENTS, ...Object.values(AVOID_PAIRS)]);
      const customs = selected.filter((v) => !known.has(v) && v !== 'Other');
      const customAvoid = customs.filter((v) => /^No /.test(v));
      const customWant = customs.filter((v) => !/^No /.test(v));
      const toggleAvoid = (v) => setIntake((prev) => {
        const cur = (Array.isArray(prev.avoidIngredients) ? prev.avoidIngredients : []).filter((x) => x !== 'No preference');
        const pair = AVOID_PAIRS[v];
        if (v === 'No preference') return { ...prev, avoidIngredients: selected.includes('No preference') ? [] : ['No preference'] };
        const on = cur.includes(v) || (pair && cur.includes(pair));
        const next = on ? cur.filter((x) => x !== v && x !== pair) : [...cur, v, ...(pair ? [pair] : [])];
        return { ...prev, avoidIngredients: next };
      });
      if (step.type === 'avoidOnly' || step.type === 'wantOnly') {
        const isAvoid = step.type === 'avoidOnly';
        const items = isAvoid ? [...AVOID_GROUPS.avoid, ...customAvoid] : [...AVOID_GROUPS.want, ...customWant];
        return (
          <>
            <ChipList items={items.map((v) => AVOID_LABELS[v] || v)} selected={items.filter(isOn).concat(isAvoid ? customAvoid : customWant).map((v) => AVOID_LABELS[v] || v)} onToggle={(text) => toggleAvoid(AVOID_VALUE_BY_LABEL[text] || text)} />
            <div className="ip-gap"><AddOwn placeholder={isAvoid ? 'Add something to avoid' : 'Add something you prefer'} onAdd={(v) => (isAvoid ? addCustomSelection('avoidIngredients', `No ${v.replace(/^no\s+/i, '')}`, ['No preference']) : addCustomSelection('avoidIngredients', v, ['No preference']))} /></div>
          </>
        );
      }
      return (
        <AvoidMustHave
          avoidItems={[...AVOID_GROUPS.avoid, ...customAvoid]}
          avoidSelected={[...AVOID_GROUPS.avoid.filter(isOn), ...customAvoid]}
          wantItems={[...AVOID_GROUPS.want, ...customWant]}
          wantSelected={[...AVOID_GROUPS.want.filter(isOn), ...customWant]}
          onToggle={toggleAvoid}
          onAddAvoid={(v) => addCustomSelection('avoidIngredients', `No ${v.replace(/^no\s+/i, '')}`, ['No preference'])}
          onAddWant={(v) => addCustomSelection('avoidIngredients', v, ['No preference'])}
          noPref={selected.includes('No preference')}
          onNoPref={toggleAvoid}
        />
      );
    }
    if (step.type === 'fsa') return <AccountCards options={FSA_HSA} value={intake.fsaHsaAnswer} onChange={(v) => set('fsaHsaAnswer', v)} />;
    if (step.type === 'recommendationCount') return <RecommendationCountPicker value={intake.recommendedProductsPerArea} onChange={(count) => setIntake((prev) => ({ ...prev, recommendedProductsPerArea: count, recommendationCountTouched: true }))} />;
    if (step.type === 'trust') return <TrustPodium order={intake.trustRanking} onChange={(order) => set('trustRanking', order)} onTouch={() => set('trustRankingTouched', true)} />;
    if (step.type === 'textarea') return <StickyNote value={intake.anythingElse} onChange={(v) => set('anythingElse', v)} placeholder="A goal, a worry, something that didn’t work…" prompts={FREE_TEXT_PROMPTS} />;

    return null;
  };

  const countForStep =
    step.id === 'helpTopics' ? (intake.helpTopics || []).length :
    step.id === 'goals' ? (intake.goals || []).length :
    step.id === 'support' ? intake.supportSelections.length :
    step.id === 'conditions' ? intake.diagnosisSelections.length :
    step.id === 'allergies' ? intake.allergyItems.length :
    step.id === 'formats' ? intake.preferredFormats.length :
    step.id === 'avoidIngredients' ? intake.avoidIngredients.length : 0;
  const minorBlocked = step.id === 'age' && isMinorAge(intake.age);
  const ready = requiredReady(step.id, intake) && !minorBlocked && (step.id !== 'zip' || String(intake.zipcode || '').length > 0);
  const storyTouch = useRef(null);
  const storyWheel = useRef(0);
  const storyAdvance = (direction) => {
    if (direction > 0 && ready) goNext();
    if (direction < 0) goBack();
  };
  const onStoryTouchStart = (event) => {
    storyTouch.current = { x: event.touches[0]?.clientX, y: event.touches[0]?.clientY, target: event.target };
  };
  const onStoryTouchEnd = (event) => {
    const start = storyTouch.current;
    storyTouch.current = null;
    if (!start || start.y == null || start.target?.closest('input, textarea, select, button, .ayna-intake-timeline, [role="slider"], [contenteditable], .qi')) return;
    const deltaX = start.x - event.changedTouches[0]?.clientX;
    const delta = start.y - event.changedTouches[0]?.clientY;
    if (Math.abs(deltaX) > 75 && Math.abs(deltaX) > Math.abs(delta) * 1.3) { storyAdvance(Math.sign(deltaX)); return; }
    const body = event.currentTarget.querySelector('.ip-body');
    if (!body || Math.abs(delta) < 100) return;
    if (delta > 0 && body.scrollTop + body.clientHeight >= body.scrollHeight - 8) storyAdvance(1);
    if (delta < 0 && body.scrollTop <= 8) storyAdvance(-1);
  };
  const onStoryWheel = (event) => {
    if (event.target.closest('input, textarea, select, [role="listbox"], .qi')) return;
    const body = event.currentTarget.querySelector('.ip-body');
    if (!body) return;
    const atEnd = event.deltaY > 0 && body.scrollTop + body.clientHeight >= body.scrollHeight - 8;
    const atStart = event.deltaY < 0 && body.scrollTop <= 8;
    if (!atEnd && !atStart) { storyWheel.current = 0; return; }
    storyWheel.current += event.deltaY;
    if (Math.abs(storyWheel.current) > 220) {
      storyAdvance(Math.sign(storyWheel.current));
      storyWheel.current = 0;
    }
  };

  if (minorGate) {
    return <MinorGateScreen onChangeAge={() => setMinorGate(false)} onBrowseLibrary={onBack} />;
  }

  if (atCheckpoint) {
    const remainingOptional = optionalProgress(intake).remaining;
    const careFirst = intake.safetyConcern === 'Yes';
    return (
      <div className="ayna-play-intake ip-tone--mint ip-checkpoint" data-section="checkpoint" data-step={CHECKPOINT_STEP} data-direction={direction}>
        <IntakeSceneArt art="bloom" key="art-checkpoint" />
        <header className="ip-head">
          <div className="ip-head-row">
            <button type="button" className="ip-round" aria-label="Go back" onClick={goBack}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
            </button>
            <span className="ip-count ip-count--plain" aria-label={`All ${countedRequiredTotal} required questions done`}>All done</span>
            <span className="ip-skip-spacer" />
          </div>
          <div className="ip-progress" aria-hidden="true">{requiredSteps.map((s) => <span key={s.id} className="is-done" />)}</div>
        </header>
        <div className="ip-body">
          <div className="ip-question" key="q-checkpoint">
            <div className="ip-label-row"><span className="ip-label ip-label--done">Done</span></div>
            <h1 className="ip-title">Your first matches are ready</h1>
            <p className="ip-subtitle">{careFirst ? 'You said something may be urgent, so your results start with ways to reach care.' : 'That’s enough for safe, personal picks.'}</p>
            {careFirst && <div className="ip-care-now" role="note"><b>If this is an emergency, call 911.</b> <span>If you're thinking about harming yourself, call or text 988.</span> <span>Your results open with clinician and urgent care options.</span></div>}
            {remainingOptional > 0 && <div className="ip-checkpoint-more">
              <strong>Want closer matches?</strong>
              <p>Answer {remainingOptional} more quick question{remainingOptional === 1 ? '' : 's'} anytime. They are optional, and you can start them later from your ecosystem.</p>
            </div>}
          </div>
        </div>
        <footer className="ip-foot ip-foot--checkpoint">
          <button type="button" className="ip-next" onClick={() => finish()}>
            <span>See my results</span>
            <i aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg></i>
          </button>
          {remainingOptional > 0 && <button type="button" className="ip-more" onClick={() => goTo(firstOptionalResumeStepId(intake), 'forward')}>Answer {remainingOptional} more now</button>}
        </footer>
      </div>
    );
  }

  const obProgress = onboarding ? onboardingProgress(step, obPart, visibleSteps) : null;
  const scene = { tone: SECTION_TONES[step.section] || 'peri', art: INTAKE_SCENES[step.id]?.art || null, label: SECTION_LABELS[step.section] };

  return (
    <div className={`ayna-play-intake ip-tone--${scene.tone}`} data-section={step.section} data-step={step.id} data-direction={direction}
      onTouchStart={onStoryTouchStart} onTouchEnd={onStoryTouchEnd} onWheel={onStoryWheel}>
      <IntakeSceneArt art={scene.art} key={`art-${step.id}`} />
      <header className="ip-head">
        <div className="ip-head-row">
          <button type="button" className="ip-round" aria-label="Go back" onClick={goBack}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
          </button>
          {/* Later questions depend on earlier answers, so the total can grow mid-quiz.
              Show a fill bar for progress instead of a "02/08" total that shifts. */}
          <span className="ip-count ip-count--plain">{onboarding ? obProgress.label : phase === 'optional' ? `Optional ${countedIndex + 1} of ${countedSteps.length}` : `Question ${countedIndex + 1}`}</span>
          {step.optional || step.type === 'topics' ? <button type="button" className="ip-skip" onClick={skipStep}>Skip</button> : <span className="ip-skip-spacer" />}
        </div>
        {onboarding ? (
          <div className="ip-progress ip-progress--fill" role="progressbar" aria-label="Setup progress" aria-valuemin={1} aria-valuemax={obProgress.total} aria-valuenow={obProgress.now}>
            <span style={{ width: `${(obProgress.now / Math.max(1, obProgress.total)) * 100}%` }} />
          </div>
        ) : (
          <div className="ip-progress ip-progress--fill" role="progressbar" aria-label="Quiz progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(((countedIndex + 1) / Math.max(1, countedSteps.length)) * 100)}>
            <span style={{ width: `${((countedIndex + 1) / Math.max(1, countedSteps.length)) * 100}%` }} />
          </div>
        )}
      </header>

      <div className="ip-body">
        <div className="ip-question" key={`q-${step.id}`}>
          <div className="ip-label-row">
            {onboarding
              ? <span className={`ip-label ip-label--${step.section}`}>{ONBOARDING_SCREENS[step.screen - 1]?.label}</span>
              : scene.label && <span className={`ip-label ip-label--${step.section}`}>{scene.label}</span>}
            {(phase === 'optional' || (onboarding && step.optional)) && <span className="ip-tag-optional">Optional</span>}
            {onboarding && step.safety && <span className="ip-tag-optional ip-tag-safety">For your safety</span>}
            {!onboarding && flaggedStepIds.has(step.id) && <span className="ip-flag">Not answered yet</span>}
            {step.info && !onboarding && <button type="button" className="ip-info" aria-label={`About this question: ${step.title}`} aria-expanded={infoOpen === step.id} onClick={() => setInfoOpen((v) => v === step.id ? null : step.id)}>i</button>}
          </div>
          <h1 className="ip-title">{step.title}</h1>
          {step.subtitle && <p className="ip-subtitle">{step.subtitle}</p>}
          {onboarding && step.why && <p className="ip-why"><b>Why we ask:</b> {step.why}</p>}
          {step.info && infoOpen === step.id && <p className="ip-info-pop" role="note">{step.info}</p>}
          <span className="ip-spacer is-top" aria-hidden="true" />
          <div className="ip-answer" onPointerDown={startHold} onPointerUp={endHold} onPointerLeave={endHold} onPointerCancel={endHold} onPointerMove={(e) => { if (Math.abs(e.movementX) + Math.abs(e.movementY) > 6) endHold(); }} onClickCapture={swallowClickAfterHold} onContextMenu={(e) => { if (holdRef.current.fired) e.preventDefault(); }}>{renderBody()}</div>
          <span className="ip-spacer is-bottom" aria-hidden="true" />
        </div>
      </div>

      <QuizIntro variant="app" enabled={introEnabled && !onboarding} />
      {glossary && <div className="ip-glossary" role="dialog" aria-label={glossary.term} onClick={() => setGlossary(null)}>
        <div className="ip-glossary-card" onClick={(e) => e.stopPropagation()}>
          <strong>{glossary.term}</strong>
          <p>{glossary.definition}</p>
          <button type="button" onClick={() => setGlossary(null)}>Got it</button>
        </div>
      </div>}
      <footer className={`ip-foot${phase === 'optional' ? ' ip-foot--optional' : ''}`}>
        <button type="button" className="ip-next" onClick={goNext} disabled={!ready}>
          <span>{isLast && phase === 'optional' ? 'See my results' : 'Next'}</span>
          {countForStep > 0 && <b>{countForStep}</b>}
          <i aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg></i>
        </button>
        {phase === 'optional' && !isLast && <button type="button" className="ip-results-link" onClick={() => finish()}>See my results now</button>}
      </footer>
    </div>
  );
}
