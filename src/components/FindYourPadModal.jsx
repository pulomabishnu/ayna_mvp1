import React, { useState } from 'react';

const FLOW_OPTIONS = [
    { value: 'heavy', label: 'Heavy', desc: 'I need maximum absorbency' },
    { value: 'regular', label: 'Regular', desc: 'Standard flow' },
    { value: 'light', label: 'Light / Liners', desc: 'Light days or backup' },
];
const PREFERENCE_OPTIONS = [
    { value: 'organic', label: 'Organic', desc: 'Clean ingredients, fewer chemicals' },
    { value: 'mainstream', label: 'Mainstream', desc: 'Widely available brands' },
    { value: 'budget', label: 'Budget', desc: 'Affordable options' },
];
const OVERNIGHT_OPTIONS = [
    { value: 'yes', label: 'Yes', desc: 'I need overnight protection' },
    { value: 'no', label: 'No', desc: 'Daytime only' },
];

export default function FindYourPadModal({ onClose, onFind }) {
    const [step, setStep] = useState(1);
    const [flow, setFlow] = useState(null);
    const [preference, setPreference] = useState(null);
    const [overnight, setOvernight] = useState(null);

    const handleDone = () => {
        const opts = { query: 'pads', initialCategory: 'pad' };
        if (flow && flow !== 'all') opts.initialPadFlow = flow;
        if (preference && preference !== 'all') opts.initialPadPreference = preference;
        if (overnight === 'yes') opts.initialPadUseCase = 'overnight';
        onFind(opts);
        onClose();
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1100,
                padding: '1rem',
            }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                style={{
                    background: 'white',
                    borderRadius: 'var(--radius-xl)',
                    maxWidth: '420px',
                    width: '100%',
                    padding: '1.5rem',
                    boxShadow: 'var(--shadow-lg)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Find your pad</h3>
                    <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--color-text-muted)' }}>×</button>
                </div>

                {step === 1 && (
                    <>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>What's your typical flow?</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {FLOW_OPTIONS.map(o => (
                                <button
                                    key={o.value}
                                    type="button"
                                    onClick={() => { setFlow(o.value); setStep(2); }}
                                    style={{
                                        padding: '0.75rem 1rem',
                                        textAlign: 'left',
                                        borderRadius: 'var(--radius-md)',
                                        border: `2px solid ${flow === o.value ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                        background: flow === o.value ? 'var(--color-secondary-fade)' : 'transparent',
                                        cursor: 'pointer',
                                        fontSize: '0.95rem',
                                    }}
                                >
                                    <strong>{o.label}</strong> — {o.desc}
                                </button>
                            ))}
                        </div>
                    </>
                )}

                {step === 2 && (
                    <>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>What matters most to you?</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {PREFERENCE_OPTIONS.map(o => (
                                <button
                                    key={o.value}
                                    type="button"
                                    onClick={() => { setPreference(o.value); setStep(3); }}
                                    style={{
                                        padding: '0.75rem 1rem',
                                        textAlign: 'left',
                                        borderRadius: 'var(--radius-md)',
                                        border: `2px solid ${preference === o.value ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                        background: preference === o.value ? 'var(--color-secondary-fade)' : 'transparent',
                                        cursor: 'pointer',
                                        fontSize: '0.95rem',
                                    }}
                                >
                                    <strong>{o.label}</strong> — {o.desc}
                                </button>
                            ))}
                        </div>
                        <button type="button" onClick={() => setStep(1)} style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>← Back</button>
                    </>
                )}

                {step === 3 && (
                    <>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Do you need overnight protection?</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {OVERNIGHT_OPTIONS.map(o => (
                                <button
                                    key={o.value}
                                    type="button"
                                    onClick={() => setOvernight(o.value)}
                                    style={{
                                        padding: '0.75rem 1rem',
                                        textAlign: 'left',
                                        borderRadius: 'var(--radius-md)',
                                        border: `2px solid ${overnight === o.value ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                        background: overnight === o.value ? 'var(--color-secondary-fade)' : 'transparent',
                                        cursor: 'pointer',
                                        fontSize: '0.95rem',
                                    }}
                                >
                                    <strong>{o.label}</strong> — {o.desc}
                                </button>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                            <button type="button" onClick={() => setStep(2)} style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>← Back</button>
                            <button type="button" className="btn btn-primary" onClick={handleDone} style={{ marginLeft: 'auto' }}>
                                Find my pads →
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
