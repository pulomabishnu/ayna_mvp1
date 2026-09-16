import { useEffect, useMemo, useState } from 'react';
import { mapIntakeToLegacyQuizProfile } from '../../utils/healthIntake.js';
import { loadMonthlyCheckinStatus, saveMonthlyCheckin, monthKey } from '../../utils/monthlyCheckinStore.js';

// Same visual language as IntakeScreen.jsx's own local constants, but this
// screen is a light card UI (Ayna_Monthly_Check-in.html design reference),
// not intake's dark hero-gradient — a recurring quick re-ask reads as
// "maintenance," not a first-time onboarding moment.
const CARD_BG = 'var(--ayna-surface)';
const PAGE_BG = 'var(--ayna-bg)';
const ROW_BORDER = 'var(--ayna-border)';
const PANEL_BG = 'var(--ayna-chip-bg)';
const INK = 'var(--ayna-text)';
const MUTED = 'var(--ayna-text-faint)';
const BODY_TEXT = 'var(--ayna-text-muted)';
const NAVY = 'var(--ayna-navy)';
const ACCENT_BG = 'var(--ayna-peach)';
const ACCENT_BORDER = 'var(--ayna-accent-dark)';
const WARNING_BORDER = '#B4402A';
const WARNING_BG = '#FAEDE8';

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

const FLOW_OPTIONS = ['Spotting', 'Light', 'Moderate', 'Heavy', 'Very heavy'];
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
  ['changed', 'Yes, my cycle or life stage changed'],
  ['not_sure', 'Not sure'],
];

function monthLabel(key) {
  const d = new Date(`${key}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}
function shortMonthLabel(key) {
  const d = new Date(`${key}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: 'long' });
}

function OptionCard({ selected, title, subtitle, onClick, tone }) {
  const isWarning = tone === 'warning' && selected;
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '14px 16px',
        borderRadius: 16,
        border: '1.5px solid ' + (selected ? (isWarning ? WARNING_BORDER : ACCENT_BORDER) : ROW_BORDER),
        background: selected ? (isWarning ? WARNING_BG : ACCENT_BG) : CARD_BG,
        cursor: 'pointer',
        marginBottom: 10,
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: 99,
          border: '2px solid ' + (selected ? (isWarning ? WARNING_BORDER : ACCENT_BORDER) : ROW_BORDER),
          background: selected ? (isWarning ? WARNING_BORDER : ACCENT_BORDER) : 'transparent',
          flex: 'none',
          marginTop: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selected && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FFFCF9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 'calc(14px * var(--ayna-text-scale, 1))', color: INK }}>{title}</div>
        {subtitle && <div style={{ fontFamily: 'Inter,system-ui,sans-serif', fontSize: 'calc(12px * var(--ayna-text-scale, 1))', color: BODY_TEXT, marginTop: 3 }}>{subtitle}</div>}
      </div>
    </div>
  );
}

function GroupedSymptomPicker({ selected, onToggle, onClearAll }) {
  return (
    <div>
      <div
        onClick={onClearAll}
        style={{
          display: 'inline-block',
          padding: '8px 14px',
          borderRadius: 99,
          border: '1.5px solid ' + (selected.length === 0 ? ACCENT_BORDER : ROW_BORDER),
          background: selected.length === 0 ? ACCENT_BG : CARD_BG,
          color: INK,
          fontFamily: "'DM Sans',sans-serif",
          fontWeight: 600,
          fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))',
          cursor: 'pointer',
          marginBottom: 18,
        }}
      >
        None right now
      </div>
      {SYMPTOM_GROUPS.map((group) => (
        <div key={group.label} style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9.5px * var(--ayna-text-scale, 1))', letterSpacing: '1.2px', textTransform: 'uppercase', color: MUTED, marginBottom: 9 }}>{group.label}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {group.items.map(([label]) => {
              const on = selected.includes(label);
              return (
                <div
                  key={label}
                  onClick={() => onToggle(label)}
                  style={{
                    padding: '9px 14px',
                    borderRadius: 99,
                    border: '1.5px solid ' + (on ? ACCENT_BORDER : ROW_BORDER),
                    background: on ? ACCENT_BG : CARD_BG,
                    color: INK,
                    fontFamily: "'DM Sans',sans-serif",
                    fontWeight: 500,
                    fontSize: 'calc(13px * var(--ayna-text-scale, 1))',
                    cursor: 'pointer',
                  }}
                >
                  {label}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function StepShell({ title, subtitle, tag, children, footer }) {
  return (
    <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, minWidth: 0, minHeight: 0, overflowY: 'auto', padding: '4px 20px 20px' }}>
        {tag && (
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9.5px * var(--ayna-text-scale, 1))', letterSpacing: '1.2px', textTransform: 'uppercase', color: ACCENT_BORDER, marginBottom: 8 }}>{tag}</div>
        )}
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 'calc(23px * var(--ayna-text-scale, 1))', lineHeight: 1.2, color: INK }}>{title}</div>
        {subtitle && <div style={{ fontFamily: 'Inter,system-ui,sans-serif', fontSize: 'calc(13px * var(--ayna-text-scale, 1))', lineHeight: 1.5, color: BODY_TEXT, marginTop: 8, marginBottom: 20 }}>{subtitle}</div>}
        {!subtitle && <div style={{ height: 18 }} />}
        {children}
      </div>
      {footer}
    </div>
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
  const [lastCheckin, setLastCheckin] = useState(null);
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
        setLastCheckin(thisMonthCheckin);
        return;
      }
      setLastCheckin(prior);
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
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: PAGE_BG }}>
        <div style={{ fontFamily: 'Inter,system-ui,sans-serif', fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: MUTED }}>Loading…</div>
      </div>
    );
  }

  if (status === 'already-done') {
    return (
      <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', background: PAGE_BG }}>
        <Header onBack={onBack} label="Check-in" progress={1} />
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 20px 30px' }}>
          <CompletionCard month={thisMonth} />
          <div
            onClick={onBack}
            style={{ marginTop: 20, textAlign: 'center', padding: 15, borderRadius: 99, background: NAVY, color: '#FFFCF9', fontWeight: 600, fontFamily: "'DM Sans',sans-serif", cursor: 'pointer' }}
          >
            Back to profile
          </div>
        </div>
      </div>
    );
  }

  if (complete) {
    return (
      <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', background: PAGE_BG }}>
        <Header onBack={onBack} label="Check-in" progress={1} />
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 20px 30px' }}>
          <CompletionCard month={thisMonth} justFinished />
        </div>
      </div>
    );
  }

  if (!answers) return null;

  const footer = (
    <div style={{ flex: 'none', padding: '12px 20px max(16px, env(safe-area-inset-bottom))', background: PAGE_BG, borderTop: '1px solid ' + ROW_BORDER }}>
      <div
        onClick={saving ? undefined : goNext}
        style={{
          textAlign: 'center',
          padding: 15,
          borderRadius: 99,
          background: readyForNext && !saving ? NAVY : ROW_BORDER,
          color: readyForNext && !saving ? '#FFFCF9' : MUTED,
          fontWeight: 600,
          fontFamily: "'DM Sans',sans-serif",
          fontSize: 'calc(14.5px * var(--ayna-text-scale, 1))',
          cursor: readyForNext && !saving ? 'pointer' : 'not-allowed',
        }}
      >
        {saving ? 'Saving…' : isLast ? 'Finish check-in' : 'Next'}
      </div>
      {stepId !== 'safety' && (
        <div
          onClick={() => (isLast ? goNext() : setStepIndex((i) => i + 1))}
          style={{ textAlign: 'center', marginTop: 10, fontFamily: "'DM Sans',sans-serif", fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: MUTED, cursor: 'pointer' }}
        >
          Skip this step
        </div>
      )}
    </div>
  );

  return (
    <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', background: PAGE_BG }}>
      <Header onBack={goBack} label="Monthly check-in" progress={(stepIndex + 1) / steps.length} stepText={`${stepIndex + 1}/${steps.length}`} />

      {stepId === 'lifeStage' && (
        <StepShell title={`Has anything changed since ${lastCheckin ? shortMonthLabel(lastCheckin.check_in_month) : 'your intake'}?`} subtitle="We only ask again when something big shifts — starting to try, a pregnancy, postpartum, perimenopause." footer={footer}>
          {LIFE_STAGE_OPTIONS.map(([value, label]) => (
            <OptionCard key={value} selected={answers.lifeStageChanged === value} title={label} onClick={() => set('lifeStageChanged', value)} />
          ))}
          {answers.lifeStageChanged === 'changed' && (
            <div style={{ marginTop: 10, padding: 14, borderRadius: 16, background: PANEL_BG, border: '1px solid ' + ROW_BORDER }}>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: INK, marginBottom: 10 }}>What best describes you now?</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {['I get periods regularly', 'My periods are irregular', 'I am trying to conceive', 'I am pregnant', 'I am postpartum', 'I am in perimenopause', 'I am in menopause'].map((v) => {
                  const on = lifeStageEditSelections.includes(v);
                  return (
                    <div
                      key={v}
                      onClick={() => setLifeStageEditSelections((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]))}
                      style={{ padding: '8px 13px', borderRadius: 99, border: '1.5px solid ' + (on ? ACCENT_BORDER : ROW_BORDER), background: on ? ACCENT_BG : CARD_BG, fontFamily: "'DM Sans',sans-serif", fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', cursor: 'pointer' }}
                    >
                      {v}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </StepShell>
      )}

      {stepId === 'symptoms' && (
        <StepShell title="What are you dealing with this month?" subtitle="Carried over from last time — edit what's changed rather than starting over." footer={footer}>
          <GroupedSymptomPicker selected={answers.symptoms} onToggle={toggleSymptom} onClearAll={() => set('symptoms', [])} />
        </StepShell>
      )}

      {stepId === 'flow' && (
        <StepShell tag="Shown because · a period symptom" title="How was your flow this month?" subtitle={fullHealthIntake?.periodFlow ? `Last time you said ${fullHealthIntake.periodFlow.toLowerCase()}.` : undefined} footer={footer}>
          {FLOW_OPTIONS.map((label) => (
            <OptionCard key={label} selected={answers.flow === label} title={label} onClick={() => set('flow', label)} />
          ))}
        </StepShell>
      )}

      {stepId === 'pain' && (
        <StepShell tag="Shown because · cramps" title="How was your pain this month?" subtitle={fullHealthIntake?.periodPain ? `Last time you said ${fullHealthIntake.periodPain.toLowerCase()}.` : undefined} footer={footer}>
          {PAIN_OPTIONS.map(([label, sub]) => (
            <OptionCard key={label} selected={answers.pain === label} title={label} subtitle={sub} onClick={() => set('pain', label)} />
          ))}
        </StepShell>
      )}

      {stepId === 'uti' && (
        <StepShell tag="Shown because · recurrent UTIs" title="Any UTI, BV, or yeast symptoms this month?" subtitle="More useful than a lifetime frequency — we want to know if last month's suggestion actually worked." footer={footer}>
          {UTI_OPTIONS.map(([value, label]) => (
            <OptionCard key={value} selected={answers.utiStatus === value} title={label} onClick={() => set('utiStatus', value)} />
          ))}
        </StepShell>
      )}

      {stepId === 'recs' && (
        <StepShell title="How did last month's suggestions work out?" subtitle="This is the answer that changes your matches the most — worth the ten seconds." footer={footer}>
          {myProducts.length > 0 && (
            <div style={{ padding: '12px 14px', borderRadius: 14, background: PANEL_BG, border: '1px solid ' + ROW_BORDER, marginBottom: 16 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9px * var(--ayna-text-scale, 1))', letterSpacing: '1px', textTransform: 'uppercase', color: MUTED, marginBottom: 6 }}>In your ecosystem</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: INK }}>{myProducts.slice(0, 3).map((p) => p.name).join(' · ')}</div>
            </div>
          )}
          {RECS_OPTIONS.map(([value, label, sub]) => (
            <OptionCard key={value} selected={answers.recsVerdict === value} title={label} subtitle={sub} onClick={() => set('recsVerdict', value)} />
          ))}
        </StepShell>
      )}

      {stepId === 'medications' && (
        <StepShell title="Any changes to what you're taking?" subtitle="Interactions are the one thing we can't guess at." footer={footer}>
          {fullHealthIntake?.currentMedicationItems?.length > 0 && (
            <div style={{ padding: '12px 14px', borderRadius: 14, background: PANEL_BG, border: '1px solid ' + ROW_BORDER, marginBottom: 16 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9px * var(--ayna-text-scale, 1))', letterSpacing: '1px', textTransform: 'uppercase', color: MUTED, marginBottom: 6 }}>On file</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: INK }}>{fullHealthIntake.currentMedicationItems.join(' · ')}</div>
            </div>
          )}
          {MEDICATION_OPTIONS.map(([value, label, sub]) => (
            <OptionCard key={value} selected={answers.medicationChange === value} title={label} subtitle={sub} onClick={() => set('medicationChange', value)} />
          ))}
          {answers.medicationChange === 'started' && (
            <input
              value={answers.medicationStarted}
              onChange={(e) => set('medicationStarted', e.target.value)}
              placeholder="What did you start?"
              style={{ width: '100%', boxSizing: 'border-box', padding: '13px 16px', borderRadius: 14, border: '1.5px solid ' + ROW_BORDER, fontSize: 'max(16px, calc(14px * var(--ayna-text-scale, 1)))', color: INK, background: CARD_BG, outline: 'none', marginTop: 4 }}
            />
          )}
          {answers.medicationChange === 'stopped' && fullHealthIntake?.currentMedicationItems?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 4 }}>
              {fullHealthIntake.currentMedicationItems.map((item) => {
                const on = answers.medicationStopped.includes(item);
                return (
                  <div
                    key={item}
                    onClick={() => set('medicationStopped', on ? answers.medicationStopped.filter((x) => x !== item) : [...answers.medicationStopped, item])}
                    style={{ padding: '9px 14px', borderRadius: 99, border: '1.5px solid ' + (on ? ACCENT_BORDER : ROW_BORDER), background: on ? ACCENT_BG : CARD_BG, fontFamily: "'DM Sans',sans-serif", fontSize: 'calc(13px * var(--ayna-text-scale, 1))', cursor: 'pointer' }}
                  >
                    {item}
                  </div>
                );
              })}
            </div>
          )}
        </StepShell>
      )}

      {stepId === 'safety' && (
        <StepShell title="Any new, worsening or significant symptoms right now?" subtitle="One question, every month, for the things that shouldn't wait." footer={footer}>
          {SAFETY_OPTIONS.map((label) => (
            <OptionCard key={label} selected={answers.safetyConcern === label} title={label} tone={label === 'Yes' ? 'warning' : undefined} onClick={() => set('safetyConcern', label)} />
          ))}
        </StepShell>
      )}

      {stepId === 'notes' && (
        <StepShell title="Anything else going on this month?" subtitle="Optional. Skip it freely — but if something didn't fit our lists, this is where it lands." footer={footer}>
          <textarea
            value={answers.notes}
            onChange={(e) => set('notes', e.target.value.slice(0, 600))}
            placeholder="A person reads these."
            rows={5}
            style={{ width: '100%', boxSizing: 'border-box', padding: 16, borderRadius: 18, border: '1.5px solid ' + ROW_BORDER, fontSize: 'max(16px, calc(14px * var(--ayna-text-scale, 1)))', color: INK, background: CARD_BG, outline: 'none', resize: 'vertical', minHeight: 120, fontFamily: 'inherit' }}
          />
          <div style={{ textAlign: 'right', fontFamily: "'DM Mono',monospace", fontSize: 'calc(10px * var(--ayna-text-scale, 1))', color: MUTED, marginTop: 6 }}>{answers.notes.length} / 600</div>
        </StepShell>
      )}
    </div>
  );
}

function Header({ onBack, label, progress, stepText }) {
  return (
    <div style={{ flex: 'none', padding: 'max(16px, env(safe-area-inset-top)) 20px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div onClick={onBack} style={{ width: 30, height: 30, borderRadius: 99, border: '1.5px solid ' + ROW_BORDER, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flex: 'none' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9px * var(--ayna-text-scale, 1))', letterSpacing: '1.3px', textTransform: 'uppercase', color: MUTED }}>{label}</div>
        </div>
        {stepText && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(10px * var(--ayna-text-scale, 1))', color: MUTED }}>{stepText}</div>}
      </div>
      <div style={{ height: 4, borderRadius: 99, background: ROW_BORDER, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.round(progress * 100)}%`, background: ACCENT_BORDER, transition: 'width .25s ease' }} />
      </div>
    </div>
  );
}

function CompletionCard({ month, justFinished }) {
  return (
    <div style={{ background: CARD_BG, border: '1px solid ' + ROW_BORDER, borderRadius: 22, padding: 22, textAlign: 'center' }}>
      <div style={{ width: 48, height: 48, borderRadius: 99, background: ACCENT_BG, border: '1px solid ' + ACCENT_BORDER, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={ACCENT_BORDER} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
      </div>
      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 'calc(20px * var(--ayna-text-scale, 1))', color: INK }}>
        {justFinished ? `That's ${monthLabel(month)} logged.` : `${monthLabel(month)} is already logged.`}
      </div>
      <div style={{ fontFamily: 'Inter,system-ui,sans-serif', fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: BODY_TEXT, marginTop: 8 }}>
        {justFinished ? 'Your matches update overnight.' : 'Come back next month for your next check-in.'}
      </div>
    </div>
  );
}
