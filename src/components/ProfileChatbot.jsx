import { askLimitError } from '../utils/askLimitError.js';
import React, { useState, useRef, useEffect } from 'react';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { getSupabaseClient } from '../utils/supabaseClient';
import ShareAnswerButton from './ShareAnswerButton.jsx';
import { questionForAnswer } from '../utils/sharedAnswer.js';
import { getAppSessionId } from '../utils/conversationId';
import AskFollowUps from './AskFollowUps.jsx';
import { chipsFor, followUpRequestFields } from '../utils/askFollowUps.js';
import { localAnswer, aiAnswerExtras } from '../utils/askAnswer.js';
import { fetchWithTimeout, isNetworkError } from '../utils/network.js';
import { AskStatCard } from './AskHome.jsx';
import AskPanel, { AskHeader, AskStart, AskMessage, AskComposer } from './ask/AskPanel.jsx';
import AskBasedOn from './ask/AskBasedOn.jsx';
import { useAskSetup } from './ask/useAskSetup.js';
import { recentQuestions } from '../utils/askRecent.js';
import { mayAutoFocus } from '../utils/delightRuntime.js';

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

const WELCOME = 'Ask about a product, an ingredient, or what to try for something you’re dealing with. I can point you to products and, if you say so, save what you tell me to your health profile. I’m not a doctor, so this isn’t medical advice.';

function buildWelcome() {
  // Name is already in the panel header; the first bubble goes straight to
  // what she can ask. Starter prompts render under it.
  return [{
    role: 'assistant',
    text: WELCOME,
    starters: true,
  }];
}

export default function ProfileChatbot({ profile, user, onProfileUpdate, chatHistory = [], onChatHistoryUpdate, disabled, onNavigateToDiscovery, onViewRecommendations, openSignal = 0, prefill = '', prefillStats = null, onRequireAuth, products = {}, hasHealthData = false, resolveProduct = null, onOpenProduct = null, onOpenDashboard = null, onOpenRead = null, matchOpts = undefined, healthProfile = null, focusProduct = null, asPage = false }) {
  const firstName = getFirstName(user);
  // asPage: the Ask ayna tab (/ask) shows the conversation inline, always open.
  const [openState, setOpen] = useState(false);
  const open = asPage || openState;
  // The header's Ask ayna button bumps openSignal to open the chat.
  // Numbers from the dashboard that go with a prefilled question (shown back as a stat card).
  const statsRef = useRef(null);
  // A tapped prompt (Ask why, a Rundown question, a dashboard question) is sent
  // straight away (founder, Oct 24 22:17); only typing waits for Send.
  useEffect(() => { if (openSignal) { setOpen(true); statsRef.current = prefill && prefillStats?.length ? { text: prefill, stats: prefillStats } : null; if (prefill) sendText(prefill); } }, [openSignal]); // eslint-disable-line react-hooks/exhaustive-deps
  // Home (tiles + recent questions) until she asks something.
  const [home, setHome] = useState(true);
  // Back on the home view: start at the top, not where the chat was scrolled.
  useEffect(() => { if (home) messagesRef.current?.scrollTo({ top: 0 }); }, [home]);
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
  // Signed out: the last question that needs ayna's AI, named with a Sign in button.
  const [needsAccount, setNeedsAccount] = useState('');
  const [session, setSession] = useState(undefined); // undefined = still checking
  // Prompts grouped About you · Safety · Products, Safety first when flagged (ask/useAskSetup.js).
  const { safety, groups } = useAskSetup({ open, profile, healthProfile, matchOpts, products, signedIn: Boolean(session?.access_token || user), focusProduct, hasHealthData });
  const [mode, setMode] = useState('chat');
  const [speaking, setSpeaking] = useState(false);
  const bottomRef = useRef(null);
  const formRef = useRef(null);
  const inputRef = useRef(null);
  // Opened by a click or a tap on Ask: the question box takes focus. Never on
  // load, and on phones only after a tap (utils/delightRuntime.js, autofocus rules).
  useEffect(() => {
    if (!open || !mayAutoFocus()) return undefined;
    const id = requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(id);
  }, [open]);
  // Reads she could be pointed to, ranked for her. Articles is a lazy chunk
  // on the website, so it loads only once the panel is opened.
  const [reads, setReads] = useState([]);
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
    // The Ask home (hello + starters) reads from the top.
    if (home && !sending) { if (box) box.scrollTop = 0; return; }
    const last = messages[messages.length - 1];
    if (box && last && last.role !== 'user') {
      const answers = box.querySelectorAll('.ay-askp-msg.is-ayna');
      const target = answers[answers.length - 1];
      if (target) { box.scrollTo({ top: target.offsetTop - box.offsetTop - 8, behavior: 'smooth' }); return; }
    }
    // Scroll the conversation box only: scrollIntoView also moved the whole
    // page on /ask, so the page opened scrolled past its own title.
    if (box) box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' });
    else bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sending, home]);

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

  useEffect(() => {
    if (!open || reads.length) return undefined;
    let cancelled = false;
    Promise.all([import('./Articles.jsx'), import('../mobile/utils/personalReads.js')])
      .then(([a, r]) => {
        if (cancelled) return;
        const ranked = r.rankReadsForProfile(a.ARTICLES || [], profile || {});
        setReads(ranked.slice(0, 12).map((x) => ({ id: x.id, title: x.title })));
      })
      .catch(() => { /* reads unavailable: no read chips */ });
    return () => { cancelled = true; };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const runFollowUp = (f) => {
    if (f.type === 'ask') { sendText(f.text); return; }
    if (f.type === 'ask_else') { inputRef.current?.focus({ preventScroll: true }); return; }
    if (f.type === 'open_product') { const p = resolveProduct?.(f.productId); if (p) { setOpen(false); onOpenProduct?.(p); } return; }
    if (f.type === 'browse') { setOpen(false); onNavigateToDiscovery?.({ initialCategory: f.intent?.category || null, query: f.intent?.category ? '' : (f.intent?.query || '') }); return; }
    if (f.type === 'open_dashboard') { setOpen(false); onOpenDashboard?.(); return; }
    if (f.type === 'open_library') { setOpen(false); onOpenRead?.(f.articleId); }
  };

  const handleSend = (e) => { e.preventDefault(); sendText(input.trim()); };
  // retryOf: index of a failed-answer bubble to replace when retrying.
  const sendText = async (msg, retryOf = null) => {
    if (!msg || sending || disabled) return;
    // Her match for a product: ayna's match engine on this device, never the
    // language model, so it is the same % the card shows (works signed out).
    // Answered on this device first (src/utils/askAnswer.js), signed out too:
    // her match from the one engine (the same % the card shows), what helped,
    // today, the Safety questions, product facts and ayna's reads.
    const local = retryOf == null
      ? await localAnswer(msg, { profile, healthProfile, matchOpts, focusProduct, signedIn: Boolean(session?.access_token || user), safety }).catch(() => null)
      : null;
    if (local) {
      setInput('');
      setSendError('');
      setNeedsAccount('');
      setHome(false);
      const { answer, ...extras } = local;
      const next = [...messages, { role: 'user', text: msg }, { role: 'assistant', text: answer, ...extras, followUps: local.followUps || [] }];
      setMessages(next);
      onChatHistoryUpdate?.(next);
      return;
    }
    if (!session?.access_token && !user) {
      // Signed out and this one needs ayna's AI: name it, keep it in the box (QA M5).
      setInput(msg);
      setSendError('');
      setNeedsAccount(msg);
      return;
    }
    setNeedsAccount('');
    setInput('');
    setSendError('');
    setHome(false);
    const stats = statsRef.current && statsRef.current.text === msg ? statsRef.current.stats : null;
    statsRef.current = null;
    const userMsg = { role: 'user', text: msg };
    const base = retryOf != null ? messages.filter((_, j) => j !== retryOf) : messages;
    const messagesWithUser = retryOf != null ? base : [...base, userMsg];
    setMessages(messagesWithUser);
    setSending(true);

    try {
      const token = session?.access_token;
      if (!token) throw Object.assign(new Error('not_signed_in'), { code: 'not_signed_in' });
      const res = await fetchWithTimeout('/api/ask-ayna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          message: msg,
          profileSummary: summarizeProfile(profile || {}),
          chatHistory: messages.slice(-6),
          conversationId: getAppSessionId(),
          ...followUpRequestFields({ products, reads, hasHealthData }),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) throw Object.assign(new Error('not_signed_in'), { code: 'not_signed_in' });
      if (res.status === 429) throw askLimitError(data?.error);
      if (!res.ok || !data?.answer) throw new Error(data?.error || 'Could not get an answer right now.');

      const extras = await aiAnswerExtras(data, { msg, profileSent: Boolean(summarizeProfile(profile || {})), resolveProduct, profile, healthProfile, matchOpts }).catch(() => ({ basedOn: ['ayna’s AI'], sources: [] }));
      const newMessages = [...messagesWithUser, { role: 'assistant', text: data.answer, ...extras, followUps: Array.isArray(data.followUps) ? data.followUps : [], ...(stats ? { stats } : {}) }];

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
          text: parts.length ? `Add “${parts.join(' · ')}” to your profile so ayna can match it?` : '',
          pendingProfile: merged ? merged.profile : null,
          browseCategory: category,
          browseLabel: category ? (data.browseIntent.label || String(category).replace(/[-_]/g, ' ')) : '',
        });
      }

      setMessages(newMessages);
      onChatHistoryUpdate?.(newMessages);
    } catch (err) {
      if (err?.code === 'not_signed_in') {
        setSendError('Sign in to ask ayna anything. Free accounts include limited Ask ayna usage.');
      } else if (err?.code === 'ask_limit_reached') {
        setSendError(err.message);
      } else {
        // The failure lives in the conversation, next to the question, with a way forward.
        const failed = [...messagesWithUser, { role: 'assistant', failed: true, question: msg, text: isNetworkError(err) ? err.message : 'I couldn’t answer that just now.' }];
        setMessages(failed);
      }
    } finally {
      setSending(false);
    }
  };

  const signedOut = session === null && !user;
  const closeIcon = <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>;
  // "How Ask works": what is answered in this browser, what uses ayna's AI, her goals, reading answers aloud.
  const how = (<>
    <p>Questions about your matches, your day, products and ayna’s reads are answered on this device, no account needed. Other questions use ayna’s AI and need a free account.</p>
    <p>Every answer ends with its sources, marked by evidence level, and what it was based on. If you tell ayna something about you, it asks before saving it to your profile.</p>
    <p>Not medical advice. For anything urgent, contact a clinician.</p>
    <AskBasedOn quizResults={profile} variant="plain" />
    {canTalk && (
      <button type="button" role="switch" aria-checked={mode === 'talk'} className="ay-ask-health__switch" onClick={() => setMode(mode === 'talk' ? 'chat' : 'talk')}>
        <span>Read answers aloud</span><b aria-hidden="true">{mode === 'talk' ? 'On' : 'Off'}</b>
      </button>
    )}
  </>);

  return (
    <>
      {asPage ? null : tucked && !open ? (
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
            onClick={() => setOpen(!open)}
            disabled={disabled}
          >
            <span className="ayna-ask-orb" aria-hidden="true" />
            <span className="ayna-ask-launcher__label">Ask ayna</span>
          </button>
        </div>
      )}

      {/* Phones: the panel is a bottom sheet over a flat 40% scrim, like the app's Ask sheet (P1-24). */}
      {open && !asPage && <div className="ayna-ask-scrim" aria-hidden="true" onClick={() => setOpen(false)} />}
      {open && (
        <section className={`ayna-ask-panel ay-askp-shell${asPage ? ' is-page' : ''}`} aria-label="Ask ayna">
          <AskPanel
            variant={asPage ? 'page' : 'panel'}
            listRef={messagesRef}
            header={(
              <AskHeader
                level={asPage ? 2 : 1}
                start={!home ? <button type="button" aria-label="Back to Ask ayna home" onClick={() => setHome(true)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg></button> : null}
                end={!asPage ? <button type="button" className="ayna-ask-panel__close" aria-label="Close Ask ayna" onClick={() => setOpen(false)}>{closeIcon}</button> : null}
              />
            )}
            footer={<>
              {mode === 'talk' && (speech.isRecording || speaking) && (
                <p className="ay-askp-pinned" role="status">{speech.isRecording ? 'Listening… tap the mic again when you are done.' : 'Reading the answer aloud. Tap the mic to speak again.'}</p>
              )}
              {sendError && <p className="ay-askp-pinned ayna-ask-panel__error">{sendError}</p>}
            </>}
            composer={(
              <AskComposer
                formRef={formRef}
                value={input}
                onChange={setInput}
                onSubmit={handleSend}
                inputRef={inputRef}
                placeholder="Ask anything…"
                disabled={disabled || sending || speech.isRecording}
                sendDisabled={!input.trim() || disabled || sending}
                mic={{ supported: speech.supported, listening: speech.isRecording, disabled: disabled || sending, onToggle: toggleVoice }}
                below={speech.isRecording ? <p className="ay-askp-foot" role="status">Listening… {speech.liveText || 'speak now'}</p> : null}
              />
            )}
          >
            {home && !sending && (
              <AskStart
                name={firstName}
                intro={signedOut ? 'Answered on this device, no account needed. Not medical advice.' : 'Uses your profile and checked sources. Not medical advice.'}
                how={how}
                groups={groups}
                // A suggested question is sent on tap (founder, Oct 24 22:17); typing waits for Send.
                onPick={(q) => sendText(q)}
                recent={recentQuestions(messages)}
                onContinue={messages.some((m) => m.role === 'user') ? () => setHome(false) : null}
              />
            )}
            {!(home && !sending) && messages.filter((m) => !m.starters).map((m) => {
              const i = messages.indexOf(m);
              return (
                <AskMessage
                  key={i}
                  m={m}
                  before={m.role === 'assistant' ? <AskStatCard stats={m.stats} /> : null}
                  onOpenProduct={onOpenProduct && resolveProduct ? (p) => { const full = resolveProduct(p.id); if (full) { setOpen(false); onOpenProduct(full); } } : null}
                  onOpenRead={onOpenRead ? (id) => { setOpen(false); onOpenRead(id); } : null}
                  after={<>
                    {m.role === 'system' && (
                      <div className="ay-askp-acts">
                        {m.pendingProfile && !m.decided && <>
                          <button type="button" className="ay-askp-act is-primary" onClick={() => { onProfileUpdate(m.pendingProfile); updateMessage(i, { decided: 'added', text: 'Added to your profile.' }); }}>Add</button>
                          <button type="button" className="ay-askp-act" onClick={() => updateMessage(i, { decided: 'skipped', text: 'Okay, nothing changed.' })}>Not now</button>
                        </>}
                        {m.decided === 'added' && onViewRecommendations && <button type="button" className="ay-askp-act" onClick={onViewRecommendations}>See my matches</button>}
                        {m.browseCategory && <button type="button" className="ay-askp-act" onClick={() => onNavigateToDiscovery({ initialCategory: m.browseCategory })}>See {m.browseLabel}</button>}
                      </div>
                    )}
                    {m.role === 'assistant' && !m.failed && questionForAnswer(messages, i) && (
                      <ShareAnswerButton
                        question={questionForAnswer(messages, i)}
                        answer={m.text}
                        sources={m.sources || []}
                        share={m.share || null}
                        onShareChange={(share) => updateMessage(i, { share })}
                        session={session}
                        surface="web"
                      />
                    )}
                    {m.role === 'assistant' && !m.failed && questionForAnswer(messages, i) && (
                      <AskFollowUps
                        chips={chipsFor(m.followUps, {
                          hasDashboard: !!onOpenDashboard,
                          canOpen: (f) => (f.type === 'open_product' ? !!(onOpenProduct && resolveProduct?.(f.productId)) : !!(onOpenRead && reads.some((r) => r.id === f.articleId))),
                        })}
                        disabled={sending}
                        onAction={runFollowUp}
                      />
                    )}
                    {m.failed && (
                      <div className="ay-askp-acts">
                        <button type="button" className="ay-askp-act is-primary" onClick={() => sendText(m.question, i)}>Retry</button>
                        {onNavigateToDiscovery && <button type="button" className="ay-askp-act" onClick={() => onNavigateToDiscovery(m.question)}>Search the shop instead</button>}
                      </div>
                    )}
                  </>}
                />
              );
            })}
            {sending && (
              <div className="ay-askp-typing" role="status" aria-label="Looking into it">
                <i /><i /><i />{slow && <small>Still looking into it…</small>}
              </div>
            )}
            {/* Signed out and this one needs ayna's AI: named, kept in the box, with Sign in (QA M5). */}
            {needsAccount && !sendError && (
              <div className="ay-ask-account" role="status">
                <p>“{needsAccount.length > 90 ? `${needsAccount.slice(0, 88)}…` : needsAccount}” uses ayna’s AI, so it needs a free account. Your question is kept below.</p>
                {onRequireAuth && <button type="button" onClick={() => onRequireAuth('Ask ayna')}>Sign in</button>}
              </div>
            )}
            <div ref={bottomRef} />
          </AskPanel>
        </section>
      )}
    </>
  );
}
