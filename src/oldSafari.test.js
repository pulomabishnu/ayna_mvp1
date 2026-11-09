import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/* Nov 9 (founder: people stuck on the loading screen). iOS Safari before 16.4 can't parse regex
   lookbehind ((?<= or (?<!); one in the entry bundle stopped the whole site from starting. */
const files = (dir) => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n);
  if (statSync(p).isDirectory()) return files(p);
  return /\.(js|jsx)$/.test(n) && !/\.test\./.test(n) ? [p] : [];
});
describe('older phones can run the site', () => {
  it('no regex lookbehind in app code', () => {
    const bad = [];
    for (const f of files('src')) {
      readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
        if (/^\s*(\/\/|\*)/.test(line)) return;
        if (/\(\?<[!=]/.test(line)) bad.push(`${f}:${i + 1}`);
      });
    }
    expect(bad).toEqual([]);
  });
});
