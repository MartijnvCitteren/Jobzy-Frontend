import { bootApp } from './app/boot';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element (#root) not found.');
}

void bootApp(container);
