import type { Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** Login page of the Sauce Labs demo storefront (System A). */
export class LoginPage extends BasePage {
  readonly username: Locator = this.page.locator('[data-test="username"]');
  readonly password: Locator = this.page.locator('[data-test="password"]');
  readonly loginButton: Locator = this.page.locator('[data-test="login-button"]');
  readonly errorMessage: Locator = this.page.locator('[data-test="error"]');

  async goto(): Promise<void> {
    await super.goto('/');
  }

  async login(username: string, password: string): Promise<void> {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.loginButton.click();
  }
}
