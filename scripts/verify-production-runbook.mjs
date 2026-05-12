#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const requiredSections = [
  '数据库迁移与 Seed',
  '备份与恢复',
  '健康检查',
  '业务 Smoke',
  '观测与 Trace',
  '回滚',
];

const requiredMentions = [
  'pnpm validate:prod-env',
  'pnpm verify:prod-template',
  'prisma:deploy',
  'agent-runtime-worker',
  '--profile temporal-worker',
  'production-smoke.mjs',
  'verify-trace-propagation.mjs',
  '/monitor/observability',
  'observability-trace-quality',
  'Trace 覆盖率',
  '孤立事件',
  '错误链路',
  '慢链路',
  '/settings/production-readiness',
  '/customer-success-plans',
  '/customer-success-actions',
  '/customer-success-opportunities',
  '/customer-success-opportunities/analytics',
  'production-delivery-record-template.md',
];

export function collectProductionRunbookIssues(text) {
  const issues = [];

  for (const section of requiredSections) {
    if (!text.includes(section)) {
      issues.push(`Runbook must include ${section}`);
    }
  }

  for (const mention of requiredMentions) {
    if (!text.includes(mention)) {
      issues.push(`Runbook must mention ${mention}`);
    }
  }

  return issues;
}

function runCli() {
  const path = process.argv[2] ?? 'docs/product/p0-12-production-release-runbook.md';
  const absolutePath = resolve(process.cwd(), path);
  if (!existsSync(absolutePath)) {
    throw new Error(`Production runbook not found: ${absolutePath}`);
  }

  const issues = collectProductionRunbookIssues(readFileSync(absolutePath, 'utf8'));
  if (issues.length > 0) {
    console.error(`Production runbook validation failed for ${path}:`);
    for (const issue of issues) console.error(`- ${issue}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Production runbook validation passed for ${path}.`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  try {
    runCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
