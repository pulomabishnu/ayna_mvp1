/* global process, global */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { lookupDsldProduct } from './llm-recommendations.js';

// Real shape confirmed live against api.ods.od.nih.gov/dsld/v9/search-filter —
// see this function's own comments for how the old endpoint/shape were wrong.
function realShapedResponse() {
  return {
    hits: [
      {
        _id: '252824',
        _score: 42.3,
        _source: {
          brandName: 'Thorne',
          fullName: 'Vitamin C with Flavonoids',
          allIngredients: [
            { name: 'Vitamin C', ingredientGroup: 'Vitamin C', category: 'vitamin', notes: '' },
            { name: 'Bioflavonoids', ingredientGroup: 'Bioflavonoids', category: 'other', notes: '' },
          ],
        },
      },
    ],
  };
}

describe('lookupDsldProduct', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns null for a too-short name without ever fetching', async () => {
    const result = await lookupDsldProduct('a');
    expect(result).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('hits the real search-filter endpoint, not the old broken /label path', async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => realShapedResponse() });
    await lookupDsldProduct('Thorne Vitamin C');
    const calledUrl = fetch.mock.calls[0][0];
    expect(calledUrl).toContain('/dsld/v9/search-filter');
    expect(calledUrl).toContain('q=Thorne');
    expect(calledUrl).not.toContain('/dsld/v9/label');
  });

  it('parses the flat hits[0]._source shape (not the old nested hits.hits assumption)', async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => realShapedResponse() });
    const result = await lookupDsldProduct('Thorne Vitamin C');
    expect(result).toEqual({
      verified: true,
      brand: 'Thorne',
      ingredients: ['Vitamin C', 'Bioflavonoids'],
      dsldId: '252824',
      imageUrl: 'https://api.ods.od.nih.gov/dsld/s3/pdf/thumbnails/252824.jpg',
      labelUrl: 'https://dsld.od.nih.gov/label/252824',
    });
  });

  it('reads ingredient names from allIngredients[].name, not the old dietaryIngredients[].ingredientName', async () => {
    // A response shaped like the OLD (wrong) assumption should yield no
    // ingredients now — proves the fix actually reads the real field.
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        hits: [{ _id: '1', _source: { brandName: 'X', dietaryIngredients: [{ ingredientName: 'Should not be read' }] } }],
      }),
    });
    const result = await lookupDsldProduct('Some Product');
    expect(result.ingredients).toEqual([]);
  });

  it('returns null when the API responds not-ok', async () => {
    fetch.mockResolvedValue({ ok: false });
    const result = await lookupDsldProduct('Thorne Vitamin C');
    expect(result).toBeNull();
  });

  it('returns null when there are no hits', async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => ({ hits: [] }) });
    const result = await lookupDsldProduct('Nonexistent Product Xyz');
    expect(result).toBeNull();
  });

  it('returns null (not a throw) on a network error', async () => {
    fetch.mockRejectedValue(new Error('ECONNRESET'));
    const result = await lookupDsldProduct('Thorne Vitamin C');
    expect(result).toBeNull();
  });
});
