import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { KcPage } from './keycloak-theme/kc.gen';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element (#root) not found.');
}

// Keycloak serves this same bundle for its login pages and sets window.kcContext there.
// Only the matching entry is loaded, so the app and the theme don't weigh on each other.
if (window.kcContext) {
  createRoot(container).render(
    <StrictMode>
      <KcPage kcContext={window.kcContext} />
    </StrictMode>,
  );
} else {
  void import('./app/boot').then(({ bootApp }) => bootApp(container));
}
