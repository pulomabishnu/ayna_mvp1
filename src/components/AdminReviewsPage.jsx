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
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

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
        setNextCursor(body.nextCursor ?? null);
        setStatus('ok');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const { data } = await getSupabaseClient().auth.getSession();
      const res = await fetch(`/api/reviews-admin?cursor=${nextCursor}`, { headers: { Authorization: `Bearer ${data.session.access_token}` } });
      if (!res.ok) throw new Error('load_failed');
      const body = await res.json();
      setResults(rows => [...rows, ...(body.results || [])]);
      setNextCursor(body.nextCursor ?? null);
    } catch { setStatus('error'); }
    finally { setLoadingMore(false); }
  };
  const cardStyle = { padding: '0.9rem 1rem', marginBottom: '0.75rem' };
  const metaStyle = { color: 'var(--color-text-muted)', fontSize: '0.82rem', margin: '0 0 0.5rem' };

  return (
    <section className="container animate-fade-in-up" style={{ padding: 'var(--spacing-xl) var(--spacing-md)', maxWidth: '760px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.45rem' }}>Anonymous feedback</h2>
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
          {results.filter(row => row.kind === 'survey').length} Ayna reviews · {results.filter(row => row.kind === 'purchase').length} purchase answers loaded. No account names or emails are shown.
        </p>
      )}

      {status === 'ok' && results.length === 0 && (
        <p style={{ color: 'var(--color-text-muted)' }}>No feedback responses yet.</p>
      )}

      {status === 'ok' && results.map((row) => (
        <div key={row.id} className="card" style={cardStyle}>
          <p style={{ margin: '0 0 0.2rem', fontWeight: 700 }}>
            {row.kind === 'purchase' ? `${row.answer === 'yes' ? 'Purchased' : 'Did not purchase'}: ${row.productName}` : `Ayna review${row.rating != null ? ` — ${row.rating}★` : ''}`}
            {row.variant ? ` — ${row.variant}` : ''}
          </p>
          {row.feedback && <p style={{ margin: '0 0 0.3rem', fontSize: '0.92rem' }}>{row.feedback}</p>}
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
            {row.kind === 'survey' ? (row.heardAboutUs ? `Heard about us: ${row.heardAboutUs}` : 'Referral not provided') : 'Self-reported retailer visit'}
            {row.submittedAt ? ` — ${new Date(`${row.submittedAt.slice(0, 10)}T12:00:00`).toLocaleDateString()}` : ''}
          </p>
        </div>
      ))}
      {nextCursor !== null && <button type="button" className="btn btn-outline" disabled={loadingMore} onClick={loadMore}>{loadingMore ? 'Loading…' : 'Load more'}</button>}
    </section>
  );
}
