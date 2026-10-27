// @vitest-environment jsdom
// Every registered tip points at something real (founder Oct 27 01:12: "make sure the tutorial works
// for every single thing"). Two checks:
//   1. Source: every data-tour value and class a tip's selector names exists in src (no stale anchors
//      after a rename or a redesign).
//   2. Render: the components that carry Home, Shop, Services and Compare anchors are mounted and each
//      of their tips' selectors finds an element (the full screens need the app shell, so the parts are
//      mounted inside the same roots the screens use).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import { SCREENS, WEB_SCREENS, MAX_TIPS, partsOf, topScreens } from './tips.js';
import { HomeHero } from '../components/HomeHero.jsx';
import CardDeck from '../../components/today/CardDeck.jsx';
import TodayViews from '../components/TodayViews.jsx';
import ServiceCard from '../../components/cards/ServiceCard.jsx';
import { CompareToggle } from '../../components/compare/CompareControls.jsx';
import { splitPostTitle } from '../../components/community/postCard.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const SRC = join(import.meta.dirname, '..', '..');
const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(jsx?|css)$/.test(name) && !/\.test\./.test(name)) files.push(p);
  }
}(SRC));
const code = files.filter((f) => /\.jsx?$/.test(f) && !f.endsWith('tips.js')).map((f) => readFileSync(f, 'utf8')).join('\n');

// A data-tour written literally, as a prop default (tour = 'chat-input'), or as a template (`you-${r.key}` with key: 'beliefs').
const hasTour = (v) => code.includes(`data-tour="${v}"`) || new RegExp(`tour = '${v}'`).test(code)
  || (code.includes('data-tour={`you-${r.key}`}') && v.startsWith('you-') && code.includes(`key: '${v.slice(4)}'`));
const all = [...SCREENS.map((s) => ['app', s]), ...WEB_SCREENS.map((s) => ['web', s])];
const selectorsOf = (s) => [s.root, ...s.tips.map((t) => t.anchor)];
const tourValues = (sel) => [...sel.matchAll(/data-tour="([a-z-]+)"/g)].map((m) => m[1]);
const classNames = (sel) => [...sel.replace(/\[[^\]]*\]/g, ' ').matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]);

describe('tip registry', () => {
  it('every tip is one short sentence, no em dash, at most 2 shown per group', () => {
    for (const [, s] of all) {
      expect(MAX_TIPS).toBe(2);
      for (const t of s.tips) {
        expect(t.text, t.id).not.toMatch(/—/);
        expect(t.text.length, t.id).toBeLessThanOrEqual(70);
        expect(t.text.split(/[.?!](\s|$)/).filter((x) => x && x.trim()).length, t.id).toBe(1);
      }
    }
  });
  it('uses tonight’s names: no Explore, Today tab or My dashboard in tip text', () => {
    for (const [, s] of all) for (const t of s.tips) expect(t.text, t.id).not.toMatch(/\bExplore\b|\bToday tab\b|My dashboard/);
  });
  it('every part belongs to a real page screen on the same surface', () => {
    for (const list of [SCREENS, WEB_SCREENS]) {
      const tops = topScreens(list).map((s) => s.id);
      for (const s of list.filter((x) => x.within)) {
        for (const id of [].concat(s.within)) expect(tops, `${s.id} within ${id}`).toContain(id);
      }
      expect(partsOf(list.find((s) => s.id === tops[0]), list)).toBeInstanceOf(Array);
    }
  });
  it('screen ids are unique per surface', () => {
    for (const list of [SCREENS, WEB_SCREENS]) expect(new Set(list.map((s) => s.id)).size).toBe(list.length);
  });
});

describe('every tip selector names something that exists in src', () => {
  for (const [surface, s] of all) {
    it(`${surface} ${s.id}`, () => {
      for (const sel of selectorsOf(s)) {
        for (const v of tourValues(sel)) expect(hasTour(v), `${s.id}: data-tour="${v}"`).toBe(true);
        for (const v of [...sel.matchAll(/data-tab="([a-z-]+)"/g)].map((m) => m[1])) expect(code.includes(`id: '${v}'`), `${s.id}: data-tab="${v}"`).toBe(true);
        for (const c of classNames(sel)) expect(code.includes(c), `${s.id}: .${c}`).toBe(true);
        expect(() => document.querySelector(sel), sel).not.toThrow();
      }
    });
  }
});

let host; let root;
afterEach(() => { act(() => root?.unmount()); root = null; host?.remove(); sessionStorage.clear(); });
const mount = (el, attrs = {}) => {
  host = document.createElement('div');
  host.className = 'ayna-mobile';
  for (const [k, v] of Object.entries(attrs)) host.setAttribute(k, v);
  document.body.append(host);
  root = createRoot(host);
  act(() => root.render(el));
};
const tip = (list, screenId, tipId) => list.find((s) => s.id === screenId).tips.find((t) => t.id === tipId);
const expectFound = (list, screenId, tipIds) => {
  for (const id of tipIds) expect(document.querySelector(tip(list, screenId, id).anchor), `${screenId}/${id}`).not.toBeNull();
  const s = list.find((x) => x.id === screenId);
  expect(document.querySelector(s.root), `${screenId} root`).not.toBeNull();
};

describe('rendered parts carry their tips’ anchors', () => {
  const today = '2026-10-27';
  const week = Array.from({ length: 7 }, (_, i) => ({ day: `2026-10-${21 + i}`, on: i % 2 === 0, today: i === 6 }));
  it('Home hero: rings, the Rundown bubble and the streak', () => {
    mount(<div data-tour="home"><HomeHero name="Maya" today={today} onOpenMetric={() => {}} onConnect={() => {}} streak={{ count: 3, loggedToday: false, week }} onLog={() => {}} /></div>);
    // Rundown.jsx says how many cards it has; the bubble shows once it does.
    act(() => { window.dispatchEvent(new CustomEvent('ayna:rundown-state', { detail: { count: 4 } })); });
    expectFound(SCREENS, 'home', ['home-rings', 'home-rundown']);
    expectFound(SCREENS, 'home-streak', ['home-streak']);
  });
  it('For today: Later, and the titles when there is more than one card', () => {
    const items = ['a', 'b'].map((k) => ({ key: k, title: `Q ${k}`, node: <li key={k}><h3>Q {k}</h3></li> }));
    mount(<div data-tour="home"><CardDeck items={items} storageKey="tips-test" /></div>);
    expectFound(SCREENS, 'home-today', ['deck-later']);
    expectFound(SCREENS, 'home-deck-titles', ['deck-titles']);
  });
  it('Home views: the Your week / For today / Routine switch', () => {
    mount(<div data-tour="home"><TodayViews week={<p>week</p>} today={<p>today</p>} routine={<div data-tour="routine"><p>r</p></div>} /></div>);
    expectFound(SCREENS, 'home-views', ['home-views']);
    expectFound(SCREENS, 'home-routine', ['home-routine']);
  });
  it('Services: a service card', () => {
    mount(<div data-tour="explore" data-kind="services"><ServiceCard service={{ id: 's1', name: 'Telehealth visit', brand: 'Clinic', category: 'services' }} as="button" onOpen={() => {}} /></div>);
    expect(document.querySelector(tip(SCREENS, 'services', 'services-card').anchor)).not.toBeNull();
  });
  it('Shop: the Compare button', () => {
    mount(<div data-tour="explore"><CompareToggle /></div>);
    expectFound(SCREENS, 'shop-compare', ['compare-toggle']);
  });
});

describe('community post titles', () => {
  it('the first sentence is the title, the rest the body', () => {
    expect(splitPostTitle('Has anyone tried a cup? Which size worked?')).toEqual({ title: 'Has anyone tried a cup?', rest: 'Which size worked?' });
    expect(splitPostTitle('Short and sweet')).toEqual({ title: 'Short and sweet', rest: '' });
    expect(splitPostTitle('My routine\nHeat pad, then tea.')).toEqual({ title: 'My routine', rest: 'Heat pad, then tea.' });
    const long = 'word '.repeat(40).trim();
    expect(splitPostTitle(long)).toEqual({ title: '', rest: long });
    expect(splitPostTitle('')).toEqual({ title: '', rest: '' });
  });
});
