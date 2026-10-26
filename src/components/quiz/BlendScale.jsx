import { useId } from 'react';
import { BlendSlider } from '../ui/ay';
import './blend-scale.css';

/**
 * The House Blend slider (#007b85fd) for quiz questions that are already an
 * ordered scale (period flow, period pain, brand openness). Uniqueness pass A.
 * The answer is still exactly one of the question's own options: the slider
 * snaps to the ordered levels, the named stops under it are tappable, and
 * answers that are not a level ("It varies", "Not sure", "No preference")
 * stay chips. What the matcher receives does not change.
 *
 *   levels: the ordered options (strings, saved verbatim)
 *   extras: the other options (chips)
 *   short:  optional short stop labels (the full option is the accessible name and the readout)
 */
export default function BlendScale({ label, levels, extras = [], value, onChange, left, right, short = null, className = '', variant = 'web' }) {
  const id = `blend-${useId().replace(/:/g, '')}`;
  const idx = levels.indexOf(value);
  const set = idx >= 0;
  const pos = set ? idx : Math.floor((levels.length - 1) / 2);
  return (
    <div className={`uq-blend is-${variant}${set ? '' : ' is-unset'} ${className}`.trim()}>
      <output className="uq-blend__read" htmlFor={id} aria-live="polite">{set ? value : 'Slide or tap'}</output>
      <BlendSlider
        id={id}
        left={left || short?.[0] || levels[0]}
        right={right || short?.[levels.length - 1] || levels[levels.length - 1]}
        min={0}
        max={levels.length - 1}
        step={1}
        value={pos}
        valueText={set ? value : 'Not answered yet'}
        onChange={(i) => onChange(levels[i])}
        label={<span className="uq-blend__sr">{label}</span>}
      />
      <div className="uq-blend__stops" role="radiogroup" aria-label={label} style={{ '--n': levels.length }}>
        {levels.map((o, i) => (
          <button type="button" role="radio" key={o} aria-checked={value === o} aria-label={o} className={value === o ? 'is-on' : ''} onClick={() => onChange(o)}>
            <i aria-hidden="true" /><span aria-hidden="true">{short?.[i] || o}</span>
          </button>
        ))}
      </div>
      {extras.length > 0 && (
        <div className="uq-blend__extras" role="radiogroup" aria-label={`${label}: other answers`}>
          {extras.map((o) => <button type="button" role="radio" key={o} aria-checked={value === o} className={`uq-blend__chip${value === o ? ' is-on' : ''}`} onClick={() => onChange(o)}>{o}</button>)}
        </div>
      )}
    </div>
  );
}

