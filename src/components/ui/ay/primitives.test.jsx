// @vitest-environment jsdom
import process from 'node:process';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'node:fs';
import path from 'node:path';
import { Chip, PillTabs, pillPanelProps, StickerButton, OutlineButton, Plate, FactRows, BigFact, ProgressCount, CountRing, DoDont, StandardsBand, ScallopEdge } from './index.js';
import { ScallopPlate as PdpPlate } from '../../pdp/PdpParts.jsx';
import { ScallopPlate } from './ScallopPlate.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root; let host;
afterEach(() => { act(() => root?.unmount()); host?.remove(); root = null; });
const mount = (el) => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); act(() => root.render(el)); };

describe('shared primitives (all-pages brief, Everywhere first)', () => {
  it('Chip shows state only through aria-pressed and .is-on', () => {
    const html = renderToStaticMarkup(<><Chip>Period</Chip><Chip selected>Sleep</Chip></>);
    expect(html).toContain('aria-pressed="false"');
    expect(html).toMatch(/class="ayk-chip is-on"[^>]*aria-pressed="true"/);
  });

  it('PillTabs: at most 5 tabs, roving focus with arrows, Home and End', () => {
    const tabs = ['A', 'B', 'C', 'D', 'E', 'F'].map((x) => ({ id: x.toLowerCase(), label: x }));
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    function T() {
      const [on, setOn] = useState('a');
      return <><PillTabs idBase="t" label="Test" tabs={tabs} active={on} onChange={setOn} /><div {...pillPanelProps('t', on, on)}>{on}</div></>;
    }
    mount(<T />);
    const list = host.querySelector('[role="tablist"]');
    expect(list.querySelectorAll('[role="tab"]')).toHaveLength(5);
    act(() => list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })));
    expect(host.querySelector('[aria-selected="true"]').textContent).toBe('E');
    act(() => list.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true })));
    expect(host.querySelector('[aria-selected="true"]').textContent).toBe('A');
    expect(host.querySelector('[role="tabpanel"]').getAttribute('aria-labelledby')).toBe('t-tab-a');
    spy.mockRestore();
  });

  it('buttons: one sticker primary, an outline secondary, links when given href', () => {
    const html = renderToStaticMarkup(<><StickerButton>Buy</StickerButton><OutlineButton href="/x">Save</OutlineButton></>);
    expect(html).toContain('class="ayk-btn is-primary"');
    expect(html).toMatch(/<a class="ayk-btn is-outline" href="\/x">/);
  });

  it('Plate reuses the PDP plate drawing; no image shows the brand name, never an empty oval', () => {
    expect(PdpPlate).toBe(ScallopPlate);
    const html = renderToStaticMarkup(<Plate fallback="Saalt" saved sticker="Period" />);
    expect(html).toContain('ayk-plate__name');
    expect(html).toContain('Saalt');
    expect(html).toContain('is-pink');
    expect(html).toContain('ayk-sticker');
  });

  it('facts: rows drop empty values, big numbers always carry a caption, progress is a count', () => {
    const rows = renderToStaticMarkup(<FactRows rows={[{ label: 'Format', value: 'Cup' }, { label: 'Price', value: '' }]} />);
    expect(rows).toContain('Format');
    expect(rows).not.toContain('Price');
    expect(renderToStaticMarkup(<BigFact value="80" unit="%" caption="said it felt softer" />)).toContain('said it felt softer');
    expect(renderToStaticMarkup(<ProgressCount done={2} total={7} unit="days" />)).toContain('2 of 7 days');
    expect(renderToStaticMarkup(<CountRing value={4} total={21} caption="cycle day" />)).toContain('4 of 21 cycle day');
  });

  it('Do / Don\'t shows 3 + 2 then Show all; standards band holds at most 3', () => {
    mount(<DoDont good={['a', 'b', 'c', 'd']} bad={['x', 'y', 'z']} />);
    expect(host.querySelectorAll('.is-good li:not([hidden])')).toHaveLength(3);
    expect(host.querySelectorAll('.is-bad li:not([hidden])')).toHaveLength(2);
    expect(host.textContent).toContain('Show all 4');
    expect(renderToStaticMarkup(<StandardsBand items={['1', '2', '3', '4']} />).match(/<li/g)).toHaveLength(3);
    expect(renderToStaticMarkup(<ScallopEdge shape="wave" />)).toContain('<path');
  });

  it('the stylesheet uses only --ay-* tokens: no raw colours, no 6-7px shadows', () => {
    const css = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ui/ay/ay-primitives.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(css).not.toMatch(/:\s*#[0-9a-f]{3,8}\b|\s#[0-9a-f]{3,8}\s*[;!]/i);
    expect(css).not.toMatch(/rgba?\(/);
    expect(css).not.toMatch(/\b[67]px [67]px/);
    for (const v of css.match(/var\(--[\w-]+/g)) expect(v).toMatch(/^var\(--ay(k)?-/);
  });
});
