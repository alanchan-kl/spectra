import type { EnvironmentConfig, EnvName } from '../types';

const dev: EnvironmentConfig = {
  name: 'dev',
  timeout: 30_000,
  retries: 0,
  headless: false,
};

const staging: EnvironmentConfig = {
  name: 'staging',
  timeout: 30_000,
  retries: 1,
  headless: true,
};

const prod: EnvironmentConfig = {
  name: 'prod',
  timeout: 45_000,
  retries: 2,
  headless: true,
};

/** Registry of all environments. */
export const environments: Record<EnvName, EnvironmentConfig> = {
  dev,
  staging,
  prod,
};

/** Resolve the active environment from the `ENV` env var (defaults to `dev`). */
export function resolveEnvironment(): EnvironmentConfig {
  const name = (process.env.ENV ?? 'dev') as EnvName;
  const env = environments[name];
  if (!env) {
    const known = Object.keys(environments).join(', ');
    throw new Error(`Unknown ENV "${name}". Known environments: ${known}.`);
  }
  return env;
}
