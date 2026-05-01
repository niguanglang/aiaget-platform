# M33 权限编码升级

## 范围

- 将权限编码从旧版 `模块.read/write` 升级为 `module:resource:action` 标准格式。
- 在共享类型包中新增权限目录、旧编码别名和兼容判断工具。
- 后端 Guard、JWT 用户上下文、`auth/me` 和菜单授权查询均支持新旧权限编码兼容。
- 前端模块权限和按钮权限切换到新编码，并使用兼容 helper 避免旧登录态短时失效。
- 数据库 `permission` 表新增 `resource` 字段，并为新增字段补充 SQL 注释。
- 远程 PostgreSQL 中现有权限和菜单权限编码已迁移为标准编码。

## 编码规范

标准格式：

```text
module:resource:action
```

示例：

```text
agent:agent:view
agent:agent:manage
knowledge:base:view
knowledge:base:manage
tool:definition:view
tool:definition:manage
system:department:view
system:department:manage
security:rule:view
security:approval:handle
```

## 兼容策略

- 数据库主权限编码使用新标准编码。
- `permissionDefinitions` 保留 `legacy_code`，用于把旧编码映射到新编码。
- `expandPermissionCodes()` 会同时返回新旧编码，保证旧数据、旧菜单或旧会话可以过渡。
- `hasPermission()` 和 `hasEveryPermission()` 用于前后端统一权限判断。
- 后续新增权限必须直接使用 `module:resource:action`，不再新增旧格式编码。

## 数据库变更

- `permission.resource varchar(80) not null default ''`
- 新增索引：
  - `permission_resource_idx`
  - `permission_action_idx`
- 迁移脚本会把旧编码更新为新编码，并同步更新 `menu.permission_code`。

## 验证

- `pnpm --filter @aiaget/shared-types typecheck`
- `pnpm --filter @aiaget/control-api typecheck`
- `pnpm --filter @aiaget/control-api prisma:validate`
- `pnpm --filter @aiaget/web typecheck`
- 已对远程 PostgreSQL `127.0.0.1:5432/aiaget_platform` 执行迁移、注释脚本和种子数据。
- 登录后验证 `GET /api/v1/auth/me` 返回新编码权限和兼容旧编码。
- 登录后验证菜单权限编码已返回 `module:resource:action` 格式。
- 登录后验证 `GET /api/v1/departments/overview` 返回 200。
