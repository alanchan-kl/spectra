import type { Options } from 'k6/options';
import { userJourney } from '../lib/journey.ts';
import { journeyThresholds } from '../../thresholds.ts';

// Drop a timestamped JSON + HTML report into reports/ on every run (no Grafana needed).
import { makeHandleSummary } from '../lib/summary.ts';
export const handleSummary = makeHandleSummary('soak');

/**
 * Soak / endurance: a moderate, steady load held for a long time to surface
 * memory leaks and resource exhaustion. Shorten via `DURATION` while iterating
 * (real soak tests run for hours).
 */
export const options: Options = {
  thresholds: journeyThresholds,
  scenarios: {
    soak: {
      executor: 'constant-vus',
      vus: 20,
      duration: __ENV.DURATION ?? '1h',
    },
  },
};

export default function (): void {
  userJourney();
}
