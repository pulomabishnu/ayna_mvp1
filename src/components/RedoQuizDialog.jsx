import React, { useEffect, useRef, useState } from 'react';
import { useEscapeToClose } from '../utils/useEscapeToClose';
import { freshStartWarning } from '../utils/quizRedo';
import '../styles/redo-quiz.css';

/**
 * "Redo quiz" choice. Step 1: keep her products and add new matches (the
 * default), or start fresh. Step 2 (start fresh only): a second warning that
 * says exactly what gets deleted and names the count on the button.
 *
 * `step="confirm"` opens straight on the warning (the "Reset my ecosystem"
 * menu item uses it).
 */
export default function RedoQuizDialog({ open, step: initialStep = 'choose', productCount = 0, trackedCount = 0, busy = false, onKeep, onFresh, onClose }) {
  const [step, setStep] = useState(initialStep);
  const ref = useRef(null);
  const close = busy ? undefined : onClose;
  useEscapeToClose(open, close);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const t = window.setTimeout(() => ref.current?.querySelector('[data-autofocus]')?.focus(), 0);
    return () => { window.clearTimeout(t); previous?.focus?.(); };
  }, [open, step]);

  if (!open) return null;
  const w = freshStartWarning({ productCount, trackedCount });

  const trap = (e) => {
    if (e.key !== 'Tab') return;
    const items = [...ref.current.querySelectorAll('button:not(:disabled)')];
    if (!items.length) return;
    if (e.shiftKey && document.activeElement === items[0]) { e.preventDefault(); items.at(-1).focus(); }
    else if (!e.shiftKey && document.activeElement === items.at(-1)) { e.preventDefault(); items[0].focus(); }
  };

  return (
    <div className="rq-backdrop" role="presentation" onClick={close}>
      {step === 'choose' ? (
        <section ref={ref} className="rq" role="dialog" aria-modal="true" aria-labelledby="rq-title" onClick={(e) => e.stopPropagation()} onKeyDown={trap}>
          <h2 id="rq-title">Redo the quiz</h2>
          <p className="rq-lede">What should happen to the {productCount} product{productCount === 1 ? '' : 's'} in your Ecosystem?</p>
          <button type="button" className="rq-option is-keep" data-autofocus onClick={onKeep}>
            <strong>Keep my products and add new ones</strong>
            <span>Everything you have stays. New matches from your answers are added, and we'll show you which ones.</span>
          </button>
          <button type="button" className="rq-option is-fresh" onClick={() => setStep('confirm')}>
            <strong>Start fresh</strong>
            <span>Clear your Ecosystem and build a new one from your new answers.</span>
          </button>
          <button type="button" className="rq-cancel" onClick={onClose}>Cancel</button>
        </section>
      ) : (
        <section ref={ref} className="rq is-danger" role="alertdialog" aria-modal="true" aria-labelledby="rq-title" aria-describedby="rq-desc" onClick={(e) => e.stopPropagation()} onKeyDown={trap}>
          <h2 id="rq-title">{w.title}</h2>
          <div id="rq-desc">
            <p className="rq-label">This deletes:</p>
            <ul className="rq-list is-clears">{w.clears.map((c) => <li key={c}>{c}</li>)}</ul>
            <p className="rq-label">This stays:</p>
            <ul className="rq-list">{w.keeps.map((c) => <li key={c}>{c}</li>)}</ul>
            <p className="rq-permanent">{w.permanence}</p>
          </div>
          <div className="rq-actions">
            <button type="button" className="rq-btn" data-autofocus disabled={busy} onClick={initialStep === 'confirm' ? onClose : () => setStep('choose')}>
              {initialStep === 'confirm' ? 'Cancel' : 'Go back'}
            </button>
            <button type="button" className="rq-btn is-danger" disabled={busy} onClick={onFresh}>{busy ? 'Deleting…' : w.confirmLabel}</button>
          </div>
        </section>
      )}
    </div>
  );
}
