#!/bin/sh
# k6 container entrypoint wrapper.
#
# k6 cannot create directories when writing its end-of-test summary, so for a
# `k6 run` we pre-create reports/<scenario>-<UTC-timestamp>/ here and pass it to
# the report helper via REPORT_DIR. handleSummary() then writes report.json +
# report.html into that folder. Non-run commands (inspect, version, ...) pass
# straight through and create nothing.
if [ "$1" = run ]; then
  script=""
  for a in "$@"; do
    case "$a" in *.ts) script="$a" ;; esac
  done
  REPORT_DIR="reports/$(basename "$script" .ts)-$(date -u +%Y-%m-%dT%H-%M-%S)"
  export REPORT_DIR
  mkdir -p "$REPORT_DIR"
fi
exec k6 "$@"
