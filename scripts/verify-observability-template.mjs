#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function collectObservabilityTemplateIssues({
  composeText,
  envText,
  collectorText,
  prometheusText,
  grafanaDatasourceText,
  lokiText,
}) {
  const issues = [];

  for (const service of ['control-api', 'agent-runtime', 'web']) {
    if (!serviceBlockIncludes(composeText, service, 'OTEL_EXPORTER_OTLP_ENDPOINT')) {
      issues.push(`deploy/docker-compose.production.yml must pass OTEL exporter env to ${service}`);
    }
  }

  if (!/OTEL_EXPORTER_OTLP_ENDPOINT\s*=\s*\S+/m.test(envText)) {
    issues.push('.env.production.example must define OTEL_EXPORTER_OTLP_ENDPOINT');
  }
  if (!/^OTEL_TRACES_EXPORTER\s*=\s*.*\botlp\b/im.test(envText)) {
    issues.push('.env.production.example must export traces through otlp');
  }

  if (!/protocols:\s*[\s\S]*\bgrpc\s*:/m.test(collectorText)) {
    issues.push('OpenTelemetry collector template must receive OTLP over grpc');
  }
  if (!/protocols:\s*[\s\S]*\bhttp\s*:/m.test(collectorText)) {
    issues.push('OpenTelemetry collector template must receive OTLP over http');
  }
  if (!/prometheus:\s*[\s\S]*endpoint:\s*['"]?0\.0\.0\.0:9464['"]?/m.test(collectorText)) {
    issues.push('OpenTelemetry collector template must expose Prometheus metrics');
  }
  if (!/loki:\s*[\s\S]*endpoint:\s*['"]?http:\/\/loki:3100\/loki\/api\/v1\/push['"]?/m.test(collectorText)) {
    issues.push('OpenTelemetry collector template must export logs to Loki');
  }

  if (!/otel-collector:9464/.test(prometheusText)) {
    issues.push('Prometheus template must scrape the collector metrics endpoint');
  }
  if (!/name:\s*Prometheus/i.test(grafanaDatasourceText) || !/type:\s*prometheus/i.test(grafanaDatasourceText)) {
    issues.push('Grafana datasource template must include Prometheus');
  }
  if (!/name:\s*Loki/i.test(grafanaDatasourceText) || !/type:\s*loki/i.test(grafanaDatasourceText)) {
    issues.push('Grafana datasource template must include Loki');
  }
  if (!/http_listen_port:\s*3100/m.test(lokiText)) {
    issues.push('Loki template must expose HTTP port 3100');
  }

  return issues;
}

function serviceBlockIncludes(text, serviceName, needle) {
  const lines = text.split(/\r?\n/);
  const servicePattern = new RegExp(`^\\s{2}${escapeRegExp(serviceName)}:\\s*$`);
  let inBlock = false;
  const blockLines = [];

  for (const line of lines) {
    if (!inBlock && servicePattern.test(line)) {
      inBlock = true;
      blockLines.push(line);
      continue;
    }
    if (!inBlock) continue;
    if (/^\s{2}\S/.test(line)) break;
    blockLines.push(line);
  }

  return blockLines.join('\n').includes(needle);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function readRequiredFile(path) {
  const absolutePath = resolve(process.cwd(), path);
  if (!existsSync(absolutePath)) {
    throw new Error(`Required observability template file not found: ${absolutePath}`);
  }
  return readFileSync(absolutePath, 'utf8');
}

function runCli() {
  const issues = collectObservabilityTemplateIssues({
    composeText: readRequiredFile('deploy/docker-compose.production.yml'),
    envText: readRequiredFile('.env.production.example'),
    collectorText: readRequiredFile('deploy/monitoring/otel-collector.yml'),
    prometheusText: readRequiredFile('deploy/monitoring/prometheus.yml'),
    grafanaDatasourceText: readRequiredFile('deploy/monitoring/grafana/datasources.yml'),
    lokiText: readRequiredFile('deploy/monitoring/loki.yml'),
  });

  if (issues.length > 0) {
    console.error('Production observability template validation failed:');
    for (const issue of issues) console.error(`- ${issue}`);
    process.exitCode = 1;
    return;
  }

  console.log('Production observability template validation passed.');
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  runCli();
}
