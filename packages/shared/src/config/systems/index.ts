import type { SystemConfig, SystemName } from '../types';
import systemA from './system-a';
import systemB from './system-b';

/** Registry of all known systems. Add new systems here. */
export const systems: Record<SystemName, SystemConfig> = {
  'system-a': systemA,
  'system-b': systemB,
};

/** Resolve the active system from the `SYSTEM` env var (defaults to `system-a`). */
export function resolveSystem(): SystemConfig {
  const name = (process.env.SYSTEM ?? 'system-a') as SystemName;
  const system = systems[name];
  if (!system) {
    const known = Object.keys(systems).join(', ');
    throw new Error(`Unknown SYSTEM "${name}". Known systems: ${known}.`);
  }
  return system;
}
