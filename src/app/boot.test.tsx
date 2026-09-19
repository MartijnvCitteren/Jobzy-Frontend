import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, waitFor } from '@testing-library/react';

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

describe('bootApp', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('renders the app (Step 1) given a valid runtime config', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse(200, { apiBaseUrl: 'http://localhost:8080' })),
    );
    const { bootApp } = await import('./boot');

    await act(async () => { await bootApp(container); });

    await waitFor(() => expect(container.textContent).toContain('Basisgegevens'));
  });

  it('renders a visible fail-fast error screen given an invalid runtime config, with no silent fallback', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(404, {})));
    const { bootApp } = await import('./boot');

    await act(async () => { await bootApp(container); });

    await waitFor(() => expect(container.querySelector('[role="alert"]')).toBeTruthy());
    expect(container.textContent).not.toContain('Basisgegevens');
  });
});
