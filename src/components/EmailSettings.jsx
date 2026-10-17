import { useEffect, useRef, useState } from 'react';
import { getSupabaseClient } from '../utils/supabaseClient';
import { EMAIL_GROUPS, loadEmailPrefs, normalizeEmailPrefs, saveEmailPrefs } from '../utils/emailPrefs';
import { teamMemberForEmail } from '../utils/aynaTeam';

// Email settings on the You page (#wyou-email). One switch per kind of email,
// weekly roundup or as it happens where that applies, and one "turn off all".
// Each change saves to her own row right away; nothing is sent from here.
export default function EmailSettings({ user }) {
  const [state, setState] = useState({ loading: true, available: true, prefs: normalizeEmailPrefs(null), off: false });
  const [note, setNote] = useState('');
  const seq = useRef(0);

  useEffect(() => {
    let live = true;
    loadEmailPrefs(getSupabaseClient(), user?.id).then((r) => {
      if (live) setState({ loading: false, available: r.available, prefs: r.prefs, off: r.unsubscribedAll });
    }).catch(() => { if (live) setState((s) => ({ ...s, loading: false, available: false })); });
    return () => { live = false; };
  }, [user?.id]);

  const save = async (prefs, off) => {
    const prev = state;
    setState((s) => ({ ...s, prefs, off }));
    const mine = ++seq.current;
    try {
      await saveEmailPrefs(getSupabaseClient(), user?.id, prefs, off);
      if (mine === seq.current) setNote('Saved');
    } catch {
      if (mine === seq.current) { setState(prev); setNote('Could not save. Try again.'); }
    }
  };

  const { prefs, off, loading, available } = state;
  const disabled = loading || !available;

  return (
    <section className="wyou-card is-email" id="wyou-email" aria-labelledby="wyou-email-h">
      <div className="wyou-card-head"><h2 id="wyou-email-h">Email settings</h2>{note && <span role="status">{note}</span>}</div>
      <p className="wyou-muted">Emails about your account, like sign-in links and password resets, always send.</p>
      {!loading && !available && <p className="wyou-note" role="status">Email settings aren't available right now.</p>}
      <ul className="wyou-email">
        {EMAIL_GROUPS.map((g) => {
          const on = !off && prefs[g.id];
          const freqKey = `${g.id}Freq`;
          return (
            <li key={g.id} className={on ? 'is-on' : ''}>
              <div className="wyou-email__text">
                <strong id={`em-${g.id}`}>{g.label}</strong>
                <small>{g.help}</small>
                {g.freq && on && (
                  <span className="wyou-seg wyou-email__freq" role="group" aria-label={`How often: ${g.label}`}>
                    {[['weekly', 'Weekly roundup'], ['instant', 'As it happens']].map(([v, l]) => (
                      <button key={v} type="button" aria-pressed={prefs[freqKey] === v} disabled={disabled} onClick={() => save({ ...prefs, [freqKey]: v }, off)}>{l}</button>
                    ))}
                  </span>
                )}
              </div>
              <button type="button" role="switch" aria-checked={Boolean(on)} aria-labelledby={`em-${g.id}`} className="wyou-switch" disabled={disabled}
                onClick={() => save({ ...prefs, [g.id]: !on }, off && !on ? false : off)}>
                <span aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
      <div className="wyou-actions">
        {teamMemberForEmail(user?.email) && (
          <button type="button" className="wyou-btn is-ghost" onClick={async () => {
            setNote('Sending…');
            try {
              const { data } = await getSupabaseClient().auth.getSession();
              const r = await fetch('/api/send-test-email', { method: 'POST', headers: { Authorization: `Bearer ${data?.session?.access_token || ''}` } });
              const j = await r.json().catch(() => ({}));
              setNote(r.ok ? `Test emails sent to ${j.to}` : `Test failed (${j.error || r.status})`);
            } catch { setNote('Test failed'); }
          }}>Send me a test email</button>
        )}
        {off
          ? <button type="button" className="wyou-btn is-ghost" disabled={disabled} onClick={() => save(prefs, false)}>Turn emails back on</button>
          : <button type="button" className="wyou-link-danger" disabled={disabled} onClick={() => save(prefs, true)}>Turn off all emails</button>}
      </div>
    </section>
  );
}
