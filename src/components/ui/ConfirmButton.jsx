import { useTwoStep } from '../../hooks/useTwoStep.js';

// Two-step destructive confirm, never window.confirm (see hooks/useTwoStep.js).
export default function ConfirmButton({ children, armedLabel = 'Tap again to confirm', onConfirm, className = '', disabled = false, ms = 3000, ...rest }) {
  const { armed, press, disarm } = useTwoStep(onConfirm, ms);
  return (
    <button
      type="button"
      {...rest}
      className={`${className}${armed ? ' is-armed' : ''}`}
      data-armed={armed ? 'true' : undefined}
      disabled={disabled}
      onClick={press}
      onBlur={disarm}
      onKeyDown={(e) => { if (e.key === 'Escape' && armed) { e.stopPropagation(); disarm(); } }}
    >
      <span aria-live="polite">{armed ? armedLabel : children}</span>
    </button>
  );
}
