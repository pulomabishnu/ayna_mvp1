import React, { useState, useEffect, useMemo } from 'react';
import BackLink from './nav/BackLink.jsx';
import HealthDataImport from './HealthDataImport';
import CareNearYouPanel from './CareNearYouPanel';
import '../styles/unique-b.css';
import { getCheckinRecommendations, CATEGORY_LABELS } from '../data/products.js';
import ProductTileImage, { ProductImageFallback } from './ProductTileImage';
import { hasFlaggedRecall } from '../utils/productSafetyAlert';
import { StatusPill } from './ui/ay';
import '../styles/compare-page.css';

function ImgOrInitial({ item, size }) {
    return (
        <ProductTileImage
            product={item}
            alt={item?.name || ''}
            imgStyle={{ width: '100%', height: '100%', objectFit: 'cover' }}
            letterNode={<ProductImageFallback compact={size < 60} />}
        />
    );
}

export default function TrackedItems({ onBack = null, trackedProducts, joinedWaitlists, onViewWaitlist, userZipCode, onZipCodeChange, checkinData, quizResults, myProducts = {}, onOpenProduct, omittedProducts = {}, onViewOmitted, onHealthProfileUpdate, healthProfile = null, onEditHealthProfile }) {
    const trackedList = Object.values(trackedProducts);
    const joinedList = Object.values(joinedWaitlists);
    const totalItems = trackedList.length + joinedList.length;
    const [zipInput, setZipInput] = useState(userZipCode || '');
    useEffect(() => { setZipInput(userZipCode || ''); }, [userZipCode]);

    const checkinRecs = useMemo(
        () => (checkinData && (checkinData.focusAreas?.length > 0 || checkinData.howIsRoutine))
            ? getCheckinRecommendations(quizResults || {}, checkinData, [], [])
            : [],
        [checkinData, quizResults]
    );

    const handleSaveZip = () => {
        const z = zipInput.replace(/\D/g, '').slice(0, 5);
        setZipInput(z);
        onZipCodeChange?.(z);
    };

    const hiddenCount = Object.keys(omittedProducts).length;
    const [zipEditing, setZipEditing] = useState(false);
    const chev = <svg className="wy-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>;
    return (
        <section className="ay-container aytrk">
            <header className="aytrk__head">
                {onBack && <BackLink label="You" href="/you" onClick={onBack} />}
                <h1 className="ay-h1">Tracked products</h1>
                <p className="aytrk__lede">
                    Your products, health and wearable data, and care options, side by side.
                </p>
            </header>

            <div className="aytrk__grid">
            <div className="aytrk__col">
            {totalItems === 0 ? (
                <section className="aytrk__sec" aria-labelledby="aytrk-empty-h">
                    <h2 id="aytrk-empty-h" className="ay-group__title">Safety recall monitoring</h2>
                    <div className="ay-group is-padded aytrk__empty">
                        <h3 className="ay-h3">Nothing tracked yet.</h3>
                        <p>Take the quiz to get recommendations you can track, or join startup waitlists to save your spot.</p>
                    </div>
                </section>
            ) : (
                <>
                    {/* Safety Tracked Products */}
                    {trackedList.length > 0 && (
                        <section className="aytrk__sec" aria-labelledby="aytrk-tracked-h">
                            <div className="wy-sec__head"><h2 id="aytrk-tracked-h" className="ay-group__title">Safety recall monitoring</h2><span className="wy-count">{trackedList.length} tracked</span></div>
                            <p className="aytrk__line">
                                We&apos;ll notify you right away if these products have safety issues or get recalled.
                            </p>
                            <ul className="ay-group ay-group__rows aytrk__rows">
                                {trackedList.map((product) => (
                                    <li key={product.id} className="ay-group__row aytrk__row">
                                        <span className="aytrk__thumb"><ImgOrInitial item={product} size={56} /></span>
                                        <span className="ay-group__text">
                                            <span className="ay-group__label">Active tracking{product.outOfBusiness && ' · No longer sold'}</span>
                                            <span className="ay-group__value">{product.name}</span>
                                            <span className="ay-group__note">{product.type}</span>
                                        </span>
                                        {/* Says only what was checked: the recall notes on file for this product. */}
                                        <span className="ay-group__end">{hasFlaggedRecall(product.safety?.recalls)
                                            ? <StatusPill tone="ink">Recall on file</StatusPill>
                                            : <StatusPill>No recall on file</StatusPill>}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {/* Joined Waitlists */}
                    {joinedList.length > 0 && (
                        <section className="aytrk__sec" aria-labelledby="aytrk-wait-h">
                            <div className="wy-sec__head"><h2 id="aytrk-wait-h" className="ay-group__title">Waitlists joined</h2><span className="wy-count">{joinedList.length}</span></div>
                            <p className="aytrk__line">
                                You&apos;re on the list. We&apos;ll email you when these products launch.
                            </p>
                            <ul className="ay-group ay-group__rows aytrk__rows">
                                {joinedList.map((startup) => (
                                    <li key={startup.id} className="ay-group__row aytrk__row">
                                        <span className="aytrk__thumb"><ImgOrInitial item={startup} size={56} /></span>
                                        <span className="ay-group__text">
                                            <span className="ay-group__label">Early access</span>
                                            <span className="ay-group__value">{startup.name}</span>
                                            <span className="ay-group__note">{startup.tagline}</span>
                                        </span>
                                        <button type="button" className="ay-btn ay-btn--secondary aytrk__view" onClick={onViewWaitlist}>View</button>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </>
            )}

            {/* Recommendations from your check-in. Always visible under account when check-in was done */}
            {checkinRecs.length > 0 && (
                <section className="aytrk__sec" aria-labelledby="aytrk-recs-h">
                    <h2 id="aytrk-recs-h" className="ay-group__title">Recommendations from your check-in</h2>
                    <p className="aytrk__line">
                        These match your latest check-in and tracker data. Not sure if you did a check-in? You can always see your latest recommendations here. Each product links to the same listing in Search.
                    </p>
                    <ul className="ay-group ay-group__rows aytrk__rows">
                        {checkinRecs.map(({ product, reason }) => {
                            const inEcosystem = myProducts && myProducts[product.id];
                            return (
                                <li key={product.id}>
                                    <button type="button" className="ay-group__row ay-group__row--link aytrk__row" onClick={() => onOpenProduct?.(product)} disabled={!onOpenProduct}>
                                        <span className="aytrk__thumb"><ImgOrInitial item={product} size={56} /></span>
                                        <span className="ay-group__text">
                                            <span className="ay-group__label">
                                                {CATEGORY_LABELS[product.category] || product.category}
                                                {product.outOfBusiness && ' · No longer sold'}
                                                {inEcosystem && ' · In your routine'}
                                            </span>
                                            <span className="ay-group__value">{product.name}</span>
                                            <span className="ay-group__note">{reason}</span>
                                        </span>
                                        {onOpenProduct && <span className="ay-group__end">View →</span>}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            )}

            {/* Hidden (omitted) products: one Settings-style row. */}
            <section className="aytrk__sec" aria-labelledby="aytrk-hidden-h">
                <h2 id="aytrk-hidden-h" className="ay-group__title">Hidden products</h2>
                <ul className="ay-group wy-rows">
                    <li>
                        {onViewOmitted ? (
                            <button type="button" className="ay-group__row ay-group__row--link wy-row" onClick={onViewOmitted}>
                                <span className="ay-group__text"><span className="ay-group__value">{hiddenCount > 0 ? `View hidden products (${hiddenCount})` : 'View hidden products'}</span><span className="ay-group__note aytrk__note">Products you chose to hide won&apos;t appear in Search or Recommendations. You can view and restore them anytime.</span></span>
                                <span className="ay-group__end">{chev}</span>
                            </button>
                        ) : (
                            <div className="ay-group__row wy-row"><span className="ay-group__text"><span className="ay-group__note aytrk__note">Products you chose to hide won&apos;t appear in Search or Recommendations. You can view and restore them anytime.</span></span></div>
                        )}
                    </li>
                </ul>
            </section>
            <section className="aytrk__sec" aria-labelledby="aytrk-care-h">
                {/* Glance first (founder Oct 26 16:54): one line, the full care list one tap away. ZIP lives in Your details only. */}
                <details className="ub-fold">
                    <summary>
                        <span className="ub-fold__text">
                            <h2 id="aytrk-care-h" className="ay-group__title">Care near you</h2>
                            <span className="ub-fold__line">Clinics, Planned Parenthood and virtual care for your answers{userZipCode ? `, near ${String(userZipCode).slice(0, 5)}` : ''}.</span>
                        </span>
                        <span className="ub-fold__go"><span className="ub-fold__show">Show</span><span className="ub-fold__hide">Hide</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg></span>
                    </summary>
                    <div className="aytrk__panel">
                        <CareNearYouPanel
                            quizResults={quizResults}
                            healthProfile={healthProfile}
                            userZipCode={userZipCode}
                            onZipCodeChange={onZipCodeChange}
                            onOpenProduct={onOpenProduct}
                            onEditHealthProfile={onEditHealthProfile}
                            compact
                            zipField={false}
                        />
                    </div>
                </details>
            </section>
            </div>

            <div className="aytrk__col">
            {/* Your details: the same label / value rows and fields as Settings. */}
            <section className="aytrk__sec" aria-labelledby="aytrk-profile-h">
                <h2 id="aytrk-profile-h" className="ay-group__title">Your details</h2>
                <div className="ay-group wy-rows">
                    {zipEditing ? (
                        <form className="ay-group__row wy-row wy-form" onSubmit={(e) => { e.preventDefault(); handleSaveZip(); setZipEditing(false); }}>
                            <label className="ay-group__text">
                                <span className="ay-group__label">ZIP code</span>
                                <input
                                    id="aytrk-zip"
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={5}
                                    placeholder="ZIP code"
                                    autoFocus
                                    value={zipInput}
                                    onChange={(e) => setZipInput(e.target.value.replace(/\D/g, '').slice(0, 5))}
                                />
                            </label>
                            <span className="ay-group__end"><button type="submit" className="ct-link">Save</button></span>
                        </form>
                    ) : (
                        <div className="ay-group__row wy-row">
                            <span className="ay-group__text">
                                <span className="ay-group__label">ZIP code</span>
                                <span className="ay-group__value">{userZipCode ? `Saved: ${userZipCode}` : 'Not set'}</span>
                                <span className="ay-group__note aytrk__note">Add your zip code to see if nearby stores have these products in stock (in-store and online, when we have that data).</span>
                            </span>
                            <span className="ay-group__end"><button type="button" className="ct-link" onClick={() => setZipEditing(true)}>{userZipCode ? 'Edit' : 'Add'}</button></span>
                        </div>
                    )}
                </div>
            </section>

            <section className="aytrk__sec" aria-labelledby="aytrk-import-h">
                <h2 id="aytrk-import-h" className="ay-group__title">Health data</h2>
                <details className="aytrk__more">
                    <summary>Add a file or your own notes</summary>
                    <div className="aytrk__panel"><HealthDataImport onUpdate={onHealthProfileUpdate} /></div>
                </details>
            </section>

            </div>
            </div>
        </section>
    );
}
