import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Clarity from '@microsoft/clarity';
import App from './App';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // SW no crítico — fallo silencioso
    });
  });
}

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

const clarityProjectId = import.meta.env.VITE_CLARITY_PROJECT_ID as string | undefined;
if (clarityProjectId) {
  Clarity.init(clarityProjectId);
}

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>
);
