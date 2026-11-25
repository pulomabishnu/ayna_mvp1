import '../polyfills.js';
import React from 'react';
import ReactDOM from 'react-dom/client';
import '../styles/fonts.css';
import '../styles/ay-tokens.css';
import './partner-studio.css';
import PartnerStudio from './PartnerStudio.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><PartnerStudio /></React.StrictMode>);
