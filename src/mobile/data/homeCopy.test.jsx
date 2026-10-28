// All-pages brief (Oct 25): the tab is Today on the website and the app, so app copy says Today too.
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { getOnboardingSteps } from './onboardingFlow.js';
import { EMPTY } from './intakeModel.js';
import ReadyReveal from '../../components/onboarding/ReadyReveal.jsx';
import LandingScreen from '../screens/LandingScreen.jsx';

const why = (surface) => getOnboardingSteps({ ...EMPTY, helpTopics: ['periods'] }, { part: 'all', surface }).map((s) => s.why || '').join(' ');

describe('Today in the app and on the website', () => {
  it('first-run "why we ask" lines', () => {
    expect(why('app')).toContain('what Today talks about');
    expect(why('app')).not.toMatch(/\bHome\b/);
    expect(why('web')).toContain('what Today talks about');
  });
  it('ready screen and app landing', () => {
    const app = renderToStaticMarkup(<ReadyReveal variant="app" onSeeToday={() => {}} />);
    expect(app).toContain('See my Today');
    expect(app).not.toMatch(/\bHome\b/);
    expect(renderToStaticMarkup(<ReadyReveal variant="web" onSeeToday={() => {}} />)).toContain('See my ecosystem');
    const land = renderToStaticMarkup(<LandingScreen onStart={() => {}} />).replace(/<[^>]+>/g, ' ');
    expect(land).not.toMatch(/\bHome\b/);
  });
});
