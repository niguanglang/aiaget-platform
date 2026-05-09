# Product Prototype / Wireframe Prompt

Create a low- to mid-fidelity wireframe for the channel operations IA split.

Routes and page responsibilities:
- `/channels`: legacy-compatible command center rendered by `ChannelContent`
- `/channels/publish`: published Agent channel inventory, health check, enable/disable
- `/channels/providers`: channel provider inventory, health/readiness summary, enable/disable/delete, create/edit entry only
- `/channels/providers/create`: dedicated channel provider creation form
- `/channels/providers/:providerId/edit`: dedicated channel provider edit form loaded by provider id
- `/channels/accounts`: provider summary plus channel account credential inventory, enable/disable/delete, create/edit entry only
- `/channels/accounts/create` and `/channels/accounts/:accountId/edit`: dedicated channel account credential forms
- `/channels/templates`: message/template configuration inventory, enable/disable/delete, create/edit entry only
- `/channels/templates/create` and `/channels/templates/:templateId/edit`: dedicated message template forms
- `/channels/route-rules`: inbound/outbound routing rules, priority/match/target summary, enable/disable/delete, create/edit entry only
- `/channels/route-rules/create` and `/channels/route-rules/:routeRuleId/edit`: dedicated route rule forms
- `/channels/jobs`: publish/push job queue list with progress, retry count, channel context and detail entry only
- `/channels/jobs/:jobId`: publish job detail with cancel/retry, task timeline, timestamps, error, payload and result
- `/channels/deliveries`: delivery ledger list with latency/response/retry/target summary and detail entry only
- `/channels/deliveries/:deliveryId`: delivery detail with request information, response information, error and trace/conversation/run/external IDs
- `/channels/replies`: reply ledger list with status/platform/channel/external conversation/Trace coverage and detail entry only
- `/channels/replies/:replyId`: reply detail with message link, sender/recipient, full content and original payload
- `/channels/release`: release governance overview with metrics, module entry cards and scheduler summary only
- `/channels/release/pipeline`: release pipeline page with channel picker, pipeline overview, batch creation form, mark-full/abort actions, release steps and recent batches
- `/channels/release/gate`: release gate page with channel picker, gate evaluation, metrics, editable policy form, save policy confirmation and manual evaluate action
- `/channels/release/automation`: automation page with channel picker, editable policy form, save policy confirmation, recent decision and run automation action
- `/channels/release/self-healing`: self-healing page with channel picker, rollback recommendation, metrics, editable policy form, save policy confirmation and run action
- `/channels/release/scheduler`: scheduler page with schedule status, candidate summary, last run and run scheduler action
- `/channels/release/reports`: release report page with channel picker, report summary, risks and snapshot list/create action

High-impact action rule:
- Enable/disable/delete on providers/accounts/templates/route rules, publish channel enable/disable, job cancel/retry, Sender retry/auto-retry/cleanup, release pipeline batch start/full/abort, release gate policy save/evaluation, automation policy save/run, self-healing policy save/run, scheduler run, and release report snapshot creation must point to a confirmation modal state before mutation.
- Confirmation modal wireframes should include title, impact text, cancel action, confirm action, and pending/disabled state.

Prototype regions for each focused page:
- Header: Chinese title, route responsibility subtitle, permission badges, refresh button, back-to-overview link
- Route navigation: compact links for 发布渠道 / 渠道提供方 / 账号凭据 / 消息模板 / 路由规则 / 发布任务 / 投递记录 / 回复记录 / Sender 投递 / 发布治理, with the current route highlighted
- Metrics strip: 3-5 compact cards using current API totals and status counts
- Filter toolbar: keyword, status, provider/channel filter where supported, reset button
- List surface: dense cards or table rows with only core fields visible
- Row details: collapsed `更多`/detail section with secondary metadata and `查看详情`; do not place job cancel/retry, request/response payloads, error全文 or full message content inside the list row
- Job detail page: header actions for 返回列表/刷新/取消任务/重试任务, cards for 基础信息/任务时间线/执行载荷/执行结果
- Delivery detail page: header actions for 返回列表/刷新/复制投递 ID/查看 Trace, cards for 投递基础信息/请求信息/响应信息/链路信息
- Reply detail page: header actions for 返回列表/刷新/复制回复 ID/查看 Trace, cards for 回复基础信息/消息链路/消息内容/原始载荷
- Release governance pages: use shared release subnav; overview must not include child workflow queries except scheduler overview; child pages own their module actions and detail cards.
- Provider form pages: grouped form sections for basic info, endpoint/callback, auth/capabilities, config JSON, description, with 保存/取消 actions and permission-disabled state
- Feedback states: loading skeletons, empty state, API error banner, action success/error banner, disabled permission state

Do not invent unsupported detail routes or fake APIs. The wireframe should make it obvious that each subroute owns a real query and action workflow, while `/channels` remains compatible.
