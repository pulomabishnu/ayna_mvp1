import { afterEach, describe, expect, it } from 'vitest';
import { setTempUnit, tempDelta, tempReading } from './tempUnit.js';
import { formatMetric } from './dashboard.js';

describe('temperature unit (Nov 14 sweep)', () => {
  afterEach(() => setTempUnit(null));
  it('US readers get °F; a change converts by 1.8, a reading fully', () => {
    setTempUnit('F');
    expect(tempDelta(0.3)).toBe('0.5 °F');
    expect(tempReading(36.8)).toBe('98.2 °F');
    expect(formatMetric('temp_deviation_c', 0.3)).toMatch(/°F$/);
  });
  it('everyone else, and tests, keep °C', () => {
    expect(tempDelta(0.3)).toBe('0.3 °C');
    expect(formatMetric('temp_deviation_c', 0.3)).toMatch(/°C$/);
  });
});
