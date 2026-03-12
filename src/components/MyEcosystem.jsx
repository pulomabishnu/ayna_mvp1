import React, { useMemo, useState } from 'react';
import { HEALTH_FUNCTIONS, ALL_PRODUCTS, detectDuplicates } from '../data/products';
import { getInteractions } from '../data/interactions';

/** Estimate monthly cost in USD from a price string. Returns null if unparseable. */
function estimateMonthlyCost(priceStr, product) {
    if (!priceStr || typeof priceStr !== 'string') return null;
    const s = priceStr.trim();
    const category = product?.category || '';
    const isReusable = /reusable|per pair|per pair/i.test(s) || ['cup', 'disc', 'period-underwear'].includes(category);

    // Explicit per month: e.g. "$10/month" or "Clue Plus $10/month"
    const perMonthMatch = s.match(/\$(\d+)(?:\.\d+)?\s*\/?\s*month/i);
    if (perMonthMatch) return parseFloat(perMonthMatch[1]);

    // Range: $25–$38 → use average
    const rangeMatch = s.match(/\$(\d+)\s*[–\-]\s*\$(\d+)/);
    if (rangeMatch) {
        const avg = (parseFloat(rangeMatch[1]) + parseFloat(rangeMatch[2])) / 2;
        if (/per pair|underwear|pair/i.test(s)) return avg / 18; // ~18 months life
        return avg;
    }

    // Single price: $8 or $29
    const singleMatch = s.match(/\$(\d+)(?:\.\d+)?/);
    const price = singleMatch ? parseFloat(singleMatch[1]) : null;
    if (price == null) return null;

    // "for 60 capsules" etc → assume 2-month supply
    const forMatch = s.match(/for\s*(\d+)\s*(?:capsules|softgels|tablets|pads|tampons)/i);
    if (forMatch) {
        const count = parseInt(forMatch[1], 10);
        if (count >= 30 && count <= 120) return price / (count / 30); // ~monthly
        if (count < 30) return price; // small pack = ~1 month
        return price / 2; // 60 = 2 months typical
    }

    // "$14 for 12 (disposable)" → ~2 packs per 2 months
    if (/disposable/i.test(s)) {
        const dMatch = s.match(/\$(\d+)(?:\.\d+)?\s+for\s+\d+/i);
        if (dMatch) return parseFloat(dMatch[1]) / 2;
    }

    // "$8 for 18" (pads/tampons) → ~1 pack per month
    const forPacksMatch = s.match(/\$(\d+)(?:\.\d+)?\s+for\s+\d+/i);
    if (forPacksMatch && (category.includes('pad') || category.includes('tampon'))) {
        return parseFloat(forPacksMatch[1]);
    }
    if (forPacksMatch) return parseFloat(forPacksMatch[1]); // other "for N" consumables

    // Reusable: "10 years" or "up to 10 years"
    if (/\d+\s*years?|reusable\s*(?:up to)?\s*\d+/i.test(s)) {
        const yearsMatch = s.match(/(\d+)\s*years?|reusable\s*(?:up to)?\s*(\d+)/i);
        const years = yearsMatch ? parseFloat(yearsMatch[1] || yearsMatch[2]) : 5;
        return price / (years * 12);
    }

    // Reusable (cup, disc) without years
    if (/reusable/i.test(s) || ['cup', 'disc'].includes(category)) return price / 60; // 5 years

    // Per pair (underwear)
    if (/per pair|pair/i.test(s)) return price / 18;

    // "Free" only (no paid tier mentioned)
    if (/^free\s*$/i.test(s.replace(/\(.*\)/g, '').trim())) return 0;

    return null;
}

export default function MyEcosystem({ myProducts, onToggleProduct, trackedProducts, toggleTrackProduct, toggleOmitProduct, omittedProducts, onOpenProduct, onOpenDoctorPrep }) {
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('function'); // 'function' or 'integration'
    const [interactionSelection, setInteractionSelection] = useState(new Set()); // product ids for interaction check

    const myProductIds = Object.keys(myProducts);
    const myProductList = Object.values(myProducts);
    const { functionMap, duplicates } = useMemo(() => detectDuplicates(myProductIds, myProducts), [myProductIds, myProducts]);
    const ecosystemStartups = useMemo(() => myProductList.filter(p => !ALL_PRODUCTS.find(x => x.id === p.id)), [myProductList]);
    const duplicateCount = Object.keys(duplicates).length;

    const estimatedMonthlyTotal = useMemo(() => {
        let total = 0;
        let counted = 0;
        myProductList.forEach(p => {
            const priceStr = p.price || p.stage;
            const est = estimateMonthlyCost(priceStr, p);
            if (est != null && !Number.isNaN(est)) {
                total += est;
                counted += 1;
            }
        });
        return { total: Math.round(total * 100) / 100, counted, totalItems: myProductList.length };
    }, [myProductList]);

    const integrationMap = useMemo(() => {
        const map = {};
        myProductList.forEach(p => {
            const integrations = Array.isArray(p.integrations) ? p.integrations : (p.integrations ? [p.integrations] : ['No Integration']);
            integrations.forEach(int => {
                if (!map[int]) map[int] = [];
                map[int].push(p);
            });
        });
        return map;
    }, [myProductList]);

    const filteredProducts = useMemo(() => {
        return ALL_PRODUCTS.filter(p =>
            (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.category.toLowerCase().includes(searchTerm.toLowerCase())) &&
            !omittedProducts[p.id]
        );
    }, [searchTerm, omittedProducts]);

    const interactionProductList = useMemo(() => {
        return myProductList.filter(p => interactionSelection.has(p.id));
    }, [myProductList, interactionSelection]);
    const interactionResults = useMemo(() => getInteractions(interactionProductList), [interactionProductList]);
    const toggleInteractionSelect = (product) => {
        setInteractionSelection(prev => {
            const next = new Set(prev);
            if (next.has(product.id)) next.delete(product.id);
            else next.add(product.id);
            return next;
        });
    };

    return (
        <>
            <section className="container animate-fade-in-up" style={{ padding: 'var(--spacing-xl) var(--spacing-md)' }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)', maxWidth: '800px', margin: '0 auto var(--spacing-xl)' }}>
                    <div style={{
                        background: 'var(--color-secondary-fade)', color: 'var(--color-primary-hover)',
                        padding: '0.5rem 1rem', borderRadius: 'var(--radius-pill)', fontSize: '0.875rem',
                        fontWeight: '600', marginBottom: '1rem', display: 'inline-block'
                    }}>
                        Your Health Ecosystem
                    </div>
                    <h2 style={{ fontSize: '2.25rem', marginBottom: '0.75rem' }}>Everything You Use, One Place</h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>
                        Track all your health products and apps. Everything here is monitored for safety by default. We'll tell you what each does, if any overlap, and if products may interact.
                    </p>
                </div>

                {/* Summary Bar */}
                <div style={{
                    display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap',
                    marginBottom: 'var(--spacing-lg)'
                }}>
                    {myProductList.length > 0 && (
                        <div style={{ background: 'var(--color-surface-soft)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1rem 1.5rem', textAlign: 'center', minWidth: '140px' }}>
                            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-primary)' }}>
                                {estimatedMonthlyTotal.total > 0 ? `~$${estimatedMonthlyTotal.total.toFixed(0)}` : '—'}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Est. per month</div>
                            {estimatedMonthlyTotal.counted < estimatedMonthlyTotal.totalItems && (
                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                                    {estimatedMonthlyTotal.totalItems - estimatedMonthlyTotal.counted} item{estimatedMonthlyTotal.totalItems - estimatedMonthlyTotal.counted !== 1 ? 's' : ''} not priced
                                </div>
                            )}
                        </div>
                    )}
                    <div style={{ background: 'var(--color-surface-soft)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1rem 1.5rem', textAlign: 'center', minWidth: '140px' }}>
                        <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-primary)' }}>{myProductList.length}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Products Tracked</div>
                    </div>
                    <div style={{ background: 'var(--color-surface-soft)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1rem 1.5rem', textAlign: 'center', minWidth: '140px' }}>
                        <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-surface-contrast)' }}>{Object.keys(functionMap).length}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Health Functions</div>
                    </div>
                    <div style={{
                        background: duplicateCount > 0 ? '#F8F9FA' : 'var(--color-secondary-fade)',
                        border: `1px solid ${duplicateCount > 0 ? '#D1D5DB' : 'var(--color-border)'}`,
                        borderRadius: 'var(--radius-md)', padding: '1rem 1.5rem', textAlign: 'center', minWidth: '140px'
                    }}>
                        <div style={{ fontSize: '2rem', fontWeight: '700', color: duplicateCount > 0 ? 'var(--color-text-main)' : 'var(--color-text-main)' }}>{duplicateCount}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Overlaps Found</div>
                    </div>

                    <div style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1rem 1.5rem', textAlign: 'center', minWidth: '140px', cursor: 'pointer' }} onClick={onOpenDoctorPrep}>
                        <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>👩‍⚕️</div>
                        <div style={{ fontSize: '0.85rem', color: 'white', fontWeight: '700' }}>Doctor Prep</div>
                    </div>
                </div>

                {/* Safety & interactions: compare 2+ products */}
                {myProductList.length >= 2 && (
                    <div style={{ marginBottom: 'var(--spacing-xl)', maxWidth: '800px', margin: '0 auto var(--spacing-xl)' }}>
                        <h3 style={{ fontSize: '1.15rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            🛡️ Safety & interactions
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                            Select 2 or more products to check if they may interact or if they're safe to use together.
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                            {myProductList.map(p => {
                                const selected = interactionSelection.has(p.id);
                                return (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => toggleInteractionSelect(p)}
                                        style={{
                                            padding: '0.4rem 0.75rem',
                                            borderRadius: 'var(--radius-pill)',
                                            border: `2px solid ${selected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                            background: selected ? 'var(--color-secondary-fade)' : 'var(--color-surface-soft)',
                                            fontSize: '0.85rem',
                                            cursor: 'pointer',
                                            fontWeight: selected ? '600' : '500'
                                        }}
                                    >
                                        {selected ? '✓ ' : ''}{p.name}
                                    </button>
                                );
                            })}
                        </div>
                        {interactionProductList.length >= 2 && (
                            <div style={{ background: 'var(--color-surface-soft)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                                <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Comparing: {interactionProductList.map(p => p.name).join(', ')}</h4>
                                {interactionResults.length === 0 ? (
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                                        No known safety interactions found between these. This doesn't replace medical advice — discuss with your provider if unsure.
                                    </p>
                                ) : (
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                        {interactionResults.map((r, i) => (
                                            <li key={i} style={{
                                                marginBottom: '0.75rem',
                                                padding: '0.75rem',
                                                background: r.severity === 'high' ? '#FEF2F2' : r.severity === 'medium' ? '#FFFBEB' : 'white',
                                                borderLeft: `4px solid ${r.severity === 'high' ? '#DC2626' : r.severity === 'medium' ? '#F59E0B' : '#6B7280'}`,
                                                borderRadius: 'var(--radius-sm)',
                                                fontSize: '0.9rem'
                                            }}>
                                                <span style={{ fontWeight: '600', color: r.severity === 'high' ? '#B91C1C' : 'var(--color-text-main)' }}>
                                                    {r.severity === 'high' ? '⚠️ ' : r.severity === 'medium' ? '⚡ ' : 'ℹ️ '}
                                                    {r.productNames.join(' + ')}
                                                </span>
                                                <p style={{ margin: '0.35rem 0 0', color: 'var(--color-text-main)' }}>{r.message}</p>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}
                                    onClick={() => setInteractionSelection(new Set())}
                                >
                                    Clear selection
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>+ Add a Product or App</button>
                    <div style={{ background: 'var(--color-surface-soft)', padding: '0.25rem', borderRadius: 'var(--radius-pill)', border: '1px solid var(--color-border)', display: 'flex' }}>
                        <button
                            onClick={() => setViewMode('function')}
                            style={{
                                padding: '0.4rem 1rem', borderRadius: 'var(--radius-pill)', border: 'none', fontSize: '0.85rem', cursor: 'pointer',
                                background: viewMode === 'function' ? 'white' : 'transparent',
                                boxShadow: viewMode === 'function' ? 'var(--shadow-sm)' : 'none',
                                fontWeight: viewMode === 'function' ? '600' : '500'
                            }}
                        >By Function</button>
                        <button
                            onClick={() => setViewMode('integration')}
                            style={{
                                padding: '0.4rem 1rem', borderRadius: 'var(--radius-pill)', border: 'none', fontSize: '0.85rem', cursor: 'pointer',
                                background: viewMode === 'integration' ? 'white' : 'transparent',
                                boxShadow: viewMode === 'integration' ? 'var(--shadow-sm)' : 'none',
                                fontWeight: viewMode === 'integration' ? '600' : '500'
                            }}
                        >By Integration</button>
                    </div>
                </div>

                {myProductList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--color-surface-soft)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--color-border)' }}>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: 'var(--color-text-muted)' }}>Your ecosystem is empty.</h3>
                        <p style={{ color: 'var(--color-text-muted)' }}>Add the products and apps you currently use and we'll organize them for you.</p>
                    </div>
                ) : (
                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                        {viewMode === 'function' ? (
                            <>
                                {duplicateCount > 0 && (
                                    <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                        <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', color: 'var(--color-text-main)' }}>⚠️ Overlap Detected</h3>
                                        {Object.entries(duplicates).map(([fn, products]) => (
                                            <div key={fn} style={{
                                                background: '#F3F4F6', border: '1px solid #FFE082', borderRadius: 'var(--radius-md)',
                                                padding: '1.25rem', marginBottom: '0.75rem'
                                            }}>
                                                <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
                                                    {HEALTH_FUNCTIONS[fn]?.icon} {HEALTH_FUNCTIONS[fn]?.label}: {products.length} products doing the same thing
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                                                    {products.map(p => (
                                                        <span key={p.id} style={{ background: 'white', padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-pill)', fontSize: '0.85rem', fontWeight: '500' }}>
                                                            {p.name}
                                                        </span>
                                                    ))}
                                                </div>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                                    💡 You might not need all of these — consider consolidating to save money and simplify your routine.
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {Object.entries(functionMap).map(([fn, products]) => (
                                    <div key={fn} style={{ marginBottom: '1.75rem' }}>
                                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span>{HEALTH_FUNCTIONS[fn]?.icon}</span> {HEALTH_FUNCTIONS[fn]?.label}
                                            {duplicates[fn] && <span style={{ fontSize: '0.75rem', background: '#F8F9FA', color: 'var(--color-text-main)', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-pill)' }}>overlap</span>}
                                        </h3>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>{HEALTH_FUNCTIONS[fn]?.desc}</p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {products.map(product => (
                                                <div key={product.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', cursor: 'pointer' }} onClick={() => onOpenProduct(product)}>
                                                    <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', overflow: 'hidden', flexShrink: 0 }}>
                                                        <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    </div>
                                                    <div style={{ flexGrow: 1, minWidth: 0 }}>
                                                        <h4 style={{ fontSize: '0.95rem', marginBottom: '0.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>{product.name}{product.outOfBusiness && <span style={{ fontSize: '0.65rem', fontWeight: '600', color: 'var(--color-text-muted)', background: 'var(--color-surface-soft)', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-pill)' }}>No longer sold</span>}</h4>
                                                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{product.price}</span>
                                                    </div>
                                                    <span style={{
                                                        fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase',
                                                        padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-pill)',
                                                        background: product.type === 'physical' ? 'var(--color-surface-contrast)' : 'var(--color-primary)',
                                                        color: 'white'
                                                    }}>
                                                        {product.type}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {ecosystemStartups.length > 0 && (
                                    <div style={{ marginBottom: '1.75rem' }}>
                                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            🚀 Startups in your ecosystem
                                        </h3>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>Released products you added from our startup list.</p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {ecosystemStartups.map(product => (
                                                <div key={product.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', cursor: 'pointer' }} onClick={() => onOpenProduct(product)}>
                                                    <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', overflow: 'hidden', flexShrink: 0 }}>
                                                        <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    </div>
                                                    <div style={{ flexGrow: 1, minWidth: 0 }}>
                                                        <h4 style={{ fontSize: '0.95rem', marginBottom: '0.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>{product.name}{product.outOfBusiness && <span style={{ fontSize: '0.65rem', fontWeight: '600', color: 'var(--color-text-muted)', background: 'var(--color-surface-soft)', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-pill)' }}>No longer sold</span>}</h4>
                                                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{product.stage || product.tagline}</span>
                                                    </div>
                                                    <span style={{
                                                        fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase',
                                                        padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-pill)',
                                                        background: 'var(--color-primary-hover)', color: 'white'
                                                    }}>
                                                        Startup
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                {Object.entries(integrationMap).map(([int, products]) => (
                                    <div key={int}>
                                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: int === 'No Integration' ? 'var(--color-text-muted)' : 'var(--color-text-main)' }}>
                                            {int === 'No Integration' ? '📦 Standalone Products' : `✨ Syncs with ${int}`}
                                        </h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {products.map(product => (
                                                <div key={product.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', cursor: 'pointer' }} onClick={() => onOpenProduct(product)}>
                                                    <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', overflow: 'hidden', flexShrink: 0 }}>
                                                        <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    </div>
                                                    <div style={{ flexGrow: 1, minWidth: 0 }}>
                                                        <h4 style={{ fontSize: '0.95rem', marginBottom: '0.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>{product.name}{product.outOfBusiness && <span style={{ fontSize: '0.65rem', fontWeight: '600', color: 'var(--color-text-muted)', background: 'var(--color-surface-soft)', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-pill)' }}>No longer sold</span>}</h4>
                                                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{product.stage || product.category}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                                        {product.isStartup && (
                                                            <span style={{ fontSize: '0.65rem', background: 'var(--color-primary-hover)', color: 'white', padding: '0.15rem 0.4rem', borderRadius: 'var(--radius-pill)', fontWeight: '600' }}>Startup</span>
                                                        )}
                                                        {Array.isArray(product.integrations) ? product.integrations.map(i => (
                                                            <span key={i} style={{ fontSize: '0.65rem', background: 'var(--color-secondary)', color: 'var(--color-text-main)', padding: '0.15rem 0.4rem', borderRadius: 'var(--radius-pill)', fontWeight: '600' }}>{i}</span>
                                                        )) : product.integrations && (
                                                            <span style={{ fontSize: '0.65rem', background: 'var(--color-secondary)', color: 'var(--color-text-main)', padding: '0.15rem 0.4rem', borderRadius: 'var(--radius-pill)', fontWeight: '600' }}>{product.integrations}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </section>

            {showAddModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(43, 42, 41, 0.4)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, padding: '1rem'
                }} onClick={() => setShowAddModal(false)} className="animate-fade-in-up">
                    <div style={{
                        backgroundColor: 'var(--color-surface-soft)', borderRadius: 'var(--radius-lg)',
                        width: '100%', maxWidth: '560px', maxHeight: '80vh', overflowY: 'auto',
                        boxShadow: 'var(--shadow-lg)', padding: '2rem'
                    }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Add to Your Ecosystem</h3>
                        <input
                            type="text"
                            placeholder="Search by name or category..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%', padding: '0.75rem 1rem', fontSize: '1rem',
                                border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                                marginBottom: '1rem', fontFamily: 'var(--font-body)', outline: 'none'
                            }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {filteredProducts.map(product => {
                                const isAdded = !!myProducts[product.id];
                                return (
                                    <button
                                        key={product.id}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem',
                                            background: isAdded ? 'var(--color-secondary-fade)' : 'transparent',
                                            border: `1px solid ${isAdded ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                            borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'left', width: '100%'
                                        }}
                                        onClick={() => onToggleProduct(product)}
                                    >
                                        <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0 }}>
                                            <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                        <div style={{ flexGrow: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '0.9rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>{product.name}{product.outOfBusiness && <span style={{ fontSize: '0.65rem', fontWeight: '600', color: 'var(--color-text-muted)', background: 'var(--color-surface-soft)', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-pill)' }}>No longer sold</span>}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{product.category} · {product.type}</div>
                                        </div>
                                        <span style={{ fontSize: '0.8rem', fontWeight: '600', color: isAdded ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                                            {isAdded ? '✓ Added' : '+ Add'}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}


