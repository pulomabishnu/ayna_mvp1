import './slide-to-start.css';

/**
 * The landing's big start button. It used to be a "slide to start" pill with a
 * knob to drag; the Nov 9 focus group read it as a slider that didn't slide
 * and missed that it started the quiz ("Find your matches" sounded like the
 * quiz was already done). It is now a plain button that says what it does,
 * with the arrow on the right. Name kept so every landing keeps working.
 *
 *   <SlideToStart actionLabel="Take your quiz" onComplete={start} />
 *
 * tone: 'butter' | 'ink'. size: 'md' | 'lg'. `label` and `hint` are ignored
 * (kept for old callers).
 */
export default function SlideToStart({ actionLabel = 'Take your quiz', onComplete, tone = 'butter', size = 'md', className = '', id, tour }) {
  return (
    <div className={`ay-sts is-button is-${tone}${size === 'lg' ? ' is-lg' : ''}${className ? ` ${className}` : ''}`} id={id} data-tour={tour}>
      <button type="button" className="ay-sts__track" onClick={() => onComplete?.()}>
        <span className="ay-sts__label">{actionLabel}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" /></svg></span>
      </button>
    </div>
  );
}
