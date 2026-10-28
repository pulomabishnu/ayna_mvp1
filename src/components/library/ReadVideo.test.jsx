import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ReadVideo from './ReadVideo.jsx';
import ArticleDetailScreen from '../../mobile/screens/ArticleDetailScreen.jsx';
import { ARTICLES } from '../Articles.jsx';
import { normalizeVideo, videoEmbedUrl } from '../../utils/readVideo.js';

const yt = { provider: 'youtube', id: 'dQw4w9WgXcQ', title: 'How the pelvic floor works', credit: 'Test clinic' };

describe('normalizeVideo', () => {
  it('keeps a valid YouTube or Vimeo record', () => {
    expect(normalizeVideo(yt)).toEqual({ ...yt, poster: '' });
    expect(normalizeVideo({ provider: 'vimeo', id: '76979871', title: 'A talk' })).toMatchObject({ provider: 'vimeo', id: '76979871', credit: '' });
  });
  it('drops anything it cannot trust', () => {
    expect(normalizeVideo(null)).toBeNull();
    expect(normalizeVideo({ ...yt, provider: 'tiktok' })).toBeNull();
    expect(normalizeVideo({ ...yt, id: 'https://youtube.com/watch?v=dQw4w9WgXcQ' })).toBeNull();
    expect(normalizeVideo({ ...yt, id: 'abc"><script>' })).toBeNull();
    expect(normalizeVideo({ provider: 'vimeo', id: 'abc', title: 'x' })).toBeNull();
    expect(normalizeVideo({ ...yt, title: '   ' })).toBeNull();
  });
  it('accepts only a self-hosted poster image', () => {
    expect(normalizeVideo({ ...yt, poster: '/articles/pelvic-video.webp' }).poster).toBe('/articles/pelvic-video.webp');
    expect(normalizeVideo({ ...yt, poster: 'https://i.ytimg.com/vi/x/hq.jpg' }).poster).toBe('');
    expect(normalizeVideo({ ...yt, poster: '/../secret.png' }).poster).toBe('');
  });
});

describe('videoEmbedUrl', () => {
  it('uses the privacy-enhanced hosts', () => {
    expect(videoEmbedUrl(yt)).toMatch(/^https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ\?/);
    expect(videoEmbedUrl({ provider: 'vimeo', id: '76979871', title: 'A talk' })).toMatch(/^https:\/\/player\.vimeo\.com\/video\/76979871\?.*dnt=1/);
    expect(videoEmbedUrl({ provider: 'youtube', id: 'bad' })).toBe('');
  });
});

describe('ReadVideo', () => {
  it('renders nothing without a valid video', () => {
    expect(renderToStaticMarkup(<ReadVideo />)).toBe('');
    expect(renderToStaticMarkup(<ReadVideo video={{ provider: 'youtube', id: 'x' }} />)).toBe('');
  });
  it('shows a poster button and loads nothing from the host before play', () => {
    const html = renderToStaticMarkup(<ReadVideo video={yt} />);
    expect(html).toContain('<button type="button"');
    expect(html).toContain('aria-label="Play video: How the pelvic floor works. Loads from YouTube."');
    expect(html).toContain('Video from Test clinic.');
    expect(html).not.toContain('<iframe');
    expect(html).not.toMatch(/youtube-nocookie|youtube\.com|ytimg|player\.vimeo/i);
  });
});

describe('read pages', () => {
  it('the app read screen shows the video only when the read has one', () => {
    const base = { id: 'r', title: 'Guide', body: <p>Body</p> };
    expect(renderToStaticMarkup(<ArticleDetailScreen article={base} />)).not.toContain('ay-rvideo');
    expect(renderToStaticMarkup(<ArticleDetailScreen article={{ ...base, video: yt }} />)).toContain('ay-rvideo');
  });
  it('no read ships an invented video, and any video added later is valid', () => {
    for (const a of ARTICLES) {
      if (a.video === undefined) continue;
      expect(normalizeVideo(a.video), a.id).not.toBeNull();
    }
    expect(ARTICLES.filter((a) => a.video).length).toBe(0);
  });
});

// Content assertions run after access is granted; the real gate has its own tests.
vi.mock('../ProFeatureGate.jsx', () => ({ default: ({ children }) => children }));
