# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise SaaS admin page.

Project context:
- Product/module: 企业 Agent 平台控制台，系统管理 / 设置中心。
- Page/route: M45 系统设置中心 at `/settings`.
- Target users/roles: 租户管理员、租户运营、安全管理员；读取 `system:settings:view`，修改 `system:settings:manage`。
- Business goal: 在一个真实产品级设置中心里集中维护租户级系统参数，覆盖基础配置、安全策略、运行时、观测、数据保留和外部集成。
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + local shadcn-style Button/Card/MetricCard/StatusBadge/EmptyState, lucide icons, React Query.
- Existing page shell/layout: 控制台左侧导航 + 顶部栏；页面主体使用响应式 Bento Grid / Dashboard Layout，不做营销页。

Interface contract that must appear in the UI:
- API/service functions:
  - `GET /api/v1/system-settings/overview`
  - `GET /api/v1/system-settings?category=&status=`
  - `PATCH /api/v1/system-settings/:id`
  - `POST /api/v1/system-settings/:id/reset`
- Main entities and fields:
  - System setting: 名称、键名、分类、说明、当前值、默认值、值类型、选项、是否敏感、是否系统内置、状态、排序、更新时间、更新人。
  - Categories: 基础、安全、运行时、观测、数据保留、外部集成。
  - Value types: 文本、数字、布尔、JSON、下拉选项。
- Status values/enums: 启用、停用、已删除；只读、可编辑、保存中、已保存、恢复默认。
- User actions: 分类筛选、状态筛选、编辑参数、保存单项、恢复默认、查看敏感值脱敏提示、查看最近更新信息。
- Required states: loading, empty, error, validation, disabled, success, permission-denied/read-only.

Design requirements:
- Make it look like a production SaaS/admin product, not a generic template.
- Use Chinese visible text only.
- Top region: title “系统设置中心”, badges “M45” and “租户级参数”, a concise Chinese subtitle, and KPI cards for total settings, active settings, secret settings, changed-from-default settings.
- Main region: left or top category selector with counts, central grouped setting cards, and a compact right-side governance summary panel.
- Setting card design: subtle border, soft shadow, glass-like light surface, clear label hierarchy, key shown in monospace, status badge, control area appropriate to type, save/reset actions.
- Include realistic values such as `default_locale=zh-CN`, `session_timeout_minutes=120`, `runtime_stream_enabled=true`, `audit_retention_days=180`, `external_webhook_url`.
- Use restrained motion hints only as visual affordance: hover feedback and smooth transition cues, no dramatic animation.
- Keep information density useful but clean; enough whitespace for enterprise admin use.
- Visual style: minimal, technical, premium, product-like, with subtle border, soft shadow, faint noise texture, very restrained gradient mesh background.

Avoid:
- fake modules not in the contract
- English UI labels
- excessive gradients, cheap glow, emoji, huge rounded blob cards, overloaded tables
- decorative 3D elements that compete with the setting content
