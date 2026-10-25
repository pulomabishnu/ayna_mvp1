import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSheetDrag } from '../hooks/useSheetDrag.js';
import ProductImage from './ProductImage.jsx';
import ProductEvidence from '../../components/pdp/ProductEvidence.jsx';
import { buildGlance } from '../../components/pdp/glance.js';
import { useResearchState } from '../../data/researchLoader.js';
import { formatPrice } from '../../utils/formatPrice.js';
import { displayName } from '../utils/displayName.js';
import { SheetMatch, ProductQuickActions } from './ProductQuick.jsx';
import { MatchLine, SafetyLine, WhereToBuy, StickyBuy, PriceLine } from '../../components/pdp/PdpParts.jsx';
import { buyModel } from '../../components/pdp/buyModel.js';
import { heroPriceView } from '../../components/pdp/heroPrice.js';
import { perUnitLabel } from '../../components/pdp/glance.js';
import { priceParts } from '../../data/passport/priceParts.js';
import { cardKind } from '../../utils/productCardFacts.js';
import { matchLineState, topWarningFor, heroNotes } from '../../components/pdp/pdpParts.js';
import { ProductAsk } from '../../components/passport/ProductSections.jsx';
import { whyLine } from '../../utils/whyLine.js';
import '../../components/pdp/pdp-tabs.css';
import '../pdp.css';
import '../app-pdp.css';
import '../ayna-home.css';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, summary, [tabindex]:not([tabindex="-1"])';
const reduceMotion = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };

/**
 * The quick product sheet (founder, Oct 24 20:12): slides up OVER the Daily
 * Rundown or the chat, which stay exactly where they were underneath. Photo,
 * name, price, match, Buy / Save / Add to my routine, then the product page's
 * own four tabs (ProductEvidence), which also switch with a sideways swipe.
 * "Read more" fills the sheet with the full product page; Back from there
 * returns to the sheet, and closing returns focus to what she tapped.
 *
 * A dialog: focus stays inside, Escape closes, the grabber drags it down
 * (useSheetDrag), everything behind it is inert. Reduced motion: no slide.
 */
export default function ProductSheet({ product: baseProduct, onClose, matchState = null, saved = false, onToggleSaved, inRoutine = false, onAddToRoutine, renderFull = null,
  // The match engine's details for her (null signed out): the one match line and Is it for you.
  details = null, onShowWhy = null, onFixSafety = null, pregnancyFirst = false,
  // Ask about this product: a starter or her question goes to the chat, anchored to the product.
  onAsk = null }) {
  const { product, loaded } = useResearchState(baseProduct);
  const [full, setFull] = useState(false);
  const rootRef = useRef(null);
  const sheetRef = useRef(null);
  const actionsRef = useRef(null);
  const closeBtnRef = useRef(null);
  const [opener] = useState(() => (typeof document !== 'undefined' ? document.activeElement : null));
  const finish = () => onClose?.();
  const { grabberProps, close } = useSheetDrag(finish, sheetRef);

  // Everything behind the sheet is inert while it is open (the story and the chat stay mounted).
  useLayoutEffect(() => {
    const root = rootRef.current;
    const host = root?.parentElement;
    if (!host) return undefined;
    // Toasts stay live (Undo after a Save or an add must still work).
    const others = [...host.children].filter((el) => el !== root && !el.hasAttribute('inert') && !el.classList.contains('ay-gtoast'));
    others.forEach((el) => el.setAttribute('inert', ''));
    // Closed: the page behind is live again, then focus goes back to what she tapped.
    return () => {
      others.forEach((el) => el.removeAttribute('inert'));
      try { if (opener && opener.isConnected) opener.focus({ preventScroll: true }); } catch { /* gone */ }
    };
  }, [opener]);
  useEffect(() => { closeBtnRef.current?.focus({ preventScroll: true }); }, []);
  useEffect(() => {
    if (!full) closeBtnRef.current?.focus({ preventScroll: true });
  }, [full]);
  useEffect(() => {
    const onKey = (e) => {
      // A sheet opened on top of this one (sign in to save) handles its own keys.
      const dialogs = document.querySelectorAll('[aria-modal="true"]');
      if (dialogs.length && dialogs[dialogs.length - 1] !== sheetRef.current && !sheetRef.current?.contains(dialogs[dialogs.length - 1])) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (full) setFull(false); else close();
        return;
      }
      if (e.key !== 'Tab') return;
      const nodes = [...(rootRef.current?.querySelectorAll(FOCUSABLE) || [])].filter((n) => !n.closest('[hidden]') && n.offsetParent !== null);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    // Capture phase: the Rundown story underneath listens for Escape and arrows too.
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  });

  if (!product) return null;
  const name = displayName(product);
  const price = formatPrice(product);
  const brand = product.brand && String(product.brand).trim().toLowerCase() !== String(product.name || '').trim().toLowerCase() ? product.brand : '';
  const glance = buildGlance(product, {});
  const topWarning = topWarningFor(product, glance, undefined, { pregnancyFirst });
  const buy = buyModel(product, { brand, name });
  const priceNotes = heroNotes(heroPriceView(product, { price: priceParts(product), perUnit: perUnitLabel(product), glance, brand }).notes).keep;
  const still = reduceMotion();

  const node = (
    <div ref={rootRef} className={`ay-psheet-layer${still ? ' is-still' : ''}${full ? ' is-full' : ''}`} data-product-sheet="">
      <div className="ay-psheet-dim" aria-hidden="true" onClick={() => (full ? setFull(false) : close())} />
      <section ref={sheetRef} id="ay-psheet" className="ay-psheet" data-tour="psheet" role="dialog" aria-modal="true" aria-labelledby="ay-psheet-title">
        {full && renderFull ? renderFull(product, () => setFull(false)) : (<>
          <button {...grabberProps} aria-label={`Close ${name}`} />
          <div className="ay-psheet__bar">
            <button ref={closeBtnRef} type="button" className="ay-psheet__close" onClick={close} aria-label="Close">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>
          <div className="ay-psheet__scroll">
            <div className="ay-psheet__head">
              <span className="ay-psheet__img"><ProductImage product={product} src={product.image || product.imageUrl} alt="" style={{ objectFit: 'contain' }} /></span>
              <div className="ay-psheet__id">
                {(brand || cardKind(product)) && <p className="ay-psheet__brand">{brand || cardKind(product)}</p>}
                <h2 id="ay-psheet-title">{name}</h2>
                <PriceLine main={product.price ? price.main : ''} notes={priceNotes} />
              </div>
            </div>
            {details
              ? <MatchLine state={matchLineState({ details, percent: details.percent, hasProfile: true, why: whyLine(product, details) })} onWhy={onShowWhy} onFix={onFixSafety} />
              : <SheetMatch state={matchState} />}
            <div ref={actionsRef}><ProductQuickActions product={product} saved={saved} onToggleSaved={onToggleSaved} inRoutine={inRoutine} onAddToRoutine={onAddToRoutine} big buy={buy} /></div>
            <WhereToBuy rows={buy?.rows} />
            <SafetyLine text={topWarning} />
            <ProductEvidence key={product.id} product={product} glance={glance} loading={!loaded} swipeTabs syncHash={false} safetyLead={topWarning} fit={{ details, hasProfile: Boolean(details && details.matchStatus !== 'no-profile'), onShowWhy }} askSlot={onAsk ? <ProductAsk productName={name} onAsk={onAsk} hasProfile={Boolean(details && details.matchStatus !== 'no-profile')} /> : null} />
            <StickyBuy model={buy} watch={actionsRef} mode="scroll" saved={saved} onSave={onToggleSaved ? () => onToggleSaved(product) : null} />
            {renderFull && <button type="button" className="ay-psheet__more" onClick={() => setFull(true)}>Read more <span aria-hidden="true">→</span><span className="sr-only"> about {name} on its full page</span></button>}
          </div>
        </>)}
      </section>
    </div>
  );
  const host = (typeof document !== 'undefined' && document.querySelector('.ayna-mobile')) || null;
  return host ? createPortal(node, host) : node;
}
