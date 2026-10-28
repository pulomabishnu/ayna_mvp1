import { describe, expect, it } from 'vitest';
import { splitAnswer } from './AskPanel.jsx';

const para = (n) => `Sentence ${n} about heat and movement for cramps that keeps going for a while so the block is long enough.`;

describe('splitAnswer (glance first, Read full answer)', () => {
  it('leaves short answers whole', () => {
    expect(splitAnswer('One short line.')).toBeNull();
    expect(splitAnswer(`${para(1)}\n\n${para(2)}`)).toBeNull();
  });

  it('shows the first paragraph and keeps every other word for the tap', () => {
    const text = [para(1), para(2), para(3), para(4)].join('\n\n');
    const parts = splitAnswer(text);
    expect(parts.short).toBe(para(1));
    expect(`${parts.short}\n\n${parts.rest}`).toBe(text);
  });

  it('never folds an answer with safety wording', () => {
    const text = [para(1), para(2), 'If the pain is severe, see a doctor right away.', para(4)].join('\n\n');
    expect(splitAnswer(text)).toBeNull();
  });
});
