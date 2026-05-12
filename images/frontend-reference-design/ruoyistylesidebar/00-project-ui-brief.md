# Project UI Brief

- Page/feature: 若依式控制台侧边栏导航
- Route/layout: 全部 `(console)` 路由共享 `ConsoleShell`，桌面端由 `Sidebar` + `Topbar` + 内容区组成，移动端由 `MobileNav` 承接。
- Goal: 将当前全展开侧栏改为类似若依后台的可折叠侧边栏：支持整体收缩、父子菜单展开收起、深层菜单递归展示、当前路由自动展开。
- Users/permissions: 登录后的租户用户；菜单数据来自 `currentUser.menus` 和权限过滤后的 `AuthorizedMenuItem[]`，前端只渲染后端授权菜单。
- APIs/services: 不新增 API；使用 `useAuth()` 的 `currentUser.menus`，通过 `buildNavigationLinks()` 转为 `NavigationLink[]`。
- Entities/fields/statuses: `NavigationLink` 包含 `id/title/href/external/icon/description/level/children`；菜单节点可能是目录、菜单或外链。
- Existing components/design system: Next.js App Router、React、TypeScript、Tailwind CSS、lucide-react、shadcn 风格 `Button`、`cn` 工具。
- Required states: 有菜单、无菜单 fallback、当前路由激活态、父级展开态、父级收起态、侧栏展开态、侧栏收缩态、外链态。
- Constraints: 不改变后端菜单接口和路由；动态 create/detail/edit 路由不进侧边栏；桌面端实现折叠收缩，移动端继续使用当前分层横向导航。
