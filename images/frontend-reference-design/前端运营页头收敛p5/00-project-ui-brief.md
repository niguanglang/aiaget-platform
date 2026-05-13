# Project UI Brief

- Page: 前端运营页头收敛P5
- Route: /role-scenarios
- Feature goal: 去掉业务列表页概念标签和介绍式页头，改成可运营后台列表页面
- APIs/services: reuse existing list, create, edit, delete and lookup service functions in `apps/web/src/lib/api-client`.
- Entities/fields/statuses: role scenarios, solution packages, delivery assets, skills, customer assessments, customer success plans, actions and opportunities.
- Existing components/design system: page background components, `Card`, `Button`, `MetricCard`, `StatusBadge`, `EmptyState`, filters and tables already used by each page.
- Required states: loading, empty, error, permission-denied, read-only action visibility, pagination and destructive action confirmation.
- UI direction: keep operational list pages quiet and utilitarian. Page header should be title plus primary action only; metrics, filters and table carry the work. Avoid marketing badges, long product descriptions and explanation paragraphs.
