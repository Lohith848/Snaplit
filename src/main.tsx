import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#000;color:#fff;font-family:system-ui;text-align:center;padding:20px"><div><h1 style="color:#FFB800;margin-bottom:20px">Error</h1><p>Root element not found. Please refresh the page.</p></div></div>';
  throw new Error('Root element not found');
}

try {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
} catch (error) {
  console.error('Failed to render app:', error);
  rootElement.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#000;color:#ff6b6b;font-family:system-ui;text-align:center;padding:20px"><div><h1 style="margin-bottom:10px">App Error</h1><p style="font-size:14px">Something went wrong. Try refreshing the page.</p><button onclick="location.reload()" style="margin-top:20px;padding:10px 20px;background:#FFB800;color:#000;border:none;border-radius:8px;cursor:pointer;font-weight:bold">Refresh</button></div></div>';
}


