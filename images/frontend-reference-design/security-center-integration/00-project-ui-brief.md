# Project UI Brief

- Page: Security Center Integration
- Route: /security
- Feature goal: M38 security center integration
- APIs/services: TBD
- Entities/fields/statuses: TBD
- Existing components/design system: TBD
- Required states: loading, empty, error, validation, disabled, success, permission-denied
# Project UI Brief: M38 安全中心整合

## 页面目标

- 页面：安全中心
- 路由：`/security`
- 目标：把安全策略、数据权限、资源授权、高危审批、审计和监控整合成统一入口，同时保留现有 ABAC 策略治理能力。

## 用户与权限

- 目标用户：租户管理员、安全管理员、审计员。
- 页面入口权限：`security:rule:view`。
- 策略写操作权限：`security:rule:manage`。
- 审批、审计、数据权限、资源授权入口保持各模块原权限。

## API 契约

- 新增：`GET /api/v1/security-center/overview`
- 复用：
  - `GET /api/v1/security-policies/overview`
  - `GET /api/v1/security-policies`
  - `GET /api/v1/security-policies/evaluations`
  - `GET /api/v1/data-scopes/overview`
  - `GET /api/v1/resource-acls/overview`
  - `GET /api/v1/tool-approvals/overview`
  - `GET /api/v1/audit/overview`
  - `GET /api/v1/monitor/overview`

## 数据实体

- 安全策略：策略总数、生效数、拒绝策略、允许策略、评估日志。
- 数据权限：角色数、已配置角色、范围总数、自定义范围。
- 资源授权：授权规则、启用规则、允许规则、拒绝规则。
- 审批：待审批、已通过、已拒绝、运行时待审批。
- 审计：登录、操作、安全事件、配置变更、成功率。
- 监控：成功率、平均延迟、P95 延迟、错误样本。

## 组件系统

- 框架：Next.js App Router + React + TypeScript。
- 数据：React Query + `apps/web/src/lib/api-client.ts`。
- UI：Tailwind、现有 `Card`、`Button`、`Input`、`MetricCard`、`StatusBadge`、`EmptyState`。
- 动效：已有 `motion/react`。

## 页面结构

- 顶部：安全中心标题、M38 标识、主要动作入口。
- 指标：安全评分、待审批、安全事件、拒绝规则。
- Bento Grid：策略治理、数据权限、资源授权、高危审批、审计日志、运行监控。
- 风险信号：高风险项、建议检查项、链路状态。
- 策略工作区：保留策略列表、模拟评估、评估日志。

## 状态要求

- 加载态：总览、策略、评估日志独立加载。
- 错误态：总览错误不阻断策略工作区。
- 空状态：策略为空时仍保留新建入口。
- 只读态：无 `security:rule:manage` 时禁用策略写操作。
