import { useState } from 'react';
import posthog from 'posthog-js';
import { getSupabaseClient } from '../utils/supabaseClient';
import { HEARD_ABOUT_OPTIONS, HEARD_ABOUT_OTHER_MAX, heardAboutMetadata, heardAboutUsLabel } from '../utils/heardAbout.js';
import { clearAskHeardAbout } from '../utils/signupConsent.js';
import './HeardAboutPrompt.css';

/**
 * "Where did you hear about us?" right after sign-up. Required (founder,
 * Nov 2): no Skip; it stays until she answers. If saving fails (offline),
 * she can try again or continue and is asked again next time. Saved in the same user metadata fields as before
 * (heard_about, heard_about_other, heard_about_us), so nothing migrates.
 * `variant`: 'web' (centered card) or 'app' (bottom sheet).
 */
export default function HeardAboutPrompt({ onDone, onSaved, variant = 'web' }) {
  const [value, setValue] = useState('');
  const [other, setOther] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [failed, setFailed] = useState(false);
  const close = () => { clearAskHeardAbout(); onDone?.(); };
  const otherMissing = value === 'other' && !other.trim();
  const save = async () => {
    if (!value || otherMissing) return;
    const supabase = getSupabaseClient();
    if (!supabase) { close(); return; }
    setSaving(true);
    setError('');
    const label = heardAboutUsLabel(value, other);
    try {
      const { data, error: e } = await supabase.auth.updateUser({ data: { ...heardAboutMetadata(value, other), ...(label ? { heard_about_us: label } : {}) } });
      if (e) throw e;
      // The answer usually arrives after signed_up, so record it separately.
      // Only the fixed choice leaves the device, never the free-text detail.
      try {
        posthog.capture('signup_source_provided', { source: value, surface: variant });
        posthog.setPersonProperties?.({ heard_about_source: value });
      } catch { /* analytics never blocks signup */ }
      onSaved?.(data?.user || null);
      close();
    } catch (e) {
      setSaving(false);
      setError('We couldn’t save that. Check your connection and try again.');
      setFailed(true);
    }
  };
  return (
    <div className={`ay-heard is-${variant}`} role="dialog" aria-modal="true" aria-labelledby="ay-heard-title">
      <div className="ay-heard__card">
        <h2 id="ay-heard-title" className="ay-heard__title">Where did you hear about us?</h2>
        <p className="ay-heard__sub">One tap. It helps a small team know what works.</p>
        <div className="ay-heard__chips" role="radiogroup" aria-labelledby="ay-heard-title">
          {HEARD_ABOUT_OPTIONS.map((o) => (
            <button key={o.value} type="button" role="radio" aria-checked={value === o.value} className={`ay-heard__chip${value === o.value ? ' is-on' : ''}`} onClick={() => setValue(value === o.value ? '' : o.value)}>{o.label}</button>
          ))}
        </div>
        {value === 'other' && (
          <input className="ay-heard__input" type="text" aria-label="Where you heard about us" placeholder="Tell us where" maxLength={HEARD_ABOUT_OTHER_MAX} value={other} onChange={(e) => setOther(e.target.value)} autoComplete="off" />
        )}
        {error && <p className="ay-heard__err" role="alert">{error}</p>}
        <div className="ay-heard__actions">
          <button type="button" className="ay-heard__primary" onClick={save} disabled={saving || !value || otherMissing}>{saving ? 'Saving…' : failed ? 'Try again' : 'Continue'}</button>
          {/* Only after a failed save: never trap her offline. She is asked again next time. */}
          {failed && <button type="button" className="ay-heard__skip" onClick={() => onDone?.()} disabled={saving}>Continue without saving</button>}
        </div>
      </div>
    </div>
  );
}
