import { describe, expect, it } from 'vitest';
import { pruneForTopics, pruneVasomotor, HELP_TOPIC_ITEMS } from './onboardingFlow.js';

const topicWith = (item) => Object.keys(HELP_TOPIC_ITEMS).find((t) => HELP_TOPIC_ITEMS[t].includes(item));
describe('quiz: removing hot flashes removes its follow-up (Ameera, Nov 15)', () => {
  it('drops the timing answers when hot flashes and night sweats are both gone', () => {
    expect(pruneVasomotor({ supportSelections: ['Anxiety'], vasomotorTimingSelections: ['At night'] }).vasomotorTimingSelections).toEqual([]);
    expect(pruneVasomotor({ supportSelections: ['Night sweats'], vasomotorTimingSelections: ['At night'] }).vasomotorTimingSelections).toEqual(['At night']);
  });
  it('removing a topic removes its symptoms and the follow-up', () => {
    const t = topicWith('Hot flashes');
    const other = Object.keys(HELP_TOPIC_ITEMS).find((k) => k !== t && !HELP_TOPIC_ITEMS[k].includes('Hot flashes'));
    const out = pruneForTopics({ helpTopics: [other], supportSelections: ['Hot flashes', HELP_TOPIC_ITEMS[other][0]], vasomotorTimingSelections: ['At night'] });
    expect(out.supportSelections).toEqual([HELP_TOPIC_ITEMS[other][0]]);
    expect(out.vasomotorTimingSelections).toEqual([]);
  });
});
