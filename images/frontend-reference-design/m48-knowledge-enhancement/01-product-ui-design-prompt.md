# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real frontend page.

Project context:
- Project/module: 企业 Agent 平台 / 知识库中心增强
- Page/route: 知识库中心增强 at /knowledge
- Target users/roles: 租户管理员、知识库管理员、审计员、Agent 管理员
- Business goal: 在知识库列表页增加租户级治理总览，集中展示知识库健康、处理队列、索引就绪率和最近召回情况。
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn-like UI + motion/react + lucide-react
- Existing page shell/layout: Next.js App Router `(console)` 控制台布局，左侧动态菜单 + 顶部栏，页面使用 Bento Grid / Dashboard Layout

Interface contract that must appear in the UI:
- API/service functions: `GET /api/v1/knowledge-bases/overview`, `GET /api/v1/knowledge-bases`, `GET /api/v1/knowledge-bases/:id`, `POST /api/v1/knowledge-bases/:id/retrieval-test`
- Main entities and fields: knowledge base list items, document health, processing tasks, recall logs, vector/index readiness, retrieval mode, owner, visibility, status, recent documents, recent tasks
- Status values/enums: `ACTIVE`, `DISABLED`, `ARCHIVED`, `PENDING`, `PROCESSING`, `READY`, `FAILED`, `DELETED`, `VECTOR`, `KEYWORD`, `HYBRID`, `QDRANT`, `OPENSEARCH`, `POSTGRES_FALLBACK`
- User actions: search, filter, refresh, open detail, upload document, rebuild index, run retrieval test, inspect recent tasks, inspect recent recall logs
- Required states: loading, empty, error, partial data, permission-denied, success

Design requirements:
- Make it look like a production SaaS/admin product, not a generic mockup.
- Use only fields and actions supported by the interface contract.
- Show the primary workflow clearly: overview metrics on top, knowledge base list in the middle, right-side governance panel with recent documents/tasks/recall logs and retrieval test preview.
- Include realistic table/card/filter/detail areas based on the interface contract.
- Use a coherent component system: navigation, toolbar, filters, data display, detail/action region, feedback states.
- Keep visual language consistent with the current project design system, with subtle borders, soft shadows, backdrop blur, restrained teal/slate accents, and clean information hierarchy.
- Output should be a product UI design reference image suitable for frontend implementation.

Avoid:
- fake API fields not listed above
- decorative UI that cannot map to project components
- unreadable tiny text, random charts, placeholder lorem ipsum
- inconsistent actions or states
