# M40 权限与安全闭环

## 目标

M40 把 M31-M39 的权限、安全能力进一步闭环：

```text
菜单入口
-> 接口权限
-> 列表数据范围过滤
-> 对象级 DataScopeGuard
-> ResourceAclGuard 条件授权
-> SecurityPolicyGuard 安全策略
-> 拒绝事件进入安全中心
```

## 已实现

- 新增列表数据范围查询服务：
  - `DataScopeQueryService`
  - `mergeDataScopeWhere`
- 核心列表接入数据范围过滤：
  - Agent 列表
  - 知识库列表
  - 工具列表
  - 模型供应商列表
  - 会话列表
- Resource ACL Guard 支持条件 JSON：
  - `eq`
  - `neq`
  - `in`
  - `not_in`
  - `contains`
  - `exists`
- Resource ACL 主体支持部门继承：
  - 当前部门
  - 所有上级部门
  - 显式 `DENY` 优先
- 新增安全拒绝事件写入：
  - `SecurityEventService`
  - Guard 拒绝写入 `operation_log`
  - Guard 拒绝同步写入独立 `security_event` 台账
  - `security_event` 保留来源记录、主体/资源/上下文快照、request ID、trace ID、风险等级和匹配策略信息
  - 标记 `module=security`、`action=deny`
- SecurityPolicyGuard 拒绝事件化：
  - 记录策略来源、资源、动作、主体、trace 信息
- DataScopeGuard / ResourceAclGuard 拒绝事件化：
  - 记录拒绝来源和上下文
- 安全中心聚合增强：
  - 最近 24 小时策略拒绝
  - 列表过滤覆盖数量
  - 条件化 ACL 数量
  - 最近拒绝事件列表
- 前端 `/security` 增强：
  - 顶部 M40 权限闭环标识
  - 新增策略拒绝、列表过滤、ACL 条件指标
  - 新增最近拒绝事件面板

## 列表数据范围规则

`DataScopeQueryService` 读取当前用户角色绑定的 `role_data_scope`。

规则：

- `ALL` / `TENANT`：列表不过滤。
- `SELF`：仅返回用户关联资源。
- `DEPT`：返回当前用户部门成员关联资源。
- `DEPT_AND_CHILD`：返回当前部门及子部门成员关联资源。
- `CUSTOM`：
  - `resource_ids` 精确资源过滤
  - `user_ids` 用户关联资源过滤
  - `department_ids` 部门成员关联资源过滤
  - `include_children` 控制是否包含子部门

为了兼容旧数据，某资源类型没有任何生效数据范围时仍保持放行。

## Resource ACL 条件上下文

条件 JSON 可访问：

```json
{
  "subject": {
    "id": "user-id",
    "tenant_id": "tenant-id",
    "department_id": "department-id",
    "role_codes": ["tenant_admin"],
    "role_ids": ["role-id"],
    "email": "oss-admin-7f4c2a@local.invalid"
  },
  "resource": {
    "id": "resource-id",
    "type": "agent",
    "resource_type": "AGENT"
  },
  "context": {
    "method": "GET",
    "path": "/api/v1/agents/:id",
    "request_id": "request-id",
    "trace_id": "trace-id"
  }
}
```

## 安全中心新增字段

`SecurityCenterOverview.metrics` 新增：

- `security_policy_denials_24h`
- `list_data_scope_filters`
- `resource_acl_condition_checks`

`SecurityCenterOverview.recent` 新增：

- `security_denials`

## 当前边界

- `security_event` 已作为稳定安全事件台账；历史 `operation_log`、`security_policy_evaluation`、`platform_event` 数据仍作为兼容兜底来源。
- Runtime 内部 RAG / Tool 调用已在 M41/M43 下沉到 Control API 的 Data Scope、Resource ACL、工具审批与安全策略边界；模型调用已纳入 Runtime 模型调用事件和用量投影。
- 列表过滤优先覆盖核心资源列表，审计、监控聚合类列表仍以租户隔离和权限控制为主。
- 模型中心当前以供应商列表接入 DataScope，模型配置列表随供应商详情展示。

## 验证

- `pnpm --filter @aiaget/shared-types typecheck`
- `pnpm --filter @aiaget/control-api typecheck`
- `pnpm --filter @aiaget/web typecheck`

## 下一步

- 列表数据范围过滤继续覆盖审计、监控、API Key 等聚合资源。
- 安全中心可继续增加事件处置状态、归档和按 trace_id 跳转链路追踪。
