import { describe, expect, it } from 'vitest';
import { splitNote, stripLead, shortLine } from './sentences.js';

describe('splitNote', () => {
  it('splits a value at its first bracket', () => {
    expect(splitNote('60 capsules (1 daily, or 2 before sex)')).toEqual({ value: '60 capsules', note: '1 daily, or 2 before sex' });
  });
  it('leaves values without a closing bracket alone', () => {
    expect(splitNote('Supplements')).toEqual({ value: 'Supplements', note: '' });
    expect(splitNote('30 (approx) pads total')).toEqual({ value: '30 (approx) pads total', note: '' });
  });
});

describe('stripLead', () => {
  const lead = 'Good Kitty Co describes it as "doctor-formulated" with Dr. Sharon Knight.';
  it('drops the lead sentence the row already shows', () => {
    expect(stripLead(`${lead} The two main ingredients differ.`, lead)).toBe('The two main ingredients differ.');
    expect(stripLead(lead, lead)).toBe('');
  });
  it('keeps paragraphs that only start alike', () => {
    expect(stripLead('Good Kitty Co sells other things too. Yes.', lead)).toBe('Good Kitty Co sells other things too. Yes.');
  });
});

describe('shortLine', () => {
  it('ends a long sentence at a clause break, never with an ellipsis', () => {
    const t = 'Designed for people prone to recurrent UTIs who want a preventive daily routine rather than only reactive treatment.';
    const s = shortLine(t);
    expect(s).toBe('Designed for people prone to recurrent UTIs who want a preventive daily routine.');
    expect(s).not.toContain('…');
  });
  it('keeps short sentences whole', () => {
    expect(shortLine('Some evidence for recurrent UTI-like symptoms. More.')).toBe('Some evidence for recurrent UTI-like symptoms.');
  });
});
