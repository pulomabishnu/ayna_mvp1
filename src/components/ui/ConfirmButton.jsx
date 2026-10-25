import { useRef } from 'react';
import { useTwoStep } from '../../hooks/useTwoStep.js';

// Two-step destructive confirm, never window.confirm (see hooks/useTwoStep.js).
// With `cancelLabel`, the armed state also shows a Cancel button beside it.
export default function ConfirmButton({ children, armedLabel = 'Tap again to confirm', cancelLabel = '', onConfirm, className = '', disabled = false, ms = 3000, ...rest }) {
  const { armed, press, disarm } = useTwoStep(onConfirm, ms);
  const cancelRef = useRef(null);
  const button = (
    <button
      type="button"
      {...rest}
      className={`${className}${armed ? ' is-armed' : ''}`}
      data-armed={armed ? 'true' : undefined}
      disabled={disabled}
      onClick={press}
      onBlur={(e) => { if (!cancelRef.current || e.relatedTarget !== cancelRef.current) disarm(); }}
      onKeyDown={(e) => { if (e.key === 'Escape' && armed) { e.stopPropagation(); disarm(); } }}
    >
      <span aria-live="polite">{armed ? armedLabel : children}</span>
    </button>
  );
  if (!cancelLabel || !armed) return button;
  return (
    <>
      {button}
      <button type="button" ref={cancelRef} role={rest.role} className="ay-confirm-cancel" onClick={(e) => { e.stopPropagation(); disarm(); }}>{cancelLabel}</button>
    </>
  );
}
