import { useEffect, useRef, useState } from 'react';

// Tapping a starter fills the box so the person can edit before asking.
const ASK_STARTERS = ['What helps with cramps?', 'Is this safe with my birth control?', 'Explain my top match'];
import { getSupabaseClient } from '../../utils/supabaseClient.js';
import { renderMarkdownLite } from '../../utils/renderMarkdownLite.jsx';
import { apiUrl } from '../../utils/apiUrl.js';

/**
 * Mobile port of ProfileChatbot's merge/summary logic
 * (src/components/ProfileChatbot.jsx) — same /api/ask-ayna contract, same
 * profile-update shape. Duplicated rather than imported so this file has no
 * dependency on the desktop component's own JSX/CSS.
 */
function mergeProfileUpdate(currentProfile, update) {
  const profile = {
    ...currentProfile,
    frustrations: Array.isArray(currentProfile.frustrations) ? [...currentProfile.frustrations] : [],
    sensitivities: Array.isArray(currentProfile.sensitivities) ? [...currentProfile.sensitivities] : [],
    productsToAvoid: Array.isArray(currentProfile.productsToAvoid) ? [...currentProfile.productsToAvoid] : [],
  };
  const added = { frustrations: [], sensitivities: [], productsToAvoid: [], preference: null };
  (update.frustrations || []).forEach((v) => {
    if (!profile.frustrations.includes(v)) { profile.frustrations.push(v); added.frustrations.push(v); }
  });
  (update.sensitivities || []).forEach((v) => {
    if (!profile.sensitivities.includes(v)) { profile.sensitivities.push(v); added.sensitivities.push(v); }
  });
  (update.productsToAvoid || []).forEach((v) => {
    if (!profile.productsToAvoid.includes(v)) { profile.productsToAvoid.push(v); added.productsToAvoid.push(v); }
  });
  if (update.preference && update.preference !== profile.preference) {
    profile.preference = update.preference;
    added.preference = update.preference;
  }
  const hasChanges = added.frustrations.length > 0 || added.sensitivities.length > 0 || added.productsToAvoid.length > 0 || added.preference;
  return hasChanges ? { profile, added } : null;
}

function summarizeProfile(profile) {
  if (!profile) return '';
  const parts = [];
  if (Array.isArray(profile.frustrations) && profile.frustrations.length) parts.push(`Concerns: ${profile.frustrations.join(', ')}.`);
  if (Array.isArray(profile.sensitivities) && profile.sensitivities.length) parts.push(`Sensitivities: ${profile.sensitivities.join(', ')}.`);
  if (Array.isArray(profile.productsToAvoid) && profile.productsToAvoid.length) parts.push(`Avoiding: ${profile.productsToAvoid.join(', ')}.`);
  if (profile.preference) parts.push(`Priority: ${profile.preference}.`);
  return parts.join(' ');
}

function buildWelcome() {
  return [{ role: 'assistant', text: 'What are you looking for?' }];
}

/**
 * Mobile equivalent of ProfileChatbot.jsx, adapted to a full-screen overlay
 * instead of a corner-anchored panel (mobile has no room for that) and to
 * this app's own nav-style callbacks instead of desktop's. Voice ("Talk")
 * mode is intentionally left out — it depends on the browser
 * SpeechRecognition API, which the Capacitor WKWebView shell doesn't
 * support without a native plugin this change doesn't add.
 */
export default function AskAynaModal({
  open,
  onClose,
  onOpen,
  enabled = true,
  profile,
  onProfileUpdate,
  chatHistory = [],
  onChatHistoryUpdate,
  name,
  onNavigateToDiscovery,
  onViewRecommendations,
  onRequireAuth,
}) {
  const [messages, setMessages] = useState(chatHistory.length > 0 ? chatHistory : buildWelcome(name));
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [session, setSession] = useState(undefined); // undefined = still checking
  const [hasOpened, setHasOpened] = useState(open);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    const supabase = getSupabaseClient();
    if (!supabase) {
      setSession(null);
      return undefined;
    }
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setSession(data?.session || null);
    }).catch(() => { if (!cancelled) setSession(null); });
    return () => { cancelled = true; };
  }, [open]);

  useEffect(() => {
    if (chatHistory.length > 0) setMessages(chatHistory);
  }, [chatHistory]);

  useEffect(() => {
    if (open) setHasOpened(true);
  }, [open]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    // Reopening preserves the existing scroll position.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  if (!enabled || (!open && !hasOpened)) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    const msg = input.trim();
    if (!msg || sending) return;
    if (!session?.access_token) { onRequireAuth?.('Ask Ayna'); return; }
    setInput('');
    setSendError('');
    const userMsg = { role: 'user', text: msg };
    const messagesWithUser = [...messages, userMsg];
    setMessages(messagesWithUser);
    setSending(true);

    try {
      const token = session?.access_token;
      if (!token) throw Object.assign(new Error('not_signed_in'), { code: 'not_signed_in' });
      const res = await fetch(apiUrl('/api/ask-ayna'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          message: msg,
          profileSummary: summarizeProfile(profile || {}),
          chatHistory: messages.slice(-6),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) throw Object.assign(new Error('not_signed_in'), { code: 'not_signed_in' });
      if (res.status === 429) throw Object.assign(new Error('weekly_limit_reached'), { code: 'weekly_limit_reached' });
      if (!res.ok || !data?.answer) throw new Error(data?.error || 'Could not get an answer right now.');

      const newMessages = [...messagesWithUser, { role: 'assistant', text: data.answer }];

      const merged = mergeProfileUpdate(profile || {}, data.profileUpdate || {});
      if (merged) {
        onProfileUpdate?.(merged.profile);
        const parts = [];
        if (merged.added.frustrations.length) parts.push(`Concerns: ${merged.added.frustrations.join(', ')}`);
        if (merged.added.sensitivities.length) parts.push(`Sensitivities: ${merged.added.sensitivities.join(', ')}`);
        if (merged.added.productsToAvoid.length) parts.push(`Avoiding: ${merged.added.productsToAvoid.join(', ')}`);
        if (merged.added.preference) parts.push(`Priority: ${merged.added.preference}`);
        newMessages.push({ role: 'system', text: `Updated your profile — ${parts.join(' · ')}.`, showViewRecommendations: true });
      }

      if (data.browseIntent?.category && onNavigateToDiscovery) {
        onNavigateToDiscovery();
      }

      setMessages(newMessages);
      onChatHistoryUpdate?.(newMessages);
    } catch (err) {
      if (err?.code === 'not_signed_in') {
        onRequireAuth?.('Ask Ayna');
      } else if (err?.code === 'weekly_limit_reached') {
        setSendError("You've used your free chats for this week. They reset weekly.");
      } else {
        setSendError(err?.message || 'Something went wrong. Try again in a moment.');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="ayna-ask-drawer"
      data-open={open ? 'true' : 'false'}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 60,
        background: 'var(--ayna-bg)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <button type="button" className="ayna-ask-drawer-handle" onClick={onOpen} aria-label="Reopen Ask Ayna" tabIndex={open ? -1 : 0} aria-hidden={open}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7" /></svg></button>
      <div className="ayna-ask-drawer-content" role="dialog" aria-label="Ask Ayna" aria-modal={open ? true : undefined} aria-hidden={!open} inert={!open ? true : undefined}>
      <div
        style={{
          paddingTop: 'max(20px, env(safe-area-inset-top))',
          paddingLeft: 20,
          paddingRight: 20,
          paddingBottom: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderBottom: '1px solid var(--ayna-border)',
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(15px * var(--ayna-text-scale, 1))', color: 'var(--ayna-heading)' }}>
            {'Ask ayna'}
          </div>
        </div>
        <button
          type="button" aria-label="Collapse Ask Ayna to the screen edge" onClick={onClose}
          style={{
            width: 44,
            height: 44,
            border: 0,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 'calc(20px * var(--ayna-text-scale, 1))',
            color: 'var(--ayna-text-muted)',
            background: 'var(--ayna-chip-bg)',
          }}
        >
          ›
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div
              style={{
                maxWidth: '85%',
                background: m.role === 'user' ? 'var(--ayna-cta-bg)' : 'var(--ayna-chip-bg)',
                color: m.role === 'user' ? 'var(--ayna-cta-text)' : 'var(--ayna-text)',
                borderRadius: 16,
                padding: '11px 14px',
                fontSize: 'calc(14px * var(--ayna-text-scale, 1))',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
              }}
            >
              {m.role === 'assistant' ? renderMarkdownLite(m.text) : m.text}
            </div>
            {m.showViewRecommendations && onViewRecommendations && (
              <div
                onClick={onViewRecommendations}
                style={{
                  marginTop: 6,
                  fontFamily: "var(--ayna-font-ui)",
                  fontWeight: 600,
                  fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))',
                  color: 'var(--ayna-accent-dark)',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                View recommendations →
              </div>
            )}
          </div>
        ))}
        {!messages.some((m) => m.role === 'user') && !sending && (
          <div className="ay-ask-starters" aria-label="Try asking">
            {ASK_STARTERS.map((q, i) => <button type="button" key={q} className="ay-ask-starter" style={{ '--i': i }} onClick={() => setInput(q)}>{q}</button>)}
          </div>
        )}
        {sending && <div className="ay-typing" role="status" aria-label="ayna is thinking"><i /><i /><i /></div>}
        <div ref={bottomRef} />
      </div>

      {sendError && (
        <div style={{ padding: '0 20px 8px', fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: '#B3261E' }}>{sendError}</div>
      )}

      <form
        onSubmit={handleSend}
        style={{
          display: 'flex',
          gap: 8,
          padding: '12px 20px',
          paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
          borderTop: '1px solid var(--ayna-border)',
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={session === undefined ? 'Loading…' : 'Ask Ayna anything…'}
          disabled={sending || session === undefined}
          style={{
            flex: 1,
            minWidth: 0,
            padding: '12px 16px',
            borderRadius: 99,
            border: '1px solid var(--ayna-border)',
            fontSize: 'max(16px, calc(14px * var(--ayna-text-scale, 1)))',
            background: 'var(--ayna-surface)',
            color: 'var(--ayna-text)',
          }}
        />
        <button
          type="submit"
          disabled={sending || !input.trim() || session === undefined}
          style={{
            padding: '12px 20px',
            borderRadius: 99,
            border: 'none',
            background: 'var(--ayna-cta-bg)',
            color: 'var(--ayna-cta-text)',
            fontFamily: "var(--ayna-font-ui)",
            fontWeight: 600,
            fontSize: 'calc(14px * var(--ayna-text-scale, 1))',
            cursor: 'pointer',
            opacity: sending || !input.trim() || session === undefined ? 0.5 : 1,
          }}
        >
          Ask
        </button>
      </form>
      </div>
    </div>
  );
}
