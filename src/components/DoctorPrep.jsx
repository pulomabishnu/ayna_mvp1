import React from 'react';
import GlossaryTerm from './GlossaryTerm';
import { getCareProfile } from '../utils/careProfile';
import { findSharedActives, isService } from '../utils/sharedActives';

export default function DoctorPrep({ checkinData = null, myProducts = {}, quizResults = {}, chatHistory = [], onBack, onOpenCheckin = null }) {
    const products = Object.values(myProducts || {}).filter(Boolean);
    const ecosystemStats = products.length;
    const care = getCareProfile(quizResults);
    const age = care.age || 'Not given';
    const list = (xs, none = 'None reported') => (xs.length ? xs.join(', ') : none);
    // Two or more products sharing an active ingredient (e.g. two with chasteberry).
    const shared = findSharedActives(products);
    // Questions drawn from what she told us, not generic.
    const questions = [
        ...care.symptoms.slice(0, 2).map((s) => `What could be behind my ${s.toLowerCase()}, and is anything worth checking?`),
        care.diagnoses[0] ? `Is my current plan for ${care.diagnoses[0]} still the right one, or should we look at other options?` : null,
        care.medications.length ? 'Do any of the products below interact with what I already take?' : 'Do you see any concerns with the products I use?',
    ].filter(Boolean).slice(0, 3);

    const focusAreas = checkinData?.focusAreas || [];
    const routineNote = checkinData?.howIsRoutine;
    const checkinSummary = focusAreas.length > 0
        ? `Recent focus: ${focusAreas.join(', ')}.`
        : (routineNote && routineNote !== 'Great. No changes'
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
            <div className="ay3-pagehead ay3-band ay3-band--rose ay3-torn ay3-edge-bottom" style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <div style={{ display: 'inline-block', padding: '0.4rem 1rem', background: 'var(--color-primary-fade)', color: 'var(--color-primary)', borderRadius: 'var(--radius-pill)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1rem' }}>
                    Appointment Prep Tool
                </div>
                <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Get ready for your <em>appointment.</em></h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>A one-page summary of what you told ayna and the products you use. Bring it to your <GlossaryTerm term="OB/GYN">OB-GYN</GlossaryTerm> or primary care visit.</p>
            </div>

            <div className="card dp-summary" style={{ padding: '3rem', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '2.5rem', borderBottom: '2px solid var(--color-bg)', pb: '1.5rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '0.25rem', color: 'var(--color-primary)' }}>ayna Health Summary</h1>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Generated on {new Date().toLocaleDateString()}</p>
                    </div>
                    <button className="btn btn-outline dp-noprint" onClick={() => window.print()}>Print summary</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
                    <div>
                        <h4 className="dp-h">Medications and supplements</h4>
                        <p className="dp-v">{care.medicationStatus === 'No' ? 'None' : list(care.medications, care.medicationStatus ? care.medicationStatus : 'Not answered')}</p>
                        <h4 className="dp-h">Allergies</h4>
                        <p className="dp-v">{care.allergyStatus === 'No' ? 'None' : list(care.allergies, care.allergyStatus || 'Not answered')}</p>
                        {care.mustBe.length > 0 && <><h4 className="dp-h">Products must be</h4><p className="dp-v">{care.mustBe.join(', ')}</p></>}
                        <h4 className="dp-h">Age</h4>
                        <p className="dp-v">{age}</p>
                    </div>
                    <div>
                        <h4 className="dp-h">Symptoms and needs</h4>
                        <p className="dp-v">{list(care.symptoms)}</p>
                        <h4 className="dp-h">Diagnoses (you shared)</h4>
                        <p className="dp-v">{list(care.diagnoses)}</p>
                        {care.goals.length > 0 && <><h4 className="dp-h">Goals</h4><p className="dp-v">{care.goals.join(', ')}</p></>}
                        <h4 className="dp-h">Check-in and notes</h4>
                        {checkinSummary ? <p className="dp-v">{checkinSummary}</p> : (
                            <p className="dp-v">No check-ins yet.{onOpenCheckin && <> <button type="button" className="dp-link" onClick={onOpenCheckin}>Log how this month went</button></>}</p>
                        )}
                    </div>
                </div>

                <div style={{ marginBottom: '3rem' }}>
                    <h4 style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.05em' }}>Products I use ({ecosystemStats})</h4>
                    <div style={{ background: 'var(--color-bg)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {products.map(p => (
                                <li key={p.id} style={{ background: 'white', border: '1px solid var(--color-border)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)' }}>
                                    <strong style={{ fontSize: '0.95rem', display: 'block', marginBottom: '0.35rem' }}>{p.name}</strong>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                        {isService(p) ? <strong style={{ color: 'var(--color-text-main)' }}>Care service</strong> : <>
                                        <strong style={{ color: 'var(--color-text-main)' }}>Main ingredients:</strong>{' '}
                                        {p.ingredients || 'Not listed, check the product label or brand website for the full ingredient list.'}</>}
                                    </span>
                                </li>
                            ))}
                        </ul>
                        {shared.length > 0 && (
                            <div className="dp-shared" role="note">
                                <strong>Shared ingredients</strong>
                                <ul>{shared.map(([a, names]) => <li key={a}>{names.length} products contain {a}: {names.join(', ')}</li>)}</ul>
                            </div>
                        )}
                        <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                            *Sharing this list helps your doctor spot things that might cause irritation or not mix well with other products you take.
                        </p>
                    </div>
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '2rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem' }}>Questions to ask</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {questions.map((q) => (
                            <div key={q} style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'var(--color-surface-soft)', padding: '1rem', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--color-primary)' }}>
                                <p style={{ fontSize: '0.95rem' }}>“{q}”</p>
                            </div>
                        ))}
                        {userChatMessages.length > 0 && (
                            <>
                                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', marginBottom: '0.25rem' }}>Based on what you shared with ayna</p>
                                {userChatMessages.slice(0, 5).map((text, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', background: 'var(--color-primary-fade)', padding: '1rem', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--color-primary)' }}>
                                        <div>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>You told ayna:</p>
                                            <blockquote style={{ margin: '0 0 0.5rem', paddingLeft: '0.75rem', borderLeft: '3px solid var(--color-primary)', fontSize: '0.9rem', color: 'var(--color-text-main)' }}>{text.length > 120 ? text.slice(0, 120) + '…' : text}</blockquote>
                                            <p style={{ fontSize: '0.95rem', fontWeight: '500' }}>You could ask your provider: "I shared this with my health app. Can we talk about whether it affects my care, or anything I should follow up on?"</p>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                <p>ayna gives information only. It is not a medical device. Always check health facts with your doctor or nurse.</p>
            </div>
        </div>
    );
}
