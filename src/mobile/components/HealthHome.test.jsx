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
  it('shows the selected routine and a dated self-report on Today', () => {
    const product = { id: 'heat-wrap', name: 'Heat wrap' };
    const onOpenRoutine = vi.fn();
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
    act(() => root.render(<HealthHome today={today} routineProducts={[product]} routineOutcomes={{ 'heat-wrap': [{ day: today, rating: 'helping' }] }} onOpenRoutine={onOpenRoutine} />));

    expect(host.textContent).toContain('What fits in your routine');
    expect(host.textContent).toContain('Heat wrap');
    expect(host.textContent).toContain('You marked this product “helping”');
    expect(host.textContent).toContain('not a measure of medical effectiveness');
    expect(host.querySelector('[aria-label="Health areas"]')).toBeNull();
    act(() => [...host.querySelectorAll('button')].find((button) => button.textContent.includes('View and edit your routine')).click());
    expect(onOpenRoutine).toHaveBeenCalledOnce();
  });

  it('summarizes repeated product reports and opens the monthly symptom check-in', () => {
    const product = { id: 'heat-wrap', name: 'Heat wrap' };
    const onOpenCheckin = vi.fn();
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
    act(() => root.render(<HealthHome today={today} routineProducts={[product]} routineOutcomes={{ 'heat-wrap': [
      { day: '2026-10-19', rating: 'helping' }, { day: '2026-10-20', rating: 'same' }, { day: today, rating: 'helping' },
    ] }} onOpenRoutine={() => {}} onOpenCheckin={onOpenCheckin} />));

    expect(host.textContent).toContain('Marked helping on 2 of 3 check-ins');
    expect(host.textContent).toContain('do not show that a product caused a health change');
    act(() => [...host.querySelectorAll('button')].find((button) => button.textContent.includes('Log how you felt this month')).click());
    expect(onOpenCheckin).toHaveBeenCalledOnce();
  });

  it('opens a finding in place (number in the title, the four parts, .gov links) and keeps the routine one tab away', () => {
    const rows = devDemoRows(today);
    const sections = buildInsights(rows, { today }).sections;
    const onOpenRoutine = vi.fn();
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
    act(() => root.render(<HealthHome today={today} rows={rows} sections={sections} onOpenRoutine={onOpenRoutine} />));

    // Your week at a glance comes first, with words and her usual.
    expect(host.querySelector('.ay-db-glance')).toBeTruthy();
    expect(host.querySelector('.ay-db-glance').textContent).toContain('usual');
    // Five areas at most, as pill tabs.
    const tabs = [...host.querySelectorAll('[aria-label="Health areas"] [role="tab"]')].map((t) => t.textContent);
    expect(tabs[0]).toBe('Summary');
    expect(tabs.length).toBeLessThanOrEqual(5);

    // The week's changes are a calm list; each title carries its number.
    const titles = [...host.querySelectorAll('.ay-db-finding h3 button')];
    expect(titles.length).toBeGreaterThan(0);
    const sleep = titles.find((b) => b.textContent.startsWith('Sleep:')) || titles[0];
    expect(sleep.textContent).toMatch(/\d/);
    act(() => sleep.click());
    // What changed -> What it can mean -> What you can do (-> When to talk to a clinician, when relevant).
    expect(host.textContent).toContain('What changed');
    expect(host.textContent).toContain('What it can mean');
    expect(host.textContent).toContain('What you can do');
    expect(host.textContent).toContain('Your usual');
    expect(host.textContent).toContain('Your data came from');
    const links = [...host.querySelectorAll('.ay-db-finding-body a')].map((a) => new URL(a.href).hostname);
    expect(links.length).toBeGreaterThan(0);
    expect(links.every((h) => h.endsWith('.gov'))).toBe(true);
    // The old two-destination link is gone (dashboard audit 9.1).
    expect(host.textContent).not.toContain('What you can do and the data');

    act(() => [...host.querySelectorAll('[role="tab"]')].find((t) => t.textContent === 'Routine').click());
    act(() => [...host.querySelectorAll('button')].find((button) => button.textContent.includes('Your routine and shopping list')).click());
    expect(onOpenRoutine).toHaveBeenCalledOnce();
  });
});
