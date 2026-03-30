import { useRef, useState, useEffect, useCallback } from 'react';

/**
 * Web Speech API (Chrome/Edge) — continuous dictation with final segments accumulated.
 * Same pattern as Quiz voice flow.
 */
export function useSpeechToText() {
  const recognitionRef = useRef(null);
  const transcriptAccumRef = useRef('');
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
    setLiveText('');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        const transcript = result[0].transcript;
        if (result.isFinal && transcript.trim()) {
          const sep = transcriptAccumRef.current ? ' ' : '';
          transcriptAccumRef.current += sep + transcript.trim();
        }
      }
      setLiveText(transcriptAccumRef.current);
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
    const out = transcriptAccumRef.current.trim();
    transcriptAccumRef.current = '';
    setLiveText('');
    return out;
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
