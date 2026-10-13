import { describe, it, expect } from 'vitest';
import { extractFreeText, summarizeFreeText } from './freeText.js';
import { buildUserProfile } from './userProfile.js';

const field = (ex, name) => ex.items.filter((i) => i.field === name);

describe('free text extraction', () => {
  it('extracts the spec example with confidence levels', () => {
    const ex = extractFreeText('I hate swallowing pills. My budget is under $40. I have sensitive skin. I love Rael pads.', { knownNames: ['Rael Organic Cotton Pads', 'Rael'] });
    expect(field(ex, 'format_dislikes')[0]).toMatchObject({ value: ['pill_capsule'], confidence: 'HIGH', source: 'user_free_text' });
    expect(field(ex, 'max_price')[0]).toMatchObject({ value: 40, confidence: 'HIGH' });
    expect(field(ex, 'sensitivities')[0]).toMatchObject({ value: ['sensitive_skin'], confidence: 'HIGH' });
    expect(field(ex, 'inferred_preferences')[0]).toMatchObject({ value: ['irritation_avoidance'], confidence: 'MEDIUM' });
    expect(field(ex, 'positive_product_history')[0].value).toMatch(/^rael pads/);
    const s = summarizeFreeText(ex);
    expect(s.format_dislikes[0]).toMatchObject({ id: 'pill_capsule', weight: 1 });
    expect(s.max_price).toEqual({ value: 40, weight: 1 });
  });

  it('"some creams make me itch" is reaction history with an unknown trigger, never an allergy', () => {
    const ex = extractFreeText('Some creams make me itch');
    const r = field(ex, 'topical_reaction_history')[0];
    expect(r.value).toMatchObject({ reaction_type: 'itching', trigger: 'unknown_trigger', ingredient_blamed: null });
    expect(r.safety_exclusion).toBe(false);
    expect(field(ex, 'explicit_allergy')).toHaveLength(0);
  });

  it('"burned my skin" -> irritation/burning on skin with no ingredient blame', () => {
    const ex = extractFreeText('That wash burned my skin');
    const r = ex.items.find((i) => /reaction_history/.test(i.field));
    expect(r.value).toMatchObject({ reaction_type: 'irritation_burning', body_area: 'skin', ingredient_blamed: null });
  });

  it('an explicit first-person allergy statement is HIGH; a vague one is LOW', () => {
    expect(field(extractFreeText("I'm allergic to latex"), 'explicit_allergy')[0]).toMatchObject({ value: 'latex', confidence: 'HIGH' });
    expect(field(extractFreeText("I'm allergic to some stuff"), 'allergy_mention_unresolved')[0].confidence).toBe('LOW');
  });

  it('LOW items are stored only', () => {
    const s = summarizeFreeText(extractFreeText('I want to feel like myself again. My hormones are insane.'));
    expect(s.stored.length).toBeGreaterThan(0);
    expect(s.mentioned_needs).toHaveLength(0);
    expect(s.format_dislikes).toHaveLength(0);
  });

  it('free text never creates a hard safety exclusion from a guess', () => {
    const up = buildUserProfile({ anythingElse: 'Some creams make me itch and pads gave me a rash' });
    expect(up.safety.allergies).toHaveLength(0);
    expect(up.safety.leaveOut).toHaveLength(0);
    expect(up.safety.reactionHistory.length).toBeGreaterThan(0);
  });

  it('a mentioned need with HIGH confidence becomes a free-text need', () => {
    const up = buildUserProfile({ anythingElse: 'my hair is falling out' });
    expect(up.healthIntent.needs.map((n) => n.id)).toContain('hair.loss');
    expect(up.healthIntent.needs.find((n) => n.id === 'hair.loss').source).toBe('free_text');
  });

  it('prose leave-outs are cosmetic (penalty, not a filter)', () => {
    const s = summarizeFreeText(extractFreeText('I prefer not fragrance if possible'));
    expect(s.leave_out[0]).toMatchObject({ attr: 'fragrance', strength: 'cosmetic' });
  });
});
