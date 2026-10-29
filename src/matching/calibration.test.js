import { describe, it, expect, vi } from 'vitest';
import { bandOfPercent, wilson, reliabilityTable, calibrationVerdict, recordOutcomeSample, MIN_SAMPLES } from './calibration.js';

const many = (band, helped, total, other = 'no_change') => [...Array(total)].map((_, i) => ({ band, outcome: i < helped ? 'helpful' : other }));

describe('calibration', () => {
  it('bands match the labels (Strong = 80+)', () => {
    expect(bandOfPercent(80)).toBe('strong');
    expect(bandOfPercent(79)).toBe('good');
    expect(bandOfPercent(49)).toBe('partial');
    expect(bandOfPercent(null)).toBeNull();
  });
  it('Wilson interval is honest for small samples', () => {
    const w = wilson(3, 4);
    expect(w.low).toBeLessThan(0.4);
    expect(w.high).toBeLessThan(1);
  });
  it('claims nothing until every band has enough answers', () => {
    expect(calibrationVerdict(reliabilityTable(many('strong', 5, 10))).verdict).toBe('not_enough_data');
  });
  it('flags bands that are upside down', () => {
    const t = reliabilityTable([...many('strong', 6, 40), ...many('good', 36, 40), ...many('partial', 10, 40)]);
    expect(t.every((r) => r.n >= MIN_SAMPLES)).toBe(true);
    expect(calibrationVerdict(t)).toEqual({ verdict: 'inverted', detail: ['good helps more than strong'] });
    expect(calibrationVerdict(reliabilityTable([...many('strong', 30, 40), ...many('good', 20, 40), ...many('partial', 10, 40)])).verdict).toBe('ok');
  });
  it('the sample sent is anonymous: band, bucket, outcome, engine only', async () => {
    const insert = vi.fn(async () => ({ error: null }));
    const client = { from: vi.fn(() => ({ insert })) };
    await recordOutcomeSample({ details: { matchStatus: 'scored', percent: 87, needId: 'pain.menstrual_cramp', productId: 'x' }, outcome: 'helpful' }, { client });
    expect(client.from).toHaveBeenCalledWith('match_outcome_samples');
    expect(Object.keys(insert.mock.calls[0][0]).sort()).toEqual(['band', 'engine', 'outcome', 'percent_bucket']);
    expect(insert.mock.calls[0][0]).toMatchObject({ band: 'strong', percent_bucket: 80, outcome: 'helpful' });
  });
  it('held or unscored matches and "Not sure" are never sent', async () => {
    const client = { from: vi.fn(() => ({ insert: vi.fn(async () => ({})) })) };
    expect(await recordOutcomeSample({ details: { matchStatus: 'safety-hold', percent: null }, outcome: 'helpful' }, { client })).toBe(false);
    expect(await recordOutcomeSample({ details: { matchStatus: 'scored', percent: 70 }, outcome: 'unsure' }, { client })).toBe(false);
    expect(client.from).not.toHaveBeenCalled();
  });
});
