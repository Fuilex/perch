import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { applyAppearance } from './lib/appearance';
import './design/tokens.css';
import './design/glass.css';
import './design/typography.css';
import './styles/globals.css';
import './design/appearance.css';
import './design/motion.css';

// The stored settings arrive over IPC a moment later; this keeps the first paint
// from flashing the wrong theme.
applyAppearance(null);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
