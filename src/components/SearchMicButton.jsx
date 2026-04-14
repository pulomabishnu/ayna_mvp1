import React from 'react';

/** Mic control for search bars — type="button" so it never submits the form */
export default function SearchMicButton({
  isRecording,
  onClick,
  disabled = false,
  size = 'default',
  variant = 'default',
}) {
  const pad = size === 'compact' ? '0.45rem 0.55rem' : '0.55rem 0.65rem';
  const fontSize = size === 'compact' ? '1rem' : '1.15rem';
  const primary = variant === 'primary';
  const borderColor = primary
    ? isRecording ? 'var(--color-primary-hover)' : 'var(--color-primary)'
    : isRecording ? 'var(--color-primary)' : 'var(--color-border)';
  const background = primary
    ? isRecording ? 'var(--color-primary-hover)' : 'var(--color-primary)'
    : isRecording ? 'var(--color-secondary-fade)' : 'var(--color-surface-soft)';
  const color = primary ? '#fff' : 'var(--color-primary)';
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
        border: `1px solid ${borderColor}`,
        background,
        color,
        borderRadius: 'var(--radius-pill)',
        padding: pad,
        fontSize,
        cursor: disabled ? 'not-allowed' : 'pointer',
        lineHeight: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.2s, border-color 0.2s',
        boxShadow: primary && !disabled ? '0 2px 10px rgba(217, 119, 145, 0.35)' : undefined,
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {isRecording ? '⏹' : '🎤'}
    </button>
  );
}
