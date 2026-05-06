import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const dashboardRoot = join(root, 'src/components/dashboard');
const dashboardSource = readFileSync(join(dashboardRoot, 'dashboard-content.tsx'), 'utf8');

function source(fileName: string) {
  return readFileSync(join(dashboardRoot, fileName), 'utf8');
}

test('dashboard route exists and focused dashboard component files exist', () => {
  assert.ok(existsSync(join(root, 'src/app/(console)/dashboard/page.tsx')));
  assert.ok(existsSync(join(dashboardRoot, 'dashboard-shared.tsx')));
  assert.ok(existsSync(join(dashboardRoot, 'dashboard-overview-cards.tsx')));
  assert.ok(existsSync(join(dashboardRoot, 'dashboard-operations-cards.tsx')));
  assert.ok(existsSync(join(dashboardRoot, 'dashboard-insight-cards.tsx')));
});

test('dashboard page shell owns only overview queries, page state, and composition', () => {
  assert.match(dashboardSource, /getMonitorOverview/);
  assert.match(dashboardSource, /getAuditOverview/);
  assert.match(dashboardSource, /DashboardBackdrop/);
  assert.match(dashboardSource, /MetricTile/);
  assert.match(dashboardSource, /HealthOverviewCard/);
  assert.match(dashboardSource, /OperationsTrendCard/);
  assert.match(dashboardSource, /RunStepOperationsCard/);
  assert.match(dashboardSource, /AgentRankingCard/);
  assert.match(dashboardSource, /ErrorDistributionCard/);
  assert.match(dashboardSource, /RecentAlertsCard/);

  assert.doesNotMatch(dashboardSource, /function MetricTile/);
  assert.doesNotMatch(dashboardSource, /function HealthOverviewCard/);
  assert.doesNotMatch(dashboardSource, /function OperationsTrendCard/);
  assert.doesNotMatch(dashboardSource, /function RunStepOperationsCard/);
  assert.doesNotMatch(dashboardSource, /function AgentRankingCard/);
  assert.doesNotMatch(dashboardSource, /function ErrorDistributionCard/);
  assert.doesNotMatch(dashboardSource, /function RecentAlertsCard/);
  assert.doesNotMatch(dashboardSource, /function mapAuditFailureToIncident/);
  assert.doesNotMatch(dashboardSource, /function buildErrorSegments/);
  assert.doesNotMatch(dashboardSource, /function buildMonitorStepHref/);
});

test('dashboard remains an overview surface without detail queries or mutations', () => {
  const forbidden = [
    /useMutation/,
    /getAuditEvent/,
    /getMonitorEvent/,
    /getMonitorTrace/,
    /listMonitorEvents/,
    /listAuditEvents/,
    /create[A-Z]/,
    /update[A-Z]/,
    /delete[A-Z]/,
    /approve[A-Z]/,
    /reject[A-Z]/,
  ];

  for (const pattern of forbidden) {
    assert.doesNotMatch(dashboardSource, pattern);
  }
});

test('dashboard split files own focused responsibilities and drilldown links', () => {
  const sharedSource = source('dashboard-shared.tsx');
  const overviewCardsSource = source('dashboard-overview-cards.tsx');
  const operationsCardsSource = source('dashboard-operations-cards.tsx');
  const insightCardsSource = source('dashboard-insight-cards.tsx');

  assert.match(sharedSource, /buildDashboardMetrics/);
  assert.match(sharedSource, /buildHealthRows/);
  assert.match(sharedSource, /calculateHealthScore/);
  assert.match(sharedSource, /mapAuditFailureToIncident/);
  assert.match(sharedSource, /buildErrorSegments/);
  assert.match(sharedSource, /buildMonitorStepHref/);

  assert.match(overviewCardsSource, /MetricTile/);
  assert.match(overviewCardsSource, /HealthOverviewCard/);
  assert.match(overviewCardsSource, /DashboardBackdrop/);
  assert.doesNotMatch(overviewCardsSource, /getMonitorOverview/);
  assert.doesNotMatch(overviewCardsSource, /getAuditOverview/);

  assert.match(operationsCardsSource, /OperationsTrendCard/);
  assert.match(operationsCardsSource, /RunStepOperationsCard/);
  assert.match(operationsCardsSource, /href=\{buildMonitorStepHref/);
  assert.doesNotMatch(operationsCardsSource, /getMonitorOverview/);

  assert.match(insightCardsSource, /AgentRankingCard/);
  assert.match(insightCardsSource, /ErrorDistributionCard/);
  assert.match(insightCardsSource, /RecentAlertsCard/);
  assert.match(insightCardsSource, /href="\/agents"/);
  assert.match(insightCardsSource, /href="\/audit"/);
  assert.match(insightCardsSource, /href="\/monitor"/);
  assert.doesNotMatch(insightCardsSource, /getAuditOverview/);
});

