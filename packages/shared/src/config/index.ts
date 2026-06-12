import type { Credentials, Platform, ResolvedConfig } from './types';
import { resolveSystem } from './systems/index';
import { resolveEnvironment } from './environments/index';

export * from './types';
export { systems, resolveSystem } from './systems/index';
export { environments, resolveEnvironment } from './environments/index';

/**
 * Read credentials from environment variables. Credentials are NEVER committed;
 * CI supplies them as secrets. Falls back to the public Sauce Labs demo login so
 * the framework runs end-to-end out of the box.
 */
function resolveCredentials(): Credentials {
  return {
    username: process.env.TEST_USERNAME ?? 'standard_user',
    password: process.env.TEST_PASSWORD ?? 'secret_sauce',
  };
}

/**
 * Resolve the full configuration for the current run by merging the active
 * system (`SYSTEM` env var) with the active environment (`ENV` env var) and
 * runtime credentials.
 *
 * @example
 *   SYSTEM=system-b ENV=staging  →  webBaseUrl = https://staging.example.com
 */
export function getConfig(): ResolvedConfig {
  const system = resolveSystem();
  const env = resolveEnvironment();
  const platform = (process.env.PLATFORM ?? 'android') as Platform;

  return {
    system: system.name,
    env: env.name,
    platform,
    webBaseUrl: system.web[env.name],
    apiBaseUrl: system.api[env.name],
    appId: system.mobile[platform],
    timeout: env.timeout,
    retries: env.retries,
    headless: env.headless,
    credentials: resolveCredentials(),
  };
}
