// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import UpdatePop from './UpdatePop.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root; let host;
afterEach(() => { act(() => root?.unmount()); host?.remove(); });
const mount = (props) => { host = document.createElement('div'); host.className = 'ayna-mobile'; document.body.append(host); root = createRoot(host); act(() => root.render(<UpdatePop {...props} />)); };

describe("What's new for you (founder, Nov 11)", () => {
  it('shows nothing without an update', () => {
    mount({ update: null });
    expect(document.querySelector('.ay-upop')).toBeNull();
  });
  it('shows the count, the headline and each new product; Not for me and the main button work', () => {
    const onRemove = vi.fn(); const onSeeAll = vi.fn(); const onOpenProduct = vi.fn();
    const products = [{ id: 'a', name: 'Heat patch' }, { id: 'b', name: 'TENS unit' }];
    mount({ update: { title: '2 new matches for cramps', products }, onRemove, onSeeAll, onOpenProduct, onClose: () => {} });
    const card = document.querySelector('.ay-upop__card');
    expect(card.querySelector('.ay-upop__num').textContent).toBe('2');
    expect(card.textContent).toContain('2 new matches for cramps');
    expect(card.textContent).toContain('Heat patch');
    act(() => card.querySelector('.ay-upop__remove').click());
    expect(onRemove).toHaveBeenCalledWith(products[0]);
    act(() => card.querySelector('.ay-upop__item').click());
    expect(onOpenProduct).toHaveBeenCalledWith(products[0]);
    act(() => card.querySelector('.ay-upop__primary').click());
    expect(onSeeAll).toHaveBeenCalled();
  });
});
