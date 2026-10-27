// @vitest-environment jsdom
// Life stage follow-ups show right under the life stage tiles on the website
// and in the app (founder, Oct 24), and never again as their own step.
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { EMPTY, FOLLOWUP_QUESTIONS, buildSnapshot } from '../data/intakeModel.js';
import IntakeScreen from './IntakeScreen.jsx';
import WebIntake from '../../components/WebIntake.jsx';

const noop = () => {};
const snapshot = (patch) => buildSnapshot({ ...EMPTY, age: '30', ...patch });
const web = (patch) => renderToStaticMarkup(<WebIntake initialSnapshot={snapshot(patch)} startAtStep="lifeStage" onComplete={noop} />);
const app = (patch) => renderToStaticMarkup(<IntakeScreen initialSnapshot={snapshot(patch)} startAtStep="lifeStage" introEnabled={false} onBack={noop} onComplete={noop} />);

describe.each([['website', web], ['app', app]])('%s life stage screen', (_, render) => {
  it('shows the trimester question under Pregnant', () => {
    const html = render({ lifeStageSelections: ['I am pregnant'] });
    expect(html).toContain(FOLLOWUP_QUESTIONS.pregnancyTrimester);
    expect(html).toContain('Second trimester');
    expect(html).toContain('Prefer not to say');
    expect(html).not.toContain(FOLLOWUP_QUESTIONS.postpartumTiming);
  });

  it('shows birth timing and breastfeeding under Postpartum, and TTC duration under Trying to conceive', () => {
    const html = render({ lifeStageSelections: ['I am trying to conceive', 'I am postpartum'] });
    expect(html).toContain(FOLLOWUP_QUESTIONS.ttcDuration);
    expect(html).toContain(FOLLOWUP_QUESTIONS.postpartumTiming);
    expect(html).toContain('Less than 6 weeks ago');
    expect(html).toContain(FOLLOWUP_QUESTIONS.breastfeedingStatus);
    expect(html.indexOf(FOLLOWUP_QUESTIONS.ttcDuration)).toBeLessThan(html.indexOf(FOLLOWUP_QUESTIONS.postpartumTiming));
    expect(html).not.toContain('Not trying yet');
  });

  it('shows no follow-up for a stage that has none', () => {
    const html = render({ lifeStageSelections: ['I use hormonal birth control'] });
    [FOLLOWUP_QUESTIONS.ttcDuration, FOLLOWUP_QUESTIONS.pregnancyTrimester, FOLLOWUP_QUESTIONS.postpartumTiming, FOLLOWUP_QUESTIONS.breastfeedingStatus].forEach((q) => expect(html).not.toContain(q));
  });

  it('keeps an older saved answer visible as picked', () => {
    const html = render({ lifeStageSelections: ['I am trying to conceive'], ttcDuration: 'Not trying yet' });
    expect(html).toContain('Not trying yet');
  });
});
