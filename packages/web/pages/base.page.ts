import type { Page } from '@playwright/test';

/**
 * Base for all page objects. Holds the Playwright `page` and common navigation.
 * Feature pages extend this and expose locators + intent-revealing methods —
 * never put raw selectors in step definitions.
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /** Navigate to a path relative to the project's configured baseURL. */
  async goto(path = '/'): Promise<void> {
    await this.page.goto(path);
  }
}
