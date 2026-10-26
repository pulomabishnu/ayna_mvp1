// QA M4: with quiz answers but nothing in For you, Explore shows an empty
// state, never the "Get your match" invite again (it was "Create your health profile").
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ExploreScreen from '../../mobile/screens/ExploreScreen.jsx';
import WebExplore from './WebExplore.jsx';
import { FOR_YOU_EMPTY } from '../nav/mainTabs.js';

const answers = { fullHealthIntake: { supportSelections: ['Hot flashes'], lifeStageSelections: ['I am post-menopause'] } };
const text = (html) => html.replace(/<[^>]+>/g, ' ');

describe('Explore For you empty state', () => {
  it('app: answers, no picks', () => {
    const html = text(renderToStaticMarkup(<ExploreScreen quizAnswers={answers} suggestedEcosystemProducts={[]} products={[]} articles={[]} onStartQuiz={() => {}} />));
    expect(html).toContain(FOR_YOU_EMPTY);
    expect(html).toContain('Browse all products');
    expect(html).not.toContain('Get your match');
  });
  it('app: no answers keeps the invite', () => {
    const html = text(renderToStaticMarkup(<ExploreScreen quizAnswers={null} suggestedEcosystemProducts={[]} products={[]} articles={[]} onStartQuiz={() => {}} />));
    expect(html).toContain('Get your match');
  });
  it('web: answers, no picks', () => {
    const html = text(renderToStaticMarkup(<WebExplore quizResults={answers} recommendedProductIds={[]} onStartQuiz={() => {}} />));
    expect(html).toContain(FOR_YOU_EMPTY);
    expect(html).not.toContain('Get your match');
  });
  it('web: no answers keeps the invite', () => {
    const html = text(renderToStaticMarkup(<WebExplore quizResults={null} onStartQuiz={() => {}} />));
    expect(html).toContain('Get your match');
  });
});
