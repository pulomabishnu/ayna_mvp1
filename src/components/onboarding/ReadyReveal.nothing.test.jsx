import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ReadyReveal from './ReadyReveal.jsx';

// Founder, Nov 10 ("this should never be a thing"): "Nothing right now" never ends on an empty screen.
const answers = (support, extra = {}) => ({ personalizationCompleted: true, fullHealthIntake: { personalizationCompleted: true, age: '27', lifeStageSelections: ['I get periods regularly'], supportSelections: support, takesCurrent: 'No', allergyStatus: 'No', safetyConcern: 'No', ...extra } });

describe('reveal when she picked nothing', () => {
  for (const variant of ['app', 'web']) {
    it(`${variant}: "Nothing right now" never shows the old dead-end line`, () => {
      const html = renderToStaticMarkup(<ReadyReveal variant={variant} answers={answers(['Nothing right now'], { learnInterests: ['Birth control'] })} onSeeToday={() => {}} onExplore={() => {}} onBack={() => {}} onCreateAccount={() => {}} onWatchWrapped={() => {}} prefsDone />);
      expect(html).not.toContain('Nothing to work on right now');
      // Her basics are real matches now: the count, and Wrapped first.
      expect(html).toMatch(/We found <span class="ay-ob-count">\d+<\/span> matches/);
      // She still gets periods: everyday basics, a mix of kinds (not five of one thing).
      expect(html).toContain('Everyday period basics');
      expect(html).toContain('Menstrual Cup');
      expect(html).toContain('Period Underwear');
      // Her learn topics still show.
      expect(html).toContain('Birth control');
      expect(html).toContain('See my results');
    });
  }
});
