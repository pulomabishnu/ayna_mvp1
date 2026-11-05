import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ServiceCard from './ServiceCard.jsx';

const tile = (service) => renderToStaticMarkup(<ServiceCard service={{ id: 'x', name: 'Example', ...service }} as="button" />);

describe('ServiceCard letter tile colour', () => {
  it('is the app colour for a stated App format', () => {
    expect(tile({ category: 'tracker' })).toContain('is-mono-app');
  });
  it('is the app colour with no format when the platform or link says app', () => {
    expect(tile({ platform: 'iOS, Android' })).toContain('is-mono-app');
    expect(tile({ platform: 'Web, app, Apple TV' })).toContain('is-mono-app');
    expect(tile({ url: 'https://apps.apple.com/us/app/id1' })).toContain('is-mono-app');
  });
  it('is the other colour when a stated format is not App, even with an app platform', () => {
    expect(tile({ category: 'telehealth', platform: 'Web, iOS, Android' })).toContain('is-mono-other');
  });
  it('is the other colour with no format and no sign of an app', () => {
    expect(tile({ platform: 'Online, on-demand', url: 'https://example.com/happy' })).toContain('is-mono-other');
    expect(tile({})).toContain('is-mono-other');
  });
});
