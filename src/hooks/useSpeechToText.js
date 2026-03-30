import { useRef, useState, useEffect, useCallback } from 'react';

/**
 * Web Speech API (Chrome/Edge) — continuous dictation with final segments accumulated.
 * Same pattern as Quiz voice flow.
 */
export function useSpeechToText() {
  const recognitionRef = useRef(null);
  const transcriptAccumRef = useRef('');
  const lastInterimRef = useRef('');
  const [isRecording, setIsRecording] = useState(false);
  const [liveText, setLiveText] = useState('');
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setSupported(
      'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
    );
  }, []);

  const start = useCallback(() => {
    if (typeof window === 'undefined') return false;
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return false;
    transcriptAccumRef.current = '';
    lastInterimRef.current = '';
    setLiveText('');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.onresult = (e) => {
      let interimChunk = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        const transcript = String(result[0]?.transcript || '').trim();
        if (!transcript) continue;
        if (result.isFinal) {
          const sep = transcriptAccumRef.current ? ' ' : '';
          transcriptAccumRef.current += sep + transcript;
        } else {
          interimChunk = transcript;
        }
      }
      lastInterimRef.current = interimChunk;
      const display = transcriptAccumRef.current
        + (interimChunk ? `${transcriptAccumRef.current ? ' ' : ''}${interimChunk}` : '');
      setLiveText(display.trim());
    };
    rec.onerror = () => {};
    rec.start();
    recognitionRef.current = rec;
    setIsRecording(true);
    return true;
  }, []);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
    const pending = lastInterimRef.current.trim();
    lastInterimRef.current = '';
    let out = transcriptAccumRef.current.trim();
    if (pending && !out.toLowerCase().includes(pending.toLowerCase())) {
      out = out ? `${out} ${pending}` : pending;
    }
    transcriptAccumRef.current = '';
    setLiveText('');
    return out.trim();
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
        recognitionRef.current = null;
      }
    };
  }, []);

  return { isRecording, liveText, start, stop, supported };
}
