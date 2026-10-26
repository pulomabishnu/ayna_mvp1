import './ay-primitives.css';

/**
 * Chip (all-pages brief, "Everywhere first"): butter with a 1.5px ink
 * outline, radius 8; selected is espresso. Colour only shows state, never a
 * category. A toggle by default (aria-pressed); pass `role="radio"` style
 * props yourself for single choice groups.
 */
export default function Chip({ selected = false, onClick, children, icon = null, className = '', type = 'button', ...rest }) {
  return (
    <button
      type={type}
      className={`ayk-chip${selected ? ' is-on' : ''} ${className}`.trim()}
      aria-pressed={rest.role ? undefined : selected}
      aria-checked={rest.role === 'radio' || rest.role === 'checkbox' ? selected : undefined}
      onClick={onClick}
      {...rest}
    >
      {icon && <span className="ayk-chip__icon" aria-hidden="true">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}

/** A labelled row of chips that wraps (never scrolls sideways). */
export function ChipRow({ label, children, className = '' }) {
  return <div className={`ayk-chiprow ${className}`.trim()} role="group" aria-label={label}>{children}</div>;
}
