import React from 'react';
import { useSiteDark, useReadProgress, readLabelFor, jumpTo, DESIGNED_BASE_CSS } from './designedRead.js';
import { ShadowPage, NextRead, Credits, ReviewerVyas } from './DesignedReadParts.jsx';

/*
 * Shruti Gajjar's vaginal atrophy / GSM article, laid out as designed in her
 * HTML file (brown page in dark mode, the site's yellow in light mode; her
 * illustrations and callouts). Changed from the file: the site's own header
 * instead of the mock one, links that work on the site, and the reviewer and
 * writer credits under the title. Puloma's entry in ARTICLES
 * (Articles.jsx, 'genitourinary-syndrome-of-menopause') stays the source for
 * the Library card, search, read time and the app.
 */

// Puloma's copies of Shruti's illustrations (public/articles/gsm).
const DIR = '/articles/gsm';
const IMG = {
  hero: `${DIR}/estrogen-decline.webp`,
  anatomy: `${DIR}/anatomy.webp`,
  symptoms: `${DIR}/symptoms.webp`,
  lubes: `${DIR}/lubricants.webp`,
  topical: `${DIR}/vaginal-estrogen.webp`,
  systemic: `${DIR}/systemic-estrogen.webp`,
  stigma: `${DIR}/talk-to-provider.webp`,
};

export default function VaginalAtrophyGsmArticle({ onBack, nextArticle, onOpenNext, fallback = null }) {
  const p = useReadProgress();
  const dark = useSiteDark();
  const progressPct = `${(p * 100).toFixed(1)}%`;
  const readLabel = readLabelFor(p, 5);
  const jump = (e) => jumpTo(e);
  const next = <NextRead article={nextArticle} onOpen={onOpenNext} />;
  const credits = <Credits reviewer={<ReviewerVyas />} reviewerInitial="A" writer="Shruti Gajjar, MS1, Medical Student" writerInitial="S" />;

  return (
    <ShadowPage fallback={fallback}>
    <style>{DESIGNED_BASE_CSS}</style>
    <div className={`ay-read${dark ? '' : ' is-light'}`} style={{ minHeight: "100vh", background: "var(--g-bg)", color: "var(--g-fg)" }}>
      <div style={{ position: "fixed", top: "0", left: "0", right: "0", height: "5px", zIndex: "20", background: "rgba(var(--g-fg-rgb), .15)" }}><div style={{ height: "100%", background: "#f7badd", width: `${progressPct}` }}></div></div>

  

      <main style={{ maxWidth: "1180px", margin: "0 auto", padding: "28px clamp(16px,4vw,48px) 96px", display: "grid", gap: "40px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <a href="/library" onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: "8px", font: "600 15px/1 'Figtree'", textDecoration: "none" }}><span style={{ display: "grid", placeItems: "center", width: "36px", height: "36px", borderRadius: "50%", border: "2px solid var(--g-fg)" }}>←</span>Back to Library</a>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ padding: "7px 12px", borderRadius: "99px", background: "#769ebe", color: "#2a1a19", font: "700 13px/1 'Figtree'" }}>Menopause</span>
            <span style={{ padding: "7px 12px", borderRadius: "99px", border: "1.5px solid var(--g-fg)", font: "600 13px/1 'Figtree'" }}>Vaginal health</span>
            <span style={{ padding: "7px 12px", borderRadius: "99px", border: "1.5px solid var(--g-fg)", font: "600 13px/1 'Figtree'" }}>{readLabel}</span>
          </div>
        </div>

        <section style={{ display: "grid", gap: "22px", maxWidth: "900px" }}>
          <h1 style={{ margin: "0", font: "400 clamp(38px,5.2vw,68px)/1.04 'ayna Display',Georgia,serif", letterSpacing: "-.01em", textWrap: "balance" }}>What is vaginal atrophy / <em style={{ color: "var(--g-pink)" }}>genitourinary syndrome of menopause (GSM)?</em></h1>
          <p style={{ margin: "0", font: "400 clamp(19px,1.8vw,23px)/1.5 'Figtree'", maxWidth: "56ch", textWrap: "pretty" }}>A common, highly treatable group of genital and urinary symptoms that can show up when estrogen levels drop.</p>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", font: "600 14px/1 'Figtree'" }}><span style={{ padding: "6px 11px", borderRadius: "99px", background: "#f7badd", color: "#3e2723", fontWeight: "700" }}>BUNI × ayna</span>Medical article</div>
          {credits}
        </section>

        <figure style={{ margin: "0" }}>
          <div style={{ aspectRatio: "3/2", maxHeight: "620px", borderRadius: "28px", overflow: "hidden", border: "2px solid var(--g-fg)", background: "#fdf3f2" }}>
            <img src={IMG.hero} alt="Illustration: estrogen levels falling across a woman's life, from young adult to older age" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
        </figure>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))", gap: "56px", alignItems: "start" }}>
      
            <aside style={{ position: "sticky", top: "28px", display: "grid", gap: "14px", maxWidth: "260px" }}>
              <span style={{ font: "700 12px/1 'Figtree'", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--g-pink)" }}>In this article</span>
              <nav style={{ display: "grid", gap: "4px" }}>
                <a href="#what" onClick={jump} style={{ display: "grid", gridTemplateColumns: "24px 1fr", gap: "8px", padding: "8px 0", font: "500 15px/1.35 'Figtree'", textDecoration: "none", borderBottom: "1px solid rgba(var(--g-fg-rgb), .25)" }}><span style={{ color: "var(--g-pink)", fontWeight: "700" }}>01</span>What GSM is</a>
                <a href="#where" onClick={jump} style={{ display: "grid", gridTemplateColumns: "24px 1fr", gap: "8px", padding: "8px 0", font: "500 15px/1.35 'Figtree'", textDecoration: "none", borderBottom: "1px solid rgba(var(--g-fg-rgb), .25)" }}><span style={{ color: "var(--g-pink)", fontWeight: "700" }}>02</span>Where it shows up</a>
                <a href="#symptoms" onClick={jump} style={{ display: "grid", gridTemplateColumns: "24px 1fr", gap: "8px", padding: "8px 0", font: "500 15px/1.35 'Figtree'", textDecoration: "none", borderBottom: "1px solid rgba(var(--g-fg-rgb), .25)" }}><span style={{ color: "var(--g-pink)", fontWeight: "700" }}>03</span>Common symptoms</a>
                <a href="#treatment" onClick={jump} style={{ display: "grid", gridTemplateColumns: "24px 1fr", gap: "8px", padding: "8px 0", font: "500 15px/1.35 'Figtree'", textDecoration: "none", borderBottom: "1px solid rgba(var(--g-fg-rgb), .25)" }}><span style={{ color: "var(--g-pink)", fontWeight: "700" }}>04</span>Diagnosis &amp; first steps</a>
                <a href="#estrogen" onClick={jump} style={{ display: "grid", gridTemplateColumns: "24px 1fr", gap: "8px", padding: "8px 0", font: "500 15px/1.35 'Figtree'", textDecoration: "none", borderBottom: "1px solid rgba(var(--g-fg-rgb), .25)" }}><span style={{ color: "var(--g-pink)", fontWeight: "700" }}>05</span>Topical estrogen</a>
                <a href="#stigma" onClick={jump} style={{ display: "grid", gridTemplateColumns: "24px 1fr", gap: "8px", padding: "8px 0", font: "500 15px/1.35 'Figtree'", textDecoration: "none", borderBottom: "1px solid rgba(var(--g-fg-rgb), .25)" }}><span style={{ color: "var(--g-pink)", fontWeight: "700" }}>06</span>Eliminating the stigma</a>
                <a href="#care" onClick={jump} style={{ padding: "8px 0", font: "500 15px/1.35 'Figtree'", textDecoration: "none", borderBottom: "1px solid rgba(var(--g-fg-rgb), .25)" }}>When to seek care</a>
                <a href="#refs" onClick={jump} style={{ padding: "8px 0", font: "500 15px/1.35 'Figtree'", textDecoration: "none" }}>Sources</a>
              </nav>
            </aside>
      

          <article style={{ gridColumn: "span 2", display: "grid", gap: "56px", maxWidth: "700px", minWidth: "0", font: "400 19px/1.75 'Figtree'" }}>

            <section id="what" style={{ display: "grid", gap: "20px", scrollMarginTop: "24px" }}>
              <div style={{ display: "grid", gap: "10px" }}><span style={{ font: "400 64px/.9 'ayna Display',serif", color: "var(--g-pink)" }}>01</span><h2 style={{ margin: "0", font: "400 clamp(30px,3.2vw,40px)/1.1 'ayna Display',serif", textWrap: "balance" }}>What GSM is</h2></div>
              <p style={{ margin: "0", textWrap: "pretty" }}><span style={{ float: "left", margin: "6px 10px 0 0", font: "400 76px/.8 'ayna Display',serif", color: "var(--g-pink)" }}>G</span>enitourinary syndrome of menopause (GSM), previously called vaginal atrophy or atrophic vulvovaginitis, is a group of symptoms that occur in the genital and urinary areas when the body's estrogen levels drop around and after menopause.</p>
              <p style={{ margin: "0" }}>A decline in estrogen can happen for many other reasons other than perimenopause and menopause, including:</p>
              <ul style={{ margin: "0", padding: "0", listStyle: "none", display: "grid", border: "2px solid var(--g-fg)", borderRadius: "20px", overflow: "hidden" }}>
                <li style={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: "12px", padding: "14px 20px", font: "400 16px/1.55 'Figtree'" }}><span style={{ color: "var(--g-pink)", fontWeight: "700" }}>→</span>During breastfeeding</li>
                <li style={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: "12px", padding: "14px 20px", borderTop: "1.5px solid rgba(var(--g-fg-rgb), .3)", font: "400 16px/1.55 'Figtree'" }}><span style={{ color: "var(--g-pink)", fontWeight: "700" }}>→</span>After surgical removal of the ovaries</li>
                <li style={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: "12px", padding: "14px 20px", borderTop: "1.5px solid rgba(var(--g-fg-rgb), .3)", font: "400 16px/1.55 'Figtree'" }}><span style={{ color: "var(--g-pink)", fontWeight: "700" }}>→</span><span>Due to certain autoimmune conditions (when the body's immune system mistakenly attacks its own healthy cells and tissues)</span></li>
                <li style={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: "12px", padding: "14px 20px", borderTop: "1.5px solid rgba(var(--g-fg-rgb), .3)", font: "400 16px/1.55 'Figtree'" }}><span style={{ color: "var(--g-pink)", fontWeight: "700" }}>→</span><span>While taking medications that impact estrogen level (e.g. birth control or hormonal therapy for breast cancer)</span></li>
              </ul>
            </section>

            <section id="where" style={{ display: "grid", gap: "20px", scrollMarginTop: "24px" }}>
              <div style={{ display: "grid", gap: "10px" }}><span style={{ font: "400 64px/.9 'ayna Display',serif", color: "var(--g-pink)" }}>02</span><h2 style={{ margin: "0", font: "400 clamp(30px,3.2vw,40px)/1.1 'ayna Display',serif", textWrap: "balance" }}>Where it shows up</h2></div>
              <p style={{ margin: "0" }}>GSM affects tissues of the vulva (the outer genital area), the vagina, the urethra (the tube where urine passes through), and the bladder.</p>
              <figure style={{ margin: "0" }}><div style={{ aspectRatio: "3/2", borderRadius: "24px", overflow: "hidden", border: "2px solid var(--g-fg)", background: "#fdf3f2" }}><img src={IMG.anatomy} alt="Diagram of the vulva, vagina, urethra and bladder" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /></div></figure>
              <div style={{ display: "grid", gap: "10px", padding: "24px 26px", borderRadius: "24px", background: "#769ebe", color: "#2a1a19" }}>
                <span style={{ font: "700 12px/1 'Figtree'", letterSpacing: ".08em", textTransform: "uppercase" }}>Why the new name</span>
                <p style={{ margin: "0", font: "400 18px/1.6 'Figtree'" }}>Because these estrogen-related changes involve both the genital and urinary systems, we now call it genitourinary syndrome of menopause. This term is more representative of the range of affected tissues and related symptoms.</p>
              </div>
            </section>

            <section id="symptoms" style={{ display: "grid", gap: "20px", scrollMarginTop: "24px" }}>
              <div style={{ display: "grid", gap: "10px" }}><span style={{ font: "400 64px/.9 'ayna Display',serif", color: "var(--g-pink)" }}>03</span><h2 style={{ margin: "0", font: "400 clamp(30px,3.2vw,40px)/1.1 'ayna Display',serif", textWrap: "balance" }}>Common symptoms</h2></div>
              <p style={{ margin: "0" }}>The most common symptoms of GSM include dryness and thinning of the vaginal walls (which can result in painful intercourse) and urinary urgency paired with recurrent urinary tract infections (UTIs). People diagnosed with GSM may also experience burning/itching in the vagina or vulva.</p>
              <figure style={{ margin: "0" }}><div style={{ aspectRatio: "1740/596", borderRadius: "24px", overflow: "hidden", border: "2px solid var(--g-fg)", background: "#fff" }}><img src={IMG.symptoms} alt="Common symptoms of GSM: vaginal dryness, itching or irritation, discomfort during sex, urinary symptoms, reduced lubrication" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /></div></figure>
            </section>

            <section id="treatment" style={{ display: "grid", gap: "20px", scrollMarginTop: "24px" }}>
              <div style={{ display: "grid", gap: "10px" }}><span style={{ font: "400 64px/.9 'ayna Display',serif", color: "var(--g-pink)" }}>04</span><h2 style={{ margin: "0", font: "400 clamp(30px,3.2vw,40px)/1.1 'ayna Display',serif", textWrap: "balance" }}>Diagnosis &amp; first steps</h2></div>
              <div style={{ display: "grid", gap: "10px", padding: "24px 26px", borderRadius: "24px", background: "#f7badd", color: "#3e2723" }}>
                <span style={{ font: "700 12px/1 'Figtree'", letterSpacing: ".08em", textTransform: "uppercase" }}>The good news</span>
                <p style={{ margin: "0", font: "400 18px/1.6 'Figtree'" }}>While these symptoms undoubtedly cause discomfort and irritation, GSM can be diagnosed with one physical exam, and a variety of treatment options are available.</p>
              </div>
              <p style={{ margin: "0" }}>Your medical provider can diagnose GSM based on your symptoms and a pelvic exam to note any vaginal or vulvar changes. Some traditional treatment options include vaginal lubricants or moisturizers that can significantly improve vaginal dryness.</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,200px),1fr))", gap: "12px" }}>
                <div style={{ display: "grid", gap: "10px", alignContent: "start", padding: "22px", borderRadius: "22px", background: "var(--g-butter)", color: "#3e2723" }}>
                  <strong style={{ font: "400 24px/1.15 'ayna Display',serif" }}>Vaginal lubricants</strong>
                  <span style={{ font: "400 16px/1.6 'Figtree'" }}>Used during sex and helpful in reducing some of the intercourse discomfort caused by GSM symptoms.</span>
                </div>
                <div style={{ display: "grid", gap: "10px", alignContent: "start", padding: "22px", borderRadius: "22px", background: "var(--g-butter)", color: "#3e2723" }}>
                  <strong style={{ font: "400 24px/1.15 'ayna Display',serif" }}>Vaginal moisturizers</strong>
                  <span style={{ font: "400 16px/1.6 'Figtree'" }}>Also treat vaginal dryness, but are generally inserted every 1–3 days as the formulas are longer-acting.</span>
                </div>
                <div style={{ display: "grid", gap: "10px", alignContent: "start", padding: "22px", borderRadius: "22px", background: "#769ebe", color: "#2a1a19" }}>
                  <strong style={{ font: "400 24px/1.15 'ayna Display',serif" }}>Vulvar skin protectants</strong>
                  <span style={{ font: "400 16px/1.6 'Figtree'" }}>Specially formulated for this area of the body to treat external dryness, and an important part of treating GSM.</span>
                </div>
              </div>
              <figure style={{ margin: "0" }}><div style={{ aspectRatio: "784/502", borderRadius: "24px", overflow: "hidden", border: "2px solid var(--g-fg)", background: "#fbeef0", transform: "rotate(-1deg)" }}><img src={IMG.lubes} alt="Illustration of a vaginal lubricant and moisturizer" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /></div></figure>
          
                <div style={{ display: "grid", borderRadius: "24px", border: "2px solid var(--g-fg)", overflow: "hidden" }}>
                  <div style={{ display: "grid", gap: "8px", padding: "22px 24px 0" }}><h3 style={{ margin: "0", font: "400 26px/1.15 'ayna Display',serif" }}>Explore our recommendations</h3><p style={{ margin: "0", font: "400 17px/1.65 'Figtree'" }}>Vaginal lubricants and moisturizers, as well as vulvar skin protectants.</p></div>
                  <ul style={{ display: "grid", gap: "10px", margin: "16px 0 0", padding: "0 16px", listStyle: "none" }}>
                    <li style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "14px 16px", borderRadius: "18px", background: "var(--g-butter)", color: "#3e2723" }}><strong style={{ font: "700 16px/1.35 'Figtree'" }}>Vaginal lubricants</strong><a className="ay-read__btn" href="/shop?q=vaginal%20lubricant" style={{ display: "inline-flex", alignItems: "center", minHeight: "44px", padding: "0 16px", borderRadius: "99px", background: "#3e2723", color: "#ffedac", font: "700 14px/1 'Figtree'", textDecoration: "none", whiteSpace: "nowrap" }}>See on ayna →</a></li>
                    <li style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "14px 16px", borderRadius: "18px", background: "var(--g-butter)", color: "#3e2723" }}><strong style={{ font: "700 16px/1.35 'Figtree'" }}>Vaginal moisturizers</strong><a className="ay-read__btn" href="/shop?q=vaginal%20moisturizer" style={{ display: "inline-flex", alignItems: "center", minHeight: "44px", padding: "0 16px", borderRadius: "99px", background: "#3e2723", color: "#ffedac", font: "700 14px/1 'Figtree'", textDecoration: "none", whiteSpace: "nowrap" }}>See on ayna →</a></li>
                    <li style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "14px 16px", borderRadius: "18px", background: "var(--g-butter)", color: "#3e2723" }}><strong style={{ font: "700 16px/1.35 'Figtree'" }}>Vulvar skin protectants</strong><a className="ay-read__btn" href="/shop?q=vulvar%20skin%20protectant" style={{ display: "inline-flex", alignItems: "center", minHeight: "44px", padding: "0 16px", borderRadius: "99px", background: "#3e2723", color: "#ffedac", font: "700 14px/1 'Figtree'", textDecoration: "none", whiteSpace: "nowrap" }}>See on ayna →</a></li>
                  </ul>
                  <div style={{ marginTop: "20px", padding: "14px 24px", borderTop: "1.5px solid rgba(var(--g-fg-rgb), .3)", font: "500 13px/1.5 'Figtree'" }}>BUNI is an ayna brand partner. <a href="/how-we-make-money">How we make money</a></div>
                </div>
          
            </section>

            <section id="estrogen" style={{ display: "grid", gap: "20px", scrollMarginTop: "24px" }}>
              <div style={{ display: "grid", gap: "10px" }}><span style={{ font: "400 64px/.9 'ayna Display',serif", color: "var(--g-pink)" }}>05</span><h2 style={{ margin: "0", font: "400 clamp(30px,3.2vw,40px)/1.1 'ayna Display',serif", textWrap: "balance" }}>When symptoms persist: topical estrogen</h2></div>
              <p style={{ margin: "0" }}>If symptoms continue to persist despite use of vaginal moisturizers and lubricants, your provider may recommend use of topical estrogen in the form of vaginal creams, tablets, or rings.</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))", gap: "24px", alignItems: "center" }}>
                <div style={{ aspectRatio: "832/562", borderRadius: "24px", overflow: "hidden", border: "2px solid var(--g-fg)", background: "#e4e2f6", transform: "rotate(-2deg)" }}><img src={IMG.topical} alt="Illustration of vaginal estrogen as a cream, tablet or ring" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /></div>
                <p style={{ margin: "0", font: "400 clamp(28px,3.2vw,38px)/1.15 'ayna Display',serif", color: "var(--g-pink)" }}>Creams, tablets, or rings, targeting the affected tissues directly.</p>
              </div>
              <p style={{ margin: "0" }}>These topical treatments alleviate the symptoms of GSM that are driven by estrogen decline by directly targeting the affected tissues with low dose estrogen. This is a more targeted approach than hormonal estrogen pills, systemic patches, or gels, although these can be especially useful treatments for women who have other menopausal symptoms.</p>
              <figure style={{ margin: "0" }}><div style={{ aspectRatio: "1630/464", borderRadius: "24px", overflow: "hidden", border: "2px solid var(--g-fg)", background: "#fbf6e6" }}><img src={IMG.systemic} alt="Illustration of systemic estrogen reaching the whole body compared with local vaginal estrogen" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /></div></figure>
              <dl style={{ margin: "0", display: "grid", border: "2px solid var(--g-fg)", borderRadius: "20px", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(110px,150px) 1fr", gap: "14px", padding: "14px 20px" }}><dt style={{ font: "700 13px/1.6 'Figtree'", letterSpacing: ".06em", textTransform: "uppercase", color: "var(--g-pink)" }}>Systemic</dt><dd style={{ margin: "0", font: "400 16px/1.55 'Figtree'" }}>Pills, patches, or gels increase estrogen levels throughout the whole body.</dd></div>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(110px,150px) 1fr", gap: "14px", padding: "14px 20px", borderTop: "1.5px solid rgba(var(--g-fg-rgb), .3)" }}><dt style={{ font: "700 13px/1.6 'Figtree'", letterSpacing: ".06em", textTransform: "uppercase", color: "var(--g-pink)" }}>Topical vaginal</dt><dd style={{ margin: "0", font: "400 16px/1.55 'Figtree'" }}>Low dose estrogen acting locally on the affected tissues, without raising levels body-wide.</dd></div>
              </dl>
              <div style={{ display: "grid", gap: "10px", padding: "24px 26px", borderRadius: "24px", background: "#f7badd", color: "#3e2723" }}>
                <span style={{ font: "700 12px/1 'Figtree'", letterSpacing: ".08em", textTransform: "uppercase" }}>Why it matters</span>
                <p style={{ margin: "0", font: "400 18px/1.6 'Figtree'" }}>Some women may not be able to take systemic therapy, but the vast majority of women can use locally acting topical options.</p>
              </div>
            </section>

            <section id="stigma" style={{ display: "grid", gap: "20px", scrollMarginTop: "24px" }}>
              <div style={{ display: "grid", gap: "10px" }}><span style={{ font: "400 64px/.9 'ayna Display',serif", color: "var(--g-pink)" }}>06</span><h2 style={{ margin: "0", font: "400 clamp(30px,3.2vw,40px)/1.1 'ayna Display',serif", textWrap: "balance" }}>Eliminating the stigma</h2></div>
              <p style={{ margin: "0" }}>GSM symptoms are not something that fade over time. In fact they usually worsen and require treatment for improvement.</p>
              <blockquote style={{ margin: "6px 0", padding: "0", font: "400 italic clamp(26px,2.8vw,32px)/1.25 'ayna Display',serif", color: "var(--g-pink)", textWrap: "balance" }}>GSM impacts roughly half or more of women after menopause.</blockquote>
              <p style={{ margin: "0" }}>Despite GSM being fairly common, stigma around it can cause many women to feel uncomfortable speaking with their providers about this highly treatable condition. If you are reading this article and feel that you may be experiencing symptoms of GSM, we encourage you to speak with your medical provider about it.</p>
              <figure style={{ margin: "0" }}><div style={{ aspectRatio: "3/2", borderRadius: "24px", overflow: "hidden", border: "2px solid var(--g-fg)", background: "#fdf6ee" }}><img src={IMG.stigma} alt="Illustration of a woman moving from feeling isolated to talking with her clinician" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /></div></figure>
            </section>

            <section id="care" style={{ display: "grid", gap: "18px", padding: "30px", borderRadius: "28px", background: "var(--g-butter)", color: "#3e2723", scrollMarginTop: "24px" }}>
              <h2 style={{ margin: "0", font: "400 clamp(28px,3vw,36px)/1.12 'ayna Display',serif", textWrap: "balance" }}>When to seek care</h2>
              <ul style={{ margin: "0", padding: "0", listStyle: "none", display: "grid", gap: "0" }}>
                <li style={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: "10px", padding: "12px 0", font: "700 17px/1.6 'Figtree'" }}><span>!</span><span>Any vaginal bleeding after menopause (including bleeding after sex), as this always needs evaluation.</span></li>
                <li style={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: "10px", padding: "12px 0", borderTop: "1.5px solid rgba(62,39,35,.25)", font: "400 17px/1.6 'Figtree'" }}><span>•</span><span>Unusual vaginal discharge</span></li>
                <li style={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: "10px", padding: "12px 0", borderTop: "1.5px solid rgba(62,39,35,.25)", font: "400 17px/1.6 'Figtree'" }}><span>•</span><span>Any signs of fever, back or side pain, or blood in the urine</span></li>
                <li style={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: "10px", padding: "12px 0", borderTop: "1.5px solid rgba(62,39,35,.25)", font: "400 17px/1.6 'Figtree'" }}><span>•</span><span>Symptoms that do not improve with over-the-counter moisturizers and lubricants</span></li>
              </ul>
            </section>

            <div style={{ display: "grid", gap: "14px", padding: "32px 30px", borderRadius: "28px", background: "#f7badd", color: "#3e2723" }}>
              <p style={{ margin: "0", font: "400 clamp(26px,2.8vw,34px)/1.2 'ayna Display',serif", textWrap: "balance" }}>You know your body best.</p>
              <p style={{ margin: "0", font: "400 17px/1.65 'Figtree'" }}>GSM often goes undiagnosed or untreated despite there being a variety of treatment options that can make you feel more comfortable. If something feels off, and if you are experiencing these symptoms, we would like to empower you to speak with your providers.</p>
            </div>

            <section id="refs" style={{ display: "grid", gap: "14px", paddingTop: "28px", borderTop: "1.5px solid var(--g-fg)", scrollMarginTop: "24px" }}>
              <h2 style={{ margin: "0", font: "400 28px/1.15 'ayna Display',serif" }}>Sources</h2>
              <ol style={{ margin: "0", padding: "0", listStyle: "none", display: "grid" }}>
                <li style={{ display: "grid", gridTemplateColumns: "32px 1fr", gap: "10px", padding: "14px 0", borderBottom: "1px solid rgba(var(--g-fg-rgb), .25)", font: "400 15px/1.6 'Figtree'" }}><span style={{ fontWeight: "700", color: "var(--g-pink)" }}>1</span><a href="https://www.mayoclinic.org/diseases-conditions/vaginal-atrophy/symptoms-causes/syc-20352288" target="_blank" rel="noopener noreferrer" style={{ fontWeight: "600" }}>Mayo Clinic – Vaginal atrophy ↗</a></li>
                <li style={{ display: "grid", gridTemplateColumns: "32px 1fr", gap: "10px", padding: "14px 0", borderBottom: "1px solid rgba(var(--g-fg-rgb), .25)", font: "400 15px/1.6 'Figtree'" }}><span style={{ fontWeight: "700", color: "var(--g-pink)" }}>2</span><a href="https://www.auanet.org/guidelines-and-quality/guidelines/genitourinary-syndrome-of-menopause" target="_blank" rel="noopener noreferrer" style={{ fontWeight: "600" }}>American Urological Association – Genitourinary Syndrome of Menopause ↗</a></li>
                <li style={{ display: "grid", gridTemplateColumns: "32px 1fr", gap: "10px", padding: "14px 0", font: "400 15px/1.6 'Figtree'" }}><span style={{ fontWeight: "700", color: "var(--g-pink)" }}>3</span><a href="https://my.clevelandclinic.org/health/diseases/15500-vaginal-atrophy" target="_blank" rel="noopener noreferrer" style={{ fontWeight: "600" }}>Cleveland Clinic – Vaginal atrophy ↗</a></li>
              </ol>
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
  );
}
