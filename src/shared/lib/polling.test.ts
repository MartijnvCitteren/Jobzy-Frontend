import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { pollUntil } from './polling';

describe('pollUntil', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves as soon as isDone returns true', async () => {
    let calls = 0;
    const fn = vi.fn(async () => {
      calls += 1;
      return calls;
    });
    const isDone = (value: number) => value >= 3;

    const promise = pollUntil(fn, isDone, { intervalMs: 100, timeoutMs: 10000 });

    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(100);

    const result = await promise;

    expect(result).toBe(3);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('rejects once timeoutMs elapses without isDone becoming true', async () => {
    const fn = vi.fn(async () => 'still-pending');
    const isDone = () => false;

    const promise = pollUntil(fn, isDone, { intervalMs: 100, timeoutMs: 250 });
    const assertion = expect(promise).rejects.toThrow(/timed out/i);

    await vi.advanceTimersByTimeAsync(300);

    await assertion;
  });

  it('stops polling (no further calls) once resolved', async () => {
    let calls = 0;
    const fn = vi.fn(async () => {
      calls += 1;
      return calls;
    });
    const isDone = (value: number) => value >= 1;

    await pollUntil(fn, isDone, { intervalMs: 50, timeoutMs: 10000 });
    const callsAfterResolve = vi.mocked(fn).mock.calls.length;

    await vi.advanceTimersByTimeAsync(500);

    expect(vi.mocked(fn).mock.calls.length).toBe(callsAfterResolve);
  });
});
