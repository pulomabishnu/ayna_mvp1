import React from 'react';

const DONATION_ORGS = [
  {
    name: 'PERIOD.',
    url: 'https://period.org/product-donation',
    desc: 'Donate via their RightGift registry or host a product drive. Products go to chapters and youth-led organizations.',
  },
  {
    name: 'The Period Project',
    url: 'https://periodproject.org',
    desc: 'South Carolina–based. Accepts in-kind product donations; $20 provides one month of supplies for someone in need.',
  },
  {
    name: 'The Period Pantry Project',
    url: 'https://www.theperiodpantryproject.org',
    desc: 'Franklin County, Ohio. Accepts sealed pads, tampons, cups, and cloth pads. Local drop-offs and mail-in options.',
  },
  {
    name: 'No Period Without',
    url: 'https://noperiodwithout.com',
    desc: 'Canada-based. Year-round drop-off locations. Accepts tampons, pads, liners, and menstrual treatment products.',
  },
];

export default function DonateProducts({ omittedProducts, onViewOmitted }) {
  const omittedList = Object.values(omittedProducts);

  return (
    <div className="container animate-fade-in-up" style={{ padding: 'var(--spacing-xl) var(--spacing-md)', maxWidth: '720px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💜</div>
        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Donate Products You Don&apos;t Use</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem' }}>
          Have pads, tampons, or other menstrual products that didn&apos;t work for you? Donate them to women who need them.
        </p>
      </div>

      <div className="card" style={{ padding: '1.5rem', marginBottom: 'var(--spacing-lg)', background: 'var(--color-surface-soft)', border: '1px solid var(--color-border)' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>What to donate</h3>
        <ul style={{ color: 'var(--color-text-muted)', paddingLeft: '1.25rem', lineHeight: 1.8 }}>
          <li>New, unused, sealed products in original packaging</li>
          <li>Pads, tampons, liners, menstrual cups, period underwear</li>
          <li>Include regular and heavy-flow options when possible</li>
          <li>Avoid scented products when you can</li>
        </ul>
      </div>

      {omittedList.length > 0 && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: 'var(--spacing-lg)', background: 'var(--color-secondary-fade)', border: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Products you&apos;ve hidden</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            These are products you marked as not for you. If you have unopened boxes, consider donating them.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
            {omittedList.slice(0, 6).map((p) => (
              <span key={p.id} style={{ background: 'var(--color-surface-soft)', padding: '0.35rem 0.6rem', borderRadius: 'var(--radius-pill)', fontSize: '0.8rem' }}>
                {p.name}
              </span>
            ))}
            {omittedList.length > 6 && <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>+{omittedList.length - 6} more</span>}
          </div>
          <button className="btn btn-outline" style={{ fontSize: '0.85rem' }} onClick={onViewOmitted}>
            View all hidden products
          </button>
        </div>
      )}

      <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Where to donate</h3>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem', fontSize: '0.95rem' }}>
        These organizations accept menstrual product donations and distribute them to people in need:
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {DONATION_ORGS.map((org) => (
          <a
            key={org.name}
            href={org.url}
            target="_blank"
            rel="noopener noreferrer"
            className="card"
            style={{
              padding: '1rem 1.25rem',
              textDecoration: 'none',
              color: 'inherit',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface-soft)',
              transition: 'box-shadow var(--transition-fast), border-color var(--transition-fast)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              e.currentTarget.style.borderColor = 'var(--color-primary)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = 'var(--color-border)';
            }}
          >
            <div style={{ fontWeight: '600', color: 'var(--color-primary)', marginBottom: '0.25rem' }}>{org.name}</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{org.desc}</div>
          </a>
        ))}
      </div>

      <p style={{ marginTop: 'var(--spacing-lg)', fontSize: '0.85rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
        You can also search for local food banks, shelters, and community centers—many accept menstrual product donations.
      </p>
    </div>
  );
}
