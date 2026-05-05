# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Route entry | `apps/web/src/app/(console)/plugins/page.tsx` | Next.js App Router | Keep route contract unchanged; render `PluginContent`. |
| Page shell/background | `apps/web/src/components/plugins/plugin-content.tsx`, `PluginCenterBackground` | Route shell + React Three Fiber background | Reuse existing max-width dashboard layout and restrained 3D particle ambience. |
| Metrics | `MetricCard` in `PluginContent` | `PluginOverview` from `getPluginOverview` | Show total, active, pending review, menu injection counts. |
| Market/installed tabs and filters | Existing segmented buttons, search input, select filters | `PluginMarketItem[]`, `PluginInstallationItem[]` | Preserve keyword, status and risk filtering; Chinese labels. |
| Plugin table rows | `MarketRow`, `InstallationRow` | Market/install item status, risk, counts | Keep action buttons permission-aware; installed market item opens detail. |
| Detail action panel | `PluginDetailPanel` | `PluginInstallationDetail` | Show configure, enable/disable, uninstall, upgrade; enable disabled when `security_preview.can_enable=false`. |
| Security review | `SecurityReviewPanel` | `PluginSecurityPreview` | Show review_required, review_status, can_enable, block_reason, risk/permission/menu/hook signals. |
| Version compare | `VersionComparePanel` | `versions`, `manifest_json` | Use existing lightweight manifest diff. |
| Menu and Hook controls | Detail list cards | `PluginMenuBindingItem`, `PluginHookItem` | Toggle visible/enabled/status through existing PATCH APIs. |
| Permission preview and audit | `DetailList`, `StatusBadge`, `EmptyState` | `permission_preview`, `audit_logs`, `plugin:center:audit` | Hide audit details when permission missing. |
| Custom install dialog | `CustomPluginDialog` | `CreatePluginInstallationInput` | Validate Manifest JSON locally before calling install. |
| Uninstall dialog | `ConfirmDialog` | `PluginUninstallResult` from `uninstallPlugin` | Explain soft-delete cleanup for generated menu bindings, menus, hooks and tools; keep audit history. |
| Feedback states | `Message`, `EmptyState`, disabled buttons | React Query loading/error/mutation state | Include success notice, action error, loading, empty, validation and no-permission states. |
