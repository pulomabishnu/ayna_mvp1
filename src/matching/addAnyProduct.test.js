import { describe, it, expect, vi } from 'vitest';
import { getProductMatchDetailsForProduct, getProductById } from '../data/products.js';
import { requestResearch } from '../components/v3/AddProductDialog.jsx';

const q = { fullHealthIntake: { supportSelections: ['Cramps or period pain'], lifeStageSelections: ['I get periods regularly'], takesCurrent: 'No', allergyStatus: 'No' } };

describe('add any product (P2)', () => {
  it('a product she added that ayna has not checked gets no match, only "Checking this product"', () => {
    const d = getProductMatchDetailsForProduct({ id: 'user-heating-pad-1', name: 'Heating pad', category: 'cramp-relief', type: 'user', userAdded: true }, q);
    expect(d.matchStatus).toBe('safety-hold');
    expect(d.percent).toBeNull();
    expect(d.safetyHold.state).toBe('researching');
    expect(d.safetyHold.reason).toMatch(/added this yourself/);
  });
  it('a catalog product she added (flagged userAdded) keeps its real match', () => {
    const p = getProductById('p-thermacare');
    const d = getProductMatchDetailsForProduct({ ...p, userAdded: true }, q);
    expect(d.matchStatus).toBe('scored');
    expect(d.percent).toBeGreaterThan(0);
  });
  it('adding one asks the team to research it', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true }));
    await requestResearch('Brand X cramp patch', { fetchImpl });
    expect(fetchImpl).toHaveBeenCalledWith('/api/product-submissions', expect.objectContaining({ method: 'POST' }));
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toEqual({ name: 'Brand X cramp patch', source: 'ecosystem_add' });
  });
});
