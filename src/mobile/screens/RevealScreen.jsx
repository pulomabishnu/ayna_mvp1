import { matchPercentFor, productMatch } from '../utils/matchScore.js';
import { whyLine } from '../../utils/whyLine.js';
import { bleedingCareNote, showableAsPick } from '../../utils/bleedingCare.js';
import BleedingEvaluationNote from '../../components/match/BleedingEvaluationNote.jsx';
import { ecosystemCounts } from '../../utils/ecosystemCounts.js';
import WebWrapped from '../../components/WebWrapped.jsx';
import '../../styles/flow.css';

// "Wrapped" shown right after the intake. Same story as the website (founder,
// Oct 29: matches per category, animated counts, "Show another", "See all your
// matches" at the end); the app's own scorer ranks and labels the picks so the
// "#1 match" percent is the one on her cards. The app asks the optional
// questions on its Ready step, so the story has no "more questions" slide.
export default function RevealScreen({ myProducts = [], onContinue, onBack, onExitStory = null, onGoBrowse, authUser, quizAnswers, lastQuizAnswers, matchOpts, revealStartAtEnd = false }) {
  const answers = quizAnswers || lastQuizAnswers;
  const opts = matchOpts || undefined;
  // Bleeding after menopause: picks the engine sends to evaluation (or that do
  // not fit her) are never shown as a match; the care message leads instead.
  const bleeding = bleedingCareNote(answers, null, opts);
  // Her highest-scoring products first; ties keep her ecosystem's order.
  const ranked = answers
    ? myProducts.filter((product) => showableAsPick(product, answers, null, opts)).map((product, i) => ({ product, i, pct: matchPercentFor(product, answers, opts) ?? -1 })).sort((a, b) => b.pct - a.pct || a.i - b.i).map((x) => x.product)
    : myProducts.filter(Boolean);
  const signedIn = Boolean(authUser);
  const done = signedIn && onExitStory ? onExitStory : onContinue;
  return (
    <WebWrapped
      inline
      counts={ecosystemCounts(myProducts, answers, { matchOpts: opts })}
      products={ranked}
      quizResults={answers}
      matchOpts={opts}
      percentFor={(p) => matchPercentFor(p, answers, opts)}
      whyFor={(p) => whyLine(p, productMatch(p, answers, opts))}
      careNote={bleeding ? <BleedingEvaluationNote className="ay-wr-care" title={bleeding.title} note={bleeding} /> : null}
      startAtEnd={revealStartAtEnd}
      onClose={onExitStory || undefined}
      onBack={onBack}
      emptyBack={onBack}
      onBrowse={onGoBrowse}
      primaryLabel={signedIn ? (onExitStory ? 'Done' : 'See all your matches') : 'Save to a free account'}
      onPrimary={done}
    />
  );
}
