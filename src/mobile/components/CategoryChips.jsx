import { CATEGORY_GROUPS } from '../data/categoryGroups.js';

export default function CategoryChips({ categories = CATEGORY_GROUPS, active = 'all', onSelect }) {
  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 20px 16px', scrollbarWidth: 'none' }}>
      {categories.map((c) => {
        const isActive = active === c.id;
        return (
          <div
            key={c.id}
            onClick={() => onSelect && onSelect(c.id)}
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
