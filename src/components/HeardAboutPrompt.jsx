import { useState } from 'react';
import posthog from 'posthog-js';
import { getSupabaseClient } from '../utils/supabaseClient';
import { HEARD_ABOUT_OPTIONS, HEARD_ABOUT_OTHER_MAX, heardAboutMetadata, heardAboutUsLabel } from '../utils/heardAbout.js';
import { clearAskHeardAbout } from '../utils/signupConsent.js';
import { ensureAnalyticsContext } from '../utils/analyticsEvents.js';
import './HeardAboutPrompt.css';

/**
 * "Where did you hear about us?" once, right after sign-up, optional
 * (onboarding audit #1: attribution is asked after the account, never as a
 * required field). Saved in the same user metadata fields as before
 * (heard_about, heard_about_other, heard_about_us), so nothing migrates.
 * `variant`: 'web' (centered card) or 'app' (bottom sheet).
 *
 * Analytics records only the fixed option value (instagram, tiktok, etc.).
 * The free-text "Other" answer never goes to PostHog.
 */
export default function HeardAboutPrompt({ onDone, onSaved, variant = 'web' }) {
  const [value, setValue] = useState('');
  const [other, setOther] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const close = ({ skipped = false } = {}) => {
    if (skipped) {
      try {
        ensureAnalyticsContext();
        posthog.capture('signup_referral_source_skipped', { surface: variant === 'app' ? 'app' : 'web' });
      } catch { /* analytics never blocks */ }
    }
    clearAskHeardAbout();
    onDone?.();
  };
  const save = async () => {
    if (!value) { close({ skipped: true }); return; }
    const supabase = getSupabaseClient();
    if (!supabase) { close(); return; }
    setSaving(true);
    setError('');
    const label = heardAboutUsLabel(value, other);
    try {
      const { data, error: e } = await supabase.auth.updateUser({ data: { ...heardAboutMetadata(value, other), ...(label ? { heard_about_us: label } : {}) } });
      if (e) throw e;
      try {
        ensureAnalyticsContext();
        // Keep the existing event name so historical acquisition charts do not split.
        posthog.capture('signup_referral_source', {
          source: value,
          surface: variant === 'app' ? 'app' : 'web',
        });
      } catch { /* analytics never blocks */ }
      onSaved?.(data?.user || null);
      close();
    } catch (e) {
      setSaving(false);
      setError(e?.message || 'Could not save that. You can skip it.');
    }
  };
  return (
    <div className={`ay-heard is-${variant}`} role="dialog" aria-modal="true" aria-labelledby="ay-heard-title">
      <div className="ay-heard__card">
        <h2 id="ay-heard-title" className="ay-heard__title">Where did you hear about us?</h2>
        <p className="ay-heard__sub">Optional. It helps a small team know what works.</p>
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
          <button type="button" className="ay-heard__primary" onClick={save} disabled={saving || !value}>{saving ? 'Saving…' : 'Save'}</button>
          <button type="button" className="ay-heard__skip" onClick={() => close({ skipped: true })} disabled={saving}>Skip</button>
        </div>
      </div>
    </div>
  );
}
