import { useEffect, useState } from 'react';

const DEFAULT_TERMS = [
  'cramps that stop the day',
  'low iron, no answers',
  'sleep that breaks at 3am',
  'PCOS, first steps',
  'perimenopause flushes',
  'bloating before my period',
  'hair shedding postpartum',
  'trying to conceive',
];

export default function SearchBar({ value = '', onChange, onFilterClick, terms = DEFAULT_TERMS }) {
  const [rot, setRot] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setRot((n) => n + 1), 2400);
    return () => clearInterval(timer);
  }, []);

  const showPlaceholder = !value;
  const term = terms[rot % terms.length];

  return (
    <div style={{ padding: '10px 20px 14px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'var(--ayna-surface)',
          border: '1px solid var(--ayna-border)',
          borderRadius: 14,
          padding: '12px 14px 12px 16px',
          boxShadow: 'none',
        }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth="2" strokeLinecap="round" style={{ flex: 'none' }}>
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-4.3-4.3" />
        </svg>

        <div style={{ flex: 1, position: 'relative', height: 20, overflow: 'hidden' }}>
          {showPlaceholder ? (
            <div
              key={rot}
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))',
                color: '#626262',
                whiteSpace: 'nowrap',
                animation: (rot % 2 ? 'ay-swap2' : 'ay-swap') + ' 2.4s ease-in-out',
              }}
            >
              {term}
            </div>
          ) : null}
          <input
            type="text"
            aria-label="Search products and reads"
            value={value}
            onChange={onChange}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 'max(16px, calc(13.5px * var(--ayna-text-scale, 1)))',
              color: 'var(--ayna-text)',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          />
        </div>

        <div
          onClick={onFilterClick}
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: '#E2F8F3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 'none',
            cursor: 'pointer',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4100F5" strokeWidth="2" strokeLinecap="round">
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
        </div>
      </div>
    </div>
  );
}
