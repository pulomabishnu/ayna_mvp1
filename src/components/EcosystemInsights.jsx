import React, { useCallback, useMemo, useState } from 'react';
import { ALL_PRODUCTS, CATEGORY_LABELS } from '../data/products';
import {
  FIELD_LABELS,
  ROUTINE_BUCKETS,
  ROUTINE_BUCKET_LABELS,
  getBlindSpots,
  getBrandAffinity,
  getSafetyAlerts,
  getValueAffinity,
  groupByRoutine,
  loadDismissedAlerts,
  loadRoutine,
  saveDismissedAlerts,
  saveRoutine,
  toProductList,
  toggleRoutineBucket,
} from '../utils/shopperInsights';
import './ecosystemInsights.css';

/**
 * Shopper-profile insights for My Ecosystem (ported from the mobile app's
 * Shopper Profile screen). Everything shown is derived from data already on
 * file: the person's ecosystem products, their intake answers, their health
 * profile, and the catalog's own text. See src/utils/shopperInsights.js for
 * the rules, in particular that safety alerts only quote catalog text that
 * matches something the person told us.
 *
 * Props:
 *   myProducts        id → product (as MyEcosystem receives it)
 *   quizResults       legacy quiz profile (fullHealthIntake inside)
 *   healthProfile     imported/manual health profile (allergies)
 *   onOpenProduct     (product) => void
 *   onViewAlternative optional (product) => void — shows "See swap"
 *   onExploreCategory optional (category) => void — shows "Explore"
 *   allProducts       optional catalog override (defaults to ALL_PRODUCTS)
 */

const ROUTINE_PREVIEW = 6;

function alertBadge(alert) {
  if (alert.kind === 'recall') return { text: 'Safety note on file', tone: 'note' };
  if (alert.sensitivity.source === 'allergy') return { text: 'Matches an allergy you listed', tone: 'alert' };
  return { text: 'Something you asked to avoid', tone: 'watch' };
}

function SafetyAlerts({ alerts, dismissed, onDismiss, onRestoreAll, onOpenProduct, onViewAlternative }) {
  const active = alerts.filter((a) => !dismissed.includes(a.id));
  const dismissedCount = alerts.length - active.length;

  return (
    <section className="eco-ins__section" aria-labelledby="eco-ins-safety">
      <div className="eco-ins__section-head">
        <h3 id="eco-ins-safety">Safety alerts across your ecosystem</h3>
        <span className="eco-ins__count">{active.length} active</span>
      </div>

      {active.length === 0 ? (
        <p className="eco-ins__empty">
          Nothing to flag. We check each product&apos;s listed ingredients against the allergies and
          avoid-list from your profile, and surface any safety note already on file.
        </p>
      ) : (
        <ul className="eco-ins__alerts">
          {active.map((alert) => {
            const badge = alertBadge(alert);
            return (
              <li key={alert.id} className={`eco-ins__alert eco-ins__alert--${badge.tone}`}>
                <span className="eco-ins__badge">{badge.text}</span>
                <p className="eco-ins__alert-title">
                  {alert.kind === 'recall'
                    ? alert.product.name
                    : <>{alert.product.name} lists <strong>{alert.sensitivity.label.toLowerCase()}</strong></>}
                </p>
                {alert.kind === 'recall' ? (
                  <p className="eco-ins__quote">{alert.text}</p>
                ) : (
                  <>
                    {alert.matches.map((m) => (
                      <p key={m.field} className="eco-ins__quote">
                        <span className="eco-ins__quote-label">{FIELD_LABELS[m.field] || m.field}:</span> &ldquo;{m.snippet}&rdquo;
                      </p>
                    ))}
                    <p className="eco-ins__fine">From the product&apos;s listing. Check the label on the exact version you use.</p>
                  </>
                )}
                <div className="eco-ins__actions">
                  {typeof onOpenProduct === 'function' && (
                    <button type="button" className="eco-ins__btn eco-ins__btn--ghost" onClick={() => onOpenProduct(alert.product)}>View product</button>
                  )}
                  {typeof onViewAlternative === 'function' && (
                    <button type="button" className="eco-ins__btn eco-ins__btn--solid" onClick={() => onViewAlternative(alert.product)}>See swap</button>
                  )}
                  <button type="button" className="eco-ins__btn eco-ins__btn--text" onClick={() => onDismiss(alert.id)}>Dismiss</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {dismissedCount > 0 && (
        <p className="eco-ins__dismissed">
          {dismissedCount} dismissed ·{' '}
          <button type="button" className="eco-ins__link" onClick={onRestoreAll}>Show again</button>
        </p>
      )}
    </section>
  );
}

function Routine({ products, routine, onToggle, onOpenProduct }) {
  const [showAll, setShowAll] = useState(false);
  const { groups, unsorted } = useMemo(() => groupByRoutine(products, routine), [products, routine]);
  const sortedCount = products.length - unsorted.length;
  // Unsorted first so the next thing to do is at the top.
  const ordered = useMemo(() => [...unsorted, ...ROUTINE_BUCKETS.flatMap((b) => groups[b])], [groups, unsorted]);
  const visible = showAll ? ordered : ordered.slice(0, ROUTINE_PREVIEW);
  const filledBuckets = ROUTINE_BUCKETS.filter((b) => groups[b].length);

  return (
    <section className="eco-ins__section" aria-labelledby="eco-ins-routine">
      <div className="eco-ins__section-head">
        <h3 id="eco-ins-routine">Your routine</h3>
        <span className="eco-ins__count">{sortedCount} of {products.length} sorted</span>
      </div>
      <p className="eco-ins__lede">Tap when you use each product. Tap again to clear. Saved on this device.</p>

      {filledBuckets.length > 0 && (
        <dl className="eco-ins__routine-summary">
          {filledBuckets.map((b) => (
            <div key={b} className="eco-ins__routine-summary-row">
              <dt>{ROUTINE_BUCKET_LABELS[b]}</dt>
              <dd>{groups[b].map((p) => p.name).join(' · ')}</dd>
            </div>
          ))}
        </dl>
      )}

      <ul className="eco-ins__routine">
        {visible.map((p) => (
          <li key={p.id} className="eco-ins__routine-row">
            {typeof onOpenProduct === 'function' ? (
              <button type="button" className="eco-ins__product-name" onClick={() => onOpenProduct(p)}>{p.name}</button>
            ) : (
              <span className="eco-ins__product-name">{p.name}</span>
            )}
            <div className="eco-ins__chips" role="group" aria-label={`When you use ${p.name}`}>
              {ROUTINE_BUCKETS.map((b) => {
                const on = routine[p.id] === b;
                return (
                  <button
                    key={b}
                    type="button"
                    className={`eco-ins__chip${on ? ' is-on' : ''}`}
                    aria-pressed={on}
                    onClick={() => onToggle(p.id, b)}
                  >
                    {ROUTINE_BUCKET_LABELS[b]}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ul>
      {ordered.length > ROUTINE_PREVIEW && (
        <button type="button" className="eco-ins__link eco-ins__more" onClick={() => setShowAll((v) => !v)}>
          {showAll ? 'Show fewer' : `Show all ${ordered.length}`}
        </button>
      )}
    </section>
  );
}

function BrandsAndValues({ brands, values, hasIntake }) {
  return (
    <section className="eco-ins__section" aria-labelledby="eco-ins-brands">
      <div className="eco-ins__section-head">
        <h3 id="eco-ins-brands">Brands you trust</h3>
      </div>
      {brands.length > 0 ? (
        <ul className="eco-ins__pills">
          {brands.map((b) => (
            <li key={b.brand} className={`eco-ins__pill${b.count > 1 ? ' is-strong' : ''}`}>
              {b.brand}{b.count > 1 && <span className="eco-ins__pill-n">×{b.count}</span>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="eco-ins__empty">No brand names on file for your ecosystem products yet.</p>
      )}
      {values.length > 0 ? (
        <>
          <p className="eco-ins__sublabel">What you said matters, in your ecosystem</p>
          <ul className="eco-ins__pills">
            {values.map((v) => (
              <li key={v.value} className={`eco-ins__pill${v.count === 0 ? ' is-empty' : ''}`}>
                {v.label}<span className="eco-ins__pill-n">{v.count} of {v.total}</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        !hasIntake && <p className="eco-ins__fine">Finish your profile to see how your products line up with what matters to you.</p>
      )}
    </section>
  );
}

function BlindSpots({ spots, onExploreCategory }) {
  if (!spots.length) return null;
  return (
    <section className="eco-ins__section" aria-labelledby="eco-ins-blind">
      <div className="eco-ins__section-head">
        <h3 id="eco-ins-blind">Blind spots</h3>
      </div>
      <p className="eco-ins__lede">Categories with nothing in your ecosystem yet.</p>
      <ul className="eco-ins__spots">
        {spots.map((s) => (
          <li key={s.category} className="eco-ins__spot">
            <span className="eco-ins__spot-text">
              <strong>{s.label}</strong>
              <small>{s.catalogCount} in the catalog</small>
            </span>
            {typeof onExploreCategory === 'function' && (
              <button type="button" className="eco-ins__btn eco-ins__btn--ghost" onClick={() => onExploreCategory(s.category)}>Explore</button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function EcosystemInsights({
  myProducts = {},
  quizResults = null,
  healthProfile = null,
  onOpenProduct,
  onViewAlternative,
  onExploreCategory,
  allProducts = ALL_PRODUCTS,
}) {
  const products = useMemo(() => toProductList(myProducts), [myProducts]);
  const [routine, setRoutine] = useState(loadRoutine);
  const [dismissed, setDismissed] = useState(loadDismissedAlerts);

  const alerts = useMemo(() => getSafetyAlerts(products, quizResults, healthProfile), [products, quizResults, healthProfile]);
  const brands = useMemo(() => getBrandAffinity(products), [products]);
  const values = useMemo(() => getValueAffinity(products, quizResults), [products, quizResults]);
  const spots = useMemo(() => getBlindSpots(products, allProducts, { labels: CATEGORY_LABELS }), [products, allProducts]);

  const toggleBucket = useCallback((productId, bucket) => {
    setRoutine((prev) => {
      const next = toggleRoutineBucket(prev, productId, bucket);
      saveRoutine(next);
      return next;
    });
  }, []);

  const dismiss = useCallback((id) => {
    setDismissed((prev) => {
      const next = [...prev, id];
      saveDismissedAlerts(next);
      return next;
    });
  }, []);

  const restoreAll = useCallback(() => {
    // Only un-dismiss alerts that are still live; ids for alerts that no
    // longer apply stay put (harmless, and capped in storage).
    const live = new Set(alerts.map((a) => a.id));
    setDismissed((prev) => {
      const next = prev.filter((id) => !live.has(id));
      saveDismissedAlerts(next);
      return next;
    });
  }, [alerts]);

  if (!products.length) return null;

  return (
    <div className="eco-ins">
      <div className="eco-ins__head">
        <span className="eco-ins__eyebrow">Shopper profile</span>
        <h2>Your insights</h2>
      </div>
      <SafetyAlerts
        alerts={alerts}
        dismissed={dismissed}
        onDismiss={dismiss}
        onRestoreAll={restoreAll}
        onOpenProduct={onOpenProduct}
        onViewAlternative={onViewAlternative}
      />
      <Routine products={products} routine={routine} onToggle={toggleBucket} onOpenProduct={onOpenProduct} />
      <BrandsAndValues brands={brands} values={values} hasIntake={!!quizResults?.fullHealthIntake} />
      <BlindSpots spots={spots} onExploreCategory={onExploreCategory} />
    </div>
  );
}
