import type { SystemConfig } from '../types';

/**
 * System A — wired to public demo targets so the framework runs end-to-end out
 * of the box. Replace these URLs with your real system when onboarding.
 *
 *  - Web    : Sauce Labs demo storefront (has a real login form)
 *  - API    : JSONPlaceholder (public fake REST API)
 *  - Mobile : Sauce Labs native "My Demo App" (Android + iOS). The old React
 *             Native app is deprecated; these are the current native builds.
 *             Android: github.com/saucelabs/my-demo-app-android
 *             iOS    : github.com/saucelabs/my-demo-app-ios
 */
const systemA: SystemConfig = {
  name: 'system-a',
  displayName: 'System A (demo)',
  web: {
    dev: 'https://www.saucedemo.com',
    staging: 'https://www.saucedemo.com',
    prod: 'https://www.saucedemo.com',
  },
  api: {
    dev: 'https://jsonplaceholder.typicode.com',
    staging: 'https://jsonplaceholder.typicode.com',
    prod: 'https://jsonplaceholder.typicode.com',
  },
  mobile: {
    android: 'com.saucelabs.mydemoapp.android',
    ios: 'com.saucelabs.mydemo.app.ios',
  },
};

export default systemA;
