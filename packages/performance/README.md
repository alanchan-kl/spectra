# @spectra/performance

Performance testing with [k6](https://k6.io). Covers all four standard test
types; results visualise in a **free, self-hosted Grafana** dashboard.

## Install k6 (one-time)

k6 is a **system CLI**, not an npm package:

- macOS: `brew install k6`
- Windows: `winget install k6 --source winget` (or `choco install k6`)
- Linux / other: https://k6.io/docs/get-started/installation/

(k6 runs TypeScript directly — no bundling step needed.)

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
# open http://localhost:3000  →  Dashboards
pnpm --filter @spectra/performance grafana:down        # stop the stack
```

The InfluxDB datasource is auto-provisioned. Import the community **k6 Load
Testing Results** dashboard (Grafana.com ID `2587`) to get response-time,
throughput, VU, and error-rate time-series — exactly what demonstrates the
stress / soak / breakpoint / load curves.

> Allure is intentionally **not** used here — it's pass/fail oriented and can't
> render performance time-series. Grafana is the right surface for that.
