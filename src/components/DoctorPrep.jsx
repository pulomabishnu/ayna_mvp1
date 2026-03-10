import React from 'react';

export default function DoctorPrep({ cycleData = [], myProducts = {}, quizResults = {}, onBack }) {
    // Synthesize data for the doctor
    const recentSymptoms = (cycleData || []).slice(0, 5).reduce((acc, curr) => {
        if (curr && curr.symptoms) {
            curr.symptoms.forEach(s => acc.add(s));
        }
        return acc;
    }, new Set());

    const ecosystemStats = Object.values(myProducts || {}).length;
    const goal = quizResults?.frustration || 'General Wellness';
    const age = quizResults?.age || 'N/A';
    const sensitivities = quizResults?.sensitivities || 'None reported';

    return (
        <div className="container animate-fade-in" style={{ padding: 'var(--spacing-lg) var(--spacing-md)', maxWidth: '900px' }}>
            <button
                onClick={onBack}
                style={{
                    background: 'none', border: 'none', color: 'var(--color-primary)',
                    cursor: 'pointer', fontWeight: '600', marginBottom: '1rem',
                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}
            >
                ← Back to Ecosystem
            </button>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <div style={{ display: 'inline-block', padding: '0.4rem 1rem', background: 'var(--color-primary-fade)', color: 'var(--color-primary)', borderRadius: 'var(--radius-pill)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1rem' }}>
                    Clinical Advocacy Tool
                </div>
                <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Doctor Visit Prep</h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>We've synthesized your data into a clear summary for your OB-GYN or Primary Care provider.</p>
            </div>

            <div className="card" style={{ padding: '3rem', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '2.5rem', borderBottom: '2px solid var(--color-bg)', pb: '1.5rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '0.25rem', color: 'var(--color-primary)' }}>Ayana Health Summary</h1>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Generated on {new Date().toLocaleDateString()}</p>
                    </div>
                    <button className="btn btn-outline" onClick={() => window.print()}>🖨️ Print Summary</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
                    <div>
                        <h4 style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.05em' }}>Key Health Profile</h4>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <li><strong>Goal:</strong> {goal}</li>
                            <li><strong>Age:</strong> {age}</li>
                            <li><strong>Sensitivities:</strong> {sensitivities}</li>
                        </ul>
                    </div>
                    <div>
                        <h4 style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.05em' }}>Recent Cycle Data</h4>
                        <p style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                            Over the last 30 days, <strong>{Array.from(recentSymptoms).join(', ') || 'no major symptoms'}</strong> were recorded.
                            The most common flow intensity was <strong>{cycleData[0]?.flow || 'not yet logged'}</strong>.
                        </p>
                    </div>
                </div>

                <div style={{ marginBottom: '3rem' }}>
                    <h4 style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.05em' }}>Current Product Ecosystem ({ecosystemStats} items)</h4>
                    <div style={{ background: 'var(--color-bg)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-main)', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {Object.values(myProducts).map(p => (
                                <span key={p.id} style={{ background: 'white', border: '1px solid var(--color-border)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)' }}>{p.name}</span>
                            ))}
                        </p>
                        <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                            *Providing this list helps your doctor identify potential irritants or supplement interactions.
                        </p>
                    </div>
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '2rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem' }}>Suggested Questions for Your Provider:</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'var(--color-surface-soft)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                            <span style={{ fontSize: '1.2rem' }}>🙋‍♀️</span>
                            <p style={{ fontSize: '0.95rem' }}>"I've been tracking <strong>{Array.from(recentSymptoms)[0] || 'cycle symptoms'}</strong>. Is this typical for my profile?"</p>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'var(--color-surface-soft)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                            <span style={{ fontSize: '1.2rem' }}>💊</span>
                            <p style={{ fontSize: '0.95rem' }}>"I am currently using <strong>{Object.values(myProducts)[0]?.name || 'these products'}</strong>. Do you see any concerns with my current health goals?"</p>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                <p>⚠️ Ayna is an informational tool, not a medical device. Always verify clinical data with your licensed provider.</p>
            </div>
        </div>
    );
}
