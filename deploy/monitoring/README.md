# Production Observability Templates

These files are minimal templates for an operator-managed observability stack. They are not referenced by `deploy/docker-compose.production.yml`, and this repository still does not start Prometheus, Grafana, Loki, or OpenTelemetry Collector containers for production.

## Files

- `otel-collector.yml`: receives OTLP over gRPC `4317` and HTTP `4318`, exposes Prometheus metrics on `9464`, and forwards logs to Loki.
- `prometheus.yml`: scrapes the collector metrics endpoint.
- `grafana/datasources.yml`: provisions Prometheus and Loki data sources.
- `loki.yml`: smallest filesystem-backed Loki shape for a single-node operator-managed deployment.

## Validation

Run the repository-level offline check after changing these files:

```bash
node scripts/verify-observability-template.mjs
pnpm verify:prod-template
```

The check validates wiring only. It does not start containers and does not connect to any external endpoint.

## Runtime Wiring

Application services export to the collector through `.env.production`:

```text
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector.example.com:4318
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
OTEL_TRACES_EXPORTER=otlp
OTEL_METRICS_EXPORTER=otlp
OTEL_LOGS_EXPORTER=otlp
OTEL_PROPAGATORS=tracecontext,baggage
```

Use service-specific `OTEL_SERVICE_NAME` values from `deploy/docker-compose.production.yml` when triaging logs and metrics.
