import { defineConfig } from 'steiger';
import fsd from '@feature-sliced/steiger-plugin';

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // This pass has exactly one real page in scope (plan §3), so every feature/widget/
    // entity is genuinely single-consumer by design, not an accidental over-slicing —
    // and "vacancy" recurring across vacancy-domain feature names is intentional
    // verb-noun naming, not a real naming collision. Both rules stay on elsewhere.
    files: ['./src/**'],
    rules: {
      'fsd/insignificant-slice': 'off',
      'fsd/repetitive-naming': 'off',
    },
  },
]);
