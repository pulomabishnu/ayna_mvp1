/**
 * Every Partner Studio screen renders for every tenant, including a brand with
 * nothing in Phase 1 scope. Uses fictional seed data; a real run is checked the
 * same way locally with PARTNER_STUDIO_REAL=1 after npm run partner:benchmark.
 */
import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import placeholder from '../../api/_partnerStudio/snapshot.js';
import { fixtureSnapshot } from './engine/fixture.js';

// eslint-disable-next-line no-undef
const snapshot = placeholder.run && process.env.PARTNER_STUDIO_REAL === '1' ? placeholder : fixtureSnapshot();
import { Overview, Actions, Evidence, Claims, Share, Losses, Competitors, Feed, Reports, OutOfScope } from './views.jsx';
import { inScope } from './format.js';
import { rollupCsv } from './csv.js';

const noop = () => {};
describe('Partner Studio screens', () => {
  for (const [name, raw] of Object.entries(snapshot.brands)) {
    it(`renders every screen for ${name}`, () => {
      const b = { name, ...raw };
      const data = { run: snapshot.run, categories: snapshot.categories, brands: [], brand: b, outOfScope: snapshot.outOfScope };
      if (raw.empty || !inScope(b)) {
        expect(renderToStaticMarkup(<OutOfScope b={b} outOfScope={snapshot.outOfScope} />)).toMatch(/Phase 1/);
        return;
      }
      const cat = b.categories[0]?.id;
      const screens = [
        <Overview key="o" data={data} b={b} go={noop} actionState={{}} />,
        <Actions key="a" b={b} actionState={{}} setAction={noop} />,
        <Evidence key="e" b={b} openSource={noop} />,
        <Claims key="c" b={b} />,
        <Share key="s" data={data} b={b} cat={cat} setCat={noop} />,
        <Losses key="l" b={b} cat={cat} setCat={noop} />,
        <Competitors key="p" b={b} />,
        <Feed key="f" b={b} ack={{}} setAck={noop} />,
        <Reports key="r" data={data} b={b} onExport={noop} />,
      ];
      for (const s of screens) expect(renderToStaticMarkup(s).length).toBeGreaterThan(50);
      expect(renderToStaticMarkup(screens[4])).toMatch(/Synthetic benchmark/);
      expect(rollupCsv(data).split('\n')[0]).toMatch(/^brand,run_id/);
    });
  }
});
