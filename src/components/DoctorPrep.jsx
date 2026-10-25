import React from 'react';
import GlossaryTerm from './GlossaryTerm';
import AccountHead from './nav/AccountHead.jsx';
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

    // P1-12: one page in three numbered steps (what you told ayna, what you
    // use, what to ask), rows on the page instead of boxes inside boxes. Every
    // fact and sentence from before is still here; only the boxes went.
    const facts = [
        ['Medications and supplements', care.medicationStatus === 'No' ? 'None' : list(care.medications, care.medicationStatus ? care.medicationStatus : 'Not answered')],
        ['Allergies', care.allergyStatus === 'No' ? 'None' : list(care.allergies, care.allergyStatus || 'Not answered')],
        care.mustBe.length > 0 ? ['Products must be', care.mustBe.join(', ')] : null,
        ['Age', age],
        ['Symptoms and needs', list(care.symptoms)],
        ['Diagnoses (you shared)', list(care.diagnoses)],
        care.goals.length > 0 ? ['Goals', care.goals.join(', ')] : null,
    ].filter(Boolean);

    return (
        <div className="container ay-acct-page dp2 animate-fade-in">
            <div className="dp-noprint">
                <AccountHead title="Appointment prep" back={onBack ? { label: 'Your ecosystem', href: '/you/ecosystem', onClick: onBack } : null}>
                    <p>A one-page summary of what you told ayna and the products you use. Bring it to your <GlossaryTerm term="OB/GYN">OB-GYN</GlossaryTerm> or primary care visit.</p>
                </AccountHead>
            </div>

            <div className="dp-summary dp2-sheet">
                <div className="dp2-top">
                    <div>
                        <h2 className="dp2-title">ayna health summary</h2>
                        <p className="dp2-date">Generated on {new Date().toLocaleDateString()}</p>
                    </div>
                    <button className="btn btn-outline dp-noprint dp2-print" onClick={() => window.print()}>Print summary</button>
                </div>

                <section className="dp2-step" aria-labelledby="dp2-you">
                    <h3 id="dp2-you" className="dp2-h"><span className="dp2-n" aria-hidden="true">1</span>What you told ayna</h3>
                    <dl className="dp2-facts">
                        {facts.map(([k, v]) => <div key={k} className="dp2-fact"><dt>{k}</dt><dd>{v}</dd></div>)}
                        <div className="dp2-fact">
                            <dt>Check-in and notes</dt>
                            <dd>{checkinSummary || <>No check-ins yet.{onOpenCheckin && <> <button type="button" className="dp-link" onClick={onOpenCheckin}>Log how this month went</button></>}</>}</dd>
                        </div>
                    </dl>
                </section>

                <section className="dp2-step" aria-labelledby="dp2-products">
                    <h3 id="dp2-products" className="dp2-h"><span className="dp2-n" aria-hidden="true">2</span>Products I use ({ecosystemStats})</h3>
                    {shared.length > 0 && (
                        <div className="dp-shared" role="note">
                            <strong>Shared ingredients</strong>
                            <ul>{shared.map(([a, names]) => <li key={a}>{names.length} products contain {a}: {names.join(', ')}</li>)}</ul>
                        </div>
                    )}
                    <ul className="dp2-products">
                        {products.map(p => (
                            <li key={p.id}>
                                <strong>{p.name}</strong>
                                <span>
                                    {isService(p) ? <b>Care service</b> : <>
                                    <b>Main ingredients:</b>{' '}
                                    {p.ingredients || 'Not listed, check the product label or brand website for the full ingredient list.'}</>}
                                </span>
                            </li>
                        ))}
                    </ul>
                    <p className="dp2-note">
                        *Sharing this list helps your doctor spot things that might cause irritation or not mix well with other products you take.
                    </p>
                </section>

                <section className="dp2-step" aria-labelledby="dp2-ask">
                    <h3 id="dp2-ask" className="dp2-h"><span className="dp2-n" aria-hidden="true">3</span>Questions to ask</h3>
                    <ol className="dp2-questions">
                        {questions.map((q) => <li key={q}>“{q}”</li>)}
                    </ol>
                    {userChatMessages.length > 0 && (
                        <>
                            <p className="dp2-note">Based on what you shared with ayna</p>
                            <ul className="dp2-told">
                                {userChatMessages.slice(0, 5).map((text, i) => (
                                    <li key={i}>
                                        <p className="dp2-note">You told ayna:</p>
                                        <blockquote>{text.length > 120 ? text.slice(0, 120) + '…' : text}</blockquote>
                                        <p>You could ask your provider: "I shared this with my health app. Can we talk about whether it affects my care, or anything I should follow up on?"</p>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </section>
            </div>

            <p className="dp2-foot">ayna gives information only. It is not a medical device. Always check health facts with your doctor or nurse.</p>
        </div>
    );
}
