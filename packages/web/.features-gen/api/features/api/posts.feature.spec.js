// Generated from: features\api\posts.feature
import { test } from "../../../../fixtures/test.ts";

test.describe('Posts API', () => {

  test('Fetch a single post', { tag: ['@api', '@system-a', '@smoke'] }, async ({ When, Then, And, apiWorld, postsClient }) => { 
    await When('I request post 1', null, { apiWorld, postsClient }); 
    await Then('the response status is 200', null, { apiWorld }); 
    await And('the post has an id of 1', null, { apiWorld }); 
  });

  test('Create a new post', { tag: ['@api', '@system-a'] }, async ({ When, Then, And, apiWorld, postsClient }) => { 
    await When('I create a post titled "Spectra rocks"', null, { apiWorld, postsClient }); 
    await Then('the response status is 201', null, { apiWorld }); 
    await And('the created post echoes the title "Spectra rocks"', null, { apiWorld }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('features\\api\\posts.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":8,"tags":["@api","@system-a","@smoke"],"steps":[{"pwStepLine":7,"gherkinStepLine":9,"keywordType":"Action","textWithKeyword":"When I request post 1","stepMatchArguments":[{"group":{"start":15,"value":"1"},"parameterTypeName":"int"}]},{"pwStepLine":8,"gherkinStepLine":10,"keywordType":"Outcome","textWithKeyword":"Then the response status is 200","stepMatchArguments":[{"group":{"start":23,"value":"200"},"parameterTypeName":"int"}]},{"pwStepLine":9,"gherkinStepLine":11,"keywordType":"Outcome","textWithKeyword":"And the post has an id of 1","stepMatchArguments":[{"group":{"start":22,"value":"1"},"parameterTypeName":"int"}]}]},
  {"pwTestLine":12,"pickleLine":13,"tags":["@api","@system-a"],"steps":[{"pwStepLine":13,"gherkinStepLine":14,"keywordType":"Action","textWithKeyword":"When I create a post titled \"Spectra rocks\"","stepMatchArguments":[{"group":{"start":23,"value":"\"Spectra rocks\"","children":[{"start":24,"value":"Spectra rocks","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":14,"gherkinStepLine":15,"keywordType":"Outcome","textWithKeyword":"Then the response status is 201","stepMatchArguments":[{"group":{"start":23,"value":"201"},"parameterTypeName":"int"}]},{"pwStepLine":15,"gherkinStepLine":16,"keywordType":"Outcome","textWithKeyword":"And the created post echoes the title \"Spectra rocks\"","stepMatchArguments":[{"group":{"start":34,"value":"\"Spectra rocks\"","children":[{"start":35,"value":"Spectra rocks","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]}]},
]; // bdd-data-end