import { describe, expect, it } from 'vitest';
import { buildSuggestionRow, suggestionEmail, suggestionTextLine } from './suggestions.js';

describe('integration requests (anonymous, founder Oct 27)', () => {
  it('stores the app name in product_name with an optional note, and no identity', () => {
    const { row } = buildSuggestionRow({ kind: 'integration', productName: ' WHOOP ', reason: 'sleep data', context: 'health-connections', platform: 'web', email: 'x@y.co' });
    expect(row).toMatchObject({ kind: 'integration', product_name: 'WHOOP', reason: 'sleep data', topic: null, link: null, context: 'health-connections' });
    expect(JSON.stringify(row)).not.toContain('x@y.co');
  });
  it('needs a name', () => {
    expect(buildSuggestionRow({ kind: 'integration', productName: 'a' }).error).toBeTruthy();
  });
  it('emails the founders with the agreed subject and fields', () => {
    const { row } = buildSuggestionRow({ kind: 'integration', productName: 'Garmin', reason: 'runs', context: 'app-health-connections', platform: 'app' });
    const m = suggestionEmail(row);
    expect(m.subject).toBe('new ayna integration request: Garmin');
    expect(m.text).toContain('Requested app/device: Garmin');
    expect(m.text).toContain('Note: runs');
    expect(m.text).toContain('Date submitted:');
    expect(m.to.length).toBeGreaterThan(0);
    expect(suggestionTextLine(row)).toContain('Garmin');
  });
});
