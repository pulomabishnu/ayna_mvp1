import React, { useState, useRef, useEffect } from 'react';
import { useSpeechToText } from '../hooks/useSpeechToText';
import SearchMicButton from './SearchMicButton';
import { getSupabaseClient } from '../utils/supabaseClient';
import { renderMarkdownLite } from '../utils/renderMarkdownLite';
import { getAppSessionId } from '../utils/conversationId';

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

  return raw ? raw.trim().split(/\s+/)[0] : '';
}

const STARTERS = ['What helps with period cramps?', 'What fits heavy periods?', 'Fragrance-free options for sensitive skin'];

function buildWelcome() {
  // Name is already in the panel header; the first bubble goes straight to
  // what she can ask. Starter prompts render under it.
  return [{
    role: 'assistant',
    text: 'Ask about a product, an ingredient, or what to try for something you’re dealing with. I can point you to products and, if you say so, save what you tell me to your health profile. I’m not a doctor, so this isn’t medical advice.',
    starters: true,
  }];
}

export default function ProfileChatbot({ profile, user, onProfileUpdate, chatHistory = [], onChatHistoryUpdate, disabled, onNavigateToDiscovery, onViewRecommendations, openSignal = 0, prefill = '', onRequireAuth }) {
  const firstName = getFirstName(user);
  const [open, setOpen] = useState(false);
  // The header's Ask ayna button bumps openSignal to open the chat.
  useEffect(() => { if (openSignal) { setOpen(true); if (prefill) setInput(prefill); } }, [openSignal]); // eslint-disable-line react-hooks/exhaustive-deps
  const [messages, setMessages] = useState(
    chatHistory?.length > 0 ? chatHistory : buildWelcome()
  );
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  // After 8 seconds of waiting, say so (a silent wait looks frozen).
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!sending) { setSlow(false); return undefined; }
    const t = window.setTimeout(() => setSlow(true), 8000);
    return () => window.clearTimeout(t);
  }, [sending]);
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

  // Always visible (testers missed it when it shrank on scroll). It can be
  // tucked to the right edge as a small tab if it's in the way; that choice
  // is remembered per browser.
  // On the home page the launcher waits until she scrolls past the hero so it
  // never sits on the main "Build my ecosystem" button.
  const [homeTop, setHomeTop] = useState(() => typeof window !== 'undefined' && window.location.pathname === '/' && window.scrollY < 320);
  useEffect(() => {
    const onScroll = () => setHomeTop(window.location.pathname === '/' && window.scrollY < 320);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('popstate', onScroll);
    const t = window.setInterval(onScroll, 1000);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('popstate', onScroll); window.clearInterval(t); };
  }, []);
  const TUCK_KEY = 'ayna_ask_tucked_v1';
  // The pill no longer tucks away (the hide control was as loud as the feature).
  // It slides out of the way while scrolling down and comes back on scroll up.
  const tucked = false;
  const setTuck = () => { try { localStorage.removeItem(TUCK_KEY); } catch { /* storage unavailable */ } };
  const [scrollHidden, setScrollHidden] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    const on = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) < 12) return;
      setScrollHidden(y > last && y > 240);
      last = y;
    };
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

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

  const messagesRef = useRef(null);
  // New answer: bring the TOP of the answer into view so she reads from the
  // start; her own message or "Thinking…" just scrolls to the bottom.
  useEffect(() => {
    const box = messagesRef.current;
    const last = messages[messages.length - 1];
    if (box && last && last.role !== 'user') {
      const answers = box.querySelectorAll('.ayna-ask-message--ayna:not(.ayna-ask-message--typing)');
      const target = answers[answers.length - 1];
      if (target) { box.scrollTo({ top: target.offsetTop - box.offsetTop - 8, behavior: 'smooth' }); return; }
    }
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sending]);

  const updateMessage = (index, patch) => setMessages((prev) => {
    const next = prev.map((m, i) => (i === index ? { ...m, ...patch } : m));
    onChatHistoryUpdate?.(next);
    return next;
  });

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

  const handleSend = (e) => { e.preventDefault(); sendText(input.trim()); };
  // retryOf: index of a failed-answer bubble to replace when retrying.
  const sendText = async (msg, retryOf = null) => {
    if (!msg || sending || disabled) return;
    setInput('');
    setSendError('');
    const userMsg = { role: 'user', text: msg };
    const base = retryOf != null ? messages.filter((_, j) => j !== retryOf) : messages;
    const messagesWithUser = retryOf != null ? base : [...base, userMsg];
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
          conversationId: getAppSessionId(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) throw Object.assign(new Error('not_signed_in'), { code: 'not_signed_in' });
      if (res.status === 429) throw Object.assign(new Error('weekly_limit_reached'), { code: 'weekly_limit_reached' });
      if (!res.ok || !data?.answer) throw new Error(data?.error || 'Could not get an answer right now.');

      const newMessages = [...messagesWithUser, { role: 'assistant', text: data.answer }];

      // Nothing happens without her tap: a profile change is OFFERED with
      // Add / Not now, and a browse suggestion is a button, never an
      // automatic page change (launch audit A01).
      const merged = mergeProfileUpdate(profile || {}, data.profileUpdate || {});
      const category = data.browseIntent?.category && onNavigateToDiscovery ? data.browseIntent.category : null;
      if (merged || category) {
        const parts = [];
        if (merged?.added.frustrations.length) parts.push(merged.added.frustrations.join(', '));
        if (merged?.added.sensitivities.length) parts.push(`sensitive to ${merged.added.sensitivities.join(', ')}`);
        if (merged?.added.productsToAvoid.length) parts.push(`avoid ${merged.added.productsToAvoid.join(', ')}`);
        if (merged?.added.preference) parts.push(`priority: ${merged.added.preference}`);
        newMessages.push({
          role: 'system',
          text: parts.length ? `Add “${parts.join(' · ')}” to your profile so Shop can match it?` : '',
          pendingProfile: merged ? merged.profile : null,
          browseCategory: category,
          browseLabel: category ? (data.browseIntent.label || String(category).replace(/[-_]/g, ' ')) : '',
        });
      }

      setMessages(newMessages);
      onChatHistoryUpdate?.(newMessages);
    } catch (err) {
      if (err?.code === 'not_signed_in') {
        setSendError('Sign in to ask ayna anything. Free accounts get a few chats each week.');
      } else if (err?.code === 'weekly_limit_reached') {
        setSendError("You've used your free chats for this week. They reset weekly, or upgrade for unlimited.");
      } else {
        // The failure lives in the conversation, next to the question, with a way forward.
        const failed = [...messagesWithUser, { role: 'assistant', failed: true, question: msg, text: 'I couldn’t answer that just now.' }];
        setMessages(failed);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {tucked && !open ? (
        <button type="button" className="ayna-ask-tab" aria-label="Show Ask ayna" onClick={() => setTuck(false)}>
          <span className="ayna-ask-orb ayna-ask-orb--small" aria-hidden="true" />
          <span className="ayna-ask-tab__label">Ask ayna</span>
          <span className="ayna-ask-tab__chev" aria-hidden="true">‹</span>
        </button>
      ) : (
        <div className={`ayna-ask-dock${homeTop && !open ? ' is-waiting' : ''}${scrollHidden && !open ? ' is-scroll-hidden' : ''}`}>
          <button
            type="button"
            className="ayna-ask-launcher"
            aria-label="Ask ayna"
            aria-expanded={open}
            onClick={() => (onRequireAuth && !user ? onRequireAuth('Ask ayna') : setOpen(!open))}
            disabled={disabled}
          >
            <span className="ayna-ask-orb" aria-hidden="true" />
            <span className="ayna-ask-launcher__label">Ask ayna</span>
          </button>
        </div>
      )}

      {open && (
        <section className="ayna-ask-panel" aria-label="Ask ayna">
          <header className={`ayna-ask-panel__header${messages.length > 1 ? " is-compact" : ""}`}>
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
              aria-label="Close Ask ayna"
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
              title="Type your question"
            >
              Chat
            </button>

            <button
              type="button"
              className={mode === 'talk' ? 'is-active' : ''}
              onClick={() => setMode('talk')}
              disabled={!canTalk}
              title={canTalk ? 'Speak out loud and hear the answer' : 'Voice isn’t available in this browser'}
            >
              Voice
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
                      ? 'ayna is speaking…'
                      : 'Talk to ayna'}
                </strong>

                <span>
                  {speech.isRecording
                    ? 'Select the mic again when you are done.'
                    : speaking
                      ? 'Select the mic anytime to speak again.'
                      : 'Select the mic and speak naturally.'}
                </span>
              </div>
            </div>
          )}

          <div className="ayna-ask-panel__messages" ref={messagesRef}>
            {messages.map((m, i) => (
              m.role === 'system' ? (
                <div key={i} className="ayna-ask-message ayna-ask-message--system">
                  {m.text && <span>{m.text}</span>}
                  <div className="ayna-ask-actions">
                    {m.pendingProfile && !m.decided && <>
                      <button type="button" className="is-primary" onClick={() => { onProfileUpdate(m.pendingProfile); updateMessage(i, { decided: 'added', text: 'Added to your profile.' }); }}>Add</button>
                      <button type="button" onClick={() => updateMessage(i, { decided: 'skipped', text: 'Okay, nothing changed.' })}>Not now</button>
                    </>}
                    {m.decided === 'added' && onViewRecommendations && <button type="button" onClick={onViewRecommendations}>See my matches</button>}
                    {m.browseCategory && <button type="button" onClick={() => onNavigateToDiscovery({ initialCategory: m.browseCategory })}>See {m.browseLabel} →</button>}
                  </div>
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
                  {m.failed && (
                    <div className="ayna-ask-actions">
                      <button type="button" className="is-primary" onClick={() => sendText(m.question, i)}>Retry</button>
                      {onNavigateToDiscovery && <button type="button" onClick={() => onNavigateToDiscovery(m.question)}>Search the shop instead</button>}
                    </div>
                  )}
                  {m.starters && messages.length === 1 && (
                    <div className="ayna-ask-starters">
                      {STARTERS.map((q) => <button type="button" key={q} onClick={() => sendText(q)}>{q}</button>)}
                    </div>
                  )}
                </div>
              )
            ))}

            {sending && (
              <div className="ayna-ask-message ayna-ask-message--ayna ayna-ask-message--typing" role="status" aria-label="ayna is typing">
                <span className="ayna-typing" aria-hidden="true"><i /><i /><i /></span>
                {slow && <span className="ayna-typing__slow">Still thinking…</span>}
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
                  ? 'Or type while in Voice mode…'
                  : 'Ask ayna anything…'}
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
