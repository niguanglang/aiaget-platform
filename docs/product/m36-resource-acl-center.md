# M36 资源授权中心

## 目标

M36 补齐对象级资源授权能力，用于在多租户、RBAC、菜单权限、接口权限和 M35 数据权限之后，继续限定“能操作哪些具体资源对象”。本阶段实现通用 `resource_acl`，支持把具体 Agent、知识库、文档、工具、模型、会话和审计日志授权给用户、角色、部门或租户主体。

## 已实现

- 新增 `resource_acl` 表，按租户、资源、主体、权限编码保存 ACL 规则。
- 新增权限编码：
  - `system:resource_acl:view`
  - `system:resource_acl:manage`
- 新增菜单：
  - 系统管理 / 资源授权
  - 页面路径 `/resource-acls`
- 新增后端接口：
  - `GET /api/v1/resource-acls/overview`
  - `GET /api/v1/resource-acls/options`
  - `GET /api/v1/resource-acls`
  - `POST /api/v1/resource-acls`
  - `PATCH /api/v1/resource-acls/:id`
  - `DELETE /api/v1/resource-acls/:id`
  - `POST /api/v1/resource-acls/check`
- 新增前端页面：
  - 资源类型与具体资源选择
  - 主体类型与具体主体选择
  - ACL 规则列表
  - 允许 / 拒绝授权编辑
  - 条件 JSON 预留
  - 授权模拟检查

## 授权模型

支持资源类型：

- `AGENT`
- `KNOWLEDGE_BASE`
- `DOCUMENT`
- `TOOL`
- `MODEL`
- `CONVERSATION`
- `AUDIT_LOG`

支持主体类型：

- `USER`
- `ROLE`
- `DEPARTMENT`
- `TENANT`

支持授权效果：

- `ALLOW`：允许主体执行对应权限动作。
- `DENY`：拒绝主体执行对应权限动作，模拟检查时优先于允许。

支持状态：

- `ACTIVE`：启用，参与模拟检查。
- `DISABLED`：停用，不参与模拟检查。
- `DELETED`：软删除。

## 数据库说明

新增表 `resource_acl`，包含表注释和字段注释。核心唯一约束：

```text
tenant_id + resource_type + resource_id + subject_type + subject_id + permission_code
```

`conditions` 使用 JSONB 预留上下文条件：

```json
{
  "risk_level": "LOW",
  "time_window": "workday"
}
```

默认种子策略：

- 默认 Agent 授权给 `tenant_admin` 角色：
  - `agent:agent:view`
  - `agent:agent:manage`

## 检查规则

`POST /resource-acls/check` 当前实现精确匹配：

```text
tenant_id
resource_type
resource_id
subject_type
subject_id
permission_code
status = ACTIVE
deleted_at IS NULL
```

返回结果：

- 命中 `DENY`：返回 `DENY`
- 未命中 `DENY` 但命中 `ALLOW`：返回 `ALLOW`
- 未命中任何规则：返回 `NO_MATCH`

## 下一步

- 增加 ResourceAclGuard，把对象级授权接入 Agent、知识库、工具和模型的业务接口。
- 支持主体继承检查：用户命中自己的角色、部门和租户授权。
- 与 M35 数据权限合并计算，形成“范围过滤 + 对象授权”的最终访问结果。
- 将 `conditions` 与 M31 安全策略中心合并，支持上下文条件评估。
