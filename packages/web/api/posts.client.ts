import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { Post } from '@spectra/shared';

/**
 * API client for the Posts endpoints. Mirrors one service; add a client per
 * service. Uses Playwright's `request` context, so it inherits the project's
 * configured `baseURL` — no separate HTTP library needed.
 */
export class PostsClient {
  constructor(private readonly request: APIRequestContext) {}

  getPost(id: number): Promise<APIResponse> {
    return this.request.get(`/posts/${id}`);
  }

  createPost(data: Partial<Post>): Promise<APIResponse> {
    return this.request.post('/posts', { data });
  }
}
