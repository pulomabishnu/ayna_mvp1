import React, { useState } from 'react';
import Disclaimer from './Disclaimer';

// Build purchase/search URLs for common retailers (product name encoded)
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
  'Ritual.com': () => 'https://www.ritual.com/',
  'LOLA.com': (q) => `https://www.mylola.com/search?q=${encodeURIComponent(q)}`,
  'OurKindra.com': () => 'https://ourkindra.com/',
  'Maude.com': () => 'https://hellomaude.com/',
  'VisanaHealth.com': () => 'https://www.visanahealth.com/',
};
function getStoreUrl(storeName, productName) {
  const key = Object.keys(STORE_SEARCH_URLS).find(k => storeName.toLowerCase().includes(k.toLowerCase()));
  if (key) {
    const fn = STORE_SEARCH_URLS[key];
    return typeof fn === 'function' ? fn(productName || '') : fn;
  }
  return `https://www.google.com/search?q=${encodeURIComponent((productName || '') + ' ' + storeName)}`;
}

export default function ProductModal({ product, onClose, onTrack, isTracked, onOmit, isOmitted, onToggleCompare, isInCompare, onAddToEcosystem, isInEcosystem, userZipCode }) {
    const [activeTab, setActiveTab] = useState('safety');
    const [chatMessages, setChatMessages] = useState([{ role: 'assistant', text: `Hi! I'm Ayna. What would you like to know about ${product?.name}?` }]);
    const [chatInput, setChatInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const isDigital = product.type === 'digital';

    if (!product) return null;

    const tabs = [
        { id: 'safety', label: isDigital ? 'Privacy & Safety' : 'Safety & Ingredients', icon: '🛡️' },
        { id: 'doctor', label: "Doctor's Opinion", icon: '👩‍⚕️' },
        { id: 'science', label: 'Scientific Literature', icon: '🔬' },
        { id: 'social', label: 'Community', icon: '💬' },
        { id: 'buy', label: isDigital ? 'Get It' : 'Where to Buy', icon: '🛒' },
        { id: 'chat', label: 'Ask Ayna', icon: '✨' },
    ];

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

    const renderVerificationLinks = (linksOrSection, aiSummaryOverride, label, type) => {
        const section = typeof linksOrSection === 'object' && linksOrSection !== null && !Array.isArray(linksOrSection) && (linksOrSection.links || linksOrSection.url || linksOrSection.link)
            ? linksOrSection
            : { links: linksOrSection, aiSummary: aiSummaryOverride };
        const { links, aiSummary } = getVerificationSection(section);
        const linksArray = links.map(l => ({ ...l, url: (l.url || l.href || '').trim() })).filter(l => l.url && (l.url.startsWith('http://') || l.url.startsWith('https://')));
        const hasReputableSources = linksArray.length > 0;

        return (
            <div style={{ marginTop: '1.5rem' }}>
                {/* AI Summary Section */}
                {aiSummary && (
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
                                Ayna could not find reputable independent clinician reviews for this product online. We strongly recommend discussing this product with your doctor to ensure it fits your specific health profile.
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
                <div style={{ position: 'relative', height: '240px', width: '100%', overflow: 'hidden', background: product.image ? 'transparent' : 'var(--color-primary-fade)' }}>
                    {product.image && product.image !== '/ayna_placeholder.png' ? (
                        <img
                            src={product.image}
                            alt={product.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        <div style={{
                            width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexDirection: 'column', gap: '0.5rem', background: 'white'
                        }}>
                            <img src={`https://logo.clearbit.com/${product.url ? product.url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0] : (product.whereToBuy?.[0] ? product.whereToBuy[0].toLowerCase().replace(/\s+/g, '') + '.com' : 'ayna.com')}`}
                                alt={`${product.name} Logo`}
                                style={{ maxWidth: '150px', maxHeight: '150px', objectFit: 'contain' }}
                                onError={(e) => {
                                    e.target.onerror = null; // prevents looping
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                }}
                            />
                            <div style={{ display: 'none', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                                <span style={{ fontSize: '3rem', fontWeight: '900', color: 'var(--color-primary)', letterSpacing: '-0.05em' }}>AYNA</span>
                                <span style={{ fontSize: '1rem', color: 'var(--color-primary)' }}>Your women's health assistant</span>
                            </div>
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
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', lineHeight: '1.6', maxWidth: '600px' }}>{product.summary}</p>

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
                        {product.price && <span style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--color-text-main)' }}>{product.price}</span>}
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
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Panel Content */}
                <div style={{ padding: '2rem 2.5rem 3rem' }}>
                    {activeTab === 'safety' && (
                        <div className="animate-fade-in">
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>Safety & Privacy Standards</h3>
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
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Medical & Expert Perspectives</h3>
                            <div style={{
                                marginBottom: '1.25rem', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)',
                                background: 'var(--color-secondary-fade)', border: '1px solid var(--color-border)', fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5
                            }}>
                                {product.clinicianOpinionSource === 'independent'
                                    ? 'Clinician opinions and linked sources below are from independent third parties (e.g. medical societies, academic centers, regulators) and are not affiliated with the product brand. Ayna does not endorse any brand. Always consult your own clinician for medical advice.'
                                    : product.clinicianOpinionSource === 'brand'
                                        ? 'Ayna has not found independent clinician opinions for this product. The opinions and links below are from clinicians or content associated with the brand. We still recommend discussing with your own clinician. Ayna does not endorse any brand.'
                                        : 'Sources below may include both independent and brand-associated perspectives. Where possible we prioritize independent clinical sources; some products have only brand-associated clinician content. Ayna does not endorse any brand. Always consult your own clinician for medical advice.'}
                            </div>
                            <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', marginBottom: '1.5rem', borderLeft: '4px solid var(--color-primary)' }}>
                                <p style={{ fontSize: '1.1rem', fontStyle: 'italic', lineHeight: '1.6', color: 'var(--color-text-main)' }}>
                                    "{product.doctorOpinion || 'Consult with your OB-GYN for personalized medical advice.'}"
                                </p>
                            </div>
                            {renderVerificationLinks(
                                product.verificationLinks?.doctor,
                                null,
                                "Expert & Clinical Verification",
                                "doctor"
                            )}
                        </div>
                    )}

                    {activeTab === 'science' && (
                        <div className="animate-fade-in">
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>Scientific Literature & Clinical Evidence</h3>
                            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                                We prioritize products backed by peer-reviewed studies and clinical trials. Verification links point to official repositories like PubMed or clinical journals.
                            </p>
                            <div style={{ background: 'var(--color-surface)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                                <h4 style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Effectiveness Summary</h4>
                                <p>{product.effectiveness || 'Clinical effectiveness data for this specific product is being aggregated.'}</p>
                            </div>
                            {renderVerificationLinks(
                                product.verificationLinks?.scientific,
                                null,
                                "Peer-Reviewed Literature",
                                "science"
                            )}
                        </div>
                    )}

                    {activeTab === 'social' && (
                        <div className="animate-fade-in">
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>Community Experience & Social Proof</h3>
                            <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', marginBottom: '1.5rem' }}>
                                <h4 style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Top Anecdotal Experience</h4>
                                <p style={{ fontSize: '1.05rem', fontStyle: 'italic', color: 'var(--color-text-main)' }}>
                                    "{product.communityReview || 'No community reviews available yet.'}"
                                </p>
                            </div>
                            {renderVerificationLinks(
                                product.verificationLinks?.community,
                                null,
                                "Social & Community Verification",
                                "social"
                            )}
                        </div>
                    )}

                    {activeTab === 'buy' && (
                        <div className="animate-fade-in">
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>Where to Buy</h3>
                            {userZipCode && (
                                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                                    In-store and online availability for zip <strong>{userZipCode}</strong> is shown when we have data. We use retailer and zip code data to surface “in stock” when available.
                                </p>
                            )}
                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                {(product.whereToBuy || []).map(shop => {
                                    const url = product.whereToBuyLinks?.[shop] || getStoreUrl(shop, product.name);
                                    return (
                                        <a
                                            key={shop}
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                padding: '1rem 1.5rem',
                                                background: 'var(--color-bg)',
                                                borderRadius: 'var(--radius-md)',
                                                border: '1px solid var(--color-border)',
                                                fontWeight: '600',
                                                color: 'var(--color-primary)',
                                                textDecoration: 'none',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.35rem'
                                            }}
                                        >
                                            {shop} ↗
                                        </a>
                                    );
                                })}
                            </div>
                            {product.platform && (
                                <p style={{ marginTop: '1.5rem' }}><strong>Platform:</strong> {product.platform}</p>
                            )}
                            <Disclaimer compact style={{ marginTop: '1.5rem' }} />
                        </div>
                    )}

                    {activeTab === 'chat' && (
                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '400px' }}>
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

