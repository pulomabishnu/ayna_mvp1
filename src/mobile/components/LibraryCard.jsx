const TINT_PALETTE = [
  ['#F0E6DA', '#DCCBB4'],
  ['#EDE2D6', '#D6C4AE'],
  ['#E8D3CC', '#C9A79C'],
  ['#E6E1EE', '#CFC6E0'],
  ['#F6E3CE', '#E5C49B'],
  ['#E4EBDD', '#C7D8BD'],
  ['#F1DDE2', '#DBB6C0'],
  ['#F4E0D3', '#DFB89F'],
];

function tintForId(id) {
  const str = id || '';
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  return TINT_PALETTE[hash % TINT_PALETTE.length];
}

export default function LibraryCard({ article, onClick }) {
  const { id, title, tags = [] } = article || {};
  const [c1, c2] = tintForId(id || title);

  return (
    <div onClick={onClick} style={{ width: 158, flexShrink: 0, cursor: 'pointer' }}>
      <div
        style={{
          height: 206,
          borderRadius: 20,
          display: 'flex',
          alignItems: 'flex-end',
          padding: 12,
          boxSizing: 'border-box',
          backgroundImage: `repeating-linear-gradient(135deg,rgba(255,255,255,.4) 0 7px,rgba(255,255,255,0) 7px 14px),linear-gradient(155deg,${c1},${c2})`,
          boxShadow: '0 6px 18px -8px rgba(41,37,36,.22)',
        }}
      >
        {tags[0] && (
          <span
            style={{
              fontFamily: "'DM Mono',monospace",
              fontSize: 7.5,
              letterSpacing: '.7px',
              textTransform: 'uppercase',
              color: 'rgba(41,37,36,.45)',
              background: 'rgba(255,255,255,.62)',
              padding: '3px 6px',
              borderRadius: 99,
            }}
          >
            {tags[0]}
          </span>
        )}
      </div>
      <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 14, lineHeight: 1.25, marginTop: 9, textWrap: 'pretty' }}>
        {title}
      </div>
    </div>
  );
}
