import { useEffect, useRef, useState } from 'react';

import { getSupabaseClient } from '../../utils/supabaseClient.js';
import { renderMarkdownLite } from '../../utils/renderMarkdownLite.jsx';
import { apiUrl } from '../../utils/apiUrl.js';
import ShareAnswerButton from '../../components/ShareAnswerButton.jsx';
import { questionForAnswer } from '../../utils/sharedAnswer.js';
import AskFollowUps from '../../components/AskFollowUps.jsx';
import { chipsFor, followUpRequestFields } from '../../utils/askFollowUps.js';
import { fetchWithTimeout } from '../../utils/network.js';
import { haptic } from '../../utils/haptics.js';
import { useSheetDrag } from '../hooks/useSheetDrag.js';
import AskHome, { AskStatCard } from '../../components/AskHome.jsx';
import { recentQuestions } from '../../utils/askRecent.js';
import { mayAutoFocus } from '../../utils/delightRuntime.js';
import { guideContext } from '../utils/aynaGuide.js';
import AynaGuideHub from './AynaGuideHub.jsx';

// Ask ayna's first screen: tiles fill the box so she can edit before asking.
function askTiles(hasHealthData) {
  return [
    { label: 'Ask about your week', sub: hasHealthData ? 'Read against your cycle' : 'Best with health data connected', question: 'What stands out in my health data this week?', icon: 'week', tone: 'pink', isNew: true },
    { label: 'What helps with cramps?', question: 'What helps with cramps?', icon: 'cramps', tone: 'sky' },
    { label: 'Is this safe with my birth control?', question: 'Is this safe with my birth control?', icon: 'safety', tone: 'group' },
    { label: 'Explain my top match', sub: 'Why it fits you, with the evidence', question: 'Explain my top match', icon: 'match', tone: 'ink' },
  ];
}

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

function buildWelcome() {
  return [{ role: 'assistant', text: 'What are you looking for?' }];
}

/**
 * Mobile equivalent of ProfileChatbot.jsx, adapted to a full-screen overlay
 * instead of a corner-anchored panel (mobile has no room for that) and to
 * this app's own nav-style callbacks instead of desktop's. Voice ("Talk")
 * mode is intentionally left out, it depends on the browser
 * SpeechRecognition API, which the Capacitor WKWebView shell doesn't
 * support without a native plugin this change doesn't add.
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
}) {
  const [messages, setMessages] = useState(chatHistory.length > 0 ? chatHistory : buildWelcome(name));
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  // The question that didn't go through: put back in the field and offered as
  // "Try again", so a dropped connection never loses what she typed.
  const [failedMsg, setFailedMsg] = useState('');
  const [session, setSession] = useState(undefined); // undefined = still checking
  const [hasOpened, setHasOpened] = useState(open);
  // A bottom sheet: grabber, drag down to close (useSheetDrag).
  const { sheetRef, grabberProps } = useSheetDrag(onClose);
  useEffect(() => { if (open && sheetRef.current) { sheetRef.current.style.transform = ''; sheetRef.current.style.transition = ''; } }, [open, sheetRef]);
  // What she was looking at when she asked (e.g. her dashboard week), sent
  // along with this conversation's questions.
  const [screenContext, setScreenContext] = useState('');
  // Home (tiles + recent questions) until she asks something.
  const [home, setHome] = useState(true);
  const [guidePage, setGuidePage] = useState('');
  // Back on the home view: start at the top, not where the chat was scrolled.
  useEffect(() => { if (home) bottomRef.current?.parentElement?.scrollTo({ top: 0 }); }, [home]);
  const seedDone = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

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
    if (session?.access_token) { setGuidePage(''); send(seed.question, seed.context || '', Array.isArray(seed.stats) ? seed.stats : null); }
    else setInput(seed.question);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, seed, session]);

  useEffect(() => {
    // Scroll only the message list: scrollIntoView also scrolls every
    // ancestor, which pushed the whole app shell up behind the sheet.
    const list = bottomRef.current?.parentElement;
    if (open && list) list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
    // Reopening preserves the existing scroll position.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const send = async (msg, context = screenContext, stats = null) => {
    if (!msg || sending) return;
    if (!session?.access_token) { onRequireAuth?.('Ask ayna'); return; }
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
          chatHistory: messages.slice(-6),
          ...(context ? { screenContext: context } : {}),
          ...followUpRequestFields({ products, reads, hasHealthData }),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) throw Object.assign(new Error('not_signed_in'), { code: 'not_signed_in' });
      if (res.status === 429) throw Object.assign(new Error('weekly_limit_reached'), { code: 'weekly_limit_reached' });
      if (!res.ok || !data?.answer) throw new Error(data?.error || 'Could not get an answer right now.');

      const newMessages = [...messagesWithUser, { role: 'assistant', text: data.answer, followUps: Array.isArray(data.followUps) ? data.followUps : [], ...(stats?.length ? { stats } : {}) }];

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
        setSendError("You've used your free chats for this week. They reset weekly.");
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

  return (
    <div
      className="ayna-ask-drawer"
      data-open={open ? 'true' : 'false'}
      style={{
        position: 'absolute',
        inset: '0 0 var(--ayna-bottom-nav-height) 0',
        zIndex: 60,
        background: 'var(--ayna-bg)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div ref={sheetRef} className="ayna-ask-drawer-content" role="dialog" aria-label="Ask ayna" aria-modal={open ? true : undefined} aria-hidden={!open} inert={!open ? true : undefined}>
      {onClose && <button {...grabberProps} aria-label="Close Ask ayna" />}
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
        {!home && !guidePage && (
          <button type="button" className="ay-askh-homebtn" aria-label="Back to Ask ayna home" onClick={() => setHome(true)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
          </button>
        )}
        <div style={{ flex: 1 }}>
          <h1 className="ay-ask-title">Ask ayna</h1>
        </div>
        {onClose && <button type="button" className="ay-ask-done" onClick={onClose}>Done</button>}
      </div>

      <div className={home && !sending ? 'ay-askh-scroll' : undefined} style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {guidePage ? <AynaGuideHub page={guidePage} guide={guide} onChange={onGuideChange} recap={recap} recapSources={recapSources} recapExportable={recapExportable} productNotes={productNotes} profile={summarizeProfile(profile || {})} onAsk={recapExportable ? (question) => { setGuidePage(''); send(question, recap); } : null} onBack={() => setGuidePage('')} /> : null}
        {home && !sending && !guidePage && (<>
          <div className="ay-guide-launches" aria-label="Your personal guide">
            <button type="button" onClick={() => setGuidePage('recap')}>Your week<span>What changed for you</span></button>
            <button type="button" onClick={() => setGuidePage('memory')}>Memory<span>What ayna can remember</span></button>
            <button type="button" onClick={() => setGuidePage('trial')}>Try & check back<span>See how it felt later</span></button>
            <button type="button" onClick={() => setGuidePage('report')}>Appointment note<span>Review before sharing</span></button>
          </div>
          <AskHome
            name={name ? String(name).split(' ')[0] : ''}
            intro="Ask about a product, your week, or what to try. Not medical advice."
            tiles={askTiles(hasHealthData)}
            recent={recentQuestions(messages)}
            onPick={(q) => { setInput(q); inputRef.current?.focus({ preventScroll: true }); }}
            onContinue={messages.some((m) => m.role === 'user') ? () => setHome(false) : null}
          />
        </>)}
        {!guidePage && !(home && !sending) && messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {m.role === 'assistant' && <AskStatCard stats={m.stats} />}
            <div
              style={{
                maxWidth: '85%',
                background: m.role === 'user' ? 'var(--ayna-heading)' : 'var(--d-group, transparent)',
                color: m.role === 'user' ? 'var(--ayna-bg)' : 'var(--ayna-text)',
                border: 0,
                borderRadius: m.role === 'user' ? '18px 18px 6px 18px' : '18px 18px 18px 6px',
                padding: '11px 14px',
                fontWeight: 400, fontSize: 'calc(15px * var(--ayna-text-scale, 1))',
                lineHeight: 1.45,
                whiteSpace: 'pre-wrap',
              }}
            >
              {m.role === 'assistant' ? renderMarkdownLite(m.text) : m.text}
            </div>
            {m.pendingProfile && <div className="ay-guide-actions" style={{ marginTop: 6 }}><button type="button" onClick={() => decideProfile(i, true)}>Remember</button><button type="button" onClick={() => decideProfile(i, false)}>Not now</button></div>}
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
            {m.showViewRecommendations && onViewRecommendations && (
              <button
                type="button"
                className="ay-ask-viewrecs"
                onClick={onViewRecommendations}
                style={{
                  marginTop: 6,
                  fontFamily: "var(--ayna-font-ui)",
                  fontWeight: 500,
                  fontSize: 'calc(13px * var(--ayna-text-scale, 1))',
                  color: 'var(--ayna-accent-dark)',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                View recommendations →
              </button>
            )}
          </div>
        ))}
        {sending && !guidePage && <div className="ay-typing" role="status" aria-label="Looking into it"><i /><i /><i /></div>}
        <div ref={bottomRef} />
      </div>

      {sendError && (
        <div className="ay-ask-error" role="alert">
          <span>{sendError}</span>
          {failedMsg && <button type="button" onClick={() => { const q = failedMsg; setFailedMsg(''); send(q); }} disabled={sending}>Try again</button>}
        </div>
      )}

      {!guidePage && <form
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
          ref={inputRef}
          type="text"
          className="ay-ask-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={session === undefined ? 'Loading…' : 'Ask ayna anything…'}
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
            fontWeight: 500,
            fontSize: 'calc(13px * var(--ayna-text-scale, 1))',
            cursor: 'pointer',
            opacity: sending || !input.trim() || session === undefined ? 0.5 : 1,
          }}
        >
          Ask
        </button>
      </form>}
      </div>
    </div>
  );
}
