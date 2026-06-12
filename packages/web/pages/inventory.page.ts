import type { Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** Products / inventory page shown after a successful login. */
export class InventoryPage extends BasePage {
  readonly title: Locator = this.page.locator('.title');
  readonly cartBadge: Locator = this.page.locator('.shopping_cart_badge');
  readonly items: Locator = this.page.locator('.inventory_item');
}
