import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { apiBaseUrl } from '../config.ts';

/**
 * The user journey exercised by every load profile, organised into named API
 * groups. Each `group()` becomes a section (sub-header) in the checks report and
 * tags its requests with `group=::<name>`; the per-request `name` tag gives
 * per-endpoint metrics. load/stress/soak differ only in their VU ramp — DRY.
 */
export function userJourney(): void {
  const base = apiBaseUrl();

  group('posts API', () => {
    const list = http.get(`${base}/posts`, { tags: { name: 'GET /posts' } });
    check(list, { 'list status is 200': (r) => r.status === 200 });

    const post = http.get(`${base}/posts/1`, { tags: { name: 'GET /posts/:id' } });
    check(post, {
      'post status is 200': (r) => r.status === 200,
      'post has id 1': (r) => r.json('id') === 1,
    });
  });

  group('comments API', () => {
    const comments = http.get(`${base}/comments?postId=1`, {
      tags: { name: 'GET /comments' },
    });
    check(comments, { 'comments status is 200': (r) => r.status === 200 });
  });

  sleep(1);
}
