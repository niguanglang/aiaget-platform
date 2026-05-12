# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the AIAget enterprise AI Agent platform console navigation.

Project context:
- Product/module: AIAget 企业智能体控制台
- Page/route: 控制台 Shell 导航体验 at `/console-shell`
- Target users/roles: 企业后台管理员、Agent 管理员、知识库管理员、工具管理员、审计员
- Business goal: 在菜单很多、层级很深的企业后台中，让用户像若依后台一样快速折叠侧栏，并在收起态通过浮层访问多级菜单
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui 风格 Button/Input/Card + lucide-react
- Existing page shell/layout: 左侧桌面侧栏、顶部栏、面包屑、访问页签、移动端多级横向导航

Interface contract that must appear in the UI:
- API/service functions: no new backend API; use current user authorized menus from AuthProvider and `buildNavigationLinks`
- Main entities and fields: `NavigationLink` with title, href, icon, description, level, external, affix, hideBreadcrumb, children
- Status values/enums: expanded sidebar, collapsed sidebar, active route, opened flyout, external menu
- User actions: collapse sidebar, expand sidebar, hover/focus a collapsed parent menu, open flyout submenu, click route link, open nested submenu, use breadcrumb and visited tabs
- Required states: active, hover, focus, empty search state, authorized-only menu state

Design requirements:
- Desktop sidebar is collapsed to a 72px icon rail.
- Hovering a parent icon opens a right-side floating submenu with a glass white panel, subtle border, soft shadow, and compact enterprise density.
- Floating submenu supports nested levels: child rows with icons, titles, active state, and chevrons for deeper levels.
- Avoid nested buttons or links visually; routed menu row and expand affordance should read as separate controls.
- Keep all visible UI text Chinese: 工作台、Agent 中心、知识库中心、工具中心、系统管理、收起侧栏子菜单.
- Keep the style minimal, technical, high-end, product-like, with restrained motion and no cheap glow.
- Preserve the existing blue active state and clean white SaaS dashboard feeling.

Avoid:
- over-decorated gradients, large rounded blobs, emoji, fake unrelated modules, unreadable text, or landing-page style composition.
