import React, { useState, useEffect } from 'react';
import Disclaimer from './Disclaimer';
import { getAynaRating } from '../data/aynaReviews';
import { fetchProductInsights } from '../utils/fetchProductInsights';

// Build purchase/search URLs for common retailers (product name encoded). Keys matched by store name.
const STORE_SEARCH_URLS = {
  'Amazon': (q) => `https://www.amazon.com/s?k=${encodeURIComponent(q)}`,
  'Target': (q) => `https://www.target.com/s?searchTerm=${encodeURIComponent(q)}`,
  'Walmart': (q) => `https://www.walmart.com/search?q=${encodeURIComponent(q)}`,
  'CVS': (q) => `https://www.cvs.com/shop/search?searchTerm=${encodeURIComponent(q)}`,
  'Whole Foods': (q) => `https://www.amazon.com/wholefoods/s?k=${encodeURIComponent(q)}`,
  'iHerb': (q) => `https://www.iherb.com/search?kw=${encodeURIComponent(q)}`,
  'Ulta': (q) => `https://www.ulta.com/shop/all?search=${encodeURIComponent(q)}`,
  'Sephora': (q) => `https://www.sephora.com/search?keyword=${encodeURIComponent(q)}`,
  'App Store': () => 'https://apps.apple.com/',
  'Google Play': () => 'https://play.google.com/store',
  'Ritual.com': () => 'https://www.ritual.com/',
  'Ritual': () => 'https://www.ritual.com/',
  'LOLA.com': (q) => `https://www.mylola.com/search?q=${encodeURIComponent(q || '')}`,
  'OurKindra.com': () => 'https://ourkindra.com/',
  'Maude.com': (q) => `https://hellomaude.com/search?q=${encodeURIComponent(q || '')}`,
  'Maude': () => 'https://hellomaude.com/',
  'VisanaHealth.com': () => 'https://www.visanahealth.com/',
  'Saalt.com': (q) => `https://saalt.com/search?q=${encodeURIComponent(q || '')}`,
  'Saalt': (q) => `https://saalt.com/search?q=${encodeURIComponent(q || '')}`,
  'Thinx.com': () => 'https://www.shethinx.com/',
  'Thinx': () => 'https://www.shethinx.com/',
  'Bodily': () => 'https://itsbodily.com/',
  'ItsBodily.com': () => 'https://itsbodily.com/',
  'Best Buy': (q) => `https://www.bestbuy.com/site/searchpage.jsp?st=${encodeURIComponent(q || '')}`,
  'Pharmacy with prescription': () => 'https://www.goodrx.com/',
};
// If the store name looks like a brand domain (e.g. Rael.com, Cora.life), return direct URL instead of Google search.
function isBrandDomain(storeName) {
  if (!storeName || typeof storeName !== 'string') return false;
  const normalized = storeName.trim().toLowerCase().replace(/\s+/g, '');
  return /^[a-z0-9][a-z0-9.-]*\.(com|io|co|life|health|org|net)$/i.test(normalized);
}
function brandDomainToUrl(storeName) {
  const normalized = storeName.trim().toLowerCase().replace(/\s+/g, '');
  return normalized.startsWith('http') ? normalized : `https://${normalized}`;
}
function getStoreUrl(storeName, productName) {
  if (!storeName || typeof storeName !== 'string') return 'https://www.google.com/search?q=women+health+products';
  if (isBrandDomain(storeName)) return brandDomainToUrl(storeName);
  const key = Object.keys(STORE_SEARCH_URLS).find(k => storeName.toLowerCase().replace(/\s+/g, '').includes(k.toLowerCase().replace(/\s+/g, '')) || k.toLowerCase() === storeName.toLowerCase());
  if (key) {
    const fn = STORE_SEARCH_URLS[key];
    const out = typeof fn === 'function' ? fn(productName || '') : fn;
    return (typeof out === 'string' && out.startsWith('http')) ? out : `https://www.google.com/search?q=${encodeURIComponent((productName || '') + ' ' + storeName)}`;
  }
  const safe = (productName || '') + ' ' + storeName;
  return `https://www.google.com/search?q=${encodeURIComponent(safe.trim() || 'women health products')}`;
}

// Ensure social/community links use working URLs (fix bare domains, http→https)
function normalizeSocialUrl(url) {
  if (!url || typeof url !== 'string') return url;
  const u = url.trim();
  try {
    const noHash = u.replace(/#.*$/, '');
    if (/^https?:\/\/(www\.)?tiktok\.com\/?$/i.test(noHash)) return 'https://www.tiktok.com/search?q=women+health';
    const parsed = new URL(u);
    const host = (parsed.hostname || '').replace(/^www\./, '');
    if (parsed.protocol === 'http:' && /^(instagram|facebook|tiktok|youtube)\.com$/i.test(host)) return u.replace(/^http:/i, 'https:');
    return u;
  } catch (_) {
    return u;
  }
}

// Platform order and labels for grouped social links
const SOCIAL_PLATFORMS = [
  { key: 'instagram', label: 'Instagram Reels & Posts', icon: '📷' },
  { key: 'tiktok', label: 'TikTok', icon: '🎵' },
  { key: 'youtube', label: 'YouTube & Shorts', icon: '▶️' },
  { key: 'reddit', label: 'Reddit', icon: '💬' },
  { key: 'facebook', label: 'Facebook', icon: '👥' },
  { key: 'other', label: 'Other', icon: '🔗' }
];

function inferPlatform(url) {
  if (!url) return 'other';
  try {
    const host = (new URL(url).hostname || '').toLowerCase();
    if (host.includes('instagram.com')) return 'instagram';
    if (host.includes('tiktok.com')) return 'tiktok';
    if (host.includes('youtube.com') || host.includes('youtu.be')) return 'youtube';
    if (host.includes('reddit.com')) return 'reddit';
    if (host.includes('facebook.com') || host.includes('fb.com') || host.includes('fb.me')) return 'facebook';
  } catch (_) {}
  return 'other';
}

export default function ProductModal({ product, onClose, onTrack, isTracked, onOmit, isOmitted, onToggleCompare, isInCompare, onAddToEcosystem, isInEcosystem, userZipCode, aynaReviews = null, onRate, onReview }) {
    const [activeTab, setActiveTab] = useState('safety');
    const [chatMessages, setChatMessages] = useState([{ role: 'assistant', text: `Hi! I'm Ayna. What would you like to know about ${product?.name}?` }]);
    const [chatInput, setChatInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [reviewInput, setReviewInput] = useState('');
    const [hoverRating, setHoverRating] = useState(0);
    const [aiInsights, setAiInsights] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState(null);

    useEffect(() => {
        setAiInsights(null);
        setAiError(null);
    }, [product?.id]);

    if (!product) return null;

    const isDigital = product.type === 'digital';
    const isPrescriptionOnly = product.requiresPrescription === true || (product.whereToBuy?.length === 1 && product.whereToBuy[0] === 'Pharmacy with prescription');

    const loadAiInsights = async () => {
        setAiLoading(true);
        setAiError(null);
        try {
            const data = await fetchProductInsights(product);
            setAiInsights(data);
            setActiveTab('doctor');
        } catch (e) {
            setAiError(e?.message || 'Could not load AI research');
        } finally {
            setAiLoading(false);
        }
    };

    const renderAiReferenceCards = (links, heading) => {
        if (!links || links.length === 0) return null;
        return (
            <div style={{ marginTop: '1.25rem' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>{heading}</h4>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {links.map((link, idx) => (
                        <div key={idx} style={{ padding: '1rem 1.25rem', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid #E9D5FF' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
                                <div style={{ flex: '1 1 200px' }}>
                                    <p style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--color-text-main)', marginBottom: '0.25rem' }}>{link.text}</p>
                                    <span style={{ fontSize: '0.7rem', color: '#7E22CE', fontWeight: '600' }}>{link.justification}</span>
                                </div>
                                <a href={link.url} target="_blank" rel="noopener noreferrer" style={{
                                    fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-primary)', textDecoration: 'none',
                                    padding: '0.4rem 0.8rem', background: 'var(--color-primary-fade)', borderRadius: '8px', whiteSpace: 'nowrap',
                                }}>Open ↗</a>
                            </div>
                            {link.summary && <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', lineHeight: 1.5 }}>{link.summary}</p>}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const aynaData = aynaReviews && product ? (aynaReviews[product.id] || { ratings: [], reviews: [] }) : { ratings: [], reviews: [] };
    const aynaReviewCount = (aynaData.reviews || []).length;

    const tabs = [
        { id: 'safety', label: isDigital ? 'Privacy & Safety' : 'Safety & Ingredients', icon: '🛡️' },
        { id: 'doctor', label: 'Clinician opinions', icon: '👩‍⚕️' },
        { id: 'social', label: 'Community', icon: '💬' },
        { id: 'science', label: 'Scientific literature', icon: '🔬' },
        { id: 'ayna-reviews', label: 'Ayna Reviews', icon: '⭐', badge: aynaReviewCount > 0 ? aynaReviewCount : null },
        { id: 'chat', label: 'Ask Ayna', icon: '✨' },
    ];

    const aynaInsightBoxStyle = {
        marginBottom: '1.25rem',
        padding: '0.85rem 1rem',
        borderRadius: 'var(--radius-md)',
        background: 'var(--color-secondary-fade)',
        border: '1px solid var(--color-border)',
        fontSize: '0.85rem',
        color: 'var(--color-text-muted)',
        lineHeight: 1.5,
    };
    const AynaInsight = ({ children }) => (children ? (
        <div style={aynaInsightBoxStyle}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>Ayna AI insight</div>
            <p style={{ margin: 0 }}>{children}</p>
        </div>
    ) : null);

    const renderPrescriptionWorkflow = (compact = false) => (
        <div style={compact ? { marginTop: 0 } : { marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-main)', lineHeight: 1.6, marginBottom: '1rem' }}>
                This product is prescription-only. You can’t buy it directly online or in-store without a prescription. Here’s how to get it:
            </p>
            <ol style={{ fontSize: '0.9rem', color: 'var(--color-text-main)', lineHeight: 1.7, paddingLeft: '1.25rem', marginBottom: '1rem' }}>
                <li><strong>Talk to a clinician.</strong> Schedule a visit with your OB-GYN, primary care provider, or use a telehealth service. Discuss whether this product is right for you.</li>
                <li><strong>Get a prescription.</strong> If they prescribe it, they’ll send the prescription to your preferred pharmacy (or you can use the manufacturer’s telehealth/portal if the product offers one).</li>
                <li><strong>Fill and pick up.</strong> Pick it up at a local pharmacy or have it mailed to you (mail-order/specialty pharmacy, depending on the product).</li>
            </ol>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                <a href="https://www.goodrx.com/" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-primary)', textDecoration: 'none', padding: '0.35rem 0.6rem', border: '1px solid var(--color-primary)', borderRadius: 'var(--radius-pill)' }}>
                    Compare pharmacy prices (GoodRx) ↗
                </a>
                {product.prescriptionPatientUrl && (
                    <a href={product.prescriptionPatientUrl.startsWith('http') ? product.prescriptionPatientUrl : `https://${product.prescriptionPatientUrl}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-primary)', textDecoration: 'none', padding: '0.35rem 0.6rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-pill)', background: 'var(--color-surface-soft)' }}>
                        How to get {product.name.split(/[(\[]/)[0].trim()} ↗
                    </a>
                )}
                {product.prescriptionSavingsUrl && (
                    <a href={product.prescriptionSavingsUrl.startsWith('http') ? product.prescriptionSavingsUrl : `https://${product.prescriptionSavingsUrl}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--color-primary)', textDecoration: 'none', padding: '0.35rem 0.6rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-pill)', background: 'var(--color-surface-soft)' }}>
                        Savings / coupon program ↗
                    </a>
                )}
            </div>
        </div>
    );

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        const userMsg = chatInput.trim();
        setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setChatInput('');
        setIsTyping(true);

        setTimeout(() => {
            setIsTyping(false);
            setChatMessages(prev => [...prev, {
                role: 'assistant',
                text: `Based on my analysis of ${product.name}, that's a great question. According to our Tier 1 data and clinician reviews, it is designed to help with ${product.tags?.join(' and ') || 'your health needs'}. Always consult your healthcare provider for personalized medical advice.`
            }]);
        }, 1500);
    };

    // Normalize verification section: can be { links, aiSummary }, array of links, or single link object
    const getVerificationSection = (section) => {
        if (!section) return { links: [], aiSummary: null };
        if (Array.isArray(section)) return { links: section.filter(l => l && (l.url || l.href)), aiSummary: null };
        const url = section.url || section.href;
        if (url) return { links: [{ ...section, url: url }], aiSummary: section.aiSummary || null };
        const list = section.links || section.link;
        const arr = Array.isArray(list) ? list : (list ? [list] : []);
        return { links: arr.filter(l => l && (l.url || l.href)).map(l => ({ ...l, url: l.url || l.href })), aiSummary: section.aiSummary || null };
    };

    const renderVerificationLinks = (linksOrSection, aiSummaryOverride, label, type, productRef) => {
        const section = typeof linksOrSection === 'object' && linksOrSection !== null && !Array.isArray(linksOrSection) && (linksOrSection.links || linksOrSection.url || linksOrSection.link)
            ? linksOrSection
            : { links: linksOrSection, aiSummary: aiSummaryOverride };
        const { links, aiSummary } = getVerificationSection(section);
        const linksArray = links.map(l => ({ ...l, url: normalizeSocialUrl((l.url || l.href || '').trim()) })).filter(l => l.url && (l.url.startsWith('http://') || l.url.startsWith('https://')));
        const hasReputableSources = linksArray.length > 0;

        // Avoid duplication: Doctor tab has clinician quote; Science tab has Effectiveness Summary
        const showAiSummary = aiSummary && type !== 'doctor' && !(type === 'science' && productRef?.effectiveness);

        return (
            <div style={{ marginTop: '1.5rem' }}>
                {/* AI Summary Section (purple box — not shown for Doctor tab) */}
                {showAiSummary && (
                    <div style={{
                        padding: '1.5rem',
                        background: 'linear-gradient(135deg, #FDF4FF 0%, #F5F3FF 100%)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid #E9D5FF',
                        marginBottom: '1.5rem',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ position: 'absolute', top: 0, right: 0, padding: '0.5rem 1rem', background: '#FAF5FF', fontSize: '0.7rem', fontWeight: '800', color: '#A855F7', borderBottomLeftRadius: '12px' }}>
                            ✨ AYNA AI INSIGHT
                        </div>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#7E22CE', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            Research Summary
                        </h4>
                        <p style={{ fontSize: '0.95rem', color: '#581C87', lineHeight: '1.6', fontWeight: '500' }}>
                            {aiSummary}
                        </p>
                    </div>
                )}

                {!hasReputableSources && type === 'doctor' && (
                    <div style={{
                        padding: '1.5rem',
                        background: '#FFF7ED',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid #FFEDD5',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                    }}>
                        <div style={{ fontSize: '1.5rem' }}>⚠️</div>
                        <div>
                            <p style={{ fontSize: '0.95rem', fontWeight: '700', color: '#9A3412', marginBottom: '0.25rem' }}>
                                No Verified Clinician Opinions Found
                            </p>
                            <p style={{ fontSize: '0.85rem', color: '#C2410C' }}>
                                Ayna could not find reputable independent clinician reviews for this product online. We strongly recommend discussing this product with your clinician to ensure it fits your specific health profile.
                            </p>
                        </div>
                    </div>
                )}

                <span style={{
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    color: 'var(--color-text-muted)',
                    display: 'block',
                    marginBottom: '0.75rem'
                }}>
                    {label} {hasReputableSources ? `(${linksArray.length})` : '(0)'}
                </span>

                <div style={{ display: 'grid', gap: '1rem' }}>
                    {hasReputableSources ? linksArray.map((link, idx) => (
                        <div key={idx} style={{
                            padding: '1.25rem',
                            background: 'var(--color-surface)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            transition: 'all 0.2s ease'
                        }} className="hover-lift">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <div>
                                    <p style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--color-text-main)', marginBottom: '0.25rem' }}>{link.text}</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', background: '#F0FDF4', color: '#166534', borderRadius: '4px', fontWeight: '700' }}>
                                            Reputable Source
                                        </span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', italic: 'true' }}>
                                            — {link.justification || 'Verified medical review or public record.'}
                                        </span>
                                    </div>
                                </div>
                                <a href={link.url} target="_blank" rel="noopener noreferrer" style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--color-primary)',
                                    fontWeight: '700',
                                    textDecoration: 'none',
                                    padding: '0.4rem 0.8rem',
                                    background: 'var(--color-primary-fade)',
                                    borderRadius: '8px',
                                    whiteSpace: 'nowrap'
                                }}>
                                    Full Source ↗
                                </a>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>{link.summary}</p>
                        </div>
                    )) : !aiSummary && (
                        <div style={{
                            padding: '1.5rem',
                            border: '1px dashed var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            textAlign: 'center',
                            color: 'var(--color-text-muted)',
                            fontSize: '0.85rem'
                        }}>
                            No verified external sources found for this section.
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Social tab: group community links by platform (Instagram, TikTok, YouTube, Reddit, Facebook), summarized
    const renderSocialLinks = (linksOrSection, aiSummaryOverride) => {
        const section = typeof linksOrSection === 'object' && linksOrSection !== null && !Array.isArray(linksOrSection) && (linksOrSection.links || linksOrSection.url || linksOrSection.link)
            ? linksOrSection
            : { links: linksOrSection, aiSummary: aiSummaryOverride };
        const { links, aiSummary } = getVerificationSection(section);
        const linksArray = links
            .map(l => ({ ...l, url: normalizeSocialUrl((l.url || l.href || '').trim()), platform: (l.platform || inferPlatform(l.url || l.href)).toLowerCase() }))
            .filter(l => l.url && (l.url.startsWith('http://') || l.url.startsWith('https://')));
        const byPlatform = {};
        linksArray.forEach(l => {
            const p = (l.platform === 'instagram' || l.platform === 'tiktok' || l.platform === 'youtube' || l.platform === 'reddit' || l.platform === 'facebook') ? l.platform : 'other';
            if (!byPlatform[p]) byPlatform[p] = [];
            byPlatform[p].push(l);
        });
        const hasAny = linksArray.length > 0;

        return (
            <div style={{ marginTop: '1rem' }}>
                {aiSummary && (
                    <div style={{
                        padding: '1.25rem',
                        background: 'linear-gradient(135deg, #FDF4FF 0%, #F5F3FF 100%)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid #E9D5FF',
                        marginBottom: '1.5rem'
                    }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#7E22CE', marginBottom: '0.5rem' }}>✨ Summary</h4>
                        <p style={{ fontSize: '0.9rem', color: '#581C87', lineHeight: '1.55' }}>{aiSummary}</p>
                    </div>
                )}
                {!hasAny && (
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>No social or community links for this product yet.</p>
                )}
                {hasAny && SOCIAL_PLATFORMS.map(({ key, label, icon }) => {
                    const list = byPlatform[key];
                    if (!list || list.length === 0) return null;
                    return (
                        <div key={key} style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span>{icon}</span> {label} ({list.length})
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {list.map((link, idx) => (
                                    <div key={idx} style={{
                                        padding: '1rem 1.25rem',
                                        background: 'var(--color-surface)',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--color-border)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
                                            <div style={{ flex: '1 1 200px' }}>
                                                <p style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--color-text-main)', marginBottom: '0.25rem' }}>{link.text}</p>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: '1.45' }}>{link.summary}</p>
                                            </div>
                                            <a href={link.url} target="_blank" rel="noopener noreferrer" style={{
                                                fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-primary)',
                                                textDecoration: 'none', padding: '0.35rem 0.75rem',
                                                background: 'var(--color-primary-fade)', borderRadius: '8px',
                                                whiteSpace: 'nowrap', flexShrink: 0
                                            }}>
                                                Open ↗
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '1rem'
        }} onClick={onClose}>
            <div style={{
                backgroundColor: 'var(--color-surface-soft)', borderRadius: 'var(--radius-lg)',
                width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto',
                boxShadow: 'var(--shadow-lg)', position: 'relative'
            }} onClick={e => e.stopPropagation()}>

                {/* Close */}
                <button onClick={onClose} style={{
                    position: 'absolute', top: '1.5rem', right: '1.5rem', width: '36px', height: '36px',
                    borderRadius: '50%', backgroundColor: 'var(--color-bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', zIndex: 10,
                    border: '1px solid var(--color-border)', cursor: 'pointer', color: 'var(--color-text-main)'
                }}>✕</button>

                {/* Hero Image Section */}
                <div style={{ position: 'relative', height: '240px', width: '100%', overflow: 'hidden', background: 'var(--color-secondary-fade, #fdf2f4)' }}>
                    {product.image && product.image !== '/ayna_placeholder.png' ? (
                        <>
                            <img
                                src={product.image}
                                alt={product.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.style.display = 'none';
                                    e.target.nextElementSibling.style.display = 'flex';
                                }}
                            />
                            <div style={{ display: 'none', width: '100%', height: '100%', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--color-primary)', letterSpacing: '0.02em' }}>AYNA</span>
                                <span style={{ fontSize: '0.9rem', color: 'var(--color-primary)', opacity: 0.9 }}>Your women's health assistant</span>
                            </div>
                        </>
                    ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--color-primary)', letterSpacing: '0.02em' }}>AYNA</span>
                            <span style={{ fontSize: '0.9rem', color: 'var(--color-primary)', opacity: 0.9 }}>Your women's health assistant</span>
                        </div>
                    )}
                    <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        height: '60px', background: 'linear-gradient(to top, var(--color-surface-soft), transparent)'
                    }}></div>
                </div>

                {/* Header */}
                <div style={{ padding: '2.5rem', paddingTop: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{
                                background: 'var(--color-primary-fade)', color: 'var(--color-primary)',
                                padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-pill)',
                                fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em'
                            }}>
                                {product.category}
                            </span>
                            {product.badges && product.badges.map(badge => (
                                <span key={badge} style={{
                                    background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0',
                                    padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-pill)',
                                    fontSize: '0.7rem', fontWeight: '700'
                                }}>
                                    ✨ {badge}
                                </span>
                            ))}
                            {product.integrations && (Array.isArray(product.integrations) ? product.integrations : [product.integrations]).map(int => (
                                <span key={int} style={{ background: 'var(--color-secondary)', color: 'var(--color-text-main)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-pill)', fontSize: '0.7rem', fontWeight: '700' }}>
                                    🔗 {int}
                                </span>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            {onToggleCompare && (
                                <button
                                    onClick={() => onToggleCompare(product)}
                                    style={{
                                        background: isInCompare ? 'var(--color-primary-fade)' : 'transparent',
                                        border: `1px solid ${isInCompare ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                        color: isInCompare ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                        padding: '0.3rem 0.75rem',
                                        borderRadius: 'var(--radius-pill)',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {isInCompare ? '✓ In Comparison' : '+ Add to Compare'}
                                </button>
                            )}
                            <button
                                onClick={() => onOmit(product)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                {isOmitted ? 'Restore' : "Omit"}
                            </button>
                        </div>
                    </div>

                    <h2 style={{ fontSize: '2rem', marginBottom: '0.75rem', color: 'var(--color-text-main)', letterSpacing: '-0.02em' }}>{product.name}</h2>
                    {product.outOfBusiness && (
                        <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: 'var(--color-surface-soft)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', color: 'var(--color-text-main)' }}>
                            <strong>No longer sold.</strong> This brand is out of business. We keep this page so you can still view safety and care information if you have the product.
                        </div>
                    )}
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', lineHeight: '1.6', maxWidth: '600px' }}>{product.summary || product.description || product.tagline}</p>

                    {product.ratingNote && (
                        <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: '#FFF7ED', border: '1px solid #FFEDD5', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', color: '#9A3412' }}>
                            <strong>Rating note:</strong> {product.ratingNote}
                        </div>
                    )}

                    <div style={{ marginTop: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                        <button
                            className={`btn ${isTracked ? 'btn-outline' : 'btn-primary'}`}
                            onClick={() => onTrack(product)}
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: isTracked ? 'transparent' : 'var(--color-primary)',
                                color: isTracked ? 'var(--color-primary)' : 'white',
                                borderColor: 'var(--color-primary)',
                            }}
                        >
                            {isTracked ? '✓ Tracking Safety Alerts' : '🔔 Monitor Safety Recalls'}
                        </button>
                        {onAddToEcosystem && (
                            <button
                                className={`btn ${isInEcosystem ? 'btn-outline' : 'btn-primary'}`}
                                onClick={() => onAddToEcosystem(product)}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: isInEcosystem ? 'transparent' : 'var(--color-primary)',
                                    color: isInEcosystem ? 'var(--color-primary)' : 'white',
                                    borderColor: 'var(--color-primary)',
                                }}
                            >
                                {isInEcosystem ? '✓ In My Ecosystem' : '+ Add to My Ecosystem'}
                            </button>
                        )}
                        {(product.price || product.stage) && <span style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--color-text-main)' }}>{product.price || product.stage}</span>}
                        {!product.ratingNote && (getAynaRating(product, aynaReviews?.[product.id]) ?? product.userRating) != null && (
                            <span style={{ fontSize: '1rem', color: 'var(--color-text-muted)' }} title="Based on user reviews, clinical opinions, and scientific literature">
                                ★ {(getAynaRating(product, aynaReviews?.[product.id]) ?? product.userRating).toFixed(1)}
                            </span>
                        )}
                    </div>

                    {/* Where to buy + product website — visible under the action buttons */}
                    <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)' }}>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', fontWeight: '600' }}>
                            {isPrescriptionOnly ? 'How to get it' : 'Where to buy'}
                        </p>
                        {isPrescriptionOnly ? (
                            renderPrescriptionWorkflow(true)
                        ) : product.outOfBusiness ? (
                            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>This product is no longer available for purchase. If you already have it, you can continue to use it and reference the safety info above.</p>
                        ) : (
                            <div>
                                {userZipCode && (
                                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                                        In-store and online availability for zip <strong>{userZipCode}</strong> is shown when we have data. We use retailer and zip code data to surface “in stock” when available.
                                    </p>
                                )}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                                {product.url && (() => {
                                    const websiteUrl = (product.url || '').trim();
                                    const isValidUrl = websiteUrl !== '#' && (websiteUrl.startsWith('http://') || websiteUrl.startsWith('https://'));
                                    if (!isValidUrl) return null;
                                    const href = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl.replace(/^(https?:\/\/)?/i, '')}`;
                                    return (
                                        <a href={href} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-primary)', textDecoration: 'none', padding: '0.35rem 0.6rem', border: '1px solid var(--color-primary)', borderRadius: 'var(--radius-pill)' }}>
                                            Product website ↗
                                        </a>
                                    );
                                })()}
                                {(product.whereToBuy || []).map(shop => {
                                    const rawUrl = product.whereToBuyLinks?.[shop] || getStoreUrl(shop, product.name);
                                    const url = (typeof rawUrl === 'string' && (rawUrl.startsWith('http://') || rawUrl.startsWith('https://'))) ? rawUrl : getStoreUrl(shop, product.name);
                                    const inStock = product.whereToBuyInStock && product.whereToBuyInStock[shop] === true;
                                    return (
                                        <a
                                            key={shop}
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                fontSize: '0.9rem',
                                                fontWeight: '500',
                                                color: 'var(--color-primary)',
                                                textDecoration: 'none',
                                                padding: '0.35rem 0.6rem',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: 'var(--radius-pill)',
                                                background: 'var(--color-surface-soft)'
                                            }}
                                        >
                                            {shop} ↗ {inStock && <span style={{ color: 'var(--color-primary)', fontWeight: '600' }}>· In stock</span>}
                                        </a>
                                    );
                                })}
                            </div>
                            {product.platform && (
                                <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--color-text-main)' }}>
                                    <strong>Platform:</strong> {product.platform}
                                </p>
                            )}
                            </div>
                        )}
                    </div>

                    <Disclaimer compact style={{ marginTop: '1rem' }} />
                </div>

                {/* Navigation Tabs */}
                <div style={{ padding: '0 2.5rem', position: 'sticky', top: 0, background: 'var(--color-surface-soft)', zIndex: 5 }}>
                    <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-border)', overflowX: 'auto' }}>
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                style={{
                                    padding: '1.25rem 1rem', fontSize: '0.9rem', fontWeight: activeTab === tab.id ? '600' : '400',
                                    borderBottom: activeTab === tab.id ? '3px solid var(--color-primary)' : '3px solid transparent',
                                    color: activeTab === tab.id ? 'var(--color-text-main)' : 'var(--color-text-muted)',
                                    display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap',
                                    background: 'none', border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                                }}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <span style={{ fontSize: '1.1rem' }}>{tab.icon}</span> {tab.label}
                                {tab.badge != null && (
                                    <span style={{ background: 'var(--color-primary)', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: '700' }}>{tab.badge}</span>
                                )}
                            </button>
                        ))}
                    </div>
                    <div style={{ padding: '0.65rem 2.5rem 0.85rem', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
                            <button type="button" className="btn btn-outline" style={{ fontSize: '0.85rem' }} onClick={loadAiInsights} disabled={aiLoading}>
                                {aiLoading ? 'Loading…' : aiInsights ? 'Refresh AI summaries & searches' : 'Load AI summaries & safe searches'}
                            </button>
                            {aiError && <span style={{ color: '#b91c1c', fontSize: '0.85rem' }}>{aiError}</span>}
                            {aiInsights?.generatedAt && (
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                    {aiInsights.providerUsed ? `${aiInsights.providerUsed} · ` : ''}
                                    {new Date(aiInsights.generatedAt).toLocaleString()}
                                </span>
                            )}
                        </div>
                        <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', margin: '0.5rem 0 0', lineHeight: 1.45 }}>
                            Summaries come from AI (Claude, Gemini, or OpenAI — your server tries them in order). Outbound links are only official <strong>search</strong> URLs built on our servers from short phrases, so models never supply raw URLs. Not medical advice. On Vercel, set at least one key, e.g. <code style={{ fontSize: '0.68rem' }}>ANTHROPIC_API_KEY</code> (Claude), <code style={{ fontSize: '0.68rem' }}>GEMINI_API_KEY</code> (Google AI Studio), or <code style={{ fontSize: '0.68rem' }}>OPENAI_API_KEY</code>, and optionally <code style={{ fontSize: '0.68rem' }}>AI_INSIGHTS_PROVIDER_ORDER</code> (default: claude, then gemini, then openai).
                        </p>
                    </div>
                </div>

                {/* Tab Panel Content */}
                <div style={{ padding: '2rem 2.5rem 3rem' }}>
                    {activeTab === 'safety' && (
                        <div className="animate-fade-in">
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Safety & Privacy Standards</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div style={{ background: 'var(--color-bg)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                                    <h4 style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>FDA Regulatory Status</h4>
                                    <p>{product.safety?.fdaStatus || 'N/A'}</p>
                                </div>
                                <div style={{ background: 'var(--color-bg)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                                    <h4 style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Materials & Components</h4>
                                    <p>{product.safety?.materials || 'N/A'}</p>
                                </div>
                                <div style={{ gridColumn: 'span 2', background: product.safety?.recalls?.includes('⚠️') ? '#F1F5F9' : '#F8FAFC', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                                    <h4 style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Safety Alerts & Recalls</h4>
                                    <p>{product.safety?.recalls || 'No active recalls.'}</p>
                                </div>
                                <div style={{ gridColumn: 'span 2', background: 'var(--color-bg)', padding: '1rem', borderRadius: 'var(--radius-md)', borderLeft: '4px solid #EAB308' }}>
                                    <h4 style={{ fontSize: '0.8rem', color: '#854D0E', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Potential Side Effects</h4>
                                    <p style={{ fontSize: '0.9rem' }}>{product.safety?.sideEffects || 'In rare cases, consult with a healthcare professional before use. Side effects for this product are typically minimal but vary by individual.'}</p>
                                </div>
                                <div style={{ gridColumn: 'span 2', background: 'var(--color-bg)', padding: '1rem', borderRadius: 'var(--radius-md)', borderLeft: '4px solid #EF4444' }}>
                                    <h4 style={{ fontSize: '0.8rem', color: '#991B1B', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Community Consensus & Watch-outs</h4>
                                    <p style={{ fontSize: '0.9rem' }}>{product.safety?.opinionAlerts || 'Generally positive reception. Ayna monitors community forums for emerging concerns about reliability or quality changes.'}</p>
                                </div>
                                {isDigital && product.privacy && (
                                    <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
                                        <h4 style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '1rem' }}>Privacy Policy Highlights</h4>
                                        <div style={{ display: 'grid', gap: '1rem' }}>
                                            <p><strong>Storage:</strong> {product.privacy.dataStorage}</p>
                                            <p><strong>Data Sharing:</strong> {product.privacy.sellsData}</p>
                                            <p><strong>Compliance:</strong> {product.privacy.hipaa}</p>
                                            <p style={{ fontStyle: 'italic', background: 'var(--color-bg)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>"{product.privacy.keyPolicy}"</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'doctor' && (
                        <div className="animate-fade-in">
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Clinician opinions</h3>
                            {aiInsights?.clinicalNarrative && (
                                <div style={{
                                    marginBottom: '1.25rem', padding: '1.25rem', borderRadius: 'var(--radius-lg)',
                                    background: 'linear-gradient(135deg, #FDF4FF 0%, #F5F3FF 100%)', border: '1px solid #E9D5FF',
                                }}>
                                    <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#7E22CE', marginBottom: '0.5rem' }}>✨ AI summary (clinical context)</h4>
                                    <p style={{ fontSize: '0.95rem', color: '#581C87', lineHeight: 1.6, margin: 0 }}>{aiInsights.clinicalNarrative}</p>
                                    <p style={{ fontSize: '0.72rem', color: '#7E22CE', margin: '0.75rem 0 0', fontWeight: '600' }}>
                                        Educational only; may be imperfect. Confirm anything important with your clinician.
                                    </p>
                                </div>
                            )}
                            {renderAiReferenceCards(aiInsights?.clinicianLinks, 'MedlinePlus searches (government patient-education results)')}
                            <div style={{
                                marginBottom: '1.25rem', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)',
                                background: 'var(--color-secondary-fade)', border: '1px solid var(--color-border)', fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5
                            }}>
                                <p style={{ margin: 0 }}>
                                {product.clinicianOpinionSource === 'independent'
                                    ? 'This tab shows clinician opinions and clinical guidance only—not scientific literature. Links are from independent third parties (e.g. medical societies, OB-GYNs, clinical guidelines) and are not affiliated with the product brand. Ayna does not endorse any brand. Always consult your own clinician for medical advice.'
                                    : product.clinicianOpinionSource === 'brand'
                                        ? 'Ayna has not found independent clinician opinions for this product. The opinions and links below are from clinicians or content associated with the brand. We still recommend discussing with your own clinician. Ayna does not endorse any brand.'
                                        : 'This tab shows clinician opinions only—not literature. Sources may include both independent and brand-associated perspectives. Ayna does not endorse any brand. Always consult your own clinician for medical advice.'}
                                </p>
                            </div>
                            <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', marginBottom: '1.5rem', borderLeft: '4px solid var(--color-primary)' }}>
                                <p style={{ fontSize: '1.1rem', fontStyle: 'italic', lineHeight: '1.6', color: 'var(--color-text-main)' }}>
                                    {product.doctorOpinion || 'Consult with your OB-GYN for personalized medical advice.'}
                                </p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', fontWeight: '600' }}>
                                    {product.clinicianAttribution
                                        ? `— ${product.clinicianAttribution}`
                                        : product.clinicianOpinionSource === 'independent'
                                            ? '— Independent clinician (not brand-affiliated)'
                                            : product.clinicianOpinionSource === 'brand'
                                                ? '— Brand-affiliated'
                                                : product.clinicianOpinionSource === 'mixed'
                                                    ? '— Mixed: some sources independent, some brand-affiliated (see links below)'
                                                    : '— Source affiliation not specified'}
                                </p>
                                {(() => {
                                    const doctorLinks = product.verificationLinks?.doctor?.links ?? (Array.isArray(product.verificationLinks?.doctor) ? product.verificationLinks.doctor : null);
                                    const firstLink = Array.isArray(doctorLinks) && doctorLinks.length > 0 ? doctorLinks[0] : null;
                                    if (firstLink?.url && firstLink?.text) {
                                        return (
                                            <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                                                Source: <a href={firstLink.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>{firstLink.text}</a>
                                            </p>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>
                            {renderVerificationLinks(
                                product.verificationLinks?.doctor,
                                null,
                                "Clinician opinions & clinical guidance",
                                "doctor",
                                product
                            )}
                        </div>
                    )}

                    {activeTab === 'science' && (
                        <div className="animate-fade-in">
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Scientific literature</h3>
                            {aiInsights?.scienceSummary && (
                                <div style={{
                                    marginBottom: '1.25rem', padding: '1.25rem', borderRadius: 'var(--radius-lg)',
                                    background: 'linear-gradient(135deg, #FDF4FF 0%, #F5F3FF 100%)', border: '1px solid #E9D5FF',
                                }}>
                                    <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#7E22CE', marginBottom: '0.5rem' }}>✨ AI summary (how evidence is usually discussed)</h4>
                                    <p style={{ fontSize: '0.95rem', color: '#581C87', lineHeight: 1.55, margin: 0 }}>{aiInsights.scienceSummary}</p>
                                    <p style={{ fontSize: '0.72rem', color: '#7E22CE', margin: '0.65rem 0 0', fontWeight: '600' }}>Not a systematic review; use PubMed results yourself.</p>
                                </div>
                            )}
                            {renderAiReferenceCards(aiInsights?.literatureLinks, 'PubMed searches (phrases from AI — URLs generated by Ayna)')}
                            <AynaInsight>Peer-reviewed studies and research only. Curated links below go to PubMed, Lancet, Cochrane, and other trusted literature sources—not clinician opinions.</AynaInsight>
                            <div style={{ background: 'var(--color-surface)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                                <h4 style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Effectiveness Summary</h4>
                                <p>{product.effectiveness || 'Clinical effectiveness data for this specific product is being aggregated.'}</p>
                            </div>
                            {renderVerificationLinks(
                                product.verificationLinks?.scientific,
                                null,
                                "Scientific literature",
                                "science",
                                product
                            )}
                        </div>
                    )}

                    {activeTab === 'social' && (
                        <div className="animate-fade-in">
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Community Experience & Social Proof</h3>
                            {aiInsights?.communitySummary && (
                                <div style={{
                                    marginBottom: '1.25rem', padding: '1.25rem', borderRadius: 'var(--radius-lg)',
                                    background: 'linear-gradient(135deg, #FDF4FF 0%, #F5F3FF 100%)', border: '1px solid #E9D5FF',
                                }}>
                                    <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#7E22CE', marginBottom: '0.5rem' }}>✨ AI summary (online discussions)</h4>
                                    <p style={{ fontSize: '0.95rem', color: '#581C87', lineHeight: 1.55, margin: 0 }}>{aiInsights.communitySummary}</p>
                                    <p style={{ fontSize: '0.72rem', color: '#7E22CE', margin: '0.65rem 0 0', fontWeight: '600' }}>Anecdotal framing only — not evidence of safety or efficacy.</p>
                                </div>
                            )}
                            {product.incentivizedReviewSites && product.incentivizedReviewSites.length > 0 && (
                                <div style={{ marginBottom: '1.25rem', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', background: '#FFF7ED', border: '1px solid #FFEDD5', fontSize: '0.9rem', color: '#9A3412' }}>
                                    <strong>Incentivized reviews:</strong>{' '}
                                    {product.incentivizedReviewSites.map((s, i) => (
                                        <span key={i}>
                                            {i > 0 && '; '}
                                            Reviews on {s.site} may be incentivized{s.source ? ` (${s.source})` : ''}.
                                        </span>
                                    ))}
                                    {' '}Star ratings on these platforms may be inflated.
                                </div>
                            )}
                            <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', marginBottom: '1.5rem' }}>
                                <h4 style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Top Anecdotal Experience</h4>
                                {(() => {
                                    const raw = product.communityReview || 'No community reviews available yet.';
                                    const dashIdx = raw.indexOf(' — ');
                                    const quotePart = dashIdx >= 0 ? raw.slice(0, dashIdx).trim() : raw;
                                    const sourceLabel = product.communityReviewSourceLabel || (dashIdx >= 0 ? raw.slice(dashIdx + 3).trim() : null);
                                    const sourceUrl = product.communityReviewSourceUrl;
                                    return (
                                        <>
                                            <p style={{ fontSize: '1.05rem', fontStyle: 'italic', color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>
                                                {quotePart}
                                            </p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>
                                                — {sourceUrl && sourceLabel ? (
                                                    <a href={sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>{sourceLabel}</a>
                                                ) : sourceLabel ? (
                                                    <span>{sourceLabel}</span>
                                                ) : (
                                                    'Unaffiliated user review (e.g. Reddit, Amazon); not brand-affiliated'
                                                )}
                                            </p>
                                        </>
                                    );
                                })()}
                            </div>
                            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                                Real experiences from Instagram reels, TikTok, YouTube Shorts, Reddit, and Facebook. All links open to search or official pages so you can browse multiple posts and reels.
                            </p>
                            {aiInsights?.communityLinks?.length > 0 && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h4 style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>Reddit &amp; YouTube searches (no direct thread URLs)</h4>
                                    {renderSocialLinks({
                                        links: aiInsights.communityLinks.map((c) => ({
                                            url: c.url,
                                            text: c.text,
                                            summary: c.summary || '',
                                            platform: c.platform || 'other',
                                        })),
                                    }, null)}
                                </div>
                            )}
                            {renderSocialLinks(product.verificationLinks?.community, null)}
                        </div>
                    )}

                    {activeTab === 'ayna-reviews' && (
                        <div className="animate-fade-in">
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Ayna Reviews</h3>
                            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                                Anonymous reviews from Ayna users. Your rating and review help others make informed decisions.
                            </p>

                            {isInEcosystem && onRate && (
                                <div style={{ marginBottom: '2rem', padding: '1.25rem', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                                    <h4 style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-main)', marginBottom: '0.75rem' }}>Rate this product</h4>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>You have this in your ecosystem. How would you rate it?</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.75rem' }}>
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => onRate(product, star)}
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                style={{
                                                    background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', fontSize: '1.5rem',
                                                    color: (hoverRating || 0) >= star ? '#EAB308' : 'var(--color-border)'
                                                }}
                                                title={`${star} star${star > 1 ? 's' : ''}`}
                                            >
                                                ★
                                            </button>
                                        ))}
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Your rating helps Ayna compute the overall product rating.</p>
                                </div>
                            )}

                            <div style={{ marginBottom: '2rem', padding: '1.25rem', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                                <h4 style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-main)', marginBottom: '0.75rem' }}>Write an anonymous review</h4>
                                <textarea
                                    value={reviewInput}
                                    onChange={(e) => setReviewInput(e.target.value)}
                                    placeholder="Share your experience with this product..."
                                    rows={3}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.9rem', resize: 'vertical', marginBottom: '0.75rem' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (reviewInput.trim() && onReview) {
                                            onReview(product, reviewInput.trim());
                                            setReviewInput('');
                                        }
                                    }}
                                    disabled={!reviewInput.trim() || !onReview}
                                    className="btn btn-primary"
                                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                >
                                    Post review
                                </button>
                            </div>

                            <h4 style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-main)', marginBottom: '0.75rem' }}>
                                Community reviews {aynaReviewCount > 0 && `(${aynaReviewCount})`}
                            </h4>
                            {aynaReviewCount === 0 ? (
                                <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                    No Ayna reviews yet. Be the first to share your experience!
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {(aynaData.reviews || []).map((r, idx) => (
                                        <div key={idx} style={{ padding: '1rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                                            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--color-text-main)' }}>{r.text}</p>
                                            <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                Anonymous · {r.date ? new Date(r.date).toLocaleDateString() : ''}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'chat' && (
                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '400px' }}>
                            <AynaInsight>Ask Ayna anything about this product. Answers are for education only and are not medical advice; always consult your clinician for personalized care.</AynaInsight>
                            <div style={{ flexGrow: 1, overflowY: 'auto', padding: '1rem', background: 'var(--color-bg)', borderRadius: 'var(--radius-lg)', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {chatMessages.map((msg, idx) => (
                                    <div key={idx} style={{
                                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                        background: msg.role === 'user' ? 'var(--color-primary)' : 'white',
                                        color: msg.role === 'user' ? 'white' : 'var(--color-text-main)',
                                        padding: '0.75rem 1rem',
                                        borderRadius: '1rem',
                                        borderBottomRightRadius: msg.role === 'user' ? 0 : '1rem',
                                        borderBottomLeftRadius: msg.role === 'assistant' ? 0 : '1rem',
                                        maxWidth: '80%',
                                        boxShadow: 'var(--shadow-sm)',
                                        border: msg.role === 'assistant' ? '1px solid var(--color-border)' : 'none'
                                    }}>
                                        <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.4' }}>{msg.text}</p>
                                    </div>
                                ))}
                                {isTyping && (
                                    <div style={{ alignSelf: 'flex-start', background: 'white', padding: '0.75rem 1rem', borderRadius: '1rem', borderBottomLeftRadius: 0, border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                                        Ayna is thinking...
                                    </div>
                                )}
                            </div>
                            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder={`Ask about ${product.name}...`}
                                    style={{ flexGrow: 1, padding: '0.8rem 1rem', borderRadius: 'var(--radius-pill)', border: '1px solid var(--color-border)', outline: 'none' }}
                                />
                                <button type="submit" disabled={isTyping} className="btn btn-primary" style={{ padding: '0 1.5rem', borderRadius: 'var(--radius-pill)' }}>
                                    Send
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

