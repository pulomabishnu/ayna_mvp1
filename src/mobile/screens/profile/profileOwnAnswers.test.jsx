// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ProfileFlow from './ProfileFlow.jsx';
import { EMPTY } from '../../data/intakeModel.js';

const answers = { personalizationCompleted: true, fullHealthIntake: { ...EMPTY, personalizationCompleted: true, firstName: 'Ameera', age: '24', lifeStageSelections: ['I get periods regularly'], supportSelections: ['Cramps or period pain'], allergyStatus: 'No', takesCurrent: 'No', safetyConcern: 'No', diagnosisSelections: ['None that I know of'] } };
const render = (props) => renderToStaticMarkup(<ProfileFlow onClose={() => {}} authUser={{ id: 'u1', email: 'a@b.co' }} name="Ameera" {...props} />);

describe('You: her own profile does not depend on "Personalize with my data"', () => {
  it('with personalization off (quizAnswers null) her answered profile is not 0%', () => {
    const html = render({ quizAnswers: null, ownAnswers: answers });
    expect(html).toMatch(/Health profile <b>\d+% complete/); // the hub really rendered
    // The old behaviour (no ownAnswers): personalization off read as an empty profile.
    expect(render({ quizAnswers: null })).toContain('Health profile <b>0% complete');
    expect(html).not.toContain('Health profile <b>0% complete');
    expect(html).not.toContain('Next: Answer the quiz');
  });
  it('without her answers it still says 0% (no false progress)', () => {
    const html = render({ quizAnswers: null, ownAnswers: null });
    expect(html).toContain('0% complete');
  });
});
