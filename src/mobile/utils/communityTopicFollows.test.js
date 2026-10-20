import { describe, expect, it } from 'vitest';
import { defaultTopicsFromQuiz } from './communityTopicFollows.js';

describe('defaultTopicsFromQuiz', () => {
  it('follows topics for her needs and life stage', () => {
    const topics = defaultTopicsFromQuiz({ age: 24, lifeStageSelections: ['I have regular periods'], supportSelections: ['Cramps or period pain', 'Heavy periods', 'Vaginal dryness'] });
    expect(topics).toEqual(expect.arrayContaining(['cramps', 'periods', 'vaginal-health']));
  });
  it('maps menopause and bladder leaks', () => {
    const topics = defaultTopicsFromQuiz({ age: 51, lifeStageSelections: ['Perimenopause'], supportSelections: ['Hot flashes', 'Bladder leaks'] });
    expect(topics).toEqual(expect.arrayContaining(['menopause', 'pelvic-floor']));
  });
  it('is empty without a quiz', () => {
    expect(defaultTopicsFromQuiz(null)).toEqual([]);
  });
});
