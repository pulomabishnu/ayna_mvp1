const CHIPS = [
  { label: 'Preferences', delay: '0s' },
  { label: 'Health history', delay: '-11.33s' },
  { label: 'Goals', delay: '-22.66s' },
];

/**
 * The glowing "you" orb with three signal chips ("Preferences", "Health
 * history", "Goals") orbiting it on an elliptical CSS motion path — shared
 * between LandingScreen (signed out, first launch) and EcosystemIntroScreen
 * (signed in but no ecosystem built yet), so both use the exact same visual
 * instead of drifting apart. `showYou` is off for EcosystemIntroScreen since
 * there's no personalization to speak of before the intake is done.
 *
 * Sized responsively via the --ayna-orb-scale custom property (defined once
 * on .ayna-mobile in mobile.css) rather than fixed px, so it grows on wider
 * phones instead of looking small in the middle of a lot of empty gradient —
 * the orbit's motion path is plain SVG path syntax (no % / calc support), so
 * the whole assembly is built at one fixed pixel size and scaled up
 * uniformly with a CSS transform instead of resizing the path itself.
 */
export default function OrbHero({ showYou = true }) {
  return (
    <div
      style={{
        position: 'relative',
        width: 340,
        height: 300,
        marginBottom: 20,
        transform: 'scale(var(--ayna-orb-scale, 1))',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 290,
          height: 290,
          margin: '-145px 0 0 -145px',
          borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(255,199,116,.5),rgba(255,199,116,0) 68%)',
          animation: 'ay-breathe 7s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 168,
          height: 168,
          margin: '-84px 0 0 -84px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 34% 28%,#FFDCA8,#FFC774 46%,#E8843C)',
          boxShadow: '0 26px 56px -14px rgba(255,150,60,.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'ay-breathe 5s ease-in-out infinite',
        }}
      >
        {showYou && (
          <div style={{ fontFamily: "'Playfair Display',serif", fontStyle: 'italic', fontSize: 'calc(28px * var(--ayna-text-scale, 1))', color: '#3A2547' }}>
            you
          </div>
        )}
      </div>
      {CHIPS.map((chip) => (
        <div key={chip.label} className="ayna-orbiter" style={{ animationDelay: chip.delay }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#FFFCF9', borderRadius: 99, padding: '10px 16px', boxShadow: '0 10px 26px rgba(36,27,56,.3)', whiteSpace: 'nowrap' }}>
            <div style={{ width: 8, height: 8, borderRadius: 99, background: '#E8943F', flex: 'none' }} />
            <div style={{ fontSize: 12, fontWeight: 600, color: '#292524' }}>{chip.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
