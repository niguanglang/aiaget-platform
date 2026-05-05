# Scripts

Local development, maintenance, and delivery scripts live here.

## Production Environment Validation

`validate-production-env.mjs` checks a production env file before Compose or application startup. It fails on missing required values, placeholder secrets, weak production secrets, invalid URLs, invalid ports, and unsupported workflow/runtime modes.

```bash
node scripts/validate-production-env.mjs .env.production
```

The script is intentionally local and dependency-free. It does not connect to external services and does not start containers.

## Observability Template Validation

`verify-observability-template.mjs` checks the production Compose OTEL env wiring and the offline monitoring templates under `deploy/monitoring`.

```bash
node scripts/verify-observability-template.mjs
```

It validates template text only. It does not start Prometheus, Grafana, Loki, OpenTelemetry Collector, or application containers.

## Trace Propagation Probe

`verify-trace-propagation.mjs` verifies that a known W3C trace id survives a running Control API health request and a running Runtime deterministic response request.

```bash
node scripts/verify-trace-propagation.mjs \
  --control-api https://api.example.com/api/v1 \
  --runtime https://runtime.example.com/runtime
```

The probe connects only to already-running endpoints. It does not start services and it uses a deterministic Runtime request without model provider credentials.

Run its focused tests with:

```bash
node --test scripts/tests/*.test.mjs
```
