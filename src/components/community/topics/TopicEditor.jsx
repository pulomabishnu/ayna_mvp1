import { useEffect, useId, useMemo, useState } from 'react';
import TopicSheetFrame from './TopicSheetFrame.jsx';
import TopicCover from './TopicCover.jsx';
import { RuleField } from '../RuleField.jsx';
import { CharRing } from '../notesKit.jsx';
import { TOPIC_COLORS, checkTopicContrast, defaultTextFor } from '../../../utils/community/topicContrast.js';
import { TOPIC_NAME_MAX, TOPIC_DESCRIPTION_MAX, VISIBILITY_COPY, topicNameProblem, topicDescriptionProblem, validateTopicInput } from '../../../utils/community/topicRules.js';
import { createUserTopic, updateUserTopic, topicError } from '../../../utils/community/userTopics.js';
import { uploadCommunityImage, deleteCommunityImage, checkImageFile } from '../../../utils/community/imageUpload.js';

const FONTS = [['serif', 'Display'], ['sans', 'Plain']];

/**
 * Start a topic, or edit one (owner and co-owners). Live preview on top,
 * then name, description, cover, title, audience. Text colours that would be
 * hard to read on the chosen cover are disabled with the reason beside them.
 */
export default function TopicEditor({ variant = 'web', supabase, user, topic = null, onSaved, onClose, onShowRules, canChangeAudience = true }) {
  const editing = Boolean(topic);
  const uid = useId();
  const [name, setName] = useState(topic?.name || '');
  const [description, setDescription] = useState(topic?.description || '');
  const [coverMode, setCoverMode] = useState(topic?.cover_image_url ? 'photo' : 'color');
  const [coverColor, setCoverColor] = useState(topic?.cover_color || '#f7badd');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPath] = useState(topic?.cover_image_url || null);
  const [titleFont, setTitleFont] = useState(topic?.title_font || 'serif');
  const [chosenText, setTextColor] = useState(topic?.text_color || '#3e2723');
  const [visibility, setVisibility] = useState(topic?.visibility || 'public');
  const [anonymous, setAnonymous] = useState(Boolean(topic?.creator_anonymous));
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');

  const photoPreview = useMemo(() => (photoFile ? URL.createObjectURL(photoFile) : null), [photoFile]);
  useEffect(() => () => { if (photoPreview) URL.revokeObjectURL(photoPreview); }, [photoPreview]);
  const hasPhoto = coverMode === 'photo' && Boolean(photoFile || photoPath);

  // Keep the title readable when the cover changes: a colour that no longer
  // passes falls back to the first one that does.
  const textColor = checkTopicContrast({ textColor: chosenText, coverColor, hasPhoto }).ok ? chosenText : defaultTextFor(coverColor, hasPhoto);

  const nameProblem = name.trim() ? topicNameProblem(name) : '';
  const descriptionProblem = topicDescriptionProblem(description);
  const preview = { name: name.trim() || 'Your topic', cover_color: coverColor, text_color: textColor, title_font: titleFont, cover_image_url: hasPhoto && !photoFile ? photoPath : null };
  const form = { name, description, coverColor, coverImageUrl: hasPhoto ? (photoPath || 'covers/00000000-0000-0000-0000-000000000000.jpg') : null, titleFont, textColor, visibility, anonymous };
  const check = validateTopicInput(form);
  const ready = !check.error && !busy;
  const app = variant === 'app';

  const pickPhoto = (file) => {
    if (!file) return;
    try { checkImageFile(file); setPhotoFile(file); setCoverMode('photo'); setProblem(''); } catch (e) { setProblem(e.message); }
  };

  const save = async () => {
    setTouched(true);
    if (!ready) { if (check.error) setProblem(check.error); return; }
    setBusy(true); setProblem('');
    let uploaded = null;
    try {
      let coverImageUrl = hasPhoto ? photoPath : null;
      if (hasPhoto && photoFile) {
        uploaded = await uploadCommunityImage(supabase, photoFile, { folder: 'covers', userId: user?.id });
        coverImageUrl = uploaded.path;
      }
      const payload = { ...form, coverImageUrl };
      const saved = editing ? await updateUserTopic(supabase, topic.id, payload) : await createUserTopic(supabase, payload);
      onSaved?.(saved, { created: !editing });
    } catch (e) {
      if (uploaded) await deleteCommunityImage(supabase, uploaded.path);
      setProblem(e?.status ? e.message : topicError(e));
      setBusy(false);
    }
  };

  const field = (id) => `${uid}-${id}`;
  const err = (text) => text ? <p className="ut-field-error" role="alert">{text}</p> : null;

  return <TopicSheetFrame variant={variant} title={editing ? 'Edit topic' : 'Start a topic'} onClose={onClose} className="ut-editor">
    <TopicCover topic={preview} size="preview" photoUrl={hasPhoto ? photoPreview : null} />

    <div className="ut-field">
      <label className="ut-label" htmlFor={field('name')}>Name</label>
      <div className="ut-input-row">
        <RuleField as="input" id={field('name')} data-autofocus value={name} maxLength={TOPIC_NAME_MAX} onChange={(e) => setName(e.target.value)} onBlur={() => setTouched(true)} placeholder="e.g. Adenomyosis" onShowRules={onShowRules} aria-invalid={Boolean(touched && nameProblem) || undefined} />
        <CharRing length={name.length} max={TOPIC_NAME_MAX} className="ay-ring ut-ring" />
      </div>
      {touched && err(nameProblem)}
    </div>

    <div className="ut-field">
      <label className="ut-label" htmlFor={field('desc')}>What it’s for <small>Optional</small></label>
      <div className="ut-input-row">
        <RuleField id={field('desc')} minRows={2} value={description} maxLength={TOPIC_DESCRIPTION_MAX} onChange={(e) => setDescription(e.target.value)} placeholder="Who it’s for and what to talk about" onShowRules={onShowRules} />
        <CharRing length={description.length} max={TOPIC_DESCRIPTION_MAX} className="ay-ring ut-ring" />
      </div>
      {err(descriptionProblem)}
    </div>

    <fieldset className="ut-field ut-fieldset">
      <legend className="ut-label">Cover</legend>
      <div className="ut-swatches" role="presentation">
        {TOPIC_COLORS.map((c) => <label key={c.hex} className="ut-swatch-opt">
          <input type="radio" name={field('cover')} checked={coverMode === 'color' && coverColor === c.hex} onChange={() => { setCoverMode('color'); setCoverColor(c.hex); }} />
          <span className="ut-dot" style={{ '--ut-dot': c.hex }} aria-hidden="true" />
          <span>{c.label}</span>
        </label>)}
        <label className="ut-swatch-opt is-photo">
          <input type="radio" name={field('cover')} checked={coverMode === 'photo'} onChange={() => setCoverMode('photo')} />
          <span className="ut-dot is-photo" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="5" width="17" height="14" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="m4 17 5-5 4 4 2.5-2.5L20 18" /></svg></span>
          <span>Photo</span>
        </label>
      </div>
      {coverMode === 'photo' && <div className="ut-photo-row">
        <label className="ut-file-btn">
          <input type="file" accept="image/jpeg,image/png,image/webp,image/heic" onChange={(e) => { pickPhoto(e.target.files?.[0]); e.target.value = ''; }} />
          {photoFile || photoPath ? 'Change photo' : 'Choose a photo'}
        </label>
        <small className="ut-hint">Location data is removed before it uploads.</small>
      </div>}
    </fieldset>

    <fieldset className="ut-field ut-fieldset">
      <legend className="ut-label">Title</legend>
      <div className="ut-fonts">
        {FONTS.map(([key, label]) => <label key={key} className="ut-font-opt">
          <input type="radio" name={field('font')} checked={titleFont === key} onChange={() => setTitleFont(key)} />
          <span className={`ut-font-${key}`} aria-hidden="true">Aa</span>
          <span>{label}</span>
        </label>)}
      </div>
      <div className="ut-swatches is-text">
        {TOPIC_COLORS.map((c) => {
          const res = checkTopicContrast({ textColor: c.hex, coverColor, hasPhoto });
          const reasonId = field(`why-${c.key}`);
          return <label key={c.hex} className={`ut-swatch-opt${res.ok ? '' : ' is-off'}`}>
            <input type="radio" name={field('text')} checked={textColor === c.hex} disabled={!res.ok} aria-describedby={res.ok ? undefined : reasonId} onChange={() => setTextColor(c.hex)} />
            <span className="ut-dot is-text" style={{ '--ut-dot': c.hex }} aria-hidden="true">A</span>
            <span>{c.label}{!res.ok && <small id={reasonId} className="ut-why">{res.reason}</small>}</span>
          </label>;
        })}
      </div>
    </fieldset>

    <fieldset className="ut-field ut-fieldset">
      <legend className="ut-label">Who can see it</legend>
      {!canChangeAudience && <p className="ut-hint">Only the person who started this topic can change this.</p>}
      <div className="ut-audience">
        {['public', 'friends', 'private'].map((key) => <label key={key} className="ut-audience-opt">
          <input type="radio" name={field('aud')} checked={visibility === key} disabled={!canChangeAudience} onChange={() => setVisibility(key)} />
          <span><strong>{VISIBILITY_COPY[key].label}</strong><small>{VISIBILITY_COPY[key].hint}</small></span>
        </label>)}
      </div>
      {visibility === 'public' && !editing && <label className="ut-check">
        <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
        <span>Don’t show my name. It says “Started by a member”.</span>
      </label>}
    </fieldset>

    {problem && <p className={app ? 'am-error' : 'cm-error'} role="alert">{problem}</p>}
    <div className="ut-actions">
      <button type="button" className={app ? 'am-primary' : 'ay-btn ay-btn--primary'} disabled={busy || (touched && Boolean(check.error))} onClick={save}>
        {busy ? 'Saving…' : editing ? 'Save changes' : 'Start topic'}
      </button>
      {visibility === 'public' && <small className="ut-hint">Public topics show in Community once the ayna team has checked them.</small>}
    </div>
  </TopicSheetFrame>;
}
