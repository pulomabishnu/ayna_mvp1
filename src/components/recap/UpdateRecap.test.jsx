// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import UpdateRecap from './UpdateRecap.jsx';
import { diffPersonalization } from '../../matching/personalizationDiff.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const P = (id, percent) => ({ id, name: `Product ${id}`, brand: 'B', percent });
const before = { needs: [{ id: 's', label: 'Sleep' }], matches: [P('a', 90), P('b', 85), P('c', 80)] };
const after = { needs: [{ id: 's', label: 'Sleep' }, { id: 'c', label: 'Cramps' }], matches: [P('x', 95), P('a', 90), P('b', 85)] };

let host; let root;
const btn = (t) => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === t);
beforeEach(() => { document.body.innerHTML = ''; host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); });

describe('UpdateRecap', () => {
  it('walks only the slides that changed, with working actions', async () => {
    const d = diffPersonalization(before, after);
    const onAdd = vi.fn(); const onUndo = vi.fn(async () => true); const onClose = vi.fn(); const onOpen = vi.fn();
    await act(async () => root.render(<UpdateRecap diff={d} onAdd={onAdd} onUndo={onUndo} onClose={onClose} onOpenProduct={onOpen} onSeeAll={() => {}} onHistory={() => {}} />));
    const dlg = () => document.querySelector('[role="dialog"]');
    expect(dlg().textContent).toContain('Your ayna, updated');
    expect(dlg().textContent).toContain('New matches');
    await act(async () => btn('Next').click());
    expect(dlg().textContent).toContain('Now covering');
    expect(dlg().textContent).toContain('Cramps');
    await act(async () => btn('Next').click());
    expect(dlg().textContent).toContain('Your new #1 match');
    expect(dlg().textContent).toContain('Was: Product a');
    await act(async () => btn('Add to routine').click());
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ id: 'x' }));
    // moved -> removed -> done
    await act(async () => btn('Next').click());
    await act(async () => btn('Next').click());
    expect(dlg().textContent).toContain('Out of your top 6');
    expect(dlg().textContent).toContain('Product c');
    await act(async () => btn('Next').click());
    await act(async () => btn('Undo this change').click());
    expect(onUndo).toHaveBeenCalled();
    expect(dlg().textContent).toContain('Change undone');
    await act(async () => btn('Done').click());
    expect(onClose).toHaveBeenCalled();
  });
});
