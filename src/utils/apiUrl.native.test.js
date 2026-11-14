import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// Nov 14: the iPhone app loads from capacitor://localhost, so a bare fetch('/api/...') never reaches
// aynahealth.co. That is why the app only had its ~300 bundled products. Shared code goes through apiUrl().
describe('API calls the app makes', () => {
  it('go through apiUrl() in src/utils', () => {
    const dir = path.dirname(new URL(import.meta.url).pathname);
    const bare = [];
    for (const f of fs.readdirSync(dir).filter((x) => /\.js$/.test(x) && !/\.test\./.test(x) && x !== 'apiUrl.js')) {
      const s = fs.readFileSync(path.join(dir, f), 'utf8');
      if (/fetch\(\s*(['"`]\/api|API_PATH\b)/.test(s)) bare.push(f);
    }
    expect(bare).toEqual([]);
  });
});
