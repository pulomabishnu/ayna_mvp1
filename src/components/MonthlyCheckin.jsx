import React, { useState } from 'react';

const CHECKIN_QUESTIONS = [
    {
        id: 'satisfaction',
        question: 'How are your current products working for you?',
        type: 'single',
        options: ['Great — no issues!', 'Okay, but could be better', 'Not solving my problems', 'I have new frustrations']
    },
    {
        id: 'newSymptoms',
        question: 'Any new symptoms or frustrations this month?',
        type: 'multi',
        options: ['None — all good!', 'Increased cramps', 'Heavier flow', 'Irregular timing', 'Skin irritation', 'UTI', 'Mood changes', 'Sleep issues']
    },
    {
        id: 'sexuallyActive',
        question: 'Are you currently sexually active?',
        type: 'single',
        options: ['Yes', 'No', 'Prefer not to answer']
    },
    {
        id: 'lastSTI',
        question: 'When was your last STI screening?',
        type: 'single',
        options: ['Within 6 months', '6-12 months', '1+ years ago', 'Never']
    },
    {
        id: 'lastPap',
        question: 'When was your last Pap smear?',
        type: 'single',
        options: ['Within 1 year', '1-3 years ago', '3+ years ago', 'Never / Not sure']
    },
    {
        id: 'productFeedback',
        question: 'Any specific product you want to replace?',
        type: 'single',
        options: ['No, I\'m happy with everything', 'Yes — my period product', 'Yes — a supplement', 'Yes — an app I\'m using', 'Yes — something else']
    }
];

export default function MonthlyCheckin({ onComplete, onClose }) {
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState({});
    const [multiSelections, setMultiSelections] = useState(new Set());
    const [isComplete, setIsComplete] = useState(false);

    const question = CHECKIN_QUESTIONS[step];
    const progress = ((step + 1) / CHECKIN_QUESTIONS.length) * 100;

    const handleSingle = (option) => {
        const newAnswers = { ...answers, [question.id]: option };
        setAnswers(newAnswers);
        if (step < CHECKIN_QUESTIONS.length - 1) {
            setTimeout(() => setStep(s => s + 1), 200);
        } else {
            setIsComplete(true);
            onComplete(newAnswers);
        }
    };

    const handleMultiToggle = (option) => {
        setMultiSelections(prev => {
            const next = new Set(prev);
            if (next.has(option)) next.delete(option);
            else next.add(option);
            return next;
        });
    };

    const handleMultiConfirm = () => {
        const selected = Array.from(multiSelections);
        const newAnswers = { ...answers, [question.id]: selected };
        setMultiSelections(new Set());
        setAnswers(newAnswers);
        if (step < CHECKIN_QUESTIONS.length - 1) {
            setTimeout(() => setStep(s => s + 1), 200);
        } else {
            setIsComplete(true);
            onComplete(newAnswers);
        }
    };

    // Provide feedback based on answers
    const getFeedback = () => {
        const satisfaction = answers.satisfaction;
        const symptoms = answers.newSymptoms || [];
        const replace = answers.productFeedback;

        if (satisfaction === 'Great — no issues!') {
            return {
                title: '🎉 Everything looks great!',
                message: 'Your current ecosystem is working well. We\'ll keep monitoring for safety recalls and new products that match your profile.',
                tip: null
            };
        }

        const tips = [];
        if (symptoms.includes('Increased cramps')) tips.push('💡 Consider adding Magnesium Glycinate — clinically shown to reduce cramps by 30-50%.');
        if (symptoms.includes('Heavier flow')) tips.push('💡 MegaFood Blood Builder can help replenish iron lost from heavy flow.');
        if (symptoms.includes('UTI')) tips.push('💡 Wisp Telehealth can get you same-day UTI treatment without an in-person visit.');
        if (symptoms.includes('Mood changes')) tips.push('💡 Ash AI Therapy ($10/mo) uses CBT techniques personalized to your patterns.');
        if (symptoms.includes('Sleep issues')) tips.push('💡 Magnesium Glycinate also helps with sleep quality — double benefit!');
        if (symptoms.includes('Irregular timing')) tips.push('💡 Consider Clue or Stardust for privacy-first cycle tracking to spot patterns.');

        if (replace?.includes('period product')) tips.push('💡 Take our quiz again to find better period products based on updated needs.');
        if (replace?.includes('app')) tips.push('💡 Check your Ecosystem page — we may have found overlap between your apps.');

        return {
            title: satisfaction === 'Not solving my problems' ? '⚡ Let\'s fix that' : '📋 Here\'s what we suggest',
            message: 'Based on your check-in, here are some things to try:',
            tip: tips.length > 0 ? tips : ['💡 Browse our Discovery page for new products that match your updated needs.']
        };
    };

    if (isComplete) {
        const feedback = getFeedback();
        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(43, 42, 41, 0.4)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1000, padding: '1rem'
            }} onClick={onClose}>
                <div className="card animate-fade-in-up" style={{ maxWidth: '560px', width: '100%', padding: '2rem' }} onClick={e => e.stopPropagation()}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>{feedback.title}</h2>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>{feedback.message}</p>
                    {feedback.tip && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            {feedback.tip.map((t, i) => (
                                <div key={i} style={{ background: 'var(--color-secondary-fade)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.9rem' }}>
                                    {t}
                                </div>
                            ))}
                        </div>
                    )}
                    <button className="btn btn-primary" onClick={onClose} style={{ width: '100%' }}>Done</button>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(43, 42, 41, 0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '1rem'
        }} onClick={onClose}>
            <div className="card animate-fade-in-up" style={{ maxWidth: '560px', width: '100%', padding: '2rem' }} onClick={e => e.stopPropagation()}>

                {/* Progress */}
                <div style={{ width: '100%', background: 'var(--color-border)', height: '4px', borderRadius: 'var(--radius-pill)', marginBottom: '0.75rem', overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: 'var(--color-primary)', transition: 'width 0.3s ease' }}></div>
                </div>
                <p style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                    {step + 1} of {CHECKIN_QUESTIONS.length} · ~1 min
                </p>

                <h2 style={{ fontSize: '1.35rem', marginBottom: '1.25rem', textAlign: 'center' }}>{question.question}</h2>

                {question.type === 'single' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {question.options.map((option, idx) => (
                            <button key={option} className="btn btn-outline" style={{
                                justifyContent: 'flex-start', padding: '0.85rem 1.25rem', fontSize: '0.95rem',
                                animation: `fadeInUp 0.4s ${idx * 0.05}s backwards`
                            }} onClick={() => handleSingle(option)}>
                                {option}
                            </button>
                        ))}
                    </div>
                )}

                {question.type === 'multi' && (
                    <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {question.options.map((option, idx) => {
                                const isSelected = multiSelections.has(option);
                                return (
                                    <button key={option} className="btn btn-outline" style={{
                                        justifyContent: 'flex-start', padding: '0.85rem 1.25rem', fontSize: '0.95rem',
                                        borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                                        backgroundColor: isSelected ? 'var(--color-secondary-fade)' : 'transparent',
                                        animation: `fadeInUp 0.4s ${idx * 0.05}s backwards`
                                    }} onClick={() => handleMultiToggle(option)}>
                                        <span style={{ marginRight: '0.5rem' }}>{isSelected ? '✓' : '○'}</span>
                                        {option}
                                    </button>
                                );
                            })}
                        </div>
                        <button className="btn btn-primary" style={{ marginTop: '1rem', width: '100%', opacity: multiSelections.size === 0 ? 0.5 : 1 }} disabled={multiSelections.size === 0} onClick={handleMultiConfirm}>
                            Continue →
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
