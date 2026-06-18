import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getConfig } from '@spectra/shared';

/**
 * Write Allure `environment.properties` from the resolved config, so the WEB+API report's
 * Environment widget reflects the REAL SYSTEM/ENV/URLs — single source of truth, no
 * hardcoded values. Runs once per `playwright test` invocation (web and api) via the
 * config's `globalSetup`, into the same `../../allure-results` dir the reporter uses.
 *
 * Only **web/API-relevant** keys are written here — no mobile (`Platform`/`Mobile.App`),
 * since this feeds the web+api report. The mobile report gets its own mobile-only
 * environment written in `report.yml`. Credentials are omitted; CI run provenance
 * (commit/branch/run) is appended later in `report.yml` from the GitHub context.
 */
export default function globalSetup(): void {
  const c = getConfig();
  const dir = resolve(process.cwd(), '../../allure-results');
  mkdirSync(dir, { recursive: true });

  const props = [
    `SYSTEM=${c.system}`,
    `ENV=${c.env}`,
    `Web.BaseURL=${c.webBaseUrl}`,
    `API.BaseURL=${c.apiBaseUrl}`,
  ].join('\n');

  writeFileSync(resolve(dir, 'environment.properties'), props + '\n');
}
