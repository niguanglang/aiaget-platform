# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| App shell | To be scaffolded in `apps/web/src/app/layout.tsx` | Next.js App Router | M00 creates root layout only; full protected shell lands in M01. |
| Global styles/theme | To be scaffolded in `apps/web/src/app/globals.css` | Tailwind config and CSS variables | Keep shadcn/ui-compatible tokens. |
| Dashboard route | To be scaffolded in `apps/web/src/app/page.tsx` then expanded in M01 | Planned health APIs | M00 can show minimal scaffold text only. |
| Navigation | Future `apps/web/src/config/navigation.ts` and layout components | Module route contract from AI build prompt | Do not create business pages in M00. |
| Health cards | Future dashboard component | `GET /api/v1/health`, `GET /runtime/health` | Implement in M01 after API clients exist. |
| List page pattern | Future shared components: DataTable, MetricCard, StatusBadge, ConfirmDialog, FormDrawer | Future CRUD APIs | Reserved for M03+ modules. |
| Feedback states | Future shared components | Query/loading/error contracts | M00 only establishes folders and conventions. |
