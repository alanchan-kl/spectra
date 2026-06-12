import { check, group } from 'k6';
import http from 'k6/http';
import type { Options } from 'k6/options';
import { apiBaseUrl } from '../config.ts';
import { defaultThresholds } from '../../thresholds.ts';

/** Smoke: 1 VU, 1 iteration — a sanity check that the system responds at all. */
export const options: Options = {
  vus: 1,
  iterations: 1,
  thresholds: defaultThresholds,
};

export default function (): void {
  const base = apiBaseUrl();
  group('smoke: fetch a single post', () => {
    const res = http.get(`${base}/posts/1`);
    check(res, {
      'status is 200': (r) => r.status === 200,
      'has id 1': (r) => r.json('id') === 1,
    });
  });
}
