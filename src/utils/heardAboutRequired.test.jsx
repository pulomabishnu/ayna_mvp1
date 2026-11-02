import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { shouldAskHeardAbout } from './signupConsent.js';
import HeardAboutPrompt from '../components/HeardAboutPrompt.jsx';

describe('"Where did you hear about us?" is required (Nov 2)', () => {
  it('asks every signed-in account without an answer, on any device', () => {
    expect(shouldAskHeardAbout({ id: 'u1', user_metadata: {} })).toBe(true);
    expect(shouldAskHeardAbout({ id: 'u1', user_metadata: { heard_about: 'tiktok' } })).toBe(false);
    expect(shouldAskHeardAbout(null)).toBe(false);
  });
  it('has no Skip and no "Optional"', () => {
    const html = renderToStaticMarkup(<HeardAboutPrompt />);
    expect(html).not.toMatch(/>Skip</);
    expect(html).not.toContain('Optional');
    expect(html).toContain('Continue');
  });
});
