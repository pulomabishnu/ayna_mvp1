import React, { useState, useEffect, useMemo } from 'react';
import Disclaimer from './Disclaimer';
import { getCheckinRecommendations, CATEGORY_LABELS } from '../data/products';

export default function TrackedItems({ trackedProducts, joinedWaitlists, onViewWaitlist, userZipCode, onZipCodeChange, checkinData, quizResults, myProducts = {}, onOpenProduct, omittedProducts = {}, onViewOmitted }) {
    const trackedList = Object.values(trackedProducts);
    const joinedList = Object.values(joinedWaitlists);
    const totalItems = trackedList.length + joinedList.length;
    const [zipInput, setZipInput] = useState(userZipCode || '');
    useEffect(() => { setZipInput(userZipCode || ''); }, [userZipCode]);

    const checkinRecs = useMemo(
        () => (checkinData && (checkinData.focusAreas?.length > 0 || checkinData.howIsRoutine))
            ? getCheckinRecommendations(quizResults || {}, checkinData, [], [])
            : [],
        [checkinData, quizResults]
    );

    const handleSaveZip = () => {
        const z = zipInput.replace(/\D/g, '').slice(0, 5);
        setZipInput(z);
        onZipCodeChange?.(z);
    };

    return (
        <section className="container animate-fade-in-up" style={{ padding: 'var(--spacing-xl) var(--spacing-md)' }}>
            <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)', maxWidth: '800px', margin: '0 auto var(--spacing-xl)' }}>
                <div style={{
                    background: 'var(--color-secondary-fade)',
                    color: 'var(--color-primary-hover)',
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    marginBottom: '1rem',
                    display: 'inline-block'
                }}>
                    My Account
                </div>
                <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Your Dashboard</h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '1.25rem' }}>
                    Track your safety-monitored products and startup waitlists all in one place.
                </p>
                {/* Hidden products — prominent so users can find it */}
                {onViewOmitted && (
                    <div style={{ marginTop: '1.5rem' }}>
                        <button type="button" className="btn btn-outline" style={{ padding: '0.6rem 1.25rem', fontSize: '1rem', fontWeight: '600' }} onClick={onViewOmitted}>
                            🙈 View hidden products {Object.keys(omittedProducts).length > 0 && `(${Object.keys(omittedProducts).length})`}
                        </button>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Products you hid from recommendations — view or restore them anytime.</p>
                    </div>
                )}
            </div>

            {/* Profile: Zip code for nearby stores */}
            <div style={{ maxWidth: '800px', margin: '0 auto 3rem' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Profile</h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginBottom: '1rem' }}>
                    Add your zip code to see nearby store availability when viewing products (in-store and online stock is shown when we have data).
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        inputMode="numeric"
                        maxLength={5}
                        placeholder="ZIP code"
                        value={zipInput}
                        onChange={(e) => setZipInput(e.target.value.replace(/\D/g, '').slice(0, 5))}
                        style={{
                            width: '120px',
                            padding: '0.6rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            fontSize: '1rem',
                            outline: 'none'
                        }}
                    />
                    <button type="button" className="btn btn-primary" style={{ padding: '0.6rem 1.25rem' }} onClick={handleSaveZip}>
                        Save
                    </button>
                    {userZipCode && <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Saved: {userZipCode}</span>}
                </div>
                <Disclaimer compact style={{ marginTop: '1rem' }} />
            </div>

            {/* Recommendations from your check-in — always visible under account when check-in was done */}
            {checkinRecs.length > 0 && (
                <div style={{ maxWidth: '800px', margin: '0 auto 3rem' }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>📋</span> Recommendations from your check-in
                    </h3>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginBottom: '1rem' }}>
                        These match your latest check-in and, when you use them, your Period or Menopause Tracker. If you're not sure you completed a check-in, you can always see your latest recommendations here. Each product links to the same catalog on Search.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {checkinRecs.map(({ product, reason }) => {
                            const inEcosystem = myProducts && myProducts[product.id];
                            return (
                                <div
                                    key={product.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => onOpenProduct?.(product)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenProduct?.(product); } }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        padding: '1rem 1.25rem',
                                        background: 'var(--color-surface-soft)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-md)',
                                        cursor: onOpenProduct ? 'pointer' : 'default',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => onOpenProduct && (e.currentTarget.style.borderColor = 'var(--color-primary)', e.currentTarget.style.background = 'var(--color-secondary-fade)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)', e.currentTarget.style.background = 'var(--color-surface-soft)')}
                                >
                                    <div style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-md)', overflow: 'hidden', flexShrink: 0 }}>
                                        <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                    <div style={{ flexGrow: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                                            <h4 style={{ fontSize: '1rem', fontWeight: '600' }}>{product.name}</h4>
                                            {product.outOfBusiness && (
                                                <span style={{ fontSize: '0.65rem', fontWeight: '600', color: 'var(--color-text-muted)', background: 'var(--color-surface-soft)', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-pill)' }}>No longer sold</span>
                                            )}
                                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{CATEGORY_LABELS[product.category] || product.category}</span>
                                            {inEcosystem && (
                                                <span style={{ fontSize: '0.7rem', fontWeight: '600', color: 'var(--color-primary)', background: 'var(--color-secondary-fade)', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-pill)' }}>
                                                    In your ecosystem
                                                </span>
                                            )}
                                        </div>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>{reason}</p>
                                    </div>
                                    {onOpenProduct && <span style={{ flexShrink: 0, color: 'var(--color-primary)', fontSize: '0.9rem' }}>View →</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Hidden (omitted) products — also linked from header above */}
            <div style={{ maxWidth: '800px', margin: '0 auto 3rem' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>🙈</span> Hidden products
                    {Object.keys(omittedProducts).length > 0 && (
                        <span style={{ background: 'var(--color-secondary-fade)', color: 'var(--color-primary-hover)', padding: '0.1rem 0.6rem', borderRadius: 'var(--radius-pill)', fontSize: '0.75rem', fontWeight: '600' }}>{Object.keys(omittedProducts).length}</span>
                    )}
                </h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    Products you chose to hide won't appear in Search or Recommendations. You can view and restore them anytime.
                </p>
                {onViewOmitted && (
                    <button type="button" className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }} onClick={onViewOmitted}>
                        {Object.keys(omittedProducts).length > 0 ? `View hidden products (${Object.keys(omittedProducts).length})` : 'View hidden products'}
                    </button>
                )}
            </div>

            {totalItems === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--color-surface-soft)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--color-border)' }}>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--color-text-muted)' }}>Nothing tracked yet.</h3>
                    <p style={{ color: 'var(--color-text-muted)' }}>Take the quiz to get recommendations you can track, or join startup waitlists to save your spot.</p>
                </div>
            ) : (
                <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '3rem' }}>

                    {/* Safety Tracked Products */}
                    {trackedList.length > 0 && (
                        <div>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span>🔔</span> Safety Recall Monitoring
                                <span style={{ background: 'var(--color-secondary-fade)', color: 'var(--color-primary-hover)', padding: '0.1rem 0.6rem', borderRadius: 'var(--radius-pill)', fontSize: '0.75rem', fontWeight: '600' }}>{trackedList.length}</span>
                            </h3>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                                You'll receive immediate notifications if these products have safety issues or recalls.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {trackedList.map((product, idx) => (
                                    <div key={product.id} className={`card stagger-${idx + 1}`} style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', animation: 'fadeInUp 0.6s backwards' }}>
                                        <div style={{ width: '72px', height: '72px', borderRadius: 'var(--radius-md)', overflow: 'hidden', flexShrink: 0 }}>
                                            <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                        <div style={{ flexGrow: 1 }}>
                                            <span style={{ color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>Active Tracking</span>
                                            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                {product.name}
                                                {product.outOfBusiness && (
                                                    <span style={{ fontSize: '0.65rem', fontWeight: '600', color: 'var(--color-text-muted)', background: 'var(--color-surface-soft)', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-pill)' }}>No longer sold</span>
                                                )}
                                            </h4>
                                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{product.type}</p>
                                        </div>
                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: 'var(--color-primary)', borderRadius: '50%', marginRight: '6px' }}></span>
                                            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Safe</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Joined Waitlists */}
                    {joinedList.length > 0 && (
                        <div>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span>🚀</span> Waitlists Joined
                                <span style={{ background: 'var(--color-secondary-fade)', color: 'var(--color-primary-hover)', padding: '0.1rem 0.6rem', borderRadius: 'var(--radius-pill)', fontSize: '0.75rem', fontWeight: '600' }}>{joinedList.length}</span>
                            </h3>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                                You're on the list! You'll be notified when these products launch.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {joinedList.map((startup, idx) => (
                                    <div key={startup.id} className={`card stagger-${idx + 1}`} style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', animation: 'fadeInUp 0.6s backwards', borderLeft: '3px solid var(--color-primary)' }}>
                                        <div style={{ width: '72px', height: '72px', borderRadius: 'var(--radius-md)', overflow: 'hidden', flexShrink: 0 }}>
                                            <img src={startup.image} alt={startup.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                        <div style={{ flexGrow: 1 }}>
                                            <span style={{ color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>Early Access</span>
                                            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.15rem' }}>{startup.name}</h4>
                                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{startup.tagline}</p>
                                        </div>
                                        <button
                                            className="btn btn-outline"
                                            style={{ flexShrink: 0, padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                                            onClick={onViewWaitlist}
                                        >
                                            View
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            )}
        </section>
    );
}
