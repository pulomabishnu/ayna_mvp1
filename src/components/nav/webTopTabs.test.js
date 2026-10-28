import { expect, it } from 'vitest';
import { WEB_TOP_TABS, MAIN_TABS, APP_TABS } from './mainTabs.js';
it('puts Home first in the top navigation while preserving the mobile centre tab', () => {
  expect(WEB_TOP_TABS.map((tab) => tab.label)).toEqual(['Home', 'Shop', 'Services', 'Library', 'Community']);
  expect(new Set(WEB_TOP_TABS.map((tab) => tab.href)).size).toBe(5);
  expect(MAIN_TABS[2].key).toBe('today');
  expect(APP_TABS[2].key).toBe('home');
});
