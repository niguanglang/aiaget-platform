# M34 角色权限中心增强

## 范围

- 新增独立页面 `/roles`，作为系统管理下的角色权限中心。
- 将角色管理从只读目录升级为角色 CRUD、启用停用、软删除和详情查看。
- 新增权限编码目录接口，按模块和资源分组展示 `module:resource:action` 权限。
- 新增角色权限替换接口，支持在页面中保存角色拥有的接口/操作权限。
- 角色详情展示用户引用、菜单引用、权限数量和系统角色保护状态。
- 角色状态纳入登录态和 Guard，停用角色不再授予菜单和接口权限。

## 后端接口

```text
GET    /api/v1/roles/overview
GET    /api/v1/roles/permissions/catalog
GET    /api/v1/roles
POST   /api/v1/roles
GET    /api/v1/roles/:id
PATCH  /api/v1/roles/:id
DELETE /api/v1/roles/:id
POST   /api/v1/roles/:id/enable
POST   /api/v1/roles/:id/disable
PUT    /api/v1/roles/:id/permissions
```

## 权限

- 只读接口需要 `system:role:view`。
- 写操作需要 `system:role:manage`。
- `tenant_admin` 继续作为租户内超级角色，由 Guard 放行。
- `tenant_admin` 权限由种子数据维护，页面只展示不允许改权限。
- 系统角色禁止删除，`tenant_admin` 禁止停用。

## 数据库变更

- `role.status varchar(30) not null default 'ACTIVE'`
- 新增索引：
  - `role_status_idx`
- 新增迁移：
  - `20260430213000_m34_role_permission_center`
- 新增表/字段注释覆盖：
  - `role`
  - `role.status`
  - `role_permission`

## 前端页面

- 角色目录：搜索、状态筛选、系统/自定义标记、用户/权限/菜单数量。
- 角色详情：基础资料、用户引用、菜单引用、操作按钮。
- 权限矩阵：按模块和资源分组，支持全选、清空、按模块选择和保存。
- 表单抽屉：新建/编辑角色，中文校验提示，编码编辑时只读。
- 页面文字全部中文，沿用 Tailwind、shadcn 风格组件、Motion 微交互和轻量 3D 背景。

## 参考设计工作区

```text
images/frontend-reference-design/role-permission-center/
```

包含：

- `00-project-ui-brief.md`
- `01-product-ui-design-prompt.md`
- `02-product-prototype-prompt.md`
- `03-component-mapping.md`

## 验证

- `pnpm --filter @aiaget/shared-types typecheck`
- `pnpm --filter @aiaget/control-api prisma:validate`
- `pnpm --filter @aiaget/control-api prisma:generate`
- `pnpm --filter @aiaget/control-api typecheck`
- `pnpm --filter @aiaget/web typecheck`
