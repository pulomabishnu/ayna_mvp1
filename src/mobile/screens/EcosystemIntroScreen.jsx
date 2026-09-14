import MobileHeader from '../components/MobileHeader.jsx';
import OrbHero from '../components/OrbHero.jsx';

export default function EcosystemIntroScreen({ onStartQuiz, onOpenSaved, onBrowse, headerInitial = 'A', onOpenProfile }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        background: 'linear-gradient(168deg,#242A52 0%,#4E3866 52%,#A2603C 100%)',
        color: '#FFF9F2',
        animation: 'ay-page .25s ease-out',
      }}
    >
      <MobileHeader variant="dark" activeTab="eco" initial={headerInitial} onOpenSaved={onOpenSaved} onGoBrowse={onBrowse} onOpenProfile={onOpenProfile} />

      <div
        style={{
          position: 'absolute',
          top: -70,
          right: -80,
          width: 260,
          height: 260,
          borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(255,199,116,.34),rgba(255,199,116,0) 70%)',
          animation: 'ay-drift 15s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6px 24px 20px' }}>
        <OrbHero showYou={false} />
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 'calc(31px * var(--ayna-text-scale, 1))', lineHeight: 1.16, textAlign: 'center' }}>
          Build your
          <br />
          ecosystem
        </div>
      </div>

      <div style={{ position: 'relative', padding: '8px 24px 40px' }}>
        <div
          onClick={onStartQuiz}
          style={{
            background: '#FFC774',
            color: '#231A12',
            textAlign: 'center',
            padding: 16,
            borderRadius: 99,
            fontFamily: "'DM Sans',sans-serif",
            fontWeight: 600,
            fontSize: 'calc(15px * var(--ayna-text-scale, 1))',
            cursor: 'pointer',
            boxShadow: '0 18px 34px -16px rgba(255,199,116,.8)',
            animation: 'ay-bob 2.5s ease-in-out infinite',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 9,
          }}
        >
          Start the intake
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#231A12" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </div>
      </div>
    </div>
  );
}
