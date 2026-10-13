import SmartSearchInput from './search/SmartSearchInput.jsx';
import React, { useState } from 'react';
import ProductTileImage, { ProductImageFallback } from './ProductTileImage';
import { InfoPage, InfoSection } from './InfoPage';

// EDITORIALLY CURATED HIGHLIGHTS, not a recall feed and not a complete list.
//
// This page previously presented these two hardcoded rows as the output of
// continuous multi-source monitoring ("Real-time monitoring", "scans the
// following sources daily: FDA · CPSC · EPA · Community Watch"). No code for
// CPSC, EPA or community scanning exists anywhere in the repo, and this
// component never called the live FDA endpoint at all, so searching for any
// product outside these two rows printed an affirmative "No alerts found",
// which is an all-clear the app had not earned.
//
// The live, per-product FDA check is /api/fda-recall, surfaced in ProductModal.
// The copy below now describes only what actually runs.
const CURATED_SAFETY_NOTES = [
    {
        id: 'recall-2',
        productName: 'Always Pads & Liners (PFAS Concerns)',
        date: 'Ongoing 2024',
        reason: 'Independent consumer testing found trace amounts of PFAS (forever chemicals) in various mainstream pads including Always. Class action lawsuits are pending.',
        action: 'Not an FDA recall. If concerned about PFAS, switch to organic cotton alternatives without plastic backsheets.',
        severity: 'high'
    },
    {
        id: 'recall-3',
        productName: 'U by Kotex Tampons',
        date: 'Recent Class Action',
        reason: 'Reports of tampons unraveling or pieces being left inside the body after removal.',
        action: 'If you experience unraveling, stop use and report to FDA MedWatch. Use alternatives if concerned.',
        severity: 'high'
    },
    // Additional recalls can be layered in here as needed.
];

export default function Recalls({ myProducts = {} }) {
    const ecosystemList = Object.values(myProducts);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredRecalls = CURATED_SAFETY_NOTES.filter(r =>
        r.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.reason.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <InfoPage
            className="ay-recalls"
            eyebrow="Safety"
            title="Safety and recall center"
            lede="Curated safety notes, plus a live FDA recall check on every product page. This is not a complete recall list, so always confirm with the FDA."
            width="wide"
        >
            <div className="ay-info-search">
                <label htmlFor="recalls-search" className="ay-info-label">Search the curated notes</label>
                <SmartSearchInput
                    id="recalls-search"
                    type="search"
                    placeholder="Brand or product, e.g. Always, Kotex"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="ay-info-split ay-info-split--main">
                <div>
                    <InfoSection title="Curated safety notes">
                        <div className="ay-info-stack ay-info-stack--tight">
                            {filteredRecalls.length === 0 ? (
                                // Deliberately NOT "No alerts found for X": this list is a
                                // handful of curated entries, so absence from it says nothing
                                // about whether a product has been recalled.
                                <p className="ay-info__body ay-info__muted">
                                    Nothing in ayna&apos;s curated notes matches &quot;{searchQuery}&quot;. This is not a recall search.
                                    Open the product to run a live FDA check, or{' '}
                                    <a
                                        className="ay-info-link"
                                        href="https://www.accessdata.fda.gov/scripts/enforcement/enforce_rpt-Product-Tabs.cfm"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        search the FDA enforcement database
                                    </a>.
                                </p>
                            ) : filteredRecalls.map(recall => (
                                <article key={recall.id} className={`ay-info-card ay-info-card--pad ay-info-note ay-info-note--${recall.severity}`}>
                                    <div className="ay-info-note__head">
                                        <h3 className="ay-info-card__title ay-info-note__title">
                                            {recall.productName}
                                            {recall.severity === 'critical' && (
                                                <span className="ay-info__pill ay-info-note__sev ay-info-note__sev--critical">Critical</span>
                                            )}
                                            {recall.severity === 'high' && (
                                                <span className="ay-info__pill ay-info-note__sev ay-info-note__sev--high">High</span>
                                            )}
                                        </h3>
                                        <span className="ay-info__pill">{recall.date}</span>
                                    </div>
                                    <p className="ay-info__body"><strong>Why:</strong> {recall.reason}</p>
                                    <p className="ay-info-note__action"><strong>What to do:</strong> {recall.action}</p>
                                </article>
                            ))}
                        </div>
                    </InfoSection>

                    <InfoSection
                        title="Your products"
                        intro="ayna checks the FDA recall database for a product when you open it. There is no background monitoring and no alerting."
                    >
                        {ecosystemList.length === 0 ? (
                            <p className="ay-info__body ay-info__muted">Add products to your ecosystem to see them here.</p>
                        ) : (
                            <ul className="ay-info-grid ay-info-grid--2 ay-recalls__mon">
                                {ecosystemList.map(p => (
                                    <li key={p.id} className="ay-info-card ay-info-product">
                                        <ProductTileImage
                                            product={p}
                                            alt=""
                                            imgStyle={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '50%' }}
                                            letterNode={(
                                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0, overflow: 'hidden' }}>
                                                    <ProductImageFallback compact />
                                                </div>
                                            )}
                                        />
                                        <div>
                                            <div className="ay-info-product__name">{p.name}</div>
                                            {/* Was a hardcoded green "MONITORED" badge that reflected
                                                no check of any kind. */}
                                            <div className="ay-info__small">Checked when you open it</div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </InfoSection>
                </div>

                <aside className="ay-info-stack ay-info-stack--tight">
                    <div className="ay-info-card ay-info-card--pad ay-info-card--peri">
                        <h2 className="ay-info__h3">What ayna actually checks</h2>
                        <p className="ay-info__body">When you open a product, ayna queries OpenFDA live for that product:</p>
                        {/* CPSC, EPA and "Community Watch" were listed here as daily-scanned
                            sources. None of them exist in the codebase. Only the datasets
                            actually queried by api/fda-recall.js are listed now. */}
                        <ul className="ay-info-list">
                            <li><strong>Device recalls and enforcement:</strong> cups, discs, tampons, pads and devices.</li>
                            <li><strong>Food enforcement:</strong> where supplement recalls are filed.</li>
                            <li><strong>Drug enforcement:</strong> drug-classified products.</li>
                        </ul>
                        <p className="ay-info__small">
                            If the FDA database can&apos;t be reached, ayna says so rather than showing an all-clear. Checks run on demand, not on a schedule.
                        </p>
                    </div>
                    <div className="ay-info-card ay-info-card--pad">
                        <span className="ay-info__pill">Coming soon</span>
                        <p className="ay-info__body">
                            <strong>Ingredient watchlist:</strong> get notified if a product in your ecosystem adds something on your sensitivity list.
                        </p>
                    </div>
                </aside>
            </div>
        </InfoPage>
    );
}
