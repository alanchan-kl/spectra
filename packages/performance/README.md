# @spectra/performance

Performance testing with [k6](https://k6.io). Covers all four standard test
types; results visualise in a **free, self-hosted Grafana** dashboard.

## Install k6 (one-time)

k6 is a **system CLI**, not an npm package:

- macOS: `brew install k6`
- Windows: `winget install k6 --source winget` (or `choco install k6`)
- Linux / other: https://k6.io/docs/get-started/installation/

(k6 runs TypeScript directly — no bundling step needed.)

## Run k6 in Docker (no native install)

Prefer not to install k6 (or Node tooling) on your machine? Run it as a
container — the only host prerequisite is **Docker Desktop**. A `k6` service is
defined in [docker-compose.yml](docker-compose.yml) (behind the `k6` profile, so
it doesn't start with `grafana:up`). Commands below are
`pnpm --filter @spectra/performance <script>` from the repo root, or raw
`docker compose ...` from inside `packages/performance/`.

### 0. Prerequisite (one-time)

Install **Docker Desktop** and make sure it's running (`docker version` works).
The first run pulls the `grafana/k6` image (one-time, ~tens of MB).

### 1. Dry run — zero traffic (validate, send no requests)

```bash
pnpm --filter @spectra/performance docker:inspect
# raw form, any scenario:
docker compose run --rm k6 inspect src/scenarios/stress.ts
```

`k6 inspect` parses the script and prints the resolved options/stages/thresholds
as JSON **without running iterations** — 0 requests. It catches bad imports,
malformed stages, and invalid thresholds, with no k6 or Node on the host.

### 2. Dry run — minimal real run (one request)

```bash
pnpm --filter @spectra/performance docker:smoke    # 1 VU, 1 iteration, single GET
```

### 3. Real test types (point at your OWN target, never the public demo)

```bash
docker compose run --rm k6 run src/scenarios/load.ts
docker compose run --rm k6 run -e SYSTEM=system-b -e ENV=staging src/scenarios/load.ts
docker compose run --rm k6 run -e DURATION=10s src/scenarios/soak.ts   # only soak honours DURATION
```

> Heavy scenarios (`load`/`stress`/`breakpoint`/`soak`) define an
> `options.scenarios` block, so k6 **ignores** `--vus`/`--iterations` flags. Use
> `smoke` or `inspect` for a quick/dry check.

### 4. With the Grafana dashboard

```bash
pnpm --filter @spectra/performance grafana:up          # starts influxdb + grafana
pnpm --filter @spectra/performance docker:load:influx  # k6 -> influxdb (container hostname)
# open http://localhost:3000/d/k6-perf  (auto-provisioned, no import)
pnpm --filter @spectra/performance grafana:down
```

Inside the k6 container the metrics target is `http://influxdb:8086/k6` (a peer
container), **not** `localhost`.

### 5. Real load curves against a local mock (no public target)

The compose stack includes a tiny `mockapi` (nginx) that mimics `/posts` and
`/posts/1`, so you can generate real load curves **without hitting any public
API**. Scenarios honour a `BASE_URL` override (see `src/config.ts`); the
`docker:load:mock` script points k6 at the mock and streams to InfluxDB:

```bash
pnpm --filter @spectra/performance grafana:up        # influxdb + grafana + mockapi
pnpm --filter @spectra/performance docker:load:mock  # ~2 min load against mockapi -> influxdb
# open http://localhost:3000/d/k6-perf  (auto-provisioned; set range to "Last 15 minutes")
pnpm --filter @spectra/performance grafana:down
```

> Note: k6's loader does not auto-append extensions, so local imports in the
> scenarios use explicit `.ts` (e.g. `import { userJourney } from '../lib/journey.ts'`).
> `tsconfig.json` sets `allowImportingTsExtensions` so `tsc` accepts them too.

## Test types

| Script | Command | What it shows |
| --- | --- | --- |
| Smoke | `pnpm --filter @spectra/performance test:smoke` | Sanity: system responds |
| Load | `pnpm --filter @spectra/performance test:load` | Behaviour at expected peak |
| Stress | `pnpm --filter @spectra/performance test:stress` | Where it degrades past peak |
| Breakpoint | `pnpm --filter @spectra/performance test:breakpoint` | Exact breaking capacity (aborts on SLA breach) |
| Soak | `pnpm --filter @spectra/performance test:soak` | Leaks/exhaustion over time (`-e DURATION=10m` to shorten) |

Thresholds in [thresholds.ts](thresholds.ts) act as the pass/fail gate — a
breach makes k6 exit non-zero and fails the CI job.

## Multi-system

Scenarios resolve the target from `__ENV` (see [src/config.ts](src/config.ts)):

```bash
k6 run -e SYSTEM=system-b -e ENV=staging src/scenarios/load.ts
```

## Grafana dashboard (free, self-hosted)

```bash
pnpm --filter @spectra/performance grafana:up          # start InfluxDB + Grafana (Docker)
pnpm --filter @spectra/performance test:load:influx    # run load test, stream metrics to InfluxDB
# open http://localhost:3000/d/k6-perf                 # the k6 dashboard
pnpm --filter @spectra/performance grafana:down        # stop the stack
```

Both the InfluxDB datasource **and** a **k6 Load Testing Results** dashboard are
auto-provisioned (see [grafana/provisioning/](grafana/provisioning/)) — no manual
import. Open `/d/k6-perf` for response-time, throughput, VU, and error-rate
time-series, exactly what demonstrates the stress / soak / breakpoint / load
curves.

> Allure is intentionally **not** used here — it's pass/fail oriented and can't
> render performance time-series. Grafana is the right surface for that.
