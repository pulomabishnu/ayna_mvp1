const DEFAULT_CATEGORIES = [
  { key: 'All', label: 'All', color: '#A2603C' },
  { key: 'Cycle', label: 'Cycle', color: '#C0761F' },
  { key: 'Fertility', label: 'Fertility', color: '#4E3866' },
  { key: 'Menopause', label: 'Menopause', color: '#A2603C' },
  { key: 'PCOS', label: 'PCOS', color: '#3F7A6A' },
  { key: 'Intimate', label: 'Intimate', color: '#B0537A' },
  { key: 'Postpartum', label: 'Postpartum', color: '#8A6A3C' },
  { key: 'Sleep', label: 'Sleep', color: '#242A52' },
  { key: 'Gut', label: 'Gut', color: '#5C7A4A' },
  { key: 'Bone', label: 'Bone', color: '#78716C' },
  { key: 'Skin', label: 'Skin', color: '#C98A4B' },
];

export default function CategoryChips({ categories = DEFAULT_CATEGORIES, active = 'All', onSelect }) {
  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 20px 16px', scrollbarWidth: 'none' }}>
      {categories.map((c) => {
        const isActive = active === c.key;
        return (
          <div
            key={c.key}
            onClick={() => onSelect && onSelect(c.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 13px',
              borderRadius: 99,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              fontSize: 12.5,
              fontFamily: "'DM Sans',sans-serif",
              fontWeight: 500,
              background: isActive ? '#292524' : '#FFFCF9',
              color: isActive ? '#FFFCF9' : '#78716C',
              border: '1px solid ' + (isActive ? '#292524' : '#E1D5CE'),
              transition: 'background .16s',
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: 99,
                background: c.color,
                flexShrink: 0,
                opacity: isActive ? 1 : 0.8,
              }}
            />
            {c.label}
          </div>
        );
      })}
    </div>
  );
}
