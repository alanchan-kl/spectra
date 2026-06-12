/**
 * k6 runs in its own (Goja) runtime, so it can't import `@spectra/shared`.
 * This standalone resolver mirrors the same SYSTEM/ENV multi-system pattern,
 * reading from k6's `__ENV` (populate via `k6 run -e SYSTEM=... -e ENV=...`).
 */
type EnvName = 'dev' | 'staging' | 'prod';
type SystemName = 'system-a' | 'system-b';

const API_BASE_URLS: Record<SystemName, Record<EnvName, string>> = {
  'system-a': {
    dev: 'https://jsonplaceholder.typicode.com',
    staging: 'https://jsonplaceholder.typicode.com',
    prod: 'https://jsonplaceholder.typicode.com',
  },
  'system-b': {
    dev: 'https://api-dev.example.com',
    staging: 'https://api-staging.example.com',
    prod: 'https://api.example.com',
  },
};

/**
 * Resolve the API base URL. An explicit `BASE_URL` always wins (e.g. point at a
 * local mock with `-e BASE_URL=http://mockapi`); otherwise resolve from
 * SYSTEM + ENV.
 */
export function apiBaseUrl(): string {
  if (__ENV.BASE_URL) return __ENV.BASE_URL;
  const system = (__ENV.SYSTEM ?? 'system-a') as SystemName;
  const env = (__ENV.ENV ?? 'dev') as EnvName;
  return API_BASE_URLS[system][env];
}
