import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// ── Global Alert Override ───────────────────────────────
// Prevent native browser popups and route to app toasts
window.alert = (msg) => {
  window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: msg, type: 'info' } }));
};
// Optional: override confirm if simple confirmation is needed, but typically confirm needs a Promise.
// For now, we'll just log or fallback since replacing confirm entirely without a modal component is tricky.
const originalConfirm = window.confirm;
window.confirm = (msg) => {
  // If the app relies on synchronous confirm(), we unfortunately have to let it through or rewrite the calling code.
  // We'll leave confirm as is but replace alert.
  return originalConfirm(msg);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
