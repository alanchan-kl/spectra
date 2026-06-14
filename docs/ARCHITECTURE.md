# Spectra — Architecture & Scripting Guide

A beginner-friendly map of how this repo is wired and what to keep in mind when you
start writing tests. If you ever feel lost in the folder structure, start here.

- **Project root:** the `spectra/` repo folder (the one containing `pnpm-workspace.yaml`).
- **Golden rule:** open *this* folder as your VS Code workspace root, and run every
  `pnpm` command from inside it.

---

## 1. The big picture — one roof over four toolkits

`spectra` is not one project. It's a **monorepo**: one roof over **four separate test
packages**, each owning a different kind of testing. They share one config "brain".

```
spectra/  ← pnpm workspace root (you run pnpm from HERE)
│
├── packages/shared/        🧠 THE BRAIN — no tests, just config + data
│                              "what URL? what creds? what environment?"
│                              everyone imports from here as @spectra/shared
│
├── packages/web/           🌐 WEB + API tests (both live here, same Playwright runner)
│                              language: Gherkin .feature files
│
├── packages/mobile/        📱 MOBILE tests (Maestro)
│                              language: YAML flows
│
└── packages/performance/   ⚡ LOAD tests (k6)
                               language: TypeScript scenarios
```

Why split this way? Each layer uses a **different tool that speaks a different
language**, so each gets its own folder. The only thing they all agree on is
"ask `@spectra/shared` for the config." That seam is what holds it together.

```
                    ┌─────────────────────┐
                    │  @spectra/shared    │   getConfig() returns:
                    │  (the brain)        │   • webBaseUrl / apiBaseUrl
                    └─────────┬───────────┘   • appId  • credentials
                              │               • timeout / retries / headless
          ┌───────────────────┼───────────────────┐
          │ imports           │ imports           │ (reads same env vars)
          ▼                   ▼                   ▼
   ┌────────────┐      ┌────────────┐      ┌──────────────┐
   │    web     │      │   mobile   │      │ performance  │
   │ Playwright │      │  Maestro   │      │     k6       │
   └────────────┘      └────────────┘      └──────────────┘
          │                   │                   │
          └───────────────────┴───────────────────┘
                              ▼
                  Reporting: Allure (functional) + Grafana (perf)
```

The `SYSTEM` / `ENV` / `PLATFORM` environment variables are the **single knob** that
changes what everything points at. You never hardcode a URL in a test — you ask
`getConfig()`.

| Env var | Values | Default | Controls |
| --- | --- | --- | --- |
| `SYSTEM` | `system-a`, `system-b` | `system-a` | Which target system (URLs, app IDs) |
| `ENV` | `dev`, `staging`, `prod` | `dev` | Which environment of that system |
| `PLATFORM` | `android`, `ios` | `android` | Which mobile app ID resolves |
| `TEST_USERNAME` / `TEST_PASSWORD` | any | saucedemo demo creds | Login credentials |

Example: `SYSTEM=system-b ENV=staging pnpm test:web`

---

## 2. How ONE test flows through the layers (the key mental model)

A web test is split across **4 files on purpose**, each with exactly one job. Here is
the real login test, traced top to bottom.

```
┌─ 1. WHAT to test (business language) ──────────────────────────────┐
│  packages/web/features/web/login.feature                           │
│                                                                    │
│    Scenario: Successful login with valid credentials               │
│      Given I am on the login page          ◄── plain English       │
│      When  I log in with valid credentials                         │
│      Then  I should see the products page                          │
└───────────────────────────┬────────────────────────────────────────┘
                            │  each line is matched, by text, to…
                            ▼
┌─ 2. HOW each sentence maps to an action ───────────────────────────┐
│  packages/web/step-definitions/web/login.steps.ts                  │
│                                                                    │
│    Given('I am on the login page', async ({ loginPage }) => {      │
│      await loginPage.goto();              ◄── calls the page object │
│    });                                                             │
│    When('I log in with valid credentials', async ({loginPage}) =>{ │
│      await loginPage.login(config.credentials.username, …)         │
│    });                                     ▲                        │
└────────────────────────────┬──────────────┼────────────────────────┘
                            │              └── creds came from @spectra/shared
                            ▼
┌─ 3. WHERE things are on the screen (selectors) ────────────────────┐
│  packages/web/pages/login.page.ts   (a "Page Object")              │
│                                                                    │
│    readonly username = this.page.locator('[data-test="username"]') │
│    async login(user, pass) {                                       │
│      await this.username.fill(user);     ◄── the ONLY file that    │
│      await this.password.fill(pass);         knows CSS selectors   │
│      await this.loginButton.click();                               │
│    }                                                               │
└────────────────────────────┬────────────────────────────────────────┘
                            │  page objects are handed to steps via…
                            ▼
┌─ 4. WIRING — hands a fresh loginPage to every scenario ────────────┐
│  packages/web/fixtures/test.ts                                     │
│                                                                    │
│    loginPage: async ({ page }, use) => use(new LoginPage(page))    │
│    export const { Given, When, Then } = createBdd(test)            │
└────────────────────────────────────────────────────────────────────┘
```

When you read a step like `async ({ loginPage }) => …`, that `loginPage` isn't magic —
`fixtures/test.ts` constructs it fresh for each scenario and injects it. That's the
whole trick.

**Why 4 files instead of 1 script?** Because each layer changes for a different reason:

- The button's CSS changed → fix **only** the page object; every test keeps working.
- New test case using existing steps → add **only** a Scenario; write zero code.
- New kind of action → add **one** step definition, then reuse it forever.

You can already see this reuse: `login.feature` has two scenarios but the single
`login()` page method serves both the valid login and the `locked_out_user` case.

### The auto-generated 5th layer: `.features-gen/`

When you run a test, `bddgen` reads your `.feature` files and **auto-generates** real
Playwright spec files into `.features-gen/`. It is gitignored and **you never touch
it** — it's just the machine translation of your Gherkin into runnable code. Web/API
test commands run `bddgen && playwright test`.

---

## 3. Web & API — file linkage in detail

Both web and API live in `packages/web` and share one step/fixture pool.

### 3.1 Who imports whom (static graph — follow the arrows)

```
                         @spectra/shared  (the brain: getConfig, types)
                              ▲   ▲   ▲
              imports getConfig│   │   │imports getConfig + types
        ┌──────────────────────┘   │   └────────────────────────┐
        │                          │                            │
playwright.config.ts        login.steps.ts  ◄── for creds   posts.client.ts
        │                          │                            ▲
        │ scans → generates        │ imports Given/When/Then    │ class used by
        ▼                          ▼                            │
   .features-gen/            ┌──────────────────┐               │
                            │ fixtures/test.ts │───────────────┘
                            │   (THE HUB)      │  imports LoginPage,
                            └──────────────────┘  InventoryPage, PostsClient
                                   ▲   ▲                  │
        imports Given/When/Then ───┘   └─── imports ──────┤
        from the hub                                      ▼
   login.steps.ts   posts.steps.ts            pages/login.page.ts
                                              pages/inventory.page.ts
                                                       │ extends
                                                       ▼
                                              pages/base.page.ts
```

Two things to read off this:

- **Everything that runs imports `Given/When/Then` from `fixtures/test.ts`** — never
  from `playwright-bdd` directly.
- **`fixtures/test.ts` is the only file that imports the page objects + client.** That's
  how it can inject them. Add a new page object → register it here once.

### 3.2 Run-time trace — the WEB path

Trace of `Given I am on the login page`:

```
features/web/login.feature
   "Given I am on the login page"
        │  bddgen matches the text →
        ▼
step-definitions/web/login.steps.ts
   Given('I am on the login page', ({ loginPage }) => loginPage.goto())
        │            ▲
        │            └── loginPage injected by fixtures/test.ts (new LoginPage(page))
        ▼
pages/login.page.ts
   goto() → super.goto('/')
        ▼
pages/base.page.ts
   goto('/') → page.goto('/')
        │
        └── '/' resolves against baseURL = config.webBaseUrl
            ← playwright.config.ts ← getConfig() ← @spectra/shared
```

### 3.3 Run-time trace — the API path (mirror image, no browser)

Trace of `When I request post 1`:

```
features/api/posts.feature
   "When I request post 1"
        ▼
step-definitions/api/posts.steps.ts
   When('I request post {int}', ({ postsClient, apiWorld }, id) =>
        apiWorld.lastResponse = postsClient.getPost(id))
        │              ▲                    │
        │  apiWorld ───┘ (fresh per scenario, carries the response to the Then step)
        ▼
api/posts.client.ts
   getPost(id) → request.get(`/posts/${id}`)
        │
        └── baseURL = config.apiBaseUrl ← playwright.config.ts (project "api")
```

The API path uses `request` instead of `page`, and `apiWorld` to carry the response
from a `When` step to the `Then` that asserts on it. Because it never touches the
`page`-backed fixtures, **no browser is launched** — that's why API tests are fast.

### 3.4 The trigger — how a `pnpm` command kicks it off

```
pnpm test:web                          (from packages/web/package.json)
   = bddgen          → reads features/ + steps/ (per playwright.config.ts),
   │                   writes runnable specs into .features-gen/
   && playwright test --project=web   → runs those specs
```

---

## 4. Mobile (Maestro) — file linkage

No codegen, no page objects, no imports — **what you write is what runs**. The only
linking mechanism is `runFlow` (one YAML file pulls in another).

```
packages/mobile/
├── config.yaml          ⚙️ workspace config: which flows + execution order
├── flows/               📋 the TESTS (one file = one runnable test)
│   ├── smoke.yaml
│   ├── login.yaml
│   ├── login-invalid.yaml
│   └── products.yaml
├── subflows/            🔁 reusable ACTIONS (the DRY layer — Maestro's "page objects")
│   ├── launch.yaml          → cold start (clearState: true)
│   ├── open-catalog.yaml    → warm launch + wait for "Products"
│   └── login.yaml           → the login ACTION (menu → form → submit)
└── apps/                📦 built app binaries (gitignored)
```

### Linkage (every arrow is a `runFlow:`)

```
flows/smoke.yaml          └─ runFlow ─► subflows/launch.yaml
flows/login.yaml          └─ runFlow ─► subflows/login.yaml ─runFlow─► launch.yaml
flows/login-invalid.yaml  └─ runFlow ─► subflows/login.yaml   (SAME action, BAD creds via env)
flows/products.yaml       └─ runFlow ─► subflows/open-catalog.yaml
```

The single `subflows/login.yaml` action serves **both** `login.yaml` (happy path) and
`login-invalid.yaml` (negative) — the caller passes creds via `runFlow.env` and makes
its own assertion. Same idea as reusing a web page object.

### Key facts

- **Selectors** are Android resource-ids (`nameET`, `passwordET`, `loginBtn`) or visible
  text (`"Products"`) — never CSS. Discover them live with
  `pnpm --filter @spectra/mobile studio`.
- **`appId`** comes from `${APP_ID}`, injected by the package.json script
  (`maestro test -e APP_ID=com.saucelabs.mydemoapp.android flows/`); `test:ios` passes
  the iOS bundle id instead. Mobile does **not** import `@spectra/shared` — it mirrors
  the same multi-system idea via that env flag.
- **Run-time:** `maestro test … flows/` reads `config.yaml` for execution order, then
  runs each flow top-to-bottom, inlining every `runFlow`.

### Parallel execution (multiple devices)

There are **two layers** of parallelism — don't conflate them:

| Layer | Splits work across… | Mechanism |
| --- | --- | --- |
| **Device sharding** | N devices on **one machine** | Maestro flags |
| **Job matrix** | N **CI runners** (1 emulator each) | GitHub Actions `matrix` |

Maestro's sharding only sees devices connected to the *same* host; to scale across
separate CI runners you use a job matrix.

**Maestro flags** (verified on 2.6.0): `--shard-split N` splits the flows *evenly* across
N connected devices (faster); `--shard-all N` runs the *whole* suite on *each* device
(cross-device coverage); `--device "id1,id2"` pins specific devices. Flows must be
**independent** to shard safely — Spectra's are (every flow self-launches via a subflow).

**Local (2 emulators):** both instances of one AVD must be `-read-only` (a writable
instance locks the AVD exclusively), on distinct ports:

```powershell
emulator -avd spectra_pixel -read-only -gpu auto -port 5554   # terminal 1
emulator -avd spectra_pixel -read-only -gpu auto -port 5556   # terminal 2
adb devices                                                   # both show "device"
pnpm --filter @spectra/mobile test:parallel                   # = maestro --shard-split 2
```
`test:parallel` (split, for speed) and `test:all-devices` (`--shard-all`, for coverage)
live in `packages/mobile/package.json`.

**CI (`mobile-tests.yml`):** the `android` job is a **tag matrix** —
`matrix.shard: [smoke, login, products]`. Each runner boots its own emulator and runs one
tag group (`--include-tags=${{ matrix.shard }}`); free runners fit ~1 emulator, so the
matrix *is* the parallelism (Maestro `--shard-split` inside one job buys nothing there).
Two rules make the merge work, both because `report.yml` merges with `merge-multiple`
(same-named files overwrite):
1. unique JUnit per shard → `--output allure-results/mobile-results-${{ matrix.shard }}.xml`
2. unique artifact per shard → `name: allure-results-mobile-android-${{ matrix.shard }}`

`report.yml` needs no change — its `allure-results-*` + `merge-multiple` already gathers
every shard, and `needs: [mobile]` waits for all matrix legs.

> ⚠️ `--exclude-tags=negative` is currently applied (local scripts + CI login shard) to
> **quarantine the broken `login-invalid` flow** — its assertion (`loginBtn` stays
> visible) is wrong for this app build, which returns to the catalog after a bad login.
> Remove the flag once the negative test is rewritten to check auth state (menu shows
> `Log In` / no `Log Out`) rather than screen.

---

## 5. Performance (k6) — file linkage

A different shape (no Gherkin), but the **same "reuse the action, vary the profile"**
philosophy: one shared user journey, many load profiles.

```
packages/performance/
├── src/
│   ├── config.ts            🧠 standalone config resolver (apiBaseUrl)
│   ├── lib/
│   │   ├── journey.ts       🔁 the reusable user journey (shared by load/stress/soak)
│   │   └── summary.ts       📄 writes a JSON+HTML report per run
│   └── scenarios/           📋 the TESTS (one file = one load profile)
│       ├── smoke.ts             1 VU / 1 iteration
│       ├── load.ts              ramp to peak + hold
│       ├── stress.ts  soak.ts  breakpoint.ts
├── thresholds.ts            ✅ pass/fail SLA gates (k6 exits non-zero on breach)
├── docker-compose.yml       🐳 influxdb + grafana + mockapi + k6 services
└── grafana/provisioning/    📊 auto-provisioned dashboard + datasource
```

### Import graph

```
scenarios/load.ts ──imports──► lib/journey.ts ──imports──► config.ts  (apiBaseUrl)
      │                              │                          │
      │ imports                      └─ http.get(...) the API   └─ reads k6 __ENV:
      ├──► thresholds.ts  (journeyThresholds = the pass/fail gate)   BASE_URL / SYSTEM / ENV
      └──► lib/summary.ts (makeHandleSummary = report writer)

scenarios/smoke.ts ──imports──► config.ts (calls apiBaseUrl directly, no journey)
      ├──► thresholds.ts  (defaultThresholds)
      └──► lib/summary.ts
```

### How a scenario file is shaped

Every scenario exports the three things k6 looks for:

| Export | Role | Example |
| --- | --- | --- |
| `options` | the test SHAPE — VUs/stages + thresholds | `load.ts`: ramp 0→20 VUs |
| `default function` | what each VU runs every iteration | calls `userJourney()` |
| `handleSummary` | writes the per-run report | `makeHandleSummary('load')` |

### Key facts

- ⚠️ **Local imports MUST end in `.ts`** (`from '../lib/journey.ts'`). k6 v2 does not
  auto-append the extension — omit it and the run fails to load.
- **`config.ts` is standalone** — k6's Goja runtime can't import `@spectra/shared`, so
  it re-implements the same SYSTEM/ENV pattern reading k6's `__ENV`. An explicit
  `-e BASE_URL=…` always wins.
- **`thresholds.ts` is the gate:** a breached threshold makes k6 exit non-zero → CI
  fails. `journeyThresholds` even sets per-endpoint SLAs via `{name:…}` / `{group:…}`
  tags emitted by `journey.ts`.
- **Never load-test the public demos** — point `BASE_URL` at your own target or the
  bundled `mockapi`.

### Run-time / trigger

```
pnpm --filter @spectra/performance docker:load
   = docker compose run --rm k6 run src/scenarios/load.ts
        → k6 reads `options`  (ramp to 20 VUs)
        → runs `default()` per VU/iteration → userJourney() → http.get(apiBaseUrl()+...)
        → checks results against thresholds.ts  (pass/fail gate)
        → handleSummary writes reports/<scenario>-<ts>/report.{json,html}
```

---

## 6. ✅ Checklist: things to note when you start scripting

In priority order:

1. **Always run `pnpm` from inside `spectra/`**, never the parent `Workspace` folder
   (otherwise: `ERR_PNPM_NO_PKG_MANIFEST`).

2. **Never edit `.features-gen/`** — it's generated. Edit `.feature` files; `bddgen`
   rebuilds the rest.

3. **A new web/API test touches only 2–3 files (often just 1):**
   - Reusing existing steps? → add a `Scenario` to a `.feature`, **write no code**.
   - New action/sentence? → add one `Given/When/Then` in the matching `.steps.ts`.
   - New element on screen? → add the locator to a `.page.ts`.
   - **Never put a CSS selector in a step file** — that's the one rule the whole
     design depends on. Selectors live in page objects only.

4. **Import `Given/When/Then` from `../../fixtures/test`** — *not* from `playwright-bdd`
   directly. That local import is what gives your steps the `loginPage` / `postsClient`
   fixtures.

5. **Never hardcode URLs, credentials, or environments.** Call `getConfig()` from
   `@spectra/shared` (as the steps already do). To retarget tests, change the
   `SYSTEM` / `ENV` env vars — not the test.

6. **Reuse existing step text before writing a new step.** `playwright-bdd` matches by
   the sentence string, so reuse `I am on the login page` rather than inventing
   `I navigate to login`, or you create a duplicate step for the same behaviour.

7. **VS Code's yellow "Undefined step" squiggle is cosmetic** (an extension config
   quirk), not a test failure. The test run is the source of truth.

8. **Mobile:** discover real selectors live with
   `pnpm --filter @spectra/mobile studio` before writing taps — don't guess
   resource-ids.

9. **Fastest feedback loop:** `pnpm test:api` (no browser) is the quickest way to sanity
   -check the Gherkin ↔ steps wiring before running the slower `pnpm test:web`.

---

## 7. Quick command reference

```bash
pnpm install                                                  # first time
pnpm --filter @spectra/web exec playwright install chromium   # first time (browsers)

pnpm test:api          # API Gherkin (no browser) — fastest
pnpm test:web          # web Gherkin (headless Chromium)
pnpm test:mobile       # Maestro flows (needs an emulator running)
pnpm test:performance  # k6 smoke
pnpm report            # build + open the unified Allure report
```

---

## 8. File-by-file cheat sheet

**Web / API**

| You want to… | Open this | Example |
| --- | --- | --- |
| Add/adjust a test case | `packages/web/features/**/*.feature` | `features/web/login.feature` |
| Define what a new sentence does | `packages/web/step-definitions/**/*.steps.ts` | `step-definitions/web/login.steps.ts` |
| Add/fix a web selector or page action | `packages/web/pages/*.page.ts` | `pages/login.page.ts` |
| Add/fix an API call | `packages/web/api/*.client.ts` | `api/posts.client.ts` |
| Wire up a new page object / client | `packages/web/fixtures/test.ts` | — |

**Mobile (Maestro)**

| You want to… | Open this | Example |
| --- | --- | --- |
| Add a mobile test | new `packages/mobile/flows/*.yaml` | `flows/products.yaml` |
| Add/reuse a shared action | `packages/mobile/subflows/*.yaml` | `subflows/login.yaml` |
| Change flow order / which flows run | `packages/mobile/config.yaml` | — |
| Find a real selector id | `pnpm --filter @spectra/mobile studio` | — |

**Performance (k6)**

| You want to… | Open this | Example |
| --- | --- | --- |
| Add/adjust a load profile | `packages/performance/src/scenarios/*.ts` | `scenarios/load.ts` |
| Change the shared user journey | `packages/performance/src/lib/journey.ts` | — |
| Change pass/fail SLAs | `packages/performance/thresholds.ts` | — |
| Change the target URL resolver | `packages/performance/src/config.ts` | — |

**Shared (all layers)**

| You want to… | Open this | Example |
| --- | --- | --- |
| Change a target URL / app ID | `packages/shared/src/config/systems/*.ts` | `systems/system-a.ts` |
| Change timeouts / retries per env | `packages/shared/src/config/environments/` | — |
| Generate fake test data | `packages/shared/src/data/factories.ts` | — |

---

## 9. Setting / replacing the env in CI (GitHub Actions)

**Core idea:** tests read the target from environment variables at run time
(`getConfig()` for web/API/shared; k6's `__ENV` for performance). You **never edit test
code to switch system/env in CI — you set the variables in the workflow.** Precedence is
always: *CI-set env var > built-in default*.

### Where each variable is set

| Variable | Layer | How CI supplies it |
| --- | --- | --- |
| `SYSTEM`, `ENV` | web, API, performance | job `env:` block (often matrix-fed) |
| `TEST_USERNAME`, `TEST_PASSWORD` | web | GitHub **secrets** → mapped into `env:` |
| `BASE_URL` | performance (k6) | `-e BASE_URL=…` flag on `k6 run` (wins over SYSTEM/ENV) |
| `APP_ID` | mobile (Maestro) | `-e APP_ID=…` flag on `maestro test` (no SYSTEM/ENV) |

### Three patterns — all already used in this repo

**1. Static** — hardcode in the job `env:` block (see `performance-tests.yml`):

```yaml
env:
  SYSTEM: system-a
  ENV: staging
```

**2. Matrix fan-out** — run several `system × env` combos in PARALLEL (see
`web-tests.yml` / `api-tests.yml`). Add a combo by extending the arrays — no code change:

```yaml
strategy:
  matrix:
    system: [system-a, system-b]   # add system-b
    env: [staging, prod]           # add prod  → 2×2 = 4 parallel jobs
env:
  SYSTEM: ${{ matrix.system }}
  ENV: ${{ matrix.env }}
```

**3. Pick at trigger time** — `workflow_dispatch` inputs give a dropdown when you click
"Run workflow" (`performance-tests.yml` does this for `scenario`; same shape for `ENV`):

```yaml
on:
  workflow_dispatch:
    inputs:
      env: { type: choice, default: staging, options: [dev, staging, prod] }
jobs:
  web:
    env:
      ENV: ${{ github.event.inputs.env || 'staging' }}
```

### Credentials = secrets, never literals

`TEST_USERNAME` / `TEST_PASSWORD` come from GitHub secrets, mapped into `env:`:

```yaml
env:
  TEST_USERNAME: ${{ secrets.TEST_USERNAME }}
  TEST_PASSWORD: ${{ secrets.TEST_PASSWORD }}
```

Set them in **Settings → Secrets and variables → Actions**. An unset secret arrives as
an empty string `""`; `getConfig()`'s `envOr()` helper treats empty as absent and falls
back to the demo creds, so a missing secret won't silently log in blank.

### Per-layer quirks

- **Web / API** — a matrix-fed job `env:` is all you need; `getConfig()` does the rest.
- **Performance (k6)** — k6 auto-copies OS env into `__ENV`, so job-level
  `env: { SYSTEM, ENV }` reaches `apiBaseUrl()`. For a one-off target add
  `-e BASE_URL=…` to `k6 run`. **Never point load at a public demo.**
- **Mobile (Maestro)** — does *not* read SYSTEM/ENV. The target app is the
  `-e APP_ID=…` flag on `maestro test` (Android pkg in CI); for iOS, pass the iOS bundle
  id on a macOS runner.
- **Orchestrator** — `report.yml` calls web/API/mobile as reusable workflows with
  `secrets: inherit`, so secrets set once reach every called suite.

---

## 10. Setting / replacing the env locally (Windows)

Same mechanism as CI — `getConfig()` reads `process.env.SYSTEM` / `ENV` — you just set
the vars in your shell first. **The `SYSTEM=system-b … pnpm test:web` form in the README
is bash; it does NOT work in PowerShell.** Use the syntax for your shell:

**PowerShell** (the default shell here) — set `$env:` vars, then run:

```powershell
$env:SYSTEM = "system-b"; $env:ENV = "staging"; pnpm test:web
```

> ⚠️ `$env:` vars **persist for the whole terminal session** — every later `pnpm` run in
> that window keeps using them. Clear them with:
> ```powershell
> Remove-Item Env:SYSTEM, Env:ENV   # back to defaults (system-a / dev)
> ```

**Git Bash** — POSIX inline prefix (one-shot, scoped to just that command):

```bash
SYSTEM=system-b ENV=staging pnpm test:web
```

**cmd.exe:**

```cmd
set SYSTEM=system-b && set ENV=staging && pnpm test:web
```

### Per-layer, locally

- **Web / API** — set `SYSTEM` + `ENV` (and `TEST_USERNAME` / `TEST_PASSWORD` to override
  creds). `getConfig()` does the rest.
- **Performance (k6)** — prefer per-run `-e` flags (no session leak); `-e BASE_URL=…`
  wins over SYSTEM/ENV. The `docker:load:mock` script already sets
  `-e BASE_URL=http://mockapi`.
- **Mobile (Maestro)** — ignores SYSTEM/ENV. Switch platform via the dedicated script
  (`pnpm --filter @spectra/mobile test` = Android vs `test:ios`); override the app with
  `-e APP_ID=…`.

### Local vs CI — one mechanism, two ways to set it

```
       getConfig() reads process.env.SYSTEM / ENV   ← identical in both
   ┌──────────────────────────┬──────────────────────────┐
   │ LOCAL                     │ CI                        │
   │ $env:SYSTEM = "..."       │ job  env:  SYSTEM: ...    │
   │ (PowerShell, per session) │ (or matrix / dispatch)    │
   └──────────────────────────┴──────────────────────────┘
```

---

> See also: `README.md` (full setup + perf workflow) and the `/spectra` playbook for
> environment provisioning and CI details.
