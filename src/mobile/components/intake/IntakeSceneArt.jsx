// Background art for each intake question. Every question gets its own
// tone + motif so the intake reads like levels of a game, while the
// safety questions (conditions, allergies, medications, urgent symptoms)
// use the calm scene: plain paper, no decoration, nothing to compete with
// the answer. All art is decorative (aria-hidden) and sits behind content.


export default function IntakeSceneArt({ art }) {
  if (!art) return null;
  return (
    <div className={`ip-art ip-art--${art}`} aria-hidden="true">
      {art === 'scallop' && (
        <svg className="ip-art-scallop" viewBox="0 0 390 40" preserveAspectRatio="none">
          <path d="M0 0h390v20c-16 0-16 20-32.5 20S341 20 325 20s-16 20-32.5 20S276 20 260 20s-16 20-32.5 20S211 20 195 20s-16 20-32.5 20S146 20 130 20s-16 20-32.5 20S81 20 65 20s-16 20-32.5 20S16 20 0 20Z" />
        </svg>
      )}
      {art === 'sparkle' && ['a', 'b', 'c'].map((k) => (
        <svg key={k} className={`ip-art-sparkle ip-art-sparkle--${k}`} viewBox="-26 -26 52 52"><path d="M0-24C2-8 8-2 24 0 8 2 2 8 0 24-2 8-8 2-24 0-8-2-2-8 0-24Z" /></svg>
      ))}
      {art === 'bloom' && (
        <svg className="ip-art-bloom" viewBox="-100 -100 200 200">
          <path d="M0-92c20 0 30 22 30 36 10-14 34-24 48-10s4 38-10 48c14 0 36 10 36 30s-22 30-36 30c14 10 24 34 10 48s-38 4-48-10c0 14-10 36-30 36S-30 72-30 58c-10 14-34 24-48 10s-4-38 10-48c-14 0-36-10-36-30s22-30 36-30c-14-10-24-34-10-48s38-4 48 10c0-14 10-36 30-36Z" />
        </svg>
      )}
      {art === 'drops' && (
        <svg className="ip-art-drops" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
          <path transform="translate(330 96)" d="M0-30C12-12 22 0 22 14A22 22 0 0 1-22 14C-22 0-12-12 0-30Z" />
          <path transform="translate(362 170) scale(.55)" d="M0-30C12-12 22 0 22 14A22 22 0 0 1-22 14C-22 0-12-12 0-30Z" />
          <path transform="translate(36 760) scale(1.3)" d="M0-30C12-12 22 0 22 14A22 22 0 0 1-22 14C-22 0-12-12 0-30Z" />
        </svg>
      )}
      {art === 'zigzag' && (
        <svg className="ip-art-zigzag" viewBox="0 0 390 60" preserveAspectRatio="none">
          <path d="M0 30 20 10 40 30 60 10 80 30 100 10 120 30 140 10 160 30 180 10 200 30 220 10 240 30 260 10 280 30 300 10 320 30 340 10 360 30 380 10 400 30" />
        </svg>
      )}
      {art === 'arch' && <span className="ip-art-arch" />}
      {art === 'coins' && (
        <svg className="ip-art-coins" viewBox="0 0 120 160">
          <ellipse cx="60" cy="140" rx="50" ry="14" /><ellipse cx="60" cy="118" rx="50" ry="14" /><ellipse cx="60" cy="96" rx="50" ry="14" />
          <ellipse cx="60" cy="74" rx="50" ry="14" />
        </svg>
      )}
      {art === 'rings' && (
        <svg className="ip-art-rings" viewBox="0 0 300 300">
          <defs>
            <path id="ip-ring-a" d="M150 150m-128 0a128 128 0 1 1 256 0a128 128 0 1 1-256 0" />
            <path id="ip-ring-b" d="M150 150m-92 0a92 92 0 1 1 184 0a92 92 0 1 1-184 0" />
          </defs>
          <text><textPath href="#ip-ring-a">NEW BRANDS · OLD FAVES · NEW BRANDS · OLD FAVES · NEW BRANDS · OLD FAVES ·</textPath></text>
          <text><textPath href="#ip-ring-b">YOUR CALL · YOUR CALL · YOUR CALL · YOUR CALL ·</textPath></text>
        </svg>
      )}
    </div>
  );
}
