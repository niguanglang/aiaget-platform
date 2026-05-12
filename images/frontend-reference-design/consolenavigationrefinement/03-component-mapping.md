# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Desktop sidebar tree | `apps/web/src/components/layout/sidebar.tsx` | `NavigationLink[]` from `buildNavigationLinks()` | Keep existing collapse width and recursive rendering |
| Mobile deep menu | `apps/web/src/components/layout/mobile-nav.tsx` | same `NavigationLink[]` | Change directory entries to buttons and expose current child level |
| Topbar search trigger | `apps/web/src/components/layout/topbar.tsx` | flattened navigation links | Replace static search hint with interactive command search |
| Command search overlay | new layout component | `flattenNavigationLinks(buildNavigationLinks(...))` | Local-only route search, no backend call |
| Breadcrumb and visited tabs | new layout component used by `ConsoleShell` | active path from navigation and `usePathname()` | Chinese labels, active route, close inactive tabs |
| Sidebar preference | `ConsoleShell` local state | `window.localStorage` | Persist collapsed state client-side |
| Contract tests | `apps/web/src/components/menus/menus-route-ia-contract.test.ts` | source-level IA contract | Guard mobile directory buttons, breadcrumb/tabs/search existence |
