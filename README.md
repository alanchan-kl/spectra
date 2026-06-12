# Spectra

> Full-spectrum QA automation framework — **web, mobile, API, and performance** testing in one maintainable, scalable TypeScript monorepo.

Spectra is designed to test **multiple systems** from a single codebase: switch the target system and environment with environment variables, reuse shared config and test data across every layer, and view results in one unified report.

## Test layers

| Layer | Tool | Style | Reporting |
| --- | --- | --- | --- |
| Web E2E | [Playwright](https://playwright.dev) + [playwright-bdd](https://github.com/vitalets/playwright-bdd) | Gherkin `.feature` | Allure |
| API | Playwright `APIRequestContext` | Gherkin `.feature` | Allure |
| Mobile (iOS + Android) | [Maestro](https://maestro.mobile.dev) | YAML flows | Allure (via JUnit) |
| Performance | [k6](https://k6.io) | TS scenarios (load/stress/breakpoint/soak) | Grafana + InfluxDB |

Everything in the stack is **free and open source**.

## Prerequisites

- **Node.js** >= 20
- **pnpm** (`npm install -g pnpm`)
- **Java** 8+ (for Allure report generation)
- **Maestro CLI** (mobile only) — `curl -Ls "https://get.maestro.mobile.dev" | bash`
- **k6** (performance only) — see https://k6.io/docs/get-started/installation/
- **Docker** (optional, for the Grafana performance dashboard)

## Quick start

```bash
pnpm install                 # install all workspace dependencies
pnpm --filter @spectra/web exec playwright install   # download browsers

# Run a layer
pnpm test:web                # web E2E (Gherkin)
pnpm test:api                # API tests (Gherkin)
pnpm test:mobile             # mobile flows (Maestro)
pnpm test:performance        # k6 smoke test

# Unified functional report (web + API + mobile)
pnpm report
```

## Targeting a system / environment

Spectra resolves the target from `SYSTEM` and `ENV` environment variables (see [packages/shared/src/config](packages/shared/src/config)):

```bash
SYSTEM=system-b ENV=staging pnpm test:web
```

| Variable | Values | Default |
| --- | --- | --- |
| `SYSTEM` | `system-a`, `system-b` | `system-a` |
| `ENV` | `dev`, `staging`, `prod` | `dev` |

## Repository layout

```
packages/
  shared/        # config (systems + environments), test-data factories, types, helpers
  web/           # Playwright + playwright-bdd — web E2E & API (Gherkin)
  mobile/        # Maestro — iOS + Android YAML flows
  performance/   # k6 scenarios + docker-compose for Grafana/InfluxDB
```

See the full design in `.claude/plans/im-a-software-qa-shimmering-pebble.md`.
