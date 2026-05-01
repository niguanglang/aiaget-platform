# M39 SecurityPolicyGuard 运行时安全策略

## 目标

M39 把 M31 安全策略中心接入 M37 的对象访问控制链路，使 ABAC 安全策略不再只用于页面配置和模拟评估，而是参与真实业务接口访问判定。

运行时链路升级为：

```text
JWT 鉴权
-> PermissionGuard 接口权限
-> DataScopeGuard 数据范围
-> ResourceAclGuard 对象授权
-> SecurityPolicyGuard 安全策略
-> 业务逻辑
```

## 已实现

- 新增装饰器：
  - `@RequireSecurityPolicy({ resourceType, idParam, action })`
- 新增 Guard：
  - `SecurityPolicyGuard`
- `SecurityPolicyGuard` 默认复用 `@RequireResourceAcl` 元数据：
  - `resourceType` 作为策略资源类型
  - `idParam` 作为对象 ID 来源
  - `permissionCode` 作为策略动作
- 安全策略评估器支持动作别名：
  - `agent:agent:view`
  - `agent:view`
  - `view`
- 每次命中对象级接口时写入：
  - `security_policy_evaluation`

## 接入范围

第一版接入已经具备对象级资源元数据的业务控制器：

- Agent 中心
- 知识库中心
- 工具中心
- 模型中心
- 会话中心

这些控制器已经使用统一 Guard 链路：

```ts
@UseGuards(JwtAuthGuard, PermissionsGuard, DataScopeGuard, ResourceAclGuard, SecurityPolicyGuard)
```

## 评估上下文

`SecurityPolicyGuard` 会构造标准 ABAC 上下文：

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
    "resource_type": "AGENT",
    "user_ids": ["owner-user-id"],
    "department_ids": ["owner-department-id"]
  },
  "context": {
    "method": "GET",
    "path": "/api/v1/agents/:id",
    "request_id": "request-id",
    "trace_id": "trace-id",
    "ip": "client-ip",
    "user_agent": "client-user-agent"
  }
}
```

## 判定语义

- 只读取当前租户下 `ACTIVE` 且未删除的安全策略。
- 同优先级下 `DENY` 优先。
- 命中 `DENY`：返回 `403 Security policy denied`。
- 命中 `ALLOW`：放行。
- `NO_MATCH`：放行，保持兼容已有系统。
- 没有任何生效策略：放行，避免因未初始化策略导致业务不可用。

## 当前边界

- M39 先保护对象级接口，列表过滤仍由 RBAC、租户隔离和后续数据范围查询增强处理。
- 安全策略评估只做同步判定，尚未把拒绝结果升级为独立安全事件。
- Runtime 内部工具调用和 RAG 检索后续应复用同一套策略服务，而不是只依赖 Control API 控制器 Guard。

## 验证

- `pnpm --filter @aiaget/shared-types typecheck`
- `pnpm --filter @aiaget/control-api typecheck`
- API 冒烟：
  - 登录默认租户管理员
  - 创建临时 Agent
  - 创建 `AGENT + view + DENY` 临时安全策略
  - 访问该 Agent 详情返回 `403 Security policy denied`
  - 删除临时策略和临时 Agent

## 下一步

- 将安全策略拒绝写入安全事件中心。
- 为列表查询增加数据范围过滤和策略摘要提示。
- 在 Runtime 执行链路中抽出统一策略服务，覆盖工具调用、RAG 检索和模型调用。
