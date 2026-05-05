import assert from 'node:assert/strict';
import test from 'node:test';

import { collectObservabilityTemplateIssues } from '../verify-observability-template.mjs';

const composeText = `
services:
  control-api:
    environment:
      OTEL_SERVICE_NAME: aiaget-control-api
      OTEL_EXPORTER_OTLP_ENDPOINT: http://otel-collector:4318
  agent-runtime:
    environment:
      OTEL_SERVICE_NAME: aiaget-agent-runtime
      OTEL_EXPORTER_OTLP_ENDPOINT: http://otel-collector:4318
  web:
    environment:
      OTEL_SERVICE_NAME: aiaget-web
      OTEL_EXPORTER_OTLP_ENDPOINT: http://otel-collector:4318
`;

const envText = `
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector.example.com:4318
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
OTEL_TRACES_EXPORTER=otlp
OTEL_METRICS_EXPORTER=otlp
OTEL_LOGS_EXPORTER=otlp
OTEL_PROPAGATORS=tracecontext,baggage
`;

const collectorText = `
receivers:
  otlp:
    protocols:
      grpc:
      http:
exporters:
  prometheus:
    endpoint: 0.0.0.0:9464
  loki:
    endpoint: http://loki:3100/loki/api/v1/push
  debug:
service:
  pipelines:
    traces:
      receivers: [otlp]
      exporters: [debug]
    metrics:
      receivers: [otlp]
      exporters: [prometheus]
    logs:
      receivers: [otlp]
      exporters: [loki]
`;

const prometheusText = `
scrape_configs:
  - job_name: otel-collector
    static_configs:
      - targets: [otel-collector:9464]
`;

const grafanaDatasourceText = `
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    url: http://prometheus:9090
  - name: Loki
    type: loki
    url: http://loki:3100
`;

const lokiText = `
auth_enabled: false
server:
  http_listen_port: 3100
`;

test('collectObservabilityTemplateIssues accepts the minimal production observability templates', () => {
  assert.deepEqual(
    collectObservabilityTemplateIssues({
      composeText,
      envText,
      collectorText,
      prometheusText,
      grafanaDatasourceText,
      lokiText,
    }),
    [],
  );
});

test('collectObservabilityTemplateIssues reports missing collector and dashboard wiring', () => {
  assert.deepEqual(
    collectObservabilityTemplateIssues({
      composeText: 'services:\n  control-api:\n    environment: {}\n',
      envText: 'OTEL_TRACES_EXPORTER=none\n',
      collectorText: 'receivers: {}\n',
      prometheusText: 'scrape_configs: []\n',
      grafanaDatasourceText: 'datasources: []\n',
      lokiText: 'server: {}\n',
    }),
    [
      'deploy/docker-compose.production.yml must pass OTEL exporter env to control-api',
      'deploy/docker-compose.production.yml must pass OTEL exporter env to agent-runtime',
      'deploy/docker-compose.production.yml must pass OTEL exporter env to web',
      '.env.production.example must define OTEL_EXPORTER_OTLP_ENDPOINT',
      '.env.production.example must export traces through otlp',
      'OpenTelemetry collector template must receive OTLP over grpc',
      'OpenTelemetry collector template must receive OTLP over http',
      'OpenTelemetry collector template must expose Prometheus metrics',
      'OpenTelemetry collector template must export logs to Loki',
      'Prometheus template must scrape the collector metrics endpoint',
      'Grafana datasource template must include Prometheus',
      'Grafana datasource template must include Loki',
      'Loki template must expose HTTP port 3100',
    ],
  );
});
