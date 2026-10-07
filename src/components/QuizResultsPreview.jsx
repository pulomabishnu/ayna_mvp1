import React, { useMemo } from 'react';
import ProductTileImage from './ProductTileImage';
import MatchGauge from './MatchGauge';
import { CATEGORY_LABELS, getRecommendations, getProfileMatchPercentForProduct } from '../data/products';
import './quizResultsPreview.css';

/**
 * Shown after Part 1 of the health quiz, before any account: real matches from
 * the answers so far, then the signup ask. Nothing here is invented — products
 * and percentages come from the same engine as the rest of the site.
 */
export default function QuizResultsPreview({ results, healthProfile = null, onSaveMatches, onEditAnswers, onOpenProduct }) {
  const matches = useMemo(() => {
    const pool = getRecommendations(results || {}, healthProfile) || [];
    return pool
      .map((product) => ({ product, percent: getProfileMatchPercentForProduct(product, results, healthProfile) }))
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
        <h1 id="qrp-title">{name ? `Your matches, ${name}` : 'Your matches'}</h1>
        {basedOn.length > 0 && (
          <p className="qrp__based">
            Based on: {basedOn.join(', ')}.{' '}
            <button type="button" className="qrp__link" onClick={onEditAnswers}>Edit answers</button>
          </p>
        )}

        {matches.length > 0 ? (
          <ul className="qrp__grid">
            {matches.map(({ product, percent }) => (
              <li key={product.id}>
                <button type="button" className="qrp__item" onClick={() => onOpenProduct?.(product)}>
                  <span className="qrp__well">
                    <ProductTileImage product={product} alt="" imgStyle={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </span>
                  <span className="qrp__cat">{CATEGORY_LABELS[product.category] || ''}</span>
                  <span className="qrp__name">{product.name}</span>
                  <span className="qrp__price">{product.price || product.stage || ''}</span>
                  <span className="qrp__match">
                    <MatchGauge percent={percent} size={22} theme="light" />
                    <strong>{Math.round(percent)}% match</strong>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="qrp__none">We need a few more answers to rank products for you. Save your answers and keep going — it sharpens fast.</p>
        )}

        <section className="qrp__save" aria-labelledby="qrp-save">
          <h2 id="qrp-save">Save your matches</h2>
          <p>Create a free account to keep these, then answer a few more questions so we can flag products that aren’t safe for you.</p>
          <button type="button" className="qrp__cta" onClick={onSaveMatches}>Save matches &amp; refine</button>
        </section>
      </div>
    </main>
  );
}
