import React, { useState } from 'react';

const MOCK_RECALLS = [
    {
        id: 'recall-1',
        productName: 'Boppy Lounger',
        date: 'Sept 2021',
        reason: 'Risk of infant suffocation.',
        action: 'Stop using immediately and contact Boppy for a refund.',
        severity: 'critical'
    },
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
    {
        id: 'recall-4',
        productName: 'Lush Fresh Face Masks',
        date: 'Jan 2024',
        reason: 'Potential bacterial contamination in specific batches.',
        action: 'Check batch number on bottom. Return for exchange.',
        severity: 'medium'
    }
];

export default function Recalls({ trackedProducts, isPremium, onUpgrade }) {
    const trackedList = Object.values(trackedProducts);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredRecalls = MOCK_RECALLS.filter(r =>
        r.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.reason.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="container animate-fade-in" style={{ padding: 'var(--spacing-lg) var(--spacing-md)' }}>
            <div style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Safety & Recall Center</h2>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>Real-time monitoring of FDA alerts and community-reported safety concerns.</p>

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
                        <span style={{ color: '#EF4444' }}>⚠️</span> Active Safety Alerts
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {filteredRecalls.length === 0 ? (
                            <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No alerts found for "{searchQuery}".</p>
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
                            {!isPremium && <span style={{ fontSize: '1rem' }}>🔒</span>}
                        </h3>

                        {!isPremium ? (
                            <div style={{
                                padding: '2rem',
                                border: '1px dashed var(--color-border)',
                                borderRadius: 'var(--radius-lg)',
                                textAlign: 'center',
                                background: 'linear-gradient(to bottom, rgba(255,255,255,0.5), white)'
                            }}>
                                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                                    Upgrade to <strong>Ayna Premium</strong> to actively monitor your specific ecosystem for safety recalls.
                                </p>
                                <button className="btn btn-primary" onClick={onUpgrade}>
                                    Activate Monitoring
                                </button>
                            </div>
                        ) : trackedList.length === 0 ? (
                            <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>You aren't monitoring any products for safety recalls yet.</p>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                {trackedList.map(p => (
                                    <div key={p.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)' }}>
                                        <img src={p.image} alt={p.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '50%' }} />
                                        <div>
                                            <h4 style={{ fontSize: '0.9rem', fontWeight: '600' }}>{p.name}</h4>
                                            <span style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: '700' }}>🟢 ACTIVE MONITORING</span>
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
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>🛡️ Safety Shield</h3>
                        <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                            Ayna's Safety Shield scans the following sources daily:
                        </p>
                        <ul style={{ paddingLeft: '1.2rem', fontSize: '0.9rem', color: 'var(--color-text-main)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <li><strong>FDA Enforcement Reports:</strong> Class I, II, and III recalls.</li>
                            <li><strong>CPSC Alerts:</strong> Consumer Product Safety Commission warnings.</li>
                            <li><strong>EPA Registers:</strong> Chemical safety and registration status.</li>
                            <li><strong>Community Watch:</strong> Aggregate sentiment from Reddit, Discord, and Amazon for sudden quality drops.</li>
                        </ul>
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
