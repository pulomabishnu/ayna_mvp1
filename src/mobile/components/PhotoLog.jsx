import { useEffect, useState } from 'react';
import { addPhoto, removePhoto, photosForDay, PHOTO_AREAS, MAX_PHOTOS_PER_DAY } from '../../health/photoLog.js';

/**
 * Skin and hair photos for one day (UCLA focus group 10/1). Kept on this phone only: never
 * uploaded, synced or shared. Compare days by opening them in Your month.
 */
export default function PhotoLog({ day, dayLabel = '' }) {
  const [photos, setPhotos] = useState([]);
  const [urls, setUrls] = useState({});
  const [area, setArea] = useState('Skin');
  const [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    photosForDay(day).then((list) => { if (live) setPhotos(list); });
    return () => { live = false; };
  }, [day]);
  useEffect(() => {
    const made = Object.fromEntries(photos.map((p) => { try { return [p.id, URL.createObjectURL(p.blob)]; } catch { return [p.id, '']; } }));
    setUrls(made);
    return () => Object.values(made).forEach((u) => { try { if (u) URL.revokeObjectURL(u); } catch { /* old browser */ } });
  }, [photos]);
  const onPick = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    setError('');
    try {
      for (const f of files) await addPhoto(day, f, area);
    } catch (err) { setError(err.message || 'Could not save that photo.'); }
    setPhotos(await photosForDay(day));
  };
  return (
    <section className="ay-plog" aria-labelledby={`ay-plog-${day}`}>
      <p className="ay-mcal__flowh" id={`ay-plog-${day}`}>Photos</p>
      <p className="ay-plog__note">Track skin or hair over time. Saved on this phone only, never uploaded.</p>
      <div className="ay-mcal__seg ay-plog__areas" role="radiogroup" aria-label="What the photo shows">
        {PHOTO_AREAS.map((a) => <button key={a} type="button" role="radio" aria-checked={area === a} className={area === a ? 'is-on' : undefined} onClick={() => setArea(a)}>{a}</button>)}
      </div>
      {photos.length > 0 && (
        <ul className="ay-plog__list">
          {photos.map((p, i) => (
            <li key={p.id}>
              {urls[p.id] && <img src={urls[p.id]} alt={`${p.area} photo ${i + 1}${dayLabel ? `, ${dayLabel}` : ''}`} />}
              <small>{p.area}</small>
              <button type="button" aria-label={`Delete ${p.area.toLowerCase()} photo ${i + 1}`} onClick={async () => { await removePhoto(p.id); setPhotos(await photosForDay(day)); }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button>
            </li>
          ))}
        </ul>
      )}
      {photos.length < MAX_PHOTOS_PER_DAY && (
        <label className="ay-plog__add">
          <span>Add a photo</span>
          <input type="file" accept="image/*" capture="environment" onChange={onPick} />
        </label>
      )}
      {error && <p className="ay-plog__err" role="alert">{error}</p>}
    </section>
  );
}
