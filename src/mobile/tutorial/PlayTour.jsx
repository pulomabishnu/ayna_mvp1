import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './play-tour.css';

/**
 * A tour you play (founder, Nov 12: "like a tutorial you can play", "it should include the quiz",
 * "right when you open the app signed out").
 *
 * Research (NN/g, Mobile-app onboarding and Mobile tutorials): skip deck-of-cards that only tell;
 * if there is onboarding, make it interactive ("learn by doing", "a practice round"), short, one
 * idea per step, with a highly visible Skip. So each step is a pretend version of the real thing:
 * she taps, it reacts, then Next. Nothing here saves anything or touches her data.
 *
 * Steps: the quiz, a match and why it fits, a goal, the log, Ask ayna. The last button takes a
 * signed-out visitor straight into the quiz.
 */
const STEPS = [
  {
    id: 'quiz', kicker: 'Step 1 · The quiz', title: 'Tell ayna what you want help with',
    hint: 'Tap one or two.', done: 'That is the quiz. About a minute, and every answer shapes your matches.',
  },
  {
    id: 'match', kicker: 'Step 2 · Your matches', title: 'Every match says why it fits',
    hint: 'Tap the match.', done: 'Matches come from your answers and the research. Brands can’t pay for a better one.',
  },
  {
    id: 'goal', kicker: 'Step 3 · Your goals', title: 'Set a goal, see your week',
    hint: 'Tap Did it today.', done: 'Your goals live on Home, with picks for each one.',
  },
  {
    id: 'log', kicker: 'Step 4 · Your log', title: 'Log your period and symptoms',
    hint: 'Tap today.', done: 'One tap a day. ayna spots patterns and updates your picks.',
  },
  {
    id: 'ask', kicker: 'Step 5 · Ask ayna', title: 'Ask anything',
    hint: 'Tap a question.', done: 'ayna answers from your profile and checked sources.',
  },
];

const NEEDS = ['Cramps', 'Sleep', 'Energy', 'Mood', 'Skin', 'Hot flashes'];

function QuizPlay({ picked, setPicked }) {
  return (
    <div className="ay-pt__chips" role="group" aria-label="What do you want help with?">
      {NEEDS.map((n) => {
        const on = picked.includes(n);
        return <button key={n} type="button" aria-pressed={on} className={on ? 'is-on' : ''} onClick={() => setPicked((p) => (on ? p.filter((x) => x !== n) : [...p, n]))}>{n}</button>;
      })}
    </div>
  );
}

function MatchPlay({ open, setOpen, need }) {
  return (
    <div className={`ay-pt__match${open ? ' is-open' : ''}`}>
      <div className="ay-pt__prod" aria-hidden="true"><span /></div>
      <div className="ay-pt__prodtxt">
        <small>Example product</small>
        <b>Heat patch for {need ? need.toLowerCase() : 'cramps'}</b>
        <button type="button" className="ay-pt__pct" aria-expanded={open} onClick={() => setOpen(true)}>92% match</button>
      </div>
      {open && (
        <ul className="ay-pt__why">
          <li>Fits what you picked: {need || 'Cramps'}</li>
          <li>Checked against your allergies and medicines</li>
          <li>Research: some evidence</li>
        </ul>
      )}
    </div>
  );
}

function GoalPlay({ done, setDone }) {
  const n = done ? 4 : 3;
  return (
    <div className="ay-pt__goal">
      <svg className="ay-pt__ring" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15" className="is-bg" /><circle cx="18" cy="18" r="15" className="is-fg" style={{ strokeDasharray: `${(n / 5) * 94.25} 94.25` }} /></svg>
      <div><b>Sleep better</b><small>{n} of 5 days this week</small></div>
      <button type="button" className={`ay-pt__tick${done ? ' is-on' : ''}`} aria-pressed={done} onClick={() => setDone(true)}>{done ? 'Done today' : 'Did it today'}</button>
    </div>
  );
}

function LogPlay({ logged, setLogged }) {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return (
    <div className="ay-pt__log" role="group" aria-label="This week">
      {days.map((d, i) => {
        const today = i === 3;
        const on = i < 3 || (today && logged);
        return (
          <button key={i} type="button" disabled={!today} className={`${today ? 'is-today' : ''}${on ? ' is-on' : ''}`} onClick={() => setLogged(true)} aria-label={today ? 'Log today' : undefined}>
            <small>{d}</small><i />
          </button>
        );
      })}
    </div>
  );
}

const QUESTIONS = ['What helps cramps fast?', 'Why is my sleep worse before my period?'];
const ANSWERS = {
  'What helps cramps fast?': 'Heat on your lower belly and an over-the-counter pain reliever can help. If pain is severe or new, get it checked.',
  'Why is my sleep worse before my period?': 'Hormone changes before a period can affect sleep. Logging it helps ayna spot your pattern.',
};
function AskPlay({ asked, setAsked }) {
  return (
    <div className="ay-pt__ask">
      {!asked && QUESTIONS.map((q) => <button key={q} type="button" onClick={() => setAsked(q)}>{q}<span aria-hidden="true">›</span></button>)}
      {asked && <>
        <p className="ay-pt__q">{asked}</p>
        <p className="ay-pt__a">{ANSWERS[asked]}</p>
      </>}
    </div>
  );
}

export default function PlayTour({ onClose, onStartQuiz = null, theme = 'light' }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState([]);
  const [matchOpen, setMatchOpen] = useState(false);
  const [goalDone, setGoalDone] = useState(false);
  const [logged, setLogged] = useState(false);
  const [asked, setAsked] = useState('');
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const step = STEPS[i];
  const did = [picked.length > 0, matchOpen, goalDone, logged, Boolean(asked)][i];
  const last = i === STEPS.length - 1;
  const finish = () => { onClose?.(); if (onStartQuiz) onStartQuiz(); };

  return createPortal(
    <div className="ay-tour is-app is-sheet ay-pt" data-theme={theme}>
      <div className="ay-tour__dim is-soft" aria-hidden="true" />
      <section ref={ref} tabIndex={-1} className="ay-tour__card ay-tour__all ay-pt__card" role="dialog" aria-modal="true" aria-labelledby="ay-pt-h">
        <header className="ay-pt__head">
          <p className="ay-pt__brand">How ayna works</p>
          <button type="button" className="ay-pt__skip" onClick={onClose}>Skip</button>
          <button type="button" className="ay-tour__x" aria-label="Close the tour" onClick={onClose}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
        </header>
        <ol className="ay-pt__dots" aria-hidden="true">{STEPS.map((s, k) => <li key={s.id} className={k < i ? 'is-done' : k === i ? 'is-now' : ''} />)}</ol>
        <p className="sr-only" aria-live="polite">{`Step ${i + 1} of ${STEPS.length}`}</p>
        <div className="ay-pt__stage" key={step.id}>
          <p className="ay-pt__kicker">{step.kicker}</p>
          <h2 id="ay-pt-h">{step.title}</h2>
          <div className="ay-pt__play">
            {step.id === 'quiz' && <QuizPlay picked={picked} setPicked={setPicked} />}
            {step.id === 'match' && <MatchPlay open={matchOpen} setOpen={setMatchOpen} need={picked[0]} />}
            {step.id === 'goal' && <GoalPlay done={goalDone} setDone={setGoalDone} />}
            {step.id === 'log' && <LogPlay logged={logged} setLogged={setLogged} />}
            {step.id === 'ask' && <AskPlay asked={asked} setAsked={setAsked} />}
          </div>
          <p className={`ay-pt__say${did ? ' is-done' : ''}`} role="status">{did ? step.done : step.hint}</p>
        </div>
        <div className="ay-pt__foot">
          {i > 0 && <button type="button" className="ay-pt__back" onClick={() => setI(i - 1)}>Back</button>}
          {!last
            ? <button type="button" className="ay-pt__next" onClick={() => setI(i + 1)}>Next</button>
            : <button type="button" className="ay-tour__go ay-pt__next" onClick={finish}>{onStartQuiz ? 'Take the quiz' : 'Got it'}</button>}
        </div>
      </section>
    </div>,
    document.body,
  );
}
