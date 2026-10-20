import TopicCover from '../../components/v3/TopicCover.jsx';
import { hasTeamCover } from '../../data/readCovers.js';
const TINT_PALETTE = [
  ['#FFEDAC', '#F7BADD'],
  ['#769EBE', '#FFEDAC'],
  ['#F7BADD', '#FFEDAC'],
  ['#FFEDAC', '#769EBE'],
  ['#F7BADD', '#769EBE'],
  ['#769EBE', '#F7BADD'],
];

function tintForId(id) {
  const str = id || '';
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  return TINT_PALETTE[hash % TINT_PALETTE.length];
}

export default function LibraryCard({ article, onClick, fullWidth = false }) {
  const { id, title, tags = [] } = article || {};
  // Same drawn cover as the website, unless the team put in a picture for this read.
  const image = hasTeamCover(article) ? article.image : null;
  const [c1, c2] = tintForId(id || title);
  void c1; void c2;
  if (!image) {
    return (
      <button type="button" onClick={onClick} aria-label={`Read ${title}`} className={`ay-app-readcard${fullWidth ? ' is-full' : ''}`}>
        <TopicCover id={id} title={title} className="ay-app-cover" />
        <span className="ay-app-readcard__title">{title}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Read ${title}`}
      style={{
        // Column flex, top-aligned: a plain block <button> centres its content
        // vertically when the row stretches it, which pushed cards with
        // shorter titles a few px lower than their neighbours.
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
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
            : `repeating-linear-gradient(135deg,rgba(255,237,172,.4) 0 7px,rgba(255,237,172,0) 7px 14px),linear-gradient(155deg,${c1},${c2})`,
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
            className="ay-libcard-tag"
            style={{
              position: 'relative',
              fontFamily: "var(--ayna-font-ui)",
              fontWeight: 500, fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))',
              letterSpacing: '.7px',
              textTransform: 'uppercase',
              color: image ? '#FFEDAC' : 'rgba(41,37,36,.45)',
              background: image ? 'rgba(0,0,0,.35)' : 'rgba(255,237,172,.62)',
              padding: '3px 6px',
              borderRadius: 99,
            }}
          >
            {tags[0]}
          </span>
        )}
      </div>
      <div style={{ fontFamily: "var(--ayna-font-ui)", fontWeight: 500, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', lineHeight: 1.25, marginTop: 9, textWrap: 'pretty' }}>
        {title}
      </div>
    </button>
  );
}
