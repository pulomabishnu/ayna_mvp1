import { useEffect, useRef, useState } from 'react';
import {
  createShareLink, revokeShareLink, shareLinkOrCopy, sharePlainText, isRealAccount, trackAnswerShared,
} from '../utils/shareAnswerClient.js';
import { toast } from '../utils/toast.js';
import './shareAnswer.css';

/**
 * Share control under one Ask ayna reply (app and website).
 *   Signed in:   Share -> one-line note -> Create link -> share sheet (or "Link copied").
 *                Then Share link / Stop sharing.
 *   Signed out or guest: Share sends the words only, as before.
 * `share` lives on the chat message ({ slug, url, revoked }) so Stop sharing
 * still works when she comes back to the chat.
 */
export default function ShareAnswerButton({ question, answer, sources = [], share = null, onShareChange, session, surface = 'web' }) {
  const [step, setStep] = useState('idle'); // idle | confirm | busy | error
  const [status, setStatus] = useState('');
  const timer = useRef(null);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const signedIn = isRealAccount(session);

  const say = (text) => {
    setStatus(text);
    if (surface === 'web') toast(text);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus(''), 2600);
  };

  const openSheet = async (url) => {
    const result = await shareLinkOrCopy({ url, title: 'Ask ayna', text: 'Here’s what ayna said:' });
    if (result === 'copied') say('Link copied');
    else if (result === 'failed') say(`Copy this link: ${url}`);
    return result;
  };

  const sharePlain = async () => {
    const result = await sharePlainText(question, answer);
    if (result === 'copied') say('Answer copied');
    if (result === 'shared' || result === 'copied') trackAnswerShared({ surface, kind: 'text' });
  };

  const create = async () => {
    setStep('busy');
    try {
      const link = await createShareLink({ token: session.access_token, question, answer, sources });
      onShareChange?.({ slug: link.slug, url: link.url, revoked: false });
      trackAnswerShared({ surface, kind: 'link', slug: link.slug });
      setStep('idle');
      await openSheet(link.url);
    } catch (e) {
      setStep('error');
      setStatus(e?.code === 'rate_limited'
        ? 'You’ve shared a lot of answers today. Try again later.'
        : 'Couldn’t make the link. Check your connection and try again.');
    }
  };

  const stop = async () => {
    setStep('busy');
    try {
      await revokeShareLink({ token: session.access_token, slug: share.slug });
      onShareChange?.({ ...share, revoked: true });
      setStep('idle');
      say('Link turned off');
    } catch {
      setStep('error');
      setStatus('Couldn’t turn off the link. Try again.');
    }
  };

  if (!signedIn) {
    return (
      <div className="ay-share-answer">
        <button type="button" className="ay-share-answer__btn" onClick={sharePlain}>Share</button>
        {status && surface !== 'web' && <span className="ay-share-answer__status" role="status">{status}</span>}
      </div>
    );
  }

  const live = share?.slug && !share.revoked;
  return (
    <div className="ay-share-answer" data-step={step}>
      {step === 'confirm' && (
        <div className="ay-share-answer__confirm">
          <p>Anyone with the link can see this question and answer.</p>
          <div className="ay-share-answer__row">
            <button type="button" className="ay-share-answer__btn is-primary" onClick={create}>Create link</button>
            <button type="button" className="ay-share-answer__btn" onClick={() => setStep('idle')}>Not now</button>
          </div>
        </div>
      )}
      {step !== 'confirm' && (
        <div className="ay-share-answer__row">
          {live ? (
            <>
              <button type="button" className="ay-share-answer__btn" onClick={() => openSheet(share.url)} disabled={step === 'busy'}>Share link</button>
              <button type="button" className="ay-share-answer__btn is-quiet" onClick={stop} disabled={step === 'busy'}>Stop sharing</button>
            </>
          ) : (
            <button type="button" className="ay-share-answer__btn" onClick={() => setStep('confirm')} disabled={step === 'busy'}>
              {step === 'busy' ? 'Making link…' : share?.revoked ? 'Share again' : 'Share'}
            </button>
          )}
          {status && (surface !== 'web' || step === 'error') && <span className="ay-share-answer__status" role="status">{status}</span>}
        </div>
      )}
    </div>
  );
}
