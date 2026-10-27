import { useEffect, useId, useRef, useState } from 'react';
import '../../styles/quiz.css';

// The quiz's shared presentation (app IntakeScreen and website WebIntake).
// Founder, Oct 27: "keep it simple minimal easy to read at a glance". One
// question per screen: a thin progress bar, a back arrow and a quiet Skip on
// top, a big question, at most one short helper line, the answers, and one
// pinned Continue pill. Anything longer (why we ask, privacy notes, long
// helper text) sits behind "Why we ask". Questions, options, values, order
// and saved answers all stay in intakeModel.js; nothing here changes them.

const Arrow = ({ back = false }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">{back ? <path d="M19 12H5M11 18l-6-6 6-6" /> : <path d="M5 12h14M13 6l6 6-6 6" />}</svg>
);
const Chevron = () => <svg className="aq-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>;

/** "Why we ask": a small text button that opens a sheet with everything longer. */
function WhySheet({ items, onClose, surface }) {
  const closeRef = useRef(null);
  const titleId = useId();
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className={`aq-sheet-scrim aq-sheet-scrim--${surface}`} onClick={onClose}>
      <div className="aq-sheet" role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={(e) => e.stopPropagation()}>
        <h2 className="aq-sheet-title" id={titleId}>Why we ask</h2>
        <div className="aq-sheet-body">
          {items.map((item, i) => (typeof item === 'string' ? <p key={i}>{item}</p> : <div key={i}>{item}</div>))}
        </div>
        <button type="button" ref={closeRef} className="aq-sheet-close" onClick={onClose}>Got it</button>
      </div>
    </div>
  );
}

/**
 * One question screen.
 * progress: { now, total, label }. why: array of strings or nodes (empty: no button).
 * cta: { label, onClick, disabled, count }. rootProps / answerProps are spread
 * onto the root and the answer area (swipe and press-and-hold handlers).
 */
export function QuizFrame({
  surface = 'app', stepKey, sub, direction = 'forward', progress, onBack, onSkip, skipLabel = 'Skip',
  title, helper, why = [], flag, lead, cta, hint, below, children, overlay, rootProps = {}, answerProps = {}, className = '',
}) {
  const [whyOpen, setWhyOpen] = useState(false);
  const whyItems = why.filter(Boolean);
  const pct = progress ? Math.max(4, Math.min(100, (progress.now / Math.max(1, progress.total)) * 100)) : 0;
  return (
    <div className={`aq aq--${surface}${className ? ` ${className}` : ''}`} data-step={stepKey} data-sub={sub || undefined} data-direction={direction} {...rootProps}>
      <div className="aq-col">
        <header className="aq-top">
          {onBack ? <button type="button" className="aq-icon" aria-label="Go back" onClick={onBack}><Arrow back /></button> : <span className="aq-icon is-spacer" aria-hidden="true" />}
          {progress && (
            <div className="aq-bar" role="progressbar" aria-label={progress.label || 'Quiz progress'} aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.now} aria-valuetext={progress.label}>
              <span style={{ width: `${pct}%` }} />
            </div>
          )}
          {onSkip ? <button type="button" className="aq-skip" onClick={onSkip}>{skipLabel}</button> : <span className="aq-skip is-spacer" aria-hidden="true" />}
        </header>
        <div className="aq-scroll">
          <div className="aq-slide" key={`${stepKey}-${sub || ''}`}>
            {flag && <p className="aq-flag">{flag}</p>}
            <h1 className="aq-title">{title}</h1>
            {(helper || whyItems.length > 0) && (
              <p className="aq-helper">
                {helper && <span>{helper}</span>}
                {whyItems.length > 0 && <button type="button" className="aq-why-btn" aria-haspopup="dialog" onClick={() => setWhyOpen(true)}>Why we ask</button>}
              </p>
            )}
            {lead}
            <div className="aq-answer" {...answerProps}>{children}</div>
          </div>
        </div>
        <footer className="aq-foot">
          {hint && <p className="aq-hint" role="status">{hint}</p>}
          {cta && (
            <button type="button" className="aq-cta" onClick={cta.onClick} disabled={cta.disabled}>
              <span>{cta.label}</span>
              {cta.count > 0 && <b aria-label={`${cta.count} picked`}>{cta.count}</b>}
              <i aria-hidden="true"><Arrow /></i>
            </button>
          )}
          {below}
        </footer>
      </div>
      {whyOpen && <WhySheet items={whyItems} surface={surface} onClose={() => setWhyOpen(false)} />}
      {overlay}
    </div>
  );
}

/** A colour-block screen between sections ("Next" + the section's real name), and the checkpoint. */
export function QuizBlock({ surface = 'app', stepKey = 'interstitial', kicker, title, body, onBack, cta, secondary, children }) {
  const ctaRef = useRef(null);
  useEffect(() => { if (surface === 'web') ctaRef.current?.focus({ preventScroll: true }); }, [surface]);
  return (
    <div className={`aq aq--${surface} aq-block`} data-step={stepKey}>
      <div className="aq-col">
        <header className="aq-top">
          {onBack ? <button type="button" className="aq-icon" aria-label="Go back" onClick={onBack}><Arrow back /></button> : <span className="aq-icon is-spacer" aria-hidden="true" />}
        </header>
        <div className="aq-scroll">
          <div className="aq-slide aq-block-in">
            {kicker && <p className="aq-block-kicker">{kicker}</p>}
            <h1 className="aq-block-title">{title}</h1>
            {body && <p className="aq-block-body">{body}</p>}
            {children}
          </div>
        </div>
        <footer className="aq-foot">
          <button type="button" ref={ctaRef} className="aq-cta" onClick={cta.onClick} disabled={cta.disabled}>
            <span>{cta.label}</span><i aria-hidden="true"><Arrow /></i>
          </button>
          {secondary}
        </footer>
      </div>
    </div>
  );
}

/**
 * Chip cloud. Multi-select chips are checkboxes; `single` makes them radios.
 * expand: { [item]: node } opens inline right after that chip while it is picked (Fig-style sub-options).
 */
export function Chips({ items, selected = [], onToggle, labels = {}, muted = [], single = false, label, expand = {}, icons, display, compact = false }) {
  return (
    <div className={`aq-chips${compact ? ' is-compact' : ''}`} role={single ? 'radiogroup' : 'group'} aria-label={label}>
      {items.map((item) => {
        const on = selected.includes(item);
        const sub = expand[item];
        const text = labels[item] || (display ? display(item) : item);
        return [
          <button type="button" key={item} role={single ? 'radio' : 'checkbox'} aria-checked={on} aria-expanded={sub ? on : undefined}
            className={`aq-chip${on ? ' is-on' : ''}${muted.includes(item) ? ' is-muted' : ''}${sub ? ' has-sub' : ''}`} onClick={() => onToggle(item)}>
            {icons?.[item] && <span className="aq-chip-icon" aria-hidden="true">{icons[item]}</span>}
            <span>{text}</span>
            {sub && <Chevron />}
          </button>,
          sub && on ? <div key={`${item}-sub`} className="aq-sub">{sub}</div> : null,
        ];
      })}
    </div>
  );
}

/** A follow-up question inside an expanded chip or under rows. */
export function SubQuestion({ title, children }) {
  return <div className="aq-subq"><p className="aq-subq-title">{title}</p>{children}</div>;
}

/** Single choice: outlined full-width rows. */
export function Rows({ options, value, onChange, labels = {}, label }) {
  return (
    <div className="aq-rows" role="radiogroup" aria-label={label}>
      {options.map((opt) => {
        const on = value === opt;
        return (
          <button type="button" key={opt} role="radio" aria-checked={on} className={`aq-row${on ? ' is-on' : ''}`} onClick={() => onChange(opt)}>
            <span>{labels[opt] || opt}</span>
            <i className="aq-dot" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></i>
          </button>
        );
      })}
    </div>
  );
}

/** Press-and-hold definition card (same content both surfaces). */
export function GlossaryCard({ term, definition, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="aq-sheet-scrim" onClick={onClose}>
      <div className="aq-sheet" role="dialog" aria-label={term} onClick={(e) => e.stopPropagation()}>
        <h2 className="aq-sheet-title">{term}</h2>
        <div className="aq-sheet-body"><p>{definition}</p></div>
        <button type="button" className="aq-sheet-close" onClick={onClose}>Got it</button>
      </div>
    </div>
  );
}
