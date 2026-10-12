// Website only: the standalone pages the app reaches from its menus, plus
// the legal links a public site needs on every page.
const LINKS = [
  ['How it works', '/how-it-works'],
  ['About', '/about'],
  ['How we make money', '/how-we-make-money'],
  ['Contact', '/contact'],
  ['Privacy', '/privacy-policy'],
  ['Terms', '/terms-of-use'],
];

export default function WebFooter() {
  return <footer className="ay-web-footer">
    <span className="ay-web-footer__mark">ayna</span>
    <nav aria-label="More">
      {LINKS.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
    </nav>
    <p>Wellness information only, not medical advice.</p>
  </footer>;
}
