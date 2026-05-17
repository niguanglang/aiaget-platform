import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const contentFiles = [
  'src/app/page.tsx',
  'src/app/login/page.tsx',
  'src/components/dashboard/dashboard-content.tsx',
  'src/components/menus/menu-content.tsx',
  'src/components/roles/role-permission-content.tsx',
  'src/components/users/users-content.tsx',
  'src/components/audit/audit-content.tsx',
  'src/components/approvals/approval-content.tsx',
  'src/components/security/security-overview-content.tsx',
];

const noisyCopyPatterns = [
  /欢迎使用 AI Agent 平台/,
  /面向企业私有化和多租户运营/,
  /让企业智能体安全协同/,
  /列表页用于/,
  /当前页面只负责/,
  /完整详情.*独立页面/,
  /已移动到/,
  /已迁移/,
  /职责已拆分/,
  /职责页/,
  /不嵌入/,
  /不在本页/,
  /沉淀/,
  /闭环/,
  /赋能/,
  /打造/,
  /统一管理/,
  /帮助运营/,
];

test('high-frequency console pages avoid product-introduction and IA-explainer copy', () => {
  for (const file of contentFiles) {
    const source = readFileSync(join(process.cwd(), file), 'utf8');

    for (const pattern of noisyCopyPatterns) {
      assert.doesNotMatch(source, pattern, `${file} still contains noisy copy: ${pattern}`);
    }
  }
});

test('high-frequency console pages keep concise operational labels', () => {
  const dashboardSource = readFileSync(join(process.cwd(), 'src/components/dashboard/dashboard-content.tsx'), 'utf8');
  const menuSource = readFileSync(join(process.cwd(), 'src/components/menus/menu-content.tsx'), 'utf8');
  const roleSource = readFileSync(join(process.cwd(), 'src/components/roles/role-permission-content.tsx'), 'utf8');
  const userSource = readFileSync(join(process.cwd(), 'src/components/users/users-content.tsx'), 'utf8');
  const auditSource = readFileSync(join(process.cwd(), 'src/components/audit/audit-content.tsx'), 'utf8');
  const approvalSource = readFileSync(join(process.cwd(), 'src/components/approvals/approval-content.tsx'), 'utf8');
  const securitySource = readFileSync(join(process.cwd(), 'src/components/security/security-overview-content.tsx'), 'utf8');

  assert.match(dashboardSource, /工作台/);
  assert.doesNotMatch(dashboardSource, /运营工作台/);
  assert.doesNotMatch(dashboardSource, /集中查看/);
  assert.doesNotMatch(dashboardSource, /系统概览/);
  assert.doesNotMatch(dashboardSource, /当前账号/);
  assert.match(menuSource, /菜单中心/);
  assert.match(roleSource, /角色权限中心/);
  assert.match(userSource, /用户管理中心/);
  assert.match(auditSource, /审计中心/);
  assert.match(approvalSource, /审批中心/);
  assert.match(securitySource, /安全治理总览/);
});
