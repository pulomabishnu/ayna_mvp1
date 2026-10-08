import { useEffect, useMemo, useState } from 'react';
import { getProfileMatchPercentForProduct, getProfileMatchLabelsForProduct } from '../../data/products.js';
import { getBuyUrl } from '../data/buyUrl.js';
import { getVerificationLinks } from '../../utils/verificationLinks.js';
import { isPartnerBrandItem, getPartnerDisclosureText } from '../../utils/partnerBrands.js';
import { getSupabaseClient } from '../../utils/supabaseClient.js';
import { apiUrl } from '../../utils/apiUrl.js';
import ProductImage from '../components/ProductImage.jsx';

function textValue(value) {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) return value.map(textValue).filter(Boolean).join(' ');
  if (typeof value === 'object') return String(value.summary || value.text || value.body || value.description || '').trim();
  return String(value).trim();
}

function firstParagraph(value, max = 480) {
  const text = textValue(value).replace(/\s+/g, ' ').trim();
  if (!text) return '';
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > max * .7 ? lastSpace : max).trim()}…`;
}

function shortPrice(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  const m = text.match(/^(Free|\$[\d,]+(?:\.\d+)?(?:\s*[–-]\s*\$?[\d,]+(?:\.\d+)?)?)/i);
  return m ? m[1] : text.split(/[,(]| for /i)[0].trim();
}

function IconButton({ label, onClick, children }) {
  return <button type="button" aria-label={label} onClick={onClick} style={{ width: 38, height: 38, borderRadius: '50%', border: '1px solid var(--ayna-border)', background: 'rgba(255,252,249,.94)', color: 'var(--ayna-deep-space)', display: 'grid', placeItems: 'center', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>{children}</button>;
}

function Section({ title, children, action }) {
  return (
    <section style={{ padding: '22px 0', borderTop: '1px solid var(--ayna-border)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 'calc(17px * var(--ayna-text-scale, 1))', color: 'var(--ayna-heading)', letterSpacing: '-.015em' }}>{title}</h2>
        {action}
      </div>
      <div style={{ marginTop: 12 }}>{children}</div>
    </section>
  );
}

function DetailRow({ label, value }) {
  const [open, setOpen] = useState(false);
  if (!value) return null;
  return (
    <div style={{ borderTop: '1px solid var(--ayna-border)' }}>
      <button type="button" onClick={() => setOpen((v) => !v)} style={{ width: '100%', border: 0, background: 'transparent', minHeight: 52, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, textAlign: 'left', color: 'var(--ayna-text)', cursor: 'pointer' }}>
        <span style={{ fontWeight: 680, fontSize: 13 }}>{label}</span><span style={{ color: 'var(--ayna-text-faint)', fontSize: 18 }}>{open ? '−' : '+'}</span>
      </button>
      {open && <div style={{ padding: '0 0 16px', color: 'var(--ayna-text-muted)', fontSize: 12.5, lineHeight: 1.55, whiteSpace: 'pre-line' }}>{value}</div>}
    </div>
  );
}

function AskAynaInline({ product, quizAnswers, ecosystemProducts }) {
  const [session, setSession] = useState(undefined);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const supabase = getSupabaseClient();
    if (!supabase) { setSession(null); return undefined; }
    supabase.auth.getSession().then(({ data }) => { if (!cancelled) setSession(data?.session || null); }).catch(() => { if (!cancelled) setSession(null); });
    return () => { cancelled = true; };
  }, []);

  const ask = async () => {
    const q = input.trim();
    if (!q || sending) return;
    setInput(''); setError('');
    const next = [...messages, { role: 'user', text: q }];
    setMessages(next); setSending(true);
    try {
      if (!session?.access_token) throw new Error('Sign in to ask Ayna about this product.');
      const res = await fetch(apiUrl('/api/product-chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ question: q, product, aiInsights: {}, userContext: quizAnswers?.fullHealthIntake ? JSON.stringify(quizAnswers.fullHealthIntake).slice(0, 4000) : '', ecosystemProducts: Array.isArray(ecosystemProducts) ? ecosystemProducts.slice(0, 20) : [] }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.answer) throw new Error(data?.error || 'Could not get an answer right now.');
      setMessages((prev) => [...prev, { role: 'assistant', text: data.answer }]);
    } catch (e) {
      setError(e?.message || 'Something went wrong.');
      setMessages(next);
    } finally { setSending(false); }
  };

  return (
    <div>
      {messages.length > 0 && <div style={{ display: 'grid', gap: 9, marginBottom: 12 }}>{messages.slice(-4).map((m, i) => <div key={i} style={{ justifySelf: m.role === 'user' ? 'end' : 'start', maxWidth: '88%', borderRadius: 14, padding: '9px 11px', background: m.role === 'user' ? 'var(--ayna-deep-space)' : 'var(--ayna-bg-alt)', color: m.role === 'user' ? '#fff' : 'var(--ayna-text)', fontSize: 12.5, lineHeight: 1.45 }}>{m.text}</div>)}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') ask(); }} placeholder="Ask about this product" style={{ flex: 1, minWidth: 0, height: 44, borderRadius: 12, border: '1px solid var(--ayna-border)', background: '#fff', padding: '0 12px', outline: 0, color: 'var(--ayna-text)', font: 'inherit', fontSize: 12.5 }} />
        <button type="button" onClick={ask} disabled={sending} style={{ width: 44, borderRadius: 12, border: 0, background: 'var(--ayna-deep-space)', color: '#fff', fontWeight: 800, cursor: 'pointer', opacity: sending ? .55 : 1 }}>↑</button>
      </div>
      {error && <div style={{ marginTop: 8, color: '#991B1B', fontSize: 11.5 }}>{error}</div>}
    </div>
  );
}

export default function ProductDetailScreen({ product, onBack, isSaved = false, onToggleSaved, isInEcosystem = false, onAddToEcosystem, quizAnswers = null, ecosystemProducts = [] }) {
  const [shareCopied, setShareCopied] = useState(false);
  const image = product?.image || product?.imageUrl || product?.images?.[0];
  const name = product?.name || 'Product';
  const brand = product?.brand || String(name).split(' ')[0] || '';
  const price = shortPrice(product?.price || product?.priceDisplay);
  const matchPercent = getProfileMatchPercentForProduct(product, quizAnswers);
  const matchLabels = getProfileMatchLabelsForProduct(product, quizAnswers) || [];
  const reasons = matchLabels.slice(0, 3);
  const buyUrl = getBuyUrl(product);
  const community = firstParagraph(product?.communityReview, 420);
  const clinician = firstParagraph(product?.doctorOpinionShort || product?.doctorOpinion, 420);
  const effectiveness = firstParagraph(product?.effectiveness, 300);
  const summary = firstParagraph(product?.summary || product?.description, 360);
  const isPartner = isPartnerBrandItem(product);
  const partnerDisclosure = isPartner ? getPartnerDisclosureText(product) : '';
  const scientificLinks = getVerificationLinks(product, 'scientific');
  const doctorLinks = getVerificationLinks(product, 'doctor');
  const sourceCount = scientificLinks.length + doctorLinks.length;

  const howToUse = useMemo(() => {
    if (Array.isArray(product?.howToUse?.steps)) return product.howToUse.steps.map((s, i) => `${i + 1}. ${textValue(s)}`).join('\n');
    return textValue(product?.howToUse || product?.directions);
  }, [product]);
  const ingredients = useMemo(() => {
    if (Array.isArray(product?.ingredientScience)) return product.ingredientScience.map((x) => textValue(x?.name || x?.ingredient || x)).filter(Boolean).join(', ');
    return textValue(product?.ingredients || product?.safety?.materials);
  }, [product]);
  const safety = firstParagraph(product?.safety?.opinionAlerts || product?.safety?.sideEffects || product?.safety?.allergens || product?.safety?.recalls, 520);

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) await navigator.share({ title: name, url });
      else { await navigator.clipboard.writeText(url); setShareCopied(true); setTimeout(() => setShareCopied(false), 1600); }
    } catch { /* user cancelled */ }
  };

  return (
    <div style={{ flex: 1, minWidth: 0, minHeight: 0, background: 'var(--ayna-bg)', color: 'var(--ayna-text)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 112 }}>
        <div style={{ position: 'relative', background: 'var(--ayna-bg-alt)' }}>
          <div style={{ position: 'absolute', zIndex: 3, left: 16, right: 16, top: 'max(16px, env(safe-area-inset-top))', display: 'flex', justifyContent: 'space-between' }}>
            <IconButton label="Back" onClick={onBack}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M11 18l-6-6 6-6"/></svg></IconButton>
            <div style={{ display: 'flex', gap: 8 }}>
              <IconButton label={isSaved ? 'Remove from saved' : 'Save'} onClick={onToggleSaved}><span style={{ fontSize: 18 }}>{isSaved ? '♥' : '♡'}</span></IconButton>
              <IconButton label="Share" onClick={handleShare}><span style={{ fontSize: 16 }}>↗</span></IconButton>
            </div>
          </div>
          <div style={{ width: '100%', aspectRatio: '1 / 1.03', maxHeight: 480 }}><ProductImage src={image} alt={name} allowBrandLogo={product?.type === 'digital'} /></div>
        </div>

        <main style={{ padding: '20px 20px 0' }}>
          {shareCopied && <div style={{ fontSize: 11, color: 'var(--ayna-text-faint)', marginBottom: 6, textAlign: 'right' }}>Link copied</div>}
          <div style={{ color: 'var(--ayna-text-faint)', textTransform: 'uppercase', letterSpacing: '.08em', fontSize: 10, fontWeight: 750 }}>{brand}</div>
          <h1 style={{ margin: '6px 0 0', fontSize: 'calc(28px * var(--ayna-text-scale, 1))', lineHeight: 1.08, letterSpacing: '-.035em', color: 'var(--ayna-heading)' }}>{name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 11 }}>
            {price && <div style={{ fontWeight: 760, fontSize: 17 }}>{price}</div>}
            {product?.userRating != null && <div style={{ color: 'var(--ayna-text-muted)', fontSize: 12 }}>★ {product.userRating}</div>}
            {isPartner && <div style={{ marginLeft: 'auto', color: 'var(--ayna-mauve)', fontSize: 10.5, fontWeight: 760 }}>ayna partner</div>}
          </div>

          {matchPercent != null && (
            <div style={{ marginTop: 20, borderRadius: 20, padding: 17, background: 'var(--ayna-bg-alt)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}><span style={{ fontSize: 34, lineHeight: 1, fontWeight: 830, letterSpacing: '-.045em', color: 'var(--ayna-deep-space)' }}>{matchPercent}%</span><span style={{ color: 'var(--ayna-text-muted)', fontWeight: 700, fontSize: 12.5 }}>match for you</span></div>
              {reasons.length > 0 && <div style={{ marginTop: 10, display: 'grid', gap: 7 }}>{reasons.map((r) => <div key={r} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', color: 'var(--ayna-text-muted)', fontSize: 12, lineHeight: 1.4 }}><span style={{ color: 'var(--ayna-mauve)', fontWeight: 900 }}>✓</span><span>{r}</span></div>)}</div>}
            </div>
          )}

          {summary && <p style={{ margin: '18px 0 0', color: 'var(--ayna-text-muted)', fontSize: 13.5, lineHeight: 1.6 }}>{summary}</p>}
          {isPartner && <p style={{ margin: '12px 0 0', color: 'var(--ayna-text-faint)', fontSize: 10.5, lineHeight: 1.45 }}>{partnerDisclosure}</p>}

          <div style={{ display: 'grid', gridTemplateColumns: buyUrl ? '1fr 1fr' : '1fr', gap: 9, marginTop: 20 }}>
            {buyUrl && <a href={buyUrl} target="_blank" rel="noopener noreferrer" style={{ minHeight: 46, borderRadius: 13, background: 'var(--ayna-deep-space)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 760, fontSize: 13, textDecoration: 'none' }}>View product</a>}
            <button type="button" onClick={onAddToEcosystem} disabled={isInEcosystem} style={{ minHeight: 46, borderRadius: 13, border: '1px solid var(--ayna-border)', background: '#fff', color: 'var(--ayna-deep-space)', fontWeight: 760, fontSize: 13, cursor: isInEcosystem ? 'default' : 'pointer', opacity: isInEcosystem ? .62 : 1 }}>{isInEcosystem ? 'In your ecosystem' : 'Add to ecosystem'}</button>
          </div>

          {community && <Section title="What women are saying"><div style={{ color: 'var(--ayna-text)', fontSize: 13.5, lineHeight: 1.6 }}>“{community}”</div><div style={{ marginTop: 10, color: 'var(--ayna-text-faint)', fontSize: 10.5 }}>Community experience · not medical evidence</div></Section>}

          {(clinician || effectiveness || sourceCount > 0) && <Section title="Evidence" action={sourceCount > 0 ? <span style={{ color: 'var(--ayna-text-faint)', fontSize: 10.5 }}>{sourceCount} source{sourceCount === 1 ? '' : 's'}</span> : null}>
            {clinician && <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ayna-text)' }}>{clinician}</div>}
            {effectiveness && <div style={{ marginTop: clinician ? 10 : 0, fontSize: 12.5, lineHeight: 1.55, color: 'var(--ayna-text-muted)' }}>{effectiveness}</div>}
          </Section>}

          <Section title="Ask Ayna"><AskAynaInline product={product} quizAnswers={quizAnswers} ecosystemProducts={ecosystemProducts} /></Section>

          <section style={{ padding: '22px 0 0', borderTop: '1px solid var(--ayna-border)' }}>
            <h2 style={{ margin: '0 0 4px', fontSize: 17, color: 'var(--ayna-heading)' }}>Details</h2>
            <DetailRow label="How to use" value={howToUse} />
            <DetailRow label="Ingredients / materials" value={ingredients} />
            <DetailRow label="Safety" value={safety} />
          </section>
        </main>
      </div>

      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 5, padding: '10px 16px max(10px, env(safe-area-inset-bottom))', background: 'rgba(255,252,249,.96)', borderTop: '1px solid var(--ayna-border)', backdropFilter: 'blur(14px)', display: 'grid', gridTemplateColumns: buyUrl ? '1fr 1fr' : '1fr', gap: 9 }}>
        {buyUrl && <a href={buyUrl} target="_blank" rel="noopener noreferrer" style={{ minHeight: 48, borderRadius: 13, background: 'var(--ayna-deep-space)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 780, fontSize: 13, textDecoration: 'none' }}>{price ? `Buy · ${price}` : 'View product'}</a>}
        <button type="button" onClick={onAddToEcosystem} disabled={isInEcosystem} style={{ minHeight: 48, borderRadius: 13, border: '1px solid var(--ayna-border)', background: '#fff', color: 'var(--ayna-deep-space)', fontWeight: 760, cursor: isInEcosystem ? 'default' : 'pointer', opacity: isInEcosystem ? .62 : 1 }}>{isInEcosystem ? 'In ecosystem' : 'Add to ecosystem'}</button>
      </div>
    </div>
  );
}
