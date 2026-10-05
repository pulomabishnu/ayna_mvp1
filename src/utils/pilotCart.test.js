// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';

const KEY = 'ayna-pilot-cart-v1';
async function freshCart() { vi.resetModules(); return import('./pilotCart.js'); }
beforeEach(() => { window.localStorage.clear(); vi.restoreAllMocks(); });

describe('cart contents', () => {
  it('keeps different options of one product as separate lines and merges the same option', async () => {
    const cart = await freshCart();
    cart.addToCart('p-always-infinity', 'target-94912100', 2);
    cart.addToCart('p-always-infinity', 'target-51693821', 1);
    cart.addToCart('p-always-infinity', 'target-94912100', 1);
    expect(cart.getCart()).toEqual([
      { productId: 'p-always-infinity', variantId: 'target-94912100', quantity: 3 },
      { productId: 'p-always-infinity', variantId: 'target-51693821', quantity: 1 },
    ]);
    expect(cart.cartCount()).toBe(4);
  });
  it('caps a line at 10 and tells the caller, and refuses a bad quantity', async () => {
    const cart = await freshCart();
    expect(cart.addToCart('p-single', '', 8)).toEqual({ added: true, capped: false, full: false });
    expect(cart.addToCart('p-single', '', 5)).toEqual({ added: true, capped: true, full: false });
    expect(cart.getCart()[0].quantity).toBe(10);
    for (const quantity of [0, -2, 1.5, NaN, '3']) expect(cart.addToCart('p-other', '', quantity).added, String(quantity)).toBe(false);
    expect(cart.getCart()).toHaveLength(1);
  });
  it('stops at 20 different lines but still lets an existing line grow', async () => {
    const cart = await freshCart();
    for (let i = 0; i < 20; i++) expect(cart.addToCart(`p-item-${i}`, '', 1).added).toBe(true);
    expect(cart.addToCart('p-one-too-many', '', 1)).toEqual({ added: false, capped: false, full: true });
    expect(cart.addToCart('p-item-3', '', 1).added).toBe(true);
    expect(cart.getCart()).toHaveLength(20);
  });
  it('changes quantity, removes a line, and removes a line whose quantity drops below 1', async () => {
    const cart = await freshCart();
    cart.addToCart('p-a', 's1', 1); cart.addToCart('p-a', 's2', 2); cart.addToCart('p-b', '', 3);
    cart.setCartQuantity('p-a', 's2', 5);
    expect(cart.getCart().find(l => l.variantId === 's2').quantity).toBe(5);
    expect(cart.getCart().find(l => l.variantId === 's1').quantity).toBe(1);
    cart.setCartQuantity('p-a', 's2', 99);
    expect(cart.getCart().find(l => l.variantId === 's2').quantity).toBe(10);
    cart.setCartQuantity('p-b', '', 0);
    expect(cart.getCart().map(l => l.productId + l.variantId)).toEqual(['p-as1', 'p-as2']);
    cart.removeFromCart('p-a', 's1');
    expect(cart.getCart()).toEqual([{ productId: 'p-a', variantId: 's2', quantity: 10 }]);
    cart.clearCart();
    expect(cart.getCart()).toEqual([]);
  });
  it('writes every change to storage as it happens', async () => {
    const cart = await freshCart();
    const seen = [];
    const original = window.localStorage.setItem.bind(window.localStorage);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((k, v) => { seen.push(v); original(k, v); });
    cart.addToCart('p-a', '', 1); cart.addToCart('p-a', '', 1);
    expect(seen.map(v => JSON.parse(v)[0].quantity)).toEqual([1, 2]);
  });
});

describe('cart persistence', () => {
  it('survives a page reload', async () => {
    let cart = await freshCart();
    cart.addToCart('p-always-infinity', 'target-94912100', 2); cart.addToCart('p-single', '', 1);
    cart = await freshCart(); // simulates reloading the page
    expect(cart.getCart()).toEqual([{ productId: 'p-always-infinity', variantId: 'target-94912100', quantity: 2 }, { productId: 'p-single', variantId: '', quantity: 1 }]);
  });
  it('never stores a price, and ignores prices or junk someone put in storage', async () => {
    window.localStorage.setItem(KEY, JSON.stringify([
      { productId: 'p-a', variantId: 's1', quantity: 2, price: 1, unitCents: 1, total: 1 },
      { productId: '../bad', variantId: '', quantity: 1 }, { productId: 'p-b', variantId: '', quantity: 0 },
      { productId: 'p-b', variantId: '', quantity: 1.5 }, 'nope', null, { productId: 'p-c', variantId: 'x'.repeat(101), quantity: 1 },
      { productId: 'p-d', variantId: '', quantity: 500 },
    ]));
    const cart = await freshCart();
    expect(cart.getCart()).toEqual([{ productId: 'p-a', variantId: 's1', quantity: 2 }, { productId: 'p-d', variantId: '', quantity: 10 }]);
    cart.addToCart('p-e', '', 1);
    expect(window.localStorage.getItem(KEY)).not.toMatch(/price|unitCents|total/);
  });
  it('starts empty on corrupted storage', async () => {
    window.localStorage.setItem(KEY, '{not json');
    expect((await freshCart()).getCart()).toEqual([]);
    window.localStorage.setItem(KEY, '{"a":1}');
    expect((await freshCart()).getCart()).toEqual([]);
  });
  it('keeps working in memory when browser storage is blocked', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    const cart = await freshCart();
    expect(() => cart.addToCart('p-a', '', 2)).not.toThrow();
    expect(cart.getCart()).toEqual([{ productId: 'p-a', variantId: '', quantity: 2 }]);
  });
  it('picks up a change made in another tab', async () => {
    const cart = await freshCart();
    cart.addToCart('p-a', '', 1);
    window.localStorage.setItem(KEY, JSON.stringify([{ productId: 'p-z', variantId: '', quantity: 4 }]));
    window.dispatchEvent(new StorageEvent('storage', { key: KEY }));
    expect(cart.getCart()).toEqual([{ productId: 'p-z', variantId: '', quantity: 4 }]);
  });
});
