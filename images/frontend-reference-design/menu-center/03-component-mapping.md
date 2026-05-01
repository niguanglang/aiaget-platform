# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page route | `apps/web/src/app/(console)/menus/page.tsx` | `menu.read` | New console page, Chinese UI |
| Page shell | Existing `ConsoleShell` | route group layout | Reuse sidebar/topbar/mobile nav |
| Dynamic navigation | `Sidebar`, `MobileNav`, `AuthProvider` | `CurrentUserResponse.menus` | Use backend menus first, static navigation fallback |
| Header and metrics | `MetricCard`, `StatusBadge`, `Button` | `MenuOverview` derived from list/tree | Shows total, page/menu/button, disabled, hidden |
| Filters | `Input`, native select styled with Tailwind | list query DTO | keyword/type/enabled/visible |
| Menu tree/table | `Card`, `StatusBadge`, `Button` | `MenuTreeItem`, `MenuListItem` | Show indentation, parent relation, sort order |
| Detail panel | `Card`, `StatusBadge` | selected menu item | Preview path, icon, permission, state |
| Create/edit dialog | `Card`, `Input`, `Button`, selects | create/update DTO | Validate code/type/path/sort |
| Role binding panel | `Card`, checkboxes, `Button` | `MenuRoleBindingItem` | Save selected menu ids per role |
| Empty/error/loading | `EmptyState`, banners, disabled buttons | React Query states | Match existing product pages |
