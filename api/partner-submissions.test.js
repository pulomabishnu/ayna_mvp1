/* global Buffer */
import { describe, it, expect } from 'vitest';
import { validateSubmission } from './partner-submissions.js';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64').toString('base64');

describe('validateSubmission', () => {
  it('needs a brand and an action', () => {
    expect(validateSubmission({ body: 'hi' }).error).toBe('brand_and_action_required');
  });
  it('rejects empty responses', () => {
    expect(validateSubmission({ brand: 'BUNI', actionId: 'a1' }).error).toBe('empty');
  });
  it('keeps text, real links and allowed files', () => {
    const v = validateSubmission({ brand: 'BUNI', actionId: 'a1', body: ' Sent the list ', links: ['buni.com/ingredients', 'not a link'], files: [{ name: 'shot.png', type: 'image/png', data: png }] });
    expect(v.body).toBe('Sent the list');
    expect(v.links).toEqual(['https://buni.com/ingredients']);
    expect(v.files[0]).toMatchObject({ name: 'shot.png', type: 'image/png' });
  });
  it('rejects files that are not documents or images', () => {
    const v = validateSubmission({ brand: 'BUNI', actionId: 'a1', files: [{ name: 'x.exe', type: 'application/x-msdownload', data: png }] });
    expect(v.error).toBe('file_rejected');
  });
});
