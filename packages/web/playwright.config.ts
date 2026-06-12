import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import { getConfig } from '@spectra/shared';

const config = getConfig();

/**
 * Two BDD configs feed two Playwright projects from the same step/fixture pool:
 *  - `web`  : browser scenarios under features/web
 *  - `api`  : API scenarios under features/api
 * Each generates spec files into its own outputDir, then runs as a project.
 */
const webTestDir = defineBddConfig({
  outputDir: '.features-gen/web',
  features: 'features/web/**/*.feature',
  steps: ['step-definitions/web/**/*.ts', 'fixtures/**/*.ts'],
});

const apiTestDir = defineBddConfig({
  outputDir: '.features-gen/api',
  features: 'features/api/**/*.feature',
  steps: ['step-definitions/api/**/*.ts', 'fixtures/**/*.ts'],
});

export default defineConfig({
  forbidOnly: !!process.env.CI,
  retries: config.retries,
  timeout: config.timeout,
  reporter: [
    ['list'],
    ['allure-playwright', { resultsDir: '../../allure-results' }],
  ],
  projects: [
    {
      name: 'web',
      testDir: webTestDir,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: config.webBaseUrl,
        headless: config.headless,
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure', 
      },
    },
    {
      name: 'api',
      testDir: apiTestDir,
      use: {
        baseURL: config.apiBaseUrl,
      },
    },
  ],
});
