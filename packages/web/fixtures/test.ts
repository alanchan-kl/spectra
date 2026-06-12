import { test as base, createBdd } from 'playwright-bdd';
import type { APIResponse } from '@playwright/test';
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
});

export const { Given, When, Then } = createBdd(test);
