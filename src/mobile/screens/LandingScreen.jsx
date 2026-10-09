import { ALL_PRODUCTS } from '../../data/products.js';
import ProductImage from '../components/ProductImage.jsx';

const campaignProducts = ['p-lola-pad', 'p-spearmint-pcos', 'p-portable-heating']
  .map((id) => ALL_PRODUCTS.find((product) => product.id === id))
  .filter(Boolean);

export default function LandingScreen({ onStartQuiz, onBrowse, onAlreadyHaveAccount, onAboutAyna }) {
  return (
    <main className="ayna-fresh-welcome ayna-cover ayna-cabinet-cover">
      <header className="ayna-cover-top">
        <span className="ayna-fresh-wordmark">ayna</span>
        <button type="button" onClick={onAlreadyHaveAccount}>Sign in</button>
      </header>

      <section className="ayna-cover-story" aria-labelledby="ayna-cover-title">
        <div className="ayna-cover-still-life" aria-label="Real products in the ayna catalog">
          {campaignProducts.map((product, index) => <div className={`ayna-cover-object ayna-cover-object-${index + 1}`} key={product.id}>
            <ProductImage src={product.image || product.imageUrl || product.images?.[0]} alt={product.name} />
          </div>)}
          <span className="ayna-cover-shelf" aria-hidden="true" />
        </div>
        <div className="ayna-cover-intro"><h1 id="ayna-cover-title">Health,<br /><em>matched to you.</em></h1><p>Products · care · answers</p></div>
      </section>

      <section className="ayna-cover-actions" aria-label="Get started">
        <button className="ayna-cover-start" type="button" onClick={onStartQuiz}><span>Get matched</span><span className="ayna-cover-arrow" aria-hidden="true">→</span></button>
        <div className="ayna-cover-secondary"><button type="button" onClick={onBrowse}>Just browsing</button><button type="button" onClick={onAboutAyna}>About us</button></div>
      </section>
    </main>
  );
}
