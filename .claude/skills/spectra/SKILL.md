---
name: spectra
description: Playbook for the "spectra" QA automation framework — a TypeScript pnpm monorepo at C:\Users\Alan Chan\Workspace\spectra covering web E2E + API (Playwright + playwright-bdd / Gherkin), mobile (Maestro, iOS+Android), and performance (k6), with Allure + Grafana reporting. Use whenever working in the spectra project: running tests, adding test cases, driving the local Android/Maestro emulator setup, the unified Allure report, or troubleshooting env/PATH issues. Loads full project context so it need not be re-derived.
---

# Spectra — QA Automation Framework Playbook

Unified test framework. **Everything in the stack is free/open source.** Project root: `C:\Users\Alan Chan\Workspace\spectra` (open THIS folder as the VS Code workspace root, and run `pnpm` from inside it).

## Stack & layers

| Layer | Tool | Package | Style |
|---|---|---|---|
| Web E2E | Playwright + `playwright-bdd` (>=9) | `@spectra/web` | Gherkin `.feature` |
| API | Playwright `APIRequestContext` (same runner) | `@spectra/web` | Gherkin `.feature` |
| Mobile (iOS+Android) | Maestro (system CLI) | `@spectra/mobile` | YAML flows |
| Performance | k6 v2 (Docker `grafana/k6`; or system CLI) | `@spectra/performance` | TS scenarios |
| Shared config/data | TS | `@spectra/shared` | — |
| Functional reporting | **TWO Allure reports** on one Pages site: Web+API (native) at `/web-api/`, Mobile (via JUnit) at `/mobile/`, landing at `/` | — | — |
| Perf reporting | self-hosted Grafana + InfluxDB (docker-compose) | — | — |

Monorepo: pnpm workspaces + Turborepo. CI: GitHub Actions (`.github/workflows/`). Plan: `C:\Users\Alan Chan\.claude\plans\im-a-software-qa-shimmering-pebble.md`.

## Repo layout
```
packages/
  shared/      src/config/{systems,environments}, src/data (Faker), src/types, src/helpers; barrel src/index.ts
  web/         features/{web,api}/*.feature, step-definitions/{web,api}/*.steps.ts, pages/*.page.ts, fixtures/test.ts, playwright.config.ts
  mobile/      flows/*.yaml (smoke,login,products), subflows/{launch,login,open-catalog}.yaml, apps/ (gitignored), config.yaml; takeScreenshot → screenshots/<flow>/<name>.png
  performance/ src/scenarios/{smoke,load,stress,breakpoint,soak}.ts, src/{lib/journey,config}.ts, thresholds.ts, docker-compose.yml (influxdb+grafana+mockapi+k6), mock/default.conf, grafana/provisioning/{datasources,dashboards}
```

## Running tests (from repo root)
```bash
pnpm install                                   # first time
pnpm --filter @spectra/web exec playwright install chromium   # first time (browsers)

pnpm test:api                                  # API Gherkin (no browser) — fast
pnpm test:web                                  # web Gherkin (headless Chromium)
pnpm test:mobile                               # Maestro flows (needs emulator running)
pnpm test:performance                          # k6 smoke (native k6) — or Docker: docker:smoke (see Performance)
pnpm report                                    # build + open unified Allure report
```
Web/API run `bddgen && playwright test` — `bddgen` regenerates `.features-gen/` (auto, gitignored, NEVER edit by hand).

## Multi-system / environment (env vars)
- `SYSTEM` = `system-a` (default, wired to public demos) | `system-b` (placeholder). Defined in `packages/shared/src/config/systems/`.
- `ENV` = `dev` (default) | `staging` | `prod`.
- `PLATFORM` = `android` (default) | `ios` (resolves mobile appId).
- `TEST_USERNAME` / `TEST_PASSWORD` (default to saucedemo `standard_user` / `secret_sauce`).
- Example: `SYSTEM=system-b ENV=staging pnpm test:web`.
- `getConfig()` from `@spectra/shared` merges system+env+creds. system-a demos: web=saucedemo.com, api=jsonplaceholder.typicode.com.

## Adding a test
**Web/API (Gherkin) — touch 2–3 files, never `.features-gen`:**
1. Add a `Scenario` to a `features/.../*.feature` file (reuse existing step lines where possible).
2. For any new step line, add a `Given/When/Then('text {string}', async ({ fixtures }, arg) => {...})` in `step-definitions/.../*.steps.ts`. Steps import `Given/When/Then` from `../../fixtures/test`.
3. Put selectors in a page object under `pages/` (extend `BasePage`); never inline selectors in steps.
4. `pnpm test:web` (or `test:api`).

**Mobile (Maestro):** drop a new `flows/<name>.yaml`; what you write is what runs (no codegen). Discover real selectors with `pnpm --filter @spectra/mobile studio`. Reuse fragments via `runFlow: ../subflows/...`.

## Local environment (Windows) — ALREADY PROVISIONED & VERIFIED (2026-06-12)
- **pnpm** via `npm i -g pnpm` (v11.6.0).
- **Docker Desktop** (engine 29.5.3) — on the **Machine** PATH at `C:\Program Files\Docker\Docker\resources\bin` (that dir also holds `docker-credential-desktop`). Runs the perf stack + containerized k6; no native k6 needed.
- **Maestro 2.6.0** at `%USERPROFILE%\maestro\bin` (on user PATH; native Windows, no WSL).
- **Android Studio + SDK** at `%LOCALAPPDATA%\Android\Sdk` (`ANDROID_HOME` set, user scope). Packages: platform-tools, emulator, platforms;android-34, system-images;android-34;google_apis;x86_64.
- **AVD**: `spectra_pixel`.
- **Bundled JDK 21** at `%ProgramFiles%\Android\Android Studio\jbr` — set `JAVA_HOME` to it for sdkmanager/avdmanager/maestro to avoid Java 24 warnings.
- **Demo app under test**: Sauce Labs native My Demo App. APK `packages/mobile/apps/mda-2.2.0-25.apk`, pkg `com.saucelabs.mydemoapp.android`, iOS bundle `com.saucelabs.mydemo.app.ios`. Login `bob@example.com` / `10203040`. Verified Android resource-ids: menu=`menuIV`, username=`nameET`, password=`passwordET`, login=`loginBtn`, catalog title text=`Products`.

### Run mobile locally
```cmd
:: windowed + hardware GPU (fast, recommended)
emulator -avd spectra_pixel -gpu auto
:: headless (slow software GPU)
emulator -avd spectra_pixel -no-window -gpu swiftshader_indirect
adb devices                          :: expect emulator-5554  device
pnpm --filter @spectra/mobile test
pnpm --filter @spectra/mobile test:junit   :: writes JUnit (suite "Mobile (Android)") into ../../allure-results
```

## Performance (k6) — runs in Docker, no native install needed
**k6 v2 runs as a container** (`grafana/k6` image) via the compose `k6` service (profile `k6`); Docker Desktop is the only prerequisite (native `winget install k6` still works if preferred). Scenarios: smoke/load/stress/breakpoint/soak; `thresholds.ts` gates pass/fail. Run via `pnpm --filter @spectra/performance <script>` (handles cwd):
- **Dry run / zero traffic**: `docker:inspect` (`k6 inspect` — validates options/stages, **0 requests**). Lightest real run: `docker:smoke` (1 VU/1 iter, 1 request).
- **Scripts**: `docker:inspect` `docker:smoke` `docker:load` `docker:load:influx` `docker:load:mock`. Influx output targets `http://influxdb:8086` (peer container, **not** localhost).
- **Heavy scenarios** (load/stress/breakpoint/soak) define an `options.scenarios` block, so k6 **ignores** `--vus`/`--iterations`; only **soak** honors `-e DURATION` (e.g. `-e DURATION=3m`).
- **Target override**: `apiBaseUrl()` in `src/config.ts` honors `-e BASE_URL=...` (wins over SYSTEM/ENV). **NEVER load-test public demos** — use your own target or the bundled mock.
- **Local mock** for real curves with no public target: `mockapi` (nginx, `mock/default.conf`) serves `/posts` + `/posts/1`. `docker:load:mock` runs load against `http://mockapi` → InfluxDB.
- **Grafana report — auto-provisioned, NO import**: `grafana:up`, run a `*:influx`/`*:mock` script, open **http://localhost:3000/d/k6-perf** (datasource uid `influxdb_k6` + dashboard `k6.json`, both under `grafana/provisioning/`). `grafana:down` to stop. Grafana storage is ephemeral (no volume) → after editing provisioning, `docker compose up -d --force-recreate grafana` to reload it.
- **Offline report (no Grafana)**: every scenario calls `makeHandleSummary('<name>')` (`src/lib/summary.ts`). The k6 service `entrypoint` wraps k6 with `scripts/k6-report-entrypoint.sh`, which for `run` pre-creates `reports/<scenario>-<UTC-ts>/` and exports `REPORT_DIR` (k6 can't mkdir at summary time) → each run writes `report.{json,html}` into its own folder (gitignored); `inspect`/`version` pass through, no folder. `docker:report` = load vs mock. HTML/text via k6-reporter + k6-summary jslib (remote URL imports → container needs internet; `summary.ts` is `@ts-nocheck`, `.sh` forced LF via `.gitattributes`). k6 `depends_on: mockapi` so `BASE_URL=http://mockapi` runs auto-start the mock.

## Reporting (TWO Allure reports — web/API rich, mobile flat)

Web/API and mobile produce **structurally different** Allure results, so they're published as
**two separate Allure reports** on the one GitHub Pages site (built by `report.yml`'s `report` job):
- `/web-api/` — Playwright + `allure-playwright` (native): real **steps**, feature/story tree, screenshots.
- `/mobile/` — Maestro → JUnit: **flat** test cases, no steps (JUnit carries none).
- `/` — landing page linking both.

**Web/API report specifics:**
- **Behaviors tab** (Features by stories): an auto fixture in `packages/web/fixtures/test.ts` labels
  every scenario `feature = <Gherkin Feature>` and `story = <Scenario>` via `allure-js-commons`
  (direct devDep — the non-deprecated API; `@allure.label.*` tags do NOT work through playwright-bdd).
- **Environment widget**: `fixtures/global-setup.ts` (config `globalSetup`) writes
  `allure-results/environment.properties` from `getConfig()` — single source of truth, no hardcoding.
- **Native Playwright HTML report + trace viewer**: `playwright.config.ts` has the `html` reporter;
  CI uploads `playwright-report-{web,api}-<system>-<env>` artifacts (self-contained, embeds traces;
  `trace: retain-on-failure` on both projects). View: `pnpm --filter @spectra/web exec playwright show-report <dir>`.
- Failure classification → **Categories** (only populates when tests fail/break).

**Mobile report specifics:** feature suites (see CI orchestration gotcha); `takeScreenshot` images
uploaded as `mobile-screenshots-<slug>` artifacts (separate from Allure — JUnit can't embed images).

**Cross-cutting (per report, in `report.yml`):** history/trend seeded from each report's own Pages
subpath (`/web-api/history/`, `/mobile/history/`); `executor.json` per report (build link + ordered,
labeled trend points); `concurrency: pages` serializes deploys.

**Local:** `pnpm report` still builds **one** unified Allure report from `allure-results/` (dev
convenience) — the split is CI/published-only.

## Gotchas (hit these before)
- **Stale PATH**: tools installed mid-session aren't seen by already-open terminals/VS Code. Fix: restart VS Code (user PATH is persisted) or `set` env in the session.
- **Run pnpm from inside `spectra/`** (not the parent `Workspace`) or you get `ERR_PNPM_NO_PKG_MANIFEST`.
- **playwright-bdd must be >=9** for Playwright 1.60 (older reached removed internals → `configLoader.js` MODULE_NOT_FOUND).
- **`.features-gen/`** is auto-generated & gitignored — don't edit or commit.
- **VS Code "Undefined step"** is cosmetic (extension config), not a test failure. Config in `.vscode/settings.json`; extension: `CucumberOpen.cucumber-official`. Tests are the source of truth.
- **Headless software-GPU emulator is slow** (cold-start catalog render can exceed 60s); flows use `extendedWaitUntil` and `products` uses a warm launch. Prefer `-gpu auto` windowed.
- **Maestro + Java 24** prints a harmless restricted-method warning; use the bundled JBR 21 to silence.
- **k6 v2 loader doesn't auto-append extensions** — local imports in scenarios MUST be explicit `.ts` (e.g. `from '../lib/journey.ts'`); `performance/tsconfig.json` sets `allowImportingTsExtensions`. k6 v2 only has `extended`/`base` compat modes (no `experimental_enhanced`).
- **Docker stale PATH**: Docker is on the **Machine** PATH, so a VS Code opened *before* install won't see it — fully **quit & reopen** VS Code (not "Reload Window"), or prepend `C:\Program Files\Docker\Docker\resources\bin` to PATH. Invoking `docker.exe` by full path while PATH is stale fails on `docker-credential-desktop` (same bin dir) → prepend that dir to PATH.
- **Grafana dashboard 2587 import is flaky** (panels silently don't bind to the datasource) — use the auto-provisioned `/d/k6-perf` instead.
- **Mobile CI (`reactivecircus/android-emulator-runner`)**: keep `maestro test` on **ONE line** — the action mangles backslash line-continuations (the flow path resolved to a bare `\`). Needs an **Enable KVM** udev step (`echo 'KERNEL=="kvm",...MODE="0666"...' | sudo tee /etc/udev/rules.d/99-kvm4all.rules; udevadm reload+trigger`) or the emulator boots with `-accel off` and hangs at `device offline`. The app isn't committed (`apps/` gitignored), so CI downloads the Sauce demo APK (`saucelabs/my-demo-app-android` release `2.2.0` → `mda-2.2.0-25.apk`) and `adb install`s it. `APP_ID=com.saucelabs.mydemoapp.android` (native app, **not** `.rn`). Android emulator runs on free `ubuntu-latest` (Linux, 1× minutes); iOS needs macOS (10×).
- **Mobile reporting / feature suites**: Maestro emits JUnit (`--format junit --test-suite-name "Mobile (Android) - <name>" --output allure-results/mobile-results-<slug>.xml`) → the `/mobile/` Allure report (case bodies **empty** — JUnit carries no steps). `mobile-tests.yml` is a **feature matrix**: suites `Login` (`--include-tags=login`) and `Products` (`--include-tags=smoke,products`), each a parallel job/emulator. **Allure groups suites by the `<testsuite name>` string across files** — same name = one combined suite; distinct names = separate suites; the `--output` **filenames must stay unique** (merge-multiple overwrites same-named files). `takeScreenshot` → `screenshots/<flow>/<name>.png`, uploaded as `mobile-screenshots-<slug>`. `login-invalid.yaml` was **DELETED** (broken negative test; the `negative`-tag quarantine machinery is gone). For rich mobile steps you'd need a custom Maestro→Allure converter (no off-the-shelf one) or paid Maestro Cloud.
- **CI orchestration (two reports)**: `report.yml` ("E2E Suite + Reports") runs `web/api/mobile-tests.yml` (`workflow_call`-able) **in parallel**, then a `report` job builds **TWO** Allure reports → ONE Pages site. **Split download**: `allure-results-webapi/` (`allure-results-web-*`+`allure-results-api-*`) and `allure-results-mobile/` (`allure-results-mobile-*`), each `merge-multiple`. Per report: history seed (from its `/web-api/` or `/mobile/` subpath) + `executor.json` + `environment.properties` → `pnpm exec allure generate <dir> --clean -o site/<sub>` → landing `site/index.html` → one `upload-pages-artifact`(path: `site`)+`deploy-pages`. `concurrency: pages` + a "remove stale github-pages artifact" step (needs `actions: write`) make re-runs safe. web/api keep `pull_request` triggers; mobile is dispatch/call-only.

## Verified green
API 2/2, Web 2/2 (+ an optional `@demo-fail` web scenario, currently commented out in `login.feature`). Mobile = feature suites `Login` (login flow) + `Products` (smoke+products); `login-invalid` **deleted**. Reporting **split into two Allure reports** — `/web-api/` (rich) + `/mobile/` (flat) — on one Pages site with a landing page. **k6 verified RUNNING via Docker** (2026-06-12): `docker:inspect` dry-run + `docker:smoke` green; load 20 VUs/2 min = 3620 reqs, p95 0.38 ms, 0% fail, streamed to InfluxDB; Grafana dashboard live at `/d/k6-perf`.
