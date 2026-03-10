import React, { useState } from 'react';

const STEPS = [
    {
        id: 'age',
        question: "What's your age range?",
        type: 'single',
        options: ['18–22', '23–26', '27–34', '35–44', '45+']
    },
    {
        id: 'frustrations',
        question: "What's frustrating you most right now?",
        subtitle: 'Select all that apply',
        type: 'multi',
        options: ['Heavy flow', 'Painful cramps', 'Irregular cycles', 'Leaks & staining', 'General discomfort', 'Not sure if products are safe', 'Recurrent UTIs', 'PCOS symptoms']
    },
    {
        id: 'currentPhysical',
        question: "What physical products do you currently use?",
        subtitle: 'Select all that apply',
        type: 'multi',
        options: ['Pads', 'Tampons', 'Menstrual cup', 'Menstrual disc', 'Period underwear', 'Supplements', 'None / not sure']
    },
    {
        id: 'currentApps',
        question: "What apps or digital tools do you use for health?",
        subtitle: 'Select all that apply',
        type: 'multi',
        options: ['Flo', 'Apple Health', 'Garmin / Fitbit', 'Clue', 'Stardust', 'Telehealth (Wisp, Nurx)', 'AI tools (ChatGPT)', 'None']
    },
    {
        id: 'sensitivities',
        question: "Do you have any sensitivities?",
        subtitle: 'Select all that apply',
        type: 'multi',
        options: ['Fragrance sensitivity', 'Latex allergy', 'Synthetic materials', 'Other allergies', 'None that I know of']
    },
    {
        id: 'preference',
        question: "What matters most to you in a product?",
        type: 'single',
        options: ['Organic / clean ingredients', 'Lowest cost', 'Maximum comfort', 'Privacy & data security', 'Sustainability']
    },
    {
        id: 'internalComfort',
        question: "Are you comfortable with internal products?",
        subtitle: 'Like tampons, cups, or discs — there\'s no wrong answer',
        type: 'single',
        options: ['Yes', 'No', 'Open to trying']
    },
    {
        id: 'shopping',
        question: "Where do you usually shop?",
        subtitle: 'Select all that apply',
        type: 'multi',
        options: ['CVS / Walgreens', 'Target', 'Walmart', 'Amazon', 'Specialty / online only']
    },
    {
        id: 'budget',
        question: "What's your monthly budget for health & wellness products?",
        type: 'single',
        options: ['Under $20', '$20–$50', '$50–$100', '$100+']
    },
    {
        id: 'email',
        question: "Enter your email to save your recommendations",
        subtitle: "We'll never sell your data or send spam. Pinky promise.",
        type: 'email'
    }
];

export default function Quiz({ onComplete }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState({});
    const [multiSelections, setMultiSelections] = useState(new Set());
    const [emailValue, setEmailValue] = useState('');

    const step = STEPS[currentStep];
    const progress = ((currentStep + 1) / STEPS.length) * 100;

    const handleSingle = (option) => {
        const newAnswers = { ...answers, [step.id]: option };
        setAnswers(newAnswers);
        advance(newAnswers);
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
        const newAnswers = { ...answers, [step.id]: Array.from(multiSelections) };
        setMultiSelections(new Set());
        setAnswers(newAnswers);
        advance(newAnswers);
    };

    const handleEmailSubmit = () => {
        if (!emailValue.trim()) return;
        const newAnswers = { ...answers, email: emailValue.trim() };
        setAnswers(newAnswers);
        onComplete(newAnswers);
    };

    const advance = (newAnswers) => {
        if (currentStep < STEPS.length - 1) {
            setTimeout(() => setCurrentStep(prev => prev + 1), 250);
        } else {
            setTimeout(() => onComplete(newAnswers), 250);
        }
    };

    return (
        <section className="container animate-fade-in-up" style={{ padding: 'var(--spacing-xl) var(--spacing-md)', maxWidth: '800px' }}>

            {/* Progress Bar */}
            <div style={{ width: '100%', background: 'var(--color-border)', height: '6px', borderRadius: 'var(--radius-pill)', marginBottom: '1rem', overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: 'var(--color-primary)', transition: 'width 0.4s ease' }}></div>
            </div>
            <p style={{ textAlign: 'right', fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-lg)' }}>
                {currentStep + 1} of {STEPS.length}
            </p>

            <div className="card" style={{ minHeight: '420px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', textAlign: 'center' }}>
                    {step.question}
                </h2>
                {step.subtitle && (
                    <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-lg)', fontSize: '1rem' }}>
                        {step.subtitle}
                    </p>
                )}

                {/* SINGLE SELECT */}
                {step.type === 'single' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {step.options.map((option, idx) => {
                            const isSelected = answers[step.id] === option;
                            return (
                                <button
                                    key={option}
                                    className="btn btn-outline"
                                    style={{
                                        justifyContent: 'flex-start',
                                        padding: '1rem 1.5rem',
                                        fontSize: '1.05rem',
                                        borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                                        backgroundColor: isSelected ? 'var(--color-secondary-fade)' : 'transparent',
                                        animation: `fadeInUp 0.5s ${idx * 0.06}s backwards`
                                    }}
                                    onClick={() => handleSingle(option)}
                                >
                                    {option}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* MULTI SELECT */}
                {step.type === 'multi' && (
                    <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {step.options.map((option, idx) => {
                                const isSelected = multiSelections.has(option);
                                return (
                                    <button
                                        key={option}
                                        className="btn btn-outline"
                                        style={{
                                            justifyContent: 'flex-start',
                                            padding: '1rem 1.5rem',
                                            fontSize: '1.05rem',
                                            borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                                            backgroundColor: isSelected ? 'var(--color-secondary-fade)' : 'transparent',
                                            animation: `fadeInUp 0.5s ${idx * 0.06}s backwards`
                                        }}
                                        onClick={() => handleMultiToggle(option)}
                                    >
                                        <span style={{ marginRight: '0.75rem', fontSize: '1.1rem' }}>{isSelected ? '✓' : '○'}</span>
                                        {option}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            className="btn btn-primary"
                            style={{ marginTop: '1.5rem', alignSelf: 'center', opacity: multiSelections.size === 0 ? 0.5 : 1 }}
                            disabled={multiSelections.size === 0}
                            onClick={handleMultiConfirm}
                        >
                            Continue →
                        </button>
                    </>
                )}

                {/* EMAIL INPUT */}
                {step.type === 'email' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px', margin: '0 auto', width: '100%' }}>
                        <input
                            type="email"
                            placeholder="your@email.com"
                            value={emailValue}
                            onChange={e => setEmailValue(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleEmailSubmit()}
                            style={{
                                padding: '1rem',
                                fontSize: '1.1rem',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-md)',
                                outline: 'none',
                                fontFamily: 'var(--font-body)',
                                transition: 'border-color 0.2s',
                            }}
                            onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                            onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                        />
                        <button
                            className="btn btn-primary"
                            style={{ fontSize: '1.1rem' }}
                            onClick={handleEmailSubmit}
                        >
                            Get My Recommendations
                        </button>
                        <button
                            style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', textDecoration: 'underline' }}
                            onClick={() => onComplete({ ...answers, email: '' })}
                        >
                            Skip — show recommendations without saving
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
