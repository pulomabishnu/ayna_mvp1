import { useState } from 'react';
import './product-videos.css';

/**
 * Videos on a product page (Notion AYNA-95, "Embedding videos into the Product sections"). A product
 * lists them in `videos: [{ url, title, source }]` (catalog field; in product_catalog it rides in
 * `extra`). Only YouTube and Vimeo links play here. Nothing loads from YouTube or Vimeo until she taps
 * play (no third-party cookies or tracking on page load); then the privacy-enhanced player opens.
 */
export function videoEmbed(url) {
  try {
    const u = new URL(String(url || ''));
    const host = u.hostname.replace(/^www\.|^m\./, '');
    let id = '';
    if (host === 'youtu.be') id = u.pathname.slice(1);
    else if (host === 'youtube.com' || host === 'youtube-nocookie.com') id = u.searchParams.get('v') || (u.pathname.match(/^\/(?:embed|shorts)\/([\w-]{6,})/) || [])[1] || '';
    if (/^[\w-]{6,20}$/.test(id)) return { kind: 'youtube', src: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`, thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` };
    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      const v = (u.pathname.match(/(\d{6,12})/) || [])[1];
      if (v) return { kind: 'vimeo', src: `https://player.vimeo.com/video/${v}?autoplay=1&dnt=1`, thumb: null };
    }
  } catch { /* not a URL */ }
  return null;
}

function Video({ video }) {
  const [playing, setPlaying] = useState(false);
  const embed = videoEmbed(video.url);
  if (!embed) return null;
  const title = String(video.title || 'Product video').slice(0, 120);
  return (
    <figure className="ay-pv">
      <div className="ay-pv__frame">
        {playing
          ? <iframe src={embed.src} title={title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" referrerPolicy="strict-origin-when-cross-origin" loading="lazy" />
          : (
            <button type="button" className="ay-pv__play" onClick={() => setPlaying(true)} aria-label={`Play video: ${title}`}>
              {embed.thumb ? <img src={embed.thumb} alt="" loading="lazy" /> : null}
              <span className="ay-pv__btn" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg></span>
            </button>
          )}
      </div>
      <figcaption className="ay-pv__cap">{title}{video.source ? <span> · {video.source}</span> : null}</figcaption>
    </figure>
  );
}

export default function ProductVideos({ product }) {
  const videos = (Array.isArray(product?.videos) ? product.videos : []).filter((v) => v && videoEmbed(v.url)).slice(0, 3);
  if (!videos.length) return null;
  return (
    <section className="ay-pvs" aria-labelledby="ay-pvs-h">
      <h2 id="ay-pvs-h" className="ay-pvs__h">{videos.length === 1 ? 'Video' : 'Videos'}</h2>
      {videos.map((v) => <Video key={v.url} video={v} />)}
      <p className="ay-pvs__fine">Videos play from YouTube or Vimeo after you tap play.</p>
    </section>
  );
}
