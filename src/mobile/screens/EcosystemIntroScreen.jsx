import { useState } from 'react';
import MobileHeader from '../components/MobileHeader.jsx';

export default function EcosystemIntroScreen({ onStartQuiz, onAlreadyHaveAccount, onAboutAyna, authUser, onOpenSaved, onBrowse, onGoCommunity, headerInitial = 'A', onOpenProfile }) {
  const [focus, setFocus] = useState('Goals');
  return <main className="ayna-ecosystem-start">
    <MobileHeader variant="light" activeTab="eco" initial={headerInitial} onOpenSaved={onOpenSaved} onGoBrowse={onBrowse} onGoCommunity={onGoCommunity} onOpenProfile={onOpenProfile} />
    <div className="ayna-ecosystem-start-scroll">
      <h1>Make it<br /><em>yours.</em></h1>
      <div className="ayna-context-orbit" aria-label="Explore what shapes your Ecosystem" data-focus={focus.toLowerCase()}>
        <svg aria-hidden="true" viewBox="0 0 320 280"><path className="goals" d="M160 140 85 55" /><path className="health" d="M160 140 248 89" /><path className="preferences" d="M160 140 119 230" /></svg>
        <span className="ayna-context-you">you<small>{focus}</small></span>
        {['Goals', 'Health', 'Preferences'].map((item) => <button key={item} type="button" className={`ayna-context-${item.toLowerCase()}`} aria-pressed={focus === item} onClick={() => setFocus(item)}>{item}</button>)}
      </div>
      <div className="ayna-ecosystem-start-actions">
        <button type="button" className="ayna-ecosystem-start-primary" onClick={onStartQuiz}>Start intake</button>
        <div>{!authUser && <button type="button" onClick={onAlreadyHaveAccount}>Sign in</button>}<button type="button" onClick={onAboutAyna}>About us</button></div>
      </div>
    </div>
  </main>;
}
