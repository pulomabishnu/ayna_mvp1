import { useRef, useState } from 'react';
import { normalizeVideo, videoEmbedUrl, PROVIDER_NAME } from '../../utils/readVideo.js';
import './read-video.css';

/*
 * Click-to-load video for a read (website Library and the app's read screen;
 * product pages can use it too). Before play: our own poster with a play
 * button, no request to the video host. After play: the privacy-enhanced
 * player (youtube-nocookie / Vimeo dnt). Renders nothing without a valid video.
 */
export default function ReadVideo({ video, className = '' }) {
  const v = normalizeVideo(video);
  const [playing, setPlaying] = useState(false);
  const frameRef = useRef(null);
  if (!v) return null;
  const host = PROVIDER_NAME[v.provider];
  const play = () => {
    setPlaying(true);
    // Keep keyboard focus in the same place once the button is replaced.
    requestAnimationFrame(() => frameRef.current?.focus());
  };
  return (
    <figure className={`ay-rvideo ${className}`.trim()}>
      <div className="ay-rvideo__frame">
        {playing ? (
          <iframe
            ref={frameRef}
            src={videoEmbedUrl(v)}
            title={v.title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            loading="eager"
          />
        ) : (
          <button type="button" className={`ay-rvideo__poster${v.poster ? ' has-image' : ''}`} onClick={play} aria-label={`Play video: ${v.title}. Loads from ${host}.`}>
            {v.poster && <img src={v.poster} alt="" loading="lazy" decoding="async" />}
            <span className="ay-rvideo__title" aria-hidden="true">{v.title}</span>
            <span className="ay-rvideo__play" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z" /></svg>
            </span>
          </button>
        )}
      </div>
      <figcaption className="ay-rvideo__cap">
        {v.credit ? <>Video from {v.credit}. </> : null}Plays from {host} only when you press play.
      </figcaption>
    </figure>
  );
}
