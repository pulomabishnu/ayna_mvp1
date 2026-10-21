// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { installNoEmDash } from './noEmDashDom';

let stop = () => {};
afterEach(() => { stop(); document.body.innerHTML = ''; });

describe('page text net: PCOS -> PMOS', () => {
  it('renames visible text, attributes and the page title, now and when it changes', async () => {
    document.body.innerHTML = '<main><h1>PCOS care</h1><img alt="Polycystic ovary syndrome chart"><select><option value="PCOS">PCOS</option></select><input value="PCOS"></main>';
    document.title = 'PCOS: What It Is | ayna';
    stop = installNoEmDash(document.body);
    expect(document.querySelector('h1').textContent).toBe('PMOS care');
    expect(document.querySelector('img').getAttribute('alt')).toBe('Polyendocrine metabolic ovarian syndrome chart');
    // the option label changes; its saved value does not
    expect(document.querySelector('option').textContent).toBe('PMOS');
    expect(document.querySelector('option').value).toBe('PCOS');
    // what someone typed is never changed
    expect(document.querySelector('input').value).toBe('PCOS');
    expect(document.title).toBe('PMOS: What It Is | ayna');
    const p = document.createElement('p');
    p.textContent = 'AI reply about PCOS';
    document.body.appendChild(p);
    await new Promise((r) => setTimeout(r, 0));
    expect(p.textContent).toBe('AI reply about PMOS');
  });

  it('keeps published titles in links to other sites, and r/PCOS', () => {
    document.body.innerHTML = '<a id="ext" href="https://pubmed.ncbi.nlm.nih.gov/1">Spearmint tea in PCOS: an RCT</a><a id="own" href="/library/pcos-basics">PCOS basics</a><p id="r">From r/PCOS</p><span data-keep-name>PCOS Guideline 2023</span>';
    stop = installNoEmDash(document.body);
    expect(document.getElementById('ext').textContent).toBe('Spearmint tea in PCOS: an RCT');
    expect(document.getElementById('own').textContent).toBe('PMOS basics');
    expect(document.getElementById('own').getAttribute('href')).toBe('/library/pcos-basics');
    expect(document.getElementById('r').textContent).toBe('From r/PCOS');
    expect(document.querySelector('[data-keep-name]').textContent).toBe('PCOS Guideline 2023');
  });
});
