// @vitest-environment jsdom
/* global process */
import { describe, expect, it } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import ProductVideos, { videoEmbed } from './ProductVideos.jsx';
import { readFileSync } from 'node:fs';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Notion AYNA-95: videos on product pages, loaded only on tap, privacy-enhanced players.
describe('product videos', () => {
  it('reads YouTube and Vimeo links; ignores anything else', () => {
    expect(videoEmbed('https://www.youtube.com/watch?v=dQw4w9WgXcQ').src).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ');
    expect(videoEmbed('https://youtu.be/dQw4w9WgXcQ').kind).toBe('youtube');
    expect(videoEmbed('https://www.youtube.com/shorts/dQw4w9WgXcQ').kind).toBe('youtube');
    expect(videoEmbed('https://vimeo.com/123456789').src).toContain('player.vimeo.com/video/123456789');
    expect(videoEmbed('https://www.youtube.com/results?search_query=x')).toBeNull();
    expect(videoEmbed('https://example.com/a.mp4')).toBeNull();
  });
  it('shows nothing without videos, and no iframe until play is tapped', async () => {
    const host = document.createElement('div'); document.body.appendChild(host); const root = createRoot(host);
    await act(async () => { root.render(<ProductVideos product={{ id: 'x' }} />); });
    expect(host.innerHTML).toBe('');
    await act(async () => { root.render(<ProductVideos product={{ id: 'x', videos: [{ url: 'https://youtu.be/dQw4w9WgXcQ', title: 'How to insert', source: 'Brand' }] }} />); });
    expect(host.querySelector('iframe')).toBeNull();
    await act(async () => { host.querySelector('.ay-pv__play').click(); });
    expect(host.querySelector('iframe').getAttribute('src')).toContain('youtube-nocookie.com');
    await act(async () => { root.unmount(); });
  });
  it('the site allows those two players to load (vercel.json CSP)', () => {
    const csp = readFileSync(`${process.cwd()}/vercel.json`, 'utf8');
    expect(csp).toMatch(/frame-src https:\/\/www\.youtube-nocookie\.com https:\/\/player\.vimeo\.com/);
  });
});
