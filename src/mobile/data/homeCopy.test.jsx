// QA (Oct 25): the app's tab is Home, so app copy says Home; the website keeps Today.
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { getOnboardingSteps } from './onboardingFlow.js';
import { EMPTY } from './intakeModel.js';
import ReadyReveal from '../../components/onboarding/ReadyReveal.jsx';
import LandingScreen from '../screens/LandingScreen.jsx';

const why = (surface) => getOnboardingSteps({ ...EMPTY, helpTopics: ['periods'] }, { part: 'all', surface }).map((s) => s.why || '').join(' ');

describe('Home in the app, Today on the website', () => {
  it('first-run "why we ask" lines', () => {
    expect(why('app')).toContain('what Home talks about');
    expect(why('app')).not.toMatch(/\bToday\b/);
    expect(why('web')).toContain('what Today talks about');
  });
  it('ready screen and app landing', () => {
    const app = renderToStaticMarkup(<ReadyReveal variant="app" onSeeToday={() => {}} />);
    expect(app).toContain('See my Home');
    expect(app).not.toMatch(/\bToday\b/);
    expect(renderToStaticMarkup(<ReadyReveal variant="web" onSeeToday={() => {}} />)).toContain('See my Today');
    const land = renderToStaticMarkup(<LandingScreen onStart={() => {}} />).replace(/<[^>]+>/g, ' ');
    expect(land).not.toMatch(/\bToday\b/);
  });
});
