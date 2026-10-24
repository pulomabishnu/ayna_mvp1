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

  it('opens a measured change, keeps its data and next steps together, and returns to the dashboard', () => {
    const rows = devDemoRows(today);
    const sections = buildInsights(rows, { today }).sections;
    const onOpenRoutine = vi.fn();
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
    act(() => root.render(<HealthHome today={today} rows={rows} sections={sections} onOpenRoutine={onOpenRoutine} />));

    // The week's changes keep explainWeek's own order (no hard-coded priority): pick Sleep.
    const sleepTab = [...host.querySelectorAll('.ay-hh-hero [role="tab"]')].find((b) => b.textContent === 'Sleep');
    if (sleepTab) act(() => sleepTab.click());
    const open = [...host.querySelectorAll('button')].find((button) => button.textContent.includes('What you can do and the data'));
    expect(open).toBeTruthy();
    act(() => open.click());
    // What changed -> What it may affect -> What you can do -> See data.
    expect(host.textContent).toContain('What it may affect');
    expect(host.textContent).toContain('What you can do');
    expect(host.textContent).toContain('See data');
    expect(host.querySelector('.ay-hh-action h3').textContent).not.toMatch(/\d/);
    expect(host.textContent).toContain('Your usual');
    expect(host.textContent).toContain('Your data came from');
    expect(host.querySelector('a[href="https://www.cdc.gov/heart-disease/about/sleep-and-heart-health.html"]')).toBeTruthy();

    act(() => [...host.querySelectorAll('button')].find((button) => button.textContent.includes('Back to your dashboard')).click());
    expect(host.textContent).toContain('Your routine and shopping list');
    act(() => [...host.querySelectorAll('button')].find((button) => button.textContent.includes('Your routine and shopping list')).click());
    expect(onOpenRoutine).toHaveBeenCalledOnce();
  });
});
