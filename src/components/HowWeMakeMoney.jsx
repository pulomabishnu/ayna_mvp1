import React from 'react';
import { InfoPage } from './InfoPage';

const SECTIONS = [
    {
        eyebrow: 'How a recommendation actually gets made',
        paragraphs: [
            'ayna can earn money in two ways when you buy a product: through a direct brand partnership or through a retailer affiliate program such as Amazon Associates. Neither relationship is used as a signal in your personalized recommendation score.',
            'Personalized recommendations are ranked from the product information and the health profile or preferences you choose to share. Commercial status, commission rate, and whether we have a direct relationship with the brand do not increase a product’s personalized match score or move it higher in your personalized recommendation order.',
            'If you choose to buy through an affiliate link, ayna may earn a commission at no additional cost to you. As an Amazon Associate, ayna earns from qualifying purchases.',
        ],
    },
    {
        eyebrow: 'What partnership means (and doesn’t mean)',
        paragraphs: [
            'Confirmed brand partners can be displayed higher in general Browse, which is the page where you freely explore the catalog. That is separate from personalized recommendation ranking.',
            'In Browse, the “ayna Favorite” label identifies products from confirmed partner brands. On a product page, the “ayna Partner” disclosure explains the commercial relationship. A product can still use an affiliate retailer link without being a brand partner; affiliate-only products do not receive partner Browse promotion.',
        ],
    },
    {
        eyebrow: 'How we choose partners',
        paragraphs: [
            'We review potential partners for fit with ayna’s audience, product quality, safety, transparency, and brand practices. A partnership does not turn a marketing claim into a medical fact, and we may change or end a partnership if new information changes our assessment.',
        ],
    },
    {
        eyebrow: 'No exclusivity in personalized recommendations',
        paragraphs: [
            'A direct partner does not get an exclusive right to a recommendation category. Partner and non-partner products can both appear in personalized results when they are relevant to the user.',
        ],
    },
    {
        eyebrow: 'Something feel off? Tell us.',
        paragraphs: [
            'If you are concerned about a product, affiliate disclosure, partner placement, or recommendation you received, contact us at puloma@aynahealth.co and we will review it.',
        ],
    },
];

export default function HowWeMakeMoney({ onBack }) {
    return (
        <InfoPage photos={['bag-tubes', 'pad-thread-art', 'sink-flatlay']} tone="rose"
            eyebrow="Transparency"
            title="How we make money"
            lede="Health-product recommendations and commercial relationships should be easy to tell apart. Here is how ayna handles both."
            onBack={onBack}
            width="read"
        >
            <div className="ay-info-card ay-info-card--pad ay-info-card--butter ay-info-summary">
                <h2 className="ay-info__h3">The bottom line</h2>
                <p className="ay-info__body">
                    Partnerships and affiliate links help support ayna. They can affect visibility in general Browse when clearly labeled, but they do not decide your personalized match score or recommendation order.
                </p>
            </div>

            {SECTIONS.map((section) => (
                <section key={section.eyebrow} className="ay-info__section ay-info__section--prose">
                    <h2 className="ay-info__h2 ay-info__h2--sm">{section.eyebrow}</h2>
                    {section.paragraphs.map((p, i) => (
                        <p key={i} className="ay-info__body">{p}</p>
                    ))}
                </section>
            ))}
        </InfoPage>
    );
}
