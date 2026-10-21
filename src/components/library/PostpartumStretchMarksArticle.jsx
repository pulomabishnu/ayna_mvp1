import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import BackLink from '../nav/BackLink.jsx';
import { createPortal } from 'react-dom';
import { ALL_PRODUCTS, useCatalogReady } from '../../data/catalog.js';
import { productHref, isPlainLeftClick } from '../../utils/productRoute.js';

/*
 * Geena Yousry's postpartum stretch marks article, laid out exactly as she
 * designed it (brown page, butter and pink type, her image placement). The
 * markup and inline styles come from her HTML file; only the parts that need
 * the site changed: the site's own header instead of the mock one, links that
 * work, and no em dash in the sign-off. The plain text version in ARTICLES
 * (Articles.jsx) feeds search, read time and the app.
 */

const DIR = '/articles/postpartum-stretch-marks';
const IMG = {
  glitter: `${DIR}/glitter.webp`,
  reaction: `${DIR}/reaction.webp`,
  thumbs: `${DIR}/thumbs.webp`,
  diy: `${DIR}/diy.webp`,
  klimt: `${DIR}/klimt.webp`,
};

const REFS = [
  ['Algarra Sahuquillo, J., & Martín-Gorgojo, A. (2026). Stretch marks: Systematic review of its therapeutic approach. Actas Dermo-Sifiliográficas, 117(4), 104553.', '10.1016/j.ad.2025.104553'],
  ['Brennan, M., Young, G., & Devane, D. (2012). Topical preparations for preventing stretch marks in pregnancy. Cochrane Database of Systematic Reviews, (11), CD000066.', '10.1002/14651858.CD000066.pub2'],
  ['Grove, G. L., Karmisholt, K. E., Philipsen, P. A., Bjerring, P., & Haedersdal, M. (2026). Treatment of striae albae with combination of fractional radiofrequency and topical tretinoin: A randomized controlled trial. Lasers in Medical Science.'],
  ['Güner Emül, T., & Kaplan Serin, E. (2026). Effect of aromatherapy oil applications on striae gravidarum: A systematic review. Skin Research and Technology.'],
  ['Lu, H., Guo, J., Hong, X., Chen, A., Zhang, X., & Shen, S. (2020). Comparative effectiveness of different therapies for treating striae distensae: A systematic review and network meta-analysis. Medicine, 99(39), e22256.', '10.1097/MD.0000000000022256'],
  ['Mustafa, A., Zahid, R., Khan, S., et al. (2025). Evaluating CO2 laser and micro-needling therapies for striae distensae: A comprehensive meta-analysis and systematic review. Lasers in Medical Science.'],
  ['Saki, N., Rahimi, F., Pezeshkian, F. S., & Parvar, S. Y. (2022). Comparison of the efficacy of microneedling versus CO2 fractional laser to treat striae alba: A randomized clinical trial. Dermatologic Therapy, 35(1), e15212.', '10.1111/dth.15212'],
  ['Solt Kırca, A., & Kanza Gül, D. (2022). Effects of olive oil on striae gravidarum in primiparous women: A randomized controlled clinical study. Alternative Therapies in Health and Medicine.'],
  ['Tian, T., Luo, Y. J., Wang, H., Chen, H. D., & Li, Y. H. (2019). Efficacy and safety of a sublative bipolar fractional radiofrequency system combined with topical tretinoin in treating striae gravidarum: A randomized pilot study. Dermatologic Surgery, 45(10), 1245–1252.', '10.1097/DSS.0000000000001933'],
  ['Tran, B., Wu, J. J., Ratner, D., & Han, G. (2020). Topical scar treatment products for wounds: A systematic review. Dermatologic Surgery, 46(12), 1564–1571.', '10.1097/DSS.0000000000002712'],
  ['Wang, F., Li, X., Wang, X., & Jiang, X. (2020). Efficacy of topical silicone gel in scar management: A systematic review and meta-analysis of randomised controlled trials. International Wound Journal, 17(3), 765–773.', '10.1111/iwj.13337'],
];

// Her product picks, styled as she drew them. A pick that is in the ayna
// catalog links to its ayna product page (opened in place on a plain click);
// the rest stay labels until they have a product card.
const PICK_IDS = {
  'BUNI Transform Body and Scar Oil': 'p-buni-transform-scar-body-oil',
  'TRANSFORM Scar & Body Treatment Oil': 'p-buni-transform-scar-body-oil',
};
const OpenProductContext = createContext(null);
const PILL_STYLE = { padding: '9px 14px', borderRadius: '99px', background: 'var(--g-butter)', color: '#3e2723', font: "700 14px/1 'Figtree'" };

function Pill({ name }) {
  const onOpenProduct = useContext(OpenProductContext);
  useCatalogReady(); // the product link appears once the catalog has loaded
  const product = PICK_IDS[name] ? ALL_PRODUCTS.find((p) => p.id === PICK_IDS[name]) : null;
  if (!product) return <span className="ay-geena__pill" style={PILL_STYLE}>{name}</span>;
  return (
    <a className="ay-geena__pill" href={productHref(product)} style={{ ...PILL_STYLE, textDecoration: 'none' }} onClick={(e) => { if (!onOpenProduct || !isPlainLeftClick(e)) return; e.preventDefault(); onOpenProduct(product); }}>{name}</a>
  );
}

// The site's stylesheets restyle every p, span and card with !important, which
// would repaint her page in the site theme. A shadow root keeps them out, so
// only her own styles apply. The plain read stays in the page (unshown) for
// search engines and screen readers that skip shadow content.
function ShadowPage({ children, fallback }) {
  const [root, setRoot] = useState(null);
  const hostRef = useCallback((host) => {
    if (host) setRoot(host.shadowRoot || host.attachShadow({ mode: 'open' }));
  }, []);
  return <div ref={hostRef}>{fallback}{root && createPortal(children, root)}</div>;
}

// The page-level rules from her file, scoped to this article.
const SCOPED_CSS = `
:host { all: initial; display: block; }
.ay-geena { font-family: 'Figtree', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
.ay-geena, .ay-geena * { box-sizing: border-box; }
/* P1-8: the shared back control (BackLink), copied in because global CSS can't reach this shadow root. Same as src/styles/chrome.css .ay-backlink. */
.ay-geena .ay-backlink { display: inline-flex; align-items: center; gap: 4px; min-height: 44px; margin: 0 0 0 -6px; padding: 0 10px 0 2px; border: 0; border-radius: 10px; background: none; box-shadow: none; color: var(--g-fg); font: 600 15px/1.2 'Figtree', system-ui, sans-serif; text-decoration: none; cursor: pointer; }
.ay-geena .ay-backlink svg { flex: none; width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; transition: transform var(--t-fast, 160ms) var(--ease-out, ease-out); }
.ay-geena .ay-backlink:hover { background: rgba(var(--g-fg-rgb), .08); }
.ay-geena .ay-backlink:hover svg { transform: translateX(-2px); }
.ay-geena .ay-backlink:focus-visible { outline: 3px solid var(--g-fg); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { .ay-geena .ay-backlink svg { transition: none; } }
.ay-geena [id] { scroll-margin-top: 96px !important; }
.ay-geena aside { top: 96px !important; }
/* One column on phones: the contents list sits above the read instead of
   sticking over it. */
@media (max-width: 760px) { .ay-geena aside { position: static !important; } }
.ay-geena { --g-bg: #43292a; --g-fg: #ffedac; --g-fg-rgb: 255, 237, 172; --g-butter: #ffedac; --g-pink: #f7badd; --g-sky: #769ebe; }
/* Light mode: the site's yellow page with espresso type. Pink and sky stay as
   box colours; as text they turn espresso so they read on yellow. */
.ay-geena.is-light { --g-bg: #ffedac; --g-fg: #3e2723; --g-fg-rgb: 62, 39, 35; --g-butter: #fff; --g-pink: #3e2723; --g-sky: #3e2723; }
.ay-geena a { color: var(--g-fg); }
.ay-geena a:hover { color: var(--g-fg); text-decoration-thickness: 2px; }
.ay-geena:not(.is-light) a:hover { color: #f7badd; }
.ay-geena a.ay-geena__pill, .ay-geena a.ay-geena__pill:hover { color: #3e2723; }
.ay-geena ::selection { background: #f7badd; color: #3e2723; }
.ay-geena .ay-geena__next:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0 #f7badd !important; color: #3e2723 !important; }
`;

// The site keeps its theme on <html data-ay-theme>: 'brand-dark' is dark mode.
function useSiteDark() {
  const read = () => typeof document !== 'undefined' && document.documentElement.dataset.ayTheme === 'brand-dark';
  const [dark, setDark] = useState(read);
  useEffect(() => {
    const obs = new MutationObserver(() => setDark(read()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-ay-theme'] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

export default function PostpartumStretchMarksArticle({ onBack, nextArticle, onOpenNext, onOpenProduct = null, fallback = null }) {
  const [p, setP] = useState(0);
  const [refsOpen, setRefsOpen] = useState(false);
  const dark = useSiteDark();
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setP(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const readLabel = p >= 0.97 ? 'Finished' : p > 0.02 ? `${Math.round(p * 100)}% read` : '12 min read';
  const refsLabel = refsOpen ? 'Hide' : `Show all ${REFS.length}`;
  const toggleRefs = () => setRefsOpen((o) => !o);
  const jump = (e) => {
    const id = e.currentTarget.getAttribute('href').slice(1);
    const el = e.currentTarget.getRootNode().getElementById(id);
    if (!el) return;
    e.preventDefault();
    if (id === 'refs') setRefsOpen(true);
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const next = nextArticle ? (
    <a href={`/library/${nextArticle.id}`} className="ay-geena__next" onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return; e.preventDefault(); onOpenNext?.(nextArticle.id); }} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 44px', alignItems: 'center', gap: '16px', minHeight: '80px', padding: '18px 20px', border: '2px solid var(--g-fg)', borderRadius: '20px', background: 'var(--g-butter)', color: '#3e2723', boxShadow: '4px 4px 0 #f7badd', textDecoration: 'none', font: "700 19px/1.3 'Figtree'" }}>
      {nextArticle.title}
      <span aria-hidden="true" style={{ display: 'grid', placeItems: 'center', width: '44px', height: '44px', borderRadius: '50%', background: '#3e2723', color: '#ffedac', font: "700 18px/1 'Figtree'" }}>→</span>
    </a>
  ) : null;

  return (
    <OpenProductContext.Provider value={onOpenProduct}>
    <ShadowPage fallback={fallback}>
    <style>{SCOPED_CSS}</style>
    <div className={`ay-geena${dark ? '' : ' is-light'}`} style={{ minHeight: "100vh", background: "var(--g-bg)", color: "var(--g-fg)" }}>
      {/* No fixed reading-progress bar (founder, Oct 21: nothing stays on screen while the page scrolls). */}

  

      <main style={{ maxWidth: "1180px", margin: "0 auto", padding: "28px clamp(16px,4vw,48px) 96px", display: "grid", gap: "40px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <BackLink label="Library" href="/library" onClick={onBack} />
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ padding: "7px 12px", borderRadius: "99px", background: "#769ebe", color: "#2a1a19", font: "700 13px/1 'Figtree'" }}>Postpartum</span>
            <span style={{ padding: "7px 12px", borderRadius: "99px", border: "1.5px solid var(--g-fg)", font: "600 13px/1 'Figtree'" }}>Skin</span>
            <span style={{ padding: "7px 12px", borderRadius: "99px", border: "1.5px solid var(--g-fg)", font: "600 13px/1 'Figtree'" }}>{readLabel}</span>
          </div>
        </div>

        <section style={{ display: "grid", gap: "22px", maxWidth: "900px" }}>
          <h1 style={{ margin: "0", font: "700 clamp(28px,3.4vw,44px)/1.1 var(--ay-heading)", letterSpacing: "-.01em", textWrap: "balance" }}>Can you improve postpartum stretch marks? <em style={{ fontStyle: "normal" }}>What the research says about 5 popular treatments</em></h1>
          <p style={{ margin: "0", font: "400 clamp(19px,1.8vw,23px)/1.5 'Figtree'", maxWidth: "56ch", textWrap: "pretty" }}>From viral belly oils to prescription retinoids, here's what actually works, what's mostly marketing, and what the research says.</p>
          <div style={{ display: "grid", gap: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span aria-hidden="true" style={{ display: "grid", placeItems: "center", flex: "none", width: "44px", height: "44px", borderRadius: "50%", background: "#f7badd", color: "#3e2723", font: "400 20px/1 var(--ay-heading)" }}>A</span>
              <span style={{ display: "grid", gap: "4px" }}><span style={{ font: "600 13px/1.4 'Figtree'", color: "var(--g-pink)" }}>Reviewed by</span><strong style={{ font: "700 16px/1.3 'Figtree'" }}>Dr. Anuja Vyas, Board-Certified OBGYN, Co-founder of <a href="/partners#brand-buni" style={{ textDecoration: "underline", textUnderlineOffset: "3px" }}>BUNI Body</a></strong></span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span aria-hidden="true" style={{ display: "grid", placeItems: "center", flex: "none", width: "44px", height: "44px", borderRadius: "50%", background: "#f7badd", color: "#3e2723", font: "400 20px/1 var(--ay-heading)" }}>G</span>
              <span style={{ display: "grid", gap: "4px" }}><span style={{ font: "600 13px/1.4 'Figtree'", color: "var(--g-pink)" }}>Written by</span><strong style={{ font: "700 16px/1.3 'Figtree'" }}>Geena Yousry, MS1, Medical Student</strong></span>
            </div>
          </div>
        </section>

        <figure style={{ margin: "0", display: "grid", gap: "10px", justifyItems: "center" }}>
          <div style={{ width: "min(100%, 560px)", borderRadius: "28px", overflow: "hidden", border: "2px solid var(--g-fg)" }}>
            <img src={IMG.glitter} alt="Glitter Stretch Marks, digital artwork by Sara Shakeel" width="794" height="798" style={{ width: "100%", height: "auto", display: "block" }} />
          </div>
          <figcaption style={{ font: "400 14px/1.5 'Figtree'", textAlign: "center" }}>Shakeel, S. (2017). Glitter Stretch Marks [Digital artwork]. Featured in <a href="https://www.vogue.it/bellezza/tendenze-news/2017/11/16/le-smagliature-diventano-opera-arte-instagram-2" target="_blank" rel="noopener noreferrer">Vogue Italia</a>.</figcaption>
        </figure>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))", gap: "56px", alignItems: "start" }}>
      
            <aside style={{ display: "grid", gap: "14px", maxWidth: "260px" }}>
              <span style={{ font: "600 13px/1.4 'Figtree'", color: "var(--g-pink)" }}>In this article</span>
              <nav style={{ display: "grid", gap: "4px" }}>
                <a href="#basics" onClick={jump} style={{ padding: "8px 0", font: "500 15px/1.35 'Figtree'", textDecoration: "none", borderBottom: "1px solid rgba(var(--g-fg-rgb), .25)" }}>The difference is more than skin deep</a>
                <a href="#t1" onClick={jump} style={{ display: "grid", gridTemplateColumns: "24px 1fr", gap: "8px", padding: "8px 0", font: "500 15px/1.35 'Figtree'", textDecoration: "none", borderBottom: "1px solid rgba(var(--g-fg-rgb), .25)" }}><span style={{ color: "var(--g-pink)", fontWeight: "700" }}>01</span>Prescription tretinoin</a>
                <a href="#t2" onClick={jump} style={{ display: "grid", gridTemplateColumns: "24px 1fr", gap: "8px", padding: "8px 0", font: "500 15px/1.35 'Figtree'", textDecoration: "none", borderBottom: "1px solid rgba(var(--g-fg-rgb), .25)" }}><span style={{ color: "var(--g-pink)", fontWeight: "700" }}>02</span>Silicone scar sheets</a>
                <a href="#t3" onClick={jump} style={{ display: "grid", gridTemplateColumns: "24px 1fr", gap: "8px", padding: "8px 0", font: "500 15px/1.35 'Figtree'", textDecoration: "none", borderBottom: "1px solid rgba(var(--g-fg-rgb), .25)" }}><span style={{ color: "var(--g-pink)", fontWeight: "700" }}>03</span>Belly oils, Centella &amp; HA</a>
                <a href="#t4" onClick={jump} style={{ display: "grid", gridTemplateColumns: "24px 1fr", gap: "8px", padding: "8px 0", font: "500 15px/1.35 'Figtree'", textDecoration: "none", borderBottom: "1px solid rgba(var(--g-fg-rgb), .25)" }}><span style={{ color: "var(--g-pink)", fontWeight: "700" }}>04</span>Microneedling</a>
                <a href="#t5" onClick={jump} style={{ display: "grid", gridTemplateColumns: "24px 1fr", gap: "8px", padding: "8px 0", font: "500 15px/1.35 'Figtree'", textDecoration: "none", borderBottom: "1px solid rgba(var(--g-fg-rgb), .25)" }}><span style={{ color: "var(--g-pink)", fontWeight: "700" }}>05</span>Laser treatments</a>
                <a href="#perineal" onClick={jump} style={{ padding: "8px 0", font: "500 15px/1.35 'Figtree'", textDecoration: "none", borderBottom: "1px solid rgba(var(--g-fg-rgb), .25)" }}>Perineal or episiotomy scars</a>
                <a href="#refs" onClick={jump} style={{ padding: "8px 0", font: "500 15px/1.35 'Figtree'", textDecoration: "none" }}>References</a>
              </nav>
            </aside>
      

          <article style={{ gridColumn: "span 2", display: "grid", gap: "56px", maxWidth: "700px", minWidth: "0", font: "400 19px/1.75 'Figtree'" }}>

            <div style={{ display: "grid", gap: "22px" }}>
              <p style={{ margin: "0", textWrap: "pretty" }}><span style={{ float: "left", margin: "6px 10px 0 0", font: "400 76px/.8 var(--ay-heading)", color: "var(--g-pink)" }}>I</span>f you've ever searched for the best stretch mark cream on Google or TikTok, you know the beauty industry has a product for practically everything - it's overstimulating as HECK. Belly oils promising smoother skin, collagen creams claiming to erase stretch marks, and serums that supposedly work miracles overnight.</p>
              <p style={{ margin: "0" }}>Some cost $10. Others cost $100. And somehow, they all seem to promise the same thing.</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))", gap: "24px", alignItems: "center", margin: "8px 0" }}>
                <div style={{ aspectRatio: "244/224", borderRadius: "24px", overflow: "hidden", border: "2px solid var(--g-fg)", background: "rgba(var(--g-fg-rgb), .08)", transform: "rotate(-2deg)" }}><img src={IMG.reaction} alt="Reaction GIF" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /></div>
                <p style={{ margin: "0", font: "400 clamp(34px,4vw,48px)/1.1 var(--ay-heading)", color: "var(--g-pink)" }}>PERO LIKE do they actually work?</p>
              </div>
              <p style={{ margin: "0", textWrap: "pretty" }}>As a medical student passionate about women's health, I decided to go down the PubMed rabbit hole so you wouldn't have to, digging through clinical research to separate the science from the skincare marketing. Because, while there's nothing wrong with a cute body oil, there's a difference between a product that makes your skin FEEL amazing and one that's actually been shown to improve stretch marks.</p>
              <div style={{ display: "grid", gap: "10px", padding: "26px 28px", borderRadius: "24px", background: "#f7badd", color: "#3e2723" }}>
                <span style={{ font: "600 13px/1.4 'Figtree'" }}>A little reminder before I start</span>
                <p style={{ margin: "0", font: "400 26px/1.25 var(--ay-heading)" }}>YOUR BODY DOESN'T NEED FIXING.</p>
                <p style={{ margin: "0", font: "400 17px/1.65 'Figtree'" }}>Stretchmarks and scars are completely normal. I have stretch marks myself, and I've never even been pregnant (TMI, I know). Whether you want to explore treatments or embrace them as they are, both are perfectly valid choices.</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))", gap: "12px" }}>
                <div style={{ display: "grid", gap: "8px", padding: "20px 22px", borderRadius: "20px", border: "2px solid var(--g-fg)" }}><span style={{ font: "600 13px/1.4 'Figtree'", color: "var(--g-pink)" }}>The good news?</span><span style={{ font: "400 17px/1.55 'Figtree'" }}>Stretch marks and scars can often become less noticeable.</span></div>
                <div style={{ display: "grid", gap: "8px", padding: "20px 22px", borderRadius: "20px", border: "2px solid var(--g-fg)" }}><span style={{ font: "600 13px/1.4 'Figtree'", color: "var(--g-pink)" }}>The catch?</span><span style={{ font: "400 17px/1.55 'Figtree'" }}>No product or procedure can reliably erase them completely.</span></div>
              </div>
              <p style={{ margin: "0" }}>So, which treatments are actually worth considering, and which ones might be better left on the shelf?</p>
              <p style={{ margin: "0" }}>Consider this your evidence-based beauty edit….with a little less BS (I mean, marketing) and a lot more science!</p>
            </div>

            <section id="basics" style={{ display: "grid", gap: "20px", scrollMarginTop: "24px" }}>
              <h2 style={{ margin: "0", font: "400 clamp(30px,3.2vw,40px)/1.1 var(--ay-heading)" }}>The Difference Is More Than Skin Deep</h2>
              <p style={{ margin: "0" }}>Before we start filling our shopping carts, let's clear something up: not all postpartum marks are created equal.</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,280px),1fr))", gap: "12px" }}>
                <div style={{ display: "grid", gap: "10px", alignContent: "start", padding: "22px", borderRadius: "22px", background: "var(--g-butter)", color: "#3e2723" }}>
                  <strong style={{ font: "400 24px/1.15 var(--ay-heading)" }}>Stretch marks</strong>
                  <span style={{ font: "400 16px/1.6 'Figtree'" }}>Medically known as striae distensae, develop when changes in the skin's collagen and elastic-fiber network occur during pregnancy. They often start out pink, red, or purple (striae rubrae) before gradually becoming lighter, silvery, and slightly sunken (striae albae).</span>
                </div>
                <div style={{ display: "grid", gap: "10px", alignContent: "start", padding: "22px", borderRadius: "22px", background: "#769ebe", color: "#2a1a19" }}>
                  <strong style={{ font: "400 24px/1.15 var(--ay-heading)" }}>C-section and perineal scars</strong>
                  <span style={{ font: "400 16px/1.6 'Figtree'" }}>Develop as the body repairs tissue following an incision or tear.</span>
                </div>
              </div>
              <p style={{ margin: "0" }}>Stretch marks have scar-like features, but they aren't identical to surgical scars. And that matters, because the treatments that help one won't necessarily help the other.</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))", gap: "24px", alignItems: "center", marginTop: "12px" }}>
                <p style={{ margin: "0", font: "400 italic clamp(34px,4vw,48px)/1.1 var(--ay-heading)", color: "var(--g-pink)" }}>Now…onto the options</p>
                <div style={{ aspectRatio: "2/3", borderRadius: "24px", overflow: "hidden", border: "2px solid var(--g-fg)", background: "rgba(var(--g-fg-rgb), .08)", maxWidth: "260px", justifySelf: "center", width: "100%", transform: "rotate(2deg)" }}><img src={IMG.thumbs} alt="Thumbs-up photo" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /></div>
              </div>
            </section>

            <section id="t1" style={{ display: "grid", gap: "20px", scrollMarginTop: "24px" }}>
              <div style={{ display: "grid", gap: "10px" }}><span style={{ font: "400 64px/.9 var(--ay-heading)", color: "var(--g-pink)" }}>01</span><h2 style={{ margin: "0", font: "400 clamp(30px,3.2vw,40px)/1.1 var(--ay-heading)", textWrap: "balance" }}>Prescription tretinoin</h2><p style={{ margin: "0", font: "600 18px/1.4 'Figtree'" }}>Best-studied topical option for newer stretch marks</p></div>
              <dl style={{ margin: "0", display: "grid", border: "2px solid var(--g-fg)", borderRadius: "20px", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(110px,150px) 1fr", gap: "14px", padding: "14px 20px" }}><dt style={{ font: "600 13px/1.4 'Figtree'", color: "var(--g-pink)" }}>Best for</dt><dd style={{ margin: "0", font: "400 16px/1.55 'Figtree'" }}>Newer red or purple stretch marks</dd></div>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(110px,150px) 1fr", gap: "14px", padding: "14px 20px", borderTop: "1.5px solid rgba(var(--g-fg-rgb), .3)" }}><dt style={{ font: "600 13px/1.4 'Figtree'", color: "var(--g-pink)" }}>The science</dt><dd style={{ margin: "0", font: "400 16px/1.55 'Figtree'" }}>Encouraging, but based on relatively small studies</dd></div>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(110px,150px) 1fr", gap: "14px", padding: "14px 20px", borderTop: "1.5px solid rgba(var(--g-fg-rgb), .3)" }}><dt style={{ font: "600 13px/1.4 'Figtree'", color: "var(--g-pink)" }}>Worth knowing</dt><dd style={{ margin: "0", font: "400 16px/1.55 'Figtree'" }}>Prescription-only. Avoid retinoids during pregnancy, and speak with your clinician about breastfeeding precautions before using them.</dd></div>
              </dl>
              <p style={{ margin: "0" }}>You've probably heard of retinoids in the context of acne or anti-aging skincare. But their collagen-stimulating effects have also made them a subject of interest in stretch-mark research.</p>
              <p style={{ margin: "0" }}>And this is where things get interesting.</p>
              <p style={{ margin: "0" }}>A 2026 systematic review published in <em>Actas Dermo-Sifiliográficas</em>, which examined 69 studies of stretch-mark treatments overall, found that 0.1% tretinoin improved stretch-mark appearance in most of the studies evaluating it, particularly when the marks were newer.</p>
              <p style={{ margin: "0" }}>BUT this isn't an overnight transformation. Most studies involved at least 12 weeks of treatment, and dryness or irritation can come with the territory. A gentle moisturizer can help keep your skin comfortable along the way (and yes, your favorite body oil can still have a place in your routine!).</p>
              <p style={{ margin: "0" }}><strong>So, is your favorite retinol body lotion basically the same thing?</strong> Not quite (I wish lol)</p>
              <p style={{ margin: "0" }}>Prescription tretinoin and over-the-counter retinol products belong to the same broader ingredient family, but they aren't interchangeable. The evidence supporting tretinoin doesn't automatically extend to every retinol cream marketed for body texture.</p>
              <div style={{ display: "grid", gap: "10px", padding: "24px 26px", borderRadius: "24px", background: "#f7badd", color: "#3e2723" }}>
                <span style={{ font: "600 13px/1.4 'Figtree'" }}>The verdict</span>
                <p style={{ margin: "0", font: "400 18px/1.6 'Figtree'" }}>If newer stretch marks are your main concern, tretinoin is one of the more evidence-supported topical options to discuss with a dermatologist. Avoid topical retinoids during pregnancy; if breastfeeding, discuss use and infant-contact precautions with your clinician.</p>
              </div>
              <div style={{ display: "grid", gap: "14px", padding: "24px 26px", borderRadius: "24px", border: "2px dashed var(--g-fg)" }}>
                <span style={{ font: "600 13px/1.4 'Figtree'", color: "var(--g-pink)" }}>What to shop</span>
                <p style={{ margin: "0", font: "400 17px/1.65 'Figtree'" }}>Prescription tretinoin isn't exactly a casual add-to-cart situation. 0.1% tretinoin needs to be prescribed by your doctor.</p>
                <p style={{ margin: "0", font: "400 17px/1.65 'Figtree'" }}>But shhh… if you're looking for an OTC retinol body lotion, I've got my eye on <strong>The Ordinary Retinol 0.5% in Squalane</strong>. Don't forget to pair it with a gentle, fragrance-free moisturizer!</p>
                <p style={{ margin: "0", font: "400 17px/1.65 'Figtree'" }}>AND for my expecting mothers and breastfeeders, there's <strong>Nēmah Revitalizing Stretch Mark Cream</strong> and <strong>Mederma Stretch Marks Therapy</strong>, which are pregnancy-friendly options.</p>
                <p style={{ margin: "0", font: "400 17px/1.65 'Figtree'" }}>After delivery, <strong>BUNI Transform Body and Scar Oil</strong> incorporates a milder retinoid (retinyl palmitate) with snail secretion filtrate to hydrate and reduce the appearance of stretch marks. This is safe during breastfeeding and the large roller ball design makes it especially appealing for quick application and scar massage.</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  <Pill name="The Ordinary Retinol 0.5% in Squalane" />
                  <Pill name="Nēmah Stretch Mark Cream" />
                  <Pill name="Mederma Stretch Marks Therapy" />
                  <Pill name="BUNI Transform Body and Scar Oil" />
                </div>
                <p style={{ margin: "0", font: "400 italic 15px/1.55 'Figtree'" }}>Remember these are alternatives but a prescription product may be the better option.</p>
              </div>
            </section>

            <section id="t2" style={{ display: "grid", gap: "20px", scrollMarginTop: "24px" }}>
              <div style={{ display: "grid", gap: "10px" }}><span style={{ font: "400 64px/.9 var(--ay-heading)", color: "var(--g-pink)" }}>02</span><h2 style={{ margin: "0", font: "400 clamp(30px,3.2vw,40px)/1.1 var(--ay-heading)", textWrap: "balance" }}>Silicone scar sheets</h2><p style={{ margin: "0", font: "600 18px/1.4 'Figtree'" }}>Safest and best at-home option to consider for C-section scars</p></div>
              <dl style={{ margin: "0", display: "grid", border: "2px solid var(--g-fg)", borderRadius: "20px", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(110px,150px) 1fr", gap: "14px", padding: "14px 20px" }}><dt style={{ font: "600 13px/1.4 'Figtree'", color: "var(--g-pink)" }}>Best for</dt><dd style={{ margin: "0", font: "400 16px/1.55 'Figtree'" }}>Fully healed C-section incisions</dd></div>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(110px,150px) 1fr", gap: "14px", padding: "14px 20px", borderTop: "1.5px solid rgba(var(--g-fg-rgb), .3)" }}><dt style={{ font: "600 13px/1.4 'Figtree'", color: "var(--g-pink)" }}>The science</dt><dd style={{ margin: "0", font: "400 16px/1.55 'Figtree'" }}>Among the better-supported non-invasive scar treatments</dd></div>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(110px,150px) 1fr", gap: "14px", padding: "14px 20px", borderTop: "1.5px solid rgba(var(--g-fg-rgb), .3)" }}><dt style={{ font: "600 13px/1.4 'Figtree'", color: "var(--g-pink)" }}>Worth knowing</dt><dd style={{ margin: "0", font: "400 16px/1.55 'Figtree'" }}>Consistency matters</dd></div>
              </dl>
              <p style={{ margin: "0" }}>Silicone scar sheets and gels aren't particularly the most trendy and glamorous. They don't come with exotic botanical extracts or elaborate skincare rituals. But unlike many products promising to erase scars, they have a meaningful body of clinical research behind them.</p>
              <p style={{ margin: "0" }}>Silicone helps maintain a hydrated environment over scar tissue, and studies suggest it can improve certain features of scars, including thickness, redness, and flexibility.</p>
              <p style={{ margin: "0" }}>A study comparing silicone gel with silicone sheets on C-section scars found broadly similar results, meaning the choice may come down to which format you find more comfortable.</p>
              <p style={{ margin: "0" }}>And unlike the latest $80 miracle cream, a higher price tag doesn't necessarily translate into better results.</p>
              <div style={{ display: "grid", gap: "10px", padding: "24px 26px", borderRadius: "24px", background: "#f7badd", color: "#3e2723" }}>
                <span style={{ font: "600 13px/1.4 'Figtree'" }}>The verdict</span>
                <p style={{ margin: "0", font: "400 18px/1.6 'Figtree'" }}>One of the first at-home treatments worth discussing for a C-section scar. Only begin after the incision has fully closed and your clinician has cleared you to use it. Scar improvement generally takes consistent use over weeks to months.</p>
              </div>
              <div style={{ display: "grid", gap: "14px", padding: "24px 26px", borderRadius: "24px", border: "2px dashed var(--g-fg)" }}>
                <span style={{ font: "600 13px/1.4 'Figtree'", color: "var(--g-pink)" }}>Products worth looking at</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  <Pill name="ScarAway Silicone Scar Sheets" />
                  <Pill name="Kelo-cote Silicone Scar Gel" />
                  <Pill name="La Roche-Posay Cicaplast Defense Gel Scar" />
                </div>
                <p style={{ margin: "0", font: "400 italic 15px/1.55 'Figtree'" }}>These are product examples, not independently tested rankings.</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "44px 1fr", gap: "16px", alignItems: "start", padding: "22px 24px", borderRadius: "24px", background: "#769ebe", color: "#2a1a19" }}>
                <span style={{ display: "grid", placeItems: "center", width: "44px", height: "44px", borderRadius: "50%", background: "#2a1a19", color: "#769ebe", font: "400 22px/1 var(--ay-heading)" }}>✦</span>
                <div style={{ display: "grid", gap: "6px" }}><span style={{ font: "600 13px/1.4 'Figtree'" }}>From our clinical experts</span><p style={{ margin: "0", font: "500 17px/1.6 'Figtree'" }}>The combination of tissue massage along, above, and below the c-section scar with a good product - whether prescription or not - and regular application of silicone scar tape is the best defense against not only stretch marks but also painful or lumpy scars.</p></div>
              </div>
            </section>

            <section id="t3" style={{ display: "grid", gap: "20px", scrollMarginTop: "24px" }}>
              <div style={{ display: "grid", gap: "10px" }}><span style={{ font: "400 64px/.9 var(--ay-heading)", color: "var(--g-pink)" }}>03</span><h2 style={{ margin: "0", font: "400 clamp(30px,3.2vw,40px)/1.1 var(--ay-heading)", textWrap: "balance" }}>Belly oils, Centella, and hyaluronic acid</h2><p style={{ margin: "0", font: "600 18px/1.4 'Figtree'" }}>Best for hydration (not miracles)</p></div>
              <dl style={{ margin: "0", display: "grid", border: "2px solid var(--g-fg)", borderRadius: "20px", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(110px,150px) 1fr", gap: "14px", padding: "14px 20px" }}><dt style={{ font: "600 13px/1.4 'Figtree'", color: "var(--g-pink)" }}>Best for</dt><dd style={{ margin: "0", font: "400 16px/1.55 'Figtree'" }}>Dryness, itchiness, and keeping postpartum skin comfortable</dd></div>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(110px,150px) 1fr", gap: "14px", padding: "14px 20px", borderTop: "1.5px solid rgba(var(--g-fg-rgb), .3)" }}><dt style={{ font: "600 13px/1.4 'Figtree'", color: "var(--g-pink)" }}>The science</dt><dd style={{ margin: "0", font: "400 16px/1.55 'Figtree'" }}>Good rationale for hydration; limited evidence for stretch-mark reduction</dd></div>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(110px,150px) 1fr", gap: "14px", padding: "14px 20px", borderTop: "1.5px solid rgba(var(--g-fg-rgb), .3)" }}><dt style={{ font: "600 13px/1.4 'Figtree'", color: "var(--g-pink)" }}>Worth knowing</dt><dd style={{ margin: "0", font: "400 16px/1.55 'Figtree'" }}>A moisturizer isn't necessarily a stretch-mark treatment</dd></div>
              </dl>
              <p style={{ margin: "0" }}>Let's talk about the beauty industry's favorite postpartum category: belly oils.</p>
              <p style={{ margin: "0" }}>Cocoa butter. Vitamin E. Olive oil. Botanical blends with beautiful packaging and even more beautiful promises.</p>
              <p style={{ margin: "0" }}>I have nothing against a good body oil. It sure makes my skin feel AMAZEEEE. But after looking at the literature, I think it's important to separate what these products actually do from what they're marketed to do.</p>
              <p style={{ margin: "0" }}>Clinical trials haven't consistently shown that cocoa butter or olive oil prevents pregnancy-related stretch marks. That doesn't mean they're useless. They can moisturize the skin, reduce dryness, and make a skincare routine feel a little more luxurious.</p>
              <blockquote style={{ margin: "6px 0", padding: "0", font: "400 italic clamp(26px,2.8vw,32px)/1.25 var(--ay-heading)", color: "var(--g-pink)", textWrap: "balance" }}>It just means we shouldn't confuse hydration with structural skin remodeling.</blockquote>
              <p style={{ margin: "0" }}><strong>But what about Centella asiatica and hyaluronic acid?</strong></p>
              <p style={{ margin: "0" }}>These ingredients are a little more interesting from a research perspective.</p>
              <p style={{ margin: "0" }}>Hyaluronic acid helps attract and retain moisture, while Centella asiatica has been investigated for its potential effects on skin repair and collagen-related processes. Some studies of combination formulations have reported encouraging results.</p>
              <p style={{ margin: "0" }}>The problem? Many products contain several active ingredients, making it difficult to know which one contributed to the improvement. The overall evidence is still inconsistent.</p>
              <div style={{ display: "grid", gap: "10px", padding: "24px 26px", borderRadius: "24px", background: "#f7badd", color: "#3e2723" }}>
                <span style={{ font: "600 13px/1.4 'Figtree'" }}>The verdict</span>
                <p style={{ margin: "0", font: "400 18px/1.6 'Figtree'" }}>If you enjoy a belly oil or body butter, use it! Just buy it because you like how it makes your skin feel, not because the label promises to erase stretch marks, it can reduce redness and the overall discoloration. Centella and hyaluronic acid are reasonable skincare ingredients to consider, but neither is a guaranteed treatment.</p>
              </div>
              <div style={{ display: "grid", gap: "14px", padding: "24px 26px", borderRadius: "24px", border: "2px dashed var(--g-fg)" }}>
                <span style={{ font: "600 13px/1.4 'Figtree'", color: "var(--g-pink)" }}>What to shop</span>
                <p style={{ margin: "0", font: "400 17px/1.65 'Figtree'" }}>A fragrance-free body moisturizer, a hyaluronic-acid body lotion, or a Centella-containing cream. Prioritize comfort, formulation, and price over dramatic stretch-mark claims.</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  <Pill name="TRANSFORM Scar & Body Treatment Oil" />
                  <Pill name="SKIN1004 Madagascar Centella Soothing Cream" />
                  <Pill name="Cowshed Mother Stretch Mark Balm" />
                  <Pill name="Summer Fridays Babymoon Belly Balm" />
                  <Pill name="Earth Mama Belly Butter" />
                </div>
              </div>
            </section>

            <section id="t4" style={{ display: "grid", gap: "20px", scrollMarginTop: "24px" }}>
              <div style={{ display: "grid", gap: "10px" }}><span style={{ font: "400 64px/.9 var(--ay-heading)", color: "var(--g-pink)" }}>04</span><h2 style={{ margin: "0", font: "400 clamp(30px,3.2vw,40px)/1.1 var(--ay-heading)", textWrap: "balance" }}>Microneedling</h2><p style={{ margin: "0", font: "600 18px/1.4 'Figtree'" }}>Best for persistent stretch marks and texture</p></div>
              <dl style={{ margin: "0", display: "grid", border: "2px solid var(--g-fg)", borderRadius: "20px", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(110px,150px) 1fr", gap: "14px", padding: "14px 20px" }}><dt style={{ font: "600 13px/1.4 'Figtree'", color: "var(--g-pink)" }}>Best for</dt><dd style={{ margin: "0", font: "400 16px/1.55 'Figtree'" }}>Stretch marks that haven't improved enough with topical skincare</dd></div>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(110px,150px) 1fr", gap: "14px", padding: "14px 20px", borderTop: "1.5px solid rgba(var(--g-fg-rgb), .3)" }}><dt style={{ font: "600 13px/1.4 'Figtree'", color: "var(--g-pink)" }}>The science</dt><dd style={{ margin: "0", font: "400 16px/1.55 'Figtree'" }}>Promising clinical evidence for professional treatments</dd></div>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(110px,150px) 1fr", gap: "14px", padding: "14px 20px", borderTop: "1.5px solid rgba(var(--g-fg-rgb), .3)" }}><dt style={{ font: "600 13px/1.4 'Figtree'", color: "var(--g-pink)" }}>Worth knowing</dt><dd style={{ margin: "0", font: "400 16px/1.55 'Figtree'" }}>Technique and safety matter</dd></div>
              </dl>
              <p style={{ margin: "0" }}>If creams can only do so much, what about treatments that work beneath the surface?</p>
              <p style={{ margin: "0" }}>Microneedling uses fine needles to create controlled micro-injuries in the skin, triggering a repair response that encourages collagen and elastin remodeling. Radiofrequency microneedling adds heat energy to stimulate deeper tissue changes.</p>
              <p style={{ margin: "0" }}>Unlike a moisturizer, this approach actually targets some of the structural changes associated with stretch marks.</p>
              <p style={{ margin: "0" }}>Clinical studies suggest microneedling can improve their appearance, including older marks, although results vary and multiple sessions may be needed.</p>
              <p style={{ margin: "0" }}><strong>Can you do it at home?</strong></p>
              <p style={{ margin: "0" }}>At-home microneedling devices are available, and skincare routines sometimes pair them with products such as Medicube PDRN serum, Centella asiatica serum, and rich moisturizers.</p>
              <figure style={{ margin: "0" }}><div style={{ aspectRatio: "16/9", borderRadius: "24px", overflow: "hidden", border: "2px solid var(--g-fg)", background: "rgba(var(--g-fg-rgb), .08)" }}><img src={IMG.diy} alt="#DIY GIF" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /></div></figure>
              <div style={{ display: "grid", gridTemplateColumns: "44px 1fr", gap: "16px", alignItems: "start", padding: "22px 24px", borderRadius: "24px", background: "#769ebe", color: "#2a1a19" }}>
                <span style={{ display: "grid", placeItems: "center", width: "44px", height: "44px", borderRadius: "50%", background: "#2a1a19", color: "#769ebe", font: "700 22px/1 'Figtree'" }}>!</span>
                <div style={{ display: "grid", gap: "6px" }}><span style={{ font: "600 13px/1.4 'Figtree'" }}>But here's where I'd be careful</span><p style={{ margin: "0", font: "500 17px/1.6 'Figtree'" }}>Deeper at-home needling can cause infection, scarring, and pigmentation changes, particularly when equipment or technique is inappropriate.</p></div>
              </div>
              <div style={{ display: "grid", gap: "10px", padding: "24px 26px", borderRadius: "24px", background: "#f7badd", color: "#3e2723" }}>
                <span style={{ font: "600 13px/1.4 'Figtree'" }}>The verdict</span>
                <p style={{ margin: "0", font: "400 18px/1.6 'Figtree'" }}>Microneedling is worth considering for persistent stretch marks, but a qualified clinician offers the safer, better-studied approach. If you're recently postpartum, make sure any incisions have healed and discuss timing before undergoing treatment. And don't forget to factor in the time and cost, since multiple sessions may be needed to see noticeable results.</p>
              </div>
              <div style={{ display: "grid", gap: "14px", padding: "24px 26px", borderRadius: "24px", border: "2px dashed var(--g-fg)" }}>
                <span style={{ font: "600 13px/1.4 'Figtree'", color: "var(--g-pink)" }}>What to shop</span>
                <p style={{ margin: "0", font: "400 17px/1.65 'Figtree'" }}>Hydrating skincare for intact skin and professionally recommended aftercare. For the microneedling itself, prioritize a qualified provider over an at-home device. But after talking with your provider, an at home device I would suggest:</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  <Pill name="ORA Body Microneedle Roller System" />
                </div>
              </div>
            </section>

            <section id="t5" style={{ display: "grid", gap: "20px", scrollMarginTop: "24px" }}>
              <div style={{ display: "grid", gap: "10px" }}><span style={{ font: "400 64px/.9 var(--ay-heading)", color: "var(--g-pink)" }}>05</span><h2 style={{ margin: "0", font: "400 clamp(30px,3.2vw,40px)/1.1 var(--ay-heading)", textWrap: "balance" }}>Laser treatments</h2><p style={{ margin: "0", font: "600 18px/1.4 'Figtree'" }}>Best for targeted professional treatment</p></div>
              <dl style={{ margin: "0", display: "grid", border: "2px solid var(--g-fg)", borderRadius: "20px", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(110px,150px) 1fr", gap: "14px", padding: "14px 20px" }}><dt style={{ font: "600 13px/1.4 'Figtree'", color: "var(--g-pink)" }}>Best for</dt><dd style={{ margin: "0", font: "400 16px/1.55 'Figtree'" }}>Persistent stretch marks, redness, or selected surgical scars</dd></div>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(110px,150px) 1fr", gap: "14px", padding: "14px 20px", borderTop: "1.5px solid rgba(var(--g-fg-rgb), .3)" }}><dt style={{ font: "600 13px/1.4 'Figtree'", color: "var(--g-pink)" }}>The science</dt><dd style={{ margin: "0", font: "400 16px/1.55 'Figtree'" }}>Promising, with outcomes varying by device and skin type</dd></div>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(110px,150px) 1fr", gap: "14px", padding: "14px 20px", borderTop: "1.5px solid rgba(var(--g-fg-rgb), .3)" }}><dt style={{ font: "600 13px/1.4 'Figtree'", color: "var(--g-pink)" }}>Worth knowing</dt><dd style={{ margin: "0", font: "400 16px/1.55 'Figtree'" }}>Not all lasers do the same thing</dd></div>
              </dl>
              <p style={{ margin: "0" }}>When people hear the word laser, it's easy to imagine a treatment that simply makes stretch marks disappear.</p>
              <p style={{ margin: "0" }}>Unfortunately, dermatology is a little more complicated than that.</p>
              <p style={{ margin: "0" }}>Different lasers target different concerns. Vascular lasers may help reduce the redness of newer stretch marks, while fractional lasers stimulate skin remodeling and may improve the texture of older marks.</p>
              <p style={{ margin: "0" }}>Fractional CO₂ lasers have also been studied for surgical scars, including C-section scars.</p>
              <p style={{ margin: "0" }}>A 2026 systematic review identified fractional lasers among the more promising stretch-mark treatments, although the authors emphasized that study sizes and treatment protocols varied considerably.</p>
              <div style={{ display: "grid", gridTemplateColumns: "44px 1fr", gap: "16px", alignItems: "start", padding: "22px 24px", borderRadius: "24px", background: "#769ebe", color: "#2a1a19" }}>
                <span style={{ display: "grid", placeItems: "center", width: "44px", height: "44px", borderRadius: "50%", background: "#2a1a19", color: "#769ebe", font: "700 22px/1 'Figtree'" }}>!</span>
                <div style={{ display: "grid", gap: "6px" }}><span style={{ font: "600 13px/1.4 'Figtree'" }}>One important consideration: skin tone</span><p style={{ margin: "0", font: "500 17px/1.6 'Figtree'" }}>Some laser treatments carry a risk of post-inflammatory hyperpigmentation, particularly in darker skin tones. That doesn't mean people with deeper skin tones can't benefit from laser treatments, but it does mean choosing an experienced clinician and an appropriate device is especially important.</p></div>
              </div>
              <div style={{ display: "grid", gap: "10px", padding: "24px 26px", borderRadius: "24px", background: "#f7badd", color: "#3e2723" }}>
                <span style={{ font: "600 13px/1.4 'Figtree'" }}>The verdict</span>
                <p style={{ margin: "0", font: "400 18px/1.6 'Figtree'" }}>Lasers may offer meaningful improvement when topical products aren't enough, but they're an investment, often require multiple sessions, and aren't a guaranteed fix.</p>
              </div>
              <div style={{ display: "grid", gap: "10px", padding: "24px 26px", borderRadius: "24px", border: "2px dashed var(--g-fg)" }}>
                <span style={{ font: "600 13px/1.4 'Figtree'", color: "var(--g-pink)" }}>What to shop</span>
                <p style={{ margin: "0", font: "400 17px/1.65 'Figtree'" }}>A consultation with a board-certified dermatologist experienced in treating your skin type.</p>
              </div>
            </section>

            <section id="perineal" style={{ display: "grid", gap: "18px", padding: "30px", borderRadius: "28px", background: "var(--g-butter)", color: "#3e2723", scrollMarginTop: "24px" }}>
              <h2 style={{ margin: "0", font: "400 clamp(28px,3vw,36px)/1.12 var(--ay-heading)", textWrap: "balance" }}>And what about perineal or episiotomy scars?</h2>
              <p style={{ margin: "0", font: "600 18px/1.6 'Figtree'" }}>This is one area where I'd skip the beauty aisle altogether.</p>
              <p style={{ margin: "0", font: "400 17px/1.7 'Figtree'" }}>Unlike abdominal stretch marks or C-section scars, perineal scars involve sensitive tissue, and treatment is often more about comfort and function than appearance.</p>
              <p style={{ margin: "0", font: "400 17px/1.7 'Figtree'" }}>If you're experiencing persistent pain, tightness, discomfort during intercourse, or problems with healing, an OB-GYN or pelvic floor physical therapist can help assess what's going on.</p>
              <p style={{ margin: "0", paddingTop: "16px", borderTop: "1.5px solid rgba(62,39,35,.25)", font: "700 17px/1.6 'Figtree'" }}>Retinoids, exfoliating acids, and ordinary cosmetic scar treatments shouldn't be applied to vulvar or perineal tissue without medical guidance.</p>
            </section>

            <section style={{ display: "grid", gap: "20px" }}>
              <figure style={{ margin: "0", display: "grid", gap: "10px", justifyItems: "center" }}>
                <div style={{ aspectRatio: "880/1200", borderRadius: "24px", overflow: "hidden", border: "2px solid var(--g-fg)", background: "rgba(var(--g-fg-rgb), .08)", width: "min(100%,420px)" }}><img src={IMG.klimt} alt="Gustav Klimt, Hope II" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /></div>
                <figcaption style={{ font: "400 14px/1.5 'Figtree'" }}>Gustav Klimt, Hope II (1907–1908)</figcaption>
              </figure>
              <h2 style={{ margin: "0", font: "400 clamp(30px,3.2vw,40px)/1.1 var(--ay-heading)", textWrap: "balance" }}>One last thing: Your skin isn't something you need to apologize for</h2>
              <p style={{ margin: "0" }}>After looking through the research, here's what I hope you take away from this article: you don't need to spend hundreds of dollars trying to get rid of something that's completely normal.</p>
              <p style={{ margin: "0" }}>It's so easy to scroll through social media, see someone's seemingly flawless postpartum body, and start questioning your own. Suddenly, a stretch mark you've never thought twice about becomes something you feel pressured to fix.</p>
              <p style={{ margin: "0" }}>But a before-and-after picture doesn't tell you everything. Neither does a glowing review, a viral TikTok, or a product promising results that sound almost too good to be true. Your body has gone through an enormous amount of change. Give yourself some grace babe!!</p>
              <p style={{ margin: "0" }}>If you want to try a silicone sheet, explore microneedling, or simply enjoy moisturizing body oil because it makes you feel good, go for it. Taking care of your skin can be an act of self-care, not self-criticism.</p>
              <p style={{ margin: "0" }}>And if you'd rather do absolutely nothing? That's just as valid.</p>
              <p style={{ margin: "0" }}>As someone studying medicine, I believe women deserve access to the science behind the products they're encouraged to buy (not just the marketing).</p>
              <div style={{ display: "grid", gap: "14px", padding: "32px 30px", borderRadius: "28px", background: "#f7badd", color: "#3e2723" }}>
                <p style={{ margin: "0", font: "400 clamp(26px,2.8vw,34px)/1.2 var(--ay-heading)", textWrap: "balance" }}>But more than anything, I hope you remember this: you're beautiful as you are, stretch marks, scars and everything in between!</p>
                <p style={{ margin: "0", font: "400 17px/1.65 'Figtree'" }}>No cream, treatment, or internet trend gets to decide otherwise. So take care of yourself, be kind to your body, and please don't stress over a few lines on your skin. You've got enough on your plate queen.</p>
                <span style={{ font: "700 15px/1 'Figtree'" }}>Geena</span>
              </div>
            </section>

            <section id="refs" style={{ display: "grid", gap: "14px", paddingTop: "28px", borderTop: "1.5px solid var(--g-fg)", scrollMarginTop: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                <h2 style={{ margin: "0", font: "400 28px/1.15 var(--ay-heading)" }}>References</h2>
                <button type="button" onClick={toggleRefs} style={{ minHeight: "44px", padding: "0 18px", borderRadius: "99px", border: "2px solid var(--g-fg)", background: "transparent", color: "var(--g-fg)", font: "700 15px/1 'Figtree'", cursor: "pointer" }}>{refsLabel}</button>
              </div>
              {refsOpen && (
                <ol style={{ margin: "0", padding: "0", listStyle: "none", display: "grid", gap: "0" }}>
                  {REFS.map(([text, doi], i) => (
                    <li key={i} style={{ display: "grid", gridTemplateColumns: "32px 1fr", gap: "10px", padding: "14px 0", borderBottom: "1px solid rgba(var(--g-fg-rgb), .25)", font: "400 15px/1.6 'Figtree'" }}>
                      <span style={{ font: "700 14px/1.6 'Figtree'", color: "var(--g-pink)" }}>{i + 1}</span>
                      <span style={{ overflowWrap: "anywhere" }}>{text}{doi && <> <a href={`https://doi.org/${doi}`} target="_blank" rel="noopener noreferrer" style={{ fontWeight: "600" }}>doi:{doi} ↗</a></>}</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section style={{ display: "grid", gap: "12px" }}>
              <span style={{ font: "600 14px/1.2 'Figtree'" }}>Read next</span>
              {next}
            </section>
          </article>
        </div>
      </main>
    </div>
    </ShadowPage>
    </OpenProductContext.Provider>
  );
}
