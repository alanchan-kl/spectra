import type { Credentials, Platform, ResolvedConfig } from './types';
import { resolveSystem } from './systems/index';
import { resolveEnvironment } from './environments/index';

export * from './types';
export { systems, resolveSystem } from './systems/index';
export { environments, resolveEnvironment } from './environments/index';

/** Treat an unset OR empty/whitespace env var as absent. An undefined GitHub
 * Actions secret is injected as an empty string `""`, which `??` would NOT catch
 * — so without this an unset `TEST_PASSWORD` secret silently logs in blank. */
function envOr(value: string | undefined, fallback: string): string {
  return value && value.trim() !== '' ? value : fallback;
}

/**
 * Read credentials from environment variables. Credentials are NEVER committed;
 * CI supplies them as secrets. Falls back to the public Sauce Labs demo login so
 * the framework runs end-to-end out of the box (including when the CI secret is
 * unset and arrives as an empty string).
 */
function resolveCredentials(): Credentials {
  return {
    username: envOr(process.env.TEST_USERNAME, 'standard_user'),
    password: envOr(process.env.TEST_PASSWORD, 'secret_sauce'),
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
