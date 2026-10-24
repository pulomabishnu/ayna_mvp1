import { useEffect, useState } from 'react';
import { REMIND_OPTIONS, fmtRemindDay, reminderFor, setSavedReminder } from '../../utils/savedReminders.js';
import { savePrompt, useSavePrompt } from '../../utils/savePrompt.js';
import './save.css';

const PUSH_NOTE = {
  scheduled: 'You’ll get a notification on your phone, if notifications are on in the ayna app.',
  signed_out: 'It will be waiting in your Saved.',
  offline: 'You’re offline, so only this device will remind you. It will be waiting in your Saved.',
  error: 'It will be waiting in your Saved.',
};

/**
 * The follow-up after Save (team direction 19 to 21): "Remind me later ·
 * Compare", in a line, never a popup. Remind me later offers 3 days, a week
 * or a month and links back to this product from Saved.
 */
export function SaveFollowUp({ product, onCompare, onClose, inline = false }) {
  const [step, setStep] = useState(() => (reminderFor(product?.id) ? 'has' : 'idle'));
  const [result, setResult] = useState(null);
  if (!product) return null;
  const existing = reminderFor(product.id);
  const pick = async (opt) => {
    setStep('saving');
    const r = await setSavedReminder(product, opt.days);
    setResult(r);
    setStep('set');
  };
  return (
    <div className={`ay-svf${inline ? ' is-inline' : ''}`} role="group" aria-label={`After saving ${product.name}`}>
      {step === 'idle' || step === 'has' ? (
        <p className="ay-svf__row">
          <span className="ay-svf__lead">{inline ? 'Saved.' : `Saved ${product.name}.`}</span>
          <button type="button" className="ay-svf__link" onClick={() => setStep('remind')}>{step === 'has' && existing ? `Reminder set for ${fmtRemindDay(existing.at)}. Change` : 'Remind me later'}</button>
          {onCompare && <><span aria-hidden="true" className="ay-svf__dot">·</span><button type="button" className="ay-svf__link" onClick={() => onCompare(product)}>Compare</button></>}
        </p>
      ) : step === 'remind' || step === 'saving' ? (
        <div className="ay-svf__row">
          <span className="ay-svf__lead">Want a reminder?</span>
          <span className="ay-svf__chips">
            {REMIND_OPTIONS.map((o) => <button key={o.id} type="button" className="ay-svf__chip" disabled={step === 'saving'} onClick={() => pick(o)}>{o.label}</button>)}
          </span>
          <button type="button" className="ay-svf__link" onClick={() => setStep('idle')}>Not now</button>
        </div>
      ) : (
        <p className="ay-svf__row" role="status">
          <span className="ay-svf__lead">We’ll remind you on {fmtRemindDay(result.at)}.</span>
          <span className="ay-svf__note">{PUSH_NOTE[result.push] || PUSH_NOTE.error}</span>
          {onCompare && <button type="button" className="ay-svf__link" onClick={() => onCompare(product)}>Compare</button>}
        </p>
      )}
      {onClose && !inline && <button type="button" className="ay-svf__x" aria-label="Close" onClick={onClose}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button>}
    </div>
  );
}

/**
 * Inline on a product page: shows after she saves this product here.
 * Registers as the host so the floating strip stays away.
 */
export function SaveFollowUpInline({ product, onCompare }) {
  const p = useSavePrompt();
  useEffect(() => (product?.id ? savePrompt.host(product.id) : undefined), [product?.id]);
  if (!product?.id || p.product?.id !== product.id) return null;
  return <SaveFollowUp key={p.at} product={product} onCompare={onCompare} inline />;
}

/**
 * Anywhere else (a card heart): a small strip near the bottom for a few
 * seconds, longer once she starts using it. Not shown when an open product
 * page already shows the prompt inline.
 */
export function SaveFollowUpStrip({ onCompare, variant = 'app' }) {
  const p = useSavePrompt();
  const hosted = p.product && p.hosts.includes(p.product.id);
  if (!p.product || hosted) return null;
  return <Strip key={p.at} product={p.product} onCompare={onCompare} variant={variant} />;
}

function Strip({ product, onCompare, variant }) {
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (busy) return undefined;
    const t = setTimeout(() => savePrompt.hide(), 7000);
    return () => clearTimeout(t);
  }, [busy]);
  return (
    <div className={`ay-svf-strip is-${variant}`} onPointerDown={() => setBusy(true)} onFocusCapture={() => setBusy(true)}>
      <SaveFollowUp product={product} onCompare={onCompare ? (prod) => { savePrompt.hide(); onCompare(prod); } : null} onClose={() => savePrompt.hide()} />
    </div>
  );
}
