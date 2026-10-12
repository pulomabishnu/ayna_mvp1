import React from 'react';
import { findGlossaryTermInText } from '../data/glossary';
import { InfoPage } from './InfoPage';

// Common helpful digital services for screenings
const TELEHEALTH_SERVICES = [
    { name: 'Planned Parenthood Direct', focus: 'STI Care & Birth Control', benefit: 'Affordable, sliding-scale care via app.', url: 'https://ppd.plannedparenthood.org' },
    { name: 'Tia Clinic', focus: 'Integrative GYN Care', benefit: 'Holistic OB-GYN & mental health care.', url: 'https://asktia.com' },
    { name: 'Wisp', focus: 'Sexual Health & UTIs', benefit: 'Same-day medication for UTIs & BV.', url: 'https://hellowisp.com' }
];

// Guideline sources — every recommendation is backed by at least 3 sources
const GUIDELINE_LINKS = {
    sti: [
        { name: 'ACOG – STI screening', url: 'https://www.acog.org/womens-health/faqs/sexually-transmitted-infections' },
        { name: 'CDC – STI guidelines', url: 'https://www.cdc.gov/std/prevention/default.htm' },
        { name: 'USPSTF – STI screening', url: 'https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/chlamydia-and-gonorrhea-screening' }
    ],
    pap: [
        { name: 'ACOG – Cervical cancer screening', url: 'https://www.acog.org/womens-health/faqs/cervical-cancer-screening' },
        { name: 'CDC – Cervical cancer screening', url: 'https://www.cdc.gov/cancer/cervical/basic_info/screening.htm' },
        { name: 'USPSTF – Cervical cancer screening', url: 'https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/cervical-cancer-screening' }
    ],
    uti: [
        { name: 'CDC – Urinary tract infection', url: 'https://www.cdc.gov/antibiotic-use/uti.html' },
        { name: 'UpToDate – UTIs (patient info)', url: 'https://www.uptodate.com/contents/urinary-tract-infections-in-adults-beyond-the-basics' },
        { name: 'ACOG – Urinary tract health', url: 'https://www.acog.org/womens-health/faqs/urinary-tract-infections' }
    ],
    general: [
        { name: 'ACOG – Well-woman care', url: 'https://www.acog.org/wellwomanchart' },
        { name: 'CDC – Women’s health', url: 'https://www.cdc.gov/women/' },
        { name: 'USPSTF – Recommendations', url: 'https://www.uspreventiveservicestaskforce.org/uspstf/recommendations' }
    ]
};

export default function Screenings({ checkinData, onNavigate }) {
    if (!checkinData) {
        return (
            <InfoPage eyebrow="Health maintenance" title="Recommended screenings" width="read">
                <div className="ay-info-card ay-info-card--pad ay-info-empty">
                    <h2 className="ay-info__h3">No check-in yet</h2>
                    <p className="ay-info__body">
                        Do your <strong>Monthly Check-in</strong> to get screening and doctor visit tips based on your symptoms and history.
                    </p>
                </div>
            </InfoPage>
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
                links: [TELEHEALTH_SERVICES[0], ...GUIDELINE_LINKS.sti]
            });
        } else if (lastSTI === '6-12 months') {
            recommendations.push({
                type: 'STI Screening',
                urgency: 'medium',
                message: 'Due soon. It has been over 6 months since your last screening.',
                action: 'Consider scheduling an appointment soon',
                links: [TELEHEALTH_SERVICES[0], ...GUIDELINE_LINKS.sti]
            });
        }
    }

    // Pap Smear Logic
    if (lastPap === '3+ years ago' || lastPap === 'Never / Not sure') {
        recommendations.push({
            type: 'Pap Smear / Cervical Screening',
            urgency: 'high',
            message: 'Due now. Clinical guidelines recommend a Pap smear every 3 years for women ages 21-65.',
            action: 'Visit your OB-GYN in person for an exam',
            linkType: 'discovery',
            linkText: 'Find OB-GYN-friendly apps'
        });
    }

    // OBGYN / PCP Visit based on symptoms
    if (symptoms.includes('UTI')) {
        recommendations.push({
            type: 'Immediate UTI Care',
            urgency: 'high',
            message: 'A UTI can get worse fast. See a doctor today, or use a telehealth service to get antibiotics right away.',
            action: 'Visit Urgent Care, or use Wisp or Planned Parenthood Direct',
            links: [TELEHEALTH_SERVICES[2], TELEHEALTH_SERVICES[0], ...GUIDELINE_LINKS.uti],
            suggestedProduct: { name: 'AZO UTI Test Strips', desc: 'Confirm markers before your visit.' }
        });
    }

    const severeSymptoms = symptoms.filter(s => ['Increased cramps', 'Irregular timing', 'Skin irritation'].includes(s));
    if (severeSymptoms.length > 0 && !symptoms.includes('UTI')) {
        recommendations.push({
            type: 'Talk to Your OB-GYN or PCP',
            urgency: 'medium',
            message: `Based on your recent check-in symptoms. ${severeSymptoms.join(', ')}. It's a good idea to talk to a doctor. Catching unusual symptoms early helps.`,
            action: 'Book a visit with your primary care provider',
            links: [TELEHEALTH_SERVICES[1], ...GUIDELINE_LINKS.general]
        });
    }

    return (
        <InfoPage
            eyebrow="Health maintenance"
            title="Recommended screenings"
            lede="Care reminders based on your health data and recent check-ins."
            width="read"
        >
            <div className="ay-info-stack">
                {recommendations.length === 0 ? (
                    <div className="ay-info-card ay-info-card--pad ay-info-empty">
                        <h2 className="ay-info__h3">You're all up to date</h2>
                        <p className="ay-info__body">No screening reminders right now, based on your last check-in.</p>
                        <button type="button" className="ay-info-btn ay-info-btn--ghost" onClick={() => onNavigate?.('discovery')}>
                            Browse general wellness
                        </button>
                    </div>
                ) : (
                    recommendations.map((rec, i) => {
                        const isHigh = rec.urgency === 'high';
                        return (
                            <article key={i} className={`ay-info-card ay-info-card--pad ay-info-screen ay-info-screen--${isHigh ? 'high' : 'medium'}`}>
                                <div className="ay-info-screen__head">
                                    <h2 className="ay-info__h3" title={findGlossaryTermInText(rec.type) || undefined}>{rec.type}</h2>
                                    <span className="ay-info__pill ay-info-screen__badge">{isHigh ? 'High priority' : 'Recommended'}</span>
                                </div>

                                <p className="ay-info__body">{rec.message}</p>

                                <div className="ay-info-screen__action" title={findGlossaryTermInText(rec.action) || undefined}>
                                    {rec.action}
                                </div>

                                {rec.links && rec.links.length >= 3 && (
                                    <div>
                                        <div className="ay-info-label">More info and care options</div>
                                        <div className="ay-info-chip-row">
                                            {rec.links.map(link => (
                                                <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" className="ay-info-chip ay-info-chip--link">
                                                    {link.benefit ? `Visit ${link.name}` : link.name} <span aria-hidden="true">↗</span>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {rec.suggestedProduct && (
                                    <div className="ay-info-screen__tool">
                                        <div>
                                            <div className="ay-info-label">Try this at-home tool</div>
                                            <strong>{rec.suggestedProduct.name}</strong>
                                            <div className="ay-info__small">{rec.suggestedProduct.desc}</div>
                                        </div>
                                        <button type="button" className="ay-info-btn" onClick={() => onNavigate?.('discovery')}>
                                            Find in Shop
                                        </button>
                                    </div>
                                )}

                                {rec.linkType === 'discovery' && (
                                    <button type="button" className="ay-info-btn ay-info-btn--ghost" onClick={() => onNavigate?.('discovery')}>
                                        {rec.linkText} <span aria-hidden="true">→</span>
                                    </button>
                                )}
                            </article>
                        )
                    })
                )}
            </div>
        </InfoPage>
    );
}
