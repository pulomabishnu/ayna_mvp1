import React from 'react';

export default function DoctorPrep({ checkinData = null, myProducts = {}, quizResults = {}, chatHistory = [], onBack }) {
    const ecosystemStats = Object.values(myProducts || {}).length;
    const goal = Array.isArray(quizResults?.frustrations) && quizResults.frustrations.length > 0
        ? quizResults.frustrations.join(', ')
        : (quizResults?.frustration || 'General Wellness');
    const age = quizResults?.age || 'N/A';
    const sensitivities = Array.isArray(quizResults?.sensitivities) && quizResults.sensitivities.length > 0
        ? quizResults.sensitivities.join(', ')
        : (quizResults?.sensitivities || 'None reported');
    const prefs = Array.isArray(quizResults?.preference) ? quizResults.preference.join(', ') : (quizResults?.preference || '');

    const focusAreas = checkinData?.focusAreas || [];
    const routineNote = checkinData?.howIsRoutine;
    const checkinSummary = focusAreas.length > 0
        ? `Recent focus: ${focusAreas.join(', ')}.`
        : (routineNote && routineNote !== 'Great — no changes'
            ? `Routine check-in: ${routineNote}.`
            : null);

    // User messages from chatbot (for suggested questions)
    const userChatMessages = (chatHistory || []).filter(m => m.role === 'user').map(m => (m.text || '').trim()).filter(Boolean);

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
                <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>We've synthesized your data into a clear summary for your OB-GYN or Primary Care provider. Our synthesis uses ACOG and UpToDate when available as the baseline.</p>
            </div>

            <div className="card" style={{ padding: '3rem', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '2.5rem', borderBottom: '2px solid var(--color-bg)', pb: '1.5rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '0.25rem', color: 'var(--color-primary)' }}>Ayna Health Summary</h1>
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
                            {prefs && <li><strong>Product priorities:</strong> {prefs}</li>}
                        </ul>
                    </div>
                    <div>
                        <h4 style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.05em' }}>Check-in &amp; notes</h4>
                        <p style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                            {checkinSummary || (
                                <>Complete a monthly check-in from your Profile to add short focus areas (e.g. flow, cramps, sleep) for your next visit.</>
                            )}
                        </p>
                    </div>
                </div>

                <div style={{ marginBottom: '3rem' }}>
                    <h4 style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.05em' }}>Current Product Ecosystem ({ecosystemStats} items)</h4>
                    <div style={{ background: 'var(--color-bg)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {Object.values(myProducts).map(p => (
                                <li key={p.id} style={{ background: 'white', border: '1px solid var(--color-border)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)' }}>
                                    <strong style={{ fontSize: '0.95rem', display: 'block', marginBottom: '0.35rem' }}>{p.name}</strong>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                        <strong style={{ color: 'var(--color-text-main)' }}>Active / main ingredients:</strong>{' '}
                                        {p.ingredients || p.tagline || '— See product label or brand for full ingredient list.'}
                                    </span>
                                </li>
                            ))}
                        </ul>
                        <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                            *Providing this list helps your doctor identify potential irritants or supplement interactions.
                        </p>
                    </div>
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '2rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem' }}>Suggested Questions for Your Provider</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'var(--color-surface-soft)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                            <span style={{ fontSize: '1.2rem' }}>🙋‍♀️</span>
                            <p style={{ fontSize: '0.95rem' }}>"I've shared my concerns with Ayna: <strong>{goal}</strong>. Is this a fit for my care plan?"</p>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'var(--color-surface-soft)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                            <span style={{ fontSize: '1.2rem' }}>💊</span>
                            <p style={{ fontSize: '0.95rem' }}>"I am currently using <strong>{Object.values(myProducts)[0]?.name || 'these products'}</strong>. Do you see any concerns with my current health goals?"</p>
                        </div>
                        {userChatMessages.length > 0 && (
                            <>
                                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginTop: '0.5rem', marginBottom: '0.25rem', letterSpacing: '0.05em' }}>Based on what you shared with Ayna</p>
                                {userChatMessages.slice(0, 5).map((text, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', background: 'var(--color-primary-fade)', padding: '1rem', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--color-primary)' }}>
                                        <span style={{ fontSize: '1.2rem' }}>💬</span>
                                        <div>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>You told Ayna: &quot;{text.length > 120 ? text.slice(0, 120) + '…' : text}&quot;</p>
                                            <p style={{ fontSize: '0.95rem', fontWeight: '500' }}>Consider asking your provider: &quot;I shared this with my health app — can we discuss whether it affects my care or anything I should follow up on?&quot;</p>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                <p>⚠️ Ayna is an informational tool, not a medical device. Always verify clinical data with your licensed provider.</p>
            </div>
        </div>
    );
}
