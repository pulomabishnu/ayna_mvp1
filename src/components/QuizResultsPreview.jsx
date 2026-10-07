import React, { useMemo } from 'react';
import ProductTileImage from './ProductTileImage';
import MatchGauge from './MatchGauge';
import {
  getRecommendations,
  getProfileMatchLabelsForProduct,
  getProfileMatchPercentForProduct,
} from '../data/products';
import './quizResultsPreview.css';

/**
 * Shown after Part 1 of the health quiz, before any account: real matches from
 * the answers so far, then the signup ask. Products, percentages and match
 * reasons all come from the same recommendation engine used elsewhere.
 */
export default function QuizResultsPreview({ results, healthProfile = null, onSaveMatches, onEditAnswers, onOpenProduct }) {
  const matches = useMemo(() => {
    const pool = getRecommendations(results || {}, healthProfile) || [];
    return pool
      .map((product) => ({
        product,
        percent: getProfileMatchPercentForProduct(product, results, healthProfile),
        reasons: getProfileMatchLabelsForProduct(product, results, healthProfile) || [],
      }))
      .filter((m) => Number.isFinite(m.percent) && m.percent >= 50)
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 6);
  }, [results, healthProfile]);

  const name = String(results?.firstName || results?.name || '').trim();
  const intake = results?.fullHealthIntake || {};
  const basedOn = [...(intake.supportSelections || []), ...(intake.avoidIngredients || [])]
    .filter((v) => v && !['Nothing right now', 'Something else', 'Other', 'No preference'].includes(v))
    .slice(0, 4);

  return (
    <main className="qrp" aria-labelledby="qrp-title">
      <div className="qrp__inner">
        <header className="qrp__head">
          <h1 id="qrp-title">{name ? `Your matches, ${name}` : 'Your matches'}</h1>
          <p className="qrp__intro">These are ranked from the answers you just gave us. You can see them before creating an account.</p>
          {basedOn.length > 0 && (
            <p className="qrp__based">
              Based on: {basedOn.join(', ')}.{' '}
              <button type="button" className="qrp__link" onClick={onEditAnswers}>Edit answers</button>
            </p>
          )}
        </header>

        {matches.length > 0 ? (
          <ul className="qrp__grid">
            {matches.map(({ product, percent, reasons }) => {
              const brand = product.brand || product.brandName || product.manufacturer || '';
              const reason = reasons.find(Boolean);
              return (
                <li key={product.id}>
                  <button type="button" className="qrp__item" onClick={() => onOpenProduct?.(product)}>
                    <span className="qrp__well">
                      <ProductTileImage product={product} alt="" imgStyle={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </span>
                    {brand && <span className="qrp__brand">{brand}</span>}
                    <span className="qrp__name">{product.name}</span>
                    <span className="qrp__price">{product.price || product.stage || 'See price at retailer'}</span>
                    <span className="qrp__match">
                      <MatchGauge percent={percent} size={18} theme="light" />
                      <strong>{Math.round(percent)}% match</strong>
                    </span>
                    {reason && <span className="qrp__reason">Matches: {reason}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="qrp__none">
            <strong>We need a little more to rank these well.</strong>
            <span>Edit your answers or save your progress and keep going.</span>
          </div>
        )}

        <section className="qrp__save" aria-labelledby="qrp-save">
          <h2 id="qrp-save">Save your matches</h2>
          <p>Create a free account to keep these, then answer a few more questions so we can improve safety checks and ranking.</p>
          <button type="button" className="qrp__cta" onClick={onSaveMatches}>Save matches &amp; refine</button>
        </section>
      </div>
    </main>
  );
}
