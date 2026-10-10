import { useState } from 'react';
import { checkImageFile } from '../../utils/community/imageUpload.js';
import { coverInk } from './playlistCoverImage.js';

const COLORS = ['#16122a', '#2d7365', '#b44328', '#e9ca59', '#b8dfcb', '#faf9f3'];
const EXAMPLES = ['Period care picks', 'My everyday routine', 'Worth sharing'];

export default function PlaylistCoverPicker({ title, mode, onMode, color, onColor, text, onText, photo, onPhoto, existingCoverUrl }) {
  const [preview, setPreview] = useState('');
  const [photoError, setPhotoError] = useState('');
  const choosePhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try { checkImageFile(file); } catch (error) {
      setPhotoError(error instanceof Error ? error.message : 'Choose a JPG, PNG, WebP, HEIC, or GIF image.');
      event.target.value = '';
      return;
    }
    setPhotoError('');
    onPhoto(file);
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result || ''));
    reader.onerror = () => setPhotoError('Could not preview this image. Choose another.');
    reader.readAsDataURL(file);
  };

  return <div className="am-cover-picker">
    <strong>Make a cover</strong>
    <div className="am-cover-mode">
      <button type="button" className={mode === 'color' ? 'is-active' : ''} onClick={() => onMode('color')}>Color + text</button>
      <button type="button" className={mode === 'photo' ? 'is-active' : ''} onClick={() => onMode('photo')}>Upload photo</button>
    </div>
    <div className="am-cover-preview" style={mode === 'color' ? { background: color, color: coverInk(color) } : undefined}>
      {mode === 'photo' && (preview || existingCoverUrl) ? <img src={preview || existingCoverUrl} alt="Playlist cover preview" /> : <><small>ayna</small><span>{text.trim() || title.trim() || 'Your collection'}</span><small>CURATED BY YOU</small></>}
    </div>
    {mode === 'color' ? <>
      <label htmlFor="am-cover-text">Words on your cover</label>
      <input id="am-cover-text" value={text} onChange={(event) => onText(event.target.value.slice(0, 55))} placeholder={title || 'e.g. Period care picks'} maxLength={55} />
      <small className="am-cover-hint">Leave blank to use your playlist name, or try:</small>
      <div className="am-cover-examples">{EXAMPLES.map((example) => <button type="button" key={example} onClick={() => onText(example)}>{example}</button>)}</div>
      <div className="am-cover-colors" aria-label="Background color">{COLORS.map((choice) => <button type="button" key={choice} aria-label={`Choose ${choice} background`} aria-pressed={color === choice} className={color === choice ? 'is-selected' : ''} style={{ background: choice }} onClick={() => onColor(choice)} />)}</div>
    </> : <><label className="am-photo-input">Choose a cover photo<input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/gif" onChange={choosePhoto} />{photo && <small>{photo.name}</small>}</label>{photoError && <p role="alert" className="am-cover-error">{photoError}</p>}</>}
  </div>;
}
