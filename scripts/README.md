# Scripts

Local development, maintenance, and delivery scripts live here.

## Production Environment Validation

`validate-production-env.mjs` checks a production env file before Compose or application startup. It fails on missing required values, placeholder secrets, weak production secrets, invalid URLs, invalid ports, unsupported workflow/runtime modes, and production fallback modes.

```bash
node scripts/validate-production-env.mjs .env.production
```

The script is intentionally local and dependency-free. It does not connect to external services and does not start containers.

Production validation is intentionally stricter than local development. Agent execution must use `AGENT_RUNTIME_EXECUTION_MODE=runtime_only`, every workflow mode must use `temporal`, and Runtime must set `RUNTIME_TEMPORAL_ENABLED=true`. `runtime_first`, `control_first`, `local`, and `temporal_first` remain useful development or compatibility modes, but they are rejected by the production gate because they allow local fallback execution.

Optional plugin package signature verification is configured through `PLUGIN_SIGNATURE_VERIFIER_URL`, `PLUGIN_SIGNATURE_VERIFIER_TOKEN`, and `PLUGIN_SIGNATURE_VERIFIER_TIMEOUT_MS`. Production validation only checks environment shape; the verifier endpoint itself should be tested by the deployment runbook against an already-running enterprise verifier service.

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

## Production Smoke Probe

`production-smoke.mjs` checks already-running production application endpoints:

```bash
node scripts/production-smoke.mjs \
  --control-api https://api.example.com/api/v1 \
  --runtime https://runtime.example.com/runtime \
  --web https://console.example.com
```

It verifies Control API health, Runtime health through Control API, Runtime direct health, and the Web console login page. It does not start containers or touch middleware.

Provide admin credentials to run authenticated read probes. Add `--require-auth` in production release checks so missing credentials fail instead of silently skipping authenticated probes. Add `--json` to emit redacted evidence for delivery records. Add `--deep` to append production-closure probes for plugin manifest precheck and the production readiness plugin sandbox gate. The deep mode does not install plugins or start infrastructure; the manifest probe expects an incomplete custom plugin package to be rejected by `/plugins/manifest/validate` and may leave a failed precheck audit event.

## Production Runbook Validation

`verify-production-runbook.mjs` checks that the P0-12 release runbook keeps the required release safety sections and commands.

```bash
node scripts/verify-production-runbook.mjs
```

Run its focused tests with:

```bash
node --test scripts/tests/*.test.mjs
```

## External API SDK Package Validation

`validate-external-sdk-package.mjs` checks whether the external API SDK is ready for npm packaging. It validates package metadata, public export paths, publish config, package file allowlist, workspace dependency leakage, and the required SDK build / pack check documentation.

```bash
node scripts/validate-external-sdk-package.mjs
pnpm --filter @aiaget/external-api-sdk pack:check
```

The validation is local and offline. It does not publish to npm, does not contact a registry, and only checks the package contract expected before release.
