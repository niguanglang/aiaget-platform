# M37 ResourceAclGuard / DataScopeGuard

## 目标

M37 把 M35 数据权限和 M36 资源授权从“配置中心”接入到 Control API 的业务访问链路中，形成第一版运行时访问控制：

```text
JWT 鉴权
-> PermissionGuard 接口权限
-> DataScopeGuard 数据范围
-> ResourceAclGuard 对象授权
-> 业务逻辑
```

## 已实现

- 新增装饰器：
  - `@RequireDataScope({ resourceType, idParam })`
  - `@RequireResourceAcl({ resourceType, idParam, permissionCode })`
- 新增 Guard：
  - `DataScopeGuard`
  - `ResourceAclGuard`
- 新增公共资源解析服务：
  - `ResourceAccessService`
- JWT 用户上下文增加：
  - `departmentId`
  - `roleIds`
- 接入对象级接口：
  - Agent 详情、编辑、删除、发布、版本、绑定
  - 知识库详情、编辑、删除、上传、检索测试、重建索引
  - 知识文档详情、编辑、删除、重处理
  - 工具详情、编辑、删除、复制、启停、测试
  - 模型供应商详情、编辑、删除、启停、Key、测试
  - 模型配置编辑、删除、启停
  - 会话详情、归档、追加消息、流式消息、反馈

## DataScopeGuard 规则

`DataScopeGuard` 读取当前用户角色绑定的 `role_data_scope`。

支持范围：

- `ALL`：允许
- `TENANT`：允许
- `SELF`：资源关联用户包含当前用户时允许
- `DEPT`：资源关联部门包含当前用户部门时允许
- `DEPT_AND_CHILD`：资源关联部门在当前用户部门及下级部门内时允许
- `CUSTOM`：
  - `resource_ids` 命中资源 ID 或 `RESOURCE_TYPE:resourceId`
  - 或 `user_ids` 命中资源关联用户
  - 或 `department_ids` 命中资源关联部门

为了兼容既有数据，若某资源类型没有任何生效数据范围配置，Guard 回落为允许。

## ResourceAclGuard 规则

`ResourceAclGuard` 读取 `resource_acl`。

主体匹配范围：

- 当前用户：`USER`
- 当前用户角色：`ROLE`
- 当前用户部门及上级部门：`DEPARTMENT`
- 当前租户：`TENANT`

决策规则：

```text
1. 没有任何该资源 + 权限编码的生效 ACL：回落到 RBAC，允许继续
2. 命中 DENY：拒绝
3. tenant_admin 且未命中 DENY：允许
4. 命中 ALLOW：允许
5. 存在 ACL 但未命中当前主体：拒绝
```

这保证了已有系统不会因为没有 ACL 初始化数据而整体不可用，同时一旦资源配置了 ACL，就进入对象级授权模式。

## M55 增强

- Resource ACL 主体匹配改为公共 `ResourceAccessService.buildResourceAclSubjectKeys()`。
- 部门主体会同时包含当前用户部门和所有上级部门。授权给父部门的资源权限，子部门用户可以继承。
- 控制面 `ResourceAclGuard`、Runtime 内部适配器和 API Key 外部调用使用同一套主体解析，避免入口之间的授权结果不一致。
- 显式 `DENY` 仍优先于继承得到的 `ALLOW`。

## 当前边界

- 本阶段优先保护对象级接口，列表查询由 M40 数据范围过滤覆盖核心资源。
- 审计和监控事件详情当前使用 `operation:uuid`、`model:uuid` 这类聚合事件 ID，ACL 表使用 UUID 资源 ID；后续会把事件资源 ID 标准化后再接入对象级 Guard。

## 验证

- `pnpm --filter @aiaget/shared-types typecheck`
- `pnpm --filter @aiaget/control-api typecheck`
- API 冒烟：
  - 登录默认租户管理员
  - 创建临时 Agent
  - 给当前用户创建 `AGENT + agent:agent:view + DENY` 资源授权
  - 访问 Agent 详情返回 `403 Resource ACL denied`
  - 删除临时 ACL 和临时 Agent

## 下一步

- 在 Conversation Runtime、工具调用、RAG 检索时复用同一套 Guard 或策略服务。
- 将审计、监控等聚合事件资源 ID 标准化后接入对象级 Guard。
