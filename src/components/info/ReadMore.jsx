import React, { useId, useState } from 'react';
import '../../styles/uq-info.css';

/**
 * Glance first, read more on tap (founder, Oct 26 16:54). The glance layer is
 * whatever the page renders around this; the full text sits here, one tap
 * away. Nothing is removed: the hidden text stays in the DOM (the `hidden`
 * attribute), so search-in-page after expanding, tests and crawlers still
 * see it. A real button with aria-expanded / aria-controls.
 *
 *   <ReadMore label="Read the full policy">…full verbatim text…</ReadMore>
 */
export default function ReadMore({ label = 'Read more', lessLabel = 'Show less', defaultOpen = false, className = '', children, as: Tag = 'div' }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = `rm-${useId().replace(/:/g, '')}`;
  return (
    <div className={`uq-rm${open ? ' is-open' : ''}${className ? ` ${className}` : ''}`}>
      <Tag id={id} className="uq-rm__body" hidden={!open}>{children}</Tag>
      <button type="button" className="uq-rm__btn" aria-expanded={open} aria-controls={id} onClick={() => setOpen((v) => !v)}>
        <span>{open ? lessLabel : label}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
      </button>
    </div>
  );
}
