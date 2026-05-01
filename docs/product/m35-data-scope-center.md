# M35 数据权限中心

## 目标

M35 补齐角色级数据权限配置，用于在菜单权限、接口权限之后继续限定“能访问哪些数据”。本阶段实现的是角色数据范围中心，为后续 Resource ACL、运行时 ABAC Guard 和业务查询过滤预留稳定边界。

## 已实现

- 新增 `role_data_scope` 表，按租户、角色、资源类型保存数据范围。
- 新增权限编码：
  - `system:data_scope:view`
  - `system:data_scope:manage`
- 新增菜单：
  - 系统管理 / 数据权限
  - 页面路径 `/data-scopes`
- 新增后端接口：
  - `GET /api/v1/data-scopes/overview`
  - `GET /api/v1/data-scopes`
  - `GET /api/v1/data-scopes/roles/:roleId`
  - `PUT /api/v1/data-scopes/roles/:roleId`
  - `POST /api/v1/data-scopes/preview`
- 新增前端页面：
  - 角色目录
  - 资源范围矩阵
  - 范围类型配置
  - 自定义部门、用户、资源 ID 配置
  - 生效预览

## 数据范围

支持范围类型：

- `ALL`：全部数据
- `TENANT`：本租户数据
- `DEPT`：本部门数据
- `DEPT_AND_CHILD`：本部门及子部门数据
- `SELF`：本人数据
- `CUSTOM`：自定义范围

支持资源类型：

- `AGENT`
- `KNOWLEDGE_BASE`
- `DOCUMENT`
- `TOOL`
- `MODEL`
- `CONVERSATION`
- `AUDIT_LOG`

## 数据库说明

新增表 `role_data_scope`，包含表注释和字段注释。`scope_value` 使用 JSONB 保存：

```json
{
  "department_ids": [],
  "user_ids": [],
  "resource_ids": [],
  "include_children": false
}
```

默认种子策略：

- `tenant_admin`：所有资源为 `ALL`
- `tenant_operator`：所有资源为 `TENANT`
- `tenant_viewer`：所有资源为 `SELF`

## 下一步

- 在业务查询中接入数据范围过滤。
- 把 Agent、知识库、工具、模型的 Resource ACL 与数据范围合并计算。
- 增加运行时 Guard：`PermissionGuard -> DataScopeGuard -> ResourceAclGuard -> SecurityPolicyGuard`。
