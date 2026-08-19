import React, { useId, useState } from 'react';
import { lookupGlossaryTerm } from '../data/glossary';

/**
 * Wraps a medical term / acronym / org name with a hover-or-tap popup explaining it in
 * plain language. Works on both desktop (hover, keyboard focus) and touch (tap toggles it),
 * and never blocks anything it wraps from also being a Chip/button — this only adds an
 * underline + a small info mark next to the text.
 *
 * Usage: <GlossaryTerm term="PCOS" /> looks the definition up from src/data/glossary.js.
 * Pass `define` directly to skip the lookup (for a term not in the shared glossary).
 */
export default function GlossaryTerm({ term, define, children, inline = true }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const definition = define || lookupGlossaryTerm(term);
  const label = children ?? term;

  if (!definition) {
    // No definition on file — render the plain text rather than a misleading dotted underline.
    return <>{label}</>;
  }

  const Wrapper = inline ? 'span' : 'div';

  return (
    <Wrapper style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          margin: 0,
          font: 'inherit',
          color: 'inherit',
          cursor: 'help',
          textDecoration: 'underline dotted',
          textUnderlineOffset: '3px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.2em',
        }}
      >
        {label}
        <span aria-hidden="true" style={{ fontSize: '0.72em', opacity: 0.65 }}>ⓘ</span>
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          style={{
            position: 'absolute',
            zIndex: 50,
            bottom: 'calc(100% + 0.4rem)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'max-content',
            maxWidth: '17rem',
            background: 'var(--color-surface-contrast, #1C1917)',
            color: '#fff',
            fontSize: '0.78rem',
            fontWeight: 400,
            lineHeight: 1.45,
            padding: '0.55rem 0.75rem',
            borderRadius: 'var(--radius-sm, 8px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
            textAlign: 'left',
            fontFamily: 'var(--font-body)',
          }}
        >
          {definition}
        </span>
      )}
    </Wrapper>
  );
}
