import React, { useEffect, useRef, useState } from 'react';
import MatchGauge from '../MatchGauge';
import ProductTileImage from '../ProductTileImage';
import { useEscapeToClose } from '../../utils/useEscapeToClose';
import { useCommunity } from './CommunityContext';

function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return '';
}

export function UserAvatar({ name, url, anonymous = false, size = 36 }) {
  const style = { width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.36)) };
  if (anonymous) {
    return (
      <span className="cm-avatar cm-avatar--anon" style={style} aria-hidden="true">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="3.4" /><path d="M5.5 19.2c.8-3.6 3.3-5.4 6.5-5.4s5.7 1.8 6.5 5.4" /></svg>
      </span>
    );
  }
  if (url) return <img className="cm-avatar" src={url} alt="" style={style} loading="lazy" />;
  return <span className="cm-avatar" style={style} aria-hidden="true">{initials(name) || 'a'}</span>;
}

export function Stars({ value, onChange, size = 'sm', label = 'Rating' }) {
  const interactive = typeof onChange === 'function';
  return (
    <span className={`cm-stars cm-stars--${size}`} role={interactive ? 'radiogroup' : 'img'} aria-label={interactive ? label : `${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        interactive ? (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            className={n <= value ? 'is-on' : ''}
            onClick={() => onChange(n)}
          >★</button>
        ) : (
          <span key={n} className={n <= value ? 'is-on' : ''} aria-hidden="true">★</span>
        )
      ))}
    </span>
  );
}

/**
 * The compact, native ayna product attachment used everywhere a product shows
 * up in Community: image, brand, name, the VIEWER's own % match, View.
 */
export function CommunityProductPreview({ productId, product: given, variant = 'compact', note, actions, onOpened }) {
  const { productsById, matchFor, openProduct, hasProfile, startQuiz } = useCommunity();
  const product = given || productsById.get(productId);
  if (!product) return null;
  const pct = matchFor(product);
  const open = () => { onOpened?.(); openProduct(product); };
  return (
    <div className={`cm-product cm-product--${variant}`}>
      <button type="button" className="cm-product__main" onClick={open} aria-label={`View ${product.name}`}>
        <span className="cm-product__tile">
          <ProductTileImage product={product} alt="" imgStyle={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </span>
        <span className="cm-product__text">
          {product.brand && <span className="cm-product__brand">{product.brand}</span>}
          <span className="cm-product__name">{product.name}</span>
          {note && <span className="cm-product__note">“{note}”</span>}
          {pct != null ? (
            <span className="cm-product__match">
              <MatchGauge percent={pct} size={variant === 'row' ? 30 : 24} />
              <span><strong>{pct}% match</strong> for you</span>
            </span>
          ) : !hasProfile ? (
            <span className="cm-product__match cm-product__match--muted">See your match</span>
          ) : null}
        </span>
      </button>
      <div className="cm-product__side">
        {pct == null && !hasProfile && variant === 'row' && (
          <button type="button" className="cm-link" onClick={startQuiz}>Take the quiz</button>
        )}
        {actions}
        <button type="button" className="cm-product__view" onClick={open}>View</button>
      </div>
    </div>
  );
}

/** Bottom sheet on phones, centered dialog on desktop. */
export function Sheet({ title, onClose, children, footer, wide = false }) {
  useEscapeToClose(true, onClose);
  const ref = useRef(null);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    return () => { document.body.style.overflow = prev; };
  }, []);
  return (
    <div className="cm-sheet-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`cm-sheet${wide ? ' cm-sheet--wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <div className="cm-sheet__head">
          <h3>{title}</h3>
          <button type="button" className="cm-icon-btn" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <div className="cm-sheet__body">{children}</div>
        {footer && <div className="cm-sheet__foot">{footer}</div>}
      </div>
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="cm-toggle">
      <span className="cm-toggle__text">
        <span>{label}</span>
        {hint && <small>{hint}</small>}
      </span>
      <span className="ayna-browse__personalized-switch">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="ayna-browse__personalized-track" aria-hidden="true" />
      </span>
    </label>
  );
}

export function EmptyState({ title, children, action }) {
  return (
    <div className="cm-empty">
      <p className="cm-empty__title">{title}</p>
      {children && <p className="cm-empty__text">{children}</p>}
      {action}
    </div>
  );
}

export function FeedSkeleton({ count = 3 }) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="cm-post cm-post--skeleton">
          <div className="cm-post__head">
            <div className="skeleton-shimmer" style={{ width: 36, height: 36, borderRadius: '50%' }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton-shimmer" style={{ height: '.7rem', width: '35%', borderRadius: 4 }} />
            </div>
          </div>
          <div className="skeleton-shimmer" style={{ height: '.9rem', width: '90%', borderRadius: 4, marginTop: '.9rem' }} />
          <div className="skeleton-shimmer" style={{ height: '.9rem', width: '70%', borderRadius: 4, marginTop: '.45rem' }} />
        </div>
      ))}
    </div>
  );
}

/** Long text, clamped with "Read more". */
export function ClampedText({ text, lines = 5, className = '' }) {
  const [open, setOpen] = useState(false);
  const long = String(text || '').length > 320 || String(text || '').split('\n').length > lines;
  return (
    <div className={className}>
      <p className={`cm-text${!open && long ? ' cm-text--clamped' : ''}`} style={{ '--cm-lines': lines }}>{text}</p>
      {long && (
        <button type="button" className="cm-link" onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}>
          {open ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  );
}

export function OverflowMenu({ items, label = 'More options' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('touchstart', onDoc);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('touchstart', onDoc); };
  }, [open]);
  const visible = items.filter(Boolean);
  if (!visible.length) return null;
  return (
    <div className="cm-menu" ref={ref}>
      <button type="button" className="cm-icon-btn" aria-label={label} aria-haspopup="menu" aria-expanded={open} onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.3" /><circle cx="12" cy="12" r="1.3" /><circle cx="19" cy="12" r="1.3" /></svg>
      </button>
      {open && (
        <div className="cm-menu__list" role="menu" onClick={(e) => e.stopPropagation()}>
          {visible.map((item) => (
            <button key={item.label} type="button" role="menuitem" className={item.danger ? 'is-danger' : ''} onClick={() => { setOpen(false); item.onClick(); }}>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
