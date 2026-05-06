# Product Prototype / Wireframe Prompt

Create a low- to mid-fidelity wireframe for the channel operations IA split.

Routes and page responsibilities:
- `/channels`: legacy-compatible command center rendered by `ChannelContent`
- `/channels/publish`: published Agent channel inventory, health check, enable/disable
- `/channels/accounts`: provider summary plus channel account credential inventory, enable/disable/delete
- `/channels/templates`: message/template configuration inventory, enable/disable/delete
- `/channels/route-rules`: inbound/outbound routing rules, priority/match/target summary, enable/disable/delete
- `/channels/jobs`: publish/push job queue, progress, retry/cancel
- `/channels/deliveries`: delivery ledger, latency/response/retry/trace/error inspection

Prototype regions for each focused page:
- Header: Chinese title, route responsibility subtitle, permission badges, refresh button, back-to-overview link
- Route navigation: compact links for 发布渠道 / 账号凭据 / 消息模板 / 路由规则 / 发布任务 / 投递记录, with the current route highlighted
- Metrics strip: 3-5 compact cards using current API totals and status counts
- Filter toolbar: keyword, status, provider/channel filter where supported, reset button
- List surface: dense cards or table rows with only core fields visible
- Row details: collapsed `更多`/detail section with low-frequency actions and secondary metadata
- Feedback states: loading skeletons, empty state, API error banner, action success/error banner, disabled permission state

Do not invent unsupported detail routes or fake APIs. The wireframe should make it obvious that each subroute owns a real query and action workflow, while `/channels` remains compatible.
