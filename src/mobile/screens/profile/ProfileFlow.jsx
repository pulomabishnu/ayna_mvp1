import { useEffect, useMemo, useState } from 'react';
import { ALL_PRODUCTS } from '../../../data/products.js';
import { getBrandAffinity, getCategoryInsights, getSafetyAlerts } from '../../utils/shopperProfileData.js';
import { ROUTINE_BUCKET_LABELS, ROUTINE_BUCKETS, useRoutine } from '../../hooks/useRoutine.js';

/**
 * Profile hub + its four sub-sections and one detail page, ported from the
 * "Ayna Profile Mobile" design reference. Manages its own internal
 * navigation (hub -> sub-screen -> back) the same way IntakeScreen manages
 * its own steps, so MobileApp only has to mount/unmount ONE overlay instead
 * of tracking a navigation stack.
 *
 * This pass is UI scaffolding, not backend integration: toggles below are
 * local component state with no persistence yet (Notifications, Updates,
 * Night mode, newsletter), since none of that exists server-side yet.
 * Real data is wired in wherever it already exists in the app (ecosystem
 * count, saved count, name); "profile filled %" stays a static placeholder
 * since there's no completeness calculation built yet.
 *
 * Shopper Profile is the one section wired to real backend logic (see
 * shopperProfileData.js): safety alerts, brand affinity and category
 * insights are all derived from the user's actual ecosystem/saved
 * products and quiz answers, not mock data.
 */

function BackIcon({ stroke = 'var(--ayna-heading)' }) {
  return (
    // CSS custom properties only resolve through the `style` attribute, not
    // a plain SVG presentation attribute — `stroke="var(--x)"` silently
    // renders as no stroke at all (Chromium doesn't substitute var() there).
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" style={{ stroke }}>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" style={{ stroke: 'var(--ayna-text-faint)', flex: 'none' }}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function BackHeader({ title, onBack, dark }) {
  return (
    <div
      style={{
        flex: 'none',
        paddingTop: 'max(20px, env(safe-area-inset-top))',
        paddingLeft: 18,
        paddingRight: 18,
        paddingBottom: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <div
        onClick={onBack}
        style={{
          width: 34,
          height: 34,
          borderRadius: 99,
          border: '1px solid ' + (dark ? 'rgba(255,255,255,.28)' : 'var(--ayna-border)'),
          background: dark ? 'rgba(255,255,255,.1)' : 'var(--ayna-surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flex: 'none',
        }}
      >
        <BackIcon stroke={dark ? '#FFF9F2' : 'var(--ayna-heading)'} />
      </div>
      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: dark ? '#FFF9F2' : 'var(--ayna-heading)' }}>{title}</div>
    </div>
  );
}

function Toggle({ on, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: 42,
        height: 25,
        borderRadius: 99,
        padding: 3,
        flex: 'none',
        cursor: 'pointer',
        background: on ? 'var(--ayna-cta-bg)' : 'var(--ayna-border)',
        transition: 'background .18s ease',
      }}
    >
      <div
        style={{
          width: 19,
          height: 19,
          borderRadius: '50%',
          background: on ? 'var(--ayna-cta-text)' : 'var(--ayna-surface)',
          transform: on ? 'translateX(17px)' : 'none',
          transition: 'transform .18s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,.25)',
        }}
      />
    </div>
  );
}

function ToggleRow({ title, sub, on, onClick, first }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '17px 0',
        borderTop: first ? 'none' : '1px solid var(--ayna-border)',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--ayna-text)' }}>{title}</div>
        <div style={{ fontSize: 12.5, color: 'var(--ayna-text-muted)', marginTop: 3, lineHeight: 1.45 }}>{sub}</div>
      </div>
      <Toggle on={on} onClick={onClick} />
    </div>
  );
}

/* ---------------------------- Profile hub ---------------------------- */

function ProfileHub({ onOpen, onClose, onSignOut, name, initial, memberSince, ecosystemCount, savedCount, profileFilledPct }) {
  return (
    <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          position: 'relative',
          padding: 'max(24px, env(safe-area-inset-top)) 22px 26px',
          background: 'linear-gradient(160deg,#242A52 0%,#4E3866 58%,#8A4A3C 100%)',
          color: '#FFF9F2',
          overflow: 'hidden',
          flex: 'none',
        }}
      >
        <div style={{ position: 'absolute', top: -70, right: -60, width: 230, height: 230, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,199,116,.45),rgba(255,199,116,0) 68%)', animation: 'ay-drift 15s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', left: -40, bottom: -80, width: 200, height: 200, borderRadius: '50%', border: '1px solid rgba(255,255,255,.14)' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, letterSpacing: 0.5 }}>ayna</div>
          <div
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: 99,
              border: '1px solid rgba(255,255,255,.28)',
              background: 'rgba(255,249,242,.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            ×
          </div>
        </div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14, marginTop: 24 }}>
          <div
            style={{
              width: 66,
              height: 66,
              borderRadius: 99,
              flex: 'none',
              background: 'linear-gradient(140deg,#FFDCA8,#FFC774 48%,#E8843C)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Playfair Display',serif",
              fontSize: 26,
              color: '#3A2410',
              boxShadow: '0 14px 30px -12px rgba(255,150,60,.7)',
            }}
          >
            {initial}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, lineHeight: 1.15 }}>{name}</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '1.4px', textTransform: 'uppercase', color: 'rgba(255,249,242,.62)', marginTop: 5 }}>{memberSince}</div>
          </div>
        </div>
        <div style={{ position: 'relative', display: 'flex', gap: 8, marginTop: 22 }}>
          {[
            { value: ecosystemCount, label: 'In ecosystem' },
            { value: savedCount, label: 'Saved' },
            { value: `${profileFilledPct}%`, label: 'Profile filled' },
          ].map((s) => (
            <div key={s.label} style={{ flex: 1, background: 'rgba(255,249,242,.11)', border: '1px solid rgba(255,255,255,.16)', borderRadius: 16, padding: '11px 12px' }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 23, color: '#FFC774' }}>{s.value}</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8.5, letterSpacing: '1.1px', textTransform: 'uppercase', color: 'rgba(255,249,242,.66)', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, padding: '22px 20px 26px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)', marginBottom: 2 }}>Your account</div>

        {[
          { key: 'shopper', icon: '🛍️', title: 'Shopper Profile', sub: 'Alerts, routine, brand affinity', badge: '2 NEW' },
          { key: 'startups', icon: '✨', title: 'Early Stage Startups', sub: 'Emerging brands worth backing' },
          { key: 'preferences', icon: '🔔', title: 'Preferences', sub: 'Notifications, updates, night mode' },
          { key: 'settings', icon: '⚙️', title: 'Settings', sub: 'Account, privacy, about Ayna' },
        ].map((row) => (
          <div
            key={row.key}
            onClick={() => onOpen(row.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              background: 'var(--ayna-surface)',
              border: '1px solid var(--ayna-border)',
              borderRadius: 20,
              padding: 16,
              cursor: 'pointer',
            }}
          >
            <div style={{ width: 42, height: 42, borderRadius: 14, flex: 'none', background: 'var(--ayna-chip-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{row.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 15.5, color: 'var(--ayna-text)' }}>{row.title}</div>
              <div style={{ fontSize: 12.5, color: 'var(--ayna-text-muted)', marginTop: 2 }}>{row.sub}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 'none' }}>
              {row.badge && <div style={{ background: 'var(--ayna-accent)', color: '#231A12', fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: '.5px', padding: '3px 7px', borderRadius: 99 }}>{row.badge}</div>}
              <ChevronIcon />
            </div>
          </div>
        ))}

        <div style={{ marginTop: 12, borderRadius: 20, padding: 18, background: 'linear-gradient(135deg,#FFF6E6,#FFEFD6)', border: '1px solid #F1DFC2' }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9.5, letterSpacing: '1.4px', textTransform: 'uppercase', color: '#C0761F' }}>Finish your profile</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 19, lineHeight: 1.25, margin: '7px 0 12px', color: '#3A2410' }}>Two questions left for a sharper match.</div>
          <div style={{ height: 6, borderRadius: 99, background: 'rgba(192,118,31,.16)', overflow: 'hidden' }}>
            <div style={{ width: `${profileFilledPct}%`, height: '100%', background: '#F0A84B' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 13 }}>
            <div style={{ fontSize: 12, color: '#8A6B44' }}>{profileFilledPct}% complete</div>
            <div style={{ background: '#242A52', color: '#FFF9F2', fontWeight: 600, fontSize: 12.5, padding: '9px 16px', borderRadius: 99, cursor: 'pointer' }}>Continue</div>
          </div>
        </div>

        <div onClick={onSignOut} style={{ textAlign: 'center', padding: '16px 0 4px', fontSize: 13, color: 'var(--ayna-text-muted)', cursor: 'pointer' }}>Sign out</div>
      </div>
    </div>
  );
}

/* ------------------------- Shopper Profile ------------------------- */

function ShopperProfileScreen({ onBack, quizAnswers, myProducts = [], savedProducts = {}, onViewAlternative, onBrowse }) {
  const [dismissedAlerts, setDismissedAlerts] = useState([]);
  const [activeBucket, setActiveBucket] = useState('morning');
  const { routineMap, setProductBucket, removeFromRoutine } = useRoutine();

  const allAlerts = getSafetyAlerts(myProducts, quizAnswers);
  const activeAlerts = allAlerts.filter((a) => !dismissedAlerts.includes(a.id));
  const dismissAlert = (id) => setDismissedAlerts((prev) => [...prev, id]);

  const inBucket = myProducts.filter((p) => routineMap[p.id] === activeBucket);
  const notInBucket = myProducts.filter((p) => routineMap[p.id] !== activeBucket);
  const sortedCount = myProducts.filter((p) => routineMap[p.id]).length;

  const affinityChips = getBrandAffinity(quizAnswers, myProducts);

  const { top: topCategories, low: lowCategories } = getCategoryInsights(myProducts, savedProducts, ALL_PRODUCTS);

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <BackHeader title="Shopper Profile" onBack={onBack} />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '0 20px 30px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 11 }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)' }}>Safety alerts</div>
            <div style={{ fontSize: 11.5, color: 'var(--ayna-text-muted)' }}>{activeAlerts.length} active</div>
          </div>
          {activeAlerts.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {activeAlerts.map((alert) =>
                alert.kind === 'recall' ? (
                  <div key={alert.id} style={{ borderRadius: 18, padding: 15, background: 'rgba(180,64,42,.08)', border: '1px solid rgba(180,64,42,.25)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 7, height: 7, borderRadius: 99, background: '#B4402A', flex: 'none' }} />
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#B4402A' }}>FDA recall · active</div>
                    </div>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, lineHeight: 1.3, margin: '8px 0 5px', color: 'var(--ayna-text)' }}>{alert.title}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--ayna-text-muted)', lineHeight: 1.5 }}>{alert.body}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <div onClick={() => onViewAlternative && onViewAlternative(alert.product)} style={{ background: '#B4402A', color: '#FFF9F2', fontWeight: 600, fontSize: 12, padding: '8px 14px', borderRadius: 99, cursor: 'pointer' }}>See swap</div>
                      <div onClick={() => dismissAlert(alert.id)} style={{ border: '1px solid rgba(180,64,42,.35)', color: '#B4402A', fontWeight: 600, fontSize: 12, padding: '8px 14px', borderRadius: 99, cursor: 'pointer' }}>Dismiss</div>
                    </div>
                  </div>
                ) : (
                  <div key={alert.id} style={{ borderRadius: 18, padding: 15, background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 7, height: 7, borderRadius: 99, background: 'var(--ayna-accent-dark)', flex: 'none' }} />
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)' }}>Safety note · watching</div>
                    </div>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, lineHeight: 1.3, margin: '8px 0 5px', color: 'var(--ayna-text)' }}>{alert.title}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--ayna-text-muted)', lineHeight: 1.5 }}>{alert.body}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <div onClick={() => dismissAlert(alert.id)} style={{ border: '1px solid var(--ayna-border)', color: 'var(--ayna-text-muted)', fontWeight: 600, fontSize: 12, padding: '8px 14px', borderRadius: 99, cursor: 'pointer' }}>Dismiss</div>
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div style={{ borderRadius: 18, padding: 15, border: '1px dashed var(--ayna-border)', fontSize: 12.5, color: 'var(--ayna-text-muted)', lineHeight: 1.5 }}>
              No active alerts. We'll watch your ecosystem for recalls and check it against what you flagged during intake.
            </div>
          )}
          {dismissedAlerts.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 18, padding: '13px 15px', marginTop: 9, border: '1px dashed var(--ayna-border)' }}>
              <div style={{ fontSize: 12.5, color: 'var(--ayna-text-muted)' }}>Dismissed · {dismissedAlerts.length}</div>
            </div>
          )}
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 11 }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)' }}>Your routine</div>
          </div>
          <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 20, padding: 16 }}>
            <div style={{ display: 'flex', gap: 7, overflowX: 'auto', touchAction: 'pan-x', paddingBottom: 2, marginBottom: 14 }}>
              {ROUTINE_BUCKETS.map((key) => (
                <div
                  key={key}
                  onClick={() => setActiveBucket(key)}
                  style={{
                    flex: 'none',
                    textAlign: 'center',
                    padding: '8px 14px',
                    borderRadius: 99,
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: activeBucket === key ? 'var(--ayna-cta-bg)' : 'var(--ayna-chip-bg)',
                    color: activeBucket === key ? 'var(--ayna-cta-text)' : 'var(--ayna-text-muted)',
                  }}
                >
                  {ROUTINE_BUCKET_LABELS[key]}
                </div>
              ))}
            </div>

            {!myProducts.length ? (
              <div style={{ padding: '10px 2px', fontSize: 12.5, color: 'var(--ayna-text-muted)', lineHeight: 1.5 }}>
                Nothing in your ecosystem yet — add products so you can sort them into a routine.
                {onBrowse && (
                  <div onClick={onBrowse} style={{ display: 'inline-block', marginTop: 10, background: 'var(--ayna-cta-bg)', color: 'var(--ayna-cta-text)', fontWeight: 600, fontSize: 12.5, padding: '9px 16px', borderRadius: 99, cursor: 'pointer' }}>Browse products</div>
                )}
              </div>
            ) : (
              <>
                {inBucket.length ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
                    {inBucket.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => removeFromRoutine(p.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--ayna-cta-bg)', color: 'var(--ayna-cta-text)', fontSize: 12.5, fontWeight: 500, padding: '8px 12px', borderRadius: 99, cursor: 'pointer' }}
                      >
                        {p.name} <span style={{ opacity: 0.75, fontSize: 12 }}>×</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 12.5, color: 'var(--ayna-text-muted)', lineHeight: 1.5, marginBottom: 16 }}>
                    Nothing in your {ROUTINE_BUCKET_LABELS[activeBucket].toLowerCase()} routine yet — tap a product below to add it.
                  </div>
                )}

                {notInBucket.length > 0 && (
                  <>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9.5, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--ayna-text-faint)', marginBottom: 9 }}>Tap to add</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                      {notInBucket.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => setProductBucket(p.id, activeBucket)}
                          style={{ fontSize: 12.5, fontWeight: 500, padding: '8px 12px', borderRadius: 99, cursor: 'pointer', background: 'transparent', border: '1px solid var(--ayna-border)', color: 'var(--ayna-text-muted)' }}
                        >
                          {p.name}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, paddingTop: 13, borderTop: '1px solid var(--ayna-border)' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'var(--ayna-text-muted)' }}>{sortedCount} of {myProducts.length} sorted into a routine</div>
            </div>
          </div>
        </div>

        <div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)', marginBottom: 11 }}>Brand affinity</div>
          <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 20, padding: 16 }}>
            <div style={{ fontSize: 12.5, color: 'var(--ayna-text-muted)', lineHeight: 1.5, marginBottom: 13 }}>Drawn from what matters to you in intake and what you actually keep in your ecosystem.</div>
            {affinityChips.length ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {affinityChips.map((chip) => {
                  const strong = chip.score >= 70;
                  const outline = chip.score === 0;
                  return (
                    <div
                      key={chip.tag}
                      style={{
                        fontSize: 12.5,
                        fontWeight: 500,
                        padding: '8px 13px',
                        borderRadius: 99,
                        cursor: 'default',
                        background: outline ? 'transparent' : strong ? 'var(--ayna-cta-bg)' : 'var(--ayna-chip-bg)',
                        color: outline ? 'var(--ayna-text-muted)' : strong ? 'var(--ayna-cta-text)' : 'var(--ayna-accent-dark)',
                        border: outline ? '1px solid var(--ayna-border)' : 'none',
                      }}
                    >
                      {chip.label} <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, opacity: 0.75 }}>{chip.score}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ fontSize: 12.5, color: 'var(--ayna-text-muted)' }}>
                {quizAnswers ? "You didn't flag any of these during intake." : 'Take the quiz to see what matters most to you.'}
              </div>
            )}
          </div>
        </div>

        <div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)', marginBottom: 11 }}>Most-represented categories</div>
          {topCategories.length ? (
            <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 20, padding: 16, display: 'flex', flexDirection: 'column', gap: 13 }}>
              {topCategories.map((c) => (
                <div key={c.rank}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'var(--ayna-accent-dark)', flex: 'none' }}>{c.rank}</div>
                    <div style={{ flex: 1, fontWeight: 500, fontSize: 14, color: 'var(--ayna-text)' }}>{c.name}</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'var(--ayna-text-muted)', flex: 'none' }}>{c.count}</div>
                  </div>
                  <div style={{ height: 7, borderRadius: 99, background: 'var(--ayna-border)', overflow: 'hidden' }}>
                    <div style={{ width: `${c.pct}%`, height: '100%', background: 'var(--ayna-accent-dark)' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ border: '1px dashed var(--ayna-border)', borderRadius: 20, padding: 16, fontSize: 12.5, color: 'var(--ayna-text-muted)', lineHeight: 1.5 }}>
              Save or add a product to start building this out.
            </div>
          )}
        </div>

        {lowCategories.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 11 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ayna-text-faint)' }}>Least-represented</div>
              <div style={{ fontSize: 12, color: 'var(--ayna-text-muted)' }}>Blind spots</div>
            </div>
            <div style={{ border: '1px dashed var(--ayna-border)', borderRadius: 20, padding: '6px 16px' }}>
              {lowCategories.map((c, i) => (
                <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderTop: i === 0 ? 'none' : '1px solid var(--ayna-border)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, color: 'var(--ayna-text-muted)' }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--ayna-text-muted)', marginTop: 2 }}>{c.note}</div>
                  </div>
                </div>
              ))}
              {onBrowse && (
                <div style={{ padding: '12px 0 14px', borderTop: '1px solid var(--ayna-border)' }}>
                  <div onClick={onBrowse} style={{ display: 'inline-block', border: '1px solid var(--ayna-border)', color: 'var(--ayna-brown)', fontWeight: 600, fontSize: 12, padding: '8px 14px', borderRadius: 99, cursor: 'pointer' }}>Explore a blind spot</div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

/* ----------------------- Early Stage Startups ----------------------- */

function formatCategoryLabel(category) {
  if (!category) return '';
  return category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// Same frustration -> tag vocabulary as the desktop matching logic
// (src/data/startups.js) — Airtable's Symptom Tags were filled in against
// this exact vocabulary. This only ranks the real Airtable-sourced startups
// fetched below; it deliberately does not pull in the desktop's separate
// hardcoded STARTUPS catalog, which is a different, much larger list this
// screen was never meant to show.
const FRUSTRATION_TAG_MAP = {
  'Heavy flow': 'heavy-flow',
  'Painful cramps': 'cramps',
  'Hormonal bloating': 'bloating',
  'Irregular cycles': 'irregular',
  'Leaks & staining': 'leaks',
  'General discomfort': 'discomfort',
  'Not sure if products are safe': 'safety-concern',
  'Recurrent UTIs': 'uti',
  'PCOS symptoms': 'pcos',
  'Pelvic pain': 'pelvic-floor',
  'Menopause symptoms': 'menopause',
  'Endometriosis': 'endometriosis',
};

function sortByRelevance(startups, quizAnswers) {
  const userTags = new Set();
  (quizAnswers?.frustrations || []).forEach((f) => {
    const tag = FRUSTRATION_TAG_MAP[f];
    if (tag) userTags.add(tag);
  });
  if (userTags.size === 0) return startups;
  return [...startups].sort((a, b) => {
    const scoreA = (a.tags || []).filter((t) => userTags.has(t)).length;
    const scoreB = (b.tags || []).filter((t) => userTags.has(t)).length;
    return scoreB - scoreA;
  });
}

// "Clinical" reads on real badge data (Airtable's Tags field) rather than a
// field that doesn't exist — there's no dedicated "clinical" flag, so this is
// the closest honest proxy: some form of clinical/medical validation.
const CLINICAL_BADGES = new Set(['Clinically Backed', 'Doctor-Founded', 'FDA-Cleared']);

function matchesFilter(startup, filter) {
  if (filter === 'women') return startup.womenFounded === true;
  if (filter === 'preseed') return startup.stage === 'Pre-Seed';
  if (filter === 'clinical') return (startup.badges || []).some((b) => CLINICAL_BADGES.has(b));
  return true;
}

function EarlyStageScreen({ onBack, quizAnswers }) {
  const [filter, setFilter] = useState('all');
  // Real early-stage startups synced from Airtable via api/startups.js — no
  // hardcoded placeholder companies here; an empty/failed fetch just shows
  // an honest empty state below rather than fake data.
  const [startups, setStartups] = useState([]);
  const [loadState, setLoadState] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/startups')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('bad response'))))
      .then((data) => {
        if (cancelled) return;
        setStartups(data.startups || []);
        setLoadState('ready');
      })
      .catch(() => { if (!cancelled) setLoadState('error'); });
    return () => { cancelled = true; };
  }, []);

  const ranked = useMemo(() => sortByRelevance(startups, quizAnswers), [startups, quizAnswers]);
  const filtered = filter === 'all' ? ranked : ranked.filter((s) => matchesFilter(s, filter));

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <BackHeader title="Early Stage" onBack={onBack} />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '0 20px 30px' }}>
        <div style={{ borderRadius: 22, padding: 20, background: 'linear-gradient(140deg,#4E3866,#242A52)', color: '#FFF9F2', position: 'relative', overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ position: 'absolute', right: -50, top: -50, width: 180, height: 180, borderRadius: '50%', border: '1px solid rgba(255,255,255,.16)' }} />
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9.5, letterSpacing: '1.4px', textTransform: 'uppercase', color: '#FFC774' }}>Founder-first</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 25, lineHeight: 1.2, margin: '8px 0 7px', maxWidth: 250 }}>Real founders, not ad spend.</div>
          <div style={{ fontSize: 12.5, color: 'rgba(255,249,242,.72)', lineHeight: 1.5, maxWidth: 265 }}>Ranked by what you told us during intake — never by who paid for placement.</div>
        </div>

        <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 16 }}>
          {['all', 'women', 'preseed', 'clinical'].map((key) => (
            <div
              key={key}
              onClick={() => setFilter(key)}
              style={{
                fontSize: 12,
                fontWeight: filter === key ? 500 : 400,
                padding: '7px 13px',
                borderRadius: 99,
                flex: 'none',
                cursor: 'pointer',
                background: filter === key ? 'var(--ayna-cta-bg)' : 'transparent',
                color: filter === key ? 'var(--ayna-cta-text)' : 'var(--ayna-text-muted)',
                border: filter === key ? 'none' : '1px solid var(--ayna-border)',
              }}
            >
              {key === 'all' ? 'All' : key === 'women' ? 'Women-founded' : key === 'preseed' ? 'Pre-seed' : 'Clinical'}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loadState === 'loading' && (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--ayna-text-muted)', fontSize: 13 }}>Loading startups…</div>
          )}
          {loadState === 'error' && (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--ayna-text-muted)', fontSize: 13 }}>Couldn't load startups right now — try again shortly.</div>
          )}
          {loadState === 'ready' && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--ayna-text-muted)', fontSize: 13 }}>No startups match that filter yet.</div>
          )}

          {filtered.map((s) => {
            const href = s.url || s.waitlistUrl;
            const openLink = href ? () => window.open(href, '_blank', 'noopener,noreferrer') : undefined;
            return s.featured ? (
              <div key={s.id} onClick={openLink} style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 22, overflow: 'hidden', cursor: openLink ? 'pointer' : 'default' }}>
                <div style={{ height: 168, background: s.image ? undefined : 'linear-gradient(160deg,#F3EADC,#EFE3D2)', backgroundImage: s.image ? `url(${s.image})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                  {s.foundedYear && (
                    <div style={{ position: 'absolute', left: 12, top: 12, background: 'rgba(255,255,255,.93)', color: '#C0761F', fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: '.9px', padding: '5px 9px', borderRadius: 99 }}>FOUNDED {s.foundedYear}</div>
                  )}
                </div>
                <div style={{ padding: '15px 16px 17px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)' }}>{formatCategoryLabel(s.category)}</div>
                    {s.stage && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 6, height: 6, borderRadius: 99, background: '#2F6B4F' }} />
                        <div style={{ fontSize: 11, color: '#2F6B4F' }}>{s.stage}</div>
                      </div>
                    )}
                  </div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 21, lineHeight: 1.2, margin: '7px 0 6px', color: 'var(--ayna-text)' }}>{s.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--ayna-text-muted)', lineHeight: 1.5 }}>{s.description || s.tagline}</div>
                  {s.badges?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                      {s.badges.map((t) => (
                        <div key={t} style={{ background: 'var(--ayna-chip-bg)', color: 'var(--ayna-accent-dark)', fontSize: 11, padding: '5px 10px', borderRadius: 99 }}>{t}</div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                    <div style={{ flex: 1, background: 'var(--ayna-cta-bg)', color: 'var(--ayna-cta-text)', fontWeight: 600, fontSize: 13, padding: 11, borderRadius: 99, textAlign: 'center', cursor: 'pointer' }}>
                      {s.productReleased ? 'View brand' : 'Join waitlist'}
                    </div>
                    <div style={{ width: 44, border: '1px solid var(--ayna-border)', borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" style={{ stroke: 'var(--ayna-brown)' }}><path d="M12 20s-7-4.5-7-9.4A4.1 4.1 0 0 1 12 7.6a4.1 4.1 0 0 1 7 3c0 4.9-7 9.4-7 9.4Z" /></svg>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div key={s.id} onClick={openLink} style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 22, overflow: 'hidden', display: 'flex', cursor: openLink ? 'pointer' : 'default' }}>
                <div style={{ width: 120, flex: 'none', background: s.image ? undefined : 'linear-gradient(160deg,#F3EADC,#EFE3D2)', backgroundImage: s.image ? `url(${s.image})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                <div style={{ flex: 1, minWidth: 0, padding: '14px 15px' }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)' }}>{formatCategoryLabel(s.category)}</div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 19, lineHeight: 1.2, margin: '6px 0 5px', color: 'var(--ayna-text)' }}>{s.name}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--ayna-text-muted)', lineHeight: 1.45 }}>{s.description || s.tagline}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    {(s.badges || []).slice(0, 2).map((t) => (
                      <div key={t} style={{ background: 'var(--ayna-chip-bg)', color: 'var(--ayna-accent-dark)', fontSize: 10.5, padding: '4px 9px', borderRadius: 99 }}>{t}</div>
                    ))}
                    {s.stage && <div style={{ fontSize: 11, color: '#2F6B4F' }}>{s.stage}</div>}
                  </div>
                </div>
              </div>
            );
          })}

          <div style={{ border: '1px dashed var(--ayna-border)', borderRadius: 22, padding: 18, textAlign: 'center' }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, marginBottom: 4, color: 'var(--ayna-text)' }}>Know a founder?</div>
            <div style={{ fontSize: 12.5, color: 'var(--ayna-text-muted)', lineHeight: 1.5, marginBottom: 13 }}>We review every submission by hand.</div>
            <div style={{ display: 'inline-block', border: '1px solid var(--ayna-border)', background: 'var(--ayna-surface)', color: 'var(--ayna-brown)', fontWeight: 600, fontSize: 12.5, padding: '9px 16px', borderRadius: 99, cursor: 'pointer' }}>Submit a brand</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- Preferences ---------------------------- */

function PreferencesScreen({ onBack, theme, onToggleTheme }) {
  const [notif, setNotif] = useState(true);
  const [updates, setUpdates] = useState(true);
  const [news, setNews] = useState(false);
  const [channel, setChannel] = useState('push');

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <BackHeader title="Preferences" onBack={onBack} />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '0 20px 30px' }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, lineHeight: 1.25, margin: '4px 0 6px', color: 'var(--ayna-heading)' }}>How Ayna reaches you.</div>
        <div style={{ fontSize: 13, color: 'var(--ayna-text-muted)', lineHeight: 1.55, marginBottom: 22 }}>Everything here is off by default and reversible.</div>

        <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 22, padding: '4px 18px' }}>
          <ToggleRow first title="Notifications" sub="Recalls and safety flags on things you own." on={notif} onClick={() => setNotif((v) => !v)} />
          <ToggleRow title="Updates" sub="New matches and restocks, weekly digest." on={updates} onClick={() => setUpdates((v) => !v)} />
          <ToggleRow title="Night mode" sub="Dim the app after sunset." on={theme === 'dark'} onClick={onToggleTheme} />
          <ToggleRow title="Join newsletter" sub="The Mirror — one letter a month, no products pushed." on={news} onClick={() => setNews((v) => !v)} />
        </div>

        {news && (
          <div style={{ marginTop: 14, borderRadius: 22, padding: 18, background: 'linear-gradient(135deg,#FFF6E6,#FFEFD6)', border: '1px solid #F1DFC2' }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9.5, letterSpacing: '1.4px', textTransform: 'uppercase', color: '#C0761F' }}>You're in</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 19, lineHeight: 1.3, margin: '7px 0 10px', color: '#3A2410' }}>First letter lands Thursday.</div>
          </div>
        )}

        <div style={{ marginTop: 26, fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)', marginBottom: 11 }}>Delivery channel</div>
        <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 22, padding: '5px 18px' }}>
          {[['push', 'Push', null], ['sms', 'Text message', 'VERIFIED'], ['email', 'Email only', null]].map(([key, label, badge], i) => (
            <div key={key} onClick={() => setChannel(key)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '15px 0', borderTop: i === 0 ? 'none' : '1px solid var(--ayna-border)', cursor: 'pointer' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid ' + (channel === key ? 'var(--ayna-cta-bg)' : 'var(--ayna-border)'), flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {channel === key && <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--ayna-cta-bg)' }} />}
              </div>
              <div style={{ flex: 1, fontSize: 14.5, fontWeight: 500, color: 'var(--ayna-text)' }}>{label}</div>
              {badge && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: '.8px', color: 'var(--ayna-text-muted)', border: '1px solid var(--ayna-border)', borderRadius: 99, padding: '3px 7px' }}>{badge}</div>}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, fontSize: 12, color: 'var(--ayna-text-muted)', lineHeight: 1.55, textAlign: 'center', padding: '0 10px' }}>Ayna never sells your health data.</div>
      </div>
    </div>
  );
}

/* ------------------------------ Settings ------------------------------ */

function SettingsScreen({ onBack, onOpenMatchDetail, onSignOut }) {
  const aboutRows = [
    { title: 'How we match you', sub: 'The four inputs, no ad spend involved.', onClick: onOpenMatchDetail },
    { title: 'Our sourcing standards', sub: 'What "third-party tested" means here.' },
    { title: 'Terms & privacy', sub: 'The legal stuff, actually readable.' },
  ];

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <BackHeader title="Settings" onBack={onBack} />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '8px 20px 30px' }}>
        <div style={{ margin: '4px 0 11px', fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)' }}>About Ayna</div>
        <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 22, padding: '0 18px' }}>
          {aboutRows.map((r, i) => (
            <div key={r.title} onClick={r.onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0', borderTop: i === 0 ? 'none' : '1px solid var(--ayna-border)', cursor: r.onClick ? 'pointer' : 'default' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 14.5, color: 'var(--ayna-text)' }}>{r.title}</div>
                <div style={{ fontSize: 12, color: 'var(--ayna-text-muted)', marginTop: 2, lineHeight: 1.45 }}>{r.sub}</div>
              </div>
              <ChevronIcon />
            </div>
          ))}
        </div>

        <div style={{ margin: '24px 0 11px', fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)' }}>Your account</div>
        <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 22, padding: '0 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, fontSize: 14.5, color: 'var(--ayna-text)' }}>Account information</div>
            </div>
            <ChevronIcon />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0', borderTop: '1px solid var(--ayna-border)' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, fontSize: 14.5, color: 'var(--ayna-text)' }}>Privacy & data</div>
              <div style={{ fontSize: 12, color: 'var(--ayna-text-muted)', marginTop: 2, lineHeight: 1.45 }}>Export or delete your intake answers.</div>
            </div>
            <ChevronIcon />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0', borderTop: '1px solid var(--ayna-border)', opacity: 0.55 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, fontSize: 14.5, color: 'var(--ayna-text)' }}>Subscription</div>
              <div style={{ fontSize: 12, color: 'var(--ayna-text-muted)', marginTop: 2, lineHeight: 1.45 }}>Ayna is free while we're in beta.</div>
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: '.9px', color: 'var(--ayna-text-muted)', border: '1px solid var(--ayna-border)', borderRadius: 99, padding: '4px 8px', flex: 'none' }}>COMING SOON</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0', borderTop: '1px solid var(--ayna-border)' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, fontSize: 14.5, color: 'var(--ayna-text)' }}>Contact</div>
              <div style={{ fontSize: 12, color: 'var(--ayna-text-muted)', marginTop: 2 }}>Usually a reply within a day.</div>
            </div>
            <ChevronIcon />
          </div>
        </div>

        <div onClick={onSignOut} style={{ marginTop: 22, textAlign: 'center', padding: '14px 0', border: '1px solid rgba(180,64,42,.3)', borderRadius: 99, color: '#B4402A', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', background: 'var(--ayna-surface)' }}>Sign out</div>
        <div style={{ textAlign: 'center', marginTop: 16, fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '1.2px', color: 'var(--ayna-text-muted)' }}>AYNA 0.9.4 · BETA</div>
      </div>
    </div>
  );
}

/* --------------------------- How we match you --------------------------- */

const MATCH_FACTORS = [
  { n: '01', title: 'Ingredient match', weight: '35%', body: 'How closely a product’s actives line up with what you flagged during intake.', pct: 100 },
  { n: '02', title: 'Evidence quality', weight: '28%', body: 'Peer-reviewed research and clinical guidance behind the formulation.', pct: 80 },
  { n: '03', title: 'Brand affinity', weight: '22%', body: 'What you’ve saved, viewed and kept over time — not what brands pay for.', pct: 63 },
  { n: '04', title: 'Community rating', weight: '15%', body: 'Verified-purchase reviews from people with a similar profile to yours.', pct: 43 },
];

function HowWeMatchScreen({ onBack }) {
  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: '#242A52', color: '#FFF9F2' }}>
      <BackHeader title="How we match you" onBack={onBack} dark />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '10px 22px 34px' }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 32, lineHeight: 1.15, marginBottom: 12 }}>No ad spend<br />in the math.</div>
        <div style={{ fontSize: 13.5, color: 'rgba(255,249,242,.72)', lineHeight: 1.6, marginBottom: 26 }}>Your match score is four weighted inputs. Brands cannot pay to move any of them.</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {MATCH_FACTORS.map((f) => (
            <div key={f.n} style={{ background: 'rgba(255,249,242,.08)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 18, padding: '15px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#FFC774', flex: 'none' }}>{f.n}</div>
                <div style={{ flex: 1, fontWeight: 600, fontSize: 14.5 }}>{f.title}</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 19, color: '#FFC774', flex: 'none' }}>{f.weight}</div>
              </div>
              <div style={{ fontSize: 12.5, color: 'rgba(255,249,242,.7)', lineHeight: 1.5, margin: '8px 0 11px' }}>{f.body}</div>
              <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,.14)', overflow: 'hidden' }}>
                <div style={{ width: `${f.pct}%`, height: '100%', background: '#FFC774' }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 22, border: '1px dashed rgba(255,255,255,.24)', borderRadius: 18, padding: 16 }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, marginBottom: 6 }}>Sponsored items exist.</div>
          <div style={{ fontSize: 12.5, color: 'rgba(255,249,242,.7)', lineHeight: 1.55 }}>
            They're labelled <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10.5, letterSpacing: '.8px', color: '#FFC774' }}>SPONSORED</span> and excluded from your score entirely.
          </div>
        </div>
        <div style={{ marginTop: 18, background: '#FFC774', color: '#231A12', fontWeight: 600, fontSize: 14, padding: 14, borderRadius: 99, textAlign: 'center', cursor: 'pointer' }} onClick={onBack}>Review my inputs</div>
      </div>
    </div>
  );
}

/* ------------------------------- Orchestrator ------------------------------- */

const PARENT_OF = {
  shopper: 'hub',
  startups: 'hub',
  preferences: 'hub',
  settings: 'hub',
  matchDetail: 'settings',
};

export default function ProfileFlow({
  onClose,
  theme,
  onToggleTheme,
  onSignOut,
  name = 'You',
  ecosystemCount = 0,
  savedCount = 0,
  quizAnswers = null,
  myProducts = [],
  savedProducts = {},
  onViewAlternative,
  onBrowse,
}) {
  const [screen, setScreen] = useState('hub');
  const initial = (name || 'Y').trim().charAt(0).toUpperCase() || 'Y';

  const goBack = () => setScreen(PARENT_OF[screen] || 'hub');

  let body;
  if (screen === 'hub') {
    body = (
      <ProfileHub
        onOpen={setScreen}
        onClose={onClose}
        onSignOut={onSignOut}
        name={name}
        initial={initial}
        memberSince="Member since 2026"
        ecosystemCount={ecosystemCount}
        savedCount={savedCount}
        profileFilledPct={86}
      />
    );
  } else if (screen === 'shopper') {
    body = (
      <ShopperProfileScreen
        onBack={goBack}
        quizAnswers={quizAnswers}
        myProducts={myProducts}
        savedProducts={savedProducts}
        onViewAlternative={onViewAlternative ? (product) => { onClose(); onViewAlternative(product); } : undefined}
        onBrowse={onBrowse ? () => { onClose(); onBrowse(); } : undefined}
      />
    );
  } else if (screen === 'startups') {
    body = <EarlyStageScreen onBack={goBack} quizAnswers={quizAnswers} />;
  } else if (screen === 'preferences') {
    body = <PreferencesScreen onBack={goBack} theme={theme} onToggleTheme={onToggleTheme} />;
  } else if (screen === 'settings') {
    body = <SettingsScreen onBack={goBack} onOpenMatchDetail={() => setScreen('matchDetail')} onSignOut={onSignOut} />;
  } else if (screen === 'matchDetail') {
    body = <HowWeMatchScreen onBack={goBack} />;
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 55, background: 'var(--ayna-bg)', display: 'flex', animation: 'ay-page .25s ease-out' }}>
      {body}
    </div>
  );
}
