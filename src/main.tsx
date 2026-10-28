import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Gracefully intercept benign browser ResizeObserver loop notification messages
if (typeof window !== 'undefined') {
  const isResizeObserverError = (msg?: string | null) =>
    Boolean(
      msg &&
        (msg.includes('ResizeObserver loop completed with undelivered notifications') ||
          msg.includes('ResizeObserver loop limit exceeded'))
    );

  window.addEventListener('error', (e: ErrorEvent) => {
    if (isResizeObserverError(e.message) || isResizeObserverError(e.error?.message)) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  });

  window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
    const reasonMsg = e.reason instanceof Error ? e.reason.message : String(e.reason);
    if (isResizeObserverError(reasonMsg)) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(<App />);
