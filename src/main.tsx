import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress known-harmless HMR / WebSocket noise in sandboxed preview environments
const filterHmrNoise = (raw: any): boolean => {
  const msg = typeof raw === 'string' ? raw : raw?.message || '';
  return (
    msg.includes('WebSocket closed without opened') ||
    msg.includes('failed to connect to websocket')
  );
};

window.addEventListener(
  'unhandledrejection',
  (event) => {
    if (filterHmrNoise(event.reason)) {
      event.preventDefault();
      if (typeof event.stopImmediatePropagation === 'function') {
        event.stopImmediatePropagation();
      }
      console.debug('[dev-tooling] Suppressed known-harmless HMR socket noise.');
    }
  },
  true
);

window.addEventListener(
  'error',
  (event) => {
    if (filterHmrNoise(event.message) || filterHmrNoise(event.error)) {
      event.preventDefault();
      if (typeof event.stopImmediatePropagation === 'function') {
        event.stopImmediatePropagation();
      }
      console.debug('[dev-tooling] Suppressed known-harmless HMR socket error.');
    }
  },
  true
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
