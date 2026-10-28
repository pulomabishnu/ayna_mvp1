/**
 * The one-line medical note on the opening pages and at the start of the quiz
 * (focus group, Oct 26: Gwyn flagged emergencies; add a standard safety line).
 * "medical advice" links to the Terms section on medical care. Plain text, not a modal.
 */
export const MEDICAL_TERMS_HREF = '/terms-of-use#medical';
export const MEDICAL_TERMS_URL = 'https://www.aynahealth.co/terms-of-use#medical';

export default function MedicalNote({ href = MEDICAL_TERMS_HREF, onOpen = null, className = '' }) {
  const click = onOpen ? (e) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onOpen();
  } : undefined;
  // Founder Oct 27: always one line. The full sentence shows where it fits;
  // narrow phones get the short form (same meaning) instead of wrapping.
  return (
    <div className="ay-med-wrap">
      <p className={`ay-med-note${className ? ` ${className}` : ''}`}>
        <span className="ay-med-note__full">ayna shares information, not <a href={href} onClick={click}>medical advice</a>. In an emergency, call 911.</span>
        <span className="ay-med-note__short">Not <a href={href} onClick={click}>medical advice</a>. In an emergency, call 911.</span>
      </p>
    </div>
  );
}
