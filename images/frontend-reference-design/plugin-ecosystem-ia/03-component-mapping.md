# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Console page shell | `apps/web/src/app/(console)/plugins/**/page.tsx`, `PluginCenterBackground` | App Router layout | Keep the existing console shell; add only route-level pages under plugins. |
| List overview metrics | `MetricCard` in `plugin-content.tsx` | `getPluginOverview`, `PluginOverview` | `/plugins` owns overview counts. |
| Search/filter toolbar | `Input`, native `select`, `Button` | `listPluginMarket`, `listPluginInstallations`; local keyword/status/risk filtering | Keep client-side filtering because current APIs return arrays. |
| Market/installed table | `Card`, `StatusBadge`, table rows | `PluginMarketItem`, `PluginInstallationItem` | List page shows summary rows and route entry actions only. |
| Install dialogs | Extracted shared dialog helpers | `installPlugin`, `CreatePluginInstallationInput`, `PluginMarketItem` | Allowed on `/plugins` as an install entry; full installed config goes to `/installations`. |
| Detail summary page | `plugin-detail-content.tsx` | `getPluginInstallation`, `PluginInstallationDetail` | Shows manifest summary, status, permissions, version/audit summaries, and links to config/security/bindings. |
| Installation config page | `plugin-installations-content.tsx` | `getPluginInstallation`, `updatePluginInstallation`, `enablePlugin`, `disablePlugin`, `upgradePlugin`, `uninstallPlugin` | Owns edit form for installation status/runtime/risk/config and destructive/runtime actions. |
| Security page | `plugin-security-content.tsx` | `getPluginInstallation`, `PluginSecurityPreview`, audit logs | Owns safety preview, policy/risk checks, and audit context. |
| Bindings page | `plugin-bindings-content.tsx` | `getPluginInstallation`, `updatePluginHook`, `updatePluginMenuBinding`, `PluginHookItem`, `PluginMenuBindingItem` | Owns Hook and menu binding toggle/edit controls. |
| Shared labels/helpers | `plugin-status.ts`, new `plugin-shared.tsx` | shared plugin enums/types | Move presentational helpers, messages, JSON/manifest summaries, permissions and review labels here. |
| Menu seed | `apps/control-api/prisma/seed.ts` | menu definition with `code: 'plugins'`, `path: '/plugins'` | Contract: only top-level `/plugins` is seeded; dynamic detail/config routes stay outside seed. |
