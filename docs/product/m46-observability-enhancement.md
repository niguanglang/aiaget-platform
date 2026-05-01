# M46 Observability Enhancement

M46 strengthens the monitor center with trace-level observability without introducing new middleware containers.

## Scope

- Add trace drilldown API:
  - `GET /api/v1/monitor/traces/:traceId`
- Add observability quality API:
  - `GET /api/v1/monitor/observability`
- Extend `/monitor` with:
  - Trace coverage and orphan event metrics.
  - Linked trace, error trace and slow trace counters.
  - Trace timeline with module, source, status, duration and span hints.
  - Propagation quality summary.
  - Slow trace, error trace and top error module panels.

## Data Sources

The implementation uses existing tenant-isolated logs:

```text
operation_log
model_call_log
tool_call_log
knowledge_recall_log
conversation_run.steps
```

No external Prometheus, Grafana, Loki or OpenTelemetry collector is started by this milestone.

## UI Reference

Reference-first frontend assets are stored in:

```text
images/frontend-reference-design/m46-可观测性增强/
```

## Notes

- M46 does not add database tables.
- The API continues to require `monitor:log:view`.
- The trace view is derived from existing `trace_id`, `span_id`, `parent_span_id` and `traceparent` payload fields.
