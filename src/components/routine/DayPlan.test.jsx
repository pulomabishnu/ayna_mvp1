// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false, isPluginAvailable: () => false } }));
vi.mock('@capacitor/local-notifications', () => ({ LocalNotifications: {} }));

import DayPlan from './DayPlan.jsx';
import { readMeds, MEDS_KEY } from '../../health/medications.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let host;
let root;
const btn = (text) => [...host.querySelectorAll('button')].find((b) => b.textContent.trim() === text);
const type = (input, value) => {
  const set = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value').set;
  set.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
};

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});

describe('DayPlan', () => {
  it('empty state says what it does', async () => {
    await act(async () => root.render(<DayPlan />));
    expect(host.textContent).toContain('Add your medications and the things you do each day');
  });

  it('add a medication, mark it taken, undo', async () => {
    await act(async () => root.render(<DayPlan />));
    await act(async () => btn('Add medication').click());
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog.textContent).toContain("doesn't check doses");
    const [name, dose] = dialog.querySelectorAll('input');
    await act(async () => { type(name, 'Levothyroxine'); type(dose, '50'); });
    const time = dialog.querySelector('input[type="time"]');
    const t = new Date(Date.now() + 2 * 3600000);
    await act(async () => type(time, `${String(t.getHours()).padStart(2, '0')}:00`));
    await act(async () => { dialog.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
    expect(readMeds().meds[0].name).toBe('Levothyroxine');
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(host.textContent).toContain('Levothyroxine');
    expect(host.textContent).toContain('0 of 1 done');
    await act(async () => btn('Taken').click());
    expect(host.textContent).toContain('1 of 1 done');
    expect(JSON.parse(localStorage.getItem(MEDS_KEY)).doses[0].status).toBe('taken');
    await act(async () => btn('Undo').click());
    expect(host.textContent).toContain('0 of 1 done');
  });

  it('a bad entry shows field errors and saves nothing', async () => {
    await act(async () => root.render(<DayPlan />));
    await act(async () => btn('Add medication').click());
    const dialog = document.querySelector('[role="dialog"]');
    await act(async () => { dialog.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
    expect(document.querySelector('[role="dialog"]').textContent).toContain('Enter the medication name');
    expect(readMeds().meds).toHaveLength(0);
  });

  it('activity with a check-in asks how she feels after Done', async () => {
    await act(async () => root.render(<DayPlan />));
    await act(async () => btn('Add activity').click());
    await act(async () => btn('Walk').click());
    const dialog = document.querySelector('[role="dialog"]');
    await act(async () => { dialog.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
    await act(async () => btn('Done').click());
    expect(host.textContent).toContain('How do you feel now?');
    await act(async () => btn('Better').click());
    expect(host.textContent).toContain('Felt better after');
  });
});
