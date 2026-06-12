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
 * Stricter thresholds for breakpoint tests that abort the run the moment the
 * system breaches the SLA — that breach point is the result you're after.
 */
export const breakpointThresholds: Record<string, Threshold[]> = {
  http_req_failed: [{ threshold: 'rate<0.01', abortOnFail: true }],
  http_req_duration: [{ threshold: 'p(95)<1000', abortOnFail: true }],
};
