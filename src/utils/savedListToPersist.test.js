// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { savedListToPersist } from './savedProductsStore.js';

const KEY = 'ayna_saved_for_later_v1';
beforeEach(() => { localStorage.clear(); });

describe('saving before the stored list has been restored', () => {
  it('merges the stored list (unfiltered) instead of shrinking it to one item', () => {
    localStorage.setItem(KEY, JSON.stringify({ a: { id: 'a' }, b: { id: 'b', userAdded: true } }));
    expect(Object.keys(savedListToPersist({ c: { id: 'c' } }, { restored: false })).sort()).toEqual(['a', 'b', 'c']);
  });
  it('an unsave before restore removes only that item', () => {
    localStorage.setItem(KEY, JSON.stringify({ a: { id: 'a' }, b: { id: 'b' } }));
    expect(Object.keys(savedListToPersist({}, { restored: false, removedId: 'a' }))).toEqual(['b']);
  });
  it('after restore the page list is the whole list', () => {
    localStorage.setItem(KEY, JSON.stringify({ a: { id: 'a' }, b: { id: 'b' } }));
    expect(savedListToPersist({ b: { id: 'b' } }, { restored: true })).toEqual({ b: { id: 'b' } });
  });
});
