import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const source = readFileSync(join(process.cwd(), 'src/security-center/security-center.controller.ts'), 'utf8');

function decoratorBlockForRoute(route: string) {
  const routeIndex = source.indexOf(`@Post('${route}')`);
  assert.ok(routeIndex > -1, `missing route ${route}`);
  const methodStart = source.indexOf('\n  async ', routeIndex);
  assert.ok(methodStart > routeIndex, `missing handler for ${route}`);

  return source.slice(routeIndex, methodStart);
}

test('security archive deletion approval decision routes require approval handle permission', () => {
  const decisionRoutes = [
    'operation-alert-notifications/archive-approvals/:approvalId/approve',
    'operation-alert-notifications/archive-approvals/:approvalId/reject',
    'operation-alert-notification-task-recovery-suggestions/audits/archive-approvals/:approvalId/approve',
    'operation-alert-notification-task-recovery-suggestions/audits/archive-approvals/:approvalId/reject',
    'operation-alert-sla/dead-letter-audits/archive-approvals/:approvalId/approve',
    'operation-alert-sla/dead-letter-audits/archive-approvals/:approvalId/reject',
  ];

  for (const route of decisionRoutes) {
    const block = decoratorBlockForRoute(route);
    assert.match(block, /@Permissions\('security:approval:handle'\)/, `${route} must require security:approval:handle`);
    assert.doesNotMatch(block, /@Permissions\('security:rule:view'\)/, `${route} must not allow readonly security:rule:view`);
  }
});
