# Project UI Brief

- Project: 企业 Agent 平台
- Page: 安全事件详情中心
- Route: `/security`
- Feature: 安全拒绝事件列表、筛选、详情抽屉和 trace 跳转

## 页面目标

在现有安全中心中补齐 M54：把 M40 已写入 `operation_log` 的 Guard 拒绝事件和 `security_policy_evaluation` 的 DENY 评估，从摘要卡升级为可检索、可筛选、可查看详情的安全事件工作区。

## 用户与权限

- 目标用户：租户管理员、安全管理员、审计员、平台运维。
- 后端权限：`security:rule:view` 访问安全中心总览与事件列表。
- 前端写权限仍沿用 `security:rule:manage` 控制策略创建、编辑、删除和模拟。

## 当前接口契约

- 已有：`GET /api/v1/security-center/overview`
- 新增：`GET /api/v1/security-center/events`
- 新增：`GET /api/v1/security-center/events/:eventId`
- 已有策略接口：
  - `GET /api/v1/security-policies/overview`
  - `GET /api/v1/security-policies`
  - `GET /api/v1/security-policies/evaluations`
  - `POST /api/v1/security-policies/simulate`

## 数据来源

- `operation_log`：
  - `module=security`
  - `action=deny`
  - `status_code >= 400`
  - `request_summary.security_event=true`
  - 可包含 `guard_source`、`subject`、`resource`、`context`、`trace_id`、`matched_code`
- `security_policy_evaluation`：
  - `decision=DENY`
  - 包含 `subject`、`resource`、`context`、`matched_policy_code`、`reason`

## 主要字段

- 列表：事件 ID、来源、标题、原因、资源类型、资源 ID、动作、路径、方法、状态码、请求 ID、trace ID、发生时间。
- 详情：主体属性、资源属性、上下文、匹配规则、错误信息、路径、请求链路、相关策略信息。

## 页面区域

- 顶部安全态势和指标保持现有设计。
- “运行时拒绝与风险信号”卡片增加进入事件列表的动作。
- 新增“安全事件详情中心”表格区域：
  - 关键词搜索
  - 来源筛选：全部、数据权限、资源授权、安全策略、操作拒绝
  - 时间窗口：1h、24h、7d、30d
  - 只看有 trace ID
  - 分页列表
  - 查看详情按钮
- 详情抽屉：
  - 顶部展示来源、状态码、时间、请求 ID、trace ID
  - 结构化展示主体、资源、上下文 JSON
  - 支持跳转到 `/monitor?trace_id=...`

## 组件约束

- 使用现有 `Card`、`Button`、`Input`、`MetricCard`、`StatusBadge`、`EmptyState`。
- 动效沿用 `motion/react` 的轻量进入和 hover feedback。
- 图标使用 `lucide-react`。
- 全部可见文案使用中文。
