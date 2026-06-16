import { test as base, createBdd } from 'playwright-bdd';
import type { APIResponse } from '@playwright/test';
import { feature, story } from 'allure-js-commons';
import { LoginPage } from '../pages/login.page';
import { InventoryPage } from '../pages/inventory.page';
import { PostsClient } from '../api/posts.client';

/** Mutable per-scenario state for API steps (kept off module scope for safe parallelism). */
interface ApiWorld {
  lastResponse?: APIResponse;
}

interface SpectraFixtures {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  postsClient: PostsClient;
  apiWorld: ApiWorld;
  /** Auto fixture (no value) — labels each scenario for the Allure Behaviors tab. */
  _bddLabels: void;
}

/**
 * Extended BDD test exposing page objects, the API client, and a fresh
 * per-scenario world. Fixtures are lazy — the API project never launches a
 * browser because it doesn't touch the page-backed fixtures.
 */
export const test = base.extend<SpectraFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },
  postsClient: async ({ request }, use) => {
    await use(new PostsClient(request));
  },
  apiWorld: async ({}, use) => {
    await use({});
  },
  // Auto fixture: label every scenario with its Gherkin Feature + Scenario name so the
  // report's "Features by stories" (Behaviors) tab populates — no per-scenario tags.
  // playwright-bdd wraps each feature in test.describe('<Feature>'), so the Feature name
  // is the test's parent in titlePath. Has no `page` dep → API project stays browser-free.
  _bddLabels: [
    async ({}, use, testInfo) => {
      const tp = testInfo.titlePath;
      // Gherkin Feature → Allure feature, Scenario → story (drives the Behaviors tab).
      await feature(tp.length >= 2 ? tp[tp.length - 2] : 'Unknown');
      await story(testInfo.title);
      await use();
    },
    { auto: true },
  ],
});

export const { Given, When, Then } = createBdd(test);
