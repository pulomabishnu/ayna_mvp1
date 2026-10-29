import { useEffect, useRef, useState } from 'react';

import { getSupabaseClient } from '../../utils/supabaseClient.js';
import { apiUrl } from '../../utils/apiUrl.js';
import ShareAnswerButton from '../../components/ShareAnswerButton.jsx';
import { questionForAnswer } from '../../utils/sharedAnswer.js';
import AskFollowUps from '../../components/AskFollowUps.jsx';
import { chipsFor, followUpRequestFields } from '../../utils/askFollowUps.js';
import { fetchWithTimeout } from '../../utils/network.js';
import { haptic } from '../../utils/haptics.js';
import { useSheetDrag } from '../hooks/useSheetDrag.js';
import { AskStatCard } from '../../components/AskHome.jsx';
import AskPanel, { AskHeader, AskStart, AskMessage, AskComposer } from '../../components/ask/AskPanel.jsx';
import { recentQuestions } from '../../utils/askRecent.js';
import { mayAutoFocus } from '../../utils/delightRuntime.js';
import { guideContext } from '../utils/aynaGuide.js';
import { localAnswer, aiAnswerExtras } from '../../utils/askAnswer.js';
import { useAskSetup } from '../../components/ask/useAskSetup.js';
import { useTapToTalk } from '../hooks/useTapToTalk.js';
import { readWakeWordPref, startWakeWord, wakeWordSupport, writeWakeWordPref } from '../utils/wakeWord.js';
import AynaGuideHub from './AynaGuideHub.jsx';
import ProFeatureGate from '../../components/ProFeatureGate.jsx';
import ProLock from '../../components/ProLock.jsx';

// Guide pages that are ayna Pro features: Your week (recap), Try & check back
// (advanced tracking), Appointment note (appointment prep). Memory stays free.
const PRO_GUIDE_PAGES = { recap: 'recap', trial: 'trial', report: 'appointment' };
import { useAskHealthPref, ASK_HEALTH_LABEL } from '../../health/askHealthPref.js';

/**
 * Mobile port of ProfileChatbot's merge/summary logic
 * (src/components/ProfileChatbot.jsx), same /api/ask-ayna contract, same
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

// No opening bubble: the first screen (greeting, intro, prompts) does that job.
function buildWelcome() {
  return [];
}

/**
 * Voice settings, reached from the chat home. Tap to talk works where the
 * web view has speech recognition. "Say ayna" stays off and unavailable until
 * the app has an on-device wake word (src/mobile/utils/wakeWord.js).
 */
function VoiceSettings({ tapSupported, onBack }) {
  const [support, setSupport] = useState({ available: false, reason: '' });
  const [on, setOn] = useState(readWakeWordPref);
  useEffect(() => { let live = true; wakeWordSupport().then((r) => { if (live) setSupport(r); }); return () => { live = false; }; }, []);
  const shownOn = on && support.available;
  return (
    <div className="ay-voice">
      <button type="button" className="ay-askh-homebtn" aria-label="Back to chat" onClick={onBack}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg></button>
      <h2>Voice</h2>
      <ul className="ay-voice__group">
        <li>
          <div className="ay-voice__row"><span>Tap the mic to talk</span><b>{tapSupported ? 'On' : 'Not here'}</b></div>
          <p>{tapSupported ? 'You see when ayna is listening, and your words go into the box for you to check. Your device or browser turns speech into text; ayna never records or keeps the audio.' : 'This device or browser has no speech input ayna can use. Type your question instead.'}</p>
        </li>
        <li>
          <button type="button" className="ay-voice__row" role="switch" aria-checked={shownOn} disabled={!support.available} onClick={() => setOn(writeWakeWordPref(!on))}>
            <span>Say “ayna” to start</span><b>{shownOn ? 'On' : 'Off'}</b>
          </button>
          <p>{support.available ? 'While the app is open, saying “ayna” starts listening. The listening stays on this phone and nothing is recorded or stored.' : support.reason}</p>
        </li>
      </ul>
    </div>
  );
}

/**
 * Mobile equivalent of ProfileChatbot.jsx, adapted to a full-screen overlay
 * instead of a corner-anchored panel (mobile has no room for that) and to
 * this app's own nav-style callbacks instead of desktop's. In the app's
 * Home tab it opens full screen from the "Ask ayna" bar (onBackHome draws a
 * Back to Home in place of Done). Tap-to-talk uses the web speech
 * API where the web view has it (useTapToTalk); no always-on listening.
 */
export default function AskAynaModal({
  open,
  enabled = true,
  profile,
  guide = { memories: [], trials: [], shareWithAsk: false },
  onGuideChange,
  recap = '',
  recapSources = '',
  recapExportable = true,
  // Her opt-in is on and nothing in the recap came from Oura or WHOOP (MobileApp).
  recapAskable = false,
  productNotes = [],
  allowGuideContext = false,
  onProfileUpdate,
  chatHistory = [],
  onChatHistoryUpdate,
  name,
  onViewRecommendations,
  onRequireAuth,
  seed = null,
  onClose = null,
  // Follow-ups: what she owns and can read, and where each chip goes.
  products = [],
  reads = [],
  hasHealthData = false,
  resolveProduct = null,
  onOpenProduct = null,
  onBrowse = null,
  onOpenDashboard = null,
  onOpenRead = null,
  // For "what's my % match for X": the same engine and inputs the cards use.
  matchOpts = undefined,
  focusProduct = null,
  // The Ask ayna tab: the same conversation as the tab's content, not a sheet
  // (no grabber, no Done, the tab bar stays below it).
  asTab = false,
  // Opened from Home's "Ask ayna" bar: full screen with Back to Home.
  onBackHome = null,
  // The chat-first Home (?home=chat, focus group): (leading) => the
  // Chat · Products · My dashboard switch, drawn in place of the title.
  renderHomeTop = null,
  // The end-of-rundown questions, as this session's starters: [{ question, context, usesHealth, buildContext }].
  starters = [],
  onStarter = null,
  // Text to put in the box (a Siri / Shortcuts link: co.aynahealth.app://ask?q=...): { id, text }.
  draft = null,
}) {
  const [messages, setMessages] = useState(chatHistory.length > 0 ? chatHistory : buildWelcome(name));
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  // The question that didn't go through: put back in the field and offered as
  // "Try again", so a dropped connection never loses what she typed.
  const [failedMsg, setFailedMsg] = useState('');
  const [session, setSession] = useState(undefined); // undefined = still checking
  // Signed out and the last question needed ayna's AI: that question, named
  // inline with why (QA M1). '' once a later question is answered.
  const [needsAccount, setNeedsAccount] = useState('');
  const [hasOpened, setHasOpened] = useState(open);
  // A bottom sheet: grabber, drag down to close (useSheetDrag).
  const { sheetRef, grabberProps } = useSheetDrag(onClose);
  useEffect(() => { if (open && sheetRef.current) { sheetRef.current.style.transform = ''; sheetRef.current.style.transition = ''; } }, [open, sheetRef]);
  // What she was looking at when she asked (e.g. her dashboard week), sent
  // along with this conversation's questions.
  const [screenContext, setScreenContext] = useState('');
  // Her opt-in for sending cycle and sleep data (src/health/askHealthPref.js).
  // Shown inline once, when a dashboard question could have used it.
  const askHealth = useAskHealthPref();
  const [healthAsk, setHealthAsk] = useState(null); // { buildContext } while the inline switch shows
  // Home (tiles + recent questions) until she asks something.
  const [home, setHome] = useState(true);
  // A true full-height sheet over the tab bar (Ask critique, Oct 27): no half detent any more.
  // (The tab and Home's full-screen chat were always full.)
  // Prompts grouped About you · Safety · Products, Safety first when flagged (components/ask/useAskSetup.js).
  const { safety, groups } = useAskSetup({ open, profile, matchOpts, products, signedIn: Boolean(session?.access_token), focusProduct, hasHealthData });
  const [guidePage, setGuidePage] = useState('');
  // Today's free Ask ayna chats are used: the locked card sits above the composer.
  const [askLock, setAskLock] = useState(false);
  // Back on the home view: start at the top, not where the chat was scrolled.
  useEffect(() => { if (home) bottomRef.current?.parentElement?.scrollTo({ top: 0 }); }, [home]);
  const seedDone = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const homeMode = Boolean(asTab && (onBackHome || renderHomeTop));
  // Opened from Home (the bar, or the end of the rundown): start on the chat's
  // first screen; a chip or a rundown question sends straight away (seed).
  useEffect(() => { if (open && homeMode && !(seed && seedDone.current !== seed.id)) { setHome(true); setGuidePage(''); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  // Tap to talk: her words go into the box, she checks them and taps Ask.
  const voice = useTapToTalk({ onText: (t) => { setInput((prev) => (prev ? `${prev} ${t}` : t)); requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true })); } });
  // "Say ayna" only with a native on-device listener and her switch on (never today).
  useEffect(() => {
    if (!open || !homeMode || !readWakeWordPref()) return undefined;
    let stop = () => {};
    let live = true;
    startWakeWord(() => { if (!voice.listening) voice.start(); }).then((fn) => { if (live) stop = fn; else fn(); });
    return () => { live = false; stop(); };
  }, [open, homeMode]); // eslint-disable-line react-hooks/exhaustive-deps
  const draftDone = useRef(null);
  useEffect(() => {
    if (!open || !draft?.id || draftDone.current === draft.id) return;
    draftDone.current = draft.id;
    setGuidePage('');
    setHome(true);
    setInput(String(draft.text || '').slice(0, 500));
  }, [open, draft]);

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

  // Opened by a tap on Ask: the question box takes focus (keyboard up). Never
  // on load or from a script (utils/delightRuntime.js, autofocus rules).
  // The box is disabled while the sign-in check runs, so the decision is
  // taken at open and the focus waits for the box to be ready.
  const wantFocus = useRef(false);
  useEffect(() => { wantFocus.current = open && !seed && mayAutoFocus(); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const inputReady = open && session !== undefined && !sending;
  useEffect(() => {
    if (!inputReady || !wantFocus.current) return undefined;
    wantFocus.current = false;
    const id = requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(id);
  }, [inputReady]);

  // A suggested question (from the dashboard): ask it once the sign-in check
  // is done. Signed out, it waits in the box so nothing is lost.
  useEffect(() => {
    if (!open || !seed || seedDone.current === seed.id || session === undefined || sending) return;
    seedDone.current = seed.id;
    setScreenContext(seed.context || '');
    let seenPrompt = false;
    try { seenPrompt = localStorage.getItem('ayna_ask_health_prompt_seen') === '1'; } catch { /* private mode */ }
    if (seed.usesHealth && typeof seed.buildContext === 'function' && !askHealth.on && !seenPrompt) {
      setHealthAsk({ buildContext: seed.buildContext });
      try { localStorage.setItem('ayna_ask_health_prompt_seen', '1'); } catch { /* private mode */ }
    } else setHealthAsk(null);
    // Signed out too: questions ayna answers on this phone (matches, history,
    // today, the rundown) are answered; the rest keep the question and ask to sign in.
    if (seed.question) { setGuidePage(''); send(seed.question, seed.context || '', Array.isArray(seed.stats) ? seed.stats : null); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, seed, session]);

  useEffect(() => {
    // Scroll only the message list: scrollIntoView also scrolls every
    // ancestor, which pushed the whole app shell up behind the sheet.
    const list = bottomRef.current?.parentElement;
    // Nothing asked yet (the chat-first Home, ?home=chat): open at the top so
    // "Hello" shows (QA M7). This runs after the home effect above, so it must
    // not push the empty list to its bottom.
    const asked = messages.some((m) => m.role === 'user');
    if (open && list) list.scrollTo(asked && !home ? { top: list.scrollHeight, behavior: 'smooth' } : { top: 0 });
    // Reopening preserves the existing scroll position.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // The sign-in note sits at the end of the list: bring it into view.
  useEffect(() => {
    const list = bottomRef.current?.parentElement;
    if (needsAccount && list) list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
  }, [needsAccount]);

  const send = async (msg, context = screenContext, stats = null) => {
    if (!msg || sending) return;
    // Answered on this device first (src/utils/askAnswer.js): her match from
    // the one engine (the same % the product shows), what helped, today, the
    // Safety questions, product facts and reads. Signed out too.
    const local = await localAnswer(msg, { profile, matchOpts, focusProduct, guideTrials: guide?.trials || [], guide: true, signedIn: Boolean(session?.access_token), safety }).catch(() => null);
    if (local) {
      setInput('');
      setSendError('');
      setFailedMsg('');
      // A later question answered here clears the stale "needs an account" note.
      setNeedsAccount('');
      setHome(false);
      const { answer, ...extras } = local;
      const next = [...messages, { role: 'user', text: msg }, { role: 'assistant', text: answer, ...extras, followUps: local.followUps || [] }];
      setMessages(next);
      onChatHistoryUpdate?.(next);
      return;
    }
    if (!session?.access_token) {
      // Kept in the box, so signing in (or closing the sheet) loses nothing.
      // No sign-in wall: the note names the question and offers Sign in.
      setInput(msg);
      setNeedsAccount(msg);
      return;
    }
    setNeedsAccount('');
    setInput('');
    setSendError('');
    setFailedMsg('');
    setHome(false);
    const userMsg = { role: 'user', text: msg, ...(stats?.length ? { stats } : {}) };
    const messagesWithUser = [...messages, userMsg];
    setMessages(messagesWithUser);
    setSending(true);

    try {
      const token = session?.access_token;
      if (!token) throw Object.assign(new Error('not_signed_in'), { code: 'not_signed_in' });
      const res = await fetchWithTimeout(apiUrl('/api/ask-ayna'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          message: msg,
          profileSummary: [summarizeProfile(profile || {}), allowGuideContext ? guideContext(guide) : ''].filter(Boolean).join('\n').slice(0, 2000),
          // Text only: the stat cards beside answers are hers to see, not to send.
          chatHistory: messages.slice(-6).map((m) => ({ role: m.role, text: m.text })),
          ...(context ? { screenContext: context } : {}),
          ...followUpRequestFields({ products, reads, hasHealthData }),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) throw Object.assign(new Error('not_signed_in'), { code: 'not_signed_in' });
      if (res.status === 429) throw Object.assign(new Error('weekly_limit_reached'), { code: 'weekly_limit_reached' });
      if (!res.ok || !data?.answer) throw new Error(data?.error || 'Could not get an answer right now.');

      const profileSummary = [summarizeProfile(profile || {}), allowGuideContext ? guideContext(guide) : ''].filter(Boolean).join('\n');
      const extras = await aiAnswerExtras(data, { msg, profileSent: Boolean(profileSummary), contextSent: Boolean(context), healthSent: Boolean(context && askHealth.on && healthAsk), resolveProduct, profile, matchOpts }).catch(() => ({ basedOn: ['ayna’s AI'], sources: [] }));
      const newMessages = [...messagesWithUser, { role: 'assistant', text: data.answer, ...extras, followUps: Array.isArray(data.followUps) ? data.followUps : [], ...(stats?.length ? { stats } : {}) }];

      const merged = mergeProfileUpdate(profile || {}, data.profileUpdate || {});
      if (merged) {
        const parts = [];
        if (merged.added.frustrations.length) parts.push(`Concerns: ${merged.added.frustrations.join(', ')}`);
        if (merged.added.sensitivities.length) parts.push(`Sensitivities: ${merged.added.sensitivities.join(', ')}`);
        if (merged.added.productsToAvoid.length) parts.push(`Avoiding: ${merged.added.productsToAvoid.join(', ')}`);
        if (merged.added.preference) parts.push(`Priority: ${merged.added.preference}`);
        newMessages.push({ role: 'system', text: `Remember this in your profile? ${parts.join(' · ')}.`, pendingProfile: merged.profile });
      }

      // A browse suggestion is now a chip under the answer (she reads the
      // answer first), not an automatic jump to Shop.
      const last = newMessages[messagesWithUser.length];
      if (data.browseIntent?.category && !last.followUps.some((f) => f.type === 'browse')) {
        const cat = String(data.browseIntent.category).slice(0, 40);
        last.followUps = [{ type: 'browse', intent: { category: cat }, label: `More ${cat.replace(/[-_]/g, ' ')}` }, ...last.followUps];
      }

      setMessages(newMessages);
      onChatHistoryUpdate?.(newMessages);
      if (data.limitReached && Number(data.usage?.limit) < 50) setAskLock(true);
    } catch (err) {
      if (err?.code !== 'not_signed_in' && err?.code !== 'weekly_limit_reached') {
        // Roll the unanswered question back out of the thread and keep it.
        setMessages(messages);
        setInput(msg);
        setFailedMsg(msg);
        haptic('warning');
      }
      if (err?.code === 'not_signed_in') {
        onRequireAuth?.('Ask ayna');
      } else if (err?.code === 'weekly_limit_reached') {
        setSendError("You've used this month's free Ask ayna chats. They reset on the 1st.");
      } else {
        setSendError(err?.message || 'ayna couldn’t answer just now. Check your connection and ask again in a moment.');
      }
    } finally {
      setSending(false);
    }
  };

  const runFollowUp = (f) => {
    if (f.type === 'ask') { send(f.text); return; }
    if (f.type === 'ask_else') { inputRef.current?.focus({ preventScroll: true }); return; }
    if (f.type === 'open_product') { const p = resolveProduct?.(f.productId); if (p) onOpenProduct?.(p); return; }
    if (f.type === 'browse') { onBrowse?.(f.intent || {}); return; }
    if (f.type === 'open_dashboard') { onOpenDashboard?.(); return; }
    if (f.type === 'open_guide' && ['recap', 'memory', 'trial', 'report'].includes(f.page)) { setGuidePage(f.page); return; }
    if (f.type === 'open_library') { const a = reads.find((r) => r.id === f.articleId); if (a) onOpenRead?.(a); }
  };

  const handleSend = (e) => {
    e.preventDefault();
    send(input.trim());
  };

  const decideProfile = (index, save) => {
    const pending = messages[index]?.pendingProfile;
    if (!pending) return;
    if (save) onProfileUpdate?.(pending);
    const next = messages.map((item, i) => i === index ? { role: 'system', text: save ? 'Added to your profile. You can edit it in Profile.' : 'Not saved.' } : item);
    setMessages(next);
    onChatHistoryUpdate?.(next);
  };

  if (!enabled || (!open && !hasOpened)) return null;

  const signedOut = session === null;
  const backBtn = !home && !guidePage
    ? <button type="button" aria-label="Back to Ask ayna home" onClick={() => setHome(true)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg></button>
    : null;
  const header = homeMode && renderHomeTop ? (<>
    <h1 className="sr-only">ayna chat</h1>
    {renderHomeTop(!home && !guidePage ? <button type="button" className="ay-home-top__back" aria-label="Back to the chat home" onClick={() => setHome(true)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg></button> : null)}
  </>) : (
    <AskHeader
      start={homeMode && onBackHome
        ? <button type="button" className="ay-chat-top__back" onClick={onBackHome}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>Today</button>
        : backBtn}
      end={<>
        {onClose && <button type="button" className="ay-ask-done" onClick={onClose}>Done</button>}
      </>}
    />
  );
  // "How Ask works": the honest split between this phone and ayna's AI, and her data choices.
  const how = (<>
    <p>Questions about your matches, what helped before, your day, your Daily Rundown, products and reads are answered on this phone, no account needed. Other questions use ayna’s AI and need a free account.</p>
    <p>Your cycle and sleep data goes to ayna’s AI only if you turn it on. Oura and WHOOP data is never sent.</p>
    <p>Every answer ends with its sources, marked by evidence level, and what it was based on. Not medical advice.</p>
    <p><button type="button" className="ay-askp-textbtn" onClick={() => setGuidePage('voice')}>Voice settings</button></p>
  </>);

  return (
    <div
      data-tour="chat"
      className={`ayna-ask-drawer${asTab ? ' is-tab' : ''}${homeMode ? ' is-home' : ''}${homeMode && onBackHome ? ' is-full' : ''}`}
      data-open={open ? 'true' : 'false'}
      data-detent="full"
      // As a sheet it covers the whole screen, tab bar included (the tab bar is hidden while it is open).
      style={{ position: 'absolute', inset: asTab ? '0 0 var(--ayna-bottom-nav-height) 0' : 0, zIndex: asTab ? 60 : 300, background: 'var(--ayna-bg)', display: 'flex', flexDirection: 'column' }}
    >
      <div ref={sheetRef} className="ayna-ask-drawer-content" role={asTab ? 'region' : 'dialog'} aria-label="Ask ayna" aria-modal={open && !asTab ? true : undefined} aria-hidden={!open} inert={!open ? true : undefined}>
      {onClose && <button {...grabberProps} aria-label="Close Ask ayna" />}
      <AskPanel
        variant={asTab ? 'tab' : 'sheet'}
        header={header}
        footer={<>
          {askLock && !guidePage && <div className="ay-ask-prolock"><ProLock variant="inline" feature="ask" onNotNow={() => setAskLock(false)} /></div>}
          {sendError && (
            <div className="ay-askp-pinned ay-ask-error" role="alert">
              <span>{sendError}</span>
              {failedMsg && <button type="button" onClick={() => { const q = failedMsg; setFailedMsg(''); send(q); }} disabled={sending}>Try again</button>}
            </div>
          )}
          {voice.listening && !guidePage && (
            <div className="ay-askp-pinned ay-listening" role="status" aria-live="polite">
              <i className="ay-listening__dot" aria-hidden="true" />
              <span>{voice.text ? `Listening: ${voice.text}` : 'Listening… say your question.'}</span>
              <button type="button" onClick={() => voice.stop()}>Done</button>
            </div>
          )}
          {voice.error && !voice.listening && !guidePage && (
            <div className="ay-askp-pinned ay-ask-error" role="alert"><span>{voice.error}</span><button type="button" onClick={voice.clearError}>OK</button></div>
          )}
        </>}
        composer={!guidePage && (
          <AskComposer
            value={input}
            onChange={setInput}
            onSubmit={handleSend}
            inputRef={inputRef}
            inputClassName="ay-ask-input"
            placeholder={session === undefined ? 'Loading…' : 'Ask anything…'}
            disabled={sending || session === undefined}
            sendDisabled={sending || !input.trim() || session === undefined}
            mic={{ supported: voice.supported, listening: voice.listening, disabled: sending || session === undefined, onToggle: () => (voice.listening ? voice.stop() : voice.start()) }}
          />
        )}
      >
        {guidePage === 'voice' ? <VoiceSettings tapSupported={voice.supported} onBack={() => setGuidePage('')} /> : guidePage ? (PRO_GUIDE_PAGES[guidePage] ? <ProFeatureGate feature={PRO_GUIDE_PAGES[guidePage]} onBack={() => setGuidePage('')}><AynaGuideHub page={guidePage} guide={guide} onChange={onGuideChange} recap={recap} recapSources={recapSources} recapExportable={recapExportable} productNotes={productNotes} profile={summarizeProfile(profile || {})} onAsk={recapExportable ? (question) => { setGuidePage(''); send(question, recapAskable ? recap : ''); } : null} onBack={() => setGuidePage('')} /></ProFeatureGate> : <AynaGuideHub page={guidePage} guide={guide} onChange={onGuideChange} recap={recap} recapSources={recapSources} recapExportable={recapExportable} productNotes={productNotes} profile={summarizeProfile(profile || {})} onAsk={recapExportable ? (question) => { setGuidePage(''); send(question, recapAskable ? recap : ''); } : null} onBack={() => setGuidePage('')} />) : null}
        {home && !sending && !guidePage && (
          <AskStart
            name={name ? String(name).split(' ')[0] : ''}
            intro={signedOut ? 'Quick answers need no account; other questions need a free one. Not medical advice.' : 'Uses your profile and checked sources. Not medical advice.'}
            how={how}
            // One segmented filter over one chip group (Ask critique, Oct 27): today's Rundown questions
            // (this session only), About you · Safety · Products, then her guide pages when signed in.
            groups={[
              ...(starters.length > 0 ? [{ id: 'rundown', title: 'From your Daily Rundown today', short: 'Rundown', prompts: starters.map((st) => ({ question: st.question, action: () => (onStarter ? onStarter(st) : send(st.question)) })) }] : []),
              ...groups,
              ...(session !== null && session !== undefined ? [{ id: 'guide', title: 'Your guide', short: 'Guide', prompts: [
                ['Your week: what changed for you', 'recap'], ['Memory: what ayna can remember', 'memory'], ['Try and check back', 'trial'], ['Appointment note', 'report'],
              ].map(([question, page]) => ({ question, action: () => setGuidePage(page) })) }] : []),
            ]}
            // A suggested question is sent on tap (founder, Oct 24 22:17); typing still waits for Send.
            onPick={(q) => send(q)}
            recent={recentQuestions(messages)}
            onContinue={messages.some((m) => m.role === 'user') ? () => setHome(false) : null}
          />
        )}
        {!guidePage && !(home && !sending) && messages.map((m, i) => (
          <AskMessage
            key={i}
            m={m}
            before={m.role === 'assistant' ? <AskStatCard stats={m.stats} /> : null}
            onOpenProduct={onOpenProduct && resolveProduct ? (p) => { const full = resolveProduct(p.id); if (full) onOpenProduct(full); } : null}
            onOpenRead={onOpenRead ? (id) => { const a = reads.find((r) => r.id === id); if (a) onOpenRead(a); } : null}
            after={<>
              {m.pendingProfile && <div className="ay-askp-acts"><button type="button" className="ay-askp-act is-primary" onClick={() => decideProfile(i, true)}>Remember</button><button type="button" className="ay-askp-act" onClick={() => decideProfile(i, false)}>Not now</button></div>}
              {m.role === 'assistant' && questionForAnswer(messages, i) && (
                <ShareAnswerButton
                  question={questionForAnswer(messages, i)}
                  answer={m.text}
                  sources={m.sources || []}
                  share={m.share || null}
                  onShareChange={(share) => {
                    const next = messages.map((x, j) => (j === i ? { ...x, share } : x));
                    setMessages(next);
                    onChatHistoryUpdate?.(next);
                  }}
                  session={session}
                  surface="app"
                />
              )}
              {m.role === 'assistant' && questionForAnswer(messages, i) && (
                <AskFollowUps
                  chips={chipsFor(m.followUps, {
                    hasDashboard: !!onOpenDashboard,
                    hasGuide: true,
                    canOpen: (f) => (f.type === 'open_product' ? !!(onOpenProduct && resolveProduct?.(f.productId)) : !!(onOpenRead && reads.some((r) => r.id === f.articleId))),
                  })}
                  disabled={sending}
                  onAction={runFollowUp}
                />
              )}
              {m.showViewRecommendations && onViewRecommendations && <button type="button" className="ay-askp-act" onClick={onViewRecommendations}>View recommendations</button>}
            </>}
          />
        ))}
        {sending && !guidePage && <div className="ay-askp-typing ay-typing" role="status" aria-label="Looking into it"><i /><i /><i /></div>}
        {/* The cycle and sleep switch is about ayna's AI: only signed in (QA round 2). */}
        {healthAsk && !guidePage && Boolean(session?.access_token) && (
          <div className="ay-ask-health">
            <p>{askHealth.on ? 'Your next questions here can use your cycle and sleep data. Oura and WHOOP data is never sent.' : 'This answer did not use your cycle and sleep data.'}</p>
            <button type="button" role="switch" aria-checked={askHealth.on} className="ay-ask-health__switch" onClick={() => {
              const next = !askHealth.on;
              askHealth.set(next);
              setScreenContext(healthAsk.buildContext(next));
            }}>
              <span>{ASK_HEALTH_LABEL}</span>
              <b aria-hidden="true">{askHealth.on ? 'On' : 'Off'}</b>
            </button>
          </div>
        )}
        {/* In the list, after the last message, so it never covers a card (QA round 2). */}
        {needsAccount && session === null && !guidePage && (
          <div className="ay-ask-account" role="status">
            <p>“{needsAccount.length > 90 ? `${needsAccount.slice(0, 88)}…` : needsAccount}” uses ayna’s AI, so it needs a free account. Your question is kept below.</p>
            <button type="button" onClick={() => onRequireAuth?.('Ask ayna')}>Sign in</button>
          </div>
        )}
        <div ref={bottomRef} />
      </AskPanel>
      </div>
    </div>
  );
}
