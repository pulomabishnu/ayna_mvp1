import './ay-primitives.css';

function Btn({ kind, href, children, className = '', type = 'button', icon = null, ...rest }) {
  const cls = `ayk-btn is-${kind} ${className}`.trim();
  const body = <>{icon && <span className="ayk-btn__icon" aria-hidden="true">{icon}</span>}<span>{children}</span></>;
  return href ? <a className={cls} href={href} {...rest}>{body}</a> : <button type={type} className={cls} {...rest}>{body}</button>;
}

/**
 * StickerButton (#52 Wild Stems offset shadow, ayna's own CTA): the primary action, espresso with the one 3px pink sticker
 * shadow; presses in 3px on tap. 48px tall. One per block.
 */
export function StickerButton(props) { return <Btn kind="primary" {...props} />; }

/** OutlineButton: the secondary action, 1.5px ink outline, 44px tall, no shadow. */
export function OutlineButton(props) { return <Btn kind="outline" {...props} />; }

/** TextLink button: the one text link a block may have beside its primary. */
export function TextButton(props) { return <Btn kind="text" {...props} />; }

/**
 * StickerHeading (#52 "TRY THESE OUT"): an outlined pill heading with the pink
 * sticker shadow. Optional, at most ONE per page, never on health content.
 */
export function StickerHeading({ as = 'h2', children, className = '', ...rest }) {
  const Tag = as;
  return <Tag className={`ayk-stickerhead ${className}`.trim()} {...rest}>{children}</Tag>;
}
