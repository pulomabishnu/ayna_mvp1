import './blend-scale.css';

/**
 * Ordered quiz scales (period flow, period pain, brand openness, how often a
 * big purchase). Critique, Oct 27: the slider, its parked thumb, the "Slide or
 * tap" placeholder and the radio dots were three input metaphors in one
 * question. Now one row of large segmented buttons, nothing pre-selected.
 * The answer is still exactly one of the question's own options, saved
 * verbatim, so what the matcher receives does not change.
 *
 *   levels: the ordered options (strings, saved verbatim)
 *   extras: the other options ("It varies", "Not sure"), as chips under the row
 *   short:  optional short labels (the full option stays the accessible name)
 */
export default function BlendScale({ label, levels, extras = [], value, onChange, short = null, className = '', variant = 'web' }) {
  const set = levels.includes(value);
  return (
    <div className={`uq-blend uq-seg is-${variant}${set ? '' : ' is-unset'} ${className}`.trim()}>
      <div className="uq-seg__row" role="radiogroup" aria-label={label} style={{ '--n': levels.length }}>
        {levels.map((o, i) => (
          <button type="button" role="radio" key={o} aria-checked={value === o} aria-label={short?.[i] && short[i] !== o ? o : undefined} className={`uq-seg__btn${value === o ? ' is-on' : ''}`} onClick={() => onChange(o)}>
            {short?.[i] || o}
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
