import React, { useState, useEffect, useMemo } from 'react';
import HealthDataImport from './HealthDataImport';
import CareNearYouPanel from './CareNearYouPanel';
import { getCheckinRecommendations, CATEGORY_LABELS } from '../data/products.js';
import ProductTileImage, { ProductImageFallback } from './ProductTileImage';
import { hasFlaggedRecall } from '../utils/productSafetyAlert';
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

export default function TrackedItems({ trackedProducts, joinedWaitlists, onViewWaitlist, userZipCode, onZipCodeChange, checkinData, quizResults, myProducts = {}, onOpenProduct, omittedProducts = {}, onViewOmitted, onHealthProfileUpdate, healthProfile = null, onEditHealthProfile }) {
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
    return (
        <section className="ay-container aytrk">
            <header className="aytrk__head">
                <h1 className="ay-h1">Your dashboard</h1>
                <p className="aytrk__lede">
                    Your products, health and wearable data, and care options, side by side.
                </p>
            </header>

            {/* Profile: Zip code for nearby stores */}
            <section className="aytrk__sec" aria-labelledby="aytrk-profile-h">
                <h2 id="aytrk-profile-h" className="ay-h2">Profile</h2>
                <p className="aytrk__line">
                    Add your zip code to see if nearby stores have these products in stock (in-store and online, when we have that data).
                </p>
                <div className="aytrk__zip">
                    <label className="sr-only" htmlFor="aytrk-zip">ZIP code</label>
                    <input
                        id="aytrk-zip"
                        type="text"
                        inputMode="numeric"
                        maxLength={5}
                        placeholder="ZIP code"
                        value={zipInput}
                        onChange={(e) => setZipInput(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    />
                    <button type="button" className="ay-btn ay-btn--primary" onClick={handleSaveZip}>
                        Save
                    </button>
                    {userZipCode && <span className="aytrk__saved">Saved: {userZipCode}</span>}
                </div>
            </section>

            <div className="aytrk__panel"><HealthDataImport onUpdate={onHealthProfileUpdate} /></div>

            <div className="aytrk__panel">
                <CareNearYouPanel
                    quizResults={quizResults}
                    healthProfile={healthProfile}
                    userZipCode={userZipCode}
                    onZipCodeChange={onZipCodeChange}
                    onOpenProduct={onOpenProduct}
                    onEditHealthProfile={onEditHealthProfile}
                    compact
                />
            </div>

            {/* Recommendations from your check-in. Always visible under account when check-in was done */}
            {checkinRecs.length > 0 && (
                <section className="aytrk__sec" aria-labelledby="aytrk-recs-h">
                    <h2 id="aytrk-recs-h" className="ay-h2">Recommendations from your check-in</h2>
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
                                                {inEcosystem && ' · In your ecosystem'}
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

            {/* Hidden (omitted) products */}
            <section className="aytrk__sec" aria-labelledby="aytrk-hidden-h">
                <h2 id="aytrk-hidden-h" className="ay-h2">Hidden products{hiddenCount > 0 && <span className="aytrk__count"> {hiddenCount}</span>}</h2>
                <p className="aytrk__line">
                    Products you chose to hide won&apos;t appear in Search or Recommendations. You can view and restore them anytime.
                </p>
                {onViewOmitted && (
                    <button type="button" className="ay-btn ay-btn--secondary" onClick={onViewOmitted}>
                        {hiddenCount > 0 ? `View hidden products (${hiddenCount})` : 'View hidden products'}
                    </button>
                )}
            </section>

            {totalItems === 0 ? (
                <section className="aytrk__sec ay-group is-padded aytrk__empty">
                    <h2 className="ay-h3">Nothing tracked yet.</h2>
                    <p>Take the quiz to get recommendations you can track, or join startup waitlists to save your spot.</p>
                </section>
            ) : (
                <>
                    {/* Safety Tracked Products */}
                    {trackedList.length > 0 && (
                        <section className="aytrk__sec" aria-labelledby="aytrk-tracked-h">
                            <h2 id="aytrk-tracked-h" className="ay-h2">Safety recall monitoring <span className="aytrk__count">{trackedList.length}</span></h2>
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
                                        {hasFlaggedRecall(product.safety?.recalls)
                                            ? <span className="ay-group__end aytrk__status is-recall"><i aria-hidden="true" />Recall on file</span>
                                            : <span className="ay-group__end aytrk__status"><i aria-hidden="true" />No recall on file</span>}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {/* Joined Waitlists */}
                    {joinedList.length > 0 && (
                        <section className="aytrk__sec" aria-labelledby="aytrk-wait-h">
                            <h2 id="aytrk-wait-h" className="ay-h2">Waitlists joined <span className="aytrk__count">{joinedList.length}</span></h2>
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
        </section>
    );
}
