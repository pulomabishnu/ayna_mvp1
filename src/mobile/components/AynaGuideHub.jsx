import ProFeatureGate from '../../components/ProFeatureGate.jsx';
import { useState } from 'react';
import { addMemory, appointmentSummary, completeTrial, removeMemory, removeTrial, startTrial, trialResult } from '../utils/aynaGuide.js';
import './ayna-guide.css';
import { localToday } from '../../utils/localDate.js';

const scoreOptions = [1, 2, 3, 4, 5];

function Score({ value, onChange, label }) {
  return <label className="ay-guide-field">{label}<select value={value} onChange={(e) => onChange(Number(e.target.value))}>
    {scoreOptions.map((n) => <option key={n} value={n}>{n} / 5</option>)}
  </select></label>;
}

function AynaGuideContent({ page, guide, onChange, recap, recapSources = '', recapExportable = true, productNotes = [], profile, onAsk, onBack }) {
  const [memory, setMemory] = useState('');
  const [action, setAction] = useState('');
  const [goal, setGoal] = useState('');
  const [baseline, setBaseline] = useState(3);
  const [followUpDays, setFollowUpDays] = useState(7);
  const [followUps, setFollowUps] = useState({});
  const [includeRecap, setIncludeRecap] = useState(false);
  const [includeProfile, setIncludeProfile] = useState(false);
  const [includeProductNotes, setIncludeProductNotes] = useState(false);
  const [copied, setCopied] = useState(false);
  const report = appointmentSummary({ guide, recap, profile: includeProfile ? profile : '', productNotes: includeProductNotes ? productNotes : [], includeRecap: recapExportable && includeRecap });
  const title = { recap: 'Your week', memory: 'What ayna remembers', trial: 'Try & check back', report: 'Appointment note' }[page];
  const today = localToday();
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  const periodLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  const dueTrials = guide.trials.filter((trial) => !trial.followUp && trial.due <= today);
  const saveTrial = (event) => {
    event.preventDefault();
    const next = startTrial(guide, { action, goal, baseline, followUpDays });
    if (next !== guide) { onChange(next); setAction(''); setGoal(''); }
  };
  const copyReport = async () => {
    try { await navigator.clipboard.writeText(report); setCopied(true); } catch { setCopied(false); }
  };
  const downloadReport = () => {
    const url = URL.createObjectURL(new Blob([report], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = `ayna-appointment-${today}.txt`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <section className="ay-guide" aria-label={title}>
    <button type="button" className="ay-guide-back" onClick={onBack}>← Ask ayna</button>
    <h2>{title}</h2>
    {page === 'recap' && <>
      <p className="ay-guide-muted">{periodLabel} · Your recent readings, compared with your own usual where there is enough data.</p>
      <div className="ay-guide-card"><p>{recap || 'Connect health data or start a check-back to build your personal recap.'}</p></div>
      {recapSources && <p className="ay-guide-muted">From: {recapSources}. Review the full charts on Home.</p>}
      {dueTrials.length > 0 && <p className="ay-guide-muted">{dueTrials.length} check-back{dueTrials.length === 1 ? ' is' : 's are'} ready. Open “Try & check back” to record how you feel.</p>}
      <p className="ay-guide-muted">An observation can help you decide what to track next. It cannot identify a cause or diagnose a condition.</p>
      {onAsk && <button type="button" className="ay-guide-primary" onClick={() => onAsk('What stands out in my week?')}>Ask ayna about my week</button>}
    </>}
    {page === 'memory' && <>
      <p className="ay-guide-muted">Add only what you want ayna to remember. These notes stay on this device. You can remove them at any time.</p>
      <form onSubmit={(event) => { event.preventDefault(); const next = addMemory(guide, memory); if (next !== guide) { onChange(next); setMemory(''); } }} className="ay-guide-form">
        <label className="ay-guide-field">What should ayna remember?<input value={memory} onChange={(event) => setMemory(event.target.value)} maxLength={180} placeholder="e.g. I want to understand my cramps" /></label>
        <button type="submit" disabled={!memory.trim()}>Save note</button>
      </form>
      {guide.memories.length ? <ul className="ay-guide-list">{guide.memories.map((item) => <li key={item.id}><span>{item.text}<small>Added {item.added}</small></span><button type="button" onClick={() => onChange(removeMemory(guide, item.id))} aria-label={`Remove ${item.text}`}>Remove</button></li>)}</ul> : <p className="ay-guide-empty">Nothing saved yet.</p>}
      <label className="ay-guide-toggle"><input type="checkbox" checked={guide.shareWithAsk} onChange={(event) => onChange({ ...guide, shareWithAsk: event.target.checked })} /><span>Use my saved notes and check-backs in Ask ayna answers</span></label>
      <p className="ay-guide-muted">If switched on, your eight most recent notes and five most recent check-backs may be sent with a question. Switching it off stops future sharing.</p>
    </>}
    {page === 'trial' && <>
      <p className="ay-guide-muted">Choose one small action or product to try. Rate how your goal feels now; check back in 7 or 14 days. A change in rating does not prove what caused it.</p>
      <form className="ay-guide-form" onSubmit={saveTrial}>
        <label className="ay-guide-field">What will you try?<input value={action} onChange={(event) => setAction(event.target.value)} maxLength={90} placeholder="e.g. Earlier bedtime" required /></label>
        <label className="ay-guide-field">What do you hope improves?<input value={goal} onChange={(event) => setGoal(event.target.value)} maxLength={90} placeholder="e.g. Morning energy" required /></label>
        <Score value={baseline} onChange={setBaseline} label="How is that feeling now? 1 = hard, 5 = good" />
        <label className="ay-guide-field">Check back after<select value={followUpDays} onChange={(event) => setFollowUpDays(Number(event.target.value))}><option value={7}>7 days</option><option value={14}>14 days</option></select></label>
        <button type="submit">Start check-back</button>
      </form>
      {guide.trials.length > 0 && <ul className="ay-guide-trials">{guide.trials.slice().reverse().map((trial) => {
        const fields = followUps[trial.id] || { score: 3, note: '' };
        return <li key={trial.id} className="ay-guide-card"><div className="ay-guide-trialhead"><strong>{trial.action}</strong><button type="button" onClick={() => onChange(removeTrial(guide, trial.id))} aria-label={`Remove ${trial.action}`}>Remove</button></div><p>Goal: {trial.goal} · Started {trial.started} · {trial.baseline}/5 at start</p>
          {trial.followUp ? <p>{trialResult(trial)} {trial.followUp.note && <span>“{trial.followUp.note}”</span>}</p> : <><p>{trial.due <= today ? 'Ready for your check-back' : `Check back around ${trial.due}`}</p><Score value={fields.score} onChange={(score) => setFollowUps((all) => ({ ...all, [trial.id]: { ...fields, score } }))} label="How is that feeling now?" /><label className="ay-guide-field">Optional note<input value={fields.note} onChange={(event) => setFollowUps((all) => ({ ...all, [trial.id]: { ...fields, note: event.target.value } }))} maxLength={180} placeholder="What else changed?" /></label><button type="button" onClick={() => onChange(completeTrial(guide, trial.id, fields.score, fields.note))}>Save check-back</button></>}
        </li>;
      })}</ul>}
    </>}
    {page === 'report' && <>
      <p className="ay-guide-muted">Review this before sharing it with a clinician. Choose which other details to include.</p>
      {profile && <label className="ay-guide-toggle"><input type="checkbox" checked={includeProfile} onChange={(event) => setIncludeProfile(event.target.checked)} /><span>Include my stated goals and preferences</span></label>}
      {productNotes.length > 0 && <label className="ay-guide-toggle"><input type="checkbox" checked={includeProductNotes} onChange={(event) => setIncludeProductNotes(event.target.checked)} /><span>Include my product check-ins</span></label>}
      {recapExportable ? <label className="ay-guide-toggle"><input type="checkbox" checked={includeRecap} onChange={(event) => setIncludeRecap(event.target.checked)} /><span>Include this week's app observation</span></label> : <p className="ay-guide-muted">This week's observation includes live device data, so it stays in the app and is not added to a downloaded note.</p>}
      <pre className="ay-guide-report">{report}</pre>
      <div className="ay-guide-actions"><button type="button" onClick={copyReport}>{copied ? 'Copied' : 'Copy note'}</button><button type="button" onClick={downloadReport}>Download note</button></div>
    </>}
  </section>;
}

export default function AynaGuideHub(props) {
  const premium = ['recap', 'report', 'trial'].includes(props.page);
  const content = <AynaGuideContent {...props} />;
  return premium ? <ProFeatureGate feature={props.page === 'report' ? 'appointment' : props.page} title={{ recap: 'Personalized recaps', report: 'Appointment prep', trial: 'Personal check-backs' }[props.page]} onBack={props.onBack}>{content}</ProFeatureGate> : content;
}
