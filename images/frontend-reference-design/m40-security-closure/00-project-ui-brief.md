# Project UI Brief

- Page: M40 权限与安全闭环
- Route: `/security`
- Feature: 权限与安全运行时闭环

## Page Goal

把安全中心从“策略配置 + 模拟评估”升级为运行时权限闭环控制台，集中展示：

- Guard 链路健康度
- 列表数据范围过滤覆盖
- Resource ACL 条件执行
- Security Policy 拒绝事件
- 最近审计失败、监控异常和策略评估

## Target Users And Permissions

- 租户管理员：具备全部安全治理能力。
- 安全管理员：查看安全态势、管理安全策略、处理高危事件。
- 审计员：只读查看策略评估、拒绝事件、审计失败和监控异常。

关键权限：

- `security:rule:view`
- `security:rule:manage`
- `system:data_scope:view`
- `system:resource_acl:view`
- `security:audit:view`
- `monitor:log:view`

## API And Data Contract

前端页面：

- `apps/web/src/app/(console)/security/page.tsx`
- `apps/web/src/components/security/security-policy-content.tsx`

服务函数：

- `getSecurityCenterOverview()`
- `getSecurityPolicyOverview()`
- `listSecurityPolicies()`
- `listSecurityPolicyEvaluations()`
- `createSecurityPolicy()`
- `updateSecurityPolicy()`
- `enableSecurityPolicy()`
- `disableSecurityPolicy()`
- `deleteSecurityPolicy()`
- `simulateSecurityPolicy()`

共享类型：

- `SecurityCenterOverview`
- `SecurityCenterRiskSignal`
- `SecurityCenterModuleSummary`
- `SecurityPolicyEvaluationItem`

M40 扩展安全中心字段：

- `metrics.list_data_scope_filters`
- `metrics.resource_acl_condition_checks`
- `metrics.security_policy_denials_24h`
- `recent.security_denials`

## Existing Components

- `Card`
- `MetricCard`
- `StatusBadge`
- `Button`
- `Input`
- `EmptyState`
- `SecurityPolicyBackground`
- `motion/react`
- `lucide-react`

## States And Actions

- 加载：安全态势、模块卡片、策略列表和评估日志分别加载。
- 空状态：暂无策略、暂无拒绝事件、暂无风险信号。
- 错误：接口请求失败时展示局部错误。
- 权限不足：无 `security:rule:manage` 时禁用新建、编辑、删除、启停。
- 成功：策略变更后刷新总览、策略列表、评估日志和安全中心数据。

## Visual Constraints

- 中文界面。
- 企业级 SaaS 后台风格。
- 使用现有白底/浅灰/蓝绿色状态体系。
- 使用 Bento Grid / dashboard layout。
- 信息密度适中，避免过度渐变和廉价发光。
