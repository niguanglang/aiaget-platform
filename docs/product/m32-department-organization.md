# M32 部门 / 组织架构

## 范围

- 新增部门组织架构页面 `/departments`，中文界面展示组织树、部门清单、部门详情、成员归属和权限策略准备度。
- 新增 `department` 表，并为 `user` 增加 `department_id` 字段，所有新增表和字段已补充 SQL 注释。
- 新增 Control API `departments` 模块，提供部门概览、组织树、分页列表、创建、详情、编辑、启停和软删除。
- 新增 RBAC 权限 `department.read`、`department.write`，并在菜单中心补充系统管理下的“部门管理”入口和按钮权限。
- 设置中心的用户管理已接入部门字段，支持创建 / 编辑用户时选择所属部门，并在用户列表和详情中展示部门。

## 数据模型

- `department.tenant_id` 强制租户隔离。
- `department.parent_id` 支持最多 6 级部门树。
- `department.leader_user_id` 记录部门负责人。
- `department.status` 支持 `ACTIVE`、`DISABLED`、`DELETED`。
- `user.department_id` 作为后续 ABAC 的主体属性来源。

## 接口

- `GET /api/v1/departments/overview`
- `GET /api/v1/departments/tree`
- `GET /api/v1/departments`
- `POST /api/v1/departments`
- `GET /api/v1/departments/:id`
- `PATCH /api/v1/departments/:id`
- `DELETE /api/v1/departments/:id`
- `POST /api/v1/departments/:id/enable`
- `POST /api/v1/departments/:id/disable`

## 约束

- 删除部门前必须没有子部门和成员。
- 移动部门时禁止设置自己或自己的子部门为父级。
- 创建和移动部门时校验最大层级不超过 6 级。
- 负责人必须是当前租户内有效用户。
- 部门编码在租户内唯一，编辑时不允许修改编码。

## 验证

- `pnpm --filter @aiaget/web typecheck`
- `pnpm --filter @aiaget/control-api typecheck`
- `pnpm --filter @aiaget/control-api prisma:validate`
- 已对远程 PostgreSQL `127.0.0.1:5432/aiaget_platform` 执行迁移、注释脚本和种子数据。
- 本地验证 `GET http://localhost:3001/api/v1/health` 返回 healthy。
- 本地验证 `GET http://localhost:3000/departments` 返回 200。
- 登录后验证部门概览和组织树接口返回 200，默认种子数据包含 4 个部门节点。
