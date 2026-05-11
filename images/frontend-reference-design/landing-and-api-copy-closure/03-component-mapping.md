# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 首页入口卡片 | `apps/web/src/app/page.tsx` | Static route links `/login`, `/dashboard` | Replace obsolete M01/demo copy with product-ready copy. |
| 首页操作按钮 | `Button`, `Link` | Next.js route navigation | Keep two clear actions. |
| API header badges | `apps/web/src/app/(console)/api-reference/page.tsx`, `StatusBadge` | `externalEndpoints`, `streamEventFields` | Change completed capabilities from `mock` to `ready/healthy`. |
| API module metadata | `apps/web/src/config/modules.ts` | module config object | Update metrics/empty copy to current four endpoints and streaming support. |
| API Key row stream badge | `apps/web/src/components/api-keys/api-key-shared.tsx` | `TenantApiKeyListItem.allow_stream` | Use ready tone for real stream capability. |
