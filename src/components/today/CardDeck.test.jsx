// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import CardDeck from './CardDeck.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let host; let root;
afterEach(() => { act(() => root?.unmount()); host?.remove(); sessionStorage.clear(); vi.useRealTimers(); });
const mount = (el) => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); act(() => root.render(el)); };
const btn = (text) => [...host.querySelectorAll('button')].find((b) => b.textContent.trim() === text);
const items = (onAnswer) => ['a', 'b', 'c'].map((k) => ({ key: k, title: `Q ${k}`, node: <li key={k}><h3>Q {k}</h3><button type="button" className="ay-chip" onClick={() => onAnswer(k)}>Yes {k}</button><button type="button" className="ay-today__readmore" aria-expanded="false">Read more</button></li> }));

describe('CardDeck: the For today stack', () => {
  it('shows only the top card, a count, and moves on with Later; the change is announced', () => {
    vi.useFakeTimers();
    mount(<CardDeck items={items(() => {})} storageKey="t1" />);
    expect(host.textContent).toContain('1 of 3');
    expect(host.textContent).toContain('Q a');
    expect(host.textContent).not.toContain('Q b');
    act(() => { btn('Later').click(); vi.runAllTimers(); });
    expect(host.textContent).toContain('2 of 3');
    expect(host.querySelector('[aria-live]').textContent).toContain('Q b');
  });
  it('an answer runs its own handler first, then the card goes; Read more keeps it', () => {
    vi.useFakeTimers();
    const onAnswer = vi.fn();
    mount(<CardDeck items={items(onAnswer)} storageKey="t2" />);
    act(() => { btn('Read more').click(); vi.runAllTimers(); });
    expect(host.textContent).toContain('Q a');
    act(() => { btn('Yes a').click(); vi.runAllTimers(); });
    expect(onAnswer).toHaveBeenCalledWith('a');
    expect(host.textContent).toContain('Q b');
  });
  it('Show all lists every card (nothing is removed); the end says all done', () => {
    vi.useFakeTimers();
    mount(<CardDeck items={items(() => {})} storageKey="t3" />);
    act(() => btn('Show all').click());
    expect(['Q a', 'Q b', 'Q c'].every((q) => host.textContent.includes(q))).toBe(true);
    act(() => btn('Stack them').click());
    for (let i = 0; i < 3; i += 1) act(() => { btn('Later').click(); vi.runAllTimers(); });
    expect(host.textContent).toContain('All done for today');
  });
});
