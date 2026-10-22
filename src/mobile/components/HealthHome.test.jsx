// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { devDemoRows } from '../../health/devDemo.js';
import { buildInsights } from '../../health/insights.js';
import HealthHome from './HealthHome.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const today = '2026-10-21';
let root;
let host;
afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

describe('health dashboard action flow', () => {
  it('opens a measured change, keeps its data and next steps together, and returns to the dashboard', () => {
    const rows = devDemoRows(today);
    const sections = buildInsights(rows, { today }).sections;
    const onOpenRoutine = vi.fn();
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
    act(() => root.render(<HealthHome today={today} rows={rows} sections={sections} onOpenRoutine={onOpenRoutine} />));

    const open = [...host.querySelectorAll('button')].find((button) => button.textContent.includes('See what to do'));
    expect(open).toBeTruthy();
    act(() => open.click());
    expect(host.textContent).toContain('What we noticed');
    expect(host.textContent).toContain('What you can do');
    expect(host.textContent).toContain('Your usual');
    expect(host.textContent).toContain('Your data came from');

    act(() => [...host.querySelectorAll('button')].find((button) => button.textContent.includes('Back to your dashboard')).click());
    expect(host.textContent).toContain('Your routine and shopping list');
    act(() => [...host.querySelectorAll('button')].find((button) => button.textContent.includes('Your routine and shopping list')).click());
    expect(onOpenRoutine).toHaveBeenCalledOnce();
  });
});
