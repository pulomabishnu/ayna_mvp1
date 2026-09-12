import { useEffect, useMemo, useState } from 'react';
import { ALL_PRODUCTS } from '../../../data/products.js';
import { getSupabaseClient } from '../../../utils/supabaseClient.js';
import { getBrandAffinity, getCategoryInsights, getSafetyAlerts } from '../../utils/shopperProfileData.js';
import { ROUTINE_BUCKET_LABELS, ROUTINE_BUCKETS, useRoutine } from '../../hooks/useRoutine.js';
import { getProfileCompletionPct } from '../../utils/profileCompleteness.js';
import { TEXT_SIZE_STEPS } from '../../hooks/useTextSize.js';
import {
  NotSignedInError,
  fetchNotificationPreferences,
  patchNotificationPreferences,
  sendPhoneVerificationCode,
  confirmPhoneVerificationCode,
} from '../../utils/notificationPreferencesApi.js';
import { fetchDataExport, requestAccountDeletion } from '../../utils/dataExportApi.js';
import { OPEN_SOURCE_PACKAGES, summarizeLicenses } from '../../data/openSourceLicenses.js';

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
      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 'calc(20px * var(--ayna-text-scale, 1))', color: dark ? '#FFF9F2' : 'var(--ayna-heading)' }}>{title}</div>
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
        <div style={{ fontWeight: 600, fontSize: 'calc(15px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)' }}>{title}</div>
        <div style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', marginTop: 3, lineHeight: 1.45 }}>{sub}</div>
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
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 'calc(24px * var(--ayna-text-scale, 1))', letterSpacing: 0.5 }}>ayna</div>
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
              fontSize: 'calc(18px * var(--ayna-text-scale, 1))',
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
              fontSize: 'calc(26px * var(--ayna-text-scale, 1))',
              color: '#3A2410',
              boxShadow: '0 14px 30px -12px rgba(255,150,60,.7)',
            }}
          >
            {initial}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 'calc(26px * var(--ayna-text-scale, 1))', lineHeight: 1.15 }}>{name}</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(10px * var(--ayna-text-scale, 1))', letterSpacing: '1.4px', textTransform: 'uppercase', color: 'rgba(255,249,242,.62)', marginTop: 5 }}>{memberSince}</div>
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
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 'calc(23px * var(--ayna-text-scale, 1))', color: '#FFC774' }}>{s.value}</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(8.5px * var(--ayna-text-scale, 1))', letterSpacing: '1.1px', textTransform: 'uppercase', color: 'rgba(255,249,242,.66)', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, padding: '22px 20px 26px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(10px * var(--ayna-text-scale, 1))', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)', marginBottom: 2 }}>Your account</div>

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
              <div style={{ fontWeight: 600, fontSize: 'calc(15.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)' }}>{row.title}</div>
              <div style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', marginTop: 2 }}>{row.sub}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 'none' }}>
              {row.badge && <div style={{ background: 'var(--ayna-accent)', color: '#231A12', fontFamily: "'DM Mono',monospace", fontSize: 'calc(9px * var(--ayna-text-scale, 1))', letterSpacing: '.5px', padding: '3px 7px', borderRadius: 99 }}>{row.badge}</div>}
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
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(10px * var(--ayna-text-scale, 1))', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)' }}>Safety alerts</div>
            <div style={{ fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)' }}>{activeAlerts.length} active</div>
          </div>
          {activeAlerts.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {activeAlerts.map((alert) =>
                alert.kind === 'recall' ? (
                  <div key={alert.id} style={{ borderRadius: 18, padding: 15, background: 'rgba(180,64,42,.08)', border: '1px solid rgba(180,64,42,.25)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 7, height: 7, borderRadius: 99, background: '#B4402A', flex: 'none' }} />
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9px * var(--ayna-text-scale, 1))', letterSpacing: '1.2px', textTransform: 'uppercase', color: '#B4402A' }}>FDA recall · active</div>
                    </div>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 'calc(17px * var(--ayna-text-scale, 1))', lineHeight: 1.3, margin: '8px 0 5px', color: 'var(--ayna-text)' }}>{alert.title}</div>
                    <div style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.5 }}>{alert.body}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <div onClick={() => onViewAlternative && onViewAlternative(alert.product)} style={{ background: '#B4402A', color: '#FFF9F2', fontWeight: 600, fontSize: 'calc(12px * var(--ayna-text-scale, 1))', padding: '8px 14px', borderRadius: 99, cursor: 'pointer' }}>See swap</div>
                      <div onClick={() => dismissAlert(alert.id)} style={{ border: '1px solid rgba(180,64,42,.35)', color: '#B4402A', fontWeight: 600, fontSize: 'calc(12px * var(--ayna-text-scale, 1))', padding: '8px 14px', borderRadius: 99, cursor: 'pointer' }}>Dismiss</div>
                    </div>
                  </div>
                ) : (
                  <div key={alert.id} style={{ borderRadius: 18, padding: 15, background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 7, height: 7, borderRadius: 99, background: 'var(--ayna-accent-dark)', flex: 'none' }} />
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9px * var(--ayna-text-scale, 1))', letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)' }}>Safety note · watching</div>
                    </div>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 'calc(17px * var(--ayna-text-scale, 1))', lineHeight: 1.3, margin: '8px 0 5px', color: 'var(--ayna-text)' }}>{alert.title}</div>
                    <div style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.5 }}>{alert.body}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <div onClick={() => dismissAlert(alert.id)} style={{ border: '1px solid var(--ayna-border)', color: 'var(--ayna-text-muted)', fontWeight: 600, fontSize: 'calc(12px * var(--ayna-text-scale, 1))', padding: '8px 14px', borderRadius: 99, cursor: 'pointer' }}>Dismiss</div>
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div style={{ borderRadius: 18, padding: 15, border: '1px dashed var(--ayna-border)', fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.5 }}>
              No active alerts. We'll watch your ecosystem for recalls and check it against what you flagged during intake.
            </div>
          )}
          {dismissedAlerts.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 18, padding: '13px 15px', marginTop: 9, border: '1px dashed var(--ayna-border)' }}>
              <div style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)' }}>Dismissed · {dismissedAlerts.length}</div>
            </div>
          )}
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 11 }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(10px * var(--ayna-text-scale, 1))', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)' }}>Your routine</div>
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
                    fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))',
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
              <div style={{ padding: '10px 2px', fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.5 }}>
                Nothing in your ecosystem yet — add products so you can sort them into a routine.
                {onBrowse && (
                  <div onClick={onBrowse} style={{ display: 'inline-block', marginTop: 10, background: 'var(--ayna-cta-bg)', color: 'var(--ayna-cta-text)', fontWeight: 600, fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', padding: '9px 16px', borderRadius: 99, cursor: 'pointer' }}>Browse products</div>
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
                        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--ayna-cta-bg)', color: 'var(--ayna-cta-text)', fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', fontWeight: 500, padding: '8px 12px', borderRadius: 99, cursor: 'pointer' }}
                      >
                        {p.name} <span style={{ opacity: 0.75, fontSize: 'calc(12px * var(--ayna-text-scale, 1))' }}>×</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.5, marginBottom: 16 }}>
                    Nothing in your {ROUTINE_BUCKET_LABELS[activeBucket].toLowerCase()} routine yet — tap a product below to add it.
                  </div>
                )}

                {notInBucket.length > 0 && (
                  <>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9.5px * var(--ayna-text-scale, 1))', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--ayna-text-faint)', marginBottom: 9 }}>Tap to add</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                      {notInBucket.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => setProductBucket(p.id, activeBucket)}
                          style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', fontWeight: 500, padding: '8px 12px', borderRadius: 99, cursor: 'pointer', background: 'transparent', border: '1px solid var(--ayna-border)', color: 'var(--ayna-text-muted)' }}
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
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(10px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)' }}>{sortedCount} of {myProducts.length} sorted into a routine</div>
            </div>
          </div>
        </div>

        <div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(10px * var(--ayna-text-scale, 1))', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)', marginBottom: 11 }}>Brand affinity</div>
          <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 20, padding: 16 }}>
            <div style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.5, marginBottom: 13 }}>Drawn from what matters to you in intake and what you actually keep in your ecosystem.</div>
            {affinityChips.length ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {affinityChips.map((chip) => {
                  const strong = chip.score >= 70;
                  const outline = chip.score === 0;
                  return (
                    <div
                      key={chip.tag}
                      style={{
                        fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))',
                        fontWeight: 500,
                        padding: '8px 13px',
                        borderRadius: 99,
                        cursor: 'default',
                        background: outline ? 'transparent' : strong ? 'var(--ayna-cta-bg)' : 'var(--ayna-chip-bg)',
                        color: outline ? 'var(--ayna-text-muted)' : strong ? 'var(--ayna-cta-text)' : 'var(--ayna-accent-dark)',
                        border: outline ? '1px solid var(--ayna-border)' : 'none',
                      }}
                    >
                      {chip.label} <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(10px * var(--ayna-text-scale, 1))', opacity: 0.75 }}>{chip.score}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)' }}>
                {quizAnswers ? "You didn't flag any of these during intake." : 'Take the quiz to see what matters most to you.'}
              </div>
            )}
          </div>
        </div>

        <div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(10px * var(--ayna-text-scale, 1))', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)', marginBottom: 11 }}>Most-represented categories</div>
          {topCategories.length ? (
            <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 20, padding: 16, display: 'flex', flexDirection: 'column', gap: 13 }}>
              {topCategories.map((c) => (
                <div key={c.rank}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(10px * var(--ayna-text-scale, 1))', color: 'var(--ayna-accent-dark)', flex: 'none' }}>{c.rank}</div>
                    <div style={{ flex: 1, fontWeight: 500, fontSize: 'calc(14px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)' }}>{c.name}</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(10px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', flex: 'none' }}>{c.count}</div>
                  </div>
                  <div style={{ height: 7, borderRadius: 99, background: 'var(--ayna-border)', overflow: 'hidden' }}>
                    <div style={{ width: `${c.pct}%`, height: '100%', background: 'var(--ayna-accent-dark)' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ border: '1px dashed var(--ayna-border)', borderRadius: 20, padding: 16, fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.5 }}>
              Save or add a product to start building this out.
            </div>
          )}
        </div>

        {lowCategories.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 11 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(10px * var(--ayna-text-scale, 1))', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ayna-text-faint)' }}>Least-represented</div>
              <div style={{ fontSize: 'calc(12px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)' }}>Blind spots</div>
            </div>
            <div style={{ border: '1px dashed var(--ayna-border)', borderRadius: 20, padding: '6px 16px' }}>
              {lowCategories.map((c, i) => (
                <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderTop: i === 0 ? 'none' : '1px solid var(--ayna-border)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)' }}>{c.name}</div>
                    <div style={{ fontSize: 'calc(12px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', marginTop: 2 }}>{c.note}</div>
                  </div>
                </div>
              ))}
              {onBrowse && (
                <div style={{ padding: '12px 0 14px', borderTop: '1px solid var(--ayna-border)' }}>
                  <div onClick={onBrowse} style={{ display: 'inline-block', border: '1px solid var(--ayna-border)', color: 'var(--ayna-brown)', fontWeight: 600, fontSize: 'calc(12px * var(--ayna-text-scale, 1))', padding: '8px 14px', borderRadius: 99, cursor: 'pointer' }}>Explore a blind spot</div>
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
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9.5px * var(--ayna-text-scale, 1))', letterSpacing: '1.4px', textTransform: 'uppercase', color: '#FFC774' }}>Founder-first</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 'calc(25px * var(--ayna-text-scale, 1))', lineHeight: 1.2, margin: '8px 0 7px', maxWidth: 250 }}>Real founders, not ad spend.</div>
          <div style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: 'rgba(255,249,242,.72)', lineHeight: 1.5, maxWidth: 265 }}>Ranked by what you told us during intake — never by who paid for placement.</div>
        </div>

        <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 16, scrollbarWidth: 'none' }}>
          {['all', 'women', 'preseed', 'clinical'].map((key) => (
            <div
              key={key}
              onClick={() => setFilter(key)}
              style={{
                fontSize: 'calc(12px * var(--ayna-text-scale, 1))',
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
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--ayna-text-muted)', fontSize: 'calc(13px * var(--ayna-text-scale, 1))' }}>Loading startups…</div>
          )}
          {loadState === 'error' && (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--ayna-text-muted)', fontSize: 'calc(13px * var(--ayna-text-scale, 1))' }}>Couldn't load startups right now — try again shortly.</div>
          )}
          {loadState === 'ready' && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--ayna-text-muted)', fontSize: 'calc(13px * var(--ayna-text-scale, 1))' }}>No startups match that filter yet.</div>
          )}

          {filtered.map((s) => {
            const href = s.url || s.waitlistUrl;
            const openLink = href ? () => window.open(href, '_blank', 'noopener,noreferrer') : undefined;
            return s.featured ? (
              <div key={s.id} onClick={openLink} style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 22, overflow: 'hidden', cursor: openLink ? 'pointer' : 'default' }}>
                <div style={{ height: 168, background: s.image ? undefined : 'linear-gradient(160deg,#F3EADC,#EFE3D2)', backgroundImage: s.image ? `url(${s.image})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                  {s.foundedYear && (
                    <div style={{ position: 'absolute', left: 12, top: 12, background: 'rgba(255,255,255,.93)', color: '#C0761F', fontFamily: "'DM Mono',monospace", fontSize: 'calc(9px * var(--ayna-text-scale, 1))', letterSpacing: '.9px', padding: '5px 9px', borderRadius: 99 }}>FOUNDED {s.foundedYear}</div>
                  )}
                </div>
                <div style={{ padding: '15px 16px 17px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9px * var(--ayna-text-scale, 1))', letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)' }}>{formatCategoryLabel(s.category)}</div>
                    {s.stage && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 6, height: 6, borderRadius: 99, background: '#2F6B4F' }} />
                        <div style={{ fontSize: 'calc(11px * var(--ayna-text-scale, 1))', color: '#2F6B4F' }}>{s.stage}</div>
                      </div>
                    )}
                  </div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 'calc(21px * var(--ayna-text-scale, 1))', lineHeight: 1.2, margin: '7px 0 6px', color: 'var(--ayna-text)' }}>{s.name}</div>
                  <div style={{ fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.5 }}>{s.description || s.tagline}</div>
                  {s.badges?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                      {s.badges.map((t) => (
                        <div key={t} style={{ background: 'var(--ayna-chip-bg)', color: 'var(--ayna-accent-dark)', fontSize: 'calc(11px * var(--ayna-text-scale, 1))', padding: '5px 10px', borderRadius: 99 }}>{t}</div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                    <div style={{ flex: 1, background: 'var(--ayna-cta-bg)', color: 'var(--ayna-cta-text)', fontWeight: 600, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', padding: 11, borderRadius: 99, textAlign: 'center', cursor: 'pointer' }}>
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
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9px * var(--ayna-text-scale, 1))', letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)' }}>{formatCategoryLabel(s.category)}</div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 'calc(19px * var(--ayna-text-scale, 1))', lineHeight: 1.2, margin: '6px 0 5px', color: 'var(--ayna-text)' }}>{s.name}</div>
                  <div style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.45 }}>{s.description || s.tagline}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    {(s.badges || []).slice(0, 2).map((t) => (
                      <div key={t} style={{ background: 'var(--ayna-chip-bg)', color: 'var(--ayna-accent-dark)', fontSize: 'calc(10.5px * var(--ayna-text-scale, 1))', padding: '4px 9px', borderRadius: 99 }}>{t}</div>
                    ))}
                    {s.stage && <div style={{ fontSize: 'calc(11px * var(--ayna-text-scale, 1))', color: '#2F6B4F' }}>{s.stage}</div>}
                  </div>
                </div>
              </div>
            );
          })}
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
            <div style={{ fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.55, marginBottom: 18 }}>
              We'll text a 6-digit code to confirm this number before texts can be your delivery channel.
            </div>
            <div style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', fontWeight: 600, color: 'var(--ayna-text)', marginBottom: 7 }}>Phone number</div>
            <input
              type="tel"
              inputMode="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="(555) 555-5555"
              style={{ width: '100%', boxSizing: 'border-box', padding: '14px 16px', borderRadius: 14, border: '1px solid var(--ayna-border)', fontSize: 'calc(15px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)', background: 'var(--ayna-surface)', outline: 'none' }}
            />
            {error && <div style={{ color: '#B4402A', fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', marginTop: 10 }}>{error}</div>}
            <div
              onClick={() => !sending && phoneNumber.trim() && sendCode()}
              style={{ marginTop: 18, textAlign: 'center', background: sending || !phoneNumber.trim() ? 'var(--ayna-border)' : 'var(--ayna-cta-bg)', color: sending || !phoneNumber.trim() ? 'var(--ayna-text-muted)' : 'var(--ayna-cta-text)', fontWeight: 600, fontSize: 'calc(14.5px * var(--ayna-text-scale, 1))', padding: 15, borderRadius: 99, cursor: sending || !phoneNumber.trim() ? 'not-allowed' : 'pointer' }}
            >
              {sending ? 'Sending…' : 'Send code'}
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.55, marginBottom: 18 }}>
              We texted a code to {phoneNumber}. Enter it below.
            </div>
            <div style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', fontWeight: 600, color: 'var(--ayna-text)', marginBottom: 7 }}>Verification code</div>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              style={{ width: '100%', boxSizing: 'border-box', padding: '14px 16px', borderRadius: 14, border: '1px solid var(--ayna-border)', fontSize: 'calc(20px * var(--ayna-text-scale, 1))', letterSpacing: 4, textAlign: 'center', color: 'var(--ayna-text)', background: 'var(--ayna-surface)', outline: 'none' }}
            />
            {error && <div style={{ color: '#B4402A', fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', marginTop: 10 }}>{error}</div>}
            <div
              onClick={() => !sending && code.length === 6 && confirmCode()}
              style={{ marginTop: 18, textAlign: 'center', background: sending || code.length !== 6 ? 'var(--ayna-border)' : 'var(--ayna-cta-bg)', color: sending || code.length !== 6 ? 'var(--ayna-text-muted)' : 'var(--ayna-cta-text)', fontWeight: 600, fontSize: 'calc(14.5px * var(--ayna-text-scale, 1))', padding: 15, borderRadius: 99, cursor: sending || code.length !== 6 ? 'not-allowed' : 'pointer' }}
            >
              {sending ? 'Verifying…' : 'Verify'}
            </div>
            <div
              onClick={() => cooldown === 0 && !sending && sendCode()}
              style={{ marginTop: 16, textAlign: 'center', fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: cooldown === 0 ? 'var(--ayna-brown)' : 'var(--ayna-text-faint)', cursor: cooldown === 0 ? 'pointer' : 'default' }}
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

function SectionLabel({ children }) {
  return (
    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(10px * var(--ayna-text-scale, 1))', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)', margin: '22px 0 11px' }}>
      {children}
    </div>
  );
}

function DrillRow({ title, sub, onClick, first }) {
  return (
    <div
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '17px 0', borderTop: first ? 'none' : '1px solid var(--ayna-border)', cursor: 'pointer' }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 'calc(15px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)' }}>{title}</div>
        {sub && <div style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', marginTop: 3, lineHeight: 1.45 }}>{sub}</div>}
      </div>
      <ChevronIcon />
    </div>
  );
}

const THEME_SWATCHES = [
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
];

function ThemeSwatch({ mode, selected, onClick }) {
  const bg = mode === 'light' ? 'var(--ayna-bg-alt)' : '#1B1B22';
  const barColor = mode === 'dark' ? 'rgba(255,249,242,.35)' : 'rgba(41,37,36,.25)';
  return (
    <div onClick={onClick} style={{ cursor: 'pointer', textAlign: 'center' }}>
      <div
        style={{
          height: 58,
          borderRadius: 14,
          background: bg,
          border: selected ? '2px solid var(--ayna-cta-bg)' : '1px solid var(--ayna-border)',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 5,
          boxSizing: 'border-box',
        }}
      >
        <div style={{ height: 3, width: '75%', borderRadius: 2, background: barColor }} />
        <div style={{ height: 3, width: '50%', borderRadius: 2, background: barColor }} />
      </div>
      <div style={{ marginTop: 7, fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', fontWeight: selected ? 700 : 500, color: selected ? 'var(--ayna-heading)' : 'var(--ayna-text-muted)' }}>
        {THEME_SWATCHES.find((s) => s.key === mode)?.label}
      </div>
    </div>
  );
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
function PreferencesScreen({
  onBack,
  theme,
  onToggleTheme,
  onOpenChannels,
  personalizeWithData,
  onPersonalizeWithDataChange,
  askAynaHistoryCount,
  onClearAskAynaHistory,
  textSizeIndex,
  onTextSizeChange,
}) {
  const [loadState, setLoadState] = useState('loading'); // 'loading' | 'signed_out' | 'error' | 'ready'
  const [prefs, setPrefs] = useState(null);
  const [toast, setToast] = useState('');
  // Session-only nudge to ask "did you subscribe?" after sending them to
  // Substack — not persisted, since it's just prompting for the confirm
  // tap below, not the subscribed state itself.
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);
  const [newsletterConfirmed, setNewsletterConfirmed] = useState(loadNewsletterConfirmed);
  const [clearHistoryConfirm, setClearHistoryConfirm] = useState(false);

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

  // Mirrors the toggle into MobileApp's app-wide `personalizeWithData` state
  // immediately (so match %, For You toggles, and Ask Ayna's context react
  // right away everywhere, not just once this screen's own `prefs` update
  // lands) and rolls that mirror back too if the save fails.
  const handlePersonalizeToggle = () => {
    const next = !personalizeWithData;
    onPersonalizeWithDataChange && onPersonalizeWithDataChange(next);
    patchNotificationPreferences({ personalize_with_data_enabled: next }).catch((e) => {
      onPersonalizeWithDataChange && onPersonalizeWithDataChange(!next);
      showToast(friendlyPreferencesError(e.code || e.message));
    });
  };

  // Best-effort mirror only, same as Night mode above — the real local
  // change (onTextSizeChange, working with no account) is what actually
  // scales the app; a failed save here never blocks or rolls back the
  // visual change, it just leaves the synced value stale until next edit.
  const handleTextSizeChange = (index) => {
    onTextSizeChange && onTextSizeChange(index);
    patchNotificationPreferences({ text_size_index: index }).catch(() => {});
  };

  const handleClearHistory = () => {
    onClearAskAynaHistory && onClearAskAynaHistory();
    setClearHistoryConfirm(false);
    showToast('Ask Ayna history cleared.');
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

  const channelsSummary = prefs
    ? [{ push: 'Push', sms: 'Text message', email: 'Email' }[prefs.deliveryChannel], prefs.quietHoursEnabled ? `Quiet ${prefs.quietHoursStart}–${prefs.quietHoursEnd}` : null]
        .filter(Boolean)
        .join(' · ')
    : '';

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <BackHeader title="Preferences" onBack={onBack} />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '0 20px 30px' }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 'calc(26px * var(--ayna-text-scale, 1))', lineHeight: 1.25, margin: '4px 0 6px', color: 'var(--ayna-heading)' }}>How Ayna reaches you.</div>
        <div style={{ fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.55, marginBottom: 22 }}>Everything here is off by default and reversible.</div>

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
                <div style={{ fontWeight: 600, fontSize: 'calc(15px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)' }}>Join newsletter</div>
                {newsletterConfirmed && (
                  <div style={{ fontSize: 'calc(10px * var(--ayna-text-scale, 1))', fontWeight: 600, color: '#2F6B4F', background: 'var(--ayna-chip-bg)', padding: '2px 8px', borderRadius: 99 }}>Subscribed</div>
                )}
              </div>
              <div style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', marginTop: 3, lineHeight: 1.45 }}>
                {newsletterConfirmed ? "You're on the list — The Mirror lands monthly." : 'The Mirror — one letter a month, no products pushed.'}
              </div>
            </div>
            <ExternalLinkIcon />
          </div>
          {awaitingConfirm && !newsletterConfirmed && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '0 0 14px' }}>
              <div style={{ fontSize: 'calc(12px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)' }}>Subscribed on Substack?</div>
              <div
                onClick={handleConfirmSubscribed}
                style={{ fontSize: 'calc(12px * var(--ayna-text-scale, 1))', fontWeight: 700, color: '#2F6B4F', cursor: 'pointer', padding: '6px 12px', background: 'var(--ayna-chip-bg)', borderRadius: 99, flex: 'none' }}
              >
                Yes, I'm in
              </div>
            </div>
          )}
        </div>

        <SectionLabel>Notifications</SectionLabel>
        {loadState === 'loading' && (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--ayna-text-muted)', fontSize: 'calc(13px * var(--ayna-text-scale, 1))' }}>Loading your preferences…</div>
        )}
        {loadState === 'signed_out' && (
          <div style={{ border: '1px dashed var(--ayna-border)', borderRadius: 20, padding: 18, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.55, textAlign: 'center' }}>
            Sign in to manage how Ayna reaches you — these settings save to your account, not just this device.
          </div>
        )}
        {loadState === 'error' && (
          <div style={{ border: '1px dashed var(--ayna-border)', borderRadius: 20, padding: 18, textAlign: 'center' }}>
            <div style={{ fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.55, marginBottom: 12 }}>Couldn't load your preferences.</div>
            <div onClick={retry} style={{ display: 'inline-block', background: 'var(--ayna-cta-bg)', color: 'var(--ayna-cta-text)', fontWeight: 600, fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', padding: '9px 16px', borderRadius: 99, cursor: 'pointer' }}>Try again</div>
          </div>
        )}
        {loadState === 'ready' && prefs && (
          <>
            <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 22, padding: '4px 18px' }}>
              <ToggleRow first title="Notifications" sub="Recalls and safety flags on things you own." on={prefs.notificationsEnabled} onClick={() => patchField('notifications_enabled', !prefs.notificationsEnabled, 'notificationsEnabled')} />
              <ToggleRow title="Updates" sub="New matches and restocks, weekly digest." on={prefs.updatesEnabled} onClick={() => patchField('updates_enabled', !prefs.updatesEnabled, 'updatesEnabled')} />
              <DrillRow title="Channels & quiet hours" sub={channelsSummary} onClick={onOpenChannels} />
            </div>

            <SectionLabel>AI & personalization</SectionLabel>
            <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 22, padding: '4px 18px' }}>
              <ToggleRow first title="Personalize with my data" sub="Your intake answers and cycle logs shape your matches and Ask Ayna replies." on={personalizeWithData} onClick={handlePersonalizeToggle} />
            </div>
          </>
        )}

        {/* Clearing Ask Ayna history is purely local (in-memory chat state in
            MobileApp.jsx — nothing is stored server-side for this feature),
            so unlike the toggles above it needs no account and works whether
            or not the fetch above succeeded. */}
        {loadState !== 'ready' && <SectionLabel>AI & personalization</SectionLabel>}
        <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 22, padding: '4px 18px', marginTop: loadState === 'ready' ? 20 : 0 }}>
          <div onClick={() => setClearHistoryConfirm(true)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '17px 0', cursor: 'pointer' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 'calc(15px * var(--ayna-text-scale, 1))', color: '#B4402A' }}>Clear Ask Ayna history</div>
              <div style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', marginTop: 3, lineHeight: 1.45 }}>
                {askAynaHistoryCount} conversation{askAynaHistoryCount === 1 ? '' : 's'} this session. Deleted for good, not archived.
              </div>
            </div>
            <ChevronIcon />
          </div>
          {clearHistoryConfirm && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '0 0 14px' }}>
              <div
                onClick={() => setClearHistoryConfirm(false)}
                style={{ fontSize: 'calc(12px * var(--ayna-text-scale, 1))', fontWeight: 600, color: 'var(--ayna-text-muted)', cursor: 'pointer', padding: '6px 12px' }}
              >
                Cancel
              </div>
              <div
                onClick={handleClearHistory}
                style={{ fontSize: 'calc(12px * var(--ayna-text-scale, 1))', fontWeight: 700, color: '#B4402A', cursor: 'pointer', padding: '6px 12px', background: 'rgba(180,64,42,.1)', borderRadius: 99, flex: 'none' }}
              >
                Yes, clear it
              </div>
            </div>
          )}
        </div>
        <div style={{ fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)', lineHeight: 1.5, margin: '10px 2px 0' }}>
          This is separate from the analytics toggle in Privacy & data — that one is about anonymised usage stats, this one shapes what you see.
        </div>

        {/* Appearance — always local, no account needed. */}
        <SectionLabel>Appearance</SectionLabel>
        <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 22, padding: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 'calc(14.5px * var(--ayna-text-scale, 1))', marginBottom: 12 }}>Theme</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
            {THEME_SWATCHES.map((s) => (
              <ThemeSwatch key={s.key} mode={s.key} selected={theme === s.key} onClick={() => onToggleTheme(s.key)} />
            ))}
          </div>
        </div>

        <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 22, padding: 18, marginTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 'calc(14.5px * var(--ayna-text-scale, 1))' }}>Text size</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9.5px * var(--ayna-text-scale, 1))', letterSpacing: '.6px', color: 'var(--ayna-accent-dark)', background: 'var(--ayna-chip-bg)', padding: '3px 9px', borderRadius: 99 }}>
              {TEXT_SIZE_STEPS[textSizeIndex]?.label}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 'calc(12px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)', flex: 'none' }}>A</span>
            <div style={{ flex: 1, display: 'flex', gap: 6 }}>
              {TEXT_SIZE_STEPS.map((step, i) => (
                <div
                  key={step.label}
                  onClick={() => handleTextSizeChange(i)}
                  style={{ flex: 1, height: 8, borderRadius: 99, cursor: 'pointer', background: i === textSizeIndex ? 'var(--ayna-heading)' : 'var(--ayna-border)' }}
                />
              ))}
            </div>
            <span style={{ fontSize: 'calc(20px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)', flex: 'none' }}>A</span>
          </div>
          <div style={{ marginTop: 14, fontSize: 'calc(14px * var(--ayna-text-scale, 1))', fontWeight: 600, color: 'var(--ayna-text)', lineHeight: 1.5 }}>
            This is what body text looks like across ayna.
          </div>
        </div>

        {/* Region — both rows are informational only, matching how far the
            real app actually reaches today (US-only, English-only); no
            picker is shown for either since there is nothing real to pick
            from yet. */}
        <SectionLabel>Region</SectionLabel>
        <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 22, padding: '4px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '17px 0' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 'calc(15px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)' }}>Language</div>
              <div style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', marginTop: 3, lineHeight: 1.45 }}>More languages are on the way.</div>
            </div>
            <div style={{ fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)', flex: 'none' }}>English</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '17px 0', borderTop: '1px solid var(--ayna-border)' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 'calc(15px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)' }}>Ship to</div>
              <div style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', marginTop: 3, lineHeight: 1.45 }}>United States only, for now.</div>
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(10.5px * var(--ayna-text-scale, 1))', letterSpacing: '.6px', color: 'var(--ayna-text-faint)', border: '1px solid var(--ayna-border)', borderRadius: 99, padding: '4px 9px', flex: 'none' }}>US</div>
          </div>
        </div>

        <div style={{ marginTop: 20, fontSize: 'calc(12px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.55, textAlign: 'center', padding: '0 10px' }}>Ayna never sells your health data.</div>

        {toast && (
          <div style={{ position: 'fixed', left: 20, right: 20, bottom: 24, background: '#B4402A', color: '#FFF9F2', fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', fontWeight: 600, padding: '12px 16px', borderRadius: 14, textAlign: 'center', boxShadow: '0 14px 30px -12px rgba(180,64,42,.5)' }}>
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}

// Split out of PreferencesScreen so "delivery channel" and "quiet hours" —
// both real, account-scoped fields on the same notification_preferences row
// — get their own focused screen, matching the design's IA. Owns its own
// fetch/patch rather than receiving `prefs` as a prop from PreferencesScreen,
// since the two screens are never mounted at the same time (screenStack
// navigation swaps one for the other) — sharing state would need lifting it
// to the orchestrator for no real benefit.
function ChannelsScreen({ onBack }) {
  const [loadState, setLoadState] = useState('loading');
  const [prefs, setPrefs] = useState(null);
  const [toast, setToast] = useState('');
  const [phoneVerifyOpen, setPhoneVerifyOpen] = useState(false);

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

  const selectChannel = (key) => {
    if (!prefs || key === prefs.deliveryChannel) return;
    if (key === 'sms' && !prefs.phoneVerified) {
      setPhoneVerifyOpen(true);
      return;
    }
    patchField('delivery_channel', key, 'deliveryChannel');
  };

  const patchQuietHoursTime = (field, value) => {
    if (!prefs || !value) return;
    patchField(field, value, field === 'quiet_hours_start' ? 'quietHoursStart' : 'quietHoursEnd');
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
      <BackHeader title="Channels & quiet hours" onBack={onBack} />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '0 20px 30px' }}>
        {loadState === 'loading' && (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--ayna-text-muted)', fontSize: 'calc(13px * var(--ayna-text-scale, 1))' }}>Loading…</div>
        )}
        {loadState === 'signed_out' && (
          <div style={{ marginTop: 16, border: '1px dashed var(--ayna-border)', borderRadius: 20, padding: 18, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.55, textAlign: 'center' }}>
            Sign in to manage channels and quiet hours.
          </div>
        )}
        {loadState === 'error' && (
          <div style={{ marginTop: 16, border: '1px dashed var(--ayna-border)', borderRadius: 20, padding: 18, textAlign: 'center' }}>
            <div style={{ fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.55, marginBottom: 12 }}>Couldn't load this.</div>
            <div onClick={retry} style={{ display: 'inline-block', background: 'var(--ayna-cta-bg)', color: 'var(--ayna-cta-text)', fontWeight: 600, fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', padding: '9px 16px', borderRadius: 99, cursor: 'pointer' }}>Try again</div>
          </div>
        )}
        {loadState === 'ready' && prefs && (
          <>
            <SectionLabel>Delivery channel</SectionLabel>
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
                  <div style={{ flex: 1, fontSize: 'calc(14.5px * var(--ayna-text-scale, 1))', fontWeight: 500, color: 'var(--ayna-text)' }}>{label}</div>
                  {badge && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9px * var(--ayna-text-scale, 1))', letterSpacing: '.8px', color: 'var(--ayna-text-muted)', border: '1px solid var(--ayna-border)', borderRadius: 99, padding: '3px 7px' }}>{badge}</div>}
                </div>
              ))}
            </div>

            <SectionLabel>Quiet hours</SectionLabel>
            <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 22, padding: '4px 18px' }}>
              <ToggleRow first title="Quiet hours" sub="Hold notifications overnight; they'll still be there when it opens." on={prefs.quietHoursEnabled} onClick={() => patchField('quiet_hours_enabled', !prefs.quietHoursEnabled, 'quietHoursEnabled')} />
              {prefs.quietHoursEnabled && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0 16px' }}>
                  <label style={{ flex: 1 }}>
                    <div style={{ fontSize: 'calc(11px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', marginBottom: 4 }}>From</div>
                    <input
                      type="time"
                      value={prefs.quietHoursStart}
                      onChange={(e) => patchQuietHoursTime('quiet_hours_start', e.target.value)}
                      style={{ width: '100%', border: '1px solid var(--ayna-border)', borderRadius: 12, padding: '9px 10px', fontSize: 'calc(14px * var(--ayna-text-scale, 1))', background: 'var(--ayna-bg-alt)', color: 'var(--ayna-text)', boxSizing: 'border-box' }}
                    />
                  </label>
                  <label style={{ flex: 1 }}>
                    <div style={{ fontSize: 'calc(11px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', marginBottom: 4 }}>To</div>
                    <input
                      type="time"
                      value={prefs.quietHoursEnd}
                      onChange={(e) => patchQuietHoursTime('quiet_hours_end', e.target.value)}
                      style={{ width: '100%', border: '1px solid var(--ayna-border)', borderRadius: 12, padding: '9px 10px', fontSize: 'calc(14px * var(--ayna-text-scale, 1))', background: 'var(--ayna-bg-alt)', color: 'var(--ayna-text)', boxSizing: 'border-box' }}
                    />
                  </label>
                </div>
              )}
            </div>
          </>
        )}

        {toast && (
          <div style={{ position: 'fixed', left: 20, right: 20, bottom: 24, background: '#B4402A', color: '#FFF9F2', fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', fontWeight: 600, padding: '12px 16px', borderRadius: 14, textAlign: 'center', boxShadow: '0 14px 30px -12px rgba(180,64,42,.5)' }}>
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
        <div style={{ margin: '4px 0 11px', fontFamily: "'DM Mono',monospace", fontSize: 'calc(10px * var(--ayna-text-scale, 1))', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)' }}>About Ayna</div>
        <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 22, padding: '0 18px' }}>
          {aboutRows.map((r, i) => (
            <div key={r.title} onClick={r.onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0', borderTop: i === 0 ? 'none' : '1px solid var(--ayna-border)', cursor: r.onClick ? 'pointer' : 'default' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 'calc(14.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)' }}>{r.title}</div>
                <div style={{ fontSize: 'calc(12px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', marginTop: 2, lineHeight: 1.45 }}>{r.sub}</div>
              </div>
              {r.external ? <ExternalLinkIcon /> : <ChevronIcon />}
            </div>
          ))}
        </div>

        <div style={{ margin: '24px 0 11px', fontFamily: "'DM Mono',monospace", fontSize: 'calc(10px * var(--ayna-text-scale, 1))', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)' }}>Your account</div>
        <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 22, padding: '0 18px' }}>
          <div onClick={onOpenAccountInfo} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0', cursor: 'pointer' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, fontSize: 'calc(14.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)' }}>Account information</div>
              {accountPreview && (
                <div style={{ fontSize: 'calc(12px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', marginTop: 2 }}>{accountPreview}</div>
              )}
            </div>
            <ChevronIcon />
          </div>
          <div onClick={onOpenPrivacyData} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0', borderTop: '1px solid var(--ayna-border)', cursor: 'pointer' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, fontSize: 'calc(14.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)' }}>Privacy & data</div>
              <div style={{ fontSize: 'calc(12px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', marginTop: 2, lineHeight: 1.45 }}>Policies, what we hold, exports and deletion.</div>
            </div>
            <ChevronIcon />
          </div>
          <div onClick={onOpenLegal} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0', borderTop: '1px solid var(--ayna-border)', cursor: 'pointer' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, fontSize: 'calc(14.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)' }}>Legal</div>
              <div style={{ fontSize: 'calc(12px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', marginTop: 2, lineHeight: 1.45 }}>Policies, terms and licences.</div>
            </div>
            <ChevronIcon />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0', borderTop: '1px solid var(--ayna-border)', opacity: 0.55 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, fontSize: 'calc(14.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)' }}>Subscription</div>
              <div style={{ fontSize: 'calc(12px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', marginTop: 2, lineHeight: 1.45 }}>Ayna is free while we're in beta.</div>
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9px * var(--ayna-text-scale, 1))', letterSpacing: '.9px', color: 'var(--ayna-text-muted)', border: '1px solid var(--ayna-border)', borderRadius: 99, padding: '4px 8px', flex: 'none' }}>COMING SOON</div>
          </div>
          <div onClick={onOpenContact} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0', borderTop: '1px solid var(--ayna-border)', cursor: 'pointer' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, fontSize: 'calc(14.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)' }}>Contact</div>
              <div style={{ fontSize: 'calc(12px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', marginTop: 2 }}>Usually a reply within a day.</div>
            </div>
            <ChevronIcon />
          </div>
        </div>

        {authUser ? (
          <div onClick={onSignOut} style={{ marginTop: 22, textAlign: 'center', padding: '14px 0', border: '1px solid rgba(180,64,42,.3)', borderRadius: 99, color: '#B4402A', fontWeight: 600, fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', cursor: 'pointer', background: 'var(--ayna-surface)' }}>Sign out</div>
        ) : (
          <div onClick={onSignIn} style={{ marginTop: 22, textAlign: 'center', padding: '14px 0', border: '1px solid var(--ayna-border)', borderRadius: 99, color: 'var(--ayna-heading)', fontWeight: 600, fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', cursor: 'pointer', background: 'var(--ayna-surface)' }}>Sign in</div>
        )}
        <div style={{ textAlign: 'center', marginTop: 16, fontFamily: "'DM Mono',monospace", fontSize: 'calc(10px * var(--ayna-text-scale, 1))', letterSpacing: '1.2px', color: 'var(--ayna-text-muted)' }}>AYNA 0.9.4 · BETA</div>
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

function PrivacyDataScreen({ onBack, onOpenManageData, onOpenDeleteAccount }) {
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
        <div style={{ fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.6, marginBottom: 20 }}>
          Your health answers are the most sensitive thing you give us. Here is everything we hold, and every way to take it back.
        </div>

        <div style={{ margin: '0 0 11px', fontFamily: "'DM Mono',monospace", fontSize: 'calc(10px * var(--ayna-text-scale, 1))', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)' }}>Your data</div>
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
            sub="We'll process it within a week — nothing kept after."
            onClick={onOpenDeleteAccount}
          />
        </div>
        <div style={{ fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)', lineHeight: 1.55, marginTop: 9, padding: '0 4px' }}>
          Deletion removes your account and health answers from our active systems. We may keep limited records where the law requires it — never your health data.
        </div>

        <div style={{ margin: '24px 0 11px', fontFamily: "'DM Mono',monospace", fontSize: 'calc(10px * var(--ayna-text-scale, 1))', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)' }}>What you share</div>
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
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9.5px * var(--ayna-text-scale, 1))', letterSpacing: '1.3px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)', marginBottom: 8 }}>How AI is used</div>
          <div style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.6 }}>
            Ask Ayna and match explanations are powered by a third-party AI provider (Anthropic). Your questions and relevant profile details are shared with them to generate a response — never sold, and never used to train anyone else's model.
          </div>
          <div onClick={() => window.open(PRIVACY_POLICY_URL, '_blank', 'noopener,noreferrer')} style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-heading)', fontWeight: 600, marginTop: 10, cursor: 'pointer' }}>
            Read the full privacy policy
          </div>
        </div>

        <div style={{ fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)', lineHeight: 1.55, marginTop: 16, padding: '0 4px' }}>
          Privacy questions? Email <a href="mailto:puloma@aynahealth.co">puloma@aynahealth.co</a>.
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- Legal ---------------------------------- */

function LegalScreen({ onBack, onOpenConsumerHealthData, onOpenOpenSourceLicenses, onOpenTypefaces, onOpenResearchSources }) {
  const licenseFamilies = summarizeLicenses();
  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <BackHeader title="Legal" onBack={onBack} />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '8px 20px 30px' }}>
        <div style={{ margin: '4px 0 11px', fontFamily: "'DM Mono',monospace", fontSize: 'calc(10px * var(--ayna-text-scale, 1))', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)' }}>Policies</div>
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
          <AccountRow
            title="Consumer Health Data Policy"
            sub="Required under Washington's MHMDA."
            onClick={onOpenConsumerHealthData}
          />
        </div>

        <div style={{ margin: '24px 0 11px', fontFamily: "'DM Mono',monospace", fontSize: 'calc(10px * var(--ayna-text-scale, 1))', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)' }}>Attributions</div>
        <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 22, padding: '0 18px' }}>
          <AccountRow
            title="Open-source licences"
            sub={`${OPEN_SOURCE_PACKAGES.length} packages · ${licenseFamilies.join(', ')}.`}
            borderTop={false}
            onClick={onOpenOpenSourceLicenses}
          />
          <AccountRow title="Typefaces" sub="Playfair Display, DM Sans, DM Mono — Google Fonts, SIL Open Font Licence." onClick={onOpenTypefaces} />
          <AccountRow title="Research and data sources" sub="Where ayna's product and safety information comes from." onClick={onOpenResearchSources} />
        </div>

        <div style={{ marginTop: 22, background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 22, padding: '17px 18px' }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9.5px * var(--ayna-text-scale, 1))', letterSpacing: '1.3px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)', marginBottom: 8 }}>Not medical advice</div>
          <div style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.6 }}>
            Ayna is a discovery and education tool. Nothing here diagnoses, treats or prevents a condition, and no match replaces a conversation with your clinician.
          </div>
        </div>

        <div style={{ fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)', lineHeight: 1.55, marginTop: 16, padding: '0 4px' }}>
          Questions about these policies? Email <a href="mailto:puloma@aynahealth.co">puloma@aynahealth.co</a>.
        </div>

        <div style={{ textAlign: 'center', marginTop: 22, fontFamily: "'DM Mono',monospace", fontSize: 'calc(10px * var(--ayna-text-scale, 1))', letterSpacing: '1.2px', color: 'var(--ayna-text-muted)', lineHeight: 1.9 }}>
          AYNA HEALTH, INC.<br />DELAWARE, USA<br />APP 0.9.4 · BETA
        </div>
      </div>
    </div>
  );
}

/* ------------------------ Consumer Health Data Policy ------------------------ */

// Real disclosures reflecting how ayna actually works today — the third
// parties named here (Supabase, Anthropic/OpenAI/Gemini, PostHog, Twilio,
// Resend) are the app's actual real integrations (see .env.example), and
// the rights described map to screens that already exist and work (Manage
// my data / Download my data, the analytics opt-out toggle in Privacy &
// data, account deletion via the email below) rather than promises of
// features that don't exist yet.
//
// This is a good-faith draft written to cover Washington's My Health My
// Data Act's (MHMDA) required disclosures. It has NOT been reviewed by a
// lawyer — that review should happen before this is relied on as ayna's
// actual compliance policy, the same as the Termly-generated Privacy
// Policy/Terms of Service linked above were presumably reviewed before
// publishing.
const HEALTH_DATA_PROCESSORS = [
  { initial: 'S', name: 'Supabase', role: 'Hosts your account and stored data.', bg: '#E6EFE6', fg: '#3F6B4A' },
  { initial: 'A', name: 'Anthropic, OpenAI, Google', role: 'Generate product summaries and Ask Ayna answers.', bg: '#FDF0DC', fg: '#9A5B14' },
  { initial: 'T', name: 'Twilio', role: 'Sends verification codes and opt-in safety-recall texts.', bg: '#E7EAF5', fg: '#3B4677' },
  { initial: 'R', name: 'Resend', role: 'Delivers email, including contact-form messages.', bg: '#F5E9F0', fg: '#7A3E60' },
  { initial: 'P', name: 'PostHog', role: 'Anonymised usage analytics — off any time in Privacy & data.', bg: '#F1EDE6', fg: '#6B6257' },
];

const HEALTH_DATA_RIGHTS = [
  { title: 'See exactly what we hold', how: 'Settings → Privacy & data → Manage my data' },
  { title: 'Download a copy', how: 'Same screen, in a portable format' },
  { title: 'Withdraw consent for analytics', how: 'Settings → Privacy & data → the analytics toggle' },
  { title: 'Delete your account and data', how: 'Email puloma@aynahealth.co — providers are directed too' },
];

function NumberedCard({ n, title, children }) {
  return (
    <div style={{ marginTop: 14, background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 24, padding: 18, boxShadow: '0 2px 10px rgba(41,37,36,.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 26, height: 26, borderRadius: 99, background: '#FDF0DC', color: '#9A5B14', fontFamily: "'DM Mono',monospace", fontSize: 'calc(10px * var(--ayna-text-scale, 1))', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>{n}</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 'calc(17px * var(--ayna-text-scale, 1))', color: 'var(--ayna-heading)' }}>{title}</div>
      </div>
      {children}
    </div>
  );
}

function ConsumerHealthDataPolicyScreen({ onBack }) {
  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <BackHeader title="Health data policy" onBack={onBack} />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '6px 20px 30px' }}>
        <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(150deg,#EFF3EC,#E3EDE2 60%,#D6E7D6)', border: '1px solid #CFE0CE', borderRadius: 26, padding: 20, boxShadow: '0 3px 14px rgba(63,107,74,.08)' }}>
          <div style={{ position: 'absolute', right: -30, top: -34, width: 110, height: 110, borderRadius: 99, background: 'rgba(255,255,255,.4)' }} />
          <div style={{ position: 'relative', width: 38, height: 38, borderRadius: 99, background: '#FFFCF9', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 5px rgba(63,107,74,.14)' }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#3F6B4A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v6c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6z" /><path d="M9 12l2 2 4-4" /></svg>
          </div>
          <div style={{ position: 'relative', fontFamily: "'Playfair Display',serif", fontSize: 'calc(23px * var(--ayna-text-scale, 1))', lineHeight: 1.2, marginTop: 13, color: '#25382A' }}>Your health answers stay yours.</div>
          <div style={{ position: 'relative', fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', lineHeight: 1.6, color: '#42604A', marginTop: 8 }}>We never sell them, and we never trade them for advertising. Here is the whole picture, in plain words.</div>
          <div style={{ position: 'relative', display: 'inline-flex', gap: 6, marginTop: 13 }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9px * var(--ayna-text-scale, 1))', letterSpacing: '1px', background: '#FFFCF9', color: '#3F6B4A', borderRadius: 99, padding: '5px 10px' }}>EFFECTIVE 10 SEP 2026</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9px * var(--ayna-text-scale, 1))', letterSpacing: '1px', background: '#FFFCF9', color: '#3F6B4A', borderRadius: 99, padding: '5px 10px' }}>WA MHMDA</div>
          </div>
        </div>

        <NumberedCard n="01" title="What counts as health data">
          <div style={{ fontSize: 'calc(13px * var(--ayna-text-scale, 1))', lineHeight: 1.65, color: 'var(--ayna-text-muted)', marginTop: 11 }}>
            Anything linked to you that says something about your past, present or future physical or mental health — including reproductive and sexual health, conditions, diagnoses, symptoms, and whatever you tell Ask Ayna about any of it.
          </div>
        </NumberedCard>

        <NumberedCard n="02" title="What we collect, and why">
          <div style={{ fontSize: 'calc(13px * var(--ayna-text-scale, 1))', lineHeight: 1.65, color: 'var(--ayna-text-muted)', marginTop: 11 }}>
            Your intake answers, your questions to Ask Ayna, and the products you save. We use them to build your matches, explain why a product fits, and flag safety recalls on what you own — nothing else.
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
            {['INTAKE ANSWERS', 'ASK AYNA', 'SAVED PRODUCTS'].map((t) => (
              <div key={t} style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9px * var(--ayna-text-scale, 1))', letterSpacing: '.9px', background: 'var(--ayna-chip-bg)', color: 'var(--ayna-text-muted)', borderRadius: 99, padding: '5px 9px' }}>{t}</div>
            ))}
          </div>
        </NumberedCard>

        <NumberedCard n="03" title="Who touches it">
          <div style={{ fontSize: 'calc(13px * var(--ayna-text-scale, 1))', lineHeight: 1.65, color: 'var(--ayna-text-muted)', marginTop: 11 }}>Five service providers, each doing exactly one job for us.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 13 }}>
            {HEALTH_DATA_PROCESSORS.map((p) => (
              <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 11, background: 'var(--ayna-chip-bg)', borderRadius: 18, padding: '11px 13px' }}>
                <div style={{ width: 34, height: 34, borderRadius: 12, flex: 'none', background: p.bg, color: p.fg, fontFamily: "'Playfair Display',serif", fontSize: 'calc(16px * var(--ayna-text-scale, 1))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{p.initial}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 'calc(13px * var(--ayna-text-scale, 1))', fontWeight: 600, color: 'var(--ayna-text)' }}>{p.name}</div>
                  <div style={{ fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.45, marginTop: 2 }}>{p.role}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)', lineHeight: 1.55, marginTop: 11 }}>We do not sell your health data, and we do not share it for advertising.</div>
        </NumberedCard>

        <NumberedCard n="04" title="What you can ask for">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 13 }}>
            {HEALTH_DATA_RIGHTS.map((r) => (
              <div key={r.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 20, height: 20, borderRadius: 99, background: '#E6EFE6', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', marginTop: 1 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#3F6B4A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 'calc(13px * var(--ayna-text-scale, 1))', fontWeight: 600, color: 'var(--ayna-text)' }}>{r.title}</div>
                  <div style={{ fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.5, marginTop: 2 }}>{r.how}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)', lineHeight: 1.55, marginTop: 13 }}>We answer within 45 days, and never lock you out of ayna for asking.</div>
        </NumberedCard>

        <div style={{ marginTop: 14, display: 'flex', alignItems: 'flex-start', gap: 12, background: '#EFF3EC', border: '1px solid #CFE0CE', borderRadius: 24, padding: '16px 18px' }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#3F6B4A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', marginTop: 1 }}><path d="M12 21s-7-5.1-7-10a7 7 0 1 1 14 0c0 4.9-7 10-7 10z" /><path d="M4 4l16 16" /></svg>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', fontWeight: 600, color: '#25382A' }}>No geofencing. Ever.</div>
            <div style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: '#42604A', lineHeight: 1.6, marginTop: 4 }}>We don't draw boundaries around clinics to collect your location, message you, or guess that you sought care.</div>
          </div>
        </div>

        <div style={{ marginTop: 14, background: '#242A52', borderRadius: 24, padding: 19, color: '#F3EFE9' }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 'calc(18px * var(--ayna-text-scale, 1))' }}>Questions, or an appeal?</div>
          <div style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', lineHeight: 1.6, color: '#C7CADC', marginTop: 7 }}>If we deny a request, reply to our decision email and a person will look at it again within 45 days.</div>
          <a
            href={DELETE_ACCOUNT_MAILTO.replace('subject=Account%20Deletion%20Request', 'subject=Consumer%20Health%20Data%20Question')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 14, background: '#FFFCF9', color: '#242A52', borderRadius: 99, padding: '11px 17px', fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', fontWeight: 600, textDecoration: 'none' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#242A52" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M4 7l8 6 8-6" /></svg>
            puloma@aynahealth.co
          </a>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- Open-source licences ---------------------------- */

const LICENSE_GROUP_STYLES = {
  MIT: { tint: '#FDF0DC', ink: '#9A5B14' },
  'Apache-2.0': { tint: '#E6EFE6', ink: '#3F6B4A' },
  '(MPL-2.0 OR Apache-2.0)': { tint: '#E7EAF5', ink: '#3B4677' },
  '(Apache-2.0 AND MIT)': { tint: '#F5E9F0', ink: '#7A3E60' },
  '0BSD': { tint: '#F1EDE6', ink: '#6B6257' },
};

function downloadText(content, filename) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function buildLicensesText(grouped) {
  const lines = ['ayna — open-source licences', `Generated ${new Date().toISOString().slice(0, 10)}`, ''];
  for (const [license, packages] of grouped) {
    lines.push(`${license} (${packages.length})`, '-'.repeat(40));
    for (const pkg of packages) lines.push(`  ${pkg.name}@${pkg.version}`);
    lines.push('');
  }
  return lines.join('\n');
}

function OpenSourceLicensesScreen({ onBack }) {
  const grouped = useMemo(() => {
    const byLicense = new Map();
    for (const pkg of OPEN_SOURCE_PACKAGES) {
      if (!byLicense.has(pkg.license)) byLicense.set(pkg.license, []);
      byLicense.get(pkg.license).push(pkg);
    }
    return [...byLicense.entries()].sort((a, b) => b[1].length - a[1].length);
  }, []);

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <BackHeader title="Open-source licences" onBack={onBack} />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '6px 20px 30px' }}>
        <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(150deg,#FFF4E2,#FFE7C6 55%,#FFDCA8)', border: '1px solid #F0D9B4', borderRadius: 26, padding: '20px 20px 18px', boxShadow: '0 3px 14px rgba(192,118,31,.09)' }}>
          <div style={{ position: 'absolute', right: -34, top: -30, width: 118, height: 118, borderRadius: 99, background: 'rgba(255,255,255,.42)' }} />
          <div style={{ position: 'absolute', right: 26, bottom: -42, width: 74, height: 74, borderRadius: 99, background: 'rgba(255,255,255,.3)' }} />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'baseline', gap: 9 }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 'calc(52px * var(--ayna-text-scale, 1))', lineHeight: .9, color: '#7A4410' }}>{OPEN_SOURCE_PACKAGES.length}</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(10px * var(--ayna-text-scale, 1))', letterSpacing: '1.4px', textTransform: 'uppercase', color: '#9A5B14', paddingBottom: 5 }}>packages<br />inside ayna</div>
          </div>
          <div style={{ position: 'relative', fontSize: 'calc(13px * var(--ayna-text-scale, 1))', lineHeight: 1.6, color: '#6B4413', marginTop: 12, maxWidth: 250 }}>These are the ones actually bundled into what runs on your device — not build tooling.</div>
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 14, background: '#FFFCF9', borderRadius: 99, padding: '7px 13px 7px 10px', boxShadow: '0 1px 4px rgba(122,68,16,.12)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#E8843C" style={{ flex: 'none' }}><path d="M12 21s-7.5-4.7-9.5-9A5.2 5.2 0 0 1 12 6.6 5.2 5.2 0 0 1 21.5 12c-2 4.3-9.5 9-9.5 9z" /></svg>
            <div style={{ fontSize: 'calc(12px * var(--ayna-text-scale, 1))', color: '#7A4410', fontWeight: 500 }}>Thank you to everyone who maintains them</div>
          </div>
        </div>

        {grouped.map(([license, packages]) => {
          const style = LICENSE_GROUP_STYLES[license] || { tint: 'var(--ayna-chip-bg)', ink: 'var(--ayna-text-muted)' };
          return (
            <div key={license} style={{ margin: '22px 0 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 4px 9px' }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9px * var(--ayna-text-scale, 1))', letterSpacing: '1.1px', textTransform: 'uppercase', background: style.tint, color: style.ink, borderRadius: 99, padding: '5px 10px' }}>{license}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9px * var(--ayna-text-scale, 1))', color: style.ink, background: '#FFFCF9', border: `1px solid ${style.tint}`, borderRadius: 99, minWidth: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px' }}>{packages.length}</div>
                <div style={{ flex: 1, height: 1, background: 'var(--ayna-border)' }} />
              </div>
              <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 24, padding: '6px 8px', boxShadow: '0 2px 10px rgba(41,37,36,.04)' }}>
                {packages.map((pkg, i) => (
                  <div key={pkg.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 10px', borderRadius: 14, boxShadow: i ? '0 -1px 0 var(--ayna-border)' : 'none' }}>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pkg.name}</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(10px * var(--ayna-text-scale, 1))', color: style.ink, background: style.tint, borderRadius: 99, padding: '4px 8px', flex: 'none' }}>{pkg.version}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <div style={{ marginTop: 24, background: 'var(--ayna-surface)', border: '1px dashed var(--ayna-border)', borderRadius: 24, padding: '16px 18px', textAlign: 'center' }}>
          <div style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.6 }}>Full licence texts ship with every build.</div>
          <div
            onClick={() => downloadText(buildLicensesText(grouped), 'ayna-open-source-licences.txt')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 10, background: '#242A52', color: '#FFFCF9', borderRadius: 99, padding: '10px 17px', fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', fontWeight: 600, cursor: 'pointer' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFCF9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12" /><path d="M7 11l5 5 5-5" /><path d="M4 21h16" /></svg>
            Download licences.txt
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- Typefaces ---------------------------------- */

const TYPEFACES = [
  {
    key: 'pf', name: 'Playfair Display', role: 'Headlines and product names',
    designer: 'Claus Eggers Sørensen', weights: 'Regular, Medium, Italic',
    font: "'Playfair Display',serif", size: 26,
  },
  {
    key: 'dms', name: 'DM Sans', role: 'Body copy and interface',
    designer: 'Colophon Foundry, for Google Fonts', weights: '400, 500, 600, 700',
    font: "'DM Sans',sans-serif", size: 21,
  },
  {
    key: 'dmm', name: 'DM Mono', role: 'Labels, versions, timestamps',
    designer: 'Colophon Foundry, for Google Fonts', weights: '400, 500',
    font: "'DM Mono',monospace", size: 17,
  },
];

const SIL_OFL_URL = 'https://scripts.sil.org/OFL';

function TypefaceRow({ face, open, onToggle }) {
  return (
    <div style={{ marginTop: 14, background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 24, overflow: 'hidden', boxShadow: '0 2px 10px rgba(41,37,36,.04)' }}>
      <div onClick={onToggle} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', cursor: 'pointer' }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, flex: 'none', background: '#FDF0DC', color: '#9A5B14', fontFamily: face.font, fontSize: 'calc(19px * var(--ayna-text-scale, 1))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Ag</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 'calc(14.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)' }}>{face.name}</div>
          <div style={{ fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', marginTop: 2, lineHeight: 1.45 }}>{face.role}</div>
        </div>
        <div style={{ flex: 'none', transition: 'transform .2s ease', transform: `rotate(${open ? 180 : 0}deg)` }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
        </div>
      </div>
      {open && (
        <div style={{ padding: '0 18px 18px' }}>
          <div style={{ fontFamily: face.font, fontSize: face.size, lineHeight: 1.35, color: 'var(--ayna-text)', borderTop: '1px solid var(--ayna-border)', paddingTop: 15 }}>
            Nothing reaches you unchecked.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
            {[['Designer', face.designer], ['Licence', 'SIL Open Font Licence 1.1'], ['Weights', face.weights]].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', gap: 10, fontSize: 'calc(12px * var(--ayna-text-scale, 1))' }}>
                <div style={{ width: 64, flex: 'none', fontFamily: "'DM Mono',monospace", fontSize: 'calc(9.5px * var(--ayna-text-scale, 1))', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--ayna-text-faint)', paddingTop: 2 }}>{label}</div>
                <div style={{ flex: 1, color: 'var(--ayna-text-muted)' }}>{value}</div>
              </div>
            ))}
          </div>
          <div onClick={() => window.open(SIL_OFL_URL, '_blank', 'noopener,noreferrer')} style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-heading)', fontWeight: 600, marginTop: 14, cursor: 'pointer' }}>
            Read the licence
          </div>
        </div>
      )}
    </div>
  );
}

function TypefacesScreen({ onBack }) {
  const [openFace, setOpenFace] = useState({ pf: true });
  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <BackHeader title="Typefaces" onBack={onBack} />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '6px 20px 30px' }}>
        <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(150deg,#FFF4E2,#FFE7C6 55%,#FFDCA8)', border: '1px solid #F0D9B4', borderRadius: 26, padding: 20, boxShadow: '0 3px 14px rgba(192,118,31,.09)' }}>
          <div style={{ position: 'absolute', right: -30, top: -36, width: 116, height: 116, borderRadius: 99, background: 'rgba(255,255,255,.4)' }} />
          <div style={{ position: 'relative', fontFamily: "'Playfair Display',serif", fontSize: 'calc(56px * var(--ayna-text-scale, 1))', lineHeight: .95, color: '#7A4410' }}>Aa</div>
          <div style={{ position: 'relative', fontSize: 'calc(13px * var(--ayna-text-scale, 1))', lineHeight: 1.6, color: '#6B4413', marginTop: 11, maxWidth: 250 }}>Three faces, all openly licensed under the SIL Open Font Licence.</div>
        </div>

        {TYPEFACES.map((face) => (
          <TypefaceRow
            key={face.key}
            face={face}
            open={!!openFace[face.key]}
            onToggle={() => setOpenFace((s) => ({ ...s, [face.key]: !s[face.key] }))}
          />
        ))}

        <div style={{ marginTop: 16, background: 'var(--ayna-surface)', border: '1px dashed var(--ayna-border)', borderRadius: 24, padding: '16px 18px' }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9.5px * var(--ayna-text-scale, 1))', letterSpacing: '1.3px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)', marginBottom: 7 }}>Loaded via Google Fonts</div>
          <div style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.6 }}>
            Served from Google's font CDN over HTTPS — the standard way Google Fonts are delivered, not bundled with the app itself.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- Research & data sources ---------------------------- */

// Accurate to what ayna actually does today — verified against the real
// codebase rather than copied from the design mockup's placeholder text,
// which claimed things that aren't true yet: fonts "self-hosted" (they load
// from Google's CDN, see index.html), a manufacturer-vs-independently-
// verified marking on product pages (no such UI exists), a human reviewing
// AI output before it reaches a user (no such step exists in the code), and
// a specific review cadence with invented dates (no real cadence exists to
// cite). Each left out rather than asserted.
const RESEARCH_SOURCES = [
  {
    key: 'clin', num: '01', title: 'Clinical guidance', blurb: 'The bodies whose guidance we follow.',
    body: "Menstrual, reproductive and sexual health information is grounded in guidance from ACOG, the CDC, and NIH (including NICHD), plus peer-reviewed literature indexed in PubMed — the same sources cited directly on individual articles and product pages throughout the app.",
    tags: ['ACOG', 'CDC', 'NIH / NICHD', 'PUBMED'],
    note: "ayna's advisory board includes Dr. David Orbach, MD.",
  },
  {
    key: 'safe', num: '02', title: 'Product & ingredient safety', blurb: 'What we check a product against.',
    body: 'Recall checks run live against OpenFDA. Supplement products are checked against the NIH Dietary Supplement Label Database (DSLD). Ingredient and condition-specific concerns are checked against the clinical sources above.',
    tags: ['OPENFDA', 'NIH DSLD', 'PUBMED'],
    note: "We don't yet mark manufacturer-reported claims separately from independently verified ones on the product page — treat an ingredient claim as manufacturer-reported unless a citation says otherwise.",
  },
  {
    key: 'ai', num: '03', title: 'How AI answers are grounded', blurb: 'Models read our sources, not the open web.',
    body: "In-app recommendations and Ask Ayna's answers are generated with Anthropic, OpenAI, or Google models, retrieved against the clinical knowledge base above rather than answering from open-ended AI opinion.",
    tags: ['ANTHROPIC', 'OPENAI', 'GOOGLE'],
    note: 'AI outputs are not currently reviewed by a person before you see them.',
  },
  {
    key: 'you', num: '04', title: 'Your own data', blurb: 'The part of a match that is only yours.',
    body: "Personalised insights also draw on what you've told ayna — your intake answers, the products you've saved, and what you've asked Ask Ayna. That's why two people can see different matches for the same product. It is never used to advertise to you.",
    tags: ['INTAKE ANSWERS', 'ASK AYNA', 'SAVED PRODUCTS'],
    note: 'Read the Privacy Policy for how it is stored and deleted.',
  },
];

function ResearchSourceRow({ source, open, onToggle }) {
  return (
    <div style={{ marginTop: 14, background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 24, overflow: 'hidden', boxShadow: '0 2px 10px rgba(41,37,36,.04)' }}>
      <div onClick={onToggle} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', cursor: 'pointer' }}>
        <div style={{ width: 30, height: 30, borderRadius: 99, flex: 'none', background: open ? '#FDF0DC' : 'var(--ayna-chip-bg)', color: open ? '#9A5B14' : 'var(--ayna-text-faint)', fontFamily: "'DM Mono',monospace", fontSize: 'calc(10px * var(--ayna-text-scale, 1))', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .2s ease' }}>{source.num}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 'calc(14.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)' }}>{source.title}</div>
          <div style={{ fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', marginTop: 2, lineHeight: 1.45 }}>{source.blurb}</div>
        </div>
        <div style={{ flex: 'none', transition: 'transform .2s ease', transform: `rotate(${open ? 180 : 0}deg)` }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
        </div>
      </div>
      {open && (
        <div style={{ padding: '2px 18px 18px' }}>
          <div style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.65 }}>{source.body}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
            {source.tags.map((t) => (
              <div key={t} style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9px * var(--ayna-text-scale, 1))', letterSpacing: '.9px', background: 'var(--ayna-chip-bg)', color: 'var(--ayna-text-muted)', borderRadius: 99, padding: '5px 9px' }}>{t}</div>
            ))}
          </div>
          <div style={{ fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)', lineHeight: 1.55, marginTop: 11, borderTop: '1px solid var(--ayna-border)', paddingTop: 11 }}>{source.note}</div>
        </div>
      )}
    </div>
  );
}

function ResearchSourcesScreen({ onBack }) {
  const [openSrc, setOpenSrc] = useState({ clin: true });
  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <BackHeader title="Research & sources" onBack={onBack} />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '6px 20px 30px' }}>
        <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(150deg,#EFF3EC,#E3EDE2 60%,#D6E7D6)', border: '1px solid #CFE0CE', borderRadius: 26, padding: 20, boxShadow: '0 3px 14px rgba(63,107,74,.08)' }}>
          <div style={{ position: 'absolute', right: -30, top: -34, width: 110, height: 110, borderRadius: 99, background: 'rgba(255,255,255,.4)' }} />
          <div style={{ position: 'relative', width: 38, height: 38, borderRadius: 99, background: '#FFFCF9', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 5px rgba(63,107,74,.14)' }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#3F6B4A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5z" /><path d="M8 8h7" /><path d="M8 12h5" /></svg>
          </div>
          <div style={{ position: 'relative', fontFamily: "'Playfair Display',serif", fontSize: 'calc(23px * var(--ayna-text-scale, 1))', lineHeight: 1.2, marginTop: 13, color: '#25382A' }}>Where our answers come from.</div>
          <div style={{ position: 'relative', fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', lineHeight: 1.6, color: '#42604A', marginTop: 8 }}>Every match, warning and explanation traces back to something on this page.</div>
        </div>

        {RESEARCH_SOURCES.map((source) => (
          <ResearchSourceRow
            key={source.key}
            source={source}
            open={!!openSrc[source.key]}
            onToggle={() => setOpenSrc((s) => ({ ...s, [source.key]: !s[source.key] }))}
          />
        ))}

        <div style={{ marginTop: 14, display: 'flex', alignItems: 'flex-start', gap: 12, background: '#F7EFE7', border: '1px solid #EBD9C6', borderRadius: 24, padding: '16px 18px' }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#9A5B14" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', marginTop: 1 }}><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 7.6v.1" /></svg>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', fontWeight: 600, color: '#6B4413' }}>Not a substitute for medical advice</div>
            <div style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: '#7A5A31', lineHeight: 1.6, marginTop: 4 }}>Ayna is a discovery and education tool. Nothing here diagnoses or treats a condition — talk to your clinician about anything that worries you.</div>
          </div>
        </div>

        <div style={{ fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)', lineHeight: 1.55, marginTop: 14, padding: '0 4px', textAlign: 'center' }}>
          Spotted something out of date? <a href={DELETE_ACCOUNT_MAILTO.replace('subject=Account%20Deletion%20Request', 'subject=Research%20source%20question')}>Tell us</a> and we'll check it.
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
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(10px * var(--ayna-text-scale, 1))', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)', marginBottom: 11 }}>{title}</div>
      <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 22, padding: '0 18px' }}>
        {visibleRows.map(([key, value], i) => (
          <div key={key} style={{ display: 'flex', gap: 14, padding: '13px 0', borderTop: i === 0 ? 'none' : '1px solid var(--ayna-border)' }}>
            <div style={{ flex: 'none', width: 120, fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)' }}>{humanizeKey(key)}</div>
            <div style={{ flex: 1, minWidth: 0, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)', lineHeight: 1.5, wordBreak: 'break-word' }}>{formatValue(value)}</div>
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
        <div style={{ fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.6, marginBottom: 20 }}>
          Every field below is read live from your account — nothing here is cached or approximate.
        </div>

        {loadState === 'loading' && (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--ayna-text-muted)', fontSize: 'calc(13px * var(--ayna-text-scale, 1))' }}>Loading your data…</div>
        )}

        {loadState === 'signed_out' && (
          <div style={{ border: '1px dashed var(--ayna-border)', borderRadius: 20, padding: 18, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.55, textAlign: 'center' }}>
            Sign in to see and download your data.
          </div>
        )}

        {loadState === 'error' && (
          <div style={{ border: '1px dashed var(--ayna-border)', borderRadius: 20, padding: 18, textAlign: 'center' }}>
            <div style={{ fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.55, marginBottom: 12 }}>Couldn't load your data.</div>
            <div onClick={retry} style={{ display: 'inline-block', background: 'var(--ayna-cta-bg)', color: 'var(--ayna-cta-text)', fontWeight: 600, fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', padding: '9px 16px', borderRadius: 99, cursor: 'pointer' }}>Try again</div>
          </div>
        )}

        {loadState === 'ready' && data && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
              <div onClick={handleDownload} style={{ flex: 1, textAlign: 'center', padding: '13px 0', borderRadius: 99, background: 'var(--ayna-cta-bg)', color: 'var(--ayna-cta-text)', fontWeight: 600, fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', cursor: 'pointer' }}>
                Download as JSON
              </div>
              <div onClick={handleCopy} style={{ flex: 1, textAlign: 'center', padding: '13px 0', borderRadius: 99, border: '1px solid var(--ayna-border)', color: 'var(--ayna-heading)', fontWeight: 600, fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', cursor: 'pointer' }}>
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
              <div style={{ fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)', lineHeight: 1.55, padding: '0 4px' }}>
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
        <div style={{ fontWeight: 500, fontSize: 'calc(14.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)' }}>{title}</div>
        {sub && <div style={{ fontSize: 'calc(12px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', marginTop: 2, lineHeight: 1.45 }}>{sub}</div>}
      </div>
      {value && <div style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', flex: 'none' }}>{value}</div>}
      {badge && (
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(8.5px * var(--ayna-text-scale, 1))', letterSpacing: '.9px', color: tone.color, background: tone.background, borderRadius: 99, padding: '4px 8px', flex: 'none' }}>
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
// snapshot. Session list has no backend yet, so it's marked COMING SOON
// (same convention as Subscription/Two-step verification elsewhere in this
// file) instead of showing invented devices. Delete account opens a real
// in-app confirm flow (DeleteAccountScreen) backed by
// account_deletion_requests, not an email link.
function AccountInfoScreen({ onBack, authUser, name, onNameChanged, quizAnswers, onOpenPassword, onEditProfile, onOpenManageData, onOpenDeleteAccount }) {
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
          <div style={{ border: '1px dashed var(--ayna-border)', borderRadius: 20, padding: 18, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.55, textAlign: 'center' }}>
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
          <div style={{ width: 52, height: 52, borderRadius: 99, flex: 'none', background: 'linear-gradient(140deg,#FFDCA8,#FFC774 48%,#E8843C)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Playfair Display',serif", fontSize: 'calc(20px * var(--ayna-text-scale, 1))', color: '#3A2410' }}>{initial}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 'calc(20px * var(--ayna-text-scale, 1))', lineHeight: 1.2, color: 'var(--ayna-heading)' }}>{name || 'You'}</div>
            {authUser.created_at && (
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9.5px * var(--ayna-text-scale, 1))', letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--ayna-text-muted)', marginTop: 4 }}>{formatMemberSince(authUser.created_at)}</div>
            )}
          </div>
        </div>

        <div style={{ margin: '24px 0 11px', fontFamily: "'DM Mono',monospace", fontSize: 'calc(10px * var(--ayna-text-scale, 1))', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)' }}>Login &amp; contact</div>
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
        <div style={{ fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)', lineHeight: 1.5, marginTop: 9, padding: '0 4px' }}>
          Phone verification unlocks text alerts as a delivery channel — your email{googleIdentity ? ' or Google login' : ''} is what signs you in either way.
        </div>

        <div style={{ margin: '24px 0 11px', fontFamily: "'DM Mono',monospace", fontSize: 'calc(10px * var(--ayna-text-scale, 1))', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)' }}>About you</div>
        <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 22, padding: editingName ? '16px 18px' : '0 18px' }}>
          {editingName ? (
            <div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9px * var(--ayna-text-scale, 1))', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--ayna-text-faint)', marginBottom: 7 }}>Name</div>
              <input
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !nameSaving) saveName(); }}
                placeholder="Your first name"
                style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--ayna-border)', fontSize: 'calc(14.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)', background: 'var(--ayna-bg)', outline: 'none' }}
              />
              {nameError && <div style={{ color: '#B4402A', fontSize: 'calc(12px * var(--ayna-text-scale, 1))', marginTop: 8 }}>{nameError}</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <div
                  onClick={nameSaving ? undefined : saveName}
                  style={{ flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: 99, background: nameSaving ? 'var(--ayna-border)' : 'var(--ayna-cta-bg)', color: nameSaving ? 'var(--ayna-text-muted)' : 'var(--ayna-cta-text)', fontWeight: 600, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', cursor: nameSaving ? 'not-allowed' : 'pointer' }}
                >
                  {nameSaving ? 'Saving…' : 'Save'}
                </div>
                <div
                  onClick={() => { setEditingName(false); setNameError(''); }}
                  style={{ flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: 99, border: '1px solid var(--ayna-border)', color: 'var(--ayna-text-muted)', fontWeight: 600, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', cursor: 'pointer' }}
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
        <div style={{ fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)', lineHeight: 1.5, marginTop: 9, padding: '0 4px' }}>
          {authUser?.identities?.some((i) => i.provider === 'google') ? "Google didn't share a name with us, or you'd like to change it — set it here." : "What ayna calls you, everywhere in the app."}
        </div>

        <div style={{ margin: '24px 0 11px', fontFamily: "'DM Mono',monospace", fontSize: 'calc(10px * var(--ayna-text-scale, 1))', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)' }}>From your intake</div>
        <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 22, padding: '0 18px' }}>
          <AccountRow borderTop={false} title="Age" value={intake?.age ? String(intake.age) : 'Not set'} onClick={onEditProfile} />
          <AccountRow title="Zip code" value={intake?.zipcode || 'Not set'} onClick={onEditProfile} />
          <AccountRow title="FSA / HSA account" sub="We'll show the lower price you'd pay." value={fsaHsaLabel || 'Not set'} onClick={onEditProfile} />
        </div>
        <div style={{ fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)', lineHeight: 1.5, marginTop: 9, padding: '0 4px' }}>
          Tap any of these to update your health profile.
        </div>

        <div style={{ margin: '24px 0 11px', fontFamily: "'DM Mono',monospace", fontSize: 'calc(10px * var(--ayna-text-scale, 1))', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)' }}>Security</div>
        <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 22, padding: '0 18px' }}>
          <AccountRow borderTop={false} dimmed title="Where you're signed in" sub="Session history isn't tracked yet." badge="COMING SOON" />
          <AccountRow dimmed title="Two-step verification" sub="Arrives with phone verification." badge="COMING SOON" />
        </div>

        <div style={{ margin: '24px 0 11px', fontFamily: "'DM Mono',monospace", fontSize: 'calc(10px * var(--ayna-text-scale, 1))', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ayna-accent-dark)' }}>Your data</div>
        <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 22, padding: '0 18px' }}>
          <AccountRow borderTop={false} title="Manage & download my data" sub="Account details, intake answers, saved products." onClick={onOpenManageData} />
          <AccountRow title={<span style={{ color: '#B4402A' }}>Delete account</span>} sub="Removes your profile and health answers." onClick={onOpenDeleteAccount} />
        </div>

        <div style={{ fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)', lineHeight: 1.55, marginTop: 14, padding: '0 4px' }}>
          Questions about your account? Email <a href="mailto:puloma@aynahealth.co" style={{ color: 'var(--ayna-brown)' }}>puloma@aynahealth.co</a>.
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- Delete account ---------------------------- */

// Real in-app action — files a row in account_deletion_requests via
// api/export-data.js's POST branch, instead of a mailto: link with no
// record on our side unless the email is actually sent and read. Requires
// typing DELETE (not just a tap) before the button enables, since this is
// irreversible. Signs out and closes the profile overlay after a successful
// request, same as the real "Sign out" action elsewhere in Settings.
function DeleteAccountScreen({ onBack, onSignOut, onClose }) {
  const [confirmText, setConfirmText] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'submitting' | 'error' | 'success'
  const [errorMsg, setErrorMsg] = useState('');
  const canSubmit = confirmText.trim().toUpperCase() === 'DELETE';

  const handleSubmit = async () => {
    if (!canSubmit || status === 'submitting') return;
    setStatus('submitting');
    setErrorMsg('');
    try {
      await requestAccountDeletion();
      setStatus('success');
    } catch (e) {
      setStatus('error');
      setErrorMsg(e instanceof NotSignedInError ? 'Please sign in again, then retry.' : (e.message || "That didn't go through — try again."));
    }
  };

  const handleDone = () => {
    onSignOut && onSignOut();
    onClose && onClose();
  };

  if (status === 'success') {
    return (
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <BackHeader title="Delete account" onBack={onBack} />
        <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '30px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 99, background: 'var(--ayna-chip-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'calc(26px * var(--ayna-text-scale, 1))', marginBottom: 18 }}>✓</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 'calc(22px * var(--ayna-text-scale, 1))', marginBottom: 10, color: 'var(--ayna-heading)' }}>Request received.</div>
          <div style={{ fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.6, maxWidth: 280 }}>
            We'll process it within a week — nothing kept after. You're being signed out now.
          </div>
          <div
            onClick={handleDone}
            style={{ marginTop: 26, width: '100%', maxWidth: 280, textAlign: 'center', padding: '14px 0', borderRadius: 99, background: 'var(--ayna-cta-bg)', color: 'var(--ayna-cta-text)', fontWeight: 600, fontSize: 'calc(14px * var(--ayna-text-scale, 1))', cursor: 'pointer' }}
          >
            Done
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <BackHeader title="Delete account" onBack={onBack} />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '8px 20px 30px' }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 'calc(22px * var(--ayna-text-scale, 1))', lineHeight: 1.3, marginBottom: 12, color: 'var(--ayna-heading)' }}>
          This can't be undone.
        </div>
        <div style={{ fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.6, marginBottom: 20 }}>
          Deleting your account removes your profile, health intake answers, saved products, and ecosystem from our active systems. We may keep limited records where the law requires it — never your health data. We process requests within a week.
        </div>

        <div style={{ fontSize: 'calc(12px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', marginBottom: 8 }}>
          Type <strong style={{ color: 'var(--ayna-text)' }}>DELETE</strong> to confirm.
        </div>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => { setConfirmText(e.target.value); if (status === 'error') setStatus('idle'); }}
          placeholder="DELETE"
          autoCapitalize="characters"
          autoCorrect="off"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            border: '1.5px solid var(--ayna-border)',
            borderRadius: 14,
            padding: '13px 16px',
            fontSize: 'calc(15px * var(--ayna-text-scale, 1))',
            fontFamily: "'DM Sans',sans-serif",
            background: 'var(--ayna-surface)',
            color: 'var(--ayna-text)',
          }}
        />

        {errorMsg && <div style={{ color: '#B4402A', fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', marginTop: 10 }}>{errorMsg}</div>}

        <div
          onClick={handleSubmit}
          style={{
            marginTop: 20,
            textAlign: 'center',
            padding: '14px 0',
            borderRadius: 99,
            fontWeight: 600,
            fontSize: 'calc(14px * var(--ayna-text-scale, 1))',
            cursor: canSubmit && status !== 'submitting' ? 'pointer' : 'default',
            background: canSubmit ? '#B4402A' : 'var(--ayna-chip-bg)',
            color: canSubmit ? '#FFF9F2' : 'var(--ayna-text-faint)',
            transition: 'background .15s, color .15s',
          }}
        >
          {status === 'submitting' ? 'Submitting…' : 'Delete my account'}
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
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 'calc(22px * var(--ayna-text-scale, 1))', marginBottom: 10, color: 'var(--ayna-heading)' }}>Password updated.</div>
          <div style={{ fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', lineHeight: 1.55 }}>You're signed in on this device with the new password.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <BackHeader title="Password" onBack={onBack} />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '0 20px 30px' }}>
        <div style={{ fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', lineHeight: 1.6, color: 'var(--ayna-text-muted)', marginBottom: 20 }}>
          {isRecovery ? "You're resetting your password from the link we emailed you." : 'Enter your current password, then choose a new one.'}
        </div>

        <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 22, padding: 18, display: 'flex', flexDirection: 'column', gap: 15 }}>
          {!isRecovery && (
            <div>
              <div style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', fontWeight: 600, color: 'var(--ayna-text-muted)', marginBottom: 7 }}>Current password</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--ayna-border)', borderRadius: 12, background: 'var(--ayna-bg-alt)', padding: '13px 14px' }}>
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'none', fontSize: 'calc(15px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)' }}
                />
                <div onClick={() => setShowCurrent((v) => !v)} style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', fontWeight: 600, color: 'var(--ayna-brown)', cursor: 'pointer', flex: 'none' }}>{showCurrent ? 'Hide' : 'Show'}</div>
              </div>
            </div>
          )}
          <div>
            <div style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', fontWeight: 600, color: 'var(--ayna-text-muted)', marginBottom: 7 }}>New password</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--ayna-border)', borderRadius: 12, background: 'var(--ayna-bg-alt)', padding: '13px 14px' }}>
              <input
                type={showNext ? 'text' : 'password'}
                value={next}
                onChange={(e) => setNext(e.target.value)}
                placeholder="At least 8 characters"
                style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'none', fontSize: 'calc(15px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)' }}
              />
              <div onClick={() => setShowNext((v) => !v)} style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', fontWeight: 600, color: 'var(--ayna-brown)', cursor: 'pointer', flex: 'none' }}>{showNext ? 'Hide' : 'Show'}</div>
            </div>
            {next.length > 0 && (
              <>
                <div style={{ display: 'flex', gap: 5, marginTop: 9 }}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} style={{ flex: 1, height: 4, borderRadius: 99, background: strength >= i ? '#C0761F' : 'var(--ayna-border)' }} />
                  ))}
                </div>
                <div style={{ fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)', marginTop: 7 }}>
                  {strength < 2 ? 'Add a number or symbol to make it stronger.' : strength < 3 ? 'Longer, with a number and a symbol, is stronger still.' : 'Strong password.'}
                </div>
              </>
            )}
          </div>
          <div>
            <div style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', fontWeight: 600, color: 'var(--ayna-text-muted)', marginBottom: 7 }}>Confirm new password</div>
            <input
              type={showNext ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter it"
              style={{ width: '100%', boxSizing: 'border-box', border: '1px solid var(--ayna-border)', borderRadius: 12, background: 'var(--ayna-bg-alt)', padding: '13px 14px', fontSize: 'calc(15px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)', outline: 'none' }}
            />
          </div>
          {error && <div style={{ color: '#B4402A', fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))' }}>{error}</div>}
          <div
            onClick={handleSubmit}
            style={{ background: canSubmit ? 'var(--ayna-cta-bg)' : 'var(--ayna-border)', color: canSubmit ? 'var(--ayna-cta-text)' : 'var(--ayna-text-muted)', textAlign: 'center', padding: 15, borderRadius: 99, fontWeight: 600, fontSize: 'calc(14.5px * var(--ayna-text-scale, 1))', cursor: canSubmit ? 'pointer' : 'not-allowed' }}
          >
            {saving ? 'Updating…' : 'Update password'}
          </div>
        </div>

        {!isRecovery && (
          resetSent ? (
            <div style={{ textAlign: 'center', marginTop: 18, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)' }}>Check your email for a reset link.</div>
          ) : (
            <div onClick={handleForgot} style={{ textAlign: 'center', marginTop: 18, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-brown)', fontWeight: 600, cursor: 'pointer' }}>Forgot your current password?</div>
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
      style={{ display: 'flex', alignItems: 'center', gap: 7, color, fontSize: 'calc(14px * var(--ayna-text-scale, 1))', fontWeight: 500, cursor: 'pointer', padding: 'max(20px, env(safe-area-inset-top)) 20px 0' }}
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
              <div style={{ width: `${widthPct}%`, height: 44, borderRadius: 11, background: stage.fill, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Mono',monospace", fontSize: 'calc(15px * var(--ayna-text-scale, 1))', color: '#FFFCF9' }}>
                {stage.value.toLocaleString()}
              </div>
              <div style={{ fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', textAlign: 'center', lineHeight: 1.4 }}>{stage.label}</div>
              {i < NARROWING_STAGES.length - 1 && <div style={{ color: 'var(--ayna-text-faint)', fontSize: 'calc(14px * var(--ayna-text-scale, 1))', lineHeight: 1 }}>↓</div>}
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
      content: <div style={{ marginTop: 14, background: 'var(--ayna-chip-bg)', borderRadius: 13, padding: '13px 14px', fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)' }}>Postpartum · 8 weeks · sensitive skin · NYC</div>,
    },
    {
      n: '02', title: 'We scan the market', body: 'Everything pulled in, then cut down.',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', background: 'var(--ayna-chip-bg)', borderRadius: 13, padding: '13px 14px' }}>
            <div style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)' }}>Pulled in</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-navy)' }}>3,140</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', background: 'var(--ayna-chip-bg)', borderRadius: 13, padding: '13px 14px' }}>
            <div style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)' }}>Relevant to you</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', color: '#C0761F' }}>212</div>
          </div>
        </div>
      ),
    },
    {
      n: '03', title: 'Evidence check', body: 'Checked against published guidance.',
      content: (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 14 }}>
          {['NIH research', 'ACOG guidance', 'CDC data'].map((t) => (
            <div key={t} style={{ background: 'var(--ayna-chip-bg)', borderRadius: 99, padding: '9px 14px', fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)' }}>{t}</div>
          ))}
          <div style={{ border: '1px dashed var(--ayna-border)', borderRadius: 99, padding: '8px 14px', fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-faint)' }}>Fails → dropped</div>
        </div>
      ),
    },
    {
      n: '04', title: 'Your ecosystem', body: "What's left is ranked, with the reason attached.",
      content: (
        <div style={{ marginTop: 14, background: 'linear-gradient(120deg,#3B2E55,#7A4A47)', borderRadius: 16, padding: '17px 17px 18px' }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 'calc(31px * var(--ayna-text-scale, 1))', color: '#F0A84B', lineHeight: 1 }}>14</div>
          <div style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', lineHeight: 1.45, color: 'rgba(255,252,249,.9)', marginTop: 5 }}>products, each with its match reason</div>
        </div>
      ),
    },
  ];

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <PlainBackLink onBack={onBack} />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '0 20px 36px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9.5px * var(--ayna-text-scale, 1))', letterSpacing: '1.6px', textTransform: 'uppercase', color: 'var(--ayna-text-muted)', marginTop: 18 }}>How it works</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 'calc(30px * var(--ayna-text-scale, 1))', lineHeight: 1.2, color: 'var(--ayna-heading)', margin: '9px 0 10px' }}>Nothing reaches you unchecked.</div>
        <div style={{ fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', lineHeight: 1.6, color: 'var(--ayna-text-muted)', marginBottom: 24 }}>
          ayna filters the open market against your profile, then against published research. Anything that fails a step never reaches your shop.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {steps.map((step) => (
            <div key={step.n} style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 20, padding: '18px 18px 19px' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9.5px * var(--ayna-text-scale, 1))', letterSpacing: '1.5px', color: '#C0761F' }}>STEP {step.n}</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 'calc(21px * var(--ayna-text-scale, 1))', color: 'var(--ayna-heading)', margin: '7px 0 5px' }}>{step.title}</div>
              <div style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)' }}>{step.body}</div>
              {step.content}
            </div>
          ))}
        </div>

        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 'calc(22px * var(--ayna-text-scale, 1))', color: 'var(--ayna-heading)', margin: '30px 0 14px' }}>The narrowing down, in one picture</div>
        <NarrowingFunnel />

        <div style={{ marginTop: 22, background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 20, padding: 18 }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 'calc(19px * var(--ayna-text-scale, 1))', lineHeight: 1.3, color: 'var(--ayna-heading)' }}>ayna is not a doctor, and never pretends to be.</div>
          <div style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text-muted)', marginTop: 8, lineHeight: 1.5 }}>Summaries are AI-written from cited sources and clinician input.</div>
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
    <div style={{ width: 62, height: 62, borderRadius: '50%', background: 'var(--ayna-chip-bg)', color: 'var(--ayna-accent-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Playfair Display',serif", fontSize: 'calc(20px * var(--ayna-text-scale, 1))', flex: 'none' }}>
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
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9.5px * var(--ayna-text-scale, 1))', letterSpacing: '1.8px', textTransform: 'uppercase', color: 'rgba(255,252,249,.6)' }}>About ayna</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 'calc(34px * var(--ayna-text-scale, 1))', lineHeight: 1.1, color: '#FFF9F2', margin: '10px 0 8px' }}>
            No <span style={{ fontStyle: 'italic', color: '#F0A84B' }}>mystery box</span>.
          </div>
          <div style={{ fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', color: 'rgba(255,249,242,.78)' }}>See what shapes your shop.</div>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '26px 20px 36px' }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 'calc(25px * var(--ayna-text-scale, 1))', lineHeight: 1.2, color: 'var(--ayna-heading)' }}>Women's health isn't one-size-fits-all.</div>
        <div style={{ fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', lineHeight: 1.6, color: 'var(--ayna-text-muted)', marginTop: 11 }}>
          ayna starts with you, scans relevant products, checks available evidence, then makes the reasoning visible.
        </div>

        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9.5px * var(--ayna-text-scale, 1))', letterSpacing: '1.6px', textTransform: 'uppercase', color: '#B4402A', margin: '28px 0 7px' }}>The funnel</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 'calc(22px * var(--ayna-text-scale, 1))', color: 'var(--ayna-heading)', marginBottom: 14 }}>Broad in. Focused out.</div>
        <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 20, padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {CONCEPT_FUNNEL.map((row) => (
            <div key={row.label}>
              <div style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)', marginBottom: 6 }}>{row.label}</div>
              <div style={{ height: 9, borderRadius: 99, background: 'var(--ayna-track)', overflow: 'hidden' }}>
                <div style={{ width: row.width, height: '100%', borderRadius: 99, background: row.fill }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 22 }}>
          <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 20, padding: 18 }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9px * var(--ayna-text-scale, 1))', letterSpacing: '1.4px', textTransform: 'uppercase', color: 'var(--ayna-text-faint)' }}>What we look at</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 'calc(19px * var(--ayna-text-scale, 1))', color: 'var(--ayna-heading)', margin: '7px 0 13px' }}>Multiple signals, one view</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
              {['Published research', 'Clinical guidance', 'Clinician input', 'Community experience'].map((t) => (
                <div key={t} style={{ background: 'var(--ayna-chip-bg)', borderRadius: 11, padding: '11px 12px', fontSize: 'calc(12px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)' }}>{t}</div>
              ))}
            </div>
          </div>
          <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 20, padding: 18 }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9px * var(--ayna-text-scale, 1))', letterSpacing: '1.4px', textTransform: 'uppercase', color: 'var(--ayna-text-faint)' }}>What shapes a match</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 'calc(19px * var(--ayna-text-scale, 1))', color: 'var(--ayna-heading)', margin: '7px 0 13px' }}>Relevant, not paid-first</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {['Your profile', 'Evidence', 'Clinician context', 'Community context'].map((t) => (
                <div key={t} style={{ background: 'var(--ayna-chip-bg)', borderRadius: 11, padding: 12, fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)' }}>{t}</div>
              ))}
            </div>
            <div style={{ fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', color: '#B4402A', marginTop: 11 }}>Sponsorship is never a match input.</div>
          </div>
        </div>

        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9.5px * var(--ayna-text-scale, 1))', letterSpacing: '1.6px', textTransform: 'uppercase', color: '#B4402A', margin: '32px 0 7px' }}>The process</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 'calc(22px * var(--ayna-text-scale, 1))', color: 'var(--ayna-heading)', marginBottom: 14 }}>Four gates, in order.</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {TRUST_GATES.map((gate) => {
            const dark = gate.n === '04';
            return (
              <div key={gate.n} style={{ background: dark ? 'linear-gradient(150deg,#3B2E55,#5B3B57)' : 'var(--ayna-surface)', border: dark ? 'none' : '1px solid var(--ayna-border)', borderRadius: 18, padding: '15px 14px 17px' }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 'calc(22px * var(--ayna-text-scale, 1))', color: dark ? '#F0A84B' : '#C0761F' }}>{gate.n}</div>
                <div style={{ fontWeight: 600, fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', color: dark ? '#FFF9F2' : 'var(--ayna-text)', margin: '5px 0' }}>{gate.title}</div>
                <div style={{ fontSize: 'calc(11.5px * var(--ayna-text-scale, 1))', lineHeight: 1.45, color: dark ? 'rgba(255,252,249,.82)' : 'var(--ayna-text-muted)' }}>{gate.body}</div>
              </div>
            );
          })}
        </div>

        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9.5px * var(--ayna-text-scale, 1))', letterSpacing: '1.6px', textTransform: 'uppercase', color: '#B4402A', margin: '32px 0 7px' }}>Why ayna</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 'calc(22px * var(--ayna-text-scale, 1))', color: 'var(--ayna-heading)', marginBottom: 14 }}>Discovery with context.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {WHY_AYNA_DIFFERENCES.map((t) => (
            <div key={t} style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 13, padding: 14, fontSize: 'calc(13px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)' }}>{t}</div>
          ))}
        </div>

        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9.5px * var(--ayna-text-scale, 1))', letterSpacing: '1.6px', textTransform: 'uppercase', color: '#B4402A', margin: '32px 0 7px' }}>Our advisors</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 'calc(22px * var(--ayna-text-scale, 1))', color: 'var(--ayna-heading)', marginBottom: 16 }}>Guided by real expertise.</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 12px' }}>
          {ADVISORS.map((advisor) => (
            <div key={advisor.name} style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center' }}><AdvisorAvatar advisor={advisor} /></div>
              <div style={{ fontWeight: 600, fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)', marginTop: 8 }}>{advisor.name}</div>
              <div style={{ fontSize: 'calc(11px * var(--ayna-text-scale, 1))', lineHeight: 1.4, color: 'var(--ayna-text-muted)', marginTop: 3 }}>{advisor.title}</div>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--ayna-surface)', border: '1px solid var(--ayna-border)', borderRadius: 20, padding: '19px 18px', marginTop: 26 }}>
          <div style={{ fontWeight: 600, fontSize: 'calc(15px * var(--ayna-text-scale, 1))', color: 'var(--ayna-text)' }}>ayna is not a doctor.</div>
          <div style={{ fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', lineHeight: 1.55, color: 'var(--ayna-text-muted)', marginTop: 6 }}>Medical decisions stay with you and your clinician.</div>
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

  const fieldStyle = { border: '1px solid #ded9e4', borderRadius: 10, background: '#fff', padding: 14, fontSize: 'calc(15px * var(--ayna-text-scale, 1))', color: '#1A1714', width: '100%', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' };
  const labelStyle = { fontSize: 'calc(13px * var(--ayna-text-scale, 1))', fontWeight: 600, color: '#4a4356', marginBottom: 7 };

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: '#FAF6F2' }}>
      <PlainBackLink onBack={onBack} color="#6f6880" />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '18px 20px 40px' }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 'calc(9.5px * var(--ayna-text-scale, 1))', letterSpacing: '1.7px', textTransform: 'uppercase', color: '#766d83' }}>Contact</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 'calc(34px * var(--ayna-text-scale, 1))', lineHeight: 1.1, color: '#1A1714', margin: '11px 0 0' }}>How can we help?</div>
        <div style={{ fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))', lineHeight: 1.6, color: '#6f6880', marginTop: 13 }}>
          Send us a note and we'll make sure it reaches the right person on the ayna team.
        </div>
        <div style={{ marginTop: 18, paddingTop: 15, borderTop: '1px solid #e5e0e9', fontSize: 'calc(12.5px * var(--ayna-text-scale, 1))', lineHeight: 1.65, color: '#6f6880' }}>
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
                    <div key={r} onClick={() => { setForm((f) => ({ ...f, reason: r })); setReasonOpen(false); }} style={{ padding: '12px 14px', fontSize: 'calc(14px * var(--ayna-text-scale, 1))', color: '#1A1714', cursor: 'pointer', borderTop: i === 0 ? 'none' : '1px solid #f0ecf3' }}>{r}</div>
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
            <div style={{ marginTop: 16, padding: '11px 13px', borderRadius: 9, background: '#f3f6f1', color: '#435143', fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))' }}>
              Thanks. Your message has been sent to the ayna team.
            </div>
          )}
          {status === 'error' && (
            <div style={{ marginTop: 16, padding: '11px 13px', borderRadius: 9, background: '#fff2f0', color: '#8b342d', fontSize: 'calc(13.5px * var(--ayna-text-scale, 1))' }}>
              {error}
            </div>
          )}

          <div
            onClick={() => sendReady && submit()}
            role="button"
            aria-label="Send message"
            style={{
              marginTop: 20, textAlign: 'center', borderRadius: 99, padding: 16, fontWeight: 600, fontSize: 'calc(15px * var(--ayna-text-scale, 1))',
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
  personalizeWithData = true,
  onPersonalizeWithDataChange,
  askAynaHistoryCount = 0,
  onClearAskAynaHistory,
  textSizeIndex = 1,
  onTextSizeChange,
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
    body = (
      <PreferencesScreen
        onBack={goBack}
        theme={theme}
        onToggleTheme={onToggleTheme}
        onOpenChannels={() => pushScreen('channels')}
        personalizeWithData={personalizeWithData}
        onPersonalizeWithDataChange={onPersonalizeWithDataChange}
        askAynaHistoryCount={askAynaHistoryCount}
        onClearAskAynaHistory={onClearAskAynaHistory}
        textSizeIndex={textSizeIndex}
        onTextSizeChange={onTextSizeChange}
      />
    );
  } else if (screen === 'channels') {
    body = <ChannelsScreen onBack={goBack} />;
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
        onOpenDeleteAccount={() => pushScreen('deleteAccount')}
      />
    );
  } else if (screen === 'password') {
    body = <PasswordScreen onBack={goBack} authUser={authUser} />;
  } else if (screen === 'privacyData') {
    body = (
      <PrivacyDataScreen
        onBack={goBack}
        onOpenManageData={() => pushScreen('manageData')}
        onOpenDeleteAccount={() => pushScreen('deleteAccount')}
      />
    );
  } else if (screen === 'deleteAccount') {
    body = <DeleteAccountScreen onBack={goBack} onSignOut={onSignOut} onClose={onClose} />;
  } else if (screen === 'legal') {
    body = (
      <LegalScreen
        onBack={goBack}
        onOpenConsumerHealthData={() => pushScreen('consumerHealthData')}
        onOpenOpenSourceLicenses={() => pushScreen('openSourceLicenses')}
        onOpenTypefaces={() => pushScreen('typefaces')}
        onOpenResearchSources={() => pushScreen('researchSources')}
      />
    );
  } else if (screen === 'consumerHealthData') {
    body = <ConsumerHealthDataPolicyScreen onBack={goBack} />;
  } else if (screen === 'openSourceLicenses') {
    body = <OpenSourceLicensesScreen onBack={goBack} />;
  } else if (screen === 'typefaces') {
    body = <TypefacesScreen onBack={goBack} />;
  } else if (screen === 'researchSources') {
    body = <ResearchSourcesScreen onBack={goBack} />;
  } else if (screen === 'manageData') {
    body = <ManageDataScreen onBack={goBack} />;
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 55, background: 'var(--ayna-bg)', display: 'flex', animation: 'ay-page .25s ease-out' }}>
      {body}
    </div>
  );
}
