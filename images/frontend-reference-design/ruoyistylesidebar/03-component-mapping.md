| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Console shell state owner | `apps/web/src/components/layout/console-shell.tsx` | local React state | Owns desktop sidebar collapsed state and passes it to sidebar/top-level layout. |
| Sidebar header and collapse button | `apps/web/src/components/layout/sidebar.tsx` | none | Use lucide `PanelLeftClose` / `PanelLeftOpen`; persist not required for first pass. |
| Recursive menu tree | `apps/web/src/components/layout/sidebar.tsx` | `NavigationLink[]` from `buildNavigationLinks()` | Parent items get chevrons and local expanded state keyed by menu id. |
| Active route expansion | `apps/web/src/components/layout/sidebar.tsx` | `usePathname()` | Active ancestors auto-expand when route changes. |
| Collapsed icon-only rail | `apps/web/src/components/layout/sidebar.tsx` | `NavigationLink.icon/title` | Width shrinks; labels and children hidden; title attribute preserves discoverability. |
| Mobile navigation | `apps/web/src/components/layout/mobile-nav.tsx` | existing `NavigationLink[]` | Leave current layered horizontal mobile navigation unchanged. |
| IA contract tests | `apps/web/src/components/menus/menus-route-ia-contract.test.ts` | source assertions | Add checks for collapsed prop/state, chevrons, active ancestor expansion, and icon-only mode. |
