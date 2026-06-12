import type { Options } from 'k6/options';
import { userJourney } from '../lib/journey.ts';
import { defaultThresholds } from '../../thresholds.ts';

// Drop a timestamped JSON + HTML report into reports/ on every run (no Grafana needed).
import { makeHandleSummary } from '../lib/summary.ts';
export const handleSummary = makeHandleSummary('stress');

/** Stress: ramp well past peak to find where the system starts to degrade. */
export const options: Options = {
  thresholds: defaultThresholds,
  scenarios: {
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 50 },
        { duration: '2m', target: 100 },
        { duration: '1m', target: 200 }, // beyond expected peak
        { duration: '1m', target: 0 },
      ],
    },
  },
};

export default function (): void {
  userJourney();
}
