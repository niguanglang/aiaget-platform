# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the AIAget enterprise AI Agent platform console navigation collapsed-sidebar flyout.

Project context:
- Page/route: 控制台 Shell 导航体验 at `/console-shell`
- Users/roles: 企业后台管理员、Agent 管理员、系统管理员、审计员
- Main task flow: 用户收起左侧菜单栏 -> hover/focus 一级图标 -> 查看右侧浮层子菜单 -> 进入二级或三级页面 -> 通过面包屑和访问页签确认当前位置
- API/service contract: no new API; use authorized menu tree, `buildNavigationLinks`, `navigation-utils`
- Data entities and fields: NavigationLink title, href, icon, description, level, external, children
- Actions and states: collapse, expand, hover, focus, keyboard Escape close, ArrowRight open, active route, external route

Prototype requirements:
- Low- to mid-fidelity wireframe focused on information architecture and interaction.
- Show the fixed desktop shell regions: 72px collapsed left rail, topbar search/user area, breadcrumb row, visited tabs row, main content area.
- Show a flyout attached to one active sidebar icon, with header title and nested menu rows.
- Show row-level states: active child, hover child, directory child with right chevron, external link marker if needed.
- Include labels for accessibility and behavior: `aria-haspopup=menu`, `role=menu`, `role=menuitem`, keyboard close.
- Keep component boundaries obvious: Sidebar, CollapsedFlyoutMenu, CollapsedFlyoutMenuItem, ConsoleRouteChrome, Topbar.

Avoid:
- mixing business detail pages into navigation,
- adding unrelated settings forms,
- hiding menu hierarchy,
- making the collapsed icon rail open the whole sidebar as the primary child-menu behavior.
