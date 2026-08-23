import React, { useState, useRef, useEffect } from 'react';
import { useSpeechToText } from '../hooks/useSpeechToText';
import SearchMicButton from './SearchMicButton';

// Keyword → profile update. Used to merge chat message into profile (frustrations, sensitivities, preference).
function parseMessageIntoProfile(message, currentProfile) {
  const text = (message || '').toLowerCase().trim();
  if (!text) return null;
  const profile = {
    ...currentProfile,
    frustrations: Array.isArray(currentProfile.frustrations) ? [...currentProfile.frustrations] : [],
    sensitivities: Array.isArray(currentProfile.sensitivities) ? [...currentProfile.sensitivities] : [],
    productsToAvoid: Array.isArray(currentProfile.productsToAvoid) ? [...currentProfile.productsToAvoid] : [],
  };

  const added = { frustrations: [], sensitivities: [], productsToAvoid: [], preference: null };

  // Frustrations / concerns (pad/pads trigger navigation only, not profile update)
  const frustrationPhrases = [
    { keys: ['heavy', 'heavy flow', 'heavy period'], value: 'Heavy flow' },
    { keys: ['cramp', 'pain', 'painful period'], value: 'Painful cramps' },
    { keys: ['bloat', 'bloating', 'hormonal bloating', 'water retention', 'puffy'], value: 'Hormonal bloating' },
    { keys: ['irregular', 'cycle', 'period irregular'], value: 'Irregular cycles' },
    { keys: ['leak', 'stain', 'leaks'], value: 'Leaks & staining' },
    { keys: ['discomfort', 'uncomfortable'], value: 'General discomfort' },
    { keys: ['safe', 'safety', 'product safe'], value: 'Not sure if products are safe' },
    { keys: ['uti', 'urinary', 'bladder infection'], value: 'Recurrent UTIs' },
    { keys: ['pcos'], value: 'PCOS symptoms' },
    { keys: ['pelvic', 'pelvic pain'], value: 'Pelvic pain' },
    { keys: ['menopause', 'menopausal', 'hot flash'], value: 'Menopause symptoms' },
    { keys: ['endometriosis', 'endo'], value: 'Endometriosis' },
    { keys: ['fertility', 'ttc', 'trying to conceive', 'pregnant'], value: 'Fertility / TTC' },
  ];
  frustrationPhrases.forEach(({ keys, value }) => {
    if (keys.some(k => text.includes(k)) && !profile.frustrations.includes(value)) {
      profile.frustrations.push(value);
      added.frustrations.push(value);
    }
  });

  // Sensitivities
  const sensitivityPhrases = [
    { keys: ['fragrance', 'scent', 'perfume'], value: 'Fragrance sensitivity' },
    { keys: ['latex'], value: 'Latex allergy' },
    { keys: ['synthetic', 'plastic'], value: 'Synthetic materials' },
    { keys: ['allerg', 'allergy', 'sensitive skin'], value: 'Other allergies' },
  ];
  sensitivityPhrases.forEach(({ keys, value }) => {
    if (keys.some(k => text.includes(k)) && !profile.sensitivities.includes(value)) {
      profile.sensitivities.push(value);
      added.sensitivities.push(value);
    }
  });

  // Products/ingredients to avoid (e.g. "bad experience with essential oils", "don't want to use X")
  const avoidPhrases = [
    { keys: ['essential oil', 'essential oils', 'lavender oil', 'peppermint', 'mint oil', 'herbal-infused', 'bad experience with oil', 'bad experience with mint', 'bad experience with lavender'], value: 'Essential oils' },
    { keys: ['don\'t want fragrance', 'dont want fragrance', 'avoid fragrance', 'don\'t want scented', 'bad experience with fragrance'], value: 'Fragrance / scented products' },
    { keys: ['don\'t want latex', 'avoid latex', 'bad experience with latex'], value: 'Latex' },
    { keys: ['don\'t want synthetic', 'avoid synthetic'], value: 'Synthetic materials' },
  ];
  avoidPhrases.forEach(({ keys, value }) => {
    if (keys.some(k => text.includes(k)) && !profile.productsToAvoid.includes(value)) {
      profile.productsToAvoid.push(value);
      added.productsToAvoid.push(value);
    }
  });
  if ((text.includes('bad experience') || text.includes('don\'t want') || text.includes('dont want') || text.includes('won\'t use') || text.includes('wont use')) && (text.includes('essential') || text.includes('oil') || text.includes('mint') || text.includes('lavender')) && !profile.productsToAvoid.includes('Essential oils')) {
    profile.productsToAvoid.push('Essential oils');
    added.productsToAvoid.push('Essential oils');
  }

  // Preference
  if (text.includes('organic') || text.includes('clean ingredient') || text.includes('natural')) {
    profile.preference = 'Organic/Natural only';
    added.preference = profile.preference;
  } else if (text.includes('cost') || text.includes('cheap') || text.includes('budget')) {
    profile.preference = 'Lower cost';
    added.preference = profile.preference;
  } else if (text.includes('comfort') || text.includes('convenience')) {
    profile.preference = 'Comfort/Convenience';
    added.preference = profile.preference;
  } else if (text.includes('privacy') || text.includes('data')) {
    profile.preference = 'Privacy & data security';
    added.preference = profile.preference;
  } else if (text.includes('sustainab') || text.includes('eco') || text.includes('zero waste')) {
    profile.preference = 'Sustainability/Zero-waste';
    added.preference = profile.preference;
  }

  const hasChanges = added.frustrations.length > 0 || added.sensitivities.length > 0 || added.productsToAvoid.length > 0 || added.preference;
  return hasChanges ? { profile, added } : null;
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

export default function ProfileChatbot({ profile, user, onProfileUpdate, chatHistory = [], onChatHistoryUpdate, disabled, onNavigateToDiscovery }) {
  const firstName = getFirstName(user);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(
    chatHistory?.length > 0 ? chatHistory : buildWelcome(firstName)
  );
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
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

  const handleSend = (e) => {
    e.preventDefault();
    const msg = input.trim();
    if (!msg || sending || disabled) return;
    setInput('');
    const userMsg = { role: 'user', text: msg };
    setSending(true);

    const text = msg.toLowerCase();
    const wantsPads = text.includes('pad') || text.includes('pads') || text.includes('period pad');
    const wantsSupplements = text.includes('supplement') && (text.includes('cramp') || text.includes('bloat') || text.includes('pcos') || text.includes('menopause') || text.includes('uti'));

    const result = parseMessageIntoProfile(msg, profile || {});
    let assistantText;
    if (result) {
      onProfileUpdate(result.profile);
      const parts = [];
      if (result.added.frustrations.length) parts.push(`Added concerns: ${result.added.frustrations.join(', ')}.`);
      if (result.added.sensitivities.length) parts.push(`Added sensitivities: ${result.added.sensitivities.join(', ')}.`);
      if (result.added.productsToAvoid.length) parts.push(`We'll avoid recommending: ${result.added.productsToAvoid.join(', ')}.`);
      if (result.added.preference) parts.push(`Updated priority: ${result.added.preference}.`);
      assistantText = `Got it. ${parts.join(' ')} Your profile and recommendations have been updated.`;
      if (wantsPads && onNavigateToDiscovery) {
        const opts = { query: 'pads', initialCategory: 'pad' };
        if (text.includes('heavy')) opts.initialPadFlow = 'heavy';
        if (text.includes('organic')) opts.initialPadPreference = 'organic';
        if (text.includes('overnight')) opts.initialPadUseCase = 'overnight';
        onNavigateToDiscovery(opts);
        assistantText += " I've opened Discovery filtered to pads for you.";
      } else if (wantsSupplements && onNavigateToDiscovery) {
        const opts = { query: msg, initialCategory: 'supplement' };
        if (text.includes('cramp')) opts.initialSymptom = 'cramps';
        else if (text.includes('bloat')) opts.initialSymptom = 'bloating';
        else if (text.includes('pcos')) opts.initialSymptom = 'pcos';
        else if (text.includes('menopause')) opts.initialSymptom = 'menopause';
        else if (text.includes('uti')) opts.initialSymptom = 'uti';
        onNavigateToDiscovery(opts);
        assistantText += " I've opened Discovery filtered to supplements for you.";
      }
    } else if (wantsPads && onNavigateToDiscovery) {
      const opts = { query: 'pads', initialCategory: 'pad' };
      if (text.includes('heavy')) opts.initialPadFlow = 'heavy';
      if (text.includes('organic')) opts.initialPadPreference = 'organic';
      if (text.includes('overnight')) opts.initialPadUseCase = 'overnight';
      onNavigateToDiscovery(opts);
      assistantText = "I've opened Discovery filtered to pads for you. Browse and compare to find your best fit.";
    } else if (wantsSupplements && onNavigateToDiscovery) {
      const opts = { query: msg, initialCategory: 'supplement' };
      if (text.includes('cramp')) opts.initialSymptom = 'cramps';
      else if (text.includes('bloat')) opts.initialSymptom = 'bloating';
      else if (text.includes('pcos')) opts.initialSymptom = 'pcos';
      else if (text.includes('menopause')) opts.initialSymptom = 'menopause';
      else if (text.includes('uti')) opts.initialSymptom = 'uti';
      onNavigateToDiscovery(opts);
      assistantText = "I've opened Discovery filtered to supplements for you. Browse by symptom to find options.";
    } else {
      assistantText = "Thanks for sharing. I didn't spot specific concerns or preferences to add. Try phrases like 'I have heavy flow' or 'I prefer organic products.' You can also retake the quiz to change your answers.";
    }
    const assistantMsg = { role: 'assistant', text: assistantText };
    const newMessages = [...messages, userMsg, assistantMsg];
    setMessages(newMessages);
    onChatHistoryUpdate?.(newMessages);
    setSending(false);
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
              <div
                key={i}
                className={`ayna-ask-message ${
                  m.role === 'user'
                    ? 'ayna-ask-message--user'
                    : 'ayna-ask-message--ayna'
                }`}
              >
                {m.text}
              </div>
            ))}

            {sending && (
              <div className="ayna-ask-message ayna-ask-message--ayna ayna-ask-message--typing">
                Thinking…
              </div>
            )}

            <div ref={bottomRef} />
          </div>

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
