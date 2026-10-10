const TINT_PALETTE = [
  ['#E8EAF9', '#7E8DE7'],
  ['#F8F4E9', '#E8EAF9'],
  ['#F8F4E9', '#7E8DE7'],
  ['#E8EAF9', '#F8F4E9'],
  ['#7E8DE7', '#F8F4E9'],
  ['#F8F4E9', '#7E8DE7'],
];

function tintForId(id) {
  const str = id || '';
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  return TINT_PALETTE[hash % TINT_PALETTE.length];
}

export default function LibraryCard({ article, onClick, fullWidth = false }) {
  const { id, title, tags = [], image } = article || {};
  const [c1, c2] = tintForId(id || title);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Read ${title}`}
      style={{
        display: 'block',
        width: fullWidth ? '100%' : 158,
        flexShrink: 0,
        padding: 0,
        border: 0,
        background: 'transparent',
        color: 'var(--ayna-text)',
        textAlign: 'left',
        font: 'inherit',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          position: 'relative',
          height: 206,
          borderRadius: 20,
          display: 'flex',
          alignItems: 'flex-end',
          padding: 12,
          boxSizing: 'border-box',
          overflow: 'hidden',
          backgroundImage: image
            ? undefined
            : `repeating-linear-gradient(135deg,rgba(255,255,255,.4) 0 7px,rgba(255,255,255,0) 7px 14px),linear-gradient(155deg,${c1},${c2})`,
          boxShadow: '0 6px 18px -8px rgba(41,37,36,.22)',
        }}
      >
        {image && (
          <img
            src={image}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
        {image && (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(0,0,0,0) 55%,rgba(0,0,0,.42) 100%)' }} />
        )}
        {tags[0] && (
          <span
            style={{
              position: 'relative',
              fontFamily: "var(--ayna-font-ui)",
              fontSize: 'calc(7.5px * var(--ayna-text-scale, 1))',
              letterSpacing: '.7px',
              textTransform: 'uppercase',
              color: image ? '#fff' : 'rgba(41,37,36,.45)',
              background: image ? 'rgba(0,0,0,.35)' : 'rgba(255,255,255,.62)',
              padding: '3px 6px',
              borderRadius: 99,
            }}
          >
            {tags[0]}
          </span>
        )}
      </div>
      <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 600, fontSize: 'calc(14px * var(--ayna-text-scale, 1))', lineHeight: 1.25, marginTop: 9, textWrap: 'pretty' }}>
        {title}
      </div>
    </button>
  );
}
