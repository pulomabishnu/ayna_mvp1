import React from 'react';

export default function TrackedItems({ trackedProducts, joinedWaitlists, onViewWaitlist }) {
    const trackedList = Object.values(trackedProducts);
    const joinedList = Object.values(joinedWaitlists);
    const totalItems = trackedList.length + joinedList.length;

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
                                            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.15rem' }}>{product.name}</h4>
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
