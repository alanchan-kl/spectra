// @ts-nocheck — these are remote (URL) modules that k6 resolves and bundles at
// runtime; they have no local type declarations, so tsc skips this file.
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

/**
 * Build a k6 `handleSummary()` that writes a JSON + HTML report and prints the
 * text summary. The k6 container's entrypoint (scripts/k6-report-entrypoint.sh)
 * pre-creates `reports/<scenario>-<UTC-timestamp>/` and exports `REPORT_DIR`, so
 * the files land as `report.json` + `report.html` inside that per-run folder.
 * If REPORT_DIR is unset (e.g. native k6 with no wrapper), it falls back to a
 * flat, uniquely-named pair in reports/ (k6 can't create folders itself).
 */
export function makeHandleSummary(name) {
  return function handleSummary(data) {
    const dir = __ENV.REPORT_DIR;
    const path = (ext) =>
      dir
        ? `${dir}/report.${ext}`
        : `reports/${name}-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.${ext}`;
    return {
      [path('json')]: JSON.stringify(data, null, 2),
      [path('html')]: htmlReport(data),
      stdout: textSummary(data, { indent: ' ', enableColors: true }),
    };
  };
}
