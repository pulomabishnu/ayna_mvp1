export default function LandingScreen({ onStartQuiz, onBrowse }) {
  return (
    <div
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        background:
          'linear-gradient(165deg,#2A1F4E 0%,#4E3866 42%,#8A4A3C 74%,#D97A2B 100%)',
        display: 'flex',
        flexDirection: 'column',
        color: '#FFF9F2',
        animation: 'ay-page .25s ease-out',
        minHeight: '100vh',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -90,
          left: -70,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background:
            'radial-gradient(circle,rgba(255,199,116,.5),rgba(255,199,116,0) 68%)',
          animation: 'ay-drift 13s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 130,
          right: -90,
          width: 320,
          height: 320,
          borderRadius: '50%',
          background:
            'radial-gradient(circle,rgba(217,122,43,.6),rgba(217,122,43,0) 66%)',
          animation: 'ay-drift 17s ease-in-out infinite reverse',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '40%',
          left: -70,
          width: 250,
          height: 250,
          borderRadius: '50%',
          background:
            'radial-gradient(circle,rgba(126,84,186,.5),rgba(126,84,186,0) 70%)',
          animation: 'ay-drift 21s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '24%',
          width: 310,
          height: 310,
          marginLeft: -155,
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,.13)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '30%',
          width: 210,
          height: 210,
          marginLeft: -105,
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,.17)',
        }}
      />

      <div
        style={{
          position: 'relative',
          padding: '66px 26px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, letterSpacing: 0.5 }}>
          ayna
        </div>
        <div
          style={{
            fontFamily: "'DM Mono',monospace",
            fontSize: 10,
            letterSpacing: 1.2,
            opacity: 0.62,
          }}
        >
          BETA
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 26px',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: 176,
            height: 176,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 28,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,.34)',
              animation: 'ay-pulse 3.4s ease-out infinite',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,.34)',
              animation: 'ay-pulse 3.4s ease-out infinite 1.7s',
            }}
          />
          <div
            style={{
              width: 106,
              height: 106,
              borderRadius: '50%',
              background: 'linear-gradient(140deg,#FFDCA8,#FFC774 46%,#E8843C)',
              boxShadow: '0 22px 46px -14px rgba(255,150,60,.7)',
              animation: 'ay-breathe 5s ease-in-out infinite',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 4,
              top: 26,
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: '#FFF9F2',
              opacity: 0.9,
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: 10,
              bottom: 16,
              width: 9,
              height: 9,
              borderRadius: '50%',
              background: '#FFF9F2',
              opacity: 0.72,
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 58,
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#FFF9F2',
              opacity: 0.55,
            }}
          />
        </div>
        <div
          style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: 39,
            lineHeight: 1.1,
            textAlign: 'center',
          }}
        >
          Your body,
          <br />
          mapped.
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          padding: '0 24px 44px',
          display: 'flex',
          flexDirection: 'column',
          gap: 11,
        }}
      >
        <div
          onClick={onStartQuiz}
          style={{
            background: '#FFC774',
            color: '#231A12',
            padding: 17,
            borderRadius: 99,
            textAlign: 'center',
            fontFamily: "'DM Sans',sans-serif",
            fontWeight: 600,
            fontSize: 15.5,
            cursor: 'pointer',
            boxShadow: '0 18px 34px -14px rgba(255,199,116,.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 9,
            animation: 'ay-bob 2.5s ease-in-out infinite',
          }}
        >
          Build my ecosystem
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#231A12"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </div>
        <div
          onClick={onBrowse}
          style={{
            background: 'rgba(255,249,242,.13)',
            border: '1.5px solid rgba(255,255,255,.34)',
            color: '#FFF9F2',
            padding: 17,
            borderRadius: 99,
            textAlign: 'center',
            fontFamily: "'DM Sans',sans-serif",
            fontWeight: 600,
            fontSize: 15.5,
            cursor: 'pointer',
          }}
        >
          Browse everything
        </div>
      </div>
    </div>
  );
}
