import { publicMediaUrl } from '../../../utils/community/imageUpload.js';
import { scrimFor } from '../../../utils/community/topicContrast.js';

/**
 * A topic's cover: a brand colour or a photo, with the title in the font
 * and colour the creator picked. On a photo the title sits on a solid
 * espresso or butter strip so it always reads (no gradient scrim: matte).
 * size: 'card' (directory), 'head' (topic page), 'preview' (editor), 'chip' (rows).
 */
export default function TopicCover({ topic, size = 'card', photoUrl = null, children = null }) {
  const photo = photoUrl || (topic?.cover_image_url ? publicMediaUrl(topic.cover_image_url) : null);
  const text = topic?.text_color || '#3e2723';
  const style = photo ? { '--ut-text': text, '--ut-scrim': scrimFor(text) } : { '--ut-bg': topic?.cover_color || '#ffedac', '--ut-text': text };
  const name = topic?.name || 'Your topic';
  if (size === 'chip') {
    return <span className={`ut-swatch${photo ? ' has-photo' : ''}`} style={style} aria-hidden="true">
      {photo ? <img src={photo} alt="" loading="lazy" /> : <span className={`ut-font-${topic?.title_font === 'sans' ? 'sans' : 'serif'}`}>{name.trim().charAt(0).toUpperCase() || 'T'}</span>}
    </span>;
  }
  return <div className={`ut-cover is-${size}${photo ? ' has-photo' : ''}`} style={style}>
    {photo && <img className="ut-cover__img" src={photo} alt="" loading={size === 'head' ? 'eager' : 'lazy'} />}
    {size === 'head' ? <h2 className={`ut-cover__title ut-font-${topic?.title_font === 'sans' ? 'sans' : 'serif'}`}>{name}</h2>
      : <span className={`ut-cover__title ut-font-${topic?.title_font === 'sans' ? 'sans' : 'serif'}`}>{name}</span>}
    {children}
  </div>;
}
