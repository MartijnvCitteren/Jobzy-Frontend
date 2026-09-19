export interface PollOptions {
  intervalMs: number;
  timeoutMs: number;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Repeatedly calls `fn`, waiting `intervalMs` between calls, until `isDone(result)` is
 * true (resolves with that result) or `timeoutMs` elapses (rejects). Never leaves a
 * dangling timer once settled.
 */
export async function pollUntil<T>(
  fn: () => Promise<T>,
  isDone: (result: T) => boolean,
  { intervalMs, timeoutMs }: PollOptions,
): Promise<T> {
  const deadline = Date.now() + timeoutMs;

  while (true) {
    const result = await fn();
    if (isDone(result)) {
      return result;
    }
    if (Date.now() >= deadline) {
      throw new Error(`pollUntil timed out after ${timeoutMs}ms.`);
    }
    await delay(intervalMs);
    if (Date.now() >= deadline) {
      throw new Error(`pollUntil timed out after ${timeoutMs}ms.`);
    }
  }
}
