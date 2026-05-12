# Project UI Brief

- Page: ConsoleNavigationRefinement
- Route: Global console layout, visible under `/dashboard` and every `app/(console)` route.
- Feature goal: complete the RuoYi-style admin navigation experience with mobile-safe deep menus, breadcrumb context, visited tabs, sidebar collapse persistence, and a real command search entry.
- Users/permissions: authenticated console users. Menu visibility is driven by `CurrentUserResponse.menus` and permission-filtered `AuthorizedMenuItem` trees from `AuthProvider`.
- APIs/services: no new backend calls. Uses `useAuth()` current user data, `buildNavigationLinks()`, `flattenNavigationLinks()`, `usePathname()`, `useRouter()`, and local browser storage for UI preferences.
- Entities/fields/statuses: `NavigationLink` fields are `id`, `title`, `href`, `external`, `icon`, `description`, `level`, `children`; menu metadata includes `keep_alive`, `affix`, `hide_breadcrumb`, `route_meta` but the current client mapping only exposes route tree basics.
- Existing components/design system: `ConsoleShell`, `Sidebar`, `MobileNav`, `Topbar`, shadcn-style `Button`, `Input`, Tailwind CSS, Lucide icons, glass border and restrained enterprise SaaS styling.
- Required states: no menu data fallback, active route, deep child active route, collapsed sidebar, mobile directory drilldown, empty search result, external link result, keyboard/escape close, permission-filtered navigation.
- Constraints: do not alter API contracts, middleware, containers, or database. Keep all visible text Chinese. Details/create/edit routes remain route-only pages, not left-menu entries.
