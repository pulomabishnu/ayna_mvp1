import React, { useEffect, useMemo, useState } from 'react';
import { ALL_PRODUCTS, CATEGORY_LABELS } from '../data/products';
import ProductTileImage, { ProductImageFallback } from './ProductTileImage';
import '../daintyAyna.css';

const AYNA_APPEARANCE_KEY = 'ayna_appearance_v1';
const AYNA_QUIZ_THEME_KEY = 'ayna_quiz_theme_v1';

function resolveGlobalAppearance(mode) {
  if (mode === 'light' || mode === 'dark') return mode;
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyGlobalAppearance(mode) {
  if (typeof document === 'undefined') return;
  const safeMode = ['light', 'dark', 'system'].includes(mode) ? mode : 'system';
  document.documentElement.dataset.aynaAppearance = safeMode;
  document.documentElement.dataset.aynaTheme = resolveGlobalAppearance(safeMode);
}

function installAynaAppearanceBridge() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__aynaAppearanceBridgeInstalled) return;
  window.__aynaAppearanceBridgeInstalled = true;

  let mode = 'system';
  try { mode = localStorage.getItem(AYNA_APPEARANCE_KEY) || 'system'; } catch (_) {}
  applyGlobalAppearance(mode);

  window.__aynaSetAppearance = (nextMode) => {
    const safeMode = ['light', 'dark', 'system'].includes(nextMode) ? nextMode : 'system';
    try { localStorage.setItem(AYNA_APPEARANCE_KEY, safeMode); } catch (_) {}
    applyGlobalAppearance(safeMode);
    window.dispatchEvent(new CustomEvent('ayna:appearance', { detail: { mode: safeMode } }));
  };

  const media = window.matchMedia?.('(prefers-color-scheme: dark)');
  media?.addEventListener?.('change', () => {
    let stored = 'system';
    try { stored = localStorage.getItem(AYNA_APPEARANCE_KEY) || 'system'; } catch (_) {}
    if (stored === 'system') applyGlobalAppearance('system');
  });

  const themeButton = document.createElement('button');
  themeButton.type = 'button';
  themeButton.className = 'dainty-quiz-theme-switch';
  themeButton.setAttribute('aria-label', 'Switch health intake appearance');
  themeButton.style.display = 'none';
  document.body.appendChild(themeButton);

  const updateQuizTheme = () => {
    const quizRoot = document.querySelector('.ayna-intake-root');
    if (!quizRoot) {
      themeButton.style.display = 'none';
      return;
    }
    themeButton.style.display = 'grid';
    let quizMode = 'light';
    try { quizMode = sessionStorage.getItem(AYNA_QUIZ_THEME_KEY) || 'light'; } catch (_) {}
    const dark = quizMode === 'dark';
    quizRoot.classList.toggle('dainty-quiz-dark', dark);
    themeButton.textContent = dark ? '☾' : '☀';
    themeButton.title = dark ? 'Dark intake mode' : 'Light intake mode';
  };

  themeButton.addEventListener('click', () => {
    const quizRoot = document.querySelector('.ayna-intake-root');
    if (!quizRoot) return;
    const next = quizRoot.classList.contains('dainty-quiz-dark') ? 'light' : 'dark';
    try { sessionStorage.setItem(AYNA_QUIZ_THEME_KEY, next); } catch (_) {}
    updateQuizTheme();
  });

  const enhanceAccountMenu = () => {
    const menu = document.querySelector('.nav-account-menu');
    if (!menu || menu.querySelector('.dainty-account-settings')) return;

    const panel = document.createElement('div');
    panel.className = 'dainty-account-settings';
    panel.innerHTML = `
      <div class="dainty-account-settings__title">appearance</div>
      <div class="dainty-account-settings__themes">
        <button type="button" data-mode="light">Light</button>
        <button type="button" data-mode="dark">Dark</button>
        <button type="button" data-mode="system">System</button>
      </div>
      <div class="dainty-account-settings__links">
        <a href="/profile">Health profile</a>
        <a href="/privacy-policy">Privacy + data</a>
      </div>
    `;

    const markSelected = () => {
      let current = 'system';
      try { current = localStorage.getItem(AYNA_APPEARANCE_KEY) || 'system'; } catch (_) {}
      panel.querySelectorAll('[data-mode]').forEach((button) => {
        button.classList.toggle('is-selected', button.dataset.mode === current);
      });
    };

    panel.querySelectorAll('[data-mode]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        window.__aynaSetAppearance?.(button.dataset.mode);
        markSelected();
      });
    });

    markSelected();
    menu.appendChild(panel);
  };

  const updatePresentationBridges = () => {
    updateQuizTheme();
    enhanceAccountMenu();
  };

  const observer = new MutationObserver(updatePresentationBridges);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.requestAnimationFrame(updatePresentationBridges);
}

installAynaAppearanceBridge();

const CARE_LINKS = [
  { label: 'Period care', query: 'period care', keywords: ['pad', 'tampon', 'menstrual', 'period'] },
  { label: 'PCOS', query: 'PCOS', keywords: ['pcos', 'inositol', 'spearmint'] },
  { label: 'Vaginal health', query: 'vaginal health', keywords: ['vaginal', 'intimate', 'bv', 'yeast'] },
  { label: 'UTI support', query: 'UTI support', keywords: ['uti', 'urinary', 'bladder'] },
  { label: 'Fertility', query: 'fertility', keywords: ['fertility', 'ovulation', 'conception'] },
  { label: 'Pelvic health', query: 'pelvic health', keywords: ['pelvic', 'kegel', 'floor'] },
];

function productText(product) {
  return [
    product?.name,
    product?.brand,
    product?.brandName,
    product?.category,
    product?.summary,
    product?.description,
    ...(Array.isArray(product?.tags) ? product.tags : []),
  ].filter(Boolean).join(' ').toLowerCase();
}

function firstName(user) {
  const meta = user?.user_metadata || {};
  const raw = meta.first_name || meta.firstName || meta.given_name || meta.full_name || meta.name || '';
  return String(raw).trim().split(/\s+/).filter(Boolean)[0] || '';
}

function discoveryTargetFor(text) {
  const query = String(text || '').trim();
  if (!query) return '';
  const lower = query.toLowerCase();
  if (lower.includes('pad')) return { query, initialCategory: 'pad' };
  if (lower.includes('tampon')) return { query, initialCategory: 'tampon' };
  if (lower.includes('cup')) return { query, initialCategory: 'cup' };
  if (lower.includes('pcos')) return { query, initialMacroGroup: 'hormones' };
  if (lower.includes('uti') || lower.includes('urinary')) return { query };
  if (lower.includes('fertil') || lower.includes('ovulation')) return { query, initialMacroGroup: 'fertility' };
  if (lower.includes('postpartum')) return { query, initialCategory: 'postpartum' };
  if (lower.includes('pregnan') || lower.includes('prenatal')) return { query, initialCategory: 'pregnancy' };
  if (lower.includes('pelvic')) return { query, initialMacroGroup: 'pelvic' };
  return query;
}

function uniqueProducts(products) {
  const seen = new Set();
  return products.filter((product) => {
    const key = product?.id || `${product?.brand || ''}:${product?.name || ''}`;
    if (!product?.name || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function productById(id) {
  return ALL_PRODUCTS.find((product) => product?.id === id) || null;
}

function ProductImage({ product, className = '' }) {
  return (
    <div className={`dainty-product-image ${className}`}>
      <ProductTileImage
        product={product}
        alt={product?.name || ''}
        imgStyle={{ width: '100%', height: '100%', objectFit: 'contain' }}
        letterNode={<ProductImageFallback />}
      />
    </div>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="6.5" y="10.5" width="11" height="8.5" rx="2" />
      <path d="M9 10.5V8a3 3 0 0 1 6 0v2.5" />
    </svg>
  );
}

export default function AynaLanding({
  onStartQuiz,
  onViewDiscovery,
  onOpenProduct,
  onViewEcosystem,
  user,
  myProducts,
  ecosystemCount = 0,
  recommendedProductIds = [],
}) {
  const [query, setQuery] = useState('');
  const [cabinetOpen, setCabinetOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setCabinetOpen(true), 120);
    return () => window.clearTimeout(timer);
  }, []);

  const catalogPool = useMemo(() => {
    const owned = Object.values(myProducts || {});
    const recommended = (recommendedProductIds || []).map(productById).filter(Boolean);
    return uniqueProducts([...owned, ...recommended, ...ALL_PRODUCTS]);
  }, [myProducts, recommendedProductIds]);

  const cabinetProducts = useMemo(() => {
    const withUsefulVisuals = catalogPool.filter((product) => product?.image || product?.imageUrl || product?.images?.length);
    const source = withUsefulVisuals.length >= 4 ? withUsefulVisuals : catalogPool;
    return source.slice(0, 4);
  }, [catalogPool]);

  const [selectedId, setSelectedId] = useState('');
  useEffect(() => {
    if (!selectedId && cabinetProducts[0]?.id) setSelectedId(cabinetProducts[0].id);
  }, [cabinetProducts, selectedId]);

  const selectedProduct = cabinetProducts.find((product) => product?.id === selectedId) || cabinetProducts[0] || null;
  const explicitSelectedScore = Number(selectedProduct?.matchPercentage ?? selectedProduct?.matchScore ?? selectedProduct?.score);
  const selectedScore = Number.isFinite(explicitSelectedScore)
    ? Math.max(1, Math.min(100, Math.round(explicitSelectedScore <= 1 ? explicitSelectedScore * 100 : explicitSelectedScore)))
    : null;
  const name = firstName(user);

  const categoryCards = useMemo(() => CARE_LINKS.map((care, index) => {
    const matches = catalogPool.filter((product) => care.keywords.some((keyword) => productText(product).includes(keyword)));
    const product = matches[(index + Math.floor(Math.random() * Math.max(matches.length, 1))) % Math.max(matches.length, 1)] || catalogPool[index] || null;
    return { ...care, product };
  }), [catalogPool]);

  const submitSearch = (event) => {
    event.preventDefault();
    if (!query.trim()) return;
    onViewDiscovery?.(discoveryTargetFor(query));
  };

  return (
    <main className="dainty-home">
      <section className="dainty-home__hero">
        <div className="dainty-kicker">personalized women&apos;s health</div>
        <h1>women&apos;s health, made for <em>you.</em></h1>
        <p>Find products, care, and support that make sense for your body, your goals, and your everyday life.</p>

        <form className="dainty-home-search" onSubmit={submitSearch}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16.4 16.4 4.1 4.1"/></svg>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products, brands, or health needs…" aria-label="Search Ayna" />
          <button type="submit" aria-label="Search">→</button>
        </form>

        <div className="dainty-home__quick-links">
          {['period care', 'PCOS', 'vaginal health', 'fertility'].map((label) => (
            <button key={label} type="button" onClick={() => onViewDiscovery?.(discoveryTargetFor(label))}>{label}</button>
          ))}
        </div>
      </section>

      <section className={`dainty-cabinet-section${user ? '' : ' is-locked'}`}>
        <div className="dainty-cabinet-copy">
          <div className="dainty-kicker">your health cabinet</div>
          <h2>{user ? <>hi, {name || 'there'}.<br/><em>made around you.</em></> : <>your health,<br/><em>made around you.</em></>}</h2>
          <p>A small shelf of personalized picks, built around your health profile and preferences.</p>
          <button type="button" className="dainty-outline-button" onClick={user ? onStartQuiz : onViewEcosystem}>
            {user ? 'edit my preferences' : 'see how it works'} →
          </button>
          <span className="dainty-hand-note">less guessing,<br/>more you ♡</span>
        </div>

        <div className={`dainty-health-cabinet${cabinetOpen ? ' is-open' : ''}`} aria-label="Your personalized health cabinet">
          <div className="dainty-health-cabinet__top"><i/><span>ayna health cabinet</span><i/></div>
          <div className="dainty-health-cabinet__door dainty-health-cabinet__door--left"><span>ayna</span></div>
          <div className="dainty-health-cabinet__door dainty-health-cabinet__door--right"><span>for you</span></div>
          <div className="dainty-health-cabinet__shelf">
            {cabinetProducts.map((product) => (
              <button type="button" className={`dainty-cabinet-product${selectedProduct?.id === product?.id ? ' is-selected' : ''}`} key={product?.id || product?.name} onClick={() => setSelectedId(product?.id || '')}>
                <ProductImage product={product} />
                <span>{product?.name}</span>
              </button>
            ))}
          </div>
          <div className="dainty-health-cabinet__drawers"><span><i/></span><span><i/></span><span><i/></span><span><i/></span></div>
        </div>

        <article className="dainty-selected-bubble">
          {selectedProduct ? (
            <>
              <ProductImage product={selectedProduct} className="dainty-selected-bubble__image" />
              <div className="dainty-selected-bubble__copy">
                <div className="dainty-kicker">selected for you</div>
                <h3>{selectedProduct.name}</h3>
                <p>{selectedProduct.summary || selectedProduct.description || `${CATEGORY_LABELS[selectedProduct.category] || selectedProduct.category || 'Ayna pick'} matched to your preferences.`}</p>
                <div className="dainty-selected-bubble__chips"><span>personalized</span><span>research backed</span></div>
                <div className="dainty-selected-bubble__score">your ayna score · {selectedScore ? `${selectedScore}/100` : 'view personalized score'}</div>
                <button type="button" onClick={() => onOpenProduct?.(selectedProduct)}>view product →</button>
              </div>
            </>
          ) : <div className="dainty-selected-bubble__empty">Your personalized picks will appear here.</div>}
        </article>

        {!user && (
          <div className="dainty-personalized-lock" role="region" aria-label="Personalized features are locked">
            <div className="dainty-personalized-lock__card">
              <span className="dainty-personalized-lock__icon"><LockIcon /></span>
              <div className="dainty-kicker">personalized to you</div>
              <h3>unlock your health cabinet.</h3>
              <p>Sign in to see your ecosystem, Ayna scores, saved matches, and personalized product picks.</p>
              <div className="dainty-personalized-lock__actions">
                <button type="button" className="primary" onClick={onViewEcosystem}>sign in</button>
                <button type="button" onClick={onStartQuiz}>create account</button>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="dainty-explore-section">
        <header>
          <div><div className="dainty-kicker">explore by need</div><h2>find your way in, <em>fast.</em></h2></div>
          <p>Browse products by the health need that matters to you.</p>
        </header>
        <div className="dainty-care-grid">
          {categoryCards.map(({ label, query: target, product }) => (
            <button type="button" key={label} className="dainty-care-card" onClick={() => onViewDiscovery?.(discoveryTargetFor(target))}>
              <ProductImage product={product} />
              <div><strong>{label}</strong><span>explore →</span></div>
            </button>
          ))}
        </div>
      </section>

      {user && ecosystemCount > 0 && (
        <section className="dainty-ecosystem-teaser">
          <div><span className="dainty-kicker">your health universe</span><h2>hi, {name || 'there'}. your ecosystem is ready.</h2></div>
          <button type="button" onClick={onViewEcosystem}>view my ecosystem →</button>
        </section>
      )}
    </main>
  );
}
