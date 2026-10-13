import React, { useState } from 'react';
import { apiUrl } from '../utils/apiUrl.js';
import { InfoPage } from './InfoPage';

const REASONS = [
  'Partnerships',
  'Help & Support',
  'Feedback or Feature Request',
  'Press & Media',
  'Other',
];

export default function Contact({ onBack }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    reason: '',
    subject: '',
    message: '',
    companyWebsite: '',
  });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (status === 'sending') return;

    setStatus('sending');
    setError('');

    try {
      const response = await fetch(apiUrl('/api/contact'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || 'We could not send your message. Please try again.');
      }

      setStatus('sent');
      setForm({
        name: '',
        email: '',
        reason: '',
        subject: '',
        message: '',
        companyWebsite: '',
      });
    } catch (err) {
      setStatus('error');
      setError(err?.message || 'We could not send your message. Please try again.');
    }
  };

  return (
    <InfoPage
      eyebrow="Contact"
      title="How can we help?"
      lede="Send us a note and we'll make sure it reaches the right person on the ayna team."
      onBack={onBack}
    >
      <div className="ay-info-contact">
        <aside className="ay-info-card ay-info-card--pad ay-info-card--mint ay-info-contact__tips">
          <h2 className="ay-info__h3">Pick a topic</h2>
          <ul className="ay-info-list">
            <li><strong>Partnerships</strong> for brand collaborations.</li>
            <li><strong>Help &amp; Support</strong> for questions about using ayna.</li>
            <li><strong>Press &amp; Media</strong> for interviews and stories.</li>
          </ul>
        </aside>

        <form onSubmit={submit} className="ay-info-card ay-info-card--pad ay-info-form">
          <div className="ay-info-form__hp" aria-hidden="true">
            <label>
              Website
              <input type="text" tabIndex="-1" autoComplete="off" value={form.companyWebsite} onChange={update('companyWebsite')} />
            </label>
          </div>

          <div className="ay-info-form__row">
            <div className="ay-info-field">
              <label htmlFor="contact-name">Name</label>
              <input id="contact-name" type="text" required maxLength={100} autoComplete="name" value={form.name} onChange={update('name')} placeholder="Your name" />
            </div>
            <div className="ay-info-field">
              <label htmlFor="contact-email">Email</label>
              <input id="contact-email" type="email" required maxLength={200} autoComplete="email" value={form.email} onChange={update('email')} placeholder="you@example.com" />
            </div>
          </div>

          <div className="ay-info-field">
            <label htmlFor="contact-reason">What can we help with?</label>
            <select id="contact-reason" required value={form.reason} onChange={update('reason')}>
              <option value="" disabled>Select one</option>
              {REASONS.map((reason) => <option key={reason} value={reason}>{reason}</option>)}
            </select>
          </div>

          <div className="ay-info-field">
            <label htmlFor="contact-subject">Subject</label>
            <input id="contact-subject" type="text" required maxLength={160} value={form.subject} onChange={update('subject')} placeholder="What is this about?" />
          </div>

          <div className="ay-info-field">
            <label htmlFor="contact-message">Message</label>
            <textarea id="contact-message" required minLength={10} maxLength={5000} rows={7} value={form.message} onChange={update('message')} placeholder="Tell us how we can help." />
          </div>

          {status === 'sent' && (
            <div role="status" className="ay-info-notice ay-info-notice--ok">Thanks. Your message has been sent to the ayna team.</div>
          )}
          {error && (
            <div role="alert" className="ay-info-notice ay-info-notice--err">{error}</div>
          )}

          <button type="submit" className="ay-info-btn ay-info-btn--block" disabled={status === 'sending'}>
            {status === 'sending' ? 'Sending…' : 'Send message'}
          </button>
        </form>
      </div>
    </InfoPage>
  );
}
