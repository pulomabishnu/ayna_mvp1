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

const DEFAULT_WELCOME = [{ role: 'assistant', text: "Hi! I'm Ayna. Speak or type your health needs — for example, 'I have endometriosis' or 'I'm sensitive to fragrance.' We combine this chat with your quiz, imported records, and wearable summary to personalize your ecosystem and recommendations." }];

export default function ProfileChatbot({ profile, onProfileUpdate, chatHistory = [], onChatHistoryUpdate, disabled, onNavigateToDiscovery }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(chatHistory?.length > 0 ? chatHistory : DEFAULT_WELCOME);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const speech = useSpeechToText();

  const toggleVoice = () => {
    if (speech.isRecording) {
      const t = speech.stop();
      if (t) setInput((prev) => (prev.trim() ? `${prev.trim()} ${t}` : t));
    } else {
      speech.start();
    }
  };

  useEffect(() => {
    if (chatHistory?.length > 0) setMessages(chatHistory);
  }, [chatHistory?.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      assistantText = "Thanks for sharing. I didn't spot specific concerns or preferences to add — try phrases like 'I have heavy flow' or 'I prefer organic products.' You can also retake the quiz to change your answers.";
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
        aria-label="Open profile chatbot"
        onClick={() => setOpen(!open)}
        disabled={disabled}
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'var(--color-primary)',
          color: 'white',
          border: 'none',
          boxShadow: 'var(--shadow-lg)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        💬
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: '5rem',
            right: '1.5rem',
            width: 'min(380px, calc(100vw - 2rem))',
            maxHeight: '420px',
            background: 'var(--color-surface-soft)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--color-border)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>Tell Ayna more</span>
            <button type="button" aria-label="Close" onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--color-text-muted)' }}>×</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '90%',
                  padding: '0.75rem 1rem',
                  borderRadius: '1rem',
                  background: m.role === 'user' ? 'var(--color-primary)' : 'var(--color-bg)',
                  color: m.role === 'user' ? 'white' : 'var(--color-text-main)',
                  fontSize: '0.9rem',
                  lineHeight: 1.4,
                }}
              >
                {m.text}
              </div>
            ))}
            {sending && (
              <div style={{ alignSelf: 'flex-start', padding: '0.5rem 0.75rem', background: 'var(--color-bg)', borderRadius: '0.75rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                Updating…
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={handleSend} style={{ padding: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. I have endometriosis, I prefer organic…"
                disabled={disabled || sending || speech.isRecording}
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-pill)',
                  border: '1px solid var(--color-border)',
                  outline: 'none',
                  fontSize: '0.95rem',
                }}
              />
              {speech.supported && (
                <SearchMicButton
                  variant="primary"
                  size="compact"
                  isRecording={speech.isRecording}
                  disabled={disabled || sending}
                  onClick={toggleVoice}
                />
              )}
            </div>
            {speech.isRecording && (
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: '0.35rem 0 0', lineHeight: 1.4 }}>
                Listening… {speech.liveText ? <span style={{ color: 'var(--color-text-main)' }}>{speech.liveText}</span> : '(speak now)'}
              </p>
            )}
          </form>
        </div>
      )}
    </>
  );
}
