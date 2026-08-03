import React, { useState } from 'react';

// EDITORIALLY CURATED HIGHLIGHTS — not a recall feed and not a complete list.
//
// This page previously presented these two hardcoded rows as the output of
// continuous multi-source monitoring ("Real-time monitoring", "scans the
// following sources daily: FDA · CPSC · EPA · Community Watch"). No code for
// CPSC, EPA or community scanning exists anywhere in the repo, and this
// component never called the live FDA endpoint at all — so searching for any
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

export default function Recalls({ trackedProducts, myProducts = {} }) {
    const trackedList = Object.values(trackedProducts);
    const ecosystemList = Object.values(myProducts);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredRecalls = CURATED_SAFETY_NOTES.filter(r =>
        r.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.reason.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="container animate-fade-in" style={{ padding: 'var(--spacing-lg) var(--spacing-md)' }}>
            <div style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Safety & Recall Center</h2>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                    Editorially curated safety notes, plus a live FDA recall check on every product page.
                    This page is not a complete recall list — always confirm against the FDA database directly.
                </p>

                <input
                    type="text"
                    placeholder="Search for a brand or product (e.g., Always, Kotex)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        width: '100%', maxWidth: '600px', padding: '1rem',
                        borderRadius: 'var(--radius-pill)', border: '1px solid var(--color-border)',
                        fontSize: '1rem', outline: 'none'
                    }}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '3rem' }}>
                {/* Active Alerts */}
                <div>
                    <h3 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: '#EF4444' }}>⚠️</span> Curated Safety Notes
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {filteredRecalls.length === 0 ? (
                            // Deliberately NOT "No alerts found for X" — this list is a
                            // handful of curated entries, so absence from it says nothing
                            // about whether a product has been recalled.
                            <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                                Nothing in Ayna&apos;s curated notes matches &quot;{searchQuery}&quot;. This is not a recall search —
                                open the product to run a live FDA check, or{' '}
                                <a
                                    href="https://www.accessdata.fda.gov/scripts/enforcement/enforce_rpt-Product-Tabs.cfm"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}
                                >
                                    search the FDA enforcement database
                                </a>.
                            </p>
                        ) : filteredRecalls.map(recall => (
                            <div key={recall.id} style={{
                                padding: '1.5rem',
                                background: recall.severity === 'critical' ? '#FEF2F2' : 'var(--color-surface)',
                                border: `1px solid ${recall.severity === 'critical' ? '#FEE2E2' : 'var(--color-border)'}`,
                                borderRadius: 'var(--radius-md)',
                                borderLeft: `5px solid ${recall.severity === 'critical' ? '#EF4444' : (recall.severity === 'high' ? '#F59E0B' : '#FCD34D')}`
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <h4 style={{ fontWeight: '700', fontSize: '1.1rem' }}>{recall.productName}</h4>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{recall.date}</span>
                                </div>
                                <p style={{ fontSize: '0.95rem', marginBottom: '1rem', color: recall.severity === 'critical' ? '#991B1B' : 'var(--color-text-main)' }}>
                                    <strong>Reason:</strong> {recall.reason}
                                </p>
                                <div style={{ background: 'rgba(255,255,255,0.5)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem' }}>
                                    <strong>Required Action:</strong> {recall.action}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '3rem', position: 'relative' }}>
                        <h3 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            Your Monitored Products
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                            Ayna checks the FDA recall database for a product when you open it. There is no
                            background monitoring and no alerting — open a product to run its check.
                        </p>

                        {ecosystemList.length === 0 ? (
                            <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Add products to your Ecosystem to monitor them for safety recalls.</p>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                {ecosystemList.map(p => (
                                    <div key={p.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)' }}>
                                        <img src={p.image} alt={p.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '50%' }} />
                                        <div>
                                            <h4 style={{ fontSize: '0.9rem', fontWeight: '600' }}>{p.name}</h4>
                                            {/* Was a hardcoded green "MONITORED" badge that reflected
                                                no check of any kind. */}
                                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Checked on open</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Safety Insights */}
                <div>
                    <div className="card" style={{ background: 'var(--color-surface-soft)', border: 'none' }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>🛡️ What Ayna actually checks</h3>
                        <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                            When you open a product, Ayna queries OpenFDA live for that specific product:
                        </p>
                        {/* CPSC, EPA and "Community Watch" were listed here as daily-scanned
                            sources. None of them exist in the codebase. Only the datasets
                            actually queried by api/fda-recall.js are listed now. */}
                        <ul style={{ paddingLeft: '1.2rem', fontSize: '0.9rem', color: 'var(--color-text-main)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <li><strong>FDA device recalls &amp; enforcement:</strong> for cups, discs, tampons, pads and devices.</li>
                            <li><strong>FDA food enforcement:</strong> where dietary supplement recalls are filed.</li>
                            <li><strong>FDA drug enforcement:</strong> for drug-classified products.</li>
                        </ul>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: '1.6', marginTop: '1rem' }}>
                            If the FDA database can&apos;t be reached, Ayna says so rather than showing an all-clear.
                            Checks run on demand, not on a schedule.
                        </p>
                    </div>

                    <div style={{ marginTop: '2rem', padding: '1.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '1rem', color: 'var(--color-primary)' }}>Coming Soon</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                            <strong>Ingredient Watchlist:</strong> Automatically get notified if a product in your ecosystem updates its ingredients to include something on your sensitivity list.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
