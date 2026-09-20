import React, { useEffect, useState } from 'react';
import { getSupabaseClient } from '../utils/supabaseClient';

/**
 * Internal-only view of every product review/rating anyone has ever
 * submitted, across all users — not linked from any nav, reached by going
 * directly to /admin/reviews. The real gate is server-side: api/reviews-admin
 * checks the caller's email against the ADMIN_EMAILS env var and 403s
 * anyone else, so this page being reachable by URL is not itself a hole.
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
        <h2 style={{ margin: 0, fontSize: '1.45rem' }}>All reviews</h2>
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

      {status === 'ok' && results.length === 0 && (
        <p style={{ color: 'var(--color-text-muted)' }}>No reviews yet.</p>
      )}

      {status === 'ok' && results.length > 0 && (
        <>
          <p style={metaStyle}>{results.length} product{results.length === 1 ? '' : 's'} with activity.</p>
          {results.map((row) => (
            <div key={`${row.productId}`} className="card" style={cardStyle}>
              <p style={{ margin: '0 0 0.35rem', fontWeight: 700 }}>{row.productName}</p>

              {row.ratings.length > 0 && (
                <p style={metaStyle}>
                  {row.ratings.length} rating{row.ratings.length === 1 ? '' : 's'} — avg{' '}
                  {(row.ratings.reduce((a, b) => a + Number(b), 0) / row.ratings.length).toFixed(1)}★
                </p>
              )}

              {row.reviews.length === 0 ? (
                <p style={{ ...metaStyle, margin: 0 }}>No written reviews for this product.</p>
              ) : (
                row.reviews.map((r, i) => (
                  <div key={i} style={{ padding: '0.5rem 0', borderTop: i === 0 ? 'none' : '1px solid var(--color-border)' }}>
                    <p style={{ margin: '0 0 0.2rem', fontSize: '0.92rem' }}>{r.text}</p>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                      {row.reviewerEmail}{r.date ? ` — ${new Date(r.date).toLocaleString()}` : ''}
                    </p>
                  </div>
                ))
              )}
            </div>
          ))}
        </>
      )}
    </section>
  );
}
