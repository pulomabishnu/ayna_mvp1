import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSheetDrag } from '../hooks/useSheetDrag.js';
import { useTapToTalk } from '../hooks/useTapToTalk.js';
import { homePrompts, askFromPrompt } from '../../utils/askPrompts.js';
import { getTodayAskContext, TODAY_ASK_EVENT } from '../../utils/askToday.js';

/** Today's context on this device, kept current as Today publishes it. */
function useTodayContext() {
  const [ctx, setCtx] = useState(getTodayAskContext);
  useEffect(() => {
    const on = () => setCtx(getTodayAskContext());
    on();
    window.addEventListener(TODAY_ASK_EVENT, on);
    return () => window.removeEventListener(TODAY_ASK_EVENT, on);
  }, []);
  return ctx;
}


/**
 * Home's "Ask ayna" sheet (team sync, Oct 25): slides up from the bar with
 * 3 or 4 prompts from her data (each with the fact it comes from), the
 * question box and the mic. Sending anything opens the full-screen chat.
 * A dialog: focus moves in, Escape and drag down close it, focus returns to
 * the bar. Reduced motion: no slide.
 */
export default function HomeAskSheet({ onClose, onAsk, signedIn = false, hasProfile = false }) {
  const ctx = useTodayContext();
  const prompts = homePrompts({ ctx, signedIn, hasProfile });
  const [text, setText] = useState('');
  const inputRef = useRef(null);
  const [opener] = useState(() => (typeof document !== 'undefined' ? document.activeElement : null));
  const finish = () => {
    onClose?.();
    try { if (opener?.isConnected) opener.focus({ preventScroll: true }); } catch { /* gone */ }
  };
  const { sheetRef, grabberProps, close } = useSheetDrag(finish);
  const voice = useTapToTalk({ onText: (t) => setText((prev) => (prev ? `${prev} ${t}` : t)) });
  useEffect(() => { sheetRef.current?.querySelector('.ay-asksheet__prompts button, .ay-asksheet__input')?.focus({ preventScroll: true }); }, [sheetRef]);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab') return;
      const nodes = [...(sheetRef.current?.querySelectorAll('button:not([disabled]), input:not([disabled])') || [])];
      if (!nodes.length) return;
      if (e.shiftKey && document.activeElement === nodes[0]) { e.preventDefault(); nodes[nodes.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === nodes[nodes.length - 1]) { e.preventDefault(); nodes[0].focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  const ask = (req) => { if (voice.listening) voice.stop(); onClose?.(); onAsk?.(req); };
  const submit = (e) => { e.preventDefault(); const q = text.trim(); if (q) ask({ question: q }); };

  const node = (
    <div className="ay-asksheet-layer">
      <div className="ay-asksheet-dim" aria-hidden="true" onClick={close} />
      <section ref={sheetRef} className="ay-asksheet" data-tour="ask-sheet" role="dialog" aria-modal="true" aria-labelledby="ay-asksheet-h">
        <button {...grabberProps} aria-label="Close Ask ayna" />
        <h2 id="ay-asksheet-h">Ask ayna</h2>
        {prompts.length > 0 && (
          <ul className="ay-asksheet__prompts" data-tour="ask-prompts" aria-label="From your data">
            {prompts.map((p) => (
              <li key={p.question}>
                <button type="button" onClick={() => ask(askFromPrompt(p))}>
                  <span className="ay-asksheet__reason">{p.reason}</span>
                  <span className="ay-asksheet__q">{p.question}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {voice.listening && <p className="ay-listening" role="status"><i className="ay-listening__dot" aria-hidden="true" /><span>{voice.text ? `Listening: ${voice.text}` : 'Listening… say your question.'}</span></p>}
        {voice.error && !voice.listening && <p className="ay-asksheet__error" role="alert">{voice.error}</p>}
        <form className="ay-asksheet__form" onSubmit={submit}>
          {voice.supported && (
            <button type="button" className="ay-mic" aria-pressed={voice.listening} aria-label={voice.listening ? 'Stop listening' : 'Speak your question'} onClick={() => (voice.listening ? voice.stop() : voice.start())}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" /></svg>
            </button>
          )}
          <input ref={inputRef} type="text" className="ay-asksheet__input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask about your health, a product, your day…" aria-label="Your question" />
          <button type="submit" className="ay-asksheet__send" disabled={!text.trim()}>Ask</button>
        </form>
        <p className="ay-asksheet__note">Not medical advice.</p>
      </section>
    </div>
  );
  const host = (typeof document !== 'undefined' && document.querySelector('.ayna-mobile')) || null;
  return host ? createPortal(node, host) : node;
}
