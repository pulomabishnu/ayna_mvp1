import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// Oct 17: the Community "Following" tab crashed the page with "React is not
// defined" (React.Fragment used in a file that never imported React). Lint
// doesn't catch this, so this test does.
function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? files(p) : /\.(jsx?|tsx?)$/.test(d.name) && !/\.test\./.test(d.name) ? [p] : [];
  });
}
describe('files that use React.* import React', () => {
  const src = new URL('.', import.meta.url).pathname;
  const offenders = files(src).filter((f) => {
    const s = fs.readFileSync(f, 'utf8');
    return /\bReact\.\w/.test(s.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '')) && !/import\s+(\*\s+as\s+)?React\b/.test(s);
  });
  it('has none missing', () => expect(offenders).toEqual([]));
});
