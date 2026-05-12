Create a high-fidelity product UI design image for an enterprise AI Agent platform console sidebar.

Project context:
- Product/module: AIAget 企业智能体控制台
- Page/route: shared console shell around `/dashboard`
- Target users/roles: authenticated tenant users with RBAC/ABAC-filtered menu access
- Business goal: provide a RuoYi-style admin navigation that supports many business domains and deep menu trees without overwhelming the user
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn-style Button components, lucide-react icons
- Existing page shell/layout: left fixed sidebar, topbar, main content area, mobile horizontal navigation

Interface contract that must appear in the UI:
- Data source: authorized menu tree from `currentUser.menus`, mapped to `NavigationLink[]`
- Main fields: menu icon, Chinese menu title, route href, children, active route state, external link state
- User actions: collapse/expand the whole sidebar, expand/collapse menu groups, click menu routes, open external routes
- Required states: expanded sidebar, collapsed icon-only sidebar, active item, active ancestor, collapsed group, expanded group, deep child indentation

Design requirements:
- Visual style similar to a mature RuoYi-style enterprise admin system, adapted to the current clean AIAget SaaS look.
- Use a compact left sidebar with clear hierarchy, small chevrons for expandable parents, icon-only collapsed rail, and readable Chinese labels.
- Show deep menus such as Agent 平台 / 知识库中心 / 文档处理任务 and 渠道运营 / 渠道配置 / 发布治理 / 发布流水线.
- Keep the UI dense, operational, and businesslike; avoid marketing hero styling.
- Use subtle borders, soft shadows, and restrained glass-like background already used by the project.

Avoid:
- fake fields or unrelated modules
- oversized cards inside the sidebar
- decorative gradients that reduce readability
- flattening all menu levels into one long list
