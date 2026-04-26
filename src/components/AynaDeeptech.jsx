import React, { useState } from 'react';

const deeptechProjects = [
    {
        id: 'dt-cloudpad',
        name: 'Project CloudPad',
        type: 'Material Science Innovation',
        focus: 'Menstrual Collection',
        description: 'A revolutionary cotton top sheet pad that leverages advanced micro-absorption technology. Designed to be remarkably thin—almost unnoticeable—while maintaining ultra-high absorbency for heavy flow days.',
        status: 'In Development',
        tags: ['Ultra-thin', 'High Absorbency', '100% Cotton Top']
    },
    {
        id: 'dt-odorzero',
        name: 'Project OdorZero',
        type: 'Biomaterial Innovation',
        focus: 'Menstrual Hygiene',
        description: 'The world\'s first menstrual pad actively engineered to prevent menstrual odor at the molecular level without the use of harsh chemical fragrances or masking agents. Utilizes proprietary bio-neutralizing mesh.',
        status: 'Prototypes Active',
        tags: ['Fragrance-Free', 'Odor Neutralizing', 'Bio-Mesh']
    },
    {
        id: 'dt-temperature',
        name: 'Project Flare',
        type: 'Wearable Patch',
        focus: 'Menopause & Cycle Tracking',
        description: 'A discreet, skin-safe biometric patch that continuously monitors basal body temperature. Integrates directly with Ayna to predict ovulation with 99% accuracy and detect early signs of menopause hot flashes.',
        status: 'Clinical Trials',
        tags: ['Wearable', 'Basal Body Temp', 'Continuous Monitoring']
    }
];

export default function AynaDeeptech({ joinedWaitlists, toggleJoinWaitlist }) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProjects = deeptechProjects.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <section className="container animate-fade-in-up" style={{ padding: 'var(--spacing-xl) var(--spacing-md)' }}>
            <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
                <span style={{
                    fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-primary)',
                    background: 'var(--color-secondary-fade)', padding: '0.3rem 0.8rem',
                    borderRadius: 'var(--radius-pill)', display: 'inline-block', marginBottom: '1rem'
                }}>
                    🔬 Inside The Lab
                </span>
                <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: '1rem', color: 'var(--color-surface-contrast)' }}>
                    Ayna Deeptech
                </h1>
                <p style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)', maxWidth: '600px', margin: '0 auto' }}>
                    We're not just recommending the best products on the market—we're actively building the future of women's health. Join the waitlists for our upcoming internal research and development projects.
                </p>
            </div>

            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
                <input
                    type="text"
                    placeholder="Search R&D projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%', maxWidth: '400px', padding: '0.8rem 1.2rem',
                        borderRadius: 'var(--radius-pill)', border: '1px solid var(--color-border)',
                        background: 'var(--color-surface-soft)', color: 'var(--color-text-main)',
                        fontFamily: 'var(--font-body)', fontSize: '0.95rem'
                    }}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {filteredProjects.map((project, index) => {
                    const isJoined = !!joinedWaitlists[project.id];

                    return (
                        <div key={project.id} className={`card hover-lift stagger-${(index % 4) + 1}`} style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                    <h3 style={{ fontSize: '1.25rem', color: 'var(--color-surface-contrast)' }}>{project.name}</h3>
                                    <span style={{ fontSize: '0.7rem', background: '#F8FAFC', color: 'var(--color-text-muted)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', fontWeight: '600' }}>
                                        {project.status}
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: '500', marginBottom: '0.75rem' }}>
                                    {project.type} • {project.focus}
                                </div>
                                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: '1.6', flexGrow: 1 }}>
                                    {project.description}
                                </p>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.5rem' }}>
                                {project.tags.map(tag => (
                                    <span key={tag} style={{ fontSize: '0.75rem', background: 'var(--color-secondary)', color: 'var(--color-text-main)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <button
                                onClick={() => toggleJoinWaitlist(project)}
                                style={{
                                    marginTop: 'auto', width: '100%', padding: '0.75rem',
                                    borderRadius: 'var(--radius-pill)', fontWeight: '600', fontSize: '0.9rem',
                                    transition: 'all 0.2s ease', cursor: 'pointer',
                                    background: isJoined ? '#F8FAFC' : 'var(--color-primary)',
                                    color: isJoined ? 'var(--color-text-main)' : '#FFFFFF',
                                    border: isJoined ? '1px solid var(--color-border)' : '1px solid transparent',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                }}
                            >
                                {isJoined ? '✓ Joined Waitlist' : 'Join Early Access Waitlist'}
                            </button>
                        </div>
                    );
                })}
            </div>

            {filteredProjects.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                    No projects found matching your search.
                </div>
            )}
        </section>
    );
}
