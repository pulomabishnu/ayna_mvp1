import React, { useState, useRef, useEffect } from 'react';
import { useSpeechToText } from '../hooks/useSpeechToText';
import SearchMicButton from './SearchMicButton';
import { getSupabaseClient } from '../utils/supabaseClient';
import { renderMarkdownLite } from '../utils/renderMarkdownLite';

/** Merges a profileUpdate the backend returned into the current profile, deduping against what's already there. */
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

/** Short text summary of her current profile, sent as context so the model doesn't re-add what's already there. */
function summarizeProfile(profile) {
  if (!profile) return '';
  const parts = [];
  if (Array.isArray(profile.frustrations) && profile.frustrations.length) parts.push(`Concerns: ${profile.frustrations.join(', ')}.`);
  if (Array.isArray(profile.sensitivities) && profile.sensitivities.length) parts.push(`Sensitivities: ${profile.sensitivities.join(', ')}.`);
  if (Array.isArray(profile.productsToAvoid) && profile.productsToAvoid.length) parts.push(`Avoiding: ${profile.productsToAvoid.join(', ')}.`);
  if (profile.preference) parts.push(`Priority: ${profile.preference}.`);
  return parts.join(' ');
}

function getFirstName(user) {
  const meta = user?.user_metadata || {};
  const raw = [
    meta.first_name,
    meta.given_name,
    meta.name,
    meta.full_name,
  ].find((value) => typeof value === 'string' && value.trim());

  return raw ? raw.trim().split(/\\s+/)[0] : '';
}

function buildWelcome(firstName) {
  const greeting = firstName ? `Hey, ${firstName}.` : 'Hey.';
  return [{
    role: 'assistant',
    text: `${greeting} I'm Ayna. Tell me what you're looking for, what isn't working for you, or what you want to avoid. I can use that context to personalize your profile and help you browse.`,
  }];
}

export default function ProfileChatbot({ profile, user, onProfileUpdate, chatHistory = [], onChatHistoryUpdate, disabled, onNavigateToDiscovery, onViewRecommendations }) {
  const firstName = getFirstName(user);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(
    chatHistory?.length > 0 ? chatHistory : buildWelcome(firstName)
  );
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [session, setSession] = useState(undefined); // undefined = still checking
  const [mode, setMode] = useState('chat');
  const [speaking, setSpeaking] = useState(false);
  const bottomRef = useRef(null);
  const formRef = useRef(null);
  const autoSubmitVoiceRef = useRef(false);
  const lastSpokenRef = useRef('');
  const speech = useSpeechToText();

  const canTalk =
    speech.supported &&
    typeof window !== 'undefined' &&
    'speechSynthesis' in window;

  const toggleVoice = () => {
    if (speech.isRecording) {
      const t = speech.stop();

      if (t) {
        const next = input.trim() ? `${input.trim()} ${t}` : t;
        if (mode === 'talk') autoSubmitVoiceRef.current = true;
        setInput(next);
      }
    } else {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setSpeaking(false);
      }
      speech.start();
    }
  };

  const speakReply = (text) => {
    if (mode !== 'talk' || !canTalk || !text) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.96;
    utterance.pitch = 1.02;

    const voices = window.speechSynthesis.getVoices();

    // Prefer warmer, more natural voices when the device has them.
    const preferredNames = [
      'Ava',
      'Samantha',
      'Allison',
      'Serena',
      'Zoe',
      'Google US English',
      'Microsoft Jenny Online',
      'Microsoft Aria Online',
    ];

    const voice =
      preferredNames
        .map((name) =>
          voices.find((v) =>
            String(v.name || '').toLowerCase().includes(name.toLowerCase())
          )
        )
        .find(Boolean) ||
      voices.find((v) =>
        String(v.lang || '').toLowerCase().startsWith('en-us')
      ) ||
      voices.find((v) =>
        String(v.lang || '').toLowerCase().startsWith('en')
      );

    if (voice) utterance.voice = voice;

    // Warm + conversational. Slight lift without sounding cartoonish.
    utterance.rate = 1.01;
    utterance.pitch = 1.08;
    utterance.volume = 0.96;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (chatHistory?.length > 0) setMessages(chatHistory);
  }, [chatHistory?.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (
      mode === 'talk' &&
      autoSubmitVoiceRef.current &&
      input.trim()
    ) {
      autoSubmitVoiceRef.current = false;
      formRef.current?.requestSubmit();
    }
  }, [input, mode]);

  useEffect(() => {
    if (!open || mode !== 'talk' || !canTalk) return;

    const latest = messages[messages.length - 1];

    if (
      !latest ||
      latest.role !== 'assistant' ||
      !latest.text ||
      lastSpokenRef.current === latest.text
    ) return;

    lastSpokenRef.current = latest.text;
    speakReply(latest.text);
  }, [messages, open, mode, canTalk]);

  useEffect(() => {
    if (mode === 'talk' && open) return;

    if (
      typeof window !== 'undefined' &&
      'speechSynthesis' in window
    ) {
      window.speechSynthesis.cancel();
    }

    setSpeaking(false);
  }, [mode, open]);

  const handleSend = async (e) => {
    e.preventDefault();
    const msg = input.trim();
    if (!msg || sending || disabled) return;
    setInput('');
    setSendError('');
    const userMsg = { role: 'user', text: msg };
    const messagesWithUser = [...messages, userMsg];
    setMessages(messagesWithUser);
    setSending(true);

    try {
      const token = session?.access_token;
      if (!token) throw Object.assign(new Error('not_signed_in'), { code: 'not_signed_in' });
      const res = await fetch('/api/ask-ayna', {
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

      // Fold any profile update in AND say exactly what changed, as its own
      // message — not baked wordlessly into the prose answer — with a way to
      // actually see the effect (found live, 2026-08-24 bug bash: chat
      // updates used to happen silently). Never adds a PRODUCT to her
      // ecosystem on its own — only her health profile, same as retaking
      // the quiz; adding a product is still always her own separate choice.
      const merged = mergeProfileUpdate(profile || {}, data.profileUpdate || {});
      if (merged) {
        onProfileUpdate(merged.profile);
        const parts = [];
        if (merged.added.frustrations.length) parts.push(`Concerns: ${merged.added.frustrations.join(', ')}`);
        if (merged.added.sensitivities.length) parts.push(`Sensitivities: ${merged.added.sensitivities.join(', ')}`);
        if (merged.added.productsToAvoid.length) parts.push(`Avoiding: ${merged.added.productsToAvoid.join(', ')}`);
        if (merged.added.preference) parts.push(`Priority: ${merged.added.preference}`);
        newMessages.push({ role: 'system', text: `Updated your profile — ${parts.join(' · ')}.`, showViewRecommendations: true });
      }

      if (data.browseIntent?.category && onNavigateToDiscovery) {
        onNavigateToDiscovery({ initialCategory: data.browseIntent.category });
      }

      setMessages(newMessages);
      onChatHistoryUpdate?.(newMessages);
    } catch (err) {
      if (err?.code === 'not_signed_in') {
        setSendError('Sign in to ask Ayna anything — free accounts get a few AI chats per week.');
      } else if (err?.code === 'weekly_limit_reached') {
        setSendError("You've used your free chats for this week. They reset weekly, or upgrade for unlimited.");
      } else {
        setSendError(err?.message || 'Something went wrong. Try again in a moment.');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="ayna-ask-launcher"
        aria-label="Ask Ayna"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        disabled={disabled}
      >
        <span className="ayna-ask-orb" aria-hidden="true" />
        <span className="ayna-ask-launcher__label">Ask Ayna</span>
      </button>

      {open && (
        <section className="ayna-ask-panel" aria-label="Ask Ayna">
          <header className="ayna-ask-panel__header">
            <div className="ayna-ask-panel__identity">
              <span className="ayna-ask-orb ayna-ask-orb--small" aria-hidden="true" />

              <div>
                <div className="ayna-ask-panel__eyebrow">ASK AYNA</div>
                <h3>{firstName ? `Hey, ${firstName}.` : 'Hey.'}</h3>
                <p>What can I help you figure out?</p>
              </div>
            </div>

            <button
              type="button"
              className="ayna-ask-panel__close"
              aria-label="Close Ask Ayna"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </header>

          <div className="ayna-ask-mode">
            <button
              type="button"
              className={mode === 'chat' ? 'is-active' : ''}
              onClick={() => setMode('chat')}
            >
              Chat
            </button>

            <button
              type="button"
              className={mode === 'talk' ? 'is-active' : ''}
              onClick={() => setMode('talk')}
              disabled={!canTalk}
            >
              Talk
            </button>
          </div>

          {mode === 'talk' && (
            <div className={`ayna-voice-state${
              speech.isRecording
                ? ' is-listening'
                : speaking
                  ? ' is-speaking'
                  : ''
            }`}>
              <span className="ayna-voice-state__orb" aria-hidden="true" />

              <div>
                <strong>
                  {speech.isRecording
                    ? 'Listening…'
                    : speaking
                      ? 'Ayna is speaking…'
                      : 'Talk to Ayna'}
                </strong>

                <span>
                  {speech.isRecording
                    ? 'Tap the mic again when you are done.'
                    : speaking
                      ? 'Tap the mic anytime to speak again.'
                      : 'Tap the mic and speak naturally.'}
                </span>
              </div>
            </div>
          )}

          <div className="ayna-ask-panel__messages">
            {messages.map((m, i) => (
              m.role === 'system' ? (
                <div key={i} className="ayna-ask-message ayna-ask-message--system">
                  <span>{m.text}</span>
                  {m.showViewRecommendations && onViewRecommendations && (
                    <button type="button" onClick={onViewRecommendations}>View Recommendations</button>
                  )}
                </div>
              ) : (
                <div
                  key={i}
                  className={`ayna-ask-message ${
                    m.role === 'user'
                      ? 'ayna-ask-message--user'
                      : 'ayna-ask-message--ayna'
                  }`}
                >
                  {m.role === 'assistant' ? renderMarkdownLite(m.text) : m.text}
                </div>
              )
            ))}

            {sending && (
              <div className="ayna-ask-message ayna-ask-message--ayna ayna-ask-message--typing">
                Thinking…
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {sendError && <p className="ayna-ask-panel__error">{sendError}</p>}

          <form ref={formRef} className="ayna-ask-panel__composer" onSubmit={handleSend}>
            <div className="ayna-ask-panel__inputrow">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={mode === 'talk'
                  ? 'Or type while in Talk mode…'
                  : 'Ask Ayna anything…'}
                disabled={disabled || sending || speech.isRecording}
              />

              {speech.supported && (
                <SearchMicButton
                  size="compact"
                  isRecording={speech.isRecording}
                  disabled={disabled || sending}
                  onClick={toggleVoice}
                />
              )}

              <button
                type="submit"
                className="ayna-ask-send"
                aria-label="Send"
                disabled={!input.trim() || disabled || sending}
              >
                ↑
              </button>
            </div>

            {speech.isRecording && (
              <p className="ayna-ask-panel__listening">
                Listening… {speech.liveText || 'speak now'}
              </p>
            )}
          </form>
        </section>
      )}
    </>
  );
}
