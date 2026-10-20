import { describe, expect, it } from 'vitest';
import { defaultTopicsFromQuiz } from './communityTopicFollows.js';
import { topicForHashtag, topicLabel } from '../../utils/community/topics.js';

describe('defaultTopicsFromQuiz', () => {
  it('follows topics for her needs and life stage', () => {
    const topics = defaultTopicsFromQuiz({ age: 24, lifeStageSelections: ['I have regular periods'], supportSelections: ['Cramps or period pain', 'Heavy periods', 'Vaginal dryness'] });
    expect(topics).toEqual(expect.arrayContaining(['cramps', 'periods', 'vaginal-health']));
  });
  it('maps menopause and bladder leaks', () => {
    const topics = defaultTopicsFromQuiz({ age: 51, lifeStageSelections: ['Perimenopause'], supportSelections: ['Hot flashes', 'Bladder leaks'] });
    expect(topics).toEqual(expect.arrayContaining(['menopause', 'pelvic-floor', 'perimenopause']));
  });
  it('perimenopause alone does not also follow menopause by life stage', () => {
    expect(defaultTopicsFromQuiz({ age: 46, lifeStageSelections: ['I am in perimenopause'] })).toEqual(['perimenopause']);
  });
  it('is empty without a quiz', () => {
    expect(defaultTopicsFromQuiz(null)).toEqual([]);
  });
});

describe('curated topics', () => {
  it('has perimenopause and UTIs and BV as their own pods', () => {
    expect(topicForHashtag('#perimenopause')).toBe('perimenopause');
    expect(topicForHashtag('#peri')).toBe('perimenopause');
    expect(topicForHashtag('#bv')).toBe('uti');
    expect(topicLabel('uti')).toBe('UTIs and BV');
  });
});
