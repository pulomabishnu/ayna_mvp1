import { describe, it, expect } from 'vitest';
import { aynaSourceFor, worksWith } from './aynaIntegrations.js';
import { ALL_PRODUCTS } from '../data/products.js';

const byId = (id) => ALL_PRODUCTS.find((p) => p.id === id);

describe('aynaIntegrations', () => {
  it('adds ayna for the Oura ring, after its platforms and integrations', () => {
    const w = worksWith(byId('d-oura'));
    expect(w.ayna).toEqual({ id: 'oura', name: 'Oura' });
    expect(w.items.slice(0, 3)).toEqual(['iOS', 'Android', 'Apple Health']);
    expect(w.items[w.items.length - 1]).toBe('ayna');
  });

  it('matches Apple Health itself through the Apple Health source', () => {
    expect(aynaSourceFor(byId('d-apple-health'))?.id).toBe('apple_health');
  });

  it('does not add ayna just because a product lists an integration ayna reads', () => {
    // Natural Cycles lists Apple Health and Oura, but its own data is not a source ayna connects to.
    const w = worksWith(byId('d-natural-cycles'));
    expect(w.ayna).toBeNull();
    expect(w.items).toEqual(['iOS', 'Android', 'Apple Health', 'Oura Ring']);
  });

  it('never matches Flo-branded physical products to the Flo app import', () => {
    expect(aynaSourceFor(byId('p-flo-gummies'))).toBeNull();
    expect(aynaSourceFor({ id: 'd-flo', name: 'Flo Period Tracker', type: 'digital' })?.id).toBe('flo');
  });

  it('routes devices without a direct connection through Apple Health or Health Connect', () => {
    expect(aynaSourceFor({ id: 'd-garmin', name: 'Garmin Venu', type: 'digital' })?.id).toBe('apple_health');
    expect(aynaSourceFor({ id: 'd-fitbit', name: 'Fitbit Charge 6', type: 'digital' })?.id).toBe('health_connect');
    expect(aynaSourceFor({ id: 'd-whoop', name: 'WHOOP 4.0', type: 'digital' })).toBeNull();
  });

  it('ignores a source that is not connectable', () => {
    const sources = [{ id: 'oura', name: 'Oura', availability: 'blocked' }, { id: 'apple_health', name: 'Apple Health', availability: 'blocked' }];
    expect(aynaSourceFor(byId('d-oura'), sources)).toBeNull();
  });

  it('is empty for products with no platforms, integrations or source', () => {
    expect(worksWith(byId('p-saalt-cup'))).toEqual({ items: [], ayna: null });
  });
});
