import React from 'react';
import Disclaimer from './Disclaimer';
import { CATEGORY_LABELS } from '../data/products';

function googleUrl(q) {
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}

export default function LlmSearchSuggestionModal({ product, onClose }) {
  if (!product?.llmGenerated) return null;

  const terms = Array.isArray(product.searchTerms) ? product.searchTerms : [];
  const label = CATEGORY_LABELS[product.category] || product.category || 'Product idea';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
      onClick={onClose}
      role="presentation"
    >
      <div
        style={{
          backgroundColor: 'var(--color-surface-soft)',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="llm-suggestion-title"
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            zIndex: 10,
            border: '1px solid var(--color-border)',
            cursor: 'pointer',
            color: 'var(--color-text-main)',
          }}
        >
          ✕
        </button>

        <div style={{ padding: '1.75rem 1.5rem 1.25rem' }}>
          <span
            style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #FDF4FF 0%, #F5F3FF 100%)',
              color: '#7E22CE',
              padding: '0.25rem 0.75rem',
              borderRadius: 'var(--radius-pill)',
              fontSize: '0.7rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '0.75rem',
              border: '1px solid #E9D5FF',
            }}
          >
            Suggested — not in catalog
          </span>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>{label}</p>
          <h2 id="llm-suggestion-title" style={{ fontSize: '1.35rem', marginBottom: '0.75rem', lineHeight: 1.3 }}>
            {product.name}
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--color-text-main)', lineHeight: 1.6, marginBottom: '1rem' }}>
            {product.summary}
          </p>
          {product.safetyNote && (
            <div
              style={{
                padding: '0.75rem 1rem',
                background: '#FFF7ED',
                borderRadius: 'var(--radius-md)',
                border: '1px solid #FFEDD5',
                fontSize: '0.88rem',
                color: '#9A3412',
                lineHeight: 1.5,
                marginBottom: '1rem',
              }}
            >
              <strong>Safety:</strong> {product.safetyNote}
            </div>
          )}
          {terms.length > 0 && (
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                Search the web (generic phrases)
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {terms.map((t) => (
                  <a
                    key={t}
                    href={googleUrl(t)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: '600',
                      color: 'var(--color-primary)',
                      textDecoration: 'none',
                      padding: '0.35rem 0.75rem',
                      border: '1px solid var(--color-primary)',
                      borderRadius: 'var(--radius-pill)',
                      background: 'var(--color-primary-fade)',
                    }}
                  >
                    {t} ↗
                  </a>
                ))}
              </div>
            </div>
          )}
          <Disclaimer compact style={{ marginTop: '1.25rem' }} />
        </div>
      </div>
    </div>
  );
}
