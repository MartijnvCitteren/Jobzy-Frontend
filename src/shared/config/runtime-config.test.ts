import { afterEach, describe, expect, it, vi } from 'vitest';
import { RuntimeConfigError, getRuntimeConfig, loadRuntimeConfig } from './runtime-config';

describe('getRuntimeConfig before boot', () => {
  it('throws when called before boot resolves', () => {
    expect(() => getRuntimeConfig()).toThrow();
  });
});

describe('loadRuntimeConfig', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('throws RuntimeConfigError when the config file is missing (404)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({}),
      }),
    );

    await expect(loadRuntimeConfig()).rejects.toBeInstanceOf(RuntimeConfigError);
  });

  it('throws RuntimeConfigError on malformed JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw new SyntaxError('Unexpected token');
        },
      }),
    );

    await expect(loadRuntimeConfig()).rejects.toBeInstanceOf(RuntimeConfigError);
  });

  it('throws RuntimeConfigError when apiBaseUrl is missing, and does not fall back to a default URL', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      }),
    );

    await expect(loadRuntimeConfig()).rejects.toMatchObject({
      name: 'RuntimeConfigError',
    });
    expect(() => getRuntimeConfig()).toThrow();
  });

  it('throws RuntimeConfigError when apiBaseUrl is not a parseable URL', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ apiBaseUrl: 'not a url' }),
      }),
    );

    await expect(loadRuntimeConfig()).rejects.toBeInstanceOf(RuntimeConfigError);
  });

  it('throws RuntimeConfigError when the network request fails outright', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('Failed to fetch')),
    );

    await expect(loadRuntimeConfig()).rejects.toBeInstanceOf(RuntimeConfigError);
  });

  it('resolves with a valid config and makes it available via getRuntimeConfig', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ apiBaseUrl: 'http://localhost:8080' }),
      }),
    );

    const config = await loadRuntimeConfig();

    expect(config).toEqual({ apiBaseUrl: 'http://localhost:8080' });
    expect(getRuntimeConfig()).toEqual({ apiBaseUrl: 'http://localhost:8080' });
  });
});
