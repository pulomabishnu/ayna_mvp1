import './InlineError.css';

/**
 * One inline error line under a field or checkbox: an icon plus a plain
 * sentence saying what to do, so the error isn't carried by colour alone.
 * Shared by the app (src/mobile) and website sign-up forms.
 */
export default function InlineError({ id, children, className = '' }) {
  if (!children) return null;
  return (
    <p id={id} className={`ay-inline-err ${className}`.trim()} role="alert" aria-live="polite">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="9.5" />
        <path d="M12 7.5v5.5M12 16.5v.01" />
      </svg>
      <span>{children}</span>
    </p>
  );
}
