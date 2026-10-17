import { describe, it, expect } from 'vitest';
import { loadThemeMode } from './useWebTheme.js';
const store = (o) => ({ getItem: (k) => (k in o ? o[k] : null) });
describe('theme default', () => {
  it('matches the device when nobody chose', () => expect(loadThemeMode(store({}))).toBe('system'));
  it("an old auto-saved 'light' is not a choice", () => expect(loadThemeMode(store({ ayna_web_theme_v1: 'light' }))).toBe('system'));
  it("keeps an old 'dark' choice", () => expect(loadThemeMode(store({ ayna_web_theme_v1: 'dark' }))).toBe('dark'));
  it('keeps a new explicit light choice', () => expect(loadThemeMode(store({ ayna_web_theme_v2: 'light', ayna_web_theme_v1: 'dark' }))).toBe('light'));
});
