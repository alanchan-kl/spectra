/** Names of the environments Spectra can target. */
export type EnvName = 'dev' | 'staging' | 'prod';

/** Names of the systems (apps under test) Spectra can target. */
export type SystemName = 'system-a' | 'system-b';

/** Mobile platforms Spectra can target. */
export type Platform = 'android' | 'ios';

/**
 * Per-system configuration. A system defines its URLs per environment plus
 * its mobile app identifiers. Add a new file under `config/systems/` and
 * register it in `systems/index.ts` to onboard another system.
 */
export interface SystemConfig {
  name: SystemName;
  displayName: string;
  /** Web base URL per environment. */
  web: Record<EnvName, string>;
  /** API base URL per environment. */
  api: Record<EnvName, string>;
  /**
   * Mobile app identifiers used by Maestro flows. Native iOS and Android apps
   * have different identifiers, so both are declared per system.
   */
  mobile: {
    /** Android package name (applicationId). */
    android: string;
    /** iOS bundle identifier (CFBundleIdentifier). */
    ios: string;
  };
}

/**
 * Per-environment configuration: behavioural knobs that apply regardless of
 * which system is under test (timeouts, retries, headless mode, ...).
 */
export interface EnvironmentConfig {
  name: EnvName;
  /** Default action/assertion timeout in milliseconds. */
  timeout: number;
  /** Number of retries on failure. */
  retries: number;
  /** Run browsers headless (true) or headed (false). */
  headless: boolean;
}

/** Credentials for the system under test, sourced from environment variables. */
export interface Credentials {
  username: string;
  password: string;
}

/**
 * Fully resolved configuration for a single test run — the merge of the active
 * {@link SystemConfig} and {@link EnvironmentConfig}, plus runtime credentials.
 * This is what test code consumes via `getConfig()`.
 */
export interface ResolvedConfig {
  system: SystemName;
  env: EnvName;
  platform: Platform;
  webBaseUrl: string;
  apiBaseUrl: string;
  /** App id for the active {@link Platform} (resolved from the `PLATFORM` env var). */
  appId: string;
  timeout: number;
  retries: number;
  headless: boolean;
  credentials: Credentials;
}
