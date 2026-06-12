import type { Options } from 'k6/options';
import { userJourney } from '../lib/journey';
import { defaultThresholds } from '../../thresholds';

/**
 * Soak / endurance: a moderate, steady load held for a long time to surface
 * memory leaks and resource exhaustion. Shorten via `DURATION` while iterating
 * (real soak tests run for hours).
 */
export const options: Options = {
  thresholds: defaultThresholds,
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
