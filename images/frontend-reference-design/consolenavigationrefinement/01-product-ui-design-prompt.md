# Product UI Design Image Prompt

Create a high-fidelity product UI design image for an enterprise AI Agent platform console shell.

Project context:
- Product/module: AIAget 企业智能体平台
- Page/route: Global console layout around `/dashboard` and all authenticated console routes
- Target users/roles: enterprise administrators, Agent operators, security auditors, customer success operators
- Business goal: make a dense multi-module admin platform feel navigable, with RuoYi-style left navigation, breadcrumbs, visited tabs, mobile hierarchy, and command search.
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui-style Button/Input, Lucide icons
- Existing page shell/layout: glassy white admin console with left sidebar, sticky topbar, page content region, Chinese labels

Interface contract that must appear in the UI:
- Data source: authenticated `currentUser.menus`, permission-filtered menu tree
- Main entities and fields: navigation item title, icon, route href, level, children, external marker, active route
- User actions: collapse sidebar, expand/collapse menu groups, drill into mobile menu levels, search route by title/path, click search result, close search, close visited tab, navigate between visited tabs
- Required states: active route, collapsed sidebar, empty search result, external link result, mobile deep menu child level, visited tab active/inactive

Design requirements:
- Make it look like a real production SaaS/admin product, not a landing page.
- Use a RuoYi-inspired admin navigation pattern: compact sidebar, multi-level tree, icon-only collapsed mode, top breadcrumb, visited tab strip.
- Keep styling restrained: subtle borders, soft shadow, backdrop blur, clean hierarchy, no exaggerated glow.
- Show Chinese text labels such as 工作台, Agent 平台, 知识库中心, 系统管理, 菜单管理.
- Show the command search overlay as a compact modal with search input and grouped route results.
- Show mobile navigation as a top horizontal level bar plus a sublevel drilldown, with directory entries as buttons rather than broken links.

Avoid:
- invented data fields outside navigation/menu concerns
- marketing hero layout
- unreadable tiny text
- decorative 3D elements that distract from navigation
