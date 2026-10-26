// QA round 2: the goal question on the website's Today says Today; the app says Home.
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ProfileAskCard from './ProfileAskCard.jsx';
import { EMPTY } from '../../mobile/data/intakeModel.js';

const intake = { ...EMPTY, personalizationCompleted: true, age: '54', lifeStageSelections: ['I am post-menopause'], supportSelections: ['Hot flashes'], allergyStatus: 'No', takesCurrent: 'No', diagnosisSelections: ['None that I know of'], safetyConcern: 'No' };

describe('goal question wording', () => {
  it('web and app both say Today (the app tab is Today now)', () => {
    const web = renderToStaticMarkup(<ProfileAskCard variant="web" intake={intake} today="2026-10-25" onAnswer={() => {}} />);
    const app = renderToStaticMarkup(<ProfileAskCard variant="app" intake={intake} today="2026-10-25" onAnswer={() => {}} />);
    expect(web).toContain('what Today talks about');
    expect(app).toContain('what Today talks about');
  });
});
