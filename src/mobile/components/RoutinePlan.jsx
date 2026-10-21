import { useMemo, useState } from 'react';
import { PlaylistIcon } from '../../components/icons/UiIcons.jsx';
import { trackApp } from '../utils/appAnalytics.js';
import PlaylistCoverPicker from './PlaylistCoverPicker.jsx';
import PlaylistAudiencePicker from './PlaylistAudiencePicker.jsx';
import { buildRoutine, buildShoppingList, overBudget } from '../../health/plan.js';
import { getBuyUrl } from '../data/buyUrl.js';
import { safeProductImageSrc } from '../../utils/resolveProductImage.js';
import { productImageOverride } from '../../data/productImageOverrides.js';

/**
 * Her routine and shopping list (src/health/plan.js), used at the end of the
 * quiz and in Ecosystem -> Routine. `have` marks what she already owns; it is
 * a shopping convenience kept on this device, not health data.
 */

function Thumb({ product }) {
  const src = productImageOverride(product) || safeProductImageSrc(product.image || product.imageUrl || product.images?.[0]);
  const [broken, setBroken] = useState(false);
  return <span className="ay-rt-thumb">{src && !broken ? <img src={src} alt="" loading="lazy" onError={() => setBroken(true)} /> : <span aria-hidden="true">{(product.brand || product.name || '?').charAt(0)}</span>}</span>;
}

const OverBudget = () => <span className="ay-rt-budget">Over your budget</span>;

export function Routine({ products, insights, onOpenProduct, budget = null }) {
  const routine = useMemo(() => buildRoutine(products, insights), [products, insights]);
  if (!routine.slots.length) return null;
  return (
    <section className="ay-rt" aria-labelledby="ay-rt-title">
      <h2 id="ay-rt-title">Your routine</h2>
      <p className="ay-rt-lede">Where each of your matches fits in your week, with a how-to line from its own instructions.</p>
      {routine.slots.map((slot) => (
        <div key={slot.id} className={`ay-rt-slot is-${slot.id}`}>
          <h3>{slot.title}</h3>
          {slot.note && <p className="ay-rt-note">{slot.note}</p>}
          <ul>
            {slot.items.map(({ product, how }) => (
              <li key={product.id}>
                <button type="button" className="ay-rt-item" onClick={() => onOpenProduct?.(product)}>
                  <Thumb product={product} />
                  <span className="ay-rt-text">
                    <b>{product.name}</b>
                    {overBudget(product, budget) && <OverBudget />}
                    {how && <span className="ay-rt-how">{how.text}</span>}
                    {how?.source && <small>From {how.source}</small>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

export function ShoppingList({ products, insights, have = {}, onToggleHave, onOpenProduct, onSavePlaylist, onOpenPlaylist, budget = null, onRequireAuth }) {
  const list = useMemo(() => buildShoppingList(products, insights, { getBuyUrl }), [products, insights]);
  if (!list.count) return null;
  const owned = list.groups.flatMap((g) => g.items).filter((i) => have[i.product.id]).length;
  return (
    <section className="ay-sl" aria-labelledby="ay-sl-title">
      <div className="ay-sl-head"><h2 id="ay-sl-title">Shopping list</h2><span>{owned} of {list.count} ready</span></div>
      {list.groups.map((g) => (
        <div key={g.id} className="ay-sl-group">
          <h3>{g.title}</h3>
          <ul>
            {g.items.map(({ product, price, where, buyUrl }) => {
              const got = Boolean(have[product.id]);
              return (
                <li key={product.id} className={got ? 'is-have' : ''}>
                  <label className="ay-sl-check">
                    <input type="checkbox" checked={got} onChange={() => onToggleHave?.(product.id)} />
                    <span className="ay-sl-box" aria-hidden="true" />
                    <span className="ay-sl-sr">I have {product.name}</span>
                  </label>
                  <button type="button" className="ay-sl-name" onClick={() => onOpenProduct?.(product)}>
                    <b>{product.name}</b>
                    {overBudget(product, budget) && <OverBudget />}
                    <small>{[price, where.length ? where.join(', ') : null].filter(Boolean).join(' · ')}</small>
                  </button>
                  {buyUrl && !got && <a className="ay-sl-buy" href={buyUrl} target="_blank" rel="noopener noreferrer sponsored" onClick={() => trackApp('product_buy_now_clicked', { productId: product?.id, category: product?.category, placement: 'routine_plan' })}>Buy<span className="ay-sl-sr"> {product.name}</span></a>}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      {!onSavePlaylist && onRequireAuth && <button type="button" className="ay-sl-pl-open" onClick={() => onRequireAuth('playlists')}><PlaylistIcon size={18} />Sign in to save as a playlist</button>}
      {onSavePlaylist && <SavePlaylist items={list.groups.flatMap((g) => g.items).map((it) => it.product)} have={have} onSave={onSavePlaylist} onOpen={onOpenPlaylist} />}
    </section>
  );
}

/**
 * "Save as a playlist": the shopping list as a Community playlist (same
 * playlists as Community, same cover and audience pickers). Only me by
 * default, since what someone shops for can say something about her health.
 */
function SavePlaylist({ items, have, onSave, onOpen }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('My shopping list');
  const [which, setWhich] = useState('tobuy');
  const [visibility, setVisibility] = useState('private');
  const [coverMode, setCoverMode] = useState('color');
  const [coverColor, setCoverColor] = useState('#F7BADD');
  const [coverText, setCoverText] = useState('');
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [state, setState] = useState({ step: 'idle' });
  const toBuy = items.filter((p) => !have[p.id]);
  const picked = (which === 'tobuy' ? toBuy : items).slice(0, 50);
  const save = async () => {
    if (!title.trim() || !picked.length) return;
    setState({ step: 'saving' });
    try {
      const out = await onSave({ title: title.trim(), visibility, productIds: picked.map((p) => p.id), cover: { mode: coverMode, color: coverColor, text: coverText, photo: coverPhoto } });
      setState({ step: 'done', playlist: out.playlist, added: out.added, missed: out.missed || 0 });
    } catch (e) {
      setState({ step: 'error', message: e?.message || 'The playlist could not be saved. Try again.' });
    }
  };
  if (state.step === 'done') {
    return (
      <div className="ay-sl-pl is-done" role="status">
        <p><b>Saved as “{state.playlist?.title || title}”.</b> {state.missed ? `${state.added} added, ${state.missed} could not be added.` : `${state.added} ${state.added === 1 ? 'product' : 'products'} in it.`}</p>
        <div className="ay-sl-pl-row">
          {onOpen && state.playlist?.id && <button type="button" className="ay-qc-primary" onClick={() => onOpen(state.playlist.id)}>Open playlist</button>}
          <button type="button" className="ay-qc-skip" onClick={() => { setOpen(false); setState({ step: 'idle' }); }}>Done</button>
        </div>
      </div>
    );
  }
  if (!open) return <button type="button" className="ay-sl-pl-open" onClick={() => setOpen(true)}><PlaylistIcon size={18} />Save as a playlist</button>;
  return (
    <div className="ay-sl-pl">
      <h3>Save as a playlist</h3>
      <label htmlFor="ay-sl-pl-title">Name</label>
      <input id="ay-sl-pl-title" value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} />
      {toBuy.length !== items.length && <div className="ay-sl-pl-which" role="radiogroup" aria-label="Which products">
        <button type="button" role="radio" aria-checked={which === 'tobuy'} className={which === 'tobuy' ? 'is-on' : ''} onClick={() => setWhich('tobuy')}>Still to buy ({toBuy.length})</button>
        <button type="button" role="radio" aria-checked={which === 'all'} className={which === 'all' ? 'is-on' : ''} onClick={() => setWhich('all')}>Everything ({items.length})</button>
      </div>}
      <PlaylistAudiencePicker id="ay-sl-pl-aud" value={visibility} onChange={setVisibility} />
      <PlaylistCoverPicker title={title} mode={coverMode} onMode={setCoverMode} color={coverColor} onColor={setCoverColor} text={coverText} onText={setCoverText} photo={coverPhoto} onPhoto={setCoverPhoto} />
      {state.step === 'error' && <p className="ay-hc-error" role="alert">{state.message}</p>}
      <div className="ay-sl-pl-row">
        <button type="button" className="ay-qc-primary" disabled={state.step === 'saving' || !title.trim() || !picked.length} onClick={save}>{state.step === 'saving' ? 'Saving…' : `Save ${picked.length} ${picked.length === 1 ? 'product' : 'products'}`}</button>
        <button type="button" className="ay-qc-skip" onClick={() => setOpen(false)} disabled={state.step === 'saving'}>Cancel</button>
      </div>
    </div>
  );
}
