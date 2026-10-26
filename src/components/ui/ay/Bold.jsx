import './ay-bold.css';

/*
 * Signature v2 (founder Oct 26 16:33: "add more uniqueness, make it look cool").
 * The big moves from the inspo board, shared so every page uses the same ones:
 *   Band       full-width colour block (#1bed1ebe / #2a5cab78 masterclass decks)
 *   Shout      one oversized display line per page (#4dfb3fbd FEEL FITS)
 *   Bento      tiles of different sizes and colours (#455687ac intelly dashboard)
 *   BlendSlider the House Blend slider (#007b85fd)
 *   Marquee    a moving ticker strip, paused for reduced motion
 * Colours: espresso, pink, butter, butter-deep only. Blue stays for chart lines.
 */

/** Full-bleed colour block. tone: 'ink' | 'pink' | 'butter' | 'deep'. edge: scallop at the bottom. */
export function Band({ tone = 'ink', edge = false, as: Tag = 'section', className = '', children, ...rest }) {
  return (
    <Tag className={`ayb-band is-${tone}${edge ? ' has-edge' : ''} ${className}`.trim()} {...rest}>
      <div className="ayb-band__in">{children}</div>
    </Tag>
  );
}

/** One oversized line. size: 'xl' (hero) | 'l' (section). */
export function Shout({ as: Tag = 'h1', size = 'xl', className = '', children, ...rest }) {
  return <Tag className={`ayb-shout is-${size} ${className}`.trim()} {...rest}>{children}</Tag>;
}

/** Bento grid. Children are <Tile>. as: 'div' (default) | 'ol' | 'ul' (then pass Tiles as="li"). */
export function Bento({ as: Tag = 'div', className = '', children, ...rest }) {
  return <Tag className={`ayb-bento ${className}`.trim()} {...rest}>{children}</Tag>;
}

/**
 * Tile. tone: 'ink' | 'pink' | 'butter' | 'deep'. span: 'wide' (2 cols) | 'tall' (2 rows) | 'big' (2x2) | ''.
 * Pass big={value} + caption for a big-number tile; children for anything else.
 */
export function Tile({ tone = 'deep', span = '', label, big, unit, caption, as: Tag = 'div', className = '', children, ...rest }) {
  return (
    <Tag className={`ayb-tile is-${tone}${span ? ` is-${span}` : ''} ${className}`.trim()} {...rest}>
      {label && <span className="ayb-tile__label">{label}</span>}
      {big != null && <span className="ayb-tile__big">{big}{unit && <span className="ayb-tile__unit">{unit}</span>}</span>}
      {caption && <span className="ayb-tile__cap">{caption}</span>}
      {children}
    </Tag>
  );
}

/** House Blend slider: two words at the ends, a chunky thumb. Controlled. */
export function BlendSlider({ id, left, right, value = 50, onChange, min = 0, max = 100, step = 1, label, valueText, className = '' }) {
  return (
    <div className={`ayb-blend ${className}`.trim()}>
      {label && <label className="ayb-blend__label" htmlFor={id}>{label}</label>}
      <div className="ayb-blend__row">
        <span className="ayb-blend__end" aria-hidden="true">{left}</span>
        <input
          id={id}
          className="ayb-blend__input"
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-valuetext={valueText || `${value} of ${max}, ${left} to ${right}`}
          style={{ '--ayb-fill': `${((value - min) / (max - min)) * 100}%` }}
          onChange={(e) => onChange?.(Number(e.target.value))}
        />
        <span className="ayb-blend__end" aria-hidden="true">{right}</span>
      </div>
    </div>
  );
}

/** Ticker strip. items: strings. Duplicated once for a seamless loop; the copy is aria-hidden. */
export function Marquee({ items = [], tone = 'ink', className = '' }) {
  const row = (hidden) => (
    <ul className="ayb-marquee__row" aria-hidden={hidden || undefined}>
      {items.map((t, i) => <li key={i}>{t}</li>)}
    </ul>
  );
  return (
    <div className={`ayb-marquee is-${tone} ${className}`.trim()}>
      <div className="ayb-marquee__track">{row(false)}{row(true)}</div>
    </div>
  );
}
