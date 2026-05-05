# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell/header | `apps/web/src/components/channels/channel-content.tsx` | `/channels` route | Reuse current `main max-w-7xl` layout and `ChannelCenterBackground` |
| Permission gate | `useAuthPermissions` | `channel:publish:view/manage/deploy/disable` | Reuse existing gate |
| Existing metrics | `MetricCard` grid | `PublishChannelOverview.summary` | Keep current metrics |
| Module navigation | New local component in `channel-content.tsx` | local UI state | Tabs/segmented controls: 总览、发布渠道、渠道提供方、账号、模板、路由规则、发布任务、投递记录、回复记录 |
| Existing publish channel workbench | Current channel list/detail/form | `PublishChannelListItem` and mutation APIs | Keep behavior intact |
| New operations overview | New local panel | New list endpoint results | Summaries across provider/account/template/rule/job/delivery/reply |
| Provider/account/template/rule/job/delivery/reply lists | New local reusable workbench | `listChannelProviders` etc. | Read-only list + detail panel until DTOs are confirmed |
| Sender delivery | Existing `SenderDeliveryCenter` | existing sender delivery API | Keep retry/detail behavior |
| Release/approval/gray/pipeline/report | Existing panels | existing release APIs | Preserve current workflow |
| Feedback states | Existing banners, `EmptyState`, loading placeholders | React Query states | Add partial backend errors without hiding existing page |

## Implementation Plan

1. Add front-end provisional channel operations types and list functions in `api-client.ts`.
2. Add local module state, filters and seven `useQuery` calls in `ChannelContent`.
3. Add a module navigation and bento overview near the top of `/channels`.
4. Add a read-only operations workbench with list/detail for provider/account/template/route-rule/job/delivery/reply.
5. Keep existing publish channel and release sections intact; no backend or shared type edits.
6. Validate with web typecheck and targeted eslint.
