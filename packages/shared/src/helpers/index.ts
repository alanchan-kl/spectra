/** Pause for a number of milliseconds. Prefer tool-native waits where possible. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface RetryOptions {
  /** Maximum attempts (including the first). */
  retries?: number;
  /** Delay between attempts in milliseconds. */
  delayMs?: number;
}

/**
 * Retry an async function until it resolves or attempts are exhausted.
 * Useful for eventually-consistent API checks.
 */
export async function retry<T>(
  fn: () => Promise<T>,
  { retries = 3, delayMs = 1000 }: RetryOptions = {},
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < retries) await sleep(delayMs);
    }
  }
  throw lastError;
}

/** Format a number as a currency string (defaults to USD). */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(
    amount,
  );
}
