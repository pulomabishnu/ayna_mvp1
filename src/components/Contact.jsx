import React, { useState } from 'react';
import usePersistentState from '../hooks/usePersistentState.js';
import CharRing from './ui/CharRing.jsx';
import { apiUrl } from '../utils/apiUrl.js';
import { EdPage } from './editorial/EdPage';
import { fetchWithTimeout } from '../utils/network.js';

// Values the server accepts (api/contact.js); LABELS is how they read here.
const LABELS = { 'Help & Support': 'Help and support', 'Feedback or Feature Request': 'Feedback or an idea', 'Press & Media': 'Press and media' };
const REASONS = [
  'Partnerships',
  'Help & Support',
  'Feedback or Feature Request',
  'Press & Media',
  'Other',
];

export default function Contact({ onBack, backLabel, user = null }) {
  // Signed in: name and email are already known.
  const known = { name: user?.user_metadata?.first_name || user?.user_metadata?.full_name || '', email: user?.email || '' };
  // The draft survives a refresh; it is forgotten once it sends.
  const [form, setForm, forgetDraft] = usePersistentState('contact:draft', () => ({
    name: known.name,
    email: known.email,
    reason: '',
    subject: '',
    message: '',
    companyWebsite: '',
  }));
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const validate = (f) => {
    const e = {};
    if (!f.name.trim()) e.name = 'Add your name.';
    if (!f.email.trim()) e.email = 'Add your email so we can reply.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = 'That email doesn’t look right.';
    if (!f.reason) e.reason = 'Pick a topic.';
    if (f.message.trim().length < 10) e.message = 'Write at least a sentence (10 characters).';
    else if (f.message.length > 5000) e.message = `That’s ${f.message.length - 5000} characters over the 5,000 limit. Trim it a little.`;
    return e;
  };

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    if (fieldErrors[field]) setFieldErrors((cur) => ({ ...cur, [field]: undefined }));
  };
  const errProps = (field) => (fieldErrors[field] ? { 'aria-invalid': true, 'aria-describedby': `contact-${field}-err` } : {});
  const Err = ({ field }) => (fieldErrors[field] ? <p id={`contact-${field}-err`} className="ed-err">{fieldErrors[field]}</p> : null);

  const submit = async (event) => {
    event.preventDefault();
    if (status === 'sending') return;
    const found = validate(form);
    setFieldErrors(found);
    const first = ['name', 'email', 'reason', 'message'].find((k) => found[k]);
    if (first) { document.getElementById(first === 'reason' ? 'contact-reason-0' : `contact-${first}`)?.focus(); return; }

    setStatus('sending');
    setError('');

    try {
      const response = await fetchWithTimeout(apiUrl('/api/contact'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // One field fewer: the subject line is the start of the message.
        body: JSON.stringify({ ...form, subject: form.subject || (form.message.trim().split(/\n/)[0].slice(0, 80) || form.reason) }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || 'We could not send your message. Please try again.');
      }

      setStatus('sent');
      forgetDraft();
      setForm({
        name: known.name,
        email: known.email,
        reason: '',
        subject: '',
        message: '',
        companyWebsite: '',
      });
      setFieldErrors({});
    } catch (err) {
      setStatus('error');
      setError(err?.message || 'We could not send your message. Please try again.');
    }
  };

  return (
    <EdPage
      title="How can we help?"
      lede="Send us a note and we'll make sure it reaches the right person on the ayna team."
      onBack={onBack} backLabel={backLabel}
      photo="curlers-call"
    >
      <form onSubmit={submit} noValidate className="ay-group is-padded ed-form" aria-label="Contact the ayna team" style={{ maxWidth: 760 }}>
        <div className="ed-hp" aria-hidden="true">
          <label>
            Website
            <input type="text" tabIndex="-1" autoComplete="off" value={form.companyWebsite} onChange={update('companyWebsite')} />
          </label>
        </div>

        <div className="ed-form__row">
          <div className="ed-field">
            <label htmlFor="contact-name">Name</label>
            <input id="contact-name" type="text" required maxLength={100} autoComplete="name" value={form.name} onChange={update('name')} placeholder="Your name" {...errProps('name')} />
            <Err field="name" />
          </div>
          <div className="ed-field">
            <label htmlFor="contact-email">Email</label>
            <input id="contact-email" type="email" required maxLength={200} autoComplete="email" value={form.email} onChange={update('email')} placeholder="you@example.com" {...errProps('email')} />
            <Err field="email" />
          </div>
        </div>

        <fieldset className="ed-field" {...errProps('reason')}>
          <legend>What can we help with?</legend>
          <div className="ed-chiprow ed-chiprow--wrap" role="radiogroup" aria-label="Topic">
            {REASONS.map((reason, i) => (
              <button key={reason} id={`contact-reason-${i}`} type="button" role="radio" aria-checked={form.reason === reason} className="ay-chip"
                onClick={() => { setForm((c) => ({ ...c, reason })); setFieldErrors((cur) => ({ ...cur, reason: undefined })); }}>{LABELS[reason] || reason}</button>
            ))}
          </div>
          <Err field="reason" />
        </fieldset>

        <div className="ed-field">
          <label htmlFor="contact-message">Message</label>
          <span className="ay-charfield"><textarea id="contact-message" required minLength={10} rows={7} value={form.message} onChange={update('message')} placeholder="Tell us how we can help." {...errProps('message')} /><CharRing value={form.message} max={5000} /></span>
          <Err field="message" />
        </div>

        {status === 'sent' && (
          <div role="status" className="ed-notice ed-notice--ok">Thanks. Your message has been sent to the ayna team.</div>
        )}
        {error && (
          <div role="alert" className="ed-notice ed-notice--err">{error}</div>
        )}

        <div>
          <button type="submit" className="ay-btn ay-btn--primary" disabled={status === 'sending'}>
            {status === 'sending' ? 'Sending…' : 'Send message'}
          </button>
        </div>
      </form>
    </EdPage>
  );
}
