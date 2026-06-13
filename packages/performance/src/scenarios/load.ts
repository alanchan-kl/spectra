import type { Options } from 'k6/options';
import { userJourney } from '../lib/journey.ts';
import { journeyThresholds } from '../../thresholds.ts';

// Drop a timestamped JSON + HTML report into reports/ on every run (no Grafana needed).
import { makeHandleSummary } from '../lib/summary.ts';
export const handleSummary = makeHandleSummary('load');

/** Load: ramp to the expected peak and hold — behaviour under normal traffic. */
export const options: Options = {
  thresholds: journeyThresholds,
  scenarios: {
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 20 }, // ramp up to peak
        { duration: '1m', target: 20 }, //  hold at peak
        { duration: '30s', target: 0 }, //  ramp down
      ],
    },
  },
};

export default function (): void {
  userJourney();
}
