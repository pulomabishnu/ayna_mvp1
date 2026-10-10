import { useEffect, useMemo, useState } from 'react';
import { mapIntakeToLegacyQuizProfile } from '../../utils/healthIntake.js';
import { ChipList, LevelMeter } from '../components/intake/IntakeControls.jsx';
import '../intake-play.css';
import { loadMonthlyCheckinStatus, saveMonthlyCheckin, monthKey } from '../../utils/monthlyCheckinStore.js';

// Uses the same play system as the intake (intake-play.css): one tone per
// step, calm paper for medications and safety.

const CHECKIN_TONES = { lifeStage: 'peri', symptoms: 'pink', flow: 'peri', pain: 'butter', uti: 'mint', recs: 'butter', medications: 'calm', safety: 'calm', notes: 'pink' };

// A curated, quick-to-answer subset of intake's own taxonomy (not every one
// of its ~90 items — this is a monthly maintenance ping, not a re-run of
// the full intake). Each check-in item maps to the matching intake
// supportSelections string where one exists, so a newly-reported symptom
// here can actually reach the recommendation engine (see
// applyCheckinToIntake below) instead of only ever living in this screen's
// own history.
const SYMPTOM_GROUPS = [
  {
    label: 'Cycle + period',
    items: [
      ['Cramps', 'Cramps or period pain'],
      ['Heavy periods', 'Heavy periods'],
      ['Irregular periods', 'Irregular periods'],
      ['Spotting between periods', 'Spotting between periods'],
      ['PMS mood shifts', 'PMS symptoms'],
    ],
  },
  {
    label: 'Intimate health',
    items: [
      ['Recurrent UTIs', 'Recurrent UTI-like symptoms'],
      ['BV or yeast', 'BV concerns'],
      ['Itching or irritation', 'Vaginal itching or irritation'],
      ['Dryness', 'Vaginal dryness'],
    ],
  },
  {
    label: 'Whole body',
    items: [
      ['Fatigue', 'Fatigue or low energy'],
      ['Bloating', 'Cycle-related bloating'],
      ['Headaches', 'Cycle-related headaches or migraines'],
      ['Sleep trouble', 'Trouble sleeping'],
      ['Skin changes', 'Other hormone-related skin concerns'],
    ],
  },
  {
    label: 'Mood + mind',
    items: [
      ['Anxiety', 'Anxiety'],
      ['Low mood', 'Low mood'],
      ['Brain fog', 'Brain fog'],
    ],
  },
];
const ALL_CHECKIN_LABELS = SYMPTOM_GROUPS.flatMap((g) => g.items.map(([label]) => label));
const CHECKIN_TO_INTAKE = Object.fromEntries(SYMPTOM_GROUPS.flatMap((g) => g.items));
const PERIOD_SYMPTOM_LABELS = new Set(['Cramps', 'Heavy periods', 'Irregular periods', 'Spotting between periods', 'PMS mood shifts']);

const FLOW_OPTIONS = [
  ['Spotting', 'Lighter than a period — barely there.'],
  ['Light', 'On the lighter side for you.'],
  ['Moderate', 'Normal for you — regular changes, nothing unusual.'],
  ['Heavy', 'Heavier than typical — worth keeping an eye on.'],
  ['Very heavy', 'Significantly heavier than usual for you.'],
];
const PAIN_OPTIONS = [
  ['None', 'Nothing worth mentioning'],
  ['Mild', 'Noticeable, but it does not stop anything'],
  ['Moderate', 'I take something for it most cycles'],
  ['Severe', 'I change plans or miss things'],
  ['Disabling', 'I cannot function through it'],
];
const UTI_OPTIONS = [
  ['none', 'None'],
  ['resolved', 'Yes, resolved with something I tried'],
  ['still', 'Yes, still dealing with it'],
  ['new', 'Yes, new / first time this month'],
];
const RECS_OPTIONS = [
  ['not_tried', 'Haven’t tried them yet', 'We will hold off on new suggestions'],
  ['helped', 'Helped', 'More like these, and we will keep the dose steady'],
  ['didnt_help', 'Didn’t help', 'We will try a different mechanism, not a different brand'],
  ['worse', 'Made things worse', 'We will pull them and flag the ingredient'],
  ['na', 'N/A, didn’t get any recs', 'Nothing to score'],
];
const MEDICATION_OPTIONS = [
  ['no_changes', 'No changes', 'Same as last month'],
  ['started', 'Started something new', 'Tell us what'],
  ['stopped', 'Stopped something', 'Pick from what is on file'],
  ['not_sure', 'Not sure', 'We will ask again next month'],
];
const SAFETY_OPTIONS = ['Yes', 'No', 'Not sure'];
const LIFE_STAGE_OPTIONS = [
  ['same', 'No, still the same'],
  ['changed', 'Yes, my cycle/life stage status changed'],
  ['not_sure', 'Not sure'],
];

function monthLabel(key) {
  const d = new Date(`${key}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}
// A distinct, at-a-glance colored badge per verdict — matches the design
// reference's own treatment (a plain radio circle reads identically for
// "helped" and "made it worse," which are opposite signals for the
// algorithm and shouldn't look the same while scanning the list).
function RecsIcon({ value }) {
  const mark = { helped: '✓', didnt_help: '–', worse: '!', na: '·' }[value] || '';
  return <span className="ip-mark" data-mark={value} aria-hidden="true">{mark}</span>;
}

function OptionCard({ selected, title, subtitle, onClick, tone, icon }) {
  return (
    <button type="button" role="radio" aria-checked={selected} onClick={onClick} className={`ip-row${tone === 'warning' ? ' is-warning' : ''}${subtitle ? ' has-sub' : ''}`}>
      {icon ? <span className="ip-row-icon">{icon}</span> : <span className="ip-radio" aria-hidden="true" />}
      <span className="ip-row-copy"><span>{title}</span>{subtitle && <small>{subtitle}</small>}</span>
    </button>
  );
}

function DividerLabel({ children, right }) {
  return <div className="ip-divider"><span>{children}</span>{right != null && <small>{right}</small>}</div>;
}

// Bar height increases left to right — severity read as a shape, not just
// a label, same as the design reference's flow/pain scale. Bars are purely
// visual; the actual hit target is the whole column (bar + label).

function ScaleSelector({ options, value, onChange }) {
  const selectedOption = options.find(([label]) => label === value);
  return (
    <div>
      <LevelMeter options={options.map(([label]) => label)} value={value} onChange={onChange} />
      {selectedOption && <p className="ip-callout">{selectedOption[1]}</p>}
    </div>
  );
}

function GroupedSymptomPicker({ selected, onToggle, onClearAll }) {
  return (
    <div className="ip-groups">
      <ChipList items={['None right now']} selected={selected.length === 0 ? ['None right now'] : []} onToggle={onClearAll} compact muted={['None right now']} />
      {SYMPTOM_GROUPS.map((group) => {
        const groupCount = group.items.filter(([label]) => selected.includes(label)).length;
        return (
          <div key={group.label} className="ip-group">
            <DividerLabel right={groupCount ? `${groupCount} picked` : null}>{group.label}</DividerLabel>
            <ChipList items={group.items.map(([label]) => label)} selected={selected} onToggle={onToggle} />
          </div>
        );
      })}
    </div>
  );
}

function StepShell({ title, subtitle, tag, children, footer, stepKey }) {
  return (
    <>
      <div className="ip-body">
        <div className="ip-question" key={stepKey}>
          {tag && <span className="ip-label">{tag}</span>}
          <h1 className="ip-title">{title}</h1>
          {subtitle && <p className="ip-subtitle">{subtitle}</p>}
          <div className="ip-answer">{children}</div>
        </div>
      </div>
      {footer}
    </>
  );
}

function buildInitialAnswers(lastCheckinAnswers, fullHealthIntake) {
  const prior = lastCheckinAnswers || {};
  const priorSymptoms = Array.isArray(prior.symptoms) ? prior.symptoms : null;
  // First-ever check-in: pre-fill from the intake's own support selections
  // instead of starting blank, translated back through the same map.
  const fallbackSymptoms = Array.isArray(fullHealthIntake?.supportSelections)
    ? fullHealthIntake.supportSelections
        .map((intakeLabel) => Object.entries(CHECKIN_TO_INTAKE).find(([, v]) => v === intakeLabel)?.[0])
        .filter(Boolean)
    : [];
  return {
    lifeStageChanged: '',
    symptoms: priorSymptoms || fallbackSymptoms,
    flow: prior.flow || fullHealthIntake?.periodFlow || '',
    pain: prior.pain || fullHealthIntake?.periodPain || '',
    utiStatus: '',
    recsVerdict: '',
    medicationChange: '',
    medicationStarted: '',
    medicationStopped: [],
    safetyConcern: '',
    notes: '',
  };
}

// Feeds what actually changed back into a copy of the person's raw health
// intake (the same shape IntakeScreen.jsx's buildSnapshot produces), then
// re-runs it through the same mapper intake itself uses — so
// MobileApp.jsx's existing onComplete handler (reseed the ecosystem, save,
// show the building screen) treats a check-in exactly like a retaken quiz,
// with no separate recalculation path to keep in sync.
function applyCheckinToIntake(fullHealthIntake, answers) {
  const base = { ...(fullHealthIntake || {}) };
  const mappedSymptoms = answers.symptoms.map((label) => CHECKIN_TO_INTAKE[label]).filter(Boolean);
  // Keep any intake selections this check-in's taxonomy doesn't cover
  // (allergy-driven avoidances, etc.) — only replace the subset it can
  // actually re-ask about.
  const untouched = (base.supportSelections || []).filter((label) => !Object.values(CHECKIN_TO_INTAKE).includes(label));
  base.supportSelections = [...new Set([...untouched, ...mappedSymptoms])];
  if (answers.flow) base.periodFlow = answers.flow;
  if (answers.pain) base.periodPain = answers.pain;
  if (answers.medicationChange === 'started' && answers.medicationStarted.trim()) {
    base.currentMedicationItems = [...(base.currentMedicationItems || []), answers.medicationStarted.trim()];
    base.takesCurrent = 'Yes';
  }
  if (answers.medicationChange === 'stopped' && answers.medicationStopped.length) {
    base.currentMedicationItems = (base.currentMedicationItems || []).filter((item) => !answers.medicationStopped.includes(item));
  }
  if (answers.safetyConcern) base.safetyConcern = answers.safetyConcern;
  return base;
}

export default function MonthlyCheckinScreen({ onBack, onComplete, lastQuizAnswers, myProducts = [] }) {
  const [status, setStatus] = useState('loading'); // loading | ready | already-done | error
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState(null);
  const [lifeStageEditSelections, setLifeStageEditSelections] = useState(lastQuizAnswers?.fullHealthIntake?.lifeStageSelections || []);
  const [complete, setComplete] = useState(false);
  const [saving, setSaving] = useState(false);

  const fullHealthIntake = lastQuizAnswers?.fullHealthIntake || null;
  const thisMonth = monthKey();

  useEffect(() => {
    let active = true;
    loadMonthlyCheckinStatus().then(({ thisMonthCheckin, lastCheckin: prior }) => {
      if (!active) return;
      if (thisMonthCheckin) {
        setStatus('already-done');
        return;
      }
      setAnswers(buildInitialAnswers(prior?.answers, fullHealthIntake));
      setStatus('ready');
    }).catch(() => {
      if (!active) return;
      setAnswers(buildInitialAnswers(null, fullHealthIntake));
      setStatus('ready');
    });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (key, value) => setAnswers((prev) => ({ ...prev, [key]: value }));
  const toggleSymptom = (label) => setAnswers((prev) => ({
    ...prev,
    symptoms: prev.symptoms.includes(label) ? prev.symptoms.filter((s) => s !== label) : [...prev.symptoms, label],
  }));

  const periodRelevant = answers ? answers.symptoms.some((s) => PERIOD_SYMPTOM_LABELS.has(s)) : false;
  const utiRelevant = answers ? answers.symptoms.includes('Recurrent UTIs') : false;
  // Reminds the person what's actually on file instead of asking them to
  // recall it cold — the single highest-value context this step can show,
  // since "has anything changed" is meaningless without knowing what
  // "unchanged" currently means for them.
  const currentLifeStageOnFile = Array.isArray(fullHealthIntake?.lifeStageSelections) && fullHealthIntake.lifeStageSelections.length
    ? fullHealthIntake.lifeStageSelections.join(', ')
    : fullHealthIntake?.lifeStage || '';

  const steps = useMemo(() => {
    const list = ['lifeStage', 'symptoms'];
    if (periodRelevant) list.push('flow', 'pain');
    if (utiRelevant) list.push('uti');
    list.push('recs', 'medications', 'safety', 'notes');
    return list;
  }, [periodRelevant, utiRelevant]);

  const stepId = steps[Math.min(stepIndex, steps.length - 1)];
  const isLast = stepIndex >= steps.length - 1;

  const readyForNext = (() => {
    if (!answers) return false;
    if (stepId === 'safety') return !!answers.safetyConcern;
    return true;
  })();

  const goNext = async () => {
    if (!readyForNext) return;
    if (!isLast) {
      setStepIndex((i) => i + 1);
      return;
    }
    setSaving(true);
    const finalAnswers = {
      ...answers,
      month: thisMonth,
      lifeStageSelections: answers.lifeStageChanged === 'changed' ? lifeStageEditSelections : undefined,
      recsProductIds: answers.recsVerdict && answers.recsVerdict !== 'na' ? myProducts.map((p) => p.id).filter(Boolean) : [],
    };
    await saveMonthlyCheckin(finalAnswers);
    const updatedIntake = applyCheckinToIntake(fullHealthIntake, {
      ...answers,
      lifeStageSelections: answers.lifeStageChanged === 'changed' ? lifeStageEditSelections : fullHealthIntake?.lifeStageSelections || [],
    });
    if (answers.lifeStageChanged === 'changed') {
      updatedIntake.lifeStageSelections = lifeStageEditSelections;
      updatedIntake.lifeStage = lifeStageEditSelections[0] || '';
    }
    setSaving(false);
    setComplete(true);
    // Small delay so the completion state is visible before the ecosystem
    // rebuild takes over the screen — matches the deliberate pause the
    // intake quiz's own reveal step already has.
    setTimeout(() => onComplete(mapIntakeToLegacyQuizProfile(updatedIntake)), 900);
  };

  const goBack = () => {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
    else onBack();
  };

  if (status === 'loading') {
    return (
      <div className="ayna-play-intake ip-tone--peri" role="status" aria-label="Loading check-in">
        <div className="ip-loading"><span className="ay-skeleton" /><span className="ay-skeleton" /><span className="ay-skeleton" /></div>
      </div>
    );
  }

  if (status === 'already-done') {
    return (
      <div className="ayna-play-intake ip-tone--mint">
        <Header onBack={onBack} label="Check-in" progress={1} />
        <div className="ip-body"><CompletionCard month={thisMonth} /></div>
        <footer className="ip-foot"><button type="button" className="ip-next" onClick={onBack}><span>Back to profile</span><i aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg></i></button></footer>
      </div>
    );
  }

  if (complete) {
    return (
      <div className="ayna-play-intake ip-tone--mint">
        <Header onBack={onBack} label="Check-in" progress={1} />
        <div className="ip-body"><CompletionCard month={thisMonth} justFinished /></div>
      </div>
    );
  }

  if (!answers) return null;

  const footer = (
    <footer className="ip-foot">
      <button type="button" className="ip-next" disabled={!readyForNext || saving} onClick={goNext}>
        <span>{saving ? 'Saving…' : isLast ? 'Finish check-in' : 'Next'}</span>
        <i aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg></i>
      </button>
      {stepId !== 'safety' && (
        <button type="button" className="ip-skip ip-skip--foot" disabled={saving} onClick={() => (isLast ? goNext() : setStepIndex((i) => i + 1))}>Skip this step</button>
      )}
    </footer>
  );

  return (
    <div className={`ayna-play-intake ip-tone--${CHECKIN_TONES[stepId] || 'peri'}`} data-step={stepId}>
      <Header onBack={goBack} label="Monthly check-in" progress={(stepIndex + 1) / steps.length} stepText={`${stepIndex + 1}/${steps.length}`} />

      {stepId === 'lifeStage' && (
        <StepShell stepKey={stepId} title="Anything changed?" footer={footer}>
          {LIFE_STAGE_OPTIONS.map(([value, label]) => (
            <OptionCard
              key={value}
              selected={answers.lifeStageChanged === value}
              title={label}
              subtitle={value === 'same' ? (currentLifeStageOnFile ? `${currentLifeStageOnFile} · on file` : undefined) : undefined}
              onClick={() => set('lifeStageChanged', value)}
            />
          ))}
          {answers.lifeStageChanged === 'changed' && (
            <div className="ip-followup">
              <strong>What fits you now?</strong>
              <ChipList compact items={['I get periods regularly', 'My periods are irregular', 'I am trying to conceive', 'I am pregnant', 'I am postpartum', 'I am in perimenopause', 'I am in menopause']} selected={lifeStageEditSelections}
                onToggle={(v) => setLifeStageEditSelections((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]))} />
            </div>
          )}
        </StepShell>
      )}

      {stepId === 'symptoms' && (
        <StepShell stepKey={stepId} title="What needs support?" subtitle="Your last answers are selected." footer={footer}>
          <GroupedSymptomPicker selected={answers.symptoms} onToggle={toggleSymptom} onClearAll={() => set('symptoms', [])} />
        </StepShell>
      )}

      {stepId === 'flow' && (
        <StepShell stepKey={stepId} tag="Shown because · a period symptom" title="How was your flow this month?" subtitle={fullHealthIntake?.periodFlow ? `Last time you said ${fullHealthIntake.periodFlow.toLowerCase()}.` : undefined} footer={footer}>
          <ScaleSelector options={FLOW_OPTIONS} value={answers.flow} onChange={(v) => set('flow', v)} />
        </StepShell>
      )}

      {stepId === 'pain' && (
        <StepShell stepKey={stepId} tag="Shown because · cramps" title="How was your pain this month?" subtitle={fullHealthIntake?.periodPain ? `Last time you said ${fullHealthIntake.periodPain.toLowerCase()}.` : undefined} footer={footer}>
          <ScaleSelector options={PAIN_OPTIONS} value={answers.pain} onChange={(v) => set('pain', v)} />
        </StepShell>
      )}

      {stepId === 'uti' && (
        <StepShell stepKey={stepId} tag="Shown because · recurrent UTIs" title="Any UTI, BV, or yeast symptoms this month?" footer={footer}>
          {UTI_OPTIONS.map(([value, label]) => (
            <OptionCard key={value} selected={answers.utiStatus === value} title={label} onClick={() => set('utiStatus', value)} />
          ))}
        </StepShell>
      )}

      {stepId === 'recs' && (
        <StepShell stepKey={stepId} title="How were your product picks?" footer={footer}>
          {myProducts.length > 0 && (
            <div className="ip-onfile"><b>{myProducts.length}</b><span><small>In your ecosystem</small>{myProducts.slice(0, 3).map((p) => p.name).join(' · ')}</span></div>
          )}
          {RECS_OPTIONS.map(([value, label, sub]) => (
            <OptionCard key={value} selected={answers.recsVerdict === value} title={label} subtitle={sub} icon={<RecsIcon value={value} />} onClick={() => set('recsVerdict', value)} />
          ))}
        </StepShell>
      )}

      {stepId === 'medications' && (
        <StepShell stepKey={stepId} title="Any changes to what you're taking?" footer={footer}>
          {fullHealthIntake?.currentMedicationItems?.length > 0 && (
            <div className="ip-onfile"><span><small>On file</small>{fullHealthIntake.currentMedicationItems.join(' · ')}</span></div>
          )}
          {MEDICATION_OPTIONS.map(([value, label, sub]) => (
            <OptionCard key={value} selected={answers.medicationChange === value} title={label} subtitle={sub} onClick={() => set('medicationChange', value)} />
          ))}
          {answers.medicationChange === 'started' && (
            <input
              value={answers.medicationStarted}
              onChange={(e) => set('medicationStarted', e.target.value)}
              placeholder="What did you start?" aria-label="Medication started"
              className="ip-input"
            />
          )}
          {answers.medicationChange === 'stopped' && fullHealthIntake?.currentMedicationItems?.length > 0 && (
            <div className="ip-gap"><ChipList items={fullHealthIntake.currentMedicationItems} selected={answers.medicationStopped}
              onToggle={(item) => set('medicationStopped', answers.medicationStopped.includes(item) ? answers.medicationStopped.filter((x) => x !== item) : [...answers.medicationStopped, item])} /></div>
          )}
        </StepShell>
      )}

      {stepId === 'safety' && (
        <StepShell stepKey={stepId} title="Any new, worsening or significant symptoms right now?" footer={footer}>
          {SAFETY_OPTIONS.map((label) => (
            <OptionCard key={label} selected={answers.safetyConcern === label} title={label} tone={label === 'Yes' ? 'warning' : undefined} onClick={() => set('safetyConcern', label)} />
          ))}
          {answers.safetyConcern === 'Yes' && (
            <div className="ip-alert" role="note">
              <strong><span aria-hidden="true">!</span>Please talk to a clinician</strong>
              <p>ayna is a discovery tool, not a diagnosis. For anything new or getting worse, get seen.</p>
              <a className="ip-alert-link" href="https://www.google.com/maps/search/?api=1&query=urgent+care+near+me" target="_blank" rel="noreferrer">Find urgent care near me</a>
            </div>
          )}
        </StepShell>
      )}

      {stepId === 'notes' && (
        <StepShell stepKey={stepId} title="Anything else?" subtitle="Optional" footer={footer}>
          <textarea
            value={answers.notes}
            onChange={(e) => set('notes', e.target.value.slice(0, 600))}
            placeholder="Your notes" aria-label="Additional check-in notes"
            rows={5}
            className="ip-note"
          />
          <div className="ip-counter">{answers.notes.length} / 600</div>
        </StepShell>
      )}
    </div>
  );
}

function Header({ onBack, label, progress, stepText }) {
  const total = stepText ? Number(stepText.split('/')[1]) : 1;
  const current = stepText ? Number(stepText.split('/')[0]) : 1;
  return (
    <header className="ip-head">
      <div className="ip-head-row">
        <button type="button" className="ip-round" aria-label="Back from check-in" onClick={onBack}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
        </button>
        <span className="ip-count">{stepText ? <>{String(current).padStart(2, '0')}<i>/{String(total).padStart(2, '0')}</i></> : label}</span>
        <span className="ip-skip-spacer" />
      </div>
      <div className="ip-progress" aria-label={`${label}${stepText ? `, step ${stepText}` : ''}`}>
        {Array.from({ length: total }, (_, i) => <span key={i} className={progress >= 1 || i < current - 1 ? 'is-done' : i === current - 1 ? 'is-now' : ''} />)}
      </div>
    </header>
  );
}

function CompletionCard({ month, justFinished }) {
  return (
    <div className="ip-done">
      <div className="ip-done-stamp" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg></div>
      <h1 className="ip-title">{justFinished ? `${monthLabel(month)}, logged.` : `${monthLabel(month)} is done.`}</h1>
      <p className="ip-subtitle">{justFinished ? 'Your matches update overnight.' : 'See you next month.'}</p>
    </div>
  );
}
