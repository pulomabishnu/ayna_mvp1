import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ProfileSetupStep, { usernameProblem, suggestUsername } from './ProfileSetupStep.jsx';

describe('profile set-up after email verification', () => {
  it('validates usernames the way Community stores them', () => {
    expect(usernameProblem('')).toBe('Pick a username.');
    expect(usernameProblem('ab')).toBe('At least 3 characters.');
    expect(usernameProblem('maya k')).toMatch(/Letters, numbers/);
    expect(usernameProblem('@maya.k')).toBe('');
    expect(usernameProblem('x'.repeat(25))).toMatch(/24/);
  });
  it('suggests a username from her first name, else the email', () => {
    expect(suggestUsername({ email: 'a@x.co' }, 'Maya')).toBe('maya');
    expect(suggestUsername({ email: 'maya.k@x.co' })).toBe('maya.k');
    expect(suggestUsername({ email: 'ab@x.co' })).toBe('');
  });
  it('first paint waits for the existing-profile check (no flash of the form for returning accounts)', () => {
    const html = renderToStaticMarkup(<ProfileSetupStep supabase={{}} user={{ id: 'u' }} onDone={() => {}} />);
    expect(html).toContain('aria-busy="true"');
  });
});
