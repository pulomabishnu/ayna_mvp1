import { describe, it, expect } from 'vitest';
import { plainText, fallbackSummary, summarize } from './news-summary.js';

const BODY = 'hi everyone! we just pushed some major ayna updates ♡ 1. **smarter recommendations:** we improved our matching algorithm to make your recs more personalized. 2. **retake your quiz:** we recommend retaking it';

describe('news summary', () => {
  it('never shows markdown', () => {
    expect(plainText(BODY)).not.toMatch(/\*\*/);
    expect(fallbackSummary(BODY)).not.toMatch(/\*|\b2\.\s*$/);
  });
  it('uses the model summary when it works, and cleans it', async () => {
    const out = await summarize({ id: 'x1', title: 'upgrade', body: BODY }, { call: async () => ({ text: '"**smarter** matches and a fresh quiz — retake it to update your picks."' }) });
    expect(out.ai).toBe(true);
    expect(out.summary).not.toMatch(/[*"—]/);
  });
  it('falls back to a clean excerpt when the model fails', async () => {
    const out = await summarize({ id: 'x2', title: 'upgrade', body: BODY }, { call: async () => { throw new Error('down'); } });
    expect(out.ai).toBe(false);
    expect(out.summary).toMatch(/^we just pushed/);
  });
});
