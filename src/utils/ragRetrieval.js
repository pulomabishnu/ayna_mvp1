// RAG retrieval utility - Multi-HyDE inspired keyword + semantic overlap scoring
// Used by llm-recommendations and product-insights to ground Claude in clinical evidence

import {
  KNOWLEDGE_TEXT,
  CLINICAL_KNOWLEDGE,
  KNOWLEDGE_BY_CONDITION,
  KNOWLEDGE_BY_CONCERN,
} from '../data/knowledge/menstrualHealthKnowledge.js';

// Score a knowledge document against a query using keyword overlap + topic boost
function scoreDocument(query, docText) {
  const q = query.toLowerCase();
  const d = docText.toLowerCase();
  const qWords = q.split(/\s+/).filter((w) => w.length > 3);
  let score = 0;
  for (const word of qWords) {
    if (d.includes(word)) score += 1;
    if (d.slice(0, 80).includes(word)) score += 1; // topic/title boost
  }
  if (d.includes(q.slice(0, 25).toLowerCase())) score += 3; // phrase match boost
  return score;
}

// Generate multiple search angles from user intake - Multi-HyDE approach
function generateSearchAngles(intake = {}) {
  const angles = [];
  const concerns = Array.isArray(intake.primaryConcerns) ? intake.primaryConcerns : [];
  const conditions = Array.isArray(intake.conditions) ? intake.conditions : [];
  const symptoms = Array.isArray(intake.symptoms) ? intake.symptoms : [];
  const preferences = Array.isArray(intake.productPreferences) ? intake.productPreferences : [];

  // Angle 1: direct concerns
  if (concerns.length) angles.push(concerns.join(' '));

  // Angle 2: conditions
  if (conditions.length) angles.push(`${conditions.join(' ')} management treatment`);

  // Angle 3: symptoms
  if (symptoms.length) angles.push(`${symptoms.join(' ')} relief`);

  // Angle 4: safety angle if relevant preferences
  if (preferences.some((p) => /organic|fragrance|natural/i.test(p))) {
    angles.push('ingredient safety fragrance endocrine disruptors organic products');
  }

  // Angle 5: TTC safety angle
  if (intake.tryingToConceive === 'yes') {
    angles.push('prenatal supplements fertility conception safety');
  }

  // Angle 6: supplement safety if any supplement preference
  if ((intake.preferredProductTypes || []).includes('supplements')) {
    angles.push('supplement ingredient interactions safety');
  }

  return [...new Set(angles)].filter(Boolean).slice(0, 5);
}

// Retrieve top-k most relevant knowledge chunks for a given intake profile
export function retrieveKnowledgeForIntake(intake = {}, k = 8) {
  const conditions = Array.isArray(intake.conditions) ? intake.conditions : [];
  const concerns = Array.isArray(intake.primaryConcerns) ? intake.primaryConcerns : [];

  const scoreMap = new Map();

  // Priority 1: exact condition matches
  for (const cond of conditions) {
    const matches = KNOWLEDGE_BY_CONDITION[cond.toLowerCase()] || [];
    matches.forEach((item) => {
      const idx = CLINICAL_KNOWLEDGE.indexOf(item);
      scoreMap.set(idx, (scoreMap.get(idx) || 0) + 5);
    });
  }

  // Priority 2: concern matches
  for (const concern of concerns) {
    const key = concern.toLowerCase().slice(0, 20);
    const matchKey = Object.keys(KNOWLEDGE_BY_CONCERN).find((x) => x.includes(key) || key.includes(x.slice(0, 15)));
    if (matchKey) {
      const matches = KNOWLEDGE_BY_CONCERN[matchKey] || [];
      matches.forEach((item) => {
        const idx = CLINICAL_KNOWLEDGE.indexOf(item);
        scoreMap.set(idx, (scoreMap.get(idx) || 0) + 3);
      });
    }
  }

  // Priority 3: Multi-HyDE angle scoring
  const angles = generateSearchAngles(intake);
  for (const angle of angles) {
    KNOWLEDGE_TEXT.forEach((text, idx) => {
      const score = scoreDocument(angle, text);
      if (score > 0) scoreMap.set(idx, (scoreMap.get(idx) || 0) + score);
    });
  }

  const ranked = [...scoreMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, k)
    .map(([idx]) => KNOWLEDGE_TEXT[idx]);

  return ranked;
}

// Retrieve top-k knowledge chunks relevant to a specific product and user profile
export function retrieveKnowledgeForProduct(product = {}, intake = {}, k = 4) {
  const scoreMap = new Map();
  const conditions = Array.isArray(intake.conditions) ? intake.conditions : [];
  const productText = `${product.name || ''} ${product.category || ''} ${(product.tags || []).join(' ')} ${
    product.summary || ''
  }`.toLowerCase();

  // Condition-based retrieval
  for (const cond of conditions) {
    const matches = KNOWLEDGE_BY_CONDITION[cond.toLowerCase()] || [];
    matches.forEach((item) => {
      const idx = CLINICAL_KNOWLEDGE.indexOf(item);
      scoreMap.set(idx, (scoreMap.get(idx) || 0) + 4);
    });
  }

  // Product text scoring
  KNOWLEDGE_TEXT.forEach((text, idx) => {
    const score = scoreDocument(productText, text);
    if (score > 0) scoreMap.set(idx, (scoreMap.get(idx) || 0) + score);
  });

  // Always include ingredient safety for supplements and period products
  if (/supplement|vitamin|mineral|probiotic|period|pad|tampon|cup/i.test(productText)) {
    const safetyIdx = CLINICAL_KNOWLEDGE.findIndex((item) => item.topic.includes('ingredient safety'));
    if (safetyIdx >= 0) scoreMap.set(safetyIdx, (scoreMap.get(safetyIdx) || 0) + 3);
  }

  const ranked = [...scoreMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, k)
    .map(([idx]) => KNOWLEDGE_TEXT[idx]);

  return ranked;
}

// Build a formatted context string to inject into Claude prompts
export function buildKnowledgeContext(knowledgeChunks = []) {
  if (!knowledgeChunks.length) return '';
  return `CLINICAL KNOWLEDGE BASE (sourced from ACOG, NIH ODS, peer-reviewed evidence):
${knowledgeChunks.map((chunk, i) => `[${i + 1}] ${chunk}`).join('\n\n')}`;
}
