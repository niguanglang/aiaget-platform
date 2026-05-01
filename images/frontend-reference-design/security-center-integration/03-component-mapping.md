# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
# Component Mapping: M38 安全中心整合

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/app/(console)/security/page.tsx`, `SecurityPolicyContent` | route/layout | 保留现有路由，把组件升级为安全中心整合页 |
| Background | `SecurityPolicyBackground` | visual only | 复用现有背景，避免新增独立装饰体系 |
| Top metric cards | `MetricCard` | `SecurityCenterOverview.posture` | 新增统一概览接口 |
| Governance Bento Grid | new local section inside `SecurityPolicyContent` | `SecurityCenterOverview.modules` | 每张卡链接到已有模块路由 |
| Risk signals | new local section inside `SecurityPolicyContent` | `SecurityCenterOverview.risks` | 根据已有聚合数据计算 |
| Policy table | existing `PolicyTable` | `listSecurityPolicies` | 保留现有策略治理 |
| Simulation panel | existing `SimulationPanel` | `simulateSecurityPolicy` | 保留现有模拟评估 |
| Evaluation log | existing `EvaluationLogCard` | `listSecurityPolicyEvaluations` | 保留现有日志 |
| API client | `apps/web/src/lib/api-client.ts` | `getSecurityCenterOverview` | 新增函数 |
| Backend module | `apps/control-api/src/security-center` | `GET /security-center/overview` | 聚合多个安全相关表，不调用其他服务避免模块循环 |
| Shared types | `packages/shared-types/src/index.ts` | `SecurityCenterOverview` | 前后端共享类型 |
| Docs | `docs/product/m38-security-center-integration.md` | milestone spec | 记录边界和验收 |
