import { useEffect, useRef, useState } from 'react';
import { getMyCommunityProfile, isUsernameTaken, normalizeHandle, upsertCommunityProfile, setAvatarPath } from '../utils/community/communityStoreCore.js';
import { uploadCommunityImage, checkImageFile } from '../utils/community/imageUpload.js';
import { breaksCommunityRules } from '../utils/communityRules.js';
import './profile-setup-step.css';

/**
 * Last step of creating an account (founder, Oct 29): right after she
 * verifies her email, add a photo and pick a username, then she's in.
 * The photo is optional; the username is what Community shows.
 *
 * Skipped when she already has a username (a returning account). If the
 * profile service can't be reached, she can still finish and set it later.
 */
export function usernameProblem(raw) {
  const v = String(raw || '').trim().replace(/^@+/, '');
  if (!v) return 'Pick a username.';
  if (v.length < 3) return 'At least 3 characters.';
  if (v.length > 24) return '24 characters at most.';
  if (!normalizeHandle(v)) return 'Letters, numbers, dots and underscores only.';
  if (breaksCommunityRules(v)) return 'Try a different username.';
  return '';
}

export function suggestUsername(user, firstName = '') {
  const base = String(firstName || user?.user_metadata?.first_name || String(user?.email || '').split('@')[0] || '')
    .toLowerCase().replace(/[^a-z0-9_.]+/g, '').slice(0, 18);
  return base.length >= 3 ? base : '';
}

export default function ProfileSetupStep({ supabase, user, firstName = '', onDone, allowLater = false }) {
  const [checking, setChecking] = useState(true);
  const [handle, setHandle] = useState(() => suggestUsername(user, firstName));
  const [taken, setTaken] = useState(false);
  const [checkedFor, setCheckedFor] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [offline, setOffline] = useState(false);
  const fileRef = useRef(null);
  const problem = usernameProblem(handle);
  const clean = normalizeHandle(handle);

  // Already has a username: nothing to set up.
  useEffect(() => {
    let live = true;
    if (!supabase || !user?.id) { setChecking(false); setOffline(true); return undefined; }
    getMyCommunityProfile(supabase, user.id)
      .then((p) => { if (!live) return; if (p?.username) onDone?.(); else setChecking(false); })
      .catch(() => { if (live) { setChecking(false); } });
    return () => { live = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Is it free? (debounced)
  useEffect(() => {
    setTaken(false);
    if (!supabase || problem || !clean) return undefined;
    const t = setTimeout(() => {
      isUsernameTaken(supabase, clean, user?.id).then((t) => { setTaken(t); setCheckedFor(clean); }).catch(() => setCheckedFor(clean));
    }, 350);
    return () => clearTimeout(t);
  }, [clean]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const pickPhoto = (f) => {
    setError('');
    if (!f) return;
    try { checkImageFile(f); } catch (e) { setError(e.message); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const finish = async (e) => {
    e?.preventDefault();
    if (problem || taken || saving) return;
    setSaving(true); setError('');
    try {
      const displayName = String(firstName || user?.user_metadata?.first_name || clean).trim().slice(0, 40);
      await upsertCommunityProfile(supabase, user.id, { username: clean, displayName });
      if (file) {
        try {
          // Centre square crop for the round avatar.
          const bmp = await createImageBitmap(file);
          const size = Math.min(bmp.width, bmp.height);
          const crop = { x: Math.round((bmp.width - size) / 2), y: Math.round((bmp.height - size) / 2), size };
          bmp.close?.();
          const up = await uploadCommunityImage(supabase, file, { folder: 'avatars', userId: user.id, crop });
          await setAvatarPath(supabase, user.id, up.path);
        } catch { /* the username is saved; the photo can be added later from You */ }
      }
      onDone?.();
    } catch (err) {
      const msg = String(err?.message || '');
      if (/duplicate|unique|23505|taken/i.test(msg)) { setTaken(true); setError('That username is taken.'); }
      else { setOffline(true); setError('We couldn’t save your profile right now. You can finish and set it up later from You.'); }
    } finally {
      setSaving(false);
    }
  };

  if (checking) return <div className="ay-psetup" aria-busy="true"><p className="ay-psetup__sub">One moment…</p></div>;

  const initial = (firstName || clean || '?').slice(0, 1).toUpperCase();
  return (
    <form className="ay-psetup" onSubmit={finish} noValidate>
      <p className="ay-psetup__k">Last step</p>
      <h2 className="ay-psetup__t">Set up your profile</h2>
      <p className="ay-psetup__sub">Add a photo and pick a username. This is how you show up in Community.</p>

      <div className="ay-psetup__photo">
        <button type="button" className="ay-psetup__avatar" onClick={() => fileRef.current?.click()} aria-label={preview ? 'Change photo' : 'Add a photo'}>
          {preview ? <img src={preview} alt="" /> : <span aria-hidden="true">{initial}</span>}
          <i aria-hidden="true">+</i>
        </button>
        <div>
          <button type="button" className="ay-psetup__link" onClick={() => fileRef.current?.click()}>{preview ? 'Change photo' : 'Add a photo'}</button>
          <p className="ay-psetup__hint">Optional</p>
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" hidden onChange={(e) => pickPhoto(e.target.files?.[0])} />
      </div>

      <label className="ay-psetup__label" htmlFor="ay-psetup-handle">Username</label>
      <div className={`ay-psetup__field${(handle && problem) || taken ? ' is-bad' : ''}`}>
        <span aria-hidden="true">@</span>
        <input
          id="ay-psetup-handle"
          value={handle}
          onChange={(e) => { setHandle(e.target.value.replace(/^@+/, '').toLowerCase().slice(0, 24)); setError(''); }}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          aria-describedby="ay-psetup-msg"
          aria-invalid={Boolean((handle && problem) || taken)}
        />
      </div>
      <p id="ay-psetup-msg" className="ay-psetup__msg" role="status">
        {handle && problem ? problem : taken ? 'That username is taken.' : clean ? (checkedFor === clean ? `@${clean} is available` : 'Checking…') : 'Letters, numbers, dots and underscores.'}
      </p>

      {error && <p className="ay-psetup__err" role="alert">{error}</p>}
      <button type="submit" className="ay-psetup__go" disabled={Boolean(problem) || taken || saving}>{saving ? 'Saving…' : 'Finish'}</button>
      {(offline || allowLater) && <button type="button" className="ay-psetup__link ay-psetup__later" onClick={() => onDone?.()}>Finish later</button>}
    </form>
  );
}
