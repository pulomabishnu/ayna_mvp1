import { describe, expect, it } from 'vitest';
import { buildAiHealthContext } from './aiHealthContext.js';

describe('buildAiHealthContext', () => {
  const intake = {
    age: 22,
    name: 'A Person',
    email: 'person@example.com',
    phone: '+12125551212',
    user_id: 'uuid',
    location: '10001',
    insuranceType: 'PPO',
    fsaHsa: 'FSA',
    conditions: ['PCOS'],
    symptoms: ['bloating'],
    primaryConcerns: ['Hormonal bloating'],
    productPreferences: ['Fragrance-free'],
    currentMedications: 'metformin',
    pregnancyStatus: 'not pregnant',
  };

  it('never includes contact, account, location or financial identifiers', () => {
    const context = buildAiHealthContext(intake, 'Is this product good for bloating?');
    expect(context).toMatchObject({ ageRange: '18-24', conditions: ['PCOS'], symptoms: ['bloating'] });
    expect(JSON.stringify(context)).not.toContain('person@example.com');
    expect(JSON.stringify(context)).not.toContain('+12125551212');
    expect(JSON.stringify(context)).not.toContain('10001');
    expect(JSON.stringify(context)).not.toContain('PPO');
    expect(JSON.stringify(context)).not.toContain('FSA');
    expect(JSON.stringify(context)).not.toContain('uuid');
    expect(context.currentMedications).toBeUndefined();
  });

  it('adds medication context only when the question makes it relevant', () => {
    const context = buildAiHealthContext(intake, 'Does this interact with my medication?');
    expect(context.currentMedications).toBe('metformin');
  });

  it('adds pregnancy context only when relevant', () => {
    const context = buildAiHealthContext(intake, 'Is this safe during pregnancy?');
    expect(context.pregnancyStatus).toBe('not pregnant');
  });
});
