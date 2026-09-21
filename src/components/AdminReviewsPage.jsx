import React, { useEffect, useState } from 'react';
import { getSupabaseClient } from '../utils/supabaseClient';

/**
 * Internal-only view of every popup satisfaction survey response anyone has
 * ever submitted, across all users — not linked from any nav, reached by
 * going directly to /admin/reviews. The real gate is server-side:
 * api/reviews-admin checks the caller's email against the ADMIN_EMAILS env
 * var and 403s anyone else, so this page being reachable by URL is not
 * itself a hole.
 *
 * This intentionally shows the "how are you liking ayna?" popup responses
 * (star rating, optional feedback, how they heard about us), not per-product
 * ratings/reviews left on product pages — that's a separate, much sparser
 * data source (user_reviews), and popup feedback is what's actually useful
 * to review this early on.
 */
export default function AdminReviewsPage({ onBack }) {
  const [status, setStatus] = useState('loading'); // 'loading' | 'ok' | 'unauthenticated' | 'forbidden' | 'error'
  const [results, setResults] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = getSupabaseClient();
      if (!supabase) { if (!cancelled) setStatus('error'); return; }
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) { if (!cancelled) setStatus('unauthenticated'); return; }

      try {
        const res = await fetch('/api/reviews-admin', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        if (res.status === 401) { setStatus('unauthenticated'); return; }
        if (res.status === 403) { setStatus('forbidden'); return; }
        if (!res.ok) { setStatus('error'); return; }
        const body = await res.json();
        setResults(Array.isArray(body?.results) ? body.results : []);
        setStatus('ok');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const cardStyle = { padding: '0.9rem 1rem', marginBottom: '0.75rem' };
  const metaStyle = { color: 'var(--color-text-muted)', fontSize: '0.82rem', margin: '0 0 0.5rem' };

  return (
    <section className="container animate-fade-in-up" style={{ padding: 'var(--spacing-xl) var(--spacing-md)', maxWidth: '760px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.45rem' }}>Popup reviews</h2>
        <button type="button" className="btn btn-outline" onClick={onBack}>Back</button>
      </div>

      {status === 'loading' && (
        <p style={{ color: 'var(--color-text-muted)' }}>Loading…</p>
      )}

      {status === 'unauthenticated' && (
        <p style={{ color: 'var(--color-text-muted)' }}>Sign in with an admin account to see this.</p>
      )}

      {status === 'forbidden' && (
        <p style={{ color: 'var(--color-text-muted)' }}>Your account doesn't have access to this page.</p>
      )}

      {status === 'error' && (
        <p style={{ color: '#8a1c13' }}>Couldn't load reviews. Try again in a bit.</p>
      )}

      {status === 'ok' && (
        <p style={metaStyle}>
          {results.length} response{results.length === 1 ? '' : 's'} to the "how are you liking ayna?" popup.
        </p>
      )}

      {status === 'ok' && results.length === 0 && (
        <p style={{ color: 'var(--color-text-muted)' }}>No survey responses yet.</p>
      )}

      {status === 'ok' && results.map((row) => (
        <div key={row.userId} className="card" style={cardStyle}>
          <p style={{ margin: '0 0 0.2rem', fontWeight: 700 }}>
            {row.reviewerEmail}{row.rating != null ? ` — ${row.rating}★` : ''}
          </p>
          {row.feedback && <p style={{ margin: '0 0 0.3rem', fontSize: '0.92rem' }}>{row.feedback}</p>}
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
            {row.heardAboutUs ? `Heard about us: ${row.heardAboutUs}` : 'Did not say how they heard about us'}
            {row.submittedAt ? ` — ${new Date(row.submittedAt).toLocaleString()}` : ''}
          </p>
        </div>
      ))}
    </section>
  );
}
