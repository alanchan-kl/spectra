import type { Threshold } from 'k6/options';

/**
 * Shared SLA thresholds. When a threshold is breached, k6 exits non-zero — so
 * these double as the pass/fail gate for the CI pipeline.
 *
 *  - http_req_failed   : < 1% of requests may fail
 *  - http_req_duration : 95th-percentile latency must stay under 500ms
 */
export const defaultThresholds: Record<string, Threshold[]> = {
  http_req_failed: ['rate<0.01'],
  http_req_duration: ['p(95)<500'],
};

/**
 * Per-API / per-endpoint SLAs layered on top of the global gates. Each tagged
 * sub-metric appears as its OWN pass/fail line in the summary + HTML report, and
 * the `group`/`name` tags let Grafana break response time down per API. Used by
 * load/stress/soak (which share `userJourney`'s grouped requests). The triple
 * colon in `{group:::posts API}` is `:` (key/value) + `::posts API` (the group
 * tag value — k6 prefixes group paths with `::`).
 */
export const journeyThresholds: Record<string, Threshold[]> = {
  ...defaultThresholds,
  // posts API — core reads, held to a tight SLA
  'http_req_duration{group:::posts API}': ['p(95)<300'],
  'http_req_failed{group:::posts API}': ['rate<0.01'],
  'http_req_duration{name:GET /posts}': ['p(95)<350'], //     listing a collection is heavier
  'http_req_duration{name:GET /posts/:id}': ['p(95)<200'], // a single record should be fastest
  // comments API — filtered query, a looser SLA
  'http_req_duration{group:::comments API}': ['p(95)<600'],
  'http_req_failed{group:::comments API}': ['rate<0.02'],
};

/**
 * Stricter thresholds for breakpoint tests that abort the run the moment the
 * system breaches the SLA — that breach point is the result you're after.
 */
export const breakpointThresholds: Record<string, Threshold[]> = {
  http_req_failed: [{ threshold: 'rate<0.01', abortOnFail: true }],
  http_req_duration: [{ threshold: 'p(95)<1000', abortOnFail: true }],
};
