import { useEffect, useState } from 'react';
import { CATEGORY_LABELS, getProfileMatchPercentForProduct } from '../../data/products.js';
import { getBuyUrl } from '../data/buyUrl.js';
import { getSupabaseClient } from '../../utils/supabaseClient.js';
import { renderMarkdownLite } from '../../utils/renderMarkdownLite.jsx';
import MatchRing from '../components/MatchRing.jsx';
import WhyMatchScreen from './WhyMatchScreen.jsx';

function SpecRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 16, padding: '15px 0', borderBottom: '1px solid var(--ayna-border)' }}>
      <div style={{ fontSize: 13.5, color: 'var(--ayna-text-faint)', flex: 'none', width: 82 }}>{label}</div>
      <div style={{ flex: 1, fontSize: 13.5, lineHeight: 1.5, color: 'var(--ayna-text)', textAlign: 'right' }}>{value}</div>
    </div>
  );
}

function EvidenceRow({ label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: '12px 0', borderTop: '1px solid var(--ayna-chip-bg)' }}>
      <div style={{ fontSize: 13.5, color: 'var(--ayna-text)' }}>{label}</div>
      <div style={{ fontSize: 13.5, color: 'var(--ayna-text-muted)', textDecoration: 'underline', textDecorationColor: 'var(--ayna-border)' }}>{value}</div>
    </div>
  );
}

const VERIFICATION_LABELS = { doctor: 'Clinical guidance', scientific: 'Scientific', community: 'Community' };

/**
 * Ask Ayna, ported from AskAynaProductTab in src/components/ProductModal.jsx
 * — same /api/product-chat contract, same getSupabaseClient() bearer-token
 * auth, same not-signed-in / weekly-limit-reached handling. Only the markup
 * changed (mobile's own inline-style patterns instead of the desktop
 * pdp-* classes).
 */
function AskAynaTab({ product, quizAnswers, ecosystemProducts }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [session, setSession] = useState(undefined); // undefined = still checking

  useEffect(() => {
    let cancelled = false;
    const supabase = getSupabaseClient();
    if (!supabase) {
      setSession(null);
      return undefined;
    }
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setSession(data?.session || null);
    }).catch(() => { if (!cancelled) setSession(null); });
    return () => { cancelled = true; };
  }, []);

  const suggestions = [
    `What is ${product?.name ? 'this' : 'it'} and how is it used?`,
    'Who is this good for?',
    'Any safety concerns I should know about?',
  ];

  const ask = async (question) => {
    const q = String(question || '').trim();
    if (!q || sending) return;
    setError('');
    setInput('');
    const nextMessages = [...messages, { role: 'user', text: q }];
    setMessages(nextMessages);
    setSending(true);
    try {
      const token = session?.access_token;
      if (!token) throw Object.assign(new Error('not_signed_in'), { code: 'not_signed_in' });
      const res = await fetch('/api/product-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          question: q,
          product,
          aiInsights: {},
          userContext: quizAnswers?.fullHealthIntake ? JSON.stringify(quizAnswers.fullHealthIntake).slice(0, 4000) : '',
          ecosystemProducts: Array.isArray(ecosystemProducts) ? ecosystemProducts.slice(0, 20) : [],
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) throw Object.assign(new Error('not_signed_in'), { code: 'not_signed_in' });
      if (res.status === 429) throw Object.assign(new Error('weekly_limit_reached'), { code: 'weekly_limit_reached' });
      if (!res.ok || !data?.answer) throw new Error(data?.error || 'Could not get an answer right now.');
      setMessages((prev) => [...prev, { role: 'assistant', text: data.answer }]);
    } catch (e) {
      if (e?.code === 'not_signed_in') {
        setError('Sign in to ask Ayna about this product — free accounts get a few AI chats per week.');
      } else if (e?.code === 'weekly_limit_reached') {
        setError("You've used your free chats for this week. They reset weekly, or upgrade for unlimited.");
      } else {
        setError(e?.message || 'Something went wrong. Try again in a moment.');
      }
      setMessages(nextMessages); // keep the question visible even though it failed
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 20, padding: '17px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {messages.length === 0 && (
        <>
          <div style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--ayna-text-muted)' }}>
            New to this kind of product, or not sure what it's actually for? Ask Ayna anything about it.
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {suggestions.map((s) => (
              <div
                key={s}
                onClick={() => ask(s)}
                style={{ fontSize: 12.5, fontWeight: 500, padding: '8px 13px', borderRadius: 99, background: 'var(--ayna-chip-bg)', color: 'var(--ayna-text-muted)', cursor: 'pointer' }}
              >
                {s}
              </div>
            ))}
          </div>
        </>
      )}

      {messages.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, maxHeight: 340, overflowY: 'auto' }}>
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                background: m.role === 'user' ? 'var(--ayna-cta-bg)' : 'var(--ayna-chip-bg)',
                color: m.role === 'user' ? 'var(--ayna-cta-text)' : 'var(--ayna-text)',
                borderRadius: 14,
                padding: '10px 13px',
                fontSize: 13.5,
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
              }}
            >
              {m.role === 'assistant' ? renderMarkdownLite(m.text) : m.text}
            </div>
          ))}
          {sending && <div style={{ alignSelf: 'flex-start', fontSize: 12.5, color: 'var(--ayna-text-faint)' }}>Ayna is thinking…</div>}
        </div>
      )}

      {error && <div style={{ fontSize: 12.5, color: '#B3261E', lineHeight: 1.5 }}>{error}</div>}

      <form onSubmit={(e) => { e.preventDefault(); ask(input); }} style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={session === undefined ? 'Loading…' : 'Ask about this product…'}
          disabled={sending || session === undefined}
          style={{ flex: 1, padding: '11px 14px', borderRadius: 99, border: '1px solid var(--ayna-border)', fontSize: 13.5, background: 'var(--ayna-surface)', color: 'var(--ayna-text)' }}
        />
        <button
          type="submit"
          disabled={sending || !input.trim() || session === undefined}
          style={{
            padding: '11px 18px',
            borderRadius: 99,
            border: 'none',
            background: 'var(--ayna-cta-bg)',
            color: 'var(--ayna-cta-text)',
            fontFamily: "'DM Sans',sans-serif",
            fontWeight: 600,
            fontSize: 13.5,
            cursor: 'pointer',
            opacity: sending || !input.trim() || session === undefined ? 0.5 : 1,
          }}
        >
          Ask
        </button>
      </form>

      <div style={{ fontSize: 11.5, color: 'var(--ayna-text-faint)' }}>Ayna's answers are educational, not medical advice.</div>
    </div>
  );
}

export default function ProductDetailScreen({
  product,
  onBack,
  isSaved = false,
  onToggleSaved,
  isInEcosystem = false,
  onAddToEcosystem,
  whyMatched,
  reads = [],
  quizAnswers = null,
  ecosystemProducts = [],
}) {
  const [activeTab, setActiveTab] = useState('summary');
  // Rendered locally (not through MobileApp's shared `overlay` state, which
  // only holds one layer) so "back" from here returns to this product
  // instead of closing straight through to whatever screen sits underneath.
  const [showWhyMatch, setShowWhyMatch] = useState(false);

  if (!product) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--ayna-text-muted)', fontSize: 13.5 }}>
        No product selected.
      </div>
    );
  }

  if (showWhyMatch) {
    return <WhyMatchScreen product={product} quizAnswers={quizAnswers} onBack={() => setShowWhyMatch(false)} />;
  }

  const matchPercent = getProfileMatchPercentForProduct(product, quizAnswers);
  const openWhyMatch = () => setShowWhyMatch(true);

  const {
    name,
    category,
    price,
    image,
    summary,
    ingredients,
    effectiveness,
    doctorOpinion,
    clinicianAttribution,
    safety = {},
    badges = [],
    whereToBuy = [],
    verificationLinks = {},
  } = product;

  const categoryLabel = CATEGORY_LABELS[category] || (category ? category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '');
  const buyUrl = getBuyUrl(product);
  const safetyNote = safety.sideEffects || safety.allergens || safety.recalls || safety.opinionAlerts || null;

  const specRows = [
    summary && { label: 'Summary', value: summary },
    effectiveness && { label: 'Effectiveness', value: effectiveness },
    safetyNote && { label: 'Safety note', value: safetyNote },
    !buyUrl && whereToBuy.length > 0 && { label: 'Where to buy', value: whereToBuy.join(' · ') },
  ].filter(Boolean);

  const evidenceRows = [
    ...Object.entries(verificationLinks).map(([key, entry]) => {
      const count = Array.isArray(entry?.links) ? entry.links.length : 0;
      if (!count) return null;
      return { label: VERIFICATION_LABELS[key] || key, value: `${count} source${count === 1 ? '' : 's'}` };
    }),
    safety.fdaStatus && { label: 'Regulatory', value: safety.fdaStatus },
  ].filter(Boolean);

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--ayna-bg)', color: 'var(--ayna-text)', animation: 'ay-page .25s ease-out' }}>
      <div style={{ paddingTop: 'max(24px, env(safe-area-inset-top))', paddingLeft: 20, paddingRight: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: 'var(--ayna-heading)' }}>
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 500, fontSize: 14, color: 'var(--ayna-heading)' }}>Back</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['summary', 'evidence', 'ask'].map((tab) => (
            <div
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '9px 17px',
                borderRadius: 99,
                background: activeTab === tab ? 'var(--ayna-cta-bg)' : 'var(--ayna-surface)',
                color: activeTab === tab ? 'var(--ayna-cta-text)' : 'var(--ayna-text-muted)',
                border: '1.5px solid ' + (activeTab === tab ? 'var(--ayna-cta-bg)' : 'var(--ayna-border)'),
                fontFamily: "'DM Sans',sans-serif",
                fontWeight: 500,
                fontSize: 13,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {tab}
            </div>
          ))}
        </div>
      </div>

      <div style={{ margin: '14px 20px 0', borderRadius: 24, padding: 24, background: 'var(--ayna-product-panel)' }}>
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '1 / 1',
            background: 'var(--ayna-surface)',
            borderRadius: 14,
            boxShadow: '0 10px 26px -16px rgba(41,37,36,.35)',
            overflow: 'hidden',
            backgroundImage: image ? `url(${image})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {matchPercent != null && (
            <div
              onClick={openWhyMatch}
              style={{ position: 'absolute', right: 14, bottom: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }}
            >
              <MatchRing percent={matchPercent} size={56} />
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: '1px', color: 'var(--ayna-accent-dark)', background: 'rgba(255,255,255,.9)', borderRadius: 99, padding: '3px 8px' }}>
                WHY {matchPercent}%
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '22px 22px 34px' }}>
        {categoryLabel && (
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '1.4px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)' }}>
            {categoryLabel}
          </div>
        )}
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 33, lineHeight: 1.12, margin: '9px 0 10px', color: 'var(--ayna-heading)' }}>{name}</div>
        {price && <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, color: 'var(--ayna-heading)', marginBottom: 12 }}>{price}</div>}
        {summary && <div style={{ fontSize: 14.5, lineHeight: 1.55, color: 'var(--ayna-text-muted)' }}>{summary}</div>}

        <div style={{ display: 'flex', gap: 10, margin: '20px 0 16px' }}>
          {buyUrl ? (
            <a
              href={buyUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1,
                background: 'var(--ayna-cta-bg)',
                color: 'var(--ayna-cta-text)',
                textAlign: 'center',
                padding: 15,
                borderRadius: 99,
                fontFamily: "'DM Sans',sans-serif",
                fontWeight: 600,
                fontSize: 14.5,
                boxShadow: '0 14px 26px -14px rgba(36,42,82,.7)',
                textDecoration: 'none',
              }}
            >
              Buy Now
            </a>
          ) : (
            <div
              style={{
                flex: 1,
                background: 'var(--ayna-border)',
                color: 'var(--ayna-text-muted)',
                textAlign: 'center',
                padding: 15,
                borderRadius: 99,
                fontFamily: "'DM Sans',sans-serif",
                fontWeight: 600,
                fontSize: 14.5,
              }}
            >
              {whereToBuy.length > 0 ? whereToBuy[0] : 'No link yet'}
            </div>
          )}
          <div
            onClick={onToggleSaved}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: 15,
              borderRadius: 99,
              cursor: 'pointer',
              fontFamily: "'DM Sans',sans-serif",
              fontWeight: 600,
              fontSize: 14.5,
              background: isSaved ? 'var(--ayna-chip-bg)' : 'transparent',
              color: 'var(--ayna-heading)',
              border: '1.5px solid ' + (isSaved ? 'var(--ayna-accent-dark)' : 'var(--ayna-heading)'),
            }}
          >
            {isSaved ? 'Saved' : 'Wishlist'}
          </div>
        </div>

        <div
          onClick={onAddToEcosystem}
          style={{
            display: 'inline-block',
            fontFamily: "'DM Sans',sans-serif",
            fontWeight: 700,
            fontSize: 15,
            color: 'var(--ayna-heading)',
            borderBottom: '2px solid var(--ayna-heading)',
            paddingBottom: 2,
            marginBottom: 22,
            cursor: 'pointer',
          }}
        >
          {isInEcosystem ? 'Added to ecosystem ✓' : 'Add to ecosystem'}
        </div>

        {activeTab === 'summary' ? (
          <>
            {specRows.length > 0 && (
              <div style={{ borderTop: '1px solid var(--ayna-border)' }}>
                {specRows.map((row) => (
                  <SpecRow key={row.label} label={row.label} value={row.value} />
                ))}
              </div>
            )}

            {ingredients && (
              <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 20, padding: 16, marginTop: 20 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9.5, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--ayna-text-faint)', marginBottom: 4 }}>
                  Inside
                </div>
                <div style={{ fontSize: 13.5, lineHeight: 1.6, paddingTop: 8 }}>{ingredients}</div>
              </div>
            )}
          </>
        ) : activeTab === 'ask' ? (
          <AskAynaTab product={product} quizAnswers={quizAnswers} ecosystemProducts={ecosystemProducts} />
        ) : (
          <>
            {whyMatched && (
              <div
                style={{
                  borderRadius: 20,
                  padding: '17px 18px',
                  background: 'linear-gradient(120deg,#242A52,#4E3866 70%,#5D3F73)',
                  color: '#FFFCF9',
                  marginBottom: 12,
                }}
              >
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9.5, letterSpacing: '1.3px', textTransform: 'uppercase', opacity: 0.62 }}>
                  Why you're seeing this
                </div>
                <div style={{ fontSize: 14.5, lineHeight: 1.5, marginTop: 9 }}>{whyMatched}</div>
              </div>
            )}

            {doctorOpinion && (
              <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 20, padding: '17px 18px', marginBottom: 12 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9.5, letterSpacing: '1.3px', textTransform: 'uppercase', color: 'var(--ayna-text-faint)' }}>
                  Clinician opinion
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.6, marginTop: 9, color: 'var(--ayna-text)' }}>{doctorOpinion}</div>
                {clinicianAttribution && (
                  <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--ayna-text-faint)', marginTop: 11 }}>{clinicianAttribution}</div>
                )}
                {badges.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 13 }}>
                    {badges.map((b) => (
                      <div key={b} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 500, padding: '7px 13px', borderRadius: 99, background: 'var(--ayna-chip-bg)', color: 'var(--ayna-text-muted)' }}>
                        {b}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {evidenceRows.length > 0 && (
              <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 20, padding: '17px 18px' }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9.5, letterSpacing: '1.3px', textTransform: 'uppercase', color: 'var(--ayna-text-faint)', marginBottom: 4 }}>
                  Evidence
                </div>
                {evidenceRows.map((row) => (
                  <EvidenceRow key={row.label} label={row.label} value={row.value} />
                ))}
              </div>
            )}
          </>
        )}

        {reads.length > 0 && (
          <>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 14, margin: '22px 0 10px' }}>Reads</div>
            {reads.map((r) => (
              <div
                key={r.id || r.title}
                onClick={r.onClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: 'var(--ayna-surface)',
                  border: '1px solid var(--ayna-border)',
                  borderRadius: 16,
                  padding: '13px 15px',
                  marginBottom: 8,
                  cursor: r.onClick ? 'pointer' : 'default',
                }}
              >
                <div style={{ flex: 1, fontSize: 13.5, lineHeight: 1.4, fontWeight: 500 }}>{r.title}</div>
                {r.mins && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'var(--ayna-text-faint)', whiteSpace: 'nowrap' }}>{r.mins}</div>}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
