import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Tap to talk in the ayna chat. Uses the Web Speech API where the browser or
 * the app's web view has it (Safari and the iOS app need the speech and mic
 * permission strings in Info.plist; Chrome uses its own speech service).
 * She starts it, she sees it listening, she stops it; the words go into the
 * question box for her to check before asking. ayna never records or keeps
 * the audio. No always-on listening here (see src/mobile/utils/wakeWord.js).
 *
 * @returns {{ supported, listening, text, error, start, stop }}
 */
export function speechRecognitionCtor(win = typeof window !== 'undefined' ? window : null) {
  return win ? win.SpeechRecognition || win.webkitSpeechRecognition || null : null;
}

export function useTapToTalk({ onText, lang = 'en-US' } = {}) {
  const [supported] = useState(() => Boolean(speechRecognitionCtor()));
  const [listening, setListening] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const recRef = useRef(null);
  const finalRef = useRef('');
  const interimRef = useRef('');
  const onTextRef = useRef(onText);
  useEffect(() => { onTextRef.current = onText; });

  const finish = useCallback(() => {
    const rec = recRef.current;
    recRef.current = null;
    if (rec) { rec.onresult = null; rec.onerror = null; rec.onend = null; try { rec.stop(); } catch { /* already stopped */ } }
    const out = `${finalRef.current} ${interimRef.current}`.replace(/\s+/g, ' ').trim();
    finalRef.current = '';
    interimRef.current = '';
    setListening(false);
    setText('');
    if (out) onTextRef.current?.(out);
    return out;
  }, []);

  const start = useCallback(() => {
    const Ctor = speechRecognitionCtor();
    if (!Ctor || recRef.current) return false;
    setError('');
    finalRef.current = '';
    interimRef.current = '';
    let rec;
    try { rec = new Ctor(); } catch { setError('Voice input is not available here. Type your question instead.'); return false; }
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i += 1) {
        const r = e.results[i];
        const t = String(r[0]?.transcript || '').trim();
        if (!t) continue;
        if (r.isFinal) finalRef.current = `${finalRef.current} ${t}`.trim();
        else interim = t;
      }
      interimRef.current = interim;
      setText(`${finalRef.current} ${interim}`.trim());
    };
    rec.onerror = (e) => {
      const code = e?.error || '';
      if (code === 'no-speech' || code === 'aborted') { finish(); return; }
      setError(code === 'not-allowed' || code === 'service-not-allowed'
        ? 'ayna needs microphone and speech permission for voice. You can turn it on in Settings, or type instead.'
        : 'Voice input stopped. Type your question, or tap the mic to try again.');
      finish();
    };
    // The browser can end the session on its own (silence): keep what she said.
    rec.onend = () => { if (recRef.current === rec) finish(); };
    try { rec.start(); } catch { setError('Voice input is not available here. Type your question instead.'); return false; }
    recRef.current = rec;
    setListening(true);
    return true;
  }, [lang, finish]);

  useEffect(() => () => { const rec = recRef.current; recRef.current = null; if (rec) { rec.onend = null; try { rec.abort ? rec.abort() : rec.stop(); } catch { /* gone */ } } }, []);

  return { supported, listening, text, error, start, stop: finish, clearError: () => setError('') };
}
