import React, { useEffect, useRef, useState } from 'react';
import { useCommunity } from './CommunityContext';
import { Sheet, UserAvatar } from './CommunityUI';
import * as store from '../../utils/community/communityStore';
import { uploadCommunityImage, deleteCommunityImage, checkImageFile } from '../../utils/community/imageUpload';
import { usernameProblem, USERNAME_MESSAGES, normalizeUsernameInput, suggestUsername } from '../../utils/community/username';
import { COMMUNITY_TOPICS } from '../../utils/community/topics';
import { trackCommunity } from '../../utils/community/analytics';

const VIEW = 240; // crop viewport, CSS px

/** Square avatar crop: drag to reposition, slider to zoom. Returns a source-pixel crop. */
function AvatarCropper({ file, onCancel, onDone }) {
  // Created once per cropper; revoked when the cropper finishes (an effect
  // cleanup would revoke it during StrictMode's double mount).
  const [src] = useState(() => URL.createObjectURL(file));
  const [natural, setNatural] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef(null);


  const base = natural ? VIEW / Math.min(natural.w, natural.h) : 1;
  const scale = base * zoom;
  const dispW = natural ? natural.w * scale : VIEW;
  const dispH = natural ? natural.h * scale : VIEW;
  const clamp = (o, w = dispW, h = dispH) => ({
    x: Math.min(0, Math.max(VIEW - w, o.x)),
    y: Math.min(0, Math.max(VIEW - h, o.y)),
  });

  const onLoad = (e) => {
    const w = e.currentTarget.naturalWidth;
    const h = e.currentTarget.naturalHeight;
    const b = VIEW / Math.min(w, h);
    setNatural({ w, h });
    setOffset({ x: (VIEW - w * b) / 2, y: (VIEW - h * b) / 2 });
  };

  const setZoomCentered = (z) => {
    const nextScale = base * z;
    const cx = (VIEW / 2 - offset.x) / scale;
    const cy = (VIEW / 2 - offset.y) / scale;
    setZoom(z);
    setOffset(clamp({ x: VIEW / 2 - cx * nextScale, y: VIEW / 2 - cy * nextScale }, natural.w * nextScale, natural.h * nextScale));
  };

  const cancel = () => { URL.revokeObjectURL(src); onCancel(); };
  const done = () => {
    URL.revokeObjectURL(src);
    const size = Math.round(VIEW / scale);
    onDone({
      x: Math.max(0, Math.round(-offset.x / scale)),
      y: Math.max(0, Math.round(-offset.y / scale)),
      size: Math.min(size, natural.w, natural.h),
    });
  };

  return (
    <div className="cm-cropper">
      <div
        className="cm-cropper__view"
        style={{ width: VIEW, height: VIEW }}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, o: offset }; }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          setOffset(clamp({ x: drag.current.o.x + e.clientX - drag.current.x, y: drag.current.o.y + e.clientY - drag.current.y }));
        }}
        onPointerUp={() => { drag.current = null; }}
        onPointerCancel={() => { drag.current = null; }}
      >
        {src && (
          <img
            src={src}
            alt=""
            draggable={false}
            onLoad={onLoad}
            style={{ width: dispW, height: dispH, transform: `translate(${offset.x}px, ${offset.y}px)` }}
          />
        )}
        <span className="cm-cropper__ring" aria-hidden="true" />
      </div>
      <label className="cm-cropper__zoom">
        <span className="sr-only">Zoom</span>
        <input type="range" min="1" max="3" step="0.01" value={zoom} disabled={!natural} onChange={(e) => setZoomCentered(Number(e.target.value))} />
      </label>
      <div className="cm-cropper__actions">
        <button type="button" className="btn btn-ghost" onClick={cancel}>Cancel</button>
        <button type="button" className="btn btn-navy" disabled={!natural} onClick={done}>Use photo</button>
      </div>
    </div>
  );
}

/**
 * Create (first time) or edit the public community profile. Only what's here
 * is ever public — never anything from the private health intake. Public
 * interests are chosen by hand and start empty.
 */
export function ProfileSetupSheet({ existing, defaultName, onClose, onSaved }) {
  const { supabase, user } = useCommunity();
  const [displayName, setDisplayName] = useState(existing?.display_name || defaultName || '');
  const [username, setUsername] = useState(existing?.username || suggestUsername(defaultName));
  const [bio, setBio] = useState(existing?.bio || '');
  const [interests, setInterests] = useState(existing?.public_interests || []);
  const [avatarPath, setAvatarPath] = useState(existing?.avatar_url || null);
  const [cropFile, setCropFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [taken, setTaken] = useState({ name: '', taken: false });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);
  const uploadedThisSession = useRef([]);

  const problem = usernameProblem(username);
  const usernameChanged = username !== existing?.username;
  const isTaken = taken.name === username && taken.taken;
  const canSave = displayName.trim() && !problem && !isTaken && !uploading && !saving;

  // Live availability (debounced).
  useEffect(() => {
    if (problem || !usernameChanged) return undefined;
    let alive = true;
    const t = setTimeout(() => {
      store.isUsernameTaken(supabase, username, user.id)
        .then((v) => { if (alive) setTaken({ name: username, taken: v }); })
        .catch(() => {});
    }, 350);
    return () => { alive = false; clearTimeout(t); };
  }, [username, problem, usernameChanged, supabase, user.id]);

  const pickPhoto = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try { checkImageFile(file); setCropFile(file); setError(''); } catch (err) { setError(err.message); }
  };

  const applyCrop = async (crop) => {
    const file = cropFile;
    setCropFile(null);
    setUploading(true);
    setError('');
    try {
      const { path } = await uploadCommunityImage(supabase, file, { folder: 'avatars', userId: user.id, crop });
      uploadedThisSession.current.push(path);
      setAvatarPath(path);
    } catch (err) {
      setError(err.message || "Photo upload isn't available right now.");
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = () => setAvatarPath(null);

  const toggleInterest = (key) => {
    setInterests((list) => (list.includes(key) ? list.filter((k) => k !== key) : list.length >= 8 ? list : [...list, key]));
  };

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    setError('');
    try {
      if (usernameChanged && await store.isUsernameTaken(supabase, username, user.id)) {
        setTaken({ name: username, taken: true });
        return;
      }
      const profile = await store.upsertCommunityProfile(supabase, user.id, {
        username, displayName, bio, avatarUrl: avatarPath, publicInterests: interests,
      });
      // Clean up photos replaced or removed in this edit.
      const keep = profile.avatar_url;
      const stale = [...uploadedThisSession.current, existing?.avatar_url].filter((p) => p && p !== keep);
      stale.forEach((p) => deleteCommunityImage(supabase, p));
      trackCommunity(existing ? 'community_profile_edited' : 'community_profile_created', { has_photo: Boolean(keep) });
      onSaved(profile);
    } catch (e) {
      setError(store.friendlyError(e));
    } finally {
      setSaving(false);
    }
  };

  if (cropFile) {
    return (
      <Sheet title="Crop photo" onClose={() => setCropFile(null)}>
        <AvatarCropper file={cropFile} onCancel={() => setCropFile(null)} onDone={applyCrop} />
      </Sheet>
    );
  }

  return (
    <Sheet
      title={existing ? 'Edit profile' : 'Set up your profile'}
      onClose={onClose}
      footer={<button type="button" className="btn btn-navy cm-btn-block" disabled={!canSave} onClick={save}>{saving ? 'Saving…' : existing ? 'Save' : 'Continue'}</button>}
    >
      <div className="cm-form">
        <div className="cm-avatar-edit">
          <UserAvatar name={displayName} url={avatarPath} size={72} />
          <div className="cm-avatar-edit__actions">
            <button type="button" className="cm-chip" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? 'Uploading…' : avatarPath ? 'Change photo' : 'Add photo'}
            </button>
            {avatarPath && !uploading && <button type="button" className="cm-link" onClick={removePhoto}>Remove</button>}
            {!existing && !avatarPath && <small className="cm-hint">Optional — skip for now if you like.</small>}
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic" hidden onChange={pickPhoto} />
        </div>

        {!existing && (
          <div className="cm-privacy-note">
            <strong>Your health profile stays private.</strong>
            <span>Only your name, username, photo, bio and interests you pick are public. You can still post anonymously anytime.</span>
          </div>
        )}
        <label className="cm-field">
          <span>Display name</span>
          <input className="cm-input" maxLength={50} value={displayName} onChange={(e) => setDisplayName(e.target.value)} autoComplete="given-name" />
        </label>
        <label className="cm-field">
          <span>Username</span>
          <div className="cm-input-prefix">
            <span>@</span>
            <input
              className="cm-input"
              maxLength={24}
              value={username}
              onChange={(e) => setUsername(normalizeUsernameInput(e.target.value))}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              aria-invalid={Boolean(problem || isTaken)}
            />
          </div>
          {problem ? <small className="cm-hint cm-hint--warn">{USERNAME_MESSAGES[problem]}</small>
            : isTaken ? <small className="cm-hint cm-hint--warn">@{username} is taken.</small>
              : usernameChanged && taken.name === username ? <small className="cm-hint cm-hint--ok">@{username} is available</small>
                : existing && usernameChanged ? <small className="cm-hint">You can change your username once every 30 days.</small> : null}
        </label>
        <label className="cm-field">
          <span>Bio <em>optional</em></span>
          <textarea className="cm-input" rows={2} maxLength={160} value={bio} onChange={(e) => setBio(e.target.value)} />
        </label>
        <div className="cm-field">
          <span>Interests <em>optional · public</em></span>
          <small className="cm-hint">Pick what you're happy for people to see on your profile. Nothing from your health profile is added.</small>
          <div className="cm-chip-row cm-chip-row--wrap">
            {COMMUNITY_TOPICS.map((t) => (
              <button
                key={t.key}
                type="button"
                className={`cm-chip${interests.includes(t.key) ? ' is-on' : ''}`}
                aria-pressed={interests.includes(t.key)}
                onClick={() => toggleInterest(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="cm-error" role="alert">{error}</p>}
      </div>
    </Sheet>
  );
}
