import { useEffect, useState } from 'react';
import './photo-thumbs.css';

/** The photos she picked, as thumbnails she can remove (Eliz, run-through 11/12: photo upload). */
export default function PhotoThumbs({ files, onRemove }) {
  // Made and revoked in one effect, so React's double-run in development can't revoke URLs still shown.
  const [urls, setUrls] = useState([]);
  useEffect(() => {
    const made = files.map((f) => { try { return URL.createObjectURL(f); } catch { return ''; } });
    setUrls(made);
    return () => made.forEach((u) => { try { if (u) URL.revokeObjectURL(u); } catch { /* old browser */ } });
  }, [files]);
  return (
    <ul className="am-photo-thumbs" aria-label="Photos to post">
      {files.map((f, i) => (
        <li key={`${f.name}-${i}`}>
          {urls[i] ? <img src={urls[i]} alt="" /> : <span>{f.name}</span>}
          <button type="button" onClick={() => onRemove(i)} aria-label={`Remove photo ${i + 1}`}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button>
        </li>
      ))}
    </ul>
  );
}

