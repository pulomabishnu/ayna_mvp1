import { useState } from 'react';
import { checkImageFile } from '../../utils/community/imageUpload.js';

const COLORS = ['#4E3866', '#A2603C', '#D789A1', '#E8A94F', '#748D78', '#242A52'];

function coverInk(color) {
  return color === '#E8A94F' ? '#30233B' : '#FFF9F2';
}

export default function PlaylistCoverPicker({ title, mode, onMode, color, onColor, text, onText, photo, onPhoto, existingCoverUrl }) {
  const [preview, setPreview] = useState('');
  const choosePhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    checkImageFile(file);
    onPhoto(file);
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  return <div className="am-cover-picker">
    <strong>Make a cover</strong>
    <div className="am-cover-mode">
      <button type="button" className={mode === 'color' ? 'is-active' : ''} onClick={() => onMode('color')}>Color + text</button>
      <button type="button" className={mode === 'photo' ? 'is-active' : ''} onClick={() => onMode('photo')}>Upload photo</button>
    </div>
    <div className="am-cover-preview" style={mode === 'color' ? { background: color, color: coverInk(color) } : undefined}>
      {mode === 'photo' && (preview || existingCoverUrl) ? <img src={preview || existingCoverUrl} alt="Playlist cover preview" /> : <><small>ayna</small><span>{text.trim() || title.trim() || 'My playlist'}</span><small>a little collection for you</small></>}
    </div>
    {mode === 'color' ? <>
      <label htmlFor="am-cover-text">Cover text</label>
      <input id="am-cover-text" value={text} onChange={(event) => onText(event.target.value.slice(0, 55))} placeholder={title || 'My playlist'} />
      <div className="am-cover-colors" aria-label="Background color">{COLORS.map((choice) => <button type="button" key={choice} aria-label={`Choose ${choice} background`} aria-pressed={color === choice} className={color === choice ? 'is-selected' : ''} style={{ background: choice }} onClick={() => onColor(choice)} />)}</div>
    </> : <label className="am-photo-input">Choose a cover photo<input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/gif" onChange={choosePhoto} />{photo && <small>{photo.name}</small>}</label>}
  </div>;
}
