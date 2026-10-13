import React from 'react';

/** Mic control for search bars, type="button" so it never submits the form */
export default function SearchMicButton({
  isRecording,
  onClick,
  disabled = false,
  size = 'default',
  className = '',
}) {
  const pad = size === 'compact' ? '0.45rem 0.55rem' : '0.55rem 0.65rem';
  const fontSize = size === 'compact' ? '1rem' : '1.15rem';
  return (
    <button
      type="button"
      className={className.trim() || undefined}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={isRecording}
      aria-label={isRecording ? 'Stop voice input' : 'Voice input'}
      title={isRecording ? 'Stop' : 'Voice input'}
      style={{
        flexShrink: 0,
        border: `1px solid ${isRecording ? 'var(--color-primary)' : 'var(--color-border)'}`,
        background: isRecording ? 'var(--color-secondary-fade)' : 'var(--color-surface-soft)',
        color: 'var(--color-primary)',
        borderRadius: 'var(--radius-pill)',
        padding: pad,
        fontSize,
        cursor: disabled ? 'not-allowed' : 'pointer',
        lineHeight: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.2s, border-color 0.2s',
      }}
    >
      {isRecording ? (
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" /></svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
        </svg>
      )}
    </button>
  );
}
