import { AI_CONSENT_TEXT } from '../utils/signupConsent.js';

/**
 * Asked the first time she uses an AI feature, if she didn't agree at sign-up (App Review 5.1.2(i)).
 * Nothing is sent to the AI provider until she agrees.
 */
export default function AiConsentCard({ onAgree, onDecline, busy = false }) {
  return (
    <div className="ay-ai-consent" role="alertdialog" aria-labelledby="ay-ai-consent-t">
      <p id="ay-ai-consent-t"><b>Before ayna’s AI answers</b></p>
      <p>{AI_CONSENT_TEXT}</p>
      <div className="ay-ai-consent__row">
        <button type="button" className="ay-ai-consent__yes" onClick={onAgree} disabled={busy}>I agree</button>
        <button type="button" className="ay-ai-consent__no" onClick={onDecline} disabled={busy}>Not now</button>
      </div>
    </div>
  );
}
