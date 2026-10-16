import { useRef, useState } from 'react';
import {
  FEEDBACK_MESSAGES, FEEDBACK_QUESTIONS, feedbackLength, feedbackProblem, tooSimilar,
} from '../../utils/campaignRules';
import { submitFeedback, track } from '../../utils/campaignClient';

const draftKey = (key) => `ayna_fp_draft_${key}`;
const readDraft = (key) => { try { return sessionStorage.getItem(draftKey(key)) || ''; } catch { return ''; } };
const writeDraft = (key, v) => { try { if (v) sessionStorage.setItem(draftKey(key), v); else sessionStorage.removeItem(draftKey(key)); } catch { /* private mode */ } };

function Question({ index, q, saved, otherAnswers, minChars, locked, onSaved }) {
  const [editing, setEditing] = useState(!saved);
  const [text, setText] = useState(() => readDraft(q.key) || saved?.response || '');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);
  const started = useRef(false);
  const fieldId = `fp-q-${q.key}`;

  const len = feedbackLength(text);
  const enough = len >= minChars;
  const problem = feedbackProblem(text, minChars);
  const duplicate = !problem && otherAnswers.some((o) => tooSimilar(o, text));
  const clientMessage = problem ? FEEDBACK_MESSAGES[problem](minChars) : duplicate ? FEEDBACK_MESSAGES.duplicate() : '';

  const save = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (clientMessage) { setMessage(clientMessage); return; }
    setBusy(true);
    setMessage('');
    const r = await submitFeedback(q.key, text);
    setBusy(false);
    if (r.error) {
      setMessage(r.message || (r.error === 'network' ? "Couldn't reach ayna. Your answer is still here. Try again." : 'Something went wrong. Your answer is still here. Try again.'));
      return;
    }
    writeDraft(q.key, '');
    setEditing(false);
    track('feedback_piece_completed', { question: q.key });
    onSaved(r.status);
  };

  const done = Boolean(saved) && !editing;
  return (
    <li className={`ayfp-q${done ? ' is-done' : ''}`}>
      <div className="ayfp-q__head">
        <span className="ayfp-q__num" aria-hidden="true">{done ? <CheckIcon /> : index + 1}</span>
        <div>
          <label htmlFor={fieldId} className="ayfp-q__label">{q.label}</label>
          {!done && <p className="ayfp-q__hint" id={`${fieldId}-hint`}>{q.hint}</p>}
        </div>
        {done && <span className="ayfp-status is-ok"><span className="ayfp-sr">Answer {index + 1}: </span>saved</span>}
      </div>

      {done ? (
        <div className="ayfp-q__saved">
          <p>{saved.response}</p>
          {!locked && <button type="button" className="ayfp-link" onClick={() => { setText(saved.response); setEditing(true); }}>Edit</button>}
        </div>
      ) : (
        <form onSubmit={save} noValidate>
          <textarea
            id={fieldId}
            rows={4}
            value={text}
            maxLength={1500}
            disabled={locked}
            aria-describedby={`${fieldId}-hint ${fieldId}-count${message || (touched && clientMessage) ? ` ${fieldId}-msg` : ''}`}
            aria-invalid={Boolean(touched && clientMessage) || undefined}
            onChange={(e) => {
              setText(e.target.value);
              writeDraft(q.key, e.target.value);
              if (message) setMessage('');
              if (!started.current && e.target.value.trim()) { started.current = true; track('feedback_started', { question: q.key }); }
            }}
            onBlur={() => { if (text.trim()) setTouched(true); }}
          />
          <div className="ayfp-q__foot">
            <span id={`${fieldId}-count`} className={`ayfp-count${enough ? ' is-ok' : ''}`}>
              {len} / {minChars} minimum characters
            </span>
            <button type="submit" className="wyou-btn ayfp-btn-sm" disabled={busy || locked}>
              {busy ? 'Saving…' : saved ? 'Save changes' : 'Save answer'}
            </button>
          </div>
          {(message || (touched && clientMessage)) && (
            <p id={`${fieldId}-msg`} className="ayfp-msg" role="alert">{message || clientMessage}</p>
          )}
        </form>
      )}
    </li>
  );
}

export function CheckIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12.5l4.2 4.2L19 7" /></svg>;
}

export default function FeedbackSection({ status, onStatus }) {
  const minChars = status.campaign?.minChars || 120;
  const answers = status.answers || {};
  const done = status.feedbackDone?.length || 0;
  const locked = Boolean(status.claim) || !status.campaign?.open;
  return (
    <section className="wyou-card ayfp-section" aria-labelledby="ayfp-feedback-title">
      <div className="wyou-card-head">
        <h2 id="ayfp-feedback-title">Your feedback</h2>
        <span>{done}/3 done</span>
      </div>
      <p className="wyou-muted ayfp-intro">Three questions, a couple of real sentences each. Honest beats nice.</p>
      <ol className="ayfp-qs">
        {FEEDBACK_QUESTIONS.map((q, i) => (
          <Question
            key={q.key}
            index={i}
            q={q}
            saved={answers[q.key]}
            minChars={minChars}
            locked={locked}
            otherAnswers={FEEDBACK_QUESTIONS.filter((o) => o.key !== q.key).map((o) => answers[o.key]?.response).filter(Boolean)}
            onSaved={(next) => {
              onStatus(next);
              if ((next?.feedbackDone?.length || 0) >= 3 && done < 3) track('feedback_all_completed');
            }}
          />
        ))}
      </ol>
    </section>
  );
}
