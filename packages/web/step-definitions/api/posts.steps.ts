import { expect } from '@playwright/test';
import { When, Then } from '../../fixtures/test';

When('I request post {int}', async ({ postsClient, apiWorld }, id: number) => {
  apiWorld.lastResponse = await postsClient.getPost(id);
});

When(
  'I create a post titled {string}',
  async ({ postsClient, apiWorld }, title: string) => {
    apiWorld.lastResponse = await postsClient.createPost({
      title,
      body: 'Created by Spectra API test',
      userId: 1,
    });
  },
);

Then('the response status is {int}', async ({ apiWorld }, status: number) => {
  expect(apiWorld.lastResponse?.status()).toBe(status);
});

Then('the post has an id of {int}', async ({ apiWorld }, id: number) => {
  const body = await apiWorld.lastResponse?.json();
  expect(body.id).toBe(id);
});

Then(
  'the created post echoes the title {string}',
  async ({ apiWorld }, title: string) => {
    const body = await apiWorld.lastResponse?.json();
    expect(body.title).toBe(title);
  },
);
