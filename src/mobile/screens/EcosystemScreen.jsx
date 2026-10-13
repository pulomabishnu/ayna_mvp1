import { useMemo } from 'react';
import EmptyState from '../components/EmptyState.jsx';
import { healthAreaLabel } from '../utils/healthAreaLabel.js';
import MobileHeader from '../components/MobileHeader.jsx';
import ProductCard from '../components/ProductCard.jsx';
import EcosystemChart from '../components/EcosystemChart.jsx';
import ArticleCard from '../components/ArticleCard.jsx';
import LegalFooter from '../components/LegalFooter.jsx';
import { getProductMatchDetailsForProduct, getEcosystemSeedFromQuiz, getSelectedNeeds, getProductById } from '../../data/products.js';
import { ECOSYSTEM_AREAS } from '../data/ecosystemAreas.js';
import { selectEcosystemProducts } from '../utils/recommendationSelection.js';
import { careNotes, shortNeedLabel } from '../../utils/matchDisplay.js';
import '../eco-needs.css';

const AREA_TONES = ['#F7BADD', '#BDEBD6', '#B9C2F4', '#F7E78E', '#EF9CCB', '#8FDABB'];
const MIN_SHELF_SCORE = 50;

function CareLinks({ care, limit = 4 }) {
  if (!care) return null;
  const links = [...(care.clinicLinks || []), ...(care.telehealthLinks || [])].slice(0, limit);
  if (!links.length) return null;
  return <ul className="ay-care-links">{links.map((link) => <li key={link.href}>
    <a href={link.href} target="_blank" rel="noopener noreferrer"><strong>{link.label}</strong><span>{link.hint}</span></a>
  </li>)}</ul>;
}

function onlyNote(count, phrase) {
  return `Only ${count} strong match${count === 1 ? '' : 'es'} for ${phrase} so far`;
}

export default function EcosystemScreen({
  myProducts = [], authUser = null, suggestedEcosystemProducts = [],
  relatedReads = [], savedProducts = {}, headerInitial = 'A', onOpenProduct,
  onOpenArticle, onOpenSaved, onBrowse, onGoCommunity, onRetake,
  onRequestEcosystemReset, ecosystemNotice, onOpenMonthlyCheckin, onOpenProfile,
  quizAnswers = null, matchOpts, onOpenWhyMatch, onAddToEcosystem, onToggleSaved, onReplayStory,
}) {
  const scoreFor = (product, profile) => getProductMatchDetailsForProduct(product, profile, null, matchOpts);
  const currentProducts = quizAnswers
    ? selectEcosystemProducts(myProducts, quizAnswers, quizAnswers.fullHealthIntake?.recommendedProductsPerArea, scoreFor)
    : myProducts;
  const currentIds = new Set(currentProducts.map((product) => product.id));
  const earlierProducts = myProducts.filter((product) => !currentIds.has(product.id));

  // Engine shelves: one per selected need (label, picks, shortBy, emptyReason),
  // plus care flags (care first when urgent = Yes, calm care notes otherwise).
  const seed = useMemo(() => (quizAnswers ? getEcosystemSeedFromQuiz(quizAnswers, null, matchOpts) : null), [quizAnswers, matchOpts]);
  const phraseById = useMemo(() => new Map((quizAnswers ? getSelectedNeeds(quizAnswers, null, matchOpts) : []).map((n) => [n.id, n.phrase])), [quizAnswers, matchOpts]);
  const shelves = seed?.shelves || [];
  const careFlags = seed?.careFlags || null;
  const careFirst = Boolean(careFlags?.careFirst);
  const notes = careNotes(careFlags);
  const myIds = new Set(myProducts.map((p) => p.id));

  // Each current pick sits on the shelf of its best need (50+). Picks that fit
  // no selected need keep the old area grouping.
  const shelfIds = new Set(shelves.map((s) => s.needId));
  const byNeed = new Map();
  const fallback = new Map();
  currentProducts.forEach((product) => {
    // The engine's own shelf first, else the best need it scores 50+ for.
    const engineShelf = shelves.find((s) => s.productIds.includes(product.id));
    const details = !engineShelf && quizAnswers ? scoreFor(product, quizAnswers) : null;
    const needId = engineShelf?.needId || details?.needMatches?.find((m) => shelfIds.has(m.needId) && m.relevant && m.score >= MIN_SHELF_SCORE)?.needId;
    if (needId) {
      if (!byNeed.has(needId)) byNeed.set(needId, []);
      byNeed.get(needId).push(product);
      return;
    }
    const fallbackKey = product.areaKey || 'other';
    const label = healthAreaLabel(ECOSYSTEM_AREAS.find((area) => area.key === fallbackKey)?.label || 'More care');
    const key = `area-${encodeURIComponent(label.toLowerCase())}`;
    if (!fallback.has(key)) fallback.set(key, { key, label, ringLabel: label, products: [] });
    fallback.get(key).products.push(product);
  });

  const suggestedIds = new Set();
  const sections = [
    ...shelves.map((shelf) => {
      const products = byNeed.get(shelf.needId) || [];
      // An empty shelf shows the engine's own picks to add (never padded).
      const picks = products.length ? [] : shelf.productIds
        .filter((id) => !myIds.has(id))
        .map((id) => getProductById(id))
        .filter(Boolean);
      picks.forEach((p) => suggestedIds.add(p.id));
      return {
        key: `need-${encodeURIComponent(shelf.needId)}`,
        label: shelf.label,
        ringLabel: healthAreaLabel(shelf.label),
        phrase: phraseById.get(shelf.needId) || shelf.label.toLowerCase(),
        products,
        picks,
        shelf,
      };
    }),
    ...fallback.values(),
  ];
  // Calm empty shelves go last so her picks lead.
  sections.sort((a, b) => Number(!a.products.length && !a.picks?.length) - Number(!b.products.length && !b.picks?.length));

  // Ring: needs grouped into areas (two needs in one area share a segment).
  const ringGroups = [];
  sections.filter((s) => s.products.length > 0).forEach((s) => {
    const existing = ringGroups.find((g) => g.label === s.ringLabel);
    if (existing) existing.products = [...existing.products, ...s.products];
    else ringGroups.push({ key: s.key, label: s.ringLabel, products: s.products });
  });
  const toneFor = (section) => {
    const index = ringGroups.findIndex((g) => g.label === section.ringLabel);
    return AREA_TONES[(index < 0 ? ringGroups.length + sections.indexOf(section) : index) % AREA_TONES.length];
  };
  const worthALook = suggestedEcosystemProducts.filter((p) => !suggestedIds.has(p.id));
  const hasAnything = currentProducts.length > 0 || sections.some((s) => s.picks?.length);

  const careBlock = careFirst && seed && <section className="ay-care-first" aria-labelledby="ay-care-first-title">
    <p className="ay-care-first__eyebrow">Care first</p>
    <h2 id="ay-care-first-title">Reach a clinician first</h2>
    {notes.map((n) => <p key={n}>{n}</p>)}
    <CareLinks care={seed.care} limit={5} />
  </section>;

  const careBanner = !careFirst && notes.length > 0 && <section className={`ay-care-banner${careFlags?.careProminent ? ' is-prominent' : ''}`} role="note" aria-label="Care notes">
    {notes.map((n) => <p key={n}>{n}</p>)}
  </section>;

  return <div className={`ayna-fresh-ecosystem ayna-cabinet-home${careFirst ? ' is-care-first' : ''}`}>
    <MobileHeader variant="light" activeTab="eco" initial={headerInitial} onOpenSaved={onOpenSaved} onGoEco={() => {}} onGoBrowse={onBrowse} onGoCommunity={onGoCommunity} onOpenProfile={onOpenProfile} />

    {careBlock}

    <section className="ayna-cabinet-stage ay-eco-hero" aria-labelledby="ayna-cabinet-title">
      {ringGroups.length > 0 && <div className="ay-eco-cover"><EcosystemChart groups={ringGroups} /></div>}
      <h1 id="ayna-cabinet-title">Your Ecosystem</h1>
      {currentProducts.length > 0 && (
        <div className="ay-eco-actions">
          {onReplayStory && <button type="button" className="ay-eco-play" onClick={onReplayStory} aria-label="Replay your Wrapped"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg></button>}
          {onReplayStory && <span className="ay-eco-play-label">Replay Wrapped</span>}
          <button type="button" className="ay-text-btn" onClick={onRetake}>Update</button>
        </div>
      )}
      {!hasAnything && <EmptyState compact art="spark" tone="mint" title="No matches yet" body="Update your answers or browse the shop." actionLabel="Shop" onAction={onBrowse} secondaryLabel="Update" onSecondary={onRetake} />}
      {ecosystemNotice && <p className="ayna-cabinet-notice" role="status">{ecosystemNotice}</p>}
    </section>

    {careBanner}

    {careFirst && hasAnything && <p className="ay-care-first__after">Products, when you are ready</p>}

    <div className={careFirst ? 'ay-eco-secondary' : undefined}>
      {sections.map((section, index) => {
        const { shelf } = section;
        const empty = section.products.length === 0 && !(section.picks?.length);
        const shown = section.products.length ? section.products : section.picks || [];
        return <section key={section.key} id={`ayna-area-${section.key}`} className={`ayna-cabinet-collection ayna-area-collection${empty ? ' is-empty-shelf' : ''}`} style={{ '--area-tone': toneFor(section) }} aria-labelledby={`ayna-area-title-${section.key}`}>
          <div className="ayna-cabinet-section-head"><h2 id={`ayna-area-title-${section.key}`}><small aria-hidden="true">{String(index + 1).padStart(2, '0')}</small>{section.label}</h2></div>
          {shelf && shelf.shortBy > 0 && shelf.picks.length > 0 && <p className="ay-shelf-note">{onlyNote(shelf.picks.length, section.phrase)}</p>}
          {empty && <div className="ay-shelf-empty">
            <p>No strong matches for {section.phrase} yet.</p>
            <button type="button" onClick={() => onBrowse?.(shortNeedLabel(section.label))}>Shop {shortNeedLabel(section.label).toLowerCase()} <span aria-hidden="true">→</span></button>
          </div>}
          {!section.products.length && shown.length > 0 && <p className="ay-shelf-note">Not in your Ecosystem yet</p>}
          {shown.length > 0 && <div className="ayna-editorial-product-grid">{shown.map((product) => section.products.length
            ? <ProductCard key={product.id} product={product} onClick={() => onOpenProduct?.(product)} quizAnswers={authUser ? quizAnswers : null} matchOpts={matchOpts} needId={section.shelf?.needId} onOpenWhyMatch={onOpenWhyMatch} isSaved={!!savedProducts[product.id]} onToggleSaved={onToggleSaved} />
            : <div className="ayna-cabinet-suggestion" key={product.id}><ProductCard product={product} onClick={() => onOpenProduct?.(product)} quizAnswers={authUser ? quizAnswers : null} matchOpts={matchOpts} needId={section.shelf?.needId} onOpenWhyMatch={onOpenWhyMatch} /><button type="button" onClick={() => onAddToEcosystem?.(product)}>Add to Ecosystem</button></div>)}</div>}
          {shelf?.care && !careFirst && <details className="ay-shelf-care"><summary>Care options for {section.phrase}</summary><CareLinks care={shelf.care} /></details>}
        </section>;
      })}

      {worthALook.length > 0 && <section className="ayna-cabinet-collection" aria-labelledby="ayna-cabinet-next-title">
        <div className="ayna-cabinet-section-head"><h2 id="ayna-cabinet-next-title">Worth a look</h2></div>
        <div className="ayna-editorial-product-grid">{worthALook.map((product) => <div className="ayna-cabinet-suggestion" key={product.id}><ProductCard product={product} onClick={() => onOpenProduct?.(product)} quizAnswers={authUser ? quizAnswers : null} matchOpts={matchOpts} onOpenWhyMatch={onOpenWhyMatch} /><button type="button" onClick={() => onAddToEcosystem?.(product)}>Add to Ecosystem</button></div>)}</div>
      </section>}
    </div>

    {relatedReads.length > 0 && <section className="ayna-cabinet-reads" aria-labelledby="ayna-cabinet-reads-title"><div className="ayna-cabinet-section-head"><h2 id="ayna-cabinet-reads-title">Read next</h2></div>{relatedReads.slice(0, 3).map((article) => <ArticleCard key={article.id} article={article} compact onClick={() => onOpenArticle?.(article)} />)}</section>}

    <section className="ayna-home-today"><h2>Monthly check-in</h2><button type="button" onClick={onOpenMonthlyCheckin}>Start</button></section>

    <section className="ayna-cabinet-more" aria-label="More ways to manage your cabinet">
      {earlierProducts.length > 0 && <details><summary>Earlier picks <span>{earlierProducts.length}</span></summary><p>Kept in your Ecosystem outside your current shortlist.</p><div className="ayna-editorial-product-grid">{earlierProducts.map((product) => <ProductCard key={product.id} product={product} onClick={() => onOpenProduct?.(product)} quizAnswers={authUser ? quizAnswers : null} matchOpts={matchOpts} />)}</div></details>}
      <details><summary>Manage Ecosystem</summary><button type="button" onClick={onRetake}>Update recommendations</button><button type="button" className="ayna-destructive-text" onClick={onRequestEcosystemReset}>Reset Ecosystem</button></details>
    </section>
    <LegalFooter />
  </div>;
}
