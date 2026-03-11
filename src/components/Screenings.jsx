import React from 'react';

// Common helpful digital services for screenings
const TELEHEALTH_SERVICES = [
    { name: 'Planned Parenthood Direct', focus: 'STI Care & Birth Control', benefit: 'Affordable, sliding-scale care via app.', url: 'https://ppd.plannedparenthood.org' },
    { name: 'Tia Clinic', focus: 'Integrative GYN Care', benefit: 'Holistic OB-GYN & mental health care.', url: 'https://asktia.com' },
    { name: 'Wisp', focus: 'Sexual Health & UTIs', benefit: 'Same-day medication for UTIs & BV.', url: 'https://hellowisp.com' }
];

export default function Screenings({ checkinData, onNavigate }) {
    if (!checkinData) {
        return (
            <section className="container animate-fade-in-up" style={{ padding: 'var(--spacing-xl) var(--spacing-md)', textAlign: 'center' }}>
                <span style={{
                    fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-primary)',
                    background: 'var(--color-secondary-fade)', padding: '0.3rem 0.8rem',
                    borderRadius: 'var(--radius-pill)', display: 'inline-block', marginBottom: '1rem'
                }}>
                    🩺 Health Maintenance
                </span>
                <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--color-surface-contrast)' }}>Recommended Screenings</h2>
                <div className="card" style={{ maxWidth: '600px', margin: '2rem auto', padding: '3rem 2rem' }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>No Check-in Data Found</h3>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', lineHeight: '1.6' }}>
                        Please complete your <strong>Monthly Check-in</strong> to receive personalized screening and doctor visit recommendations based on your symptoms and history.
                    </p>
                </div>
            </section>
        );
    }

    const isSexuallyActive = checkinData.sexuallyActive === 'Yes';
    const lastSTI = checkinData.lastSTI;
    const lastPap = checkinData.lastPap;
    const symptoms = checkinData.newSymptoms || [];

    const recommendations = [];

    // STI Screening Logic
    if (isSexuallyActive) {
        if (lastSTI === '1+ years ago' || lastSTI === 'Never') {
            recommendations.push({
                type: 'STI Screening',
                urgency: 'high',
                message: 'Due now. Since you are sexually active, an annual STI screening is recommended to ensure your sexual health.',
                action: 'Schedule with PCP, OBGYN, or Planned Parenthood',
                links: [TELEHEALTH_SERVICES[0]]
            });
        } else if (lastSTI === '6-12 months') {
            recommendations.push({
                type: 'STI Screening',
                urgency: 'medium',
                message: 'Due soon. It has been over 6 months since your last screening.',
                action: 'Consider scheduling an appointment soon',
                links: [TELEHEALTH_SERVICES[0]]
            });
        }
    }

    // Pap Smear Logic
    if (lastPap === '3+ years ago' || lastPap === 'Never / Not sure') {
        recommendations.push({
            type: 'Pap Smear / Cervical Screening',
            urgency: 'high',
            message: 'Due now. Clinical guidelines recommend a Pap smear every 3 years for women ages 21-65.',
            action: 'Visit your OB-GYN for an in-person exam',
            linkType: 'discovery',
            linkText: 'Find OB-GYN friendly apps'
        });
    }

    // OBGYN / PCP Visit based on symptoms
    if (symptoms.includes('UTI')) {
        recommendations.push({
            type: 'Immediate UTI Care',
            urgency: 'high',
            message: 'A UTI can worsen quickly. We recommend seeing a doctor today or using a telehealth service for immediate antibiotics.',
            action: 'Visit Urgent Care or use Wisp/PP Direct',
            links: [TELEHEALTH_SERVICES[2], TELEHEALTH_SERVICES[0]],
            suggestedProduct: { name: 'AZO UTI Test Strips', desc: 'Confirm markers before your visit.' }
        });
    }

    const severeSymptoms = symptoms.filter(s => ['Increased cramps', 'Irregular timing', 'Skin irritation'].includes(s));
    if (severeSymptoms.length > 0 && !symptoms.includes('UTI')) {
        recommendations.push({
            type: 'Clinical Consultation (OBGYN or PCP)',
            urgency: 'medium',
            message: `Recommended based on your recent check-in symptoms: ${severeSymptoms.join(', ')}. Monitoring abnormal symptoms with a provider helps catch issues early.`,
            action: 'Book a visit with your primary care provider',
            links: [TELEHEALTH_SERVICES[1]]
        });
    }

    return (
        <section className="container animate-fade-in-up" style={{ padding: 'var(--spacing-xl) var(--spacing-md)' }}>
            <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
                <span style={{
                    fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-primary)',
                    background: 'var(--color-secondary-fade)', padding: '0.3rem 0.8rem',
                    borderRadius: 'var(--radius-pill)', display: 'inline-block', marginBottom: '1rem'
                }}>
                    🩺 Health Maintenance
                </span>
                <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: '1rem', color: 'var(--color-surface-contrast)' }}>
                    Recommended Screenings
                </h1>
                <p style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)', maxWidth: '600px', margin: '0 auto' }}>
                    Your personalized preventive care timeline based on your health data and recent check-ins.
                </p>
            </div>

            <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {recommendations.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                        <h3 style={{ fontSize: '1.25rem', color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>You're all up to date!</h3>
                        <p style={{ color: 'var(--color-text-muted)' }}>We have no active screening recommendations at this time based on your reported check-in.</p>
                        <button className="btn btn-outline" style={{ marginTop: '1.5rem' }} onClick={() => onNavigate('discovery')}>
                            Browse General Wellness
                        </button>
                    </div>
                ) : (
                    recommendations.map((rec, i) => {
                        const isHigh = rec.urgency === 'high';
                        const isMedium = rec.urgency === 'medium';
                        const borderColor = isHigh ? '#D65A49' : (isMedium ? 'var(--color-primary)' : '#7C9885');
                        const badgeBg = isHigh ? '#FDECEC' : (isMedium ? 'var(--color-secondary-fade)' : '#F0F5F1');
                        const badgeColor = isHigh ? '#D65A49' : (isMedium ? 'var(--color-primary)' : '#496B54');

                        return (
                            <div key={i} className={`card stagger-${(i % 4) + 1}`} style={{
                                display: 'flex', flexDirection: 'column', gap: '1.25rem',
                                borderLeft: `6px solid ${borderColor}`,
                                padding: '2rem'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                    <h3 style={{ fontSize: '1.4rem', color: 'var(--color-surface-contrast)' }}>{rec.type}</h3>
                                    <span style={{
                                        fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em',
                                        background: badgeBg, color: badgeColor,
                                        padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-pill)'
                                    }}>
                                        {isHigh ? 'High Priority' : 'Recommended'}
                                    </span>
                                </div>

                                <p style={{ fontSize: '1.1rem', color: 'var(--color-text-main)', lineHeight: '1.6' }}>{rec.message}</p>

                                <div style={{
                                    background: '#F9FAF3', border: '1px solid #E5E7EB',
                                    padding: '1rem', borderRadius: 'var(--radius-md)',
                                    display: 'flex', alignItems: 'center', gap: '0.75rem'
                                }}>
                                    <span style={{ fontSize: '1.2rem' }}>👩‍⚕️</span>
                                    <span style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--color-text-main)' }}>
                                        {rec.action}
                                    </span>
                                </div>

                                {rec.links && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <p style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Suggested Direct Care:</p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                                            {rec.links.map(link => (
                                                <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer"
                                                    className="btn btn-outline" style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', borderStyle: 'dashed' }}>
                                                    Visit {link.name} ↗
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {rec.suggestedProduct && (
                                    <div style={{
                                        marginTop: '0.5rem', padding: '1rem',
                                        background: 'var(--color-secondary-fade)', borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--color-primary)'
                                    }}>
                                        <p style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-primary)', marginBottom: '0.4rem' }}>🛒 AT-HOME TOOL SUGGESTED</p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontWeight: '700', fontSize: '1rem' }}>{rec.suggestedProduct.name}</div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{rec.suggestedProduct.desc}</div>
                                            </div>
                                            <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }} onClick={() => onNavigate('discovery')}>
                                                Find in Discovery
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {rec.linkType === 'discovery' && (
                                    <button className="btn btn-outline" style={{ alignSelf: 'flex-start' }} onClick={() => onNavigate('discovery')}>
                                        {rec.linkText} →
                                    </button>
                                )}
                            </div>
                        )
                    })
                )}
            </div>

            <div style={{ marginTop: '4rem', textAlign: 'center', padding: '2rem', background: '#F4F5F7', borderRadius: 'var(--radius-lg)' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', maxWidth: '600px', margin: '0 auto' }}>
                    <strong>Disclaimer:</strong> Ayna does not provide medical diagnosis. Our recommendations use ACOG (including well-woman care at every life stage) and UpToDate when available as the baseline, plus CDC and other guidelines as appropriate. Please consult a healthcare professional for all medical concerns.
                </p>
            </div>
        </section>
    );
}
