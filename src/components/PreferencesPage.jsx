import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import AccountDataControls from './AccountDataControls';
import { getSupabaseClient } from '../utils/supabaseClient';
import { loadPhoneNumberForUser } from '../utils/phoneNumberStore';
import {
  NotSignedInError,
  fetchNotificationPreferences,
  patchNotificationPreferences,
  friendlyPreferencesError,
} from '../utils/notificationPreferencesApi';
import {
  TEXT_SIZE_STEPS,
  normalizeTextSizeIndex,
  readStoredTextSizeIndex,
  setTextSizeIndex as applyAndStoreTextSize,
} from '../utils/textSize';
import {
  formatQuietHoursSummary,
  normalizeTimeInput,
  validateQuietHours,
} from '../utils/quietHours';
import './PreferencesPage.css';

/**
 * Settings / Preferences — ported from the mobile app's PreferencesScreen +
 * ChannelsScreen (src/mobile/screens/profile/ProfileFlow.jsx on the
 * mobile-app branch) as one page.
 *
 * Account-scoped settings read/write /api/notification-preferences (see
 * src/utils/notificationPreferencesApi.js). Each toggle updates
 * optimistically and rolls back with a status message if the PATCH fails.
 * Text size and clearing Ask Ayna history are local and work signed out.
 */

const CHANNELS = [
  { key: 'push', label: 'Push', sub: 'Notifications in your browser or the app.' },
  { key: 'sms', label: 'Text message', sub: 'Needs a verified phone number.' },
  { key: 'email', label: 'Email', sub: 'Sent to the address you log in with.' },
];

function Switch({ id, checked, onChange, labelledBy, describedBy, busy }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-busy={busy || undefined}
      className={`ayna-prefs__switch${checked ? ' is-on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="ayna-prefs__switch-thumb" aria-hidden="true" />
    </button>
  );
}

function ToggleRow({ title, sub, checked, onChange }) {
  const id = useId();
  return (
    <div className="ayna-prefs__row">
      <div className="ayna-prefs__row-text">
        <span id={`${id}-t`} className="ayna-prefs__row-title">{title}</span>
        {sub && <span id={`${id}-s`} className="ayna-prefs__row-sub">{sub}</span>}
      </div>
      <Switch checked={checked} onChange={onChange} labelledBy={`${id}-t`} describedBy={sub ? `${id}-s` : undefined} />
    </div>
  );
}

function LinkRow({ title, sub, onClick, tone }) {
  return (
    <button type="button" className={`ayna-prefs__row ayna-prefs__row--link${tone === 'danger' ? ' is-danger' : ''}`} onClick={onClick}>
      <span className="ayna-prefs__row-text">
        <span className="ayna-prefs__row-title">{title}</span>
        {sub && <span className="ayna-prefs__row-sub">{sub}</span>}
      </span>
      <svg className="ayna-prefs__chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
    </button>
  );
}

function Section({ title, children, note }) {
  const id = useId();
  return (
    <section className="ayna-prefs__section" aria-labelledby={id}>
      <h2 id={id} className="ayna-prefs__label">{title}</h2>
      <div className="ayna-prefs__group">{children}</div>
      {note && <p className="ayna-prefs__note">{note}</p>}
    </section>
  );
}

export default function PreferencesPage({
  user = null,
  onBack,
  onRequestLogin,
  onOpenPhoneVerify,
  onOpenDeleteAccount,
  onOpenPrivacyPolicy,
  onPersonalizeChange,
  askAynaMessageCount = 0,
  onClearAskAynaHistory,
}) {
  const [loadState, setLoadState] = useState('loading'); // loading | signed_out | error | ready
  const [prefs, setPrefs] = useState(null);
  const [phoneLast4, setPhoneLast4] = useState('');
  const [status, setStatus] = useState({ text: '', tone: 'info' });
  const [textSizeIndex, setTextSizeIndexState] = useState(readStoredTextSizeIndex);
  const [quietDraft, setQuietDraft] = useState({ start: '22:00', end: '07:00' });
  const [quietError, setQuietError] = useState('');
  const [clearConfirm, setClearConfirm] = useState(false);
  const statusTimer = useRef(null);
  const onPersonalizeRef = useRef(onPersonalizeChange);
  const textGroupName = useId();
  const channelGroupName = useId();

  useEffect(() => { onPersonalizeRef.current = onPersonalizeChange; }, [onPersonalizeChange]);
  useEffect(() => () => clearTimeout(statusTimer.current), []);

  const say = useCallback((text, tone = 'info') => {
    clearTimeout(statusTimer.current);
    setStatus({ text, tone });
    statusTimer.current = setTimeout(() => setStatus({ text: '', tone: 'info' }), 4000);
  }, []);

  const load = useCallback(() => {
    fetchNotificationPreferences()
      .then((data) => {
        setPrefs(data);
        setQuietDraft({ start: data.quietHoursStart || '22:00', end: data.quietHoursEnd || '07:00' });
        setLoadState('ready');
        // The account's saved size wins over this browser's, same as mobile.
        if (Number.isInteger(data.textSizeIndex)) {
          setTextSizeIndexState(applyAndStoreTextSize(data.textSizeIndex));
        }
        if (typeof data.personalizeWithDataEnabled === 'boolean') {
          onPersonalizeRef.current?.(data.personalizeWithDataEnabled);
        }
      })
      .catch((e) => setLoadState(e instanceof NotSignedInError ? 'signed_out' : 'error'));
  }, []);

  useEffect(() => { load(); }, [load, user?.id]);

  // Masked number next to "Text message" when verified (best-effort; RLS-scoped).
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !user?.id || !prefs?.phoneVerified) return undefined;
    let cancelled = false;
    loadPhoneNumberForUser(supabase, user.id)
      .then((row) => {
        const digits = String(row?.phone_number || '').replace(/\D/g, '');
        if (!cancelled && row?.is_verified && digits.length >= 4) setPhoneLast4(digits.slice(-4));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user?.id, prefs?.phoneVerified]);

  const retry = () => {
    setLoadState('loading');
    load();
  };

  const patchField = (apiField, clientField, value) => {
    const previous = prefs;
    setPrefs((p) => ({ ...p, [clientField]: value }));
    return patchNotificationPreferences({ [apiField]: value })
      .then((data) => {
        if (data && typeof data === 'object') setPrefs((p) => ({ ...p, ...data }));
        return true;
      })
      .catch((e) => {
        setPrefs(previous);
        say(friendlyPreferencesError(e.code || e.message), 'error');
        return false;
      });
  };

  const handlePersonalize = (next) => {
    onPersonalizeChange?.(next);
    patchField('personalize_with_data_enabled', 'personalizeWithDataEnabled', next).then((ok) => {
      if (!ok) onPersonalizeChange?.(!next);
    });
  };

  const selectChannel = (key) => {
    if (!prefs || key === prefs.deliveryChannel) return;
    if (key === 'sms' && !prefs.phoneVerified) {
      say('Verify your phone number first, then come back to switch to texts.');
      return;
    }
    patchField('delivery_channel', 'deliveryChannel', key);
  };

  const commitQuietTime = (which, raw) => {
    const value = normalizeTimeInput(raw);
    const nextDraft = { ...quietDraft, [which]: raw };
    setQuietDraft(nextDraft);
    if (!value) {
      setQuietError(raw ? 'Pick a valid time.' : '');
      return;
    }
    const start = which === 'start' ? value : normalizeTimeInput(nextDraft.start);
    const end = which === 'end' ? value : normalizeTimeInput(nextDraft.end);
    const err = validateQuietHours(start, end);
    if (err === 'same_time') {
      setQuietError('Start and end can’t be the same time.');
      return;
    }
    setQuietError('');
    const apiField = which === 'start' ? 'quiet_hours_start' : 'quiet_hours_end';
    const clientField = which === 'start' ? 'quietHoursStart' : 'quietHoursEnd';
    const previous = prefs?.[clientField];
    if (previous === value) return;
    patchField(apiField, clientField, value).then((ok) => {
      if (!ok && previous) setQuietDraft((d) => ({ ...d, [which]: previous }));
    });
  };

  const handleTextSize = (index) => {
    const i = applyAndStoreTextSize(normalizeTextSizeIndex(index));
    setTextSizeIndexState(i);
    // Best-effort account sync; the local change already applied.
    if (loadState === 'ready') {
      patchNotificationPreferences({ text_size_index: i })
        .then((data) => setPrefs((p) => (p ? { ...p, ...data } : p)))
        .catch(() => {});
    }
  };

  const handleClearHistory = () => {
    onClearAskAynaHistory?.();
    setClearConfirm(false);
    say('Ask Ayna history cleared.');
  };

  const signedIn = loadState === 'ready' && prefs;
  const smsBadge = prefs?.phoneVerified ? (phoneLast4 ? `Verified ···${phoneLast4}` : 'Verified') : 'Verify to use';

  return (
    <main className="ayna-prefs" aria-labelledby="ayna-prefs-title">
      <div className="ayna-prefs__inner">
        {onBack && (
          <button type="button" className="ayna-prefs__back" onClick={onBack}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
            Back
          </button>
        )}
        <header className="ayna-prefs__head">
          <p className="ayna-prefs__eyebrow">Settings</p>
          <h1 id="ayna-prefs-title" className="ayna-prefs__title">How ayna works for you.</h1>
          <p className="ayna-prefs__lede">Every setting here is reversible.</p>
        </header>

        {loadState === 'loading' && (
          <p className="ayna-prefs__state" role="status">Loading your settings…</p>
        )}

        {loadState === 'signed_out' && (
          <div className="ayna-prefs__login">
            <p className="ayna-prefs__login-title">Log in for the rest of your settings</p>
            <p className="ayna-prefs__login-sub">
              Notifications, delivery channel, quiet hours, personalization and your data controls save to your account. Text size works on this device without one.
            </p>
            {onRequestLogin && (
              <button type="button" className="ayna-prefs__pill" onClick={onRequestLogin}>Log in</button>
            )}
          </div>
        )}

        {loadState === 'error' && (
          <div className="ayna-prefs__login" role="alert">
            <p className="ayna-prefs__login-title">Couldn’t load your settings.</p>
            <button type="button" className="ayna-prefs__pill" onClick={retry}>Try again</button>
          </div>
        )}

        {signedIn && (
          <>
            <Section title="Notifications">
              <ToggleRow
                title="Notifications"
                sub="Recalls and safety flags on products you own."
                checked={!!prefs.notificationsEnabled}
                onChange={(v) => patchField('notifications_enabled', 'notificationsEnabled', v)}
              />
              <ToggleRow
                title="Product updates"
                sub="New matches and restocks, in a weekly digest."
                checked={!!prefs.updatesEnabled}
                onChange={(v) => patchField('updates_enabled', 'updatesEnabled', v)}
              />
            </Section>

            <Section title="Delivery channel">
              <fieldset className="ayna-prefs__fieldset">
                <legend className="ayna-prefs__sr">How ayna reaches you</legend>
                {CHANNELS.map((c) => {
                  const locked = c.key === 'sms' && !prefs.phoneVerified;
                  const checked = prefs.deliveryChannel === c.key;
                  return (
                    <div key={c.key} className="ayna-prefs__row ayna-prefs__row--radio">
                      <label className={`ayna-prefs__radio${locked ? ' is-locked' : ''}`}>
                        <input
                          type="radio"
                          name={channelGroupName}
                          value={c.key}
                          checked={checked}
                          aria-disabled={locked || undefined}
                          onChange={() => selectChannel(c.key)}
                        />
                        <span className="ayna-prefs__radio-dot" aria-hidden="true" />
                        <span className="ayna-prefs__row-text">
                          <span className="ayna-prefs__row-title">{c.label}</span>
                          <span className="ayna-prefs__row-sub">{c.sub}</span>
                        </span>
                      </label>
                      {c.key === 'sms' && (
                        prefs.phoneVerified ? (
                          <span className="ayna-prefs__badge">{smsBadge}</span>
                        ) : (
                          onOpenPhoneVerify && (
                            <button type="button" className="ayna-prefs__badge ayna-prefs__badge--action" onClick={onOpenPhoneVerify}>
                              Verify phone
                            </button>
                          )
                        )
                      )}
                    </div>
                  );
                })}
              </fieldset>
            </Section>

            <Section title="Quiet hours" note={prefs.quietHoursEnabled ? formatQuietHoursSummary(true, prefs.quietHoursStart, prefs.quietHoursEnd) : null}>
              <ToggleRow
                title="Quiet hours"
                sub="Hold notifications overnight. They’ll be waiting when you’re back."
                checked={!!prefs.quietHoursEnabled}
                onChange={(v) => patchField('quiet_hours_enabled', 'quietHoursEnabled', v)}
              />
              {prefs.quietHoursEnabled && (
                <div className="ayna-prefs__times">
                  <label className="ayna-prefs__time">
                    <span>From</span>
                    <input
                      type="time"
                      value={quietDraft.start}
                      onChange={(e) => commitQuietTime('start', e.target.value)}
                      aria-invalid={!!quietError || undefined}
                    />
                  </label>
                  <label className="ayna-prefs__time">
                    <span>To</span>
                    <input
                      type="time"
                      value={quietDraft.end}
                      onChange={(e) => commitQuietTime('end', e.target.value)}
                      aria-invalid={!!quietError || undefined}
                    />
                  </label>
                  {quietError && <p className="ayna-prefs__field-error" role="alert">{quietError}</p>}
                </div>
              )}
            </Section>

            <Section
              title="Personalization"
              note="When this is off, ayna stops using your intake answers and check-ins for match scores and Ask Ayna replies."
            >
              <ToggleRow
                title="Personalize with my data"
                sub="Your intake answers shape your matches and Ask Ayna."
                checked={!!prefs.personalizeWithDataEnabled}
                onChange={handlePersonalize}
              />
            </Section>
          </>
        )}

        <section className="ayna-prefs__section" aria-labelledby={`${textGroupName}-h`}>
          <h2 id={`${textGroupName}-h`} className="ayna-prefs__label">Text size</h2>
          <div className="ayna-prefs__group ayna-prefs__group--pad">
            <fieldset className="ayna-prefs__fieldset">
              <legend className="ayna-prefs__sr">Text size</legend>
              <div className="ayna-prefs__sizes">
                {TEXT_SIZE_STEPS.map((step, i) => (
                  <label key={step.key} className={`ayna-prefs__size${i === textSizeIndex ? ' is-active' : ''}`}>
                    <input
                      type="radio"
                      name={textGroupName}
                      value={i}
                      checked={i === textSizeIndex}
                      onChange={() => handleTextSize(i)}
                    />
                    <span className="ayna-prefs__size-glyph" aria-hidden="true" style={{ fontSize: `${14 * step.scale}px` }}>Aa</span>
                    <span className="ayna-prefs__size-label">{step.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <p className="ayna-prefs__preview">This is how body text reads across ayna.</p>
          </div>
          <p className="ayna-prefs__note">{signedIn ? 'Saved to your account.' : 'Saved on this device.'}</p>
        </section>

        <Section title="Ask Ayna">
          <div className="ayna-prefs__row ayna-prefs__row--stack">
            <div className="ayna-prefs__row-line">
              <span className="ayna-prefs__row-text">
                <span className="ayna-prefs__row-title">Clear Ask Ayna history</span>
                <span className="ayna-prefs__row-sub">
                  {askAynaMessageCount > 0
                    ? `${askAynaMessageCount} message${askAynaMessageCount === 1 ? '' : 's'} in this visit. Deleted for good, not archived.`
                    : 'Nothing to clear right now.'}
                </span>
              </span>
              {!clearConfirm && (
                <button
                  type="button"
                  className="ayna-prefs__pill ayna-prefs__pill--ghost is-danger"
                  aria-disabled={askAynaMessageCount === 0 || undefined}
                  onClick={() => { if (askAynaMessageCount > 0) setClearConfirm(true); }}
                >
                  Clear
                </button>
              )}
            </div>
            {clearConfirm && (
              <div className="ayna-prefs__confirm" role="group" aria-label="Confirm clearing Ask Ayna history">
                <span>Clear this chat?</span>
                <button type="button" className="ayna-prefs__pill ayna-prefs__pill--ghost" onClick={() => setClearConfirm(false)}>Cancel</button>
                <button type="button" className="ayna-prefs__pill is-danger-solid" onClick={handleClearHistory}>Yes, clear it</button>
              </div>
            )}
          </div>
        </Section>

        <Section title="Privacy & account">
          {onOpenPrivacyPolicy && (
            <LinkRow title="Privacy policy" sub="What we collect and why. ayna never sells your health data." onClick={onOpenPrivacyPolicy} />
          )}
          {signedIn ? (
            <div className="ayna-prefs__data">
              <AccountDataControls onOpenDeleteAccount={onOpenDeleteAccount} />
            </div>
          ) : (
            onRequestLogin && (
              <LinkRow title="Download my data or delete my account" sub="Log in to manage your account data." onClick={onRequestLogin} />
            )
          )}
        </Section>

        <div className={`ayna-prefs__status${status.tone === 'error' ? ' is-error' : ''}${status.text ? ' is-visible' : ''}`} role="status" aria-live="polite">
          {status.text}
        </div>
      </div>
    </main>
  );
}
