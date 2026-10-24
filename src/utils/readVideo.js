// Optional video next to a read (Lydia, Sep 24: "some people learn better
// with videos"). A read may carry:
//
//   video: { provider: 'youtube' | 'vimeo', id, title, credit, poster? }
//
//   provider  where it's hosted
//   id        the video id only (YouTube: 11 characters; Vimeo: digits), never a URL
//   title     what the video is, shown on the poster and used as the iframe title
//   credit    who made it ("Mayo Clinic"), shown under the player
//   poster    optional self-hosted image path ("/articles/x-video.webp")
//
// Nothing loads from YouTube or Vimeo until the reader presses play: the poster
// is ours (an image we host, or a plain brand tile), so opening a read never
// tells Google or Vimeo anything. YouTube plays from youtube-nocookie.com.
// A video that fails these checks is ignored (the read shows no video).

const YT_ID = /^[A-Za-z0-9_-]{11}$/;
const VIMEO_ID = /^\d{6,12}$/;
const LOCAL_POSTER = /^\/[A-Za-z0-9/_.-]+\.(?:webp|avif|jpe?g|png)$/i;

const clean = (v, max) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');

/** A safe, complete video record, or null when there's nothing valid to show. */
export function normalizeVideo(video) {
  if (!video || typeof video !== 'object') return null;
  const provider = video.provider === 'youtube' || video.provider === 'vimeo' ? video.provider : null;
  const id = clean(String(video.id ?? ''), 20);
  if (!provider || !(provider === 'youtube' ? YT_ID : VIMEO_ID).test(id)) return null;
  const title = clean(video.title, 140);
  if (!title) return null;
  const poster = typeof video.poster === 'string' && LOCAL_POSTER.test(video.poster) && !video.poster.includes('..') ? video.poster : '';
  return { provider, id, title, credit: clean(video.credit, 80), poster };
}

/** The player URL, used only after the reader presses play. */
export function videoEmbedUrl(video) {
  const v = normalizeVideo(video);
  if (!v) return '';
  if (v.provider === 'youtube') return `https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
  return `https://player.vimeo.com/video/${v.id}?autoplay=1&dnt=1&title=0&byline=0&portrait=0`;
}

export const PROVIDER_NAME = { youtube: 'YouTube', vimeo: 'Vimeo' };
