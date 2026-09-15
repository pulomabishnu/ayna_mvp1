import { useEffect, useState } from 'react';
import { getSupabaseClient } from '../../utils/supabaseClient.js';
import { grantCurrentUserConsent, hasCurrentConsent } from '../../utils/pendingConsent.js';

export default function AiConsentPrompt({ user }) {
  const [dismissed, setDismissed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setDismissed(false);
    setAgeConfirmed(false);
    setError('');
  }, [user?.id]);

  if (!user || hasCurrentConsent(user) || dismissed) return null;

  const allow = async () => {
    if (!ageConfirmed) {
      setError('Please confirm that you are at least 18 years old.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await grantCurrentUserConsent(getSupabaseClient());
      setDismissed(true);
    } catch (e) {
      setError(e?.message || 'Could not save your choice. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="ai-consent-title" style={{ position: 'fixed', inset: 0, zIndex: 990, background: 'rgba(24, 27, 52, .62)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '20px 16px max(20px, env(safe-area-inset-bottom))' }}>
      <div style={{ width: 'min(520px, 100%)', borderRadius: 24, background: 'var(--ayna-surface, #FFFCF9)', color: 'var(--ayna-text, #292524)', padding: 22, boxShadow: '0 20px 60px rgba(0,0,0,.24)' }}>
        <div id="ai-consent-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: 'calc(23px * var(--ayna-text-scale, 1))', lineHeight: 1.25, color: 'var(--ayna-heading, #242A52)' }}>
          AI privacy choice
        </div>
        <p style={{ margin: '10px 0 8px', fontSize: 'calc(14px * var(--ayna-text-scale, 1))', lineHeight: 1.55 }}>
          When you use AI-powered features such as Ask ayna, product chat, or personalized AI insights, relevant information you provide may be sent to a third-party AI provider such as Anthropic, OpenAI, or Google to generate your response.
        </p>
        <p style={{ margin: '0 0 12px', fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', lineHeight: 1.5, color: 'var(--ayna-text-muted, #6f6880)' }}>
          ayna is designed not to send your name, email, phone number, or account ID in AI prompts, and to send only the health context needed for the feature. You can continue using non-AI parts of ayna without agreeing.{' '}
          <a href="https://www.aynahealth.co/privacy-policy" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>Learn more</a>
        </p>
        <button type="button" onClick={() => { setAgeConfirmed((v) => !v); setError(''); }} style={{ width: '100%', border: 0, background: 'transparent', padding: '4px 0 14px', display: 'flex', alignItems: 'flex-start', gap: 10, textAlign: 'left', color: 'inherit', fontFamily: "'DM Sans', sans-serif" }}>
          <span aria-hidden="true" style={{ width: 20, height: 20, flex: 'none', borderRadius: 5, border: '1.5px solid var(--ayna-border, #a8a29e)', background: ageConfirmed ? 'var(--ayna-cta-bg, #FFC774)' : 'transparent', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{ageConfirmed ? '✓' : ''}</span>
          <span style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', lineHeight: 1.45 }}>I confirm that I am at least 18 years old.</span>
        </button>
        {error && <div style={{ marginBottom: 10, color: '#B3261E', fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))' }}>{error}</div>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" disabled={saving} onClick={() => setDismissed(true)} style={{ flex: 1, border: '1px solid var(--ayna-border, #ded6cd)', background: 'transparent', color: 'inherit', borderRadius: 99, padding: '13px 12px', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 'calc(14px * var(--ayna-text-scale, 1))' }}>
            Not now
          </button>
          <button type="button" disabled={saving || !ageConfirmed} onClick={allow} style={{ flex: 1, border: 'none', background: 'var(--ayna-cta-bg, #FFC774)', color: 'var(--ayna-cta-text, #292524)', borderRadius: 99, padding: '13px 12px', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 'calc(14px * var(--ayna-text-scale, 1))', opacity: saving || !ageConfirmed ? .55 : 1 }}>
            {saving ? 'Saving…' : 'Allow AI features'}
          </button>
        </div>
      </div>
    </div>
  );
}
