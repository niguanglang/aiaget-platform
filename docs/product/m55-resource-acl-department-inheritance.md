# M55 Resource ACL 部门继承

## 目标

M55 补齐 M37 留下的资源授权继承边界：当资源授权给某个父级部门时，该部门下级部门用户也应被视为命中同一条部门主体授权。

## 已实现

- `ResourceAccessService` 新增公共主体解析：
  - `buildResourceAclSubjectKeys()`
- Resource ACL 主体集合现在包含：
  - 当前用户：`USER`
  - 当前用户角色：`ROLE`
  - 当前租户：`TENANT`
  - 当前用户部门：`DEPARTMENT`
  - 当前用户部门的所有上级部门：`DEPARTMENT`
- 控制面 `ResourceAclGuard` 改为复用公共主体解析。
- Runtime 内部执行适配器改为复用公共主体解析：
  - Agent `agent:agent:use`
  - Tool `tool:call:execute`
- API Key 外部调用改为复用公共主体解析：
  - Agent `agent:agent:use`

## 决策规则

```text
1. 没有任何该资源 + 权限编码的生效 ACL：回落到 RBAC，允许继续
2. 当前用户 / 角色 / 租户 / 当前部门 / 上级部门命中 DENY：拒绝
3. tenant_admin 且未命中 DENY：允许
4. 当前用户 / 角色 / 租户 / 当前部门 / 上级部门命中 ALLOW：允许
5. 存在 ACL 但未命中当前主体链路：拒绝
```

显式 `DENY` 仍优先，避免父部门允许覆盖对子部门、用户或角色的明确拒绝。

## 覆盖链路

- 后台对象接口：
  - Agent
  - 知识库
  - 文档
  - 工具
  - 模型
  - 会话
- Runtime 内部适配接口：
  - 知识检索
  - 工具调用
- API Key 外部调用：
  - `/api/v1/external/agents/{agentId}/chat`

## 当前边界

- 继承方向为“父部门授权向子部门用户继承”。
- 不做反向继承：授权给子部门不会自动授权父部门用户。
- 审计和监控聚合事件仍待资源 ID 标准化后接入对象级 Guard。

## 验证

- `pnpm --filter @aiaget/control-api typecheck`
