import { describe, it, expect } from 'vitest';
import fs from 'node:fs';

// Signing in from /free-product must land back on /free-product, not My Ecosystem.
const app = fs.readFileSync(new URL('./App.jsx', import.meta.url), 'utf8');

describe('free product sign-in returns to the campaign', () => {
  it('the free product page asks for the free-product return', () => {
    const page = app.slice(app.indexOf('<FreeProductPage'), app.indexOf('/>', app.indexOf('<FreeProductPage')));
    expect(page).toMatch(/onSignIn=\{\(\) => \{ const back = currentView === 'free-product-reward' \? 'free-product-reward' : 'free-product'; setPendingAction\(back\); pendingActionRef\.current = back;/);
  });
  it('after sign-in that action opens the free product page', () => {
    expect(app).toMatch(/pendingAction === 'free-product'\) \{\s*setCurrentView\('free-product'\);/);
  });
  it('signing in from the spinner opens the spinner again', () => {
    expect(app).toMatch(/pendingAction === 'free-product-reward'\) \{\s*setCurrentView\('free-product-reward'\);/);
  });
  it('the action survives the Google/Apple redirect (stored before leaving)', () => {
    expect(app).toMatch(/if \(pendingAction\) sessionStorage\.setItem\('ayna_pending_auth_action', pendingAction\)/);
  });
});

describe('new people who take the quiz from /free-product', () => {
  it('the quiz button remembers to come back', () => {
    expect(app).toMatch(/onStartQuiz=\{\(\) => \{ markReturnToFreeProduct\(\); handleStartQuiz\(\); \}\}/);
  });
  it('closing their matches (after saving) opens the free product page', () => {
    expect(app).toMatch(/onClose=\{\(\) => \{ setShowWrapped\(false\); if \(user && takeReturnToFreeProduct\(\)\) setCurrentView\('free-product'\); \}\}/);
  });
});
