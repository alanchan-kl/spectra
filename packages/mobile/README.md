# @spectra/mobile

Mobile E2E for iOS + Android using [Maestro](https://maestro.mobile.dev). Flows
are plain YAML — readable, fast, and resilient (Maestro has built-in smart
waits, so no manual sleeps).

## Demo apps under test

The old Sauce Labs React Native demo app (`my-demo-app-rn`) is **deprecated /
archived**. It was replaced by two **native** apps, which is what Spectra
targets:

| Platform | Repo | App id | Download (latest) |
| --- | --- | --- | --- |
| Android | [saucelabs/my-demo-app-android](https://github.com/saucelabs/my-demo-app-android) | `com.saucelabs.mydemoapp.android` | `mda-<ver>.apk` |
| iOS | [saucelabs/my-demo-app-ios](https://github.com/saucelabs/my-demo-app-ios) | `com.saucelabs.mydemo.app.ios` | `SauceLabs-Demo-App.Simulator.zip` |

Both builds are already downloaded into [`apps/`](apps/) (gitignored).

> ⚠️ **Windows users:** iOS Simulator builds run **only on macOS + Xcode**. On
> Windows, test the **Android** app on an emulator. Use iOS later on a Mac, in CI
> (macOS runner), or via a device cloud (Sauce Labs / BrowserStack).

## Install Maestro (one-time)

Maestro is a **system CLI**, not an npm package:

```bash
# macOS / Linux / WSL
curl -Ls "https://get.maestro.mobile.dev" | bash
# Windows (PowerShell): install via WSL, or follow maestro.mobile.dev/getting-started
```

## Set up a device + install the app

**Android (works on Windows):**
```bash
# Start an emulator (Android Studio > Device Manager), then:
adb install packages/mobile/apps/mda-2.2.0-25.apk
```

**iOS (macOS only):**
```bash
unzip "packages/mobile/apps/SauceLabs-Demo-App.Simulator.zip" -d /tmp/sld
xcrun simctl boot "iPhone 15"
xcrun simctl install booted /tmp/sld/*.app
```

## Run

```bash
pnpm --filter @spectra/mobile test:smoke   # bulletproof: launch + screenshot
pnpm --filter @spectra/mobile test         # all flows on Android (default)
pnpm --filter @spectra/mobile test:ios     # all flows on iOS (macOS only)
pnpm --filter @spectra/mobile test:parallel# shard across 2 devices
pnpm --filter @spectra/mobile test:junit   # emit JUnit into ../../allure-results
```

## Authoring flows: confirm selectors with Maestro Studio

The native app's accessibility ids differ from the old RN app, so the `login`
and `products` flows ship as **best-effort templates**. Capture the exact
selectors for your app version interactively:

```bash
pnpm --filter @spectra/mobile studio
```

## Multi-system / multi-platform

The app id is injected via `APP_ID`, so one flow set runs anywhere:

```bash
maestro test -e APP_ID=com.saucelabs.mydemo.app.ios flows/   # iOS
maestro test -e APP_ID=com.example.systemb            flows/   # another system
```

## Reporting

`test:junit` writes JUnit XML into the repo's `allure-results/`, so mobile
results appear in the **same unified Allure report** as web and API:

```bash
pnpm --filter @spectra/mobile test:junit
pnpm report   # from repo root — combined Allure report
```

## Reusing steps across flows

When many scenarios share setup (launch, login, navigate), extract those steps
**once** into `subflows/` and `runFlow` them — Maestro's DRY mechanism, the
equivalent of a page-object method. Three levers:

**1. Include a fragment**
```yaml
- runFlow: ../subflows/open-catalog.yaml
```

**2. Parameterise it** — pass data via `env`; the subflow declares defaults:
```yaml
- runFlow:
    file: ../subflows/login.yaml
    env:
      USERNAME: alice@example.com
      PASSWORD: secret
```

So a new authed journey is just composition — no re-typing the login dance:
```yaml
# flows/checkout.yaml
appId: ${APP_ID}
tags: [checkout]
---
- runFlow: ../subflows/login.yaml      # logged in (default creds)
- tapOn: "Sauce Labs Backpack"
- tapOn: "Add to cart"
# ... assert cart ...
```

**3. Run setup before _every_ flow** with a `config.yaml` hook:
```yaml
# config.yaml
onFlowStart:
  - runFlow: subflows/launch.yaml
```

Use hooks for truly universal setup; use `runFlow` inside a flow for per-scenario
control (e.g. warm vs cold launch). Subflows under `subflows/` aren't matched by
the `flows/*.yaml` glob, so they only run when composed — never standalone.

## Structure

```
flows/      # one YAML per journey (smoke, login, products)
subflows/   # reusable fragments invoked via runFlow (DRY, like page objects)
apps/       # built app artifacts under test (gitignored)
config.yaml # Maestro workspace config (flow globs, execution order)
```
