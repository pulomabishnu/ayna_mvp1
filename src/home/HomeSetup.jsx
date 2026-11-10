import { setupSteps } from '../components/you/setupSteps.js';
import './home-setup.css';

/**
 * Home's "Finish setting up" (founder, Nov 9: she likes the set-up steps on You)
 * plus the one place on Home to change her quiz answers (focus group, Nov 9:
 * "I couldn't find where to edit my answers"). Every step is tappable and goes
 * to that thing. The steps go away once all are done; "Edit my health profile"
 * always stays.
 */
export default function HomeSetup({ hasAnswers, productCount = 0, connectedCount = 0, checkinCount = 0, go = {}, onEditProfile, note = null }) {
  const setup = setupSteps({ hasAnswers, productCount, connectedCount, checkinCount });
  const LABEL = { quiz: 'Take the quiz', ecosystem: 'Add a product to your routine', connect: 'Connect health data', checkin: 'Do your first check-in' };
  return (
    <section className="ay-hsetup" aria-labelledby="ay-hsetup-h">
      {setup.next && (
        <>
          <div className="ay-hsetup__top"><h2 id="ay-hsetup-h">Finish setting up</h2><span>{setup.done} of {setup.total} done</span></div>
          {note}
          <span className="ay-hsetup__bar" aria-hidden="true">{setup.steps.map((s, i) => <i key={s.key} className={i < setup.done ? 'is-done' : ''} />)}</span>
          <ol className="ay-hsetup__steps">
            {setup.steps.map((s) => (
              <li key={s.key} className={s.done ? 'is-done' : ''}>
                {s.done || !go[s.key]
                  ? <span className="ay-hsetup__row"><Tick done={s.done} /><span>{LABEL[s.key] || s.label}</span></span>
                  : <button type="button" className="ay-hsetup__row" onClick={go[s.key]}><Tick done={false} /><span>{LABEL[s.key] || s.label}</span><Chev /></button>}
              </li>
            ))}
          </ol>
        </>
      )}
      {!setup.next && <h2 id="ay-hsetup-h" className="sr-only">Your health profile</h2>}
      {hasAnswers && onEditProfile && (
        <button type="button" className="ay-hsetup__edit" onClick={onEditProfile}>
          <span><b>Edit my health profile</b><small>Change any quiz answer, or add something new</small></span><Chev />
        </button>
      )}
    </section>
  );
}

function Tick({ done }) {
  return <span className={`ay-hsetup__tick${done ? ' is-done' : ''}`} aria-hidden="true">{done && <svg viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7" /></svg>}</span>;
}
function Chev() {
  return <svg className="ay-hsetup__chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>;
}
