import React from 'react';

/** Mic control for search bars — type="button" so it never submits the form */
export default function SearchMicButton({
  isRecording,
  onClick,
  disabled = false,
  size = 'default',
}) {
  const pad = size === 'compact' ? '0.45rem 0.55rem' : '0.55rem 0.65rem';
  const fontSize = size === 'compact' ? '1rem' : '1.15rem';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={isRecording}
      aria-label={isRecording ? 'Stop speaking and add text to search' : 'Speak your search — describe what you need'}
      title={isRecording ? 'Stop' : 'Speak'}
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
      {isRecording ? '⏹' : '🎤'}
    </button>
  );
}
