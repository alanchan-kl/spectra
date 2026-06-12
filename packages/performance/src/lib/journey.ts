import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { apiBaseUrl } from '../config.ts';

/**
 * The user journey exercised by every load profile. Keeping it here (one place)
 * means load/stress/breakpoint/soak only differ in their VU ramp, not in what
 * they do — DRY across scenarios.
 */
export function userJourney(): void {
  const base = apiBaseUrl();

  group('browse posts', () => {
    const list = http.get(`${base}/posts`);
    check(list, { 'list status is 200': (r) => r.status === 200 });

    const post = http.get(`${base}/posts/1`);
    check(post, {
      'post status is 200': (r) => r.status === 200,
      'post has id 1': (r) => r.json('id') === 1,
    });
  });

  sleep(1);
}
