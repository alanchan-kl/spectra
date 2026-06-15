import { expect } from '@playwright/test';
import { getConfig } from '@spectra/shared';
import { Given, When, Then } from '../../fixtures/test';

const config = getConfig();

Given('I am on the login page', async ({ loginPage }) => {
  await loginPage.goto();
});

When('I log in with valid credentials', async ({ loginPage }) => {
  await loginPage.login(config.credentials.username, config.credentials.password);
});

When('I log in as {string}', async ({ loginPage }, username: string) => {
  await loginPage.login(username, config.credentials.password);
});

Then('I should see the products page', async ({ inventoryPage }) => {
  await expect(inventoryPage.title).toHaveText('Products');
});

Then(
  'I should see an error message containing {string}',
  async ({ loginPage }, text: string) => {
    await expect(loginPage.errorMessage).toContainText(text, { ignoreCase: true });
  },
);

// ⚠️ TEMPORARY — supports the @demo-fail scenario in login.feature. Asserting the
// products title against a wrong value forces a clean FAILED result for verifying the
// failure / Categories reporting path. Remove together with the @demo-fail scenario.
// Then('the products title should be {string}', async ({ inventoryPage }, expected: string) => {
//   await expect(inventoryPage.title).toHaveText(expected);
// });
