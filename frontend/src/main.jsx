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
const originalConfirm = window.confirm;
window.confirm = (msg) => {
  return originalConfirm(msg);
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// Hide the boot spinner once React has mounted
const bootScreen = document.getElementById('app-boot-screen');
if (bootScreen) {
  // Small delay so React's first paint is visible before we fade out
  requestAnimationFrame(() => {
    bootScreen.classList.add('hidden');
    bootScreen.addEventListener('transitionend', () => bootScreen.remove(), { once: true });
  });
}
