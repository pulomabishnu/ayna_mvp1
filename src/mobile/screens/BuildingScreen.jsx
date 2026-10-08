import { useEffect, useState } from 'react';

const DEFAULT_STATUSES = [
  'matching symptoms to evidence',
  'filtering for your medicine cabinet',
  'fitting your budget',
  'arranging your pillars',
];

export default function BuildingScreen({ onFinish, onBack, statuses = DEFAULT_STATUSES, headline = 'Reading your answers' }) {
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
        background: '#4100F5',
        color: '#FFFFFF',
        padding: 40,
        animation: 'ay-page .25s ease-out',
      }}
    >
      <button type="button" onClick={onBack} style={{ position: 'absolute', top: 'max(20px, env(safe-area-inset-top))', left: 24, border: '1px solid rgba(255,255,255,.35)', borderRadius: 99, padding: '10px 15px', background: 'rgba(255,255,255,.08)', color: '#fff', fontSize: 14 }}>← Back</button>
      <div style={{ position: 'relative', width: 150, height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 34 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 99, border: '1px solid rgba(255,255,255,.3)', animation: 'ay-pulse 2.6s ease-out infinite' }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: 99, border: '1px solid rgba(255,255,255,.3)', animation: 'ay-pulse 2.6s ease-out infinite 1.3s' }} />
        <div style={{ width: 66, height: 66, borderRadius: 99, background: '#CDF500', animation: 'ay-float 3.4s ease-in-out infinite' }} />
      </div>
      <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, letterSpacing: '-.04em', fontSize: 'calc(26px * var(--ayna-text-scale, 1))', textAlign: 'center', lineHeight: 1.2 }}>{headline}</div>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(11px * var(--ayna-text-scale, 1))', letterSpacing: '.6px', opacity: 0.72, marginTop: 12, textAlign: 'center' }}>
        {statuses[statusIndex]}
      </div>
    </div>
  );
}
