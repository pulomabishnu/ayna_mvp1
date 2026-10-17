import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { currentPrints } from '../../scripts/team-copy-lock.mjs';

// Team-written product copy is locked (Ameera, Oct 17, after AI edits changed
// copy Eliz had pulled from brand sources). If this fails, a product field the
// team wrote changed. Undo it, or if a founder asked for it, approve it by name:
//   node scripts/team-copy-lock.mjs --approve <id>.<field> --by "<who asked>"
describe('team copy lock', () => {
  const lock = JSON.parse(readFileSync(new URL('./teamCopy.lock.json', import.meta.url), 'utf8'));
  const now = currentPrints();
  it('no team-written product field changed without a named approval', () => {
    const changed = [];
    for (const [id, fields] of Object.entries(lock)) {
      if (!now[id]) { changed.push(`${id} (removed or hidden)`); continue; }
      for (const [f, print] of Object.entries(fields)) if (now[id][f] !== print) changed.push(`${id}.${f}`);
    }
    expect(changed).toEqual([]);
  });
});
