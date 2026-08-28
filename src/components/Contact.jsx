import React, { useState } from 'react';

const REASONS = [
  'Partnerships',
  'Help & Support',
  'Feedback or Feature Request',
  'Press & Media',
  'Other',
];

const FIELD_STYLE = {
  width: '100%',
  boxSizing: 'border-box',
  border: '1px solid #ded9e4',
  borderRadius: '10px',
  background: '#fff',
  color: '#1A1714',
  font: "400 15px/1.4 'DM Sans', sans-serif",
  padding: '12px 14px',
  outline: 'none',
};

const LABEL_STYLE = {
  display: 'block',
  marginBottom: '7px',
  color: '#4a4356',
  fontSize: '13px',
  fontWeight: 600,
};

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
      const response = await fetch('/api/contact', {
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
    <div className="mockup-page" style={{ padding: '3.5rem 1.5rem 5rem' }}>
      <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            border: 'none',
            background: 'none',
            padding: 0,
            marginBottom: '2rem',
            color: '#6f6880',
            cursor: 'pointer',
            font: "500 14px/1 'DM Sans', sans-serif",
          }}
        >
          Back
        </button>

        <div
          className="contact-page__grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 0.9fr) minmax(0, 1.1fr)',
            gap: 'clamp(2rem, 6vw, 5rem)',
            alignItems: 'start',
          }}
        >
          <section>
            <div
              style={{
                color: '#766d83',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginBottom: '1rem',
              }}
            >
              Contact
            </div>

            <h1
              style={{
                margin: 0,
                font: "400 clamp(2.4rem, 5vw, 4rem)/1.05 'Playfair Display', serif",
                color: '#1A1714',
                maxWidth: '520px',
              }}
            >
              How can we help?
            </h1>

            <p
              style={{
                margin: '1.4rem 0 0',
                color: '#6f6880',
                fontSize: '16px',
                lineHeight: 1.7,
                maxWidth: '430px',
              }}
            >
              Send us a note and we’ll make sure it reaches the right person on the Ayna team.
            </p>

            <div
              style={{
                marginTop: '2.25rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid #e5e0e9',
                maxWidth: '430px',
                color: '#6f6880',
                fontSize: '14px',
                lineHeight: 1.7,
              }}
            >
              For brand collaborations, choose <strong style={{ color: '#4a4356' }}>Partnerships</strong>.
              For questions about using Ayna, choose <strong style={{ color: '#4a4356' }}>Help & Support</strong>.
            </div>
          </section>

          <form
            onSubmit={submit}
            style={{
              background: '#fff',
              border: '1px solid #e4dfe8',
              borderRadius: '18px',
              padding: 'clamp(1.4rem, 4vw, 2rem)',
              boxShadow: '0 12px 40px rgba(54, 45, 65, 0.06)',
            }}
          >
            <div style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}>
              <label>
                Website
                <input
                  type="text"
                  tabIndex="-1"
                  autoComplete="off"
                  value={form.companyWebsite}
                  onChange={update('companyWebsite')}
                />
              </label>
            </div>

            <div className="contact-page__name-email" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label htmlFor="contact-name" style={LABEL_STYLE}>Name</label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  maxLength={100}
                  value={form.name}
                  onChange={update('name')}
                  style={FIELD_STYLE}
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="contact-email" style={LABEL_STYLE}>Email</label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  maxLength={200}
                  value={form.email}
                  onChange={update('email')}
                  style={FIELD_STYLE}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <label htmlFor="contact-reason" style={LABEL_STYLE}>What can we help with?</label>
              <select
                id="contact-reason"
                required
                value={form.reason}
                onChange={update('reason')}
                style={FIELD_STYLE}
              >
                <option value="" disabled>Select one</option>
                {REASONS.map((reason) => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <label htmlFor="contact-subject" style={LABEL_STYLE}>Subject</label>
              <input
                id="contact-subject"
                type="text"
                required
                maxLength={160}
                value={form.subject}
                onChange={update('subject')}
                style={FIELD_STYLE}
                placeholder="What is this about?"
              />
            </div>

            <div style={{ marginTop: '1rem' }}>
              <label htmlFor="contact-message" style={LABEL_STYLE}>Message</label>
              <textarea
                id="contact-message"
                required
                minLength={10}
                maxLength={5000}
                rows={7}
                value={form.message}
                onChange={update('message')}
                style={{ ...FIELD_STYLE, resize: 'vertical', minHeight: '150px' }}
                placeholder="Tell us how we can help."
              />
            </div>

            {status === 'sent' && (
              <div
                role="status"
                style={{
                  marginTop: '1rem',
                  padding: '11px 13px',
                  borderRadius: '9px',
                  background: '#f3f6f1',
                  color: '#435143',
                  fontSize: '14px',
                }}
              >
                Thanks. Your message has been sent to the Ayna team.
              </div>
            )}

            {error && (
              <div
                role="alert"
                style={{
                  marginTop: '1rem',
                  padding: '11px 13px',
                  borderRadius: '9px',
                  background: '#fff2f0',
                  color: '#8b342d',
                  fontSize: '14px',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-navy"
              disabled={status === 'sending'}
              style={{
                width: '100%',
                marginTop: '1.25rem',
                justifyContent: 'center',
                opacity: status === 'sending' ? 0.65 : 1,
              }}
            >
              {status === 'sending' ? 'Sending…' : 'Send message'}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @media (max-width: 760px) {
          .contact-page__grid,
          .contact-page__name-email {
            grid-template-columns: 1fr !important;
          }

          .mockup-page form {
            min-width: 0;
          }
        }
      `}</style>
    </div>
  );
}
