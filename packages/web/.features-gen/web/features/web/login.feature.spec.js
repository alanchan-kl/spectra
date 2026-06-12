// Generated from: features\web\login.feature
import { test } from "../../../../fixtures/test.ts";

test.describe('Login', () => {

  test.beforeEach('Background', async ({ Given, loginPage }, testInfo) => { if (testInfo.error) return;
    await Given('I am on the login page', null, { loginPage }); 
  });
  
  test('Successful login with valid credentials', { tag: ['@web', '@system-a', '@smoke'] }, async ({ When, Then, inventoryPage, loginPage }) => { 
    await When('I log in with valid credentials', null, { loginPage }); 
    await Then('I should see the products page', null, { inventoryPage }); 
  });

  test('Login is rejected for a locked-out user', { tag: ['@web', '@system-a'] }, async ({ When, Then, loginPage }) => { 
    await When('I log in as "locked_out_user"', null, { loginPage }); 
    await Then('I should see an error message containing "locked out"', null, { loginPage }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('features\\web\\login.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":10,"pickleLine":11,"tags":["@web","@system-a","@smoke"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given I am on the login page","isBg":true,"stepMatchArguments":[]},{"pwStepLine":11,"gherkinStepLine":12,"keywordType":"Action","textWithKeyword":"When I log in with valid credentials","stepMatchArguments":[]},{"pwStepLine":12,"gherkinStepLine":13,"keywordType":"Outcome","textWithKeyword":"Then I should see the products page","stepMatchArguments":[]}]},
  {"pwTestLine":15,"pickleLine":15,"tags":["@web","@system-a"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given I am on the login page","isBg":true,"stepMatchArguments":[]},{"pwStepLine":16,"gherkinStepLine":16,"keywordType":"Action","textWithKeyword":"When I log in as \"locked_out_user\"","stepMatchArguments":[{"group":{"start":12,"value":"\"locked_out_user\"","children":[{"start":13,"value":"locked_out_user","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":17,"gherkinStepLine":17,"keywordType":"Outcome","textWithKeyword":"Then I should see an error message containing \"locked out\"","stepMatchArguments":[{"group":{"start":41,"value":"\"locked out\"","children":[{"start":42,"value":"locked out","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]}]},
]; // bdd-data-end