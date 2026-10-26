import React from 'react';
import InfoHero from './info/InfoHero.jsx';
import { ALL_PRODUCTS } from '../data/products.js';
import { StickerButton, OutlineButton } from './ui/ay';
import GlossaryTerm from './GlossaryTerm';
import ProductTileImage, { ProductImageFallback } from './ProductTileImage';
import '../styles/compare-page.css';
import CompareTable from './compare/CompareTable.jsx';
import { COMPARE_MAX } from '../utils/compareStore.js';

/* The sample comparison for an empty Compare (info-pages audit issue 3, #58 The
   Ordinary label/value rows): three real menstrual cups from the catalog, the
   same CompareTable as the product page, clearly labelled as a sample. */
const SAMPLE_IDS = ['p-saalt-cup', 'p-diva-cup', 'p-lunette-cup'];
const sampleProducts = () => SAMPLE_IDS.map((id) => ALL_PRODUCTS.find((p) => p.id === id)).filter(Boolean);

export default function Comparison({ onBack = null, compareList, onRemove, onClear, CATEGORY_LABELS, myProducts = {}, onBrowseProducts, onAddToCompare, savedProducts = {}, matchFor = null, detailsFor = null, onOpenProduct = null, onSeeMatch = null }) {
    // Her Saved first (saving often means she is still deciding), then her routine.
    const savedList = Object.values(savedProducts || {}).filter((p) => p?.id);
    const ecosystemList = [...savedList, ...Object.values(myProducts || {}).filter((p) => p?.id && !savedProducts?.[p.id])];

    if (compareList.length === 0) {
        const sample = sampleProducts();
        return (
            <div className="ay-container aycmp">
                <InfoHero
                    title="Side by side"
                    crumb="Compare"
                    lede={`Compare 2 to ${COMPARE_MAX} products on your match, price, evidence, ingredients and safety.`}
                    onBack={onBack} backLabel="Your ecosystem" backHref="/you/ecosystem"
                />

                {sample.length >= 2 && (
                    <section className="aycmp__sample uq-bleed is-pink uq-band" aria-labelledby="aycmp-sample-h">
                        <div className="aycmp__sample-head">
                            <h2 id="aycmp-sample-h" className="aycmp__h2">Sample comparison</h2>
                            <p>Three menstrual cups from the catalog, to show how it works.{matchFor ? '' : ' Your match shows once you answer a few questions.'}</p>
                        </div>
                        <CompareTable products={sample} matchFor={matchFor} detailsFor={detailsFor} onOpen={onOpenProduct} variant="web" headingId="aycmp-sample-h" onSeeMatch={matchFor ? null : onSeeMatch} />
                    </section>
                )}

                <section className="aycmp__own" aria-labelledby="aycmp-own-h">
                    <h2 id="aycmp-own-h" className="aycmp__h2">Add your own</h2>
                    <p>
                        {ecosystemList.length > 0
                            ? `Pick up to ${COMPARE_MAX} from your ${ecosystemList.length} saved or routine ${ecosystemList.length === 1 ? 'product' : 'products'}, or add any product from Explore.`
                            : 'Add products from Explore, or save products first and compare them here.'}
                    </p>
                    {ecosystemList.length > 0 && (
                        <>
                            <ul className="ay-group__rows aycmp__picks">
                                {ecosystemList.slice(0, 5).map((p) => (
                                    <li key={p.id}>
                                        <button type="button" className="ay-group__row ay-group__row--link" onClick={() => onAddToCompare(p)}>
                                            <span className="ay-group__value">Add {p.name} to comparison</span>
                                            <span className="ay-group__end" aria-hidden="true">+</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                            {ecosystemList.length > 5 && (
                                <span className="aycmp__more">+{ecosystemList.length - 5} more</span>
                            )}
                        </>
                    )}
                    <div className="aycmp__own-cta">
                        <StickerButton onClick={onBrowseProducts}>Go to Explore</StickerButton>
                        {!matchFor && onSeeMatch && <OutlineButton onClick={onSeeMatch}>See your match</OutlineButton>}
                    </div>
                </section>
            </div>
        );
    }

    const hasPads = compareList.some((p) => p.category === 'pad');
    const categories = [
        { key: 'category', label: 'Category' },
        { key: 'price', label: 'Price' },
        { key: 'effectiveness', label: hasPads ? 'Absorbency / flow' : 'How well it works' },
        { key: 'safety.fdaStatus', label: <GlossaryTerm term="FDA">FDA status</GlossaryTerm> },
        { key: 'safety.materials', label: 'Materials and ingredients' },
        { key: 'safety.recalls', label: hasPads ? <>Recalls / <GlossaryTerm term="PFAS">PFAS</GlossaryTerm></> : 'Recalls' },
        { key: 'doctorOpinion', label: 'Doctor’s opinion' },
        { key: 'badges', label: 'Badges' },
    ];

    const getVal = (obj, path) => {
        const parts = path.split('.');
        let current = obj;
        for (const part of parts) {
            if (current == null) return 'N/A';
            current = current[part];
        }
        if (Array.isArray(current)) return current.join(', ');
        return current || 'N/A';
    };

    const inCompareIds = new Set(compareList.map((p) => p.id));
    const moreFromEcosystem = ecosystemList.filter((p) => !inCompareIds.has(p.id));
    const canAddMore = compareList.length < COMPARE_MAX;

    return (
        <div className="ay-container aycmp">
            <InfoHero
                title="Side by side"
                crumb="Compare"
                lede={compareList.length < 2 ? 'Add one more product to see them side by side.' : 'Side by side, from what is on file. ayna never calls one product the best for everyone.'}
                onBack={onBack} backLabel="Your ecosystem" backHref="/you/ecosystem"
            >
                <button type="button" className="ay-btn ay-btn--text" onClick={onClear}>Clear all</button>
            </InfoHero>
            {canAddMore && (onBrowseProducts || onAddToCompare) && (
                <div className="aycmp__add">
                    <span>Add product:</span>
                    {onBrowseProducts && (
                        <button type="button" className="ay-btn ay-btn--secondary" onClick={onBrowseProducts}>
                            Browse products
                        </button>
                    )}
                    {onAddToCompare && moreFromEcosystem.length > 0 && (
                        <select
                            className="aycmp__select"
                            aria-label="Add a product from your Saved or routine"
                            value=""
                            onChange={(e) => {
                                const id = e.target.value;
                                if (!id) return;
                                const p = moreFromEcosystem.find((x) => x.id === id);
                                if (p) onAddToCompare(p);
                                e.target.value = '';
                            }}
                        >
                            <option value="">From your Saved or routine</option>
                            {moreFromEcosystem.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    )}
                </div>
            )}

            <h2 id="aycmp-table-h" className="sr-only">Comparison</h2>
            <CompareTable products={compareList} matchFor={matchFor} detailsFor={detailsFor} onOpen={onOpenProduct} onRemove={onRemove} variant="web" headingId="aycmp-table-h" onSeeMatch={onSeeMatch} />
            {/* The earlier table's fields (FDA status, doctor's opinion, badges...) stay one tap away. */}
            <details className="aycmp__more-details">
            <summary className="ay-btn ay-btn--text">More details</summary>
            <div className="aycmp__scroll" role="region" aria-label="More details table" tabIndex={0}>
                <table className="aycmp__table">
                    <thead>
                        <tr>
                            <td />
                            {compareList.map((p) => (
                                <th key={p.id} scope="col">
                                    <span className="aycmp__tile">
                                        <ProductTileImage
                                            product={p}
                                            alt={p.name}
                                            imgStyle={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                            letterNode={<ProductImageFallback />}
                                        />
                                    </span>
                                    <span className="aycmp__name">{p.name}</span>
                                    <button type="button" className="aycmp__remove" onClick={() => onRemove(p)} aria-label={`Remove ${p.name} from comparison`}>Remove</button>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map((cat) => (
                            <tr key={cat.key}>
                                <th scope="row">{cat.label}</th>
                                {compareList.map((p) => (
                                    <td key={`${p.id}-${cat.key}`}>
                                        {cat.key === 'category' ? (CATEGORY_LABELS[getVal(p, cat.key)] || getVal(p, cat.key))
                                            : cat.key === 'doctorOpinion' ? (
                                                <>
                                                    {getVal(p, cat.key)}
                                                    <span className="aycmp__src">
                                                        {p.clinicianOpinionSource === 'independent' ? '(Independent. Not brand-affiliated)' : p.clinicianOpinionSource === 'brand' ? '(Brand-affiliated)' : p.clinicianOpinionSource === 'mixed' ? '(Mixed: some sources brand-affiliated)' : ''}
                                                    </span>
                                                </>
                                            ) : getVal(p, cat.key)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            </details>

            <aside className="ay-group is-padded aycmp__tip" aria-labelledby="aycmp-tip-h">
                <h2 id="aycmp-tip-h" className="aycmp__tip-h">ayna’s tip</h2>
                <p>
                    When choosing between products, look closely at <strong>Materials and ingredients</strong> and the <strong>Doctor’s opinion</strong>.
                    A higher price often means more marketing, not better ingredients. Look for &quot;B-Corp&quot; or &quot;Sustainable&quot; badges. They can mean higher ethical standards.
                </p>
            </aside>
        </div>
    );
}
