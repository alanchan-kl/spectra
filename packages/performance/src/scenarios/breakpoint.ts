import type { Options } from 'k6/options';
import { userJourney } from '../lib/journey';
import { breakpointThresholds } from '../../thresholds';

/**
 * Breakpoint: ramp request rate continuously until the SLA breaks. The
 * `abortOnFail` thresholds stop the run at the breaking point — the capacity
 * at which it aborts is the headline result.
 */
export const options: Options = {
  thresholds: breakpointThresholds,
  scenarios: {
    breakpoint: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 1000,
      stages: [
        { duration: '5m', target: 500 }, // climb to 500 req/s (or until it breaks)
      ],
    },
  },
};

export default function (): void {
  userJourney();
}
