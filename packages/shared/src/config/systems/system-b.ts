import type { SystemConfig } from '../types';

/**
 * System B — placeholder for a second system under test. Demonstrates that the
 * same suite targets multiple systems by swapping the `SYSTEM` env var. Point
 * these at your real second system.
 */
const systemB: SystemConfig = {
  name: 'system-b',
  displayName: 'System B (placeholder)',
  web: {
    dev: 'https://dev.example.com',
    staging: 'https://staging.example.com',
    prod: 'https://www.example.com',
  },
  api: {
    dev: 'https://api-dev.example.com',
    staging: 'https://api-staging.example.com',
    prod: 'https://api.example.com',
  },
  mobile: {
    android: 'com.example.systemb',
    ios: 'com.example.systemb',
  },
};

export default systemB;
