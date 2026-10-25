// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ConfirmButton from './ConfirmButton.jsx';

let root; let host;
const btn = (text) => [...host.querySelectorAll('button')].find((b) => b.textContent.includes(text));
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  vi.useFakeTimers({ now: 1_000_000 });
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.useRealTimers(); });

async function mount(props) {
  const onConfirm = vi.fn();
  await act(async () => root.render(<ConfirmButton onConfirm={onConfirm} {...props}>Reset my ecosystem</ConfirmButton>));
  return onConfirm;
}

describe('two-step confirm', () => {
  it('a double click arms but does not confirm', async () => {
    const onConfirm = await mount({ armedLabel: 'Tap again to erase' });
    await act(async () => { btn('Reset').click(); });
    await act(async () => { vi.advanceTimersByTime(120); btn('Tap again').click(); });
    expect(onConfirm).not.toHaveBeenCalled();
    expect(btn('Tap again to erase')).toBeTruthy();
  });

  it('a deliberate second tap confirms', async () => {
    const onConfirm = await mount({ armedLabel: 'Tap again to erase' });
    await act(async () => { btn('Reset').click(); });
    await act(async () => { vi.advanceTimersByTime(700); btn('Tap again').click(); });
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(btn('Reset my ecosystem')).toBeTruthy();
  });

  it('the armed state names what goes and offers Cancel, which disarms', async () => {
    const onConfirm = await mount({ armedLabel: 'Tap again to erase your ecosystem, its tracking and your quiz answers.', cancelLabel: 'Cancel, keep everything' });
    expect(btn('Cancel')).toBeFalsy();
    await act(async () => { btn('Reset').click(); });
    expect(host.textContent).toContain('ecosystem, its tracking and your quiz answers');
    await act(async () => { btn('Cancel').click(); });
    expect(btn('Reset my ecosystem')).toBeTruthy();
    expect(btn('Cancel')).toBeFalsy();
    await act(async () => { vi.advanceTimersByTime(700); btn('Reset').click(); });
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('without cancelLabel nothing changes for other callers, and it disarms after the timeout', async () => {
    const onConfirm = await mount({ armedLabel: 'Tap again to remove this number' });
    await act(async () => { btn('Reset').click(); });
    expect(host.querySelectorAll('button')).toHaveLength(1);
    await act(async () => { vi.advanceTimersByTime(3100); });
    expect(btn('Reset my ecosystem')).toBeTruthy();
    await act(async () => { btn('Reset').click(); });
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
