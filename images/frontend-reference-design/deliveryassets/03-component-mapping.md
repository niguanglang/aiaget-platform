# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/app/(console)/delivery-assets/page.tsx` + `DeliveryAssetsContent` | App Router console layout | Reuse M122 page shell density and background style |
| Header and metrics | `MetricCard`, `StatusBadge`, `Button` | `PaginatedResult<DeliveryAssetListItem>` | Metrics are current-page summaries plus total, not invented analytics |
| Search/filter toolbar | native inputs/selects + `Button` | `listDeliveryAssets` query params | Type/status/visibility/owner/review/package filters |
| Compact table | `delivery-assets-content.tsx` | `DeliveryAssetListItem` | Only core fields and previews; no full long text in rows |
| Detail view | `delivery-asset-detail-content.tsx` | `getDeliveryAsset` / `DeliveryAssetDetail` | Owns business value, guidance, source, risks, next action, linked resources |
| Create/edit form | `delivery-asset-form-panel.tsx` | `CreateDeliveryAssetInput`, `UpdateDeliveryAssetInput` | Independent create/edit pages, grouped fields, validation |
| Delete/archive confirmation | Inline confirmation card pattern from M122 | `deleteDeliveryAsset` | Requires second confirmation and error display |
| Feedback states | `EmptyState`, loading/error blocks, disabled buttons | React Query state and permissions | Chinese visible text |
