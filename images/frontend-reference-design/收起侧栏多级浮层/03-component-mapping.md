# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 桌面侧栏外壳 | `apps/web/src/components/layout/sidebar.tsx` | `currentUser.menus`、`currentUser.user.permissions` | 保留展开态递归树和收起态 72px 图标栏 |
| 收起态一级图标 | `SidebarNavItem` | `NavigationLink.icon/title/children` | 有 children 时 hover/focus 打开浮层，不直接展开整条侧栏 |
| 收起侧栏子菜单浮层 | `CollapsedFlyoutMenu` | `NavigationLink.children` | `role="menu"`、中文 `aria-label`、玻璃白面板、轻阴影 |
| 多级浮层菜单项 | `CollapsedFlyoutMenuItem` | `NavigationLink.href/external/children` | 路由项用 `Link role="menuitem"`，目录项用 `button role="menuitem"`，避免嵌套交互控件 |
| 导航激活判断 | `apps/web/src/components/layout/navigation-utils.ts` | `NavigationLink.href/external/children` | 统一 `isNavigationItemActive`、`findActivePathIds`、`findActivePath`、`searchNavigationItems` |
| 移动端多级导航 | `apps/web/src/components/layout/mobile-nav.tsx` | `buildMobileNavigationLevels` | 保留 drilldown，不使用桌面浮层 |
| 顶部命令搜索 | `apps/web/src/components/layout/topbar.tsx` | `searchNavigationItems` | 继续支持中文搜索文案、空状态、Escape |
| 面包屑和访问页签 | `apps/web/src/components/layout/console-route-chrome.tsx` | `findActivePath`、`NavigationLink.affix/hideBreadcrumb` | 跟随当前路由生成面包屑和页签 |
| 契约测试 | `apps/web/src/components/menus/menus-route-ia-contract.test.ts` | 源码结构契约 | 锁定浮层、共享工具和无嵌套交互控件 |
