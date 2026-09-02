export default function AskAynaChip({ onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        position: 'absolute',
        bottom: 96,
        right: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '9px 14px 9px 9px',
        background: '#1C1917',
        borderRadius: 999,
        boxShadow: '0 12px 26px -10px rgba(0,0,0,.4)',
        cursor: 'pointer',
        zIndex: 20,
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: 'linear-gradient(135deg,#242A52,#4E3866 55%,#A2603C)',
          animation: 'ay-float 3s ease-in-out infinite',
        }}
      />
      <span style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 600 }}>Ask Ayna</span>
    </div>
  );
}
