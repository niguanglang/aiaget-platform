# Project UI Brief

- Page: 菜单中心重构
- Route: /menus
- Feature goal: 菜单定义、树形结构、权限标识和角色授权分离
- Target users/roles: 租户管理员、平台管理员、具备 `system:menu:view` / `system:menu:manage` 的系统管理人员。
- APIs/services: `getMenuOverview`, `getMenuTree`, `listMenus`, `getMenu`, `createMenu`, `updateMenu`, `deleteMenu`, `enableMenu`, `disableMenu`; 角色菜单授权迁移到角色中心，使用 `listMenuRoleBindings` 与 `updateMenuRoleBinding`。
- Entities/fields/statuses: `MenuListItem` / `MenuDetail` / `MenuTreeItem`; 字段包括名称、编码、类型、父级、路径、组件、图标、权限编码、排序、可见、启用、子节点数、角色引用数、更新时间；类型为 `DIRECTORY` / `MENU` / `BUTTON`。
- Existing components/design system: Next.js App Router, React, TypeScript, Tailwind CSS, motion, lucide-react, 本地 shadcn 风格 `Button` / `Card` / `EmptyState` / `MetricCard` / `StatusBadge`，页面背景使用 `MenuCenterBackground`。
- Required states: loading, empty, error, validation, disabled, success, permission-denied
- Constraints: 菜单中心只定义目录/页面/按钮节点，不直接给角色授权；删除前后端都要清楚提示子节点、角色绑定、插件菜单绑定依赖；按钮节点不进入左侧导航。
