import { useEffect, useMemo, useState } from 'react';
import { ALL_PRODUCTS } from '../../../data/products.js';
import { getSupabaseClient } from '../../../utils/supabaseClient.js';
import { getBrandAffinity, getCategoryInsights, getSafetyAlerts } from '../../utils/shopperProfileData.js';
import { ROUTINE_BUCKET_LABELS, ROUTINE_BUCKETS, useRoutine } from '../../hooks/useRoutine.js';
import { getProfileCompletionPct } from '../../utils/profileCompleteness.js';
import {
  NotSignedInError,
  fetchNotificationPreferences,
  patchNotificationPreferences,
  sendPhoneVerificationCode,
  confirmPhoneVerificationCode,
} from '../../utils/notificationPreferencesApi.js';
import { fetchDataExport } from '../../utils/dataExportApi.js';

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

// Line icons for the "Your account" rows, replacing the original emoji
// placeholders (🛍️ ✨ 🔔 ⚙️) with the same stroke-icon language used
// everywhere else in this screen (BackIcon, ChevronIcon).
function AccountIcon({ type }) {
  const props = {
    width: 19,
    height: 19,
    viewBox: '0 0 24 24',
    fill: 'none',
    strokeWidth: 1.75,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    style: { stroke: 'var(--ayna-accent-dark)' },
  };
  if (type === 'shopper') {
    return (
      <svg {...props}>
        <path d="M7 9h10l-1 11H8L7 9Z" />
        <path d="M9.5 9V7a2.5 2.5 0 0 1 5 0v2" />
      </svg>
    );
  }
  if (type === 'startups') {
    return (
      <svg {...props}>
        <polyline points="4 16 9 11 13 15 20 7" />
        <polyline points="14 7 20 7 20 13" />
      </svg>
    );
  }
  if (type === 'preferences') {
    return (
      <svg {...props}>
        <path d="M18 16v-5a6 6 0 1 0-12 0v5l-2 3h16l-2-3Z" />
        <path d="M9.5 21a2.5 2.5 0 0 0 5 0" />
      </svg>
    );
  }
  return (
    <svg {...props}>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 3v2.5M12 18.5V21M21 12h-2.5M5.5 12H3M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8M18.4 18.4l-1.8-1.8M7.4 7.4 5.6 5.6" />
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

function ProfileHub({ onOpen, onClose, name, initial, memberSince, ecosystemCount, savedCount, profileFilledPct, shopperAlertsCount, onEditProfile }) {
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
            { value: `${profileFilledPct}%`, label: 'Profile filled', onClick: profileFilledPct < 100 ? onEditProfile : undefined },
          ].map((s) => (
            <div
              key={s.label}
              onClick={s.onClick}
              role={s.onClick ? 'button' : undefined}
              aria-label={s.onClick ? 'Finish your profile' : undefined}
              style={{ flex: 1, background: 'rgba(255,249,242,.11)', border: '1px solid rgba(255,255,255,.16)', borderRadius: 16, padding: '11px 12px', cursor: s.onClick ? 'pointer' : 'default' }}
            >
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 23, color: '#FFC774' }}>{s.value}</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8.5, letterSpacing: '1.1px', textTransform: 'uppercase', color: 'rgba(255,249,242,.66)', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, padding: '22px 20px 26px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)', marginBottom: 2 }}>Your account</div>

        {[
          { key: 'shopper', title: 'Shopper Profile', sub: 'Alerts, routine, brand affinity', badge: shopperAlertsCount > 0 ? `${shopperAlertsCount} NEW` : null },
          { key: 'startups', title: 'Early Stage Startups', sub: 'Emerging brands worth backing' },
          { key: 'preferences', title: 'Preferences', sub: 'Notifications, updates, night mode' },
          { key: 'settings', title: 'Settings', sub: 'Account, privacy, about Ayna' },
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
            <div style={{ width: 42, height: 42, borderRadius: 14, flex: 'none', background: 'var(--ayna-chip-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AccountIcon type={row.key} />
            </div>
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
            <div style={{ display: 'flex', gap: 7, overflowX: 'auto', touchAction: 'pan-x', paddingBottom: 2, marginBottom: 14, scrollbarWidth: 'none' }}>
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

        <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 16, scrollbarWidth: 'none' }}>
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

// Ayna's confirmed brand partnerships live only on the web today
// (BrandPartners.jsx at aynahealth.co/startups) — Settings links straight
// out to that real page (see SettingsScreen's "About Ayna" rows) rather
// than duplicating its hardcoded partner list in a native screen, so it
// never drifts out of sync with the actual list.
const BRAND_PARTNERSHIPS_URL = 'https://www.aynahealth.co/startups';

/* ---------------------------- Preferences ---------------------------- */

// Substack has no API to subscribe someone by a toggle — this opens the
// real publication's public subscribe page instead, the same
// window.open(url, '_blank', 'noopener,noreferrer') pattern the Startups
// hub already uses for its external links.
const NEWSLETTER_URL = 'https://aynahealth.substack.com/subscribe';
// There's no webhook back from Substack telling the app someone actually
// completed the subscribe form on their site, so "Subscribed" is only ever
// shown once the user explicitly says so — a "Yes, I'm in" tap after
// they've been sent to the real subscribe page — rather than assumed the
// moment they tap through, which they might not follow through on. Kept
// entirely client-side (localStorage), independent of the real
// notification-preferences backend below: that backend has no way to know
// whether someone actually subscribed on Substack either.
const NEWSLETTER_CONFIRMED_KEY = 'ayna_mobile_newsletter_confirmed_v1';

function loadNewsletterConfirmed() {
  try { return localStorage.getItem(NEWSLETTER_CONFIRMED_KEY) === '1'; } catch { return false; }
}

function ExternalLinkIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: 'var(--ayna-text-faint)', flex: 'none' }}>
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}

// Shared with the phone-verify panel below — same error vocabulary as
// src/components/PhoneVerification.jsx's ERROR_MESSAGES, since both call
// the same /api/phone-verify-send and /api/phone-verify-confirm routes.
const PHONE_ERROR_MESSAGES = {
  invalid_phone_number: 'Please enter a valid 10-digit phone number.',
  rate_limited: 'Too many attempts. Please try again in an hour.',
  twilio_send_failed: "We couldn't send a code right now. Please try again.",
  twilio_check_failed: "We couldn't check that code right now. Please try again.",
  invalid_or_expired_code: 'That code is wrong or expired. Please try again.',
  code_required: 'Please enter the code we texted you.',
  phone_already_linked: 'That phone number is already linked to another account.',
  too_many_attempts: 'Too many attempts. Please request a new code.',
  auth_required: 'Please sign in first.',
  not_signed_in: 'Please sign in first.',
};

function friendlyPhoneError(code) {
  return PHONE_ERROR_MESSAGES[code] || 'Something went wrong. Please try again.';
}

const RESEND_COOLDOWN_SECONDS = 30;

// Two-step phone verification, reusing the same real endpoints as the
// desktop flow (src/components/PhoneVerification.jsx) — not a separate
// implementation, just this app's own visual language.
function PhoneVerifyPanel({ onBack, onVerified }) {
  const [step, setStep] = useState('phone'); // 'phone' | 'code'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const sendCode = async () => {
    setError('');
    setSending(true);
    try {
      await sendPhoneVerificationCode(phoneNumber);
      setStep('code');
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (e) {
      setError(friendlyPhoneError(e.code || e.message));
    } finally {
      setSending(false);
    }
  };

  const confirmCode = async () => {
    setError('');
    setSending(true);
    try {
      await confirmPhoneVerificationCode(phoneNumber, code);
      onVerified(phoneNumber);
    } catch (e) {
      setError(friendlyPhoneError(e.code || e.message));
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <BackHeader title="Verify your phone" onBack={onBack} />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '0 20px 30px' }}>
        {step === 'phone' ? (
          <>
            <div style={{ fontSize: 13.5, color: 'var(--ayna-text-muted)', lineHeight: 1.55, marginBottom: 18 }}>
              We'll text a 6-digit code to confirm this number before texts can be your delivery channel.
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ayna-text)', marginBottom: 7 }}>Phone number</div>
            <input
              type="tel"
              inputMode="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="(555) 555-5555"
              style={{ width: '100%', boxSizing: 'border-box', padding: '14px 16px', borderRadius: 14, border: '1px solid var(--ayna-border)', fontSize: 15, color: 'var(--ayna-text)', background: 'var(--ayna-surface)', outline: 'none' }}
            />
            {error && <div style={{ color: '#B4402A', fontSize: 12.5, marginTop: 10 }}>{error}</div>}
            <div
              onClick={() => !sending && phoneNumber.trim() && sendCode()}
              style={{ marginTop: 18, textAlign: 'center', background: sending || !phoneNumber.trim() ? 'var(--ayna-border)' : 'var(--ayna-cta-bg)', color: sending || !phoneNumber.trim() ? 'var(--ayna-text-muted)' : 'var(--ayna-cta-text)', fontWeight: 600, fontSize: 14.5, padding: 15, borderRadius: 99, cursor: sending || !phoneNumber.trim() ? 'not-allowed' : 'pointer' }}
            >
              {sending ? 'Sending…' : 'Send code'}
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 13.5, color: 'var(--ayna-text-muted)', lineHeight: 1.55, marginBottom: 18 }}>
              We texted a code to {phoneNumber}. Enter it below.
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ayna-text)', marginBottom: 7 }}>Verification code</div>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              style={{ width: '100%', boxSizing: 'border-box', padding: '14px 16px', borderRadius: 14, border: '1px solid var(--ayna-border)', fontSize: 20, letterSpacing: 4, textAlign: 'center', color: 'var(--ayna-text)', background: 'var(--ayna-surface)', outline: 'none' }}
            />
            {error && <div style={{ color: '#B4402A', fontSize: 12.5, marginTop: 10 }}>{error}</div>}
            <div
              onClick={() => !sending && code.length === 6 && confirmCode()}
              style={{ marginTop: 18, textAlign: 'center', background: sending || code.length !== 6 ? 'var(--ayna-border)' : 'var(--ayna-cta-bg)', color: sending || code.length !== 6 ? 'var(--ayna-text-muted)' : 'var(--ayna-cta-text)', fontWeight: 600, fontSize: 14.5, padding: 15, borderRadius: 99, cursor: sending || code.length !== 6 ? 'not-allowed' : 'pointer' }}
            >
              {sending ? 'Verifying…' : 'Verify'}
            </div>
            <div
              onClick={() => cooldown === 0 && !sending && sendCode()}
              style={{ marginTop: 16, textAlign: 'center', fontSize: 12.5, color: cooldown === 0 ? 'var(--ayna-brown)' : 'var(--ayna-text-faint)', cursor: cooldown === 0 ? 'pointer' : 'default' }}
            >
              {cooldown === 0 ? 'Resend code' : `Resend code in ${cooldown}s`}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const PREFERENCES_ERROR_MESSAGES = {
  ...PHONE_ERROR_MESSAGES,
  load_failed: "Couldn't load your preferences. Try again shortly.",
  save_failed: "That didn't save — try again.",
  phone_not_verified: 'Verify your phone first.',
};

function friendlyPreferencesError(code) {
  return PREFERENCES_ERROR_MESSAGES[code] || "That didn't save — try again.";
}

// Real backend: GET/PATCH api/notification-preferences.js (a real Supabase
// table, RLS-scoped to the signed-in user). Each toggle updates optimistic
// local state immediately, then rolls back with a toast if the PATCH fails.
// Mobile has no real Supabase sign-in flow yet (see useEcosystemSession.js),
// so until that exists this correctly shows "sign in" rather than pretending
// to work — the API and table are real and ready the moment mobile auth is.
// Join newsletter is deliberately NOT part of this backend-synced list: it
// links out to the real Substack subscribe page instead (see NEWSLETTER_URL
// above) rather than a toggle that can't actually enroll anyone.
function PreferencesScreen({ onBack, theme, onToggleTheme }) {
  const [loadState, setLoadState] = useState('loading'); // 'loading' | 'signed_out' | 'error' | 'ready'
  const [prefs, setPrefs] = useState(null);
  const [toast, setToast] = useState('');
  const [phoneVerifyOpen, setPhoneVerifyOpen] = useState(false);
  // Session-only nudge to ask "did you subscribe?" after sending them to
  // Substack — not persisted, since it's just prompting for the confirm
  // tap below, not the subscribed state itself.
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);
  const [newsletterConfirmed, setNewsletterConfirmed] = useState(loadNewsletterConfirmed);

  // Initial state is already 'loading', so the mount effect below doesn't
  // need to (and per the react-hooks lint rule, shouldn't) set it again
  // synchronously — only the retry button, which isn't running inside an
  // effect, does that explicitly.
  const fetchPrefs = () => {
    fetchNotificationPreferences()
      .then((data) => { setPrefs(data); setLoadState('ready'); })
      .catch((e) => setLoadState(e instanceof NotSignedInError ? 'signed_out' : 'error'));
  };

  useEffect(() => { fetchPrefs(); }, []);

  const retry = () => {
    setLoadState('loading');
    fetchPrefs();
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3500);
  };

  const patchField = (apiField, value, clientField) => {
    const previous = prefs;
    setPrefs((p) => ({ ...p, [clientField]: value }));
    patchNotificationPreferences({ [apiField]: value }).catch((e) => {
      setPrefs(previous);
      showToast(friendlyPreferencesError(e.code || e.message));
    });
  };

  const handleToggleTheme = () => {
    onToggleTheme();
    // Best-effort mirror only — the real theme toggle above is what
    // actually changes the app; a failed save here never blocks or rolls
    // back the visual flip, it just leaves the stored value stale.
    patchNotificationPreferences({ night_mode_enabled: theme !== 'dark' }).catch(() => {});
  };

  const selectChannel = (key) => {
    if (!prefs || key === prefs.deliveryChannel) return;
    if (key === 'sms' && !prefs.phoneVerified) {
      setPhoneVerifyOpen(true);
      return;
    }
    patchField('delivery_channel', key, 'deliveryChannel');
  };

  const handleJoinNewsletter = () => {
    window.open(NEWSLETTER_URL, '_blank', 'noopener,noreferrer');
    setAwaitingConfirm(true);
  };

  const handleConfirmSubscribed = (e) => {
    e.stopPropagation();
    setAwaitingConfirm(false);
    setNewsletterConfirmed(true);
    try { localStorage.setItem(NEWSLETTER_CONFIRMED_KEY, '1'); } catch { /* private mode */ }
  };

  if (phoneVerifyOpen) {
    return (
      <PhoneVerifyPanel
        onBack={() => setPhoneVerifyOpen(false)}
        onVerified={() => {
          setPhoneVerifyOpen(false);
          setPrefs((p) => (p ? { ...p, phoneVerified: true, deliveryChannel: 'sms' } : p));
          patchNotificationPreferences({ delivery_channel: 'sms' }).catch((e) => {
            showToast(friendlyPreferencesError(e.code || e.message));
          });
        }}
      />
    );
  }

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <BackHeader title="Preferences" onBack={onBack} />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '0 20px 30px' }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, lineHeight: 1.25, margin: '4px 0 6px', color: 'var(--ayna-heading)' }}>How Ayna reaches you.</div>
        <div style={{ fontSize: 13, color: 'var(--ayna-text-muted)', lineHeight: 1.55, marginBottom: 22 }}>Everything here is off by default and reversible.</div>

        {/* Always visible regardless of the notification-preferences backend's
            load state below — Substack subscription has nothing to do with
            being signed into Ayna. */}
        <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 22, padding: '4px 18px', marginBottom: 20 }}>
          <div
            onClick={handleJoinNewsletter}
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '17px 0', cursor: 'pointer' }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--ayna-text)' }}>Join newsletter</div>
                {newsletterConfirmed && (
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#2F6B4F', background: 'var(--ayna-chip-bg)', padding: '2px 8px', borderRadius: 99 }}>Subscribed</div>
                )}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ayna-text-muted)', marginTop: 3, lineHeight: 1.45 }}>
                {newsletterConfirmed ? "You're on the list — The Mirror lands monthly." : 'The Mirror — one letter a month, no products pushed.'}
              </div>
            </div>
            <ExternalLinkIcon />
          </div>
          {awaitingConfirm && !newsletterConfirmed && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '0 0 14px' }}>
              <div style={{ fontSize: 12, color: 'var(--ayna-text-muted)' }}>Subscribed on Substack?</div>
              <div
                onClick={handleConfirmSubscribed}
                style={{ fontSize: 12, fontWeight: 700, color: '#2F6B4F', cursor: 'pointer', padding: '6px 12px', background: 'var(--ayna-chip-bg)', borderRadius: 99, flex: 'none' }}
              >
                Yes, I'm in
              </div>
            </div>
          )}
        </div>

        {loadState === 'loading' && (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--ayna-text-muted)', fontSize: 13 }}>Loading your preferences…</div>
        )}

        {loadState === 'signed_out' && (
          <div style={{ border: '1px dashed var(--ayna-border)', borderRadius: 20, padding: 18, fontSize: 13, color: 'var(--ayna-text-muted)', lineHeight: 1.55, textAlign: 'center' }}>
            Sign in to manage how Ayna reaches you — these settings save to your account, not just this device.
          </div>
        )}

        {loadState === 'error' && (
          <div style={{ border: '1px dashed var(--ayna-border)', borderRadius: 20, padding: 18, textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: 'var(--ayna-text-muted)', lineHeight: 1.55, marginBottom: 12 }}>Couldn't load your preferences.</div>
            <div onClick={retry} style={{ display: 'inline-block', background: 'var(--ayna-cta-bg)', color: 'var(--ayna-cta-text)', fontWeight: 600, fontSize: 12.5, padding: '9px 16px', borderRadius: 99, cursor: 'pointer' }}>Try again</div>
          </div>
        )}

        {loadState === 'ready' && prefs && (
          <>
            <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 22, padding: '4px 18px' }}>
              <ToggleRow first title="Notifications" sub="Recalls and safety flags on things you own." on={prefs.notificationsEnabled} onClick={() => patchField('notifications_enabled', !prefs.notificationsEnabled, 'notificationsEnabled')} />
              <ToggleRow title="Updates" sub="New matches and restocks, weekly digest." on={prefs.updatesEnabled} onClick={() => patchField('updates_enabled', !prefs.updatesEnabled, 'updatesEnabled')} />
              <ToggleRow title="Night mode" sub="Dim the app after sunset." on={theme === 'dark'} onClick={handleToggleTheme} />
            </div>

            <div style={{ marginTop: 26, fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)', marginBottom: 11 }}>Delivery channel</div>
            <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 22, padding: '5px 18px' }}>
              {[
                ['push', 'Push', null],
                ['sms', 'Text message', prefs.phoneVerified ? 'VERIFIED' : 'VERIFY TO USE'],
                ['email', 'Email only', null],
              ].map(([key, label, badge], i) => (
                <div key={key} onClick={() => selectChannel(key)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '15px 0', borderTop: i === 0 ? 'none' : '1px solid var(--ayna-border)', cursor: 'pointer' }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid ' + (prefs.deliveryChannel === key ? 'var(--ayna-cta-bg)' : 'var(--ayna-border)'), flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {prefs.deliveryChannel === key && <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--ayna-cta-bg)' }} />}
                  </div>
                  <div style={{ flex: 1, fontSize: 14.5, fontWeight: 500, color: 'var(--ayna-text)' }}>{label}</div>
                  {badge && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: '.8px', color: 'var(--ayna-text-muted)', border: '1px solid var(--ayna-border)', borderRadius: 99, padding: '3px 7px' }}>{badge}</div>}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20, fontSize: 12, color: 'var(--ayna-text-muted)', lineHeight: 1.55, textAlign: 'center', padding: '0 10px' }}>Ayna never sells your health data.</div>
          </>
        )}

        {toast && (
          <div style={{ position: 'fixed', left: 20, right: 20, bottom: 24, background: '#B4402A', color: '#FFF9F2', fontSize: 12.5, fontWeight: 600, padding: '12px 16px', borderRadius: 14, textAlign: 'center', boxShadow: '0 14px 30px -12px rgba(180,64,42,.5)' }}>
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ Settings ------------------------------ */

function SettingsScreen({ onBack, onOpenHowItWorks, onOpenAboutAyna, onOpenContact, onOpenAccountInfo, onOpenPrivacyData, onOpenLegal, authUser, onSignOut, onSignIn }) {
  const aboutRows = [
    { title: 'How it works', sub: 'Nothing reaches you unchecked.', onClick: onOpenHowItWorks },
    { title: 'About ayna', sub: 'No mystery box.', onClick: onOpenAboutAyna },
    { title: 'Brand partnership', sub: 'Brands ayna actually works with.', onClick: () => window.open(BRAND_PARTNERSHIPS_URL, '_blank', 'noopener,noreferrer'), external: true },
  ];

  // Same real phone_numbers read AccountInfoScreen already does, mirrored
  // here just so this row's preview line can show the masked number
  // alongside the email instead of email alone.
  const [phone, setPhone] = useState('');
  useEffect(() => {
    let cancelled = false;
    const supabase = getSupabaseClient();
    if (!supabase || !authUser?.id) return undefined;
    supabase
      .from('phone_numbers')
      .select('phone_number')
      .eq('user_id', authUser.id)
      .maybeSingle()
      .then(({ data }) => { if (!cancelled) setPhone(data?.phone_number || ''); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [authUser?.id]);
  const accountPreview = [authUser?.email, phone ? maskPhone(phone) : ''].filter(Boolean).join(' · ');

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
              {r.external ? <ExternalLinkIcon /> : <ChevronIcon />}
            </div>
          ))}
        </div>

        <div style={{ margin: '24px 0 11px', fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)' }}>Your account</div>
        <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 22, padding: '0 18px' }}>
          <div onClick={onOpenAccountInfo} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0', cursor: 'pointer' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, fontSize: 14.5, color: 'var(--ayna-text)' }}>Account information</div>
              {accountPreview && (
                <div style={{ fontSize: 12, color: 'var(--ayna-text-muted)', marginTop: 2 }}>{accountPreview}</div>
              )}
            </div>
            <ChevronIcon />
          </div>
          <div onClick={onOpenPrivacyData} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0', borderTop: '1px solid var(--ayna-border)', cursor: 'pointer' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, fontSize: 14.5, color: 'var(--ayna-text)' }}>Privacy & data</div>
              <div style={{ fontSize: 12, color: 'var(--ayna-text-muted)', marginTop: 2, lineHeight: 1.45 }}>Policies, what we hold, exports and deletion.</div>
            </div>
            <ChevronIcon />
          </div>
          <div onClick={onOpenLegal} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0', borderTop: '1px solid var(--ayna-border)', cursor: 'pointer' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, fontSize: 14.5, color: 'var(--ayna-text)' }}>Legal</div>
              <div style={{ fontSize: 12, color: 'var(--ayna-text-muted)', marginTop: 2, lineHeight: 1.45 }}>Policies, terms and licences.</div>
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
          <div onClick={onOpenContact} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0', borderTop: '1px solid var(--ayna-border)', cursor: 'pointer' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, fontSize: 14.5, color: 'var(--ayna-text)' }}>Contact</div>
              <div style={{ fontSize: 12, color: 'var(--ayna-text-muted)', marginTop: 2 }}>Usually a reply within a day.</div>
            </div>
            <ChevronIcon />
          </div>
        </div>

        {authUser ? (
          <div onClick={onSignOut} style={{ marginTop: 22, textAlign: 'center', padding: '14px 0', border: '1px solid rgba(180,64,42,.3)', borderRadius: 99, color: '#B4402A', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', background: 'var(--ayna-surface)' }}>Sign out</div>
        ) : (
          <div onClick={onSignIn} style={{ marginTop: 22, textAlign: 'center', padding: '14px 0', border: '1px solid var(--ayna-border)', borderRadius: 99, color: 'var(--ayna-heading)', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', background: 'var(--ayna-surface)' }}>Sign in</div>
        )}
        <div style={{ textAlign: 'center', marginTop: 16, fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '1.2px', color: 'var(--ayna-text-muted)' }}>AYNA 0.9.4 · BETA</div>
      </div>
    </div>
  );
}

/* ------------------------------ Privacy & data ------------------------------ */

const DELETE_ACCOUNT_MAILTO = 'mailto:puloma@aynahealth.co?subject=Account%20Deletion%20Request';
const PRIVACY_POLICY_URL = 'https://www.aynahealth.co/privacy-policy';
const TERMS_URL = 'https://www.aynahealth.co/terms-of-use';

// Real toggle: PostHog's own opt-out API (posthog-js exposes
// opt_out_capturing/opt_in_capturing/has_opted_out_capturing — see
// src/main.jsx for the real init). Not a stored per-user backend flag, but
// a genuine SDK call, not invented state — and this app has no analytics
// consent UI anywhere yet, so this is the first place it's wired up.
// window.posthog may be undefined if VITE_PUBLIC_POSTHOG_KEY isn't set
// (e.g. this dev environment) — every call below is guarded for that.
function isAnalyticsOptedOut() {
  try { return typeof window !== 'undefined' && window.posthog?.has_opted_out_capturing?.() === true; } catch { return false; }
}

function PrivacyDataScreen({ onBack, onOpenManageData }) {
  const [analyticsOptedOut, setAnalyticsOptedOut] = useState(isAnalyticsOptedOut);

  const toggleAnalytics = () => {
    const nextOptedOut = !analyticsOptedOut;
    setAnalyticsOptedOut(nextOptedOut);
    try {
      if (nextOptedOut) window.posthog?.opt_out_capturing?.();
      else window.posthog?.opt_in_capturing?.();
    } catch { /* posthog not initialized in this environment */ }
  };

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <BackHeader title="Privacy & data" onBack={onBack} />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '8px 20px 30px' }}>
        <div style={{ fontSize: 13.5, color: 'var(--ayna-text-muted)', lineHeight: 1.6, marginBottom: 20 }}>
          Your health answers are the most sensitive thing you give us. Here is everything we hold, and every way to take it back.
        </div>

        <div style={{ margin: '0 0 11px', fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)' }}>Your data</div>
        <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 22, padding: '0 18px' }}>
          <AccountRow
            title="Manage my data"
            sub="See what we hold — account details, intake answers, saved products."
            borderTop={false}
            onClick={onOpenManageData}
          />
          <AccountRow title="Download my data" sub="A full export of your account and intake answers." onClick={onOpenManageData} />
          <AccountRow
            title={<span style={{ color: '#B4402A' }}>Delete my account & data</span>}
            sub="Email us and we'll process it within a week — nothing kept after."
            onClick={() => window.open(DELETE_ACCOUNT_MAILTO, '_blank')}
          />
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--ayna-text-faint)', lineHeight: 1.55, marginTop: 9, padding: '0 4px' }}>
          Deletion removes your account and health answers from our active systems. We may keep limited records where the law requires it — never your health data.
        </div>

        <div style={{ margin: '24px 0 11px', fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)' }}>What you share</div>
        <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 22, padding: '4px 18px' }}>
          <ToggleRow
            first
            title="Share data for analytics"
            sub="Anonymised product usage, so we can see which screens confuse people. Never your health answers."
            on={!analyticsOptedOut}
            onClick={toggleAnalytics}
          />
        </div>

        <div style={{ marginTop: 14, background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 22, padding: '16px 18px' }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9.5, letterSpacing: '1.3px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)', marginBottom: 8 }}>How AI is used</div>
          <div style={{ fontSize: 12.5, color: 'var(--ayna-text-muted)', lineHeight: 1.6 }}>
            Ask Ayna and match explanations are powered by a third-party AI provider (Anthropic). Your questions and relevant profile details are shared with them to generate a response — never sold, and never used to train anyone else's model.
          </div>
          <div onClick={() => window.open(PRIVACY_POLICY_URL, '_blank', 'noopener,noreferrer')} style={{ fontSize: 12.5, color: 'var(--ayna-heading)', fontWeight: 600, marginTop: 10, cursor: 'pointer' }}>
            Read the full privacy policy
          </div>
        </div>

        <div style={{ fontSize: 11.5, color: 'var(--ayna-text-faint)', lineHeight: 1.55, marginTop: 16, padding: '0 4px' }}>
          Privacy questions? Email <a href="mailto:puloma@aynahealth.co">puloma@aynahealth.co</a>.
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- Legal ---------------------------------- */

function LegalScreen({ onBack }) {
  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <BackHeader title="Legal" onBack={onBack} />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '8px 20px 30px' }}>
        <div style={{ margin: '4px 0 11px', fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)' }}>Policies</div>
        <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 22, padding: '0 18px' }}>
          <AccountRow
            title="Privacy Policy"
            sub="How we collect, use and protect your information."
            borderTop={false}
            onClick={() => window.open(PRIVACY_POLICY_URL, '_blank', 'noopener,noreferrer')}
          />
          <AccountRow
            title="Terms of Service"
            sub="The rules for using ayna."
            onClick={() => window.open(TERMS_URL, '_blank', 'noopener,noreferrer')}
          />
          <AccountRow title="Consumer Health Data Policy" sub="How health data specifically is handled." badge="COMING SOON" dimmed />
        </div>

        <div style={{ margin: '24px 0 11px', fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)' }}>Attributions</div>
        <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 22, padding: '0 18px' }}>
          <AccountRow title="Typefaces" sub="Playfair Display, DM Sans, DM Mono — Google Fonts, SIL Open Font Licence." borderTop={false} />
          <AccountRow title="Open-source licences" sub="A full list of packages and their licences." badge="COMING SOON" dimmed />
          <AccountRow title="Research and data sources" sub="Where ayna's product and safety information comes from." badge="COMING SOON" dimmed />
        </div>

        <div style={{ marginTop: 22, background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 22, padding: '17px 18px' }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9.5, letterSpacing: '1.3px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)', marginBottom: 8 }}>Not medical advice</div>
          <div style={{ fontSize: 12.5, color: 'var(--ayna-text-muted)', lineHeight: 1.6 }}>
            Ayna is a discovery and education tool. Nothing here diagnoses, treats or prevents a condition, and no match replaces a conversation with your clinician.
          </div>
        </div>

        <div style={{ fontSize: 11.5, color: 'var(--ayna-text-faint)', lineHeight: 1.55, marginTop: 16, padding: '0 4px' }}>
          Questions about these policies? Email <a href="mailto:puloma@aynahealth.co">puloma@aynahealth.co</a>.
        </div>

        <div style={{ textAlign: 'center', marginTop: 22, fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '1.2px', color: 'var(--ayna-text-muted)', lineHeight: 1.9 }}>
          AYNA HEALTH, INC.<br />DELAWARE, USA<br />APP 0.9.4 · BETA
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Manage my data ------------------------------ */

function humanizeKey(key) {
  return String(key)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

// Recursive on purpose — the health intake profile in particular nests
// arrays of objects (productHistory, trustRanking, etc.), and this is a
// generic "show me everything" viewer rather than a hand-built form field
// per intake question (that's IntakeScreen's job, not this screen's).
function formatValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) {
    if (!value.length) return '—';
    return value.map((v) => formatValue(v)).join(' · ');
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value).filter(([, v]) => v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0));
    if (!entries.length) return '—';
    return entries.map(([k, v]) => `${humanizeKey(k)}: ${formatValue(v)}`).join(', ');
  }
  return String(value);
}

function DataSection({ title, rows }) {
  const visibleRows = rows.filter(([, v]) => v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0));
  if (!visibleRows.length) return null;
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)', marginBottom: 11 }}>{title}</div>
      <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 22, padding: '0 18px' }}>
        {visibleRows.map(([key, value], i) => (
          <div key={key} style={{ display: 'flex', gap: 14, padding: '13px 0', borderTop: i === 0 ? 'none' : '1px solid var(--ayna-border)' }}>
            <div style={{ flex: 'none', width: 120, fontSize: 12.5, color: 'var(--ayna-text-muted)' }}>{humanizeKey(key)}</div>
            <div style={{ flex: 1, minWidth: 0, fontSize: 13, color: 'var(--ayna-text)', lineHeight: 1.5, wordBreak: 'break-word' }}>{formatValue(value)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function downloadJson(data, filenamePrefix) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Real backend: GET /api/export-data, service-role-authenticated, pulling
// live from the same tables the rest of the app writes to (phone_numbers,
// notification_preferences, health_intakes, user_ecosystems) — nothing
// here is placeholder or cached. Also serves "Download my data": both the
// Privacy & data screen's two separate rows and Account information's
// "Download a copy" row all land here now, rather than three different
// half-built flows for the same real feature.
function ManageDataScreen({ onBack }) {
  const [loadState, setLoadState] = useState('loading'); // 'loading' | 'signed_out' | 'error' | 'ready'
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(false);

  // Initial state is already 'loading', so the mount effect below doesn't
  // need to (and per the react-hooks lint rule, shouldn't) set it again
  // synchronously — only the retry button, which isn't running inside an
  // effect, does that explicitly. Same pattern as PreferencesScreen above.
  const fetchData = () => {
    fetchDataExport()
      .then((result) => { setData(result); setLoadState('ready'); })
      .catch((e) => setLoadState(e instanceof NotSignedInError ? 'signed_out' : 'error'));
  };

  useEffect(() => { fetchData(); }, []);

  const retry = () => {
    setLoadState('loading');
    fetchData();
  };

  const handleDownload = () => data && downloadJson(data, 'ayna-my-data');
  const handleCopy = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* clipboard unavailable in this context — download still works */ }
  };

  const hasAnyData = data && (data.phone || data.healthIntake || (data.savedProducts || []).length || data.notificationPreferences);

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <BackHeader title="Manage my data" onBack={onBack} />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '8px 20px 30px' }}>
        <div style={{ fontSize: 13.5, color: 'var(--ayna-text-muted)', lineHeight: 1.6, marginBottom: 20 }}>
          Every field below is read live from your account — nothing here is cached or approximate.
        </div>

        {loadState === 'loading' && (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--ayna-text-muted)', fontSize: 13 }}>Loading your data…</div>
        )}

        {loadState === 'signed_out' && (
          <div style={{ border: '1px dashed var(--ayna-border)', borderRadius: 20, padding: 18, fontSize: 13, color: 'var(--ayna-text-muted)', lineHeight: 1.55, textAlign: 'center' }}>
            Sign in to see and download your data.
          </div>
        )}

        {loadState === 'error' && (
          <div style={{ border: '1px dashed var(--ayna-border)', borderRadius: 20, padding: 18, textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: 'var(--ayna-text-muted)', lineHeight: 1.55, marginBottom: 12 }}>Couldn't load your data.</div>
            <div onClick={retry} style={{ display: 'inline-block', background: 'var(--ayna-cta-bg)', color: 'var(--ayna-cta-text)', fontWeight: 600, fontSize: 12.5, padding: '9px 16px', borderRadius: 99, cursor: 'pointer' }}>Try again</div>
          </div>
        )}

        {loadState === 'ready' && data && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
              <div onClick={handleDownload} style={{ flex: 1, textAlign: 'center', padding: '13px 0', borderRadius: 99, background: 'var(--ayna-cta-bg)', color: 'var(--ayna-cta-text)', fontWeight: 600, fontSize: 13.5, cursor: 'pointer' }}>
                Download as JSON
              </div>
              <div onClick={handleCopy} style={{ flex: 1, textAlign: 'center', padding: '13px 0', borderRadius: 99, border: '1px solid var(--ayna-border)', color: 'var(--ayna-heading)', fontWeight: 600, fontSize: 13.5, cursor: 'pointer' }}>
                {copied ? 'Copied!' : 'Copy raw data'}
              </div>
            </div>

            <DataSection title="Account" rows={[
              ['email', data.account?.email],
              ['emailVerified', data.account?.emailVerified],
              ['createdAt', data.account?.createdAt],
              ['signInMethods', (data.account?.signInMethods || []).map((m) => m.provider)],
            ]} />

            <DataSection title="Phone" rows={[
              ['number', data.phone?.number],
              ['verified', data.phone?.verified],
            ]} />

            <DataSection title="Notification preferences" rows={Object.entries(data.notificationPreferences || {})} />

            <DataSection title="Health intake" rows={Object.entries(data.healthIntake || {})} />

            <DataSection
              title="Saved products"
              rows={(data.savedProducts || []).map((p, i) => [`item${i + 1}`, { name: p.product_name, brand: p.brand, category: p.category, saved: p.is_saved }])}
            />

            {!hasAnyData && (
              <div style={{ fontSize: 11.5, color: 'var(--ayna-text-faint)', lineHeight: 1.55, padding: '0 4px' }}>
                Nothing else on file yet — this fills in as you use ayna.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* --------------------------- Account information --------------------------- */

function formatMemberSince(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return `Member since ${d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
}

// Same E.164 phone_numbers.phone_number column PhoneVerifyPanel already
// writes to, just masked for display — never shown in full.
function maskPhone(e164) {
  const digits = String(e164 || '').replace(/^\+1/, '').replace(/\D/g, '');
  if (digits.length < 10) return e164 || '';
  return `+1 (${digits.slice(0, 3)}) •••• ${digits.slice(-2)}`;
}

// Same slugs as IntakeScreen.jsx's FSA_HSA_REVERSE — the real stored value
// (quizAnswers.fullHealthIntake.fsaHsa), not a separately-invented field.
const FSA_HSA_LABELS = { fsa: 'FSA', hsa: 'HSA', both: 'Both', none: 'No', unsure: 'Not sure' };

function AccountRow({ title, sub, value, badge, badgeTone = 'neutral', onClick, borderTop = true, dimmed = false }) {
  const TONES = {
    verified: { color: '#3F6B4A', background: 'rgba(63,107,74,.14)' },
    unverified: { color: '#B4402A', background: 'rgba(180,64,42,.1)' },
    neutral: { color: 'var(--ayna-text-muted)', background: 'var(--ayna-chip-bg)' },
  };
  const tone = TONES[badgeTone] || TONES.neutral;
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0',
        borderTop: borderTop ? '1px solid var(--ayna-border)' : 'none',
        cursor: onClick ? 'pointer' : 'default',
        opacity: dimmed ? 0.55 : 1,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: 14.5, color: 'var(--ayna-text)' }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--ayna-text-muted)', marginTop: 2, lineHeight: 1.45 }}>{sub}</div>}
      </div>
      {value && <div style={{ fontSize: 12.5, color: 'var(--ayna-text-muted)', flex: 'none' }}>{value}</div>}
      {badge && (
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8.5, letterSpacing: '.9px', color: tone.color, background: tone.background, borderRadius: 99, padding: '4px 8px', flex: 'none' }}>
          {badge}
        </div>
      )}
      {onClick && <ChevronIcon />}
    </div>
  );
}

// Real fields only: email/phone/password/Google identity from the actual
// Supabase session (src/mobile/hooks/useSupabaseAuth.js), phone number read
// straight from phone_numbers (RLS-scoped to the caller, same table
// PhoneVerifyPanel writes to), age/zip/FSA-HSA from the real intake
// snapshot. Session list and data export have no backend yet, so they're
// marked COMING SOON (same convention as Subscription/Two-step verification
// elsewhere in this file) instead of showing invented devices/exports.
// Delete account mirrors desktop's real flow exactly (App.jsx's delete
// modal): an email request, not a self-serve API that doesn't exist.
function AccountInfoScreen({ onBack, authUser, name, onNameChanged, quizAnswers, onOpenPassword, onEditProfile, onOpenManageData }) {
  const [phoneVerifyOpen, setPhoneVerifyOpen] = useState(false);
  const [phone, setPhone] = useState({ loading: true, number: '', verified: false });
  // Real Supabase auth.updateUser() call, same first_name/full_name fields
  // the email/password signup form writes (see useSupabaseAuth.js) — the
  // one place that data can be set for Google sign-ins, which never get a
  // name-entry step of their own since the OAuth redirect leaves the app
  // entirely. onNameChanged mirrors the save into the app's own session
  // state immediately, so "You" doesn't linger elsewhere until next login.
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState('');

  const saveName = async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed) { setNameError('Please enter a name.'); return; }
    setNameSaving(true);
    setNameError('');
    try {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Not available right now.');
      const { error } = await supabase.auth.updateUser({ data: { first_name: trimmed, full_name: trimmed } });
      if (error) throw error;
      onNameChanged?.(trimmed);
      setEditingName(false);
    } catch (e) {
      setNameError(e.message || "That didn't save — try again.");
    } finally {
      setNameSaving(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const supabase = getSupabaseClient();
    if (!supabase || !authUser?.id) {
      setPhone({ loading: false, number: '', verified: false });
      return undefined;
    }
    supabase
      .from('phone_numbers')
      .select('phone_number, is_verified')
      .eq('user_id', authUser.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setPhone({ loading: false, number: data?.phone_number || '', verified: data?.is_verified === true });
      })
      .catch(() => { if (!cancelled) setPhone({ loading: false, number: '', verified: false }); });
    return () => { cancelled = true; };
  }, [authUser?.id]);

  if (phoneVerifyOpen) {
    return (
      <PhoneVerifyPanel
        onBack={() => setPhoneVerifyOpen(false)}
        onVerified={(number) => {
          setPhone({ loading: false, number, verified: true });
          setPhoneVerifyOpen(false);
        }}
      />
    );
  }

  if (!authUser) {
    return (
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <BackHeader title="Account information" onBack={onBack} />
        <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '8px 20px 30px' }}>
          <div style={{ border: '1px dashed var(--ayna-border)', borderRadius: 20, padding: 18, fontSize: 13, color: 'var(--ayna-text-muted)', lineHeight: 1.55, textAlign: 'center' }}>
            Sign in to see your account details.
          </div>
        </div>
      </div>
    );
  }

  const initial = (name || 'Y').trim().charAt(0).toUpperCase() || 'Y';
  const identities = authUser.identities || [];
  const hasPasswordAuth = identities.length === 0 || identities.some((i) => i.provider === 'email');
  const googleIdentity = identities.find((i) => i.provider === 'google');
  const intake = quizAnswers?.fullHealthIntake || null;
  const fsaHsaLabel = intake?.fsaHsa ? (FSA_HSA_LABELS[intake.fsaHsa] || intake.fsaHsa) : null;

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <BackHeader title="Account information" onBack={onBack} />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '8px 20px 30px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 22, padding: '16px 18px' }}>
          <div style={{ width: 52, height: 52, borderRadius: 99, flex: 'none', background: 'linear-gradient(140deg,#FFDCA8,#FFC774 48%,#E8843C)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Playfair Display',serif", fontSize: 20, color: '#3A2410' }}>{initial}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, lineHeight: 1.2, color: 'var(--ayna-heading)' }}>{name || 'You'}</div>
            {authUser.created_at && (
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9.5, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--ayna-text-muted)', marginTop: 4 }}>{formatMemberSince(authUser.created_at)}</div>
            )}
          </div>
        </div>

        <div style={{ margin: '24px 0 11px', fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)' }}>Login &amp; contact</div>
        <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 22, padding: '0 18px' }}>
          <AccountRow
            borderTop={false}
            title="Email"
            sub={authUser.email}
            badge={authUser.email_confirmed_at ? 'VERIFIED' : 'UNVERIFIED'}
            badgeTone={authUser.email_confirmed_at ? 'verified' : 'unverified'}
          />
          <AccountRow
            title="Phone number"
            sub={phone.loading ? 'Checking…' : phone.number ? maskPhone(phone.number) : 'Not added yet'}
            badge={phone.loading ? undefined : phone.number ? (phone.verified ? 'VERIFIED' : 'UNVERIFIED') : undefined}
            badgeTone={phone.verified ? 'verified' : 'unverified'}
            onClick={() => setPhoneVerifyOpen(true)}
          />
          {hasPasswordAuth && (
            <AccountRow title="Password" sub="Change your password" onClick={onOpenPassword} />
          )}
          {googleIdentity && (
            <AccountRow title="Google" sub={`Connected · ${googleIdentity.identity_data?.email || authUser.email || ''}`} />
          )}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--ayna-text-faint)', lineHeight: 1.5, marginTop: 9, padding: '0 4px' }}>
          Phone verification unlocks text alerts as a delivery channel — your email{googleIdentity ? ' or Google login' : ''} is what signs you in either way.
        </div>

        <div style={{ margin: '24px 0 11px', fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)' }}>About you</div>
        <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 22, padding: editingName ? '16px 18px' : '0 18px' }}>
          {editingName ? (
            <div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--ayna-text-faint)', marginBottom: 7 }}>Name</div>
              <input
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !nameSaving) saveName(); }}
                placeholder="Your first name"
                style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--ayna-border)', fontSize: 14.5, color: 'var(--ayna-text)', background: 'var(--ayna-bg)', outline: 'none' }}
              />
              {nameError && <div style={{ color: '#B4402A', fontSize: 12, marginTop: 8 }}>{nameError}</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <div
                  onClick={nameSaving ? undefined : saveName}
                  style={{ flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: 99, background: nameSaving ? 'var(--ayna-border)' : 'var(--ayna-cta-bg)', color: nameSaving ? 'var(--ayna-text-muted)' : 'var(--ayna-cta-text)', fontWeight: 600, fontSize: 13, cursor: nameSaving ? 'not-allowed' : 'pointer' }}
                >
                  {nameSaving ? 'Saving…' : 'Save'}
                </div>
                <div
                  onClick={() => { setEditingName(false); setNameError(''); }}
                  style={{ flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: 99, border: '1px solid var(--ayna-border)', color: 'var(--ayna-text-muted)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                >
                  Cancel
                </div>
              </div>
            </div>
          ) : (
            <AccountRow
              borderTop={false}
              title="Name"
              value={name || 'Add your name'}
              onClick={() => { setNameDraft(name || ''); setNameError(''); setEditingName(true); }}
            />
          )}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--ayna-text-faint)', lineHeight: 1.5, marginTop: 9, padding: '0 4px' }}>
          {authUser?.identities?.some((i) => i.provider === 'google') ? "Google didn't share a name with us, or you'd like to change it — set it here." : "What ayna calls you, everywhere in the app."}
        </div>

        <div style={{ margin: '24px 0 11px', fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)' }}>From your intake</div>
        <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 22, padding: '0 18px' }}>
          <AccountRow borderTop={false} title="Age" value={intake?.age ? String(intake.age) : 'Not set'} onClick={onEditProfile} />
          <AccountRow title="Zip code" value={intake?.zipcode || 'Not set'} onClick={onEditProfile} />
          <AccountRow title="FSA / HSA account" sub="We'll show the lower price you'd pay." value={fsaHsaLabel || 'Not set'} onClick={onEditProfile} />
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--ayna-text-faint)', lineHeight: 1.5, marginTop: 9, padding: '0 4px' }}>
          Tap any of these to update your health profile.
        </div>

        <div style={{ margin: '24px 0 11px', fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)' }}>Security</div>
        <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 22, padding: '0 18px' }}>
          <AccountRow borderTop={false} dimmed title="Where you're signed in" sub="Session history isn't tracked yet." badge="COMING SOON" />
          <AccountRow dimmed title="Two-step verification" sub="Arrives with phone verification." badge="COMING SOON" />
        </div>

        <div style={{ margin: '24px 0 11px', fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)' }}>Your data</div>
        <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 22, padding: '0 18px' }}>
          <AccountRow borderTop={false} title="Manage & download my data" sub="Account details, intake answers, saved products." onClick={onOpenManageData} />
          <a
            href="mailto:puloma@aynahealth.co?subject=Account%20Deletion%20Request"
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0', borderTop: '1px solid var(--ayna-border)', textDecoration: 'none' }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, fontSize: 14.5, color: '#B4402A' }}>Delete account</div>
              <div style={{ fontSize: 12, color: 'var(--ayna-text-muted)', marginTop: 2, lineHeight: 1.45 }}>Removes your profile and health answers.</div>
            </div>
            <ExternalLinkIcon />
          </a>
        </div>

        <div style={{ fontSize: 11.5, color: 'var(--ayna-text-faint)', lineHeight: 1.55, marginTop: 14, padding: '0 4px' }}>
          Questions about your account? Email <a href="mailto:puloma@aynahealth.co" style={{ color: 'var(--ayna-brown)' }}>puloma@aynahealth.co</a>.
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- Password ------------------------------- */

function getPasswordStrength(pw) {
  const hasDigitOrSymbol = /[0-9]/.test(pw) || /[^A-Za-z0-9]/.test(pw);
  const hasDigitAndSymbol = /[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw);
  if (pw.length >= 12 && hasDigitAndSymbol) return 3;
  if (pw.length >= 8 && hasDigitOrSymbol) return 2;
  if (pw.length >= 8) return 1;
  return 0;
}

const PASSWORD_ERROR_MESSAGES = {
  invalid_credentials: 'That current password is wrong.',
  weak_password: 'Choose a stronger password (at least 8 characters).',
  same_password: "That's already your password — try a new one.",
  over_request_rate_limit: 'Too many attempts. Please try again in a bit.',
};

function friendlyPasswordError(code) {
  return PASSWORD_ERROR_MESSAGES[code] || 'Something went wrong. Please try again.';
}

// Real Supabase auth calls, not a mock form: the current-password field is
// verified with a real signInWithPassword() (Supabase's client SDK has no
// separate "check password" call) before updateUser() actually changes it.
// isRecovery covers the "Forgot your current password?" link's real
// resetPasswordForEmail() flow: clicking the emailed link fires a real
// PASSWORD_RECOVERY auth event, which is when there's no "current password"
// to ask for at all.
function PasswordScreen({ onBack, authUser }) {
  const [isRecovery, setIsRecovery] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return undefined;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setIsRecovery(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const strength = getPasswordStrength(next);
  const canSubmit = (isRecovery || current.length > 0) && next.length >= 8 && next === confirm && !saving;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError('');
    setSaving(true);
    try {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Sign-in is not configured right now.');
      if (!isRecovery) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: authUser?.email, password: current });
        if (signInError) {
          const err = new Error(signInError.message);
          err.code = 'invalid_credentials';
          throw err;
        }
      }
      const { error: updateError } = await supabase.auth.updateUser({ password: next });
      if (updateError) throw updateError;
      setDone(true);
    } catch (e) {
      setError(friendlyPasswordError(e.code || e.message));
    } finally {
      setSaving(false);
    }
  };

  const handleForgot = async () => {
    setError('');
    try {
      const supabase = getSupabaseClient();
      if (!supabase || !authUser?.email) throw new Error('no_email');
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(authUser.email, {
        redirectTo: `${window.location.origin}/mobile-preview`,
      });
      if (resetError) throw resetError;
      setResetSent(true);
    } catch {
      setError('Could not send a reset email right now. Please try again.');
    }
  };

  if (done) {
    return (
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <BackHeader title="Password" onBack={onBack} />
        <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, marginBottom: 10, color: 'var(--ayna-heading)' }}>Password updated.</div>
          <div style={{ fontSize: 13.5, color: 'var(--ayna-text-muted)', lineHeight: 1.55 }}>You're signed in on this device with the new password.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <BackHeader title="Password" onBack={onBack} />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '0 20px 30px' }}>
        <div style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--ayna-text-muted)', marginBottom: 20 }}>
          {isRecovery ? "You're resetting your password from the link we emailed you." : 'Enter your current password, then choose a new one.'}
        </div>

        <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 22, padding: 18, display: 'flex', flexDirection: 'column', gap: 15 }}>
          {!isRecovery && (
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ayna-text-muted)', marginBottom: 7 }}>Current password</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--ayna-border)', borderRadius: 12, background: 'var(--ayna-bg-alt)', padding: '13px 14px' }}>
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'none', fontSize: 15, color: 'var(--ayna-text)' }}
                />
                <div onClick={() => setShowCurrent((v) => !v)} style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ayna-brown)', cursor: 'pointer', flex: 'none' }}>{showCurrent ? 'Hide' : 'Show'}</div>
              </div>
            </div>
          )}
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ayna-text-muted)', marginBottom: 7 }}>New password</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--ayna-border)', borderRadius: 12, background: 'var(--ayna-bg-alt)', padding: '13px 14px' }}>
              <input
                type={showNext ? 'text' : 'password'}
                value={next}
                onChange={(e) => setNext(e.target.value)}
                placeholder="At least 8 characters"
                style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'none', fontSize: 15, color: 'var(--ayna-text)' }}
              />
              <div onClick={() => setShowNext((v) => !v)} style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ayna-brown)', cursor: 'pointer', flex: 'none' }}>{showNext ? 'Hide' : 'Show'}</div>
            </div>
            {next.length > 0 && (
              <>
                <div style={{ display: 'flex', gap: 5, marginTop: 9 }}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} style={{ flex: 1, height: 4, borderRadius: 99, background: strength >= i ? '#C0761F' : 'var(--ayna-border)' }} />
                  ))}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--ayna-text-faint)', marginTop: 7 }}>
                  {strength < 2 ? 'Add a number or symbol to make it stronger.' : strength < 3 ? 'Longer, with a number and a symbol, is stronger still.' : 'Strong password.'}
                </div>
              </>
            )}
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ayna-text-muted)', marginBottom: 7 }}>Confirm new password</div>
            <input
              type={showNext ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter it"
              style={{ width: '100%', boxSizing: 'border-box', border: '1px solid var(--ayna-border)', borderRadius: 12, background: 'var(--ayna-bg-alt)', padding: '13px 14px', fontSize: 15, color: 'var(--ayna-text)', outline: 'none' }}
            />
          </div>
          {error && <div style={{ color: '#B4402A', fontSize: 12.5 }}>{error}</div>}
          <div
            onClick={handleSubmit}
            style={{ background: canSubmit ? 'var(--ayna-cta-bg)' : 'var(--ayna-border)', color: canSubmit ? 'var(--ayna-cta-text)' : 'var(--ayna-text-muted)', textAlign: 'center', padding: 15, borderRadius: 99, fontWeight: 600, fontSize: 14.5, cursor: canSubmit ? 'pointer' : 'not-allowed' }}
          >
            {saving ? 'Updating…' : 'Update password'}
          </div>
        </div>

        {!isRecovery && (
          resetSent ? (
            <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: 'var(--ayna-text-muted)' }}>Check your email for a reset link.</div>
          ) : (
            <div onClick={handleForgot} style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: 'var(--ayna-brown)', fontWeight: 600, cursor: 'pointer' }}>Forgot your current password?</div>
          )
        )}
      </div>
    </div>
  );
}

/* ------------------------- How it works / About / Contact ------------------------- */
// Ported from the real desktop pages (src/components/HowItWorks.jsx,
// HowItWorksFunnel.jsx, About.jsx, Contact.jsx) so this content and data
// can't drift from what's actually live on aynahealth.co — only the layout
// below is new, re-flowed for a phone per the mobile design reference.
// Copy for the two headline moments ("Nothing reaches you unchecked." here,
// vs. desktop's older "No mystery box." on this same page) is intentionally
// different: that's the actual content update this pass shipped, not a
// mismatch to fix.

function PlainBackLink({ onBack, color = 'var(--ayna-text-muted)' }) {
  return (
    <div
      onClick={onBack}
      role="button"
      aria-label="Back"
      style={{ display: 'flex', alignItems: 'center', gap: 7, color, fontSize: 14, fontWeight: 500, cursor: 'pointer', padding: 'max(20px, env(safe-area-inset-top)) 20px 0' }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: color }}>
        <path d="M15 18l-6-6 6-6" />
      </svg>
      Back
    </div>
  );
}

// Real numbers from HowItWorksFunnel.jsx: a plain linear scale would make
// the 14-product final stage nearly invisible next to 3,140 (a real problem
// found in an August 2026 bug bash), so widths use a sqrt scale instead —
// ported here rather than reimplemented, not the design reference's static
// illustrative percentages.
const NARROWING_STAGES = [
  { label: 'Pulled in from the open market', value: 3140, fill: 'linear-gradient(90deg,#242A52,#3b3866,#8A5049,#A2603C)' },
  { label: 'Relevant to your profile', value: 212, fill: 'linear-gradient(90deg,#4E3866,#8A5049,#A2603C)' },
  { label: 'In your ecosystem', value: 14, fill: 'linear-gradient(90deg,#6d4a72,#C07A2C)' },
];

function NarrowingFunnel() {
  const maxWidth = Math.sqrt(NARROWING_STAGES[0].value);
  return (
    <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 20, padding: '22px 18px 24px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
        {NARROWING_STAGES.map((stage, i) => {
          const widthPct = Math.max(14, (Math.sqrt(stage.value) / maxWidth) * 100);
          return (
            <div key={stage.label} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div style={{ width: `${widthPct}%`, height: 44, borderRadius: 11, background: stage.fill, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Mono',monospace", fontSize: 15, color: '#FFFCF9' }}>
                {stage.value.toLocaleString()}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--ayna-text-muted)', textAlign: 'center', lineHeight: 1.4 }}>{stage.label}</div>
              {i < NARROWING_STAGES.length - 1 && <div style={{ color: 'var(--ayna-text-faint)', fontSize: 14, lineHeight: 1 }}>↓</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HowItWorksScreen({ onBack }) {
  const steps = [
    {
      n: '01', title: 'You tell us', body: 'Stage of life, goals, sensitivities, city.',
      content: <div style={{ marginTop: 14, background: 'var(--ayna-chip-bg)', borderRadius: 13, padding: '13px 14px', fontSize: 12.5, color: 'var(--ayna-text)' }}>Postpartum · 8 weeks · sensitive skin · NYC</div>,
    },
    {
      n: '02', title: 'We scan the market', body: 'Everything pulled in, then cut down.',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', background: 'var(--ayna-chip-bg)', borderRadius: 13, padding: '13px 14px' }}>
            <div style={{ fontSize: 12.5, color: 'var(--ayna-text)' }}>Pulled in</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 13.5, color: 'var(--ayna-navy)' }}>3,140</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', background: 'var(--ayna-chip-bg)', borderRadius: 13, padding: '13px 14px' }}>
            <div style={{ fontSize: 12.5, color: 'var(--ayna-text)' }}>Relevant to you</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 13.5, color: '#C0761F' }}>212</div>
          </div>
        </div>
      ),
    },
    {
      n: '03', title: 'Evidence check', body: 'Checked against published guidance.',
      content: (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 14 }}>
          {['NIH research', 'ACOG guidance', 'CDC data'].map((t) => (
            <div key={t} style={{ background: 'var(--ayna-chip-bg)', borderRadius: 99, padding: '9px 14px', fontSize: 12.5, color: 'var(--ayna-text)' }}>{t}</div>
          ))}
          <div style={{ border: '1px dashed var(--ayna-border)', borderRadius: 99, padding: '8px 14px', fontSize: 12.5, color: 'var(--ayna-text-faint)' }}>Fails → dropped</div>
        </div>
      ),
    },
    {
      n: '04', title: 'Your ecosystem', body: "What's left is ranked, with the reason attached.",
      content: (
        <div style={{ marginTop: 14, background: 'linear-gradient(120deg,#3B2E55,#7A4A47)', borderRadius: 16, padding: '17px 17px 18px' }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 31, color: '#F0A84B', lineHeight: 1 }}>14</div>
          <div style={{ fontSize: 12.5, lineHeight: 1.45, color: 'rgba(255,252,249,.9)', marginTop: 5 }}>products, each with its match reason</div>
        </div>
      ),
    },
  ];

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <PlainBackLink onBack={onBack} />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '0 20px 36px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9.5, letterSpacing: '1.6px', textTransform: 'uppercase', color: 'var(--ayna-text-muted)', marginTop: 18 }}>How it works</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 30, lineHeight: 1.2, color: 'var(--ayna-heading)', margin: '9px 0 10px' }}>Nothing reaches you unchecked.</div>
        <div style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--ayna-text-muted)', marginBottom: 24 }}>
          ayna filters the open market against your profile, then against published research. Anything that fails a step never reaches your shop.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {steps.map((step) => (
            <div key={step.n} style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 20, padding: '18px 18px 19px' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9.5, letterSpacing: '1.5px', color: '#C0761F' }}>STEP {step.n}</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 21, color: 'var(--ayna-heading)', margin: '7px 0 5px' }}>{step.title}</div>
              <div style={{ fontSize: 12.5, color: 'var(--ayna-text-muted)' }}>{step.body}</div>
              {step.content}
            </div>
          ))}
        </div>

        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, color: 'var(--ayna-heading)', margin: '30px 0 14px' }}>The narrowing down, in one picture</div>
        <NarrowingFunnel />

        <div style={{ marginTop: 22, background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 20, padding: 18 }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 19, lineHeight: 1.3, color: 'var(--ayna-heading)' }}>ayna is not a doctor, and never pretends to be.</div>
          <div style={{ fontSize: 12.5, color: 'var(--ayna-text-muted)', marginTop: 8, lineHeight: 1.5 }}>Summaries are AI-written from cited sources and clinician input.</div>
        </div>
      </div>
    </div>
  );
}

// Ported from About.jsx's own FUNNEL/GATES/DIFFERENCES/ADVISORS — same real
// content the live "About ayna" page uses.
const CONCEPT_FUNNEL = [
  { label: 'Open market', width: '100%', fill: 'linear-gradient(90deg,#242A52,#3b3866)' },
  { label: 'Fits your profile', width: '68%', fill: 'linear-gradient(90deg,#4E3866,#6d4a72)' },
  { label: 'Passes evidence checks', width: '42%', fill: 'linear-gradient(90deg,#8A5049,#A2603C)' },
  { label: 'Reaches your shop', width: '24%', fill: 'linear-gradient(90deg,#C07A2C,#F0A84B)' },
];
const TRUST_GATES = [
  { n: '01', title: 'Your profile', body: 'Goals, stage of life, sensitivities, preferences.' },
  { n: '02', title: 'The market', body: 'Relevant products across the open market.' },
  { n: '03', title: 'The evidence', body: 'Research, guidance, clinician and community signals.' },
  { n: '04', title: 'Your shop', body: 'The strongest fits, with clear reasons.' },
];
const WHY_AYNA_DIFFERENCES = [
  'Matched to your profile',
  'Evidence-aware',
  'Clinician + community context',
  'Sponsored placement never changes match',
];
const ADVISORS = [
  { name: 'Dr. David Orbach', title: 'BME, MD, Startup Advisor', photo: '/advisors/david-orbach.png' },
  { name: 'Gwyn Blanton', title: 'Former Director of Ethics & Compliance, Deloitte', photo: '/advisors/gwyn-blanton.png' },
  { name: 'Albert Charles', title: 'Co-Founder, Gorges Ventures', photo: '/advisors/albert-charles.png' },
  { name: 'Erika Demonsant', title: 'Healthcare Consultant, Huron', photo: '/advisors/erika-demonsant.png' },
  { name: 'Pamela Nasr', title: 'Product Lead, Benchling', photo: '/advisors/pamela-nasr.png' },
  { name: 'Nishtha Kaushik', title: 'Advisor', photo: '/advisors/nishtha-kaushik.png' },
  { name: 'Navneet Kaur', title: 'Advisor', photo: '/advisors/navneet-kaur.png' },
];
function advisorInitials(name) {
  return name.replace(/^Dr\.\s*/i, '').split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

function AdvisorAvatar({ advisor }) {
  const [failed, setFailed] = useState(false);
  if (advisor.photo && !failed) {
    return (
      <img
        src={advisor.photo}
        alt={advisor.name}
        onError={() => setFailed(true)}
        style={{ width: 62, height: 62, borderRadius: '50%', objectFit: 'cover', background: 'var(--ayna-chip-bg)', flex: 'none' }}
      />
    );
  }
  return (
    <div style={{ width: 62, height: 62, borderRadius: '50%', background: 'var(--ayna-chip-bg)', color: 'var(--ayna-accent-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Playfair Display',serif", fontSize: 20, flex: 'none' }}>
      {advisorInitials(advisor.name)}
    </div>
  );
}

function AboutAynaScreen({ onBack }) {
  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'linear-gradient(165deg,#4A3663,#332748 62%,#2C2340)', paddingBottom: 30 }}>
        <PlainBackLink onBack={onBack} color="rgba(255,252,249,.72)" />
        <div style={{ textAlign: 'center', padding: '4px 22px 0' }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9.5, letterSpacing: '1.8px', textTransform: 'uppercase', color: 'rgba(255,252,249,.6)' }}>About ayna</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 34, lineHeight: 1.1, color: '#FFF9F2', margin: '10px 0 8px' }}>
            No <span style={{ fontStyle: 'italic', color: '#F0A84B' }}>mystery box</span>.
          </div>
          <div style={{ fontSize: 13.5, color: 'rgba(255,249,242,.78)' }}>See what shapes your shop.</div>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '26px 20px 36px' }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 25, lineHeight: 1.2, color: 'var(--ayna-heading)' }}>Women's health isn't one-size-fits-all.</div>
        <div style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--ayna-text-muted)', marginTop: 11 }}>
          ayna starts with you, scans relevant products, checks available evidence, then makes the reasoning visible.
        </div>

        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9.5, letterSpacing: '1.6px', textTransform: 'uppercase', color: '#B4402A', margin: '28px 0 7px' }}>The funnel</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, color: 'var(--ayna-heading)', marginBottom: 14 }}>Broad in. Focused out.</div>
        <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 20, padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {CONCEPT_FUNNEL.map((row) => (
            <div key={row.label}>
              <div style={{ fontSize: 12.5, color: 'var(--ayna-text)', marginBottom: 6 }}>{row.label}</div>
              <div style={{ height: 9, borderRadius: 99, background: 'var(--ayna-track)', overflow: 'hidden' }}>
                <div style={{ width: row.width, height: '100%', borderRadius: 99, background: row.fill }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 22 }}>
          <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 20, padding: 18 }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: '1.4px', textTransform: 'uppercase', color: 'var(--ayna-text-faint)' }}>What we look at</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 19, color: 'var(--ayna-heading)', margin: '7px 0 13px' }}>Multiple signals, one view</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
              {['Published research', 'Clinical guidance', 'Clinician input', 'Community experience'].map((t) => (
                <div key={t} style={{ background: 'var(--ayna-chip-bg)', borderRadius: 11, padding: '11px 12px', fontSize: 12, color: 'var(--ayna-text)' }}>{t}</div>
              ))}
            </div>
          </div>
          <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 20, padding: 18 }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: '1.4px', textTransform: 'uppercase', color: 'var(--ayna-text-faint)' }}>What shapes a match</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 19, color: 'var(--ayna-heading)', margin: '7px 0 13px' }}>Relevant, not paid-first</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {['Your profile', 'Evidence', 'Clinician context', 'Community context'].map((t) => (
                <div key={t} style={{ background: 'var(--ayna-chip-bg)', borderRadius: 11, padding: 12, fontSize: 12.5, color: 'var(--ayna-text)' }}>{t}</div>
              ))}
            </div>
            <div style={{ fontSize: 11.5, color: '#B4402A', marginTop: 11 }}>Sponsorship is never a match input.</div>
          </div>
        </div>

        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9.5, letterSpacing: '1.6px', textTransform: 'uppercase', color: '#B4402A', margin: '32px 0 7px' }}>The process</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, color: 'var(--ayna-heading)', marginBottom: 14 }}>Four gates, in order.</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {TRUST_GATES.map((gate) => {
            const dark = gate.n === '04';
            return (
              <div key={gate.n} style={{ background: dark ? 'linear-gradient(150deg,#3B2E55,#5B3B57)' : 'var(--ayna-surface)', border: dark ? 'none' : '1px solid var(--ayna-border)', borderRadius: 18, padding: '15px 14px 17px' }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, color: dark ? '#F0A84B' : '#C0761F' }}>{gate.n}</div>
                <div style={{ fontWeight: 600, fontSize: 13.5, color: dark ? '#FFF9F2' : 'var(--ayna-text)', margin: '5px 0' }}>{gate.title}</div>
                <div style={{ fontSize: 11.5, lineHeight: 1.45, color: dark ? 'rgba(255,252,249,.82)' : 'var(--ayna-text-muted)' }}>{gate.body}</div>
              </div>
            );
          })}
        </div>

        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9.5, letterSpacing: '1.6px', textTransform: 'uppercase', color: '#B4402A', margin: '32px 0 7px' }}>Why ayna</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, color: 'var(--ayna-heading)', marginBottom: 14 }}>Discovery with context.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {WHY_AYNA_DIFFERENCES.map((t) => (
            <div key={t} style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 13, padding: 14, fontSize: 13, color: 'var(--ayna-text)' }}>{t}</div>
          ))}
        </div>

        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9.5, letterSpacing: '1.6px', textTransform: 'uppercase', color: '#B4402A', margin: '32px 0 7px' }}>Our advisors</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, color: 'var(--ayna-heading)', marginBottom: 16 }}>Guided by real expertise.</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 12px' }}>
          {ADVISORS.map((advisor) => (
            <div key={advisor.name} style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center' }}><AdvisorAvatar advisor={advisor} /></div>
              <div style={{ fontWeight: 600, fontSize: 12.5, color: 'var(--ayna-text)', marginTop: 8 }}>{advisor.name}</div>
              <div style={{ fontSize: 11, lineHeight: 1.4, color: 'var(--ayna-text-muted)', marginTop: 3 }}>{advisor.title}</div>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 20, padding: '19px 18px', marginTop: 26 }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--ayna-text)' }}>ayna is not a doctor.</div>
          <div style={{ fontSize: 12.5, lineHeight: 1.55, color: 'var(--ayna-text-muted)', marginTop: 6 }}>Medical decisions stay with you and your clinician.</div>
        </div>
      </div>
    </div>
  );
}

// Real reasons + real endpoint, ported from Contact.jsx/api/contact.js —
// this posts to the same live /api/contact route (Resend email to the ayna
// team) the desktop contact page uses, not a local-only mock.
const CONTACT_REASONS = ['Partnerships', 'Help & Support', 'Feedback or Feature Request', 'Press & Media', 'Other'];

function ContactScreen({ onBack }) {
  const [form, setForm] = useState({ name: '', email: '', reason: '', subject: '', message: '' });
  const [reasonOpen, setReasonOpen] = useState(false);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async () => {
    if (status === 'sending') return;
    setStatus('sending');
    setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'We could not send your message. Please try again.');
      setStatus('sent');
      setForm({ name: '', email: '', reason: '', subject: '', message: '' });
    } catch (err) {
      setStatus('error');
      setError(err?.message || 'We could not send your message. Please try again.');
    }
  };

  const canSend = form.name.trim().length >= 2 && form.email.trim() && form.reason && form.subject.trim().length >= 2 && form.message.trim().length >= 10;
  const sendReady = canSend && status !== 'sending';

  const fieldStyle = { border: '1px solid #ded9e4', borderRadius: 10, background: '#fff', padding: 14, fontSize: 15, color: '#1A1714', width: '100%', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' };
  const labelStyle = { fontSize: 13, fontWeight: 600, color: '#4a4356', marginBottom: 7 };

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: '#FAF6F2' }}>
      <PlainBackLink onBack={onBack} color="#6f6880" />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '18px 20px 40px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9.5, letterSpacing: '1.7px', textTransform: 'uppercase', color: '#766d83' }}>Contact</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 34, lineHeight: 1.1, color: '#1A1714', margin: '11px 0 0' }}>How can we help?</div>
        <div style={{ fontSize: 13.5, lineHeight: 1.6, color: '#6f6880', marginTop: 13 }}>
          Send us a note and we'll make sure it reaches the right person on the ayna team.
        </div>
        <div style={{ marginTop: 18, paddingTop: 15, borderTop: '1px solid #e5e0e9', fontSize: 12.5, lineHeight: 1.65, color: '#6f6880' }}>
          For brand collaborations, choose <strong style={{ color: '#4a4356' }}>Partnerships</strong>. For questions about using ayna, choose <strong style={{ color: '#4a4356' }}>Help &amp; Support</strong>.
        </div>

        <div style={{ background: '#fff', border: '1px solid #e4dfe8', borderRadius: 18, padding: '20px 18px 22px', marginTop: 22, boxShadow: '0 12px 40px rgba(54,45,65,.06)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            <div>
              <div style={labelStyle}>Name</div>
              <input value={form.name} onChange={update('name')} placeholder="Your name" style={fieldStyle} />
            </div>
            <div>
              <div style={labelStyle}>Email</div>
              <input value={form.email} onChange={update('email')} placeholder="you@example.com" type="email" style={fieldStyle} />
            </div>
            <div style={{ position: 'relative' }}>
              <div style={labelStyle}>What can we help with?</div>
              <div onClick={() => setReasonOpen((v) => !v)} style={{ ...fieldStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <div style={{ color: form.reason ? '#1A1714' : '#A8A29E' }}>{form.reason || 'Select one'}</div>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: '#57534E', transform: reasonOpen ? 'rotate(180deg)' : 'none' }}>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
              {reasonOpen && (
                <div style={{ marginTop: 6, border: '1px solid #ded9e4', borderRadius: 10, background: '#fff', overflow: 'hidden', boxShadow: '0 14px 28px -18px rgba(42,31,78,.45)' }}>
                  {CONTACT_REASONS.map((r, i) => (
                    <div key={r} onClick={() => { setForm((f) => ({ ...f, reason: r })); setReasonOpen(false); }} style={{ padding: '12px 14px', fontSize: 14, color: '#1A1714', cursor: 'pointer', borderTop: i === 0 ? 'none' : '1px solid #f0ecf3' }}>{r}</div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <div style={labelStyle}>Subject</div>
              <input value={form.subject} onChange={update('subject')} placeholder="What is this about?" style={fieldStyle} />
            </div>
            <div>
              <div style={labelStyle}>Message</div>
              <textarea value={form.message} onChange={update('message')} placeholder="Tell us how we can help." rows={5} style={{ ...fieldStyle, resize: 'vertical', minHeight: 118, lineHeight: 1.5 }} />
            </div>
          </div>

          {status === 'sent' && (
            <div style={{ marginTop: 16, padding: '11px 13px', borderRadius: 9, background: '#f3f6f1', color: '#435143', fontSize: 13.5 }}>
              Thanks. Your message has been sent to the ayna team.
            </div>
          )}
          {status === 'error' && (
            <div style={{ marginTop: 16, padding: '11px 13px', borderRadius: 9, background: '#fff2f0', color: '#8b342d', fontSize: 13.5 }}>
              {error}
            </div>
          )}

          <div
            onClick={() => sendReady && submit()}
            role="button"
            aria-label="Send message"
            style={{
              marginTop: 20, textAlign: 'center', borderRadius: 99, padding: 16, fontWeight: 600, fontSize: 15,
              background: sendReady ? '#242A52' : '#E4DFE8',
              color: sendReady ? '#fff' : '#A8A29E',
              cursor: sendReady ? 'pointer' : 'not-allowed',
              boxShadow: sendReady ? '0 14px 26px -14px rgba(36,42,82,.7)' : 'none',
            }}
          >
            {status === 'sending' ? 'Sending…' : 'Send message'}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- Orchestrator ------------------------------- */

export default function ProfileFlow({
  onClose,
  theme,
  onToggleTheme,
  onSignOut,
  onSignIn,
  authUser = null,
  name = 'You',
  onNameChanged,
  ecosystemCount = 0,
  savedCount = 0,
  quizAnswers = null,
  myProducts = [],
  savedProducts = {},
  onViewAlternative,
  onBrowse,
  onEditProfile,
}) {
  // A real back-navigation stack rather than a static single-parent map —
  // several screens (Preferences/Notifications, in particular) are now
  // reachable from more than one place (ProfileHub's own row, and Settings'
  // "Notifications" row), so "back" has to return to wherever the user
  // actually came from, not a fixed screen.
  const [screenStack, setScreenStack] = useState(['hub']);
  const screen = screenStack[screenStack.length - 1];
  const pushScreen = (next) => setScreenStack((stack) => [...stack, next]);
  const initial = (name || 'Y').trim().charAt(0).toUpperCase() || 'Y';

  const goBack = () => setScreenStack((stack) => (stack.length > 1 ? stack.slice(0, -1) : stack));

  const profileFilledPct = getProfileCompletionPct(quizAnswers?.fullHealthIntake);
  const shopperAlertsCount = getSafetyAlerts(myProducts, quizAnswers).length;

  let body;
  if (screen === 'hub') {
    body = (
      <ProfileHub
        onOpen={pushScreen}
        onClose={onClose}
        name={name}
        initial={initial}
        memberSince={authUser?.created_at ? formatMemberSince(authUser.created_at) : 'Member since 2026'}
        ecosystemCount={ecosystemCount}
        savedCount={savedCount}
        profileFilledPct={profileFilledPct}
        shopperAlertsCount={shopperAlertsCount}
        onEditProfile={onEditProfile ? () => { onClose(); onEditProfile(); } : undefined}
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
    body = (
      <SettingsScreen
        onBack={goBack}
        onOpenHowItWorks={() => pushScreen('howItWorks')}
        onOpenAboutAyna={() => pushScreen('aboutAyna')}
        onOpenContact={() => pushScreen('contact')}
        onOpenAccountInfo={() => pushScreen('accountInfo')}
        onOpenPrivacyData={() => pushScreen('privacyData')}
        onOpenLegal={() => pushScreen('legal')}
        authUser={authUser}
        onSignOut={onSignOut}
        onSignIn={onSignIn ? () => { onClose(); onSignIn(); } : undefined}
      />
    );
  } else if (screen === 'howItWorks') {
    body = <HowItWorksScreen onBack={goBack} />;
  } else if (screen === 'aboutAyna') {
    body = <AboutAynaScreen onBack={goBack} />;
  } else if (screen === 'contact') {
    body = <ContactScreen onBack={goBack} />;
  } else if (screen === 'accountInfo') {
    body = (
      <AccountInfoScreen
        onBack={goBack}
        authUser={authUser}
        name={name}
        onNameChanged={onNameChanged}
        quizAnswers={quizAnswers}
        onOpenPassword={() => pushScreen('password')}
        onEditProfile={onEditProfile ? () => { onClose(); onEditProfile(); } : undefined}
        onOpenManageData={() => pushScreen('manageData')}
      />
    );
  } else if (screen === 'password') {
    body = <PasswordScreen onBack={goBack} authUser={authUser} />;
  } else if (screen === 'privacyData') {
    body = <PrivacyDataScreen onBack={goBack} onOpenManageData={() => pushScreen('manageData')} />;
  } else if (screen === 'legal') {
    body = <LegalScreen onBack={goBack} />;
  } else if (screen === 'manageData') {
    body = <ManageDataScreen onBack={goBack} />;
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 55, background: 'var(--ayna-bg)', display: 'flex', animation: 'ay-page .25s ease-out' }}>
      {body}
    </div>
  );
}
