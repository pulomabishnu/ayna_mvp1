import { useEffect, useState } from 'react';

const DEFAULT_STATUSES = [
  'matching symptoms to evidence',
  'filtering for your medicine cabinet',
  'fitting your budget',
  'arranging your pillars',
];

export default function BuildingScreen({ onFinish, statuses = DEFAULT_STATUSES, headline = 'Reading your answers' }) {
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const stepTimers = statuses.map((_, i) => setTimeout(() => setStatusIndex(i), 900 * i));
    const finishTimer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 900 * statuses.length + 300);
    return () => {
      stepTimers.forEach(clearTimeout);
      clearTimeout(finishTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(165deg,#242A52 0%,#4E3866 58%,#A2603C 100%)',
        color: '#FFFCF9',
        padding: 40,
        animation: 'ay-page .25s ease-out',
      }}
    >
      <div style={{ position: 'relative', width: 150, height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 34 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 99, border: '1px solid rgba(255,255,255,.3)', animation: 'ay-pulse 2.6s ease-out infinite' }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: 99, border: '1px solid rgba(255,255,255,.3)', animation: 'ay-pulse 2.6s ease-out infinite 1.3s' }} />
        <div style={{ width: 66, height: 66, borderRadius: 99, background: '#FFC774', animation: 'ay-float 3.4s ease-in-out infinite' }} />
      </div>
      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, textAlign: 'center', lineHeight: 1.3 }}>{headline}</div>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, letterSpacing: '.6px', opacity: 0.72, marginTop: 12, textAlign: 'center' }}>
        {statuses[statusIndex]}
      </div>
    </div>
  );
}
