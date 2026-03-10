import React, { useState, useMemo } from 'react';
import { STARTUPS, getPersonalizedStartups } from '../data/startups';

export default function WaitlistHub({ joinedWaitlists, toggleJoinWaitlist, quizResults, isPremium, onUpgrade }) {
    const startups = useMemo(() => getPersonalizedStartups(quizResults), [quizResults]);
    const hasProfile = !!(quizResults?.frustrations?.length);

    const [filterCategory, setFilterCategory] = useState('all');
    const categories = ['all', ...new Set(STARTUPS.map(s => s.category))];

    const categoryLabels = {
        'all': 'All',
        'diagnostics': '🔬 Diagnostics',
        'hormone-monitoring': '🧬 Hormone Monitoring',
        'period-care': '🩸 Period Care',
        'telehealth': '🏥 Telehealth',
        'menopause': '🌸 Menopause',
        'fertility': '🤰 Fertility',
        'supplements': '💊 Supplements',
        'pelvic-health': '💪 Pelvic Health',
        'fitness': '🏃‍♀️ Fitness'
    };

    const filtered = filterCategory === 'all' ? startups : startups.filter(s => s.category === filterCategory);

    return (
        <section className="container animate-fade-in-up" style={{ padding: 'var(--spacing-xl) var(--spacing-md)' }}>
            <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto var(--spacing-lg)' }}>
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
                    {hasProfile ? '✨ Personalized for Your Profile' : 'Ayna Early Access'}
                </div>
                <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                    {hasProfile ? 'Startups Matched to You' : 'Tomorrow\'s Wellness, Today'}
                </h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '1.15rem', lineHeight: '1.7' }}>
                    {hasProfile
                        ? 'These startups are solving problems that match your health profile. Join their waitlists to get early access.'
                        : 'Get early access to women\'s health startups building the future of care. Take our quiz for personalized matches.'
                    }
                </p>
            </div>

            {/* Category Filters */}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: 'var(--spacing-lg)' }}>
                {categories.map(c => (
                    <button key={c} onClick={() => setFilterCategory(c)} style={{
                        padding: '0.4rem 1rem', borderRadius: 'var(--radius-pill)', fontSize: '0.8rem',
                        fontWeight: '500', border: '1px solid var(--color-border)',
                        background: filterCategory === c ? 'var(--color-primary)' : 'transparent',
                        color: filterCategory === c ? 'white' : 'var(--color-text-muted)',
                        cursor: 'pointer', transition: 'all 0.2s'
                    }}>
                        {categoryLabels[c] || c}
                    </button>
                ))}
            </div>

            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                {filtered.length} startup{filtered.length !== 1 ? 's' : ''} · {Object.keys(joinedWaitlists).length} joined
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'center' }}>
                {filtered.map((startup, idx) => {
                    const isJoined = !!joinedWaitlists[startup.id];
                    return (
                        <div key={startup.id} className="card hover-lift" style={{
                            padding: '1.5rem', maxWidth: '380px', flex: '1 1 320px',
                            border: isJoined ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                            animation: `fadeInUp 0.4s ${Math.min(idx * 0.05, 0.3)}s backwards`,
                            position: 'relative'
                        }}>
                            {isJoined && (
                                <span style={{
                                    position: 'absolute', top: '-0.5rem', right: '1rem',
                                    background: 'var(--color-primary)', color: 'white',
                                    padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-pill)',
                                    fontSize: '0.7rem', fontWeight: '600'
                                }}>✓ On Waitlist</span>
                            )}

                            <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                <div style={{ flexGrow: 1 }}>
                                    <span style={{
                                        fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase',
                                        color: 'var(--color-primary)', letterSpacing: '0.05em'
                                    }}>
                                        {categoryLabels[startup.category] || startup.category}
                                    </span>
                                    <h3 style={{ fontSize: '1.3rem', marginBottom: '0.15rem' }}>{startup.name}</h3>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--color-primary-hover)', fontWeight: '500' }}>{startup.tagline}</p>
                                </div>
                            </div>

                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1rem' }}>
                                {startup.description}
                            </p>

                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                                <span style={{ fontSize: '0.75rem', background: 'var(--color-bg)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-pill)' }}>
                                    {startup.stage}
                                </span>
                                <span style={{ fontSize: '0.75rem', background: 'var(--color-secondary-fade)', color: 'var(--color-text-main)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-pill)' }}>
                                    {startup.spotsLeft} spots left
                                </span>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <button
                                    className={`btn ${isJoined ? 'btn-outline' : 'btn-primary'}`}
                                    style={{
                                        flexGrow: 1,
                                        opacity: (!isPremium && !isJoined) ? 0.8 : 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem'
                                    }}
                                    onClick={() => {
                                        if (isPremium || isJoined) {
                                            toggleJoinWaitlist(startup);
                                        } else {
                                            onUpgrade();
                                        }
                                    }}
                                >
                                    {isJoined ? 'Leave Waitlist' : (
                                        <>
                                            {!isPremium && <span>🔒</span>}
                                            {isPremium ? '🔔 Join Waitlist' : 'Upgrade to Join'}
                                        </>
                                    )}
                                </button>
                                <a
                                    href={startup.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-outline"
                                    style={{ textDecoration: 'none', padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                                >
                                    Website ↗
                                </a>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
