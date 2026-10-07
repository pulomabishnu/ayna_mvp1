import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ARTICLES } from './ArticlesPage.jsx';
import { splitBodyAndSources, estimateReadMinutes } from '../utils/articleReading';

const PUBLIC_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../public');

describe('Articles library — reading features against the real articles', () => {
  it('every article has a hero image that exists in public/', () => {
    for (const a of ARTICLES) {
      expect(a.image, a.id).toBe(`/articles/${a.id}.webp`);
      expect(existsSync(resolve(PUBLIC_DIR, a.image.slice(1))), a.image).toBe(true);
    }
  });

  it('every article splits into body + at least one source link, with no "Sources:" left in the body', () => {
    for (const a of ARTICLES) {
      const { mainBody, sourceLinks } = splitBodyAndSources(a.body);
      expect(sourceLinks.length, a.id).toBeGreaterThan(0);
      for (const l of sourceLinks) expect(l.href, a.id).toMatch(/^https:\/\//);
      expect(Array.isArray(mainBody), a.id).toBe(true);
    }
  });

  it('every article gets a positive read-time estimate', () => {
    for (const a of ARTICLES) expect(estimateReadMinutes(a.body)).toBeGreaterThanOrEqual(1);
  });
});
