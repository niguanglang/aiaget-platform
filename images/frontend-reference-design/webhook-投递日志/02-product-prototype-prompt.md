# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for Webhook 投递日志 inside the enterprise Agent Platform API Key page.

Project context:
- Page/route: `/api-keys`
- Users/roles: 租户管理员和 API Key 管理员可重试；审计员可查看
- Main task flow: 用户进入 API Key 管理中心 -> 查看 Webhook 投递汇总 -> 过滤某个 API Key -> 打开失败投递详情 -> 查看 payload/请求头/响应摘要 -> 点击重试 -> 刷新列表并看到新投递记录
- API/service contract: `listWebhookDeliveries({ api_key_id? })`、`getWebhookDelivery(deliveryId)`、`retryWebhookDelivery(deliveryId)`
- Data entities and fields: `WebhookDeliveryListItem`、`WebhookDeliveryDetail`，字段包括状态、响应码、耗时、错误、重试次数、目标地址、投递 ID、父级投递 ID、payload 和请求头
- Actions and states: 筛选、刷新、复制、查看详情、重试失败记录；loading、empty、error、disabled、success、permission-denied

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Preserve the existing `/api-keys` page shell and add a clear Webhook 投递日志 section.
- Show component boundaries: toolbar filters, delivery list, detail panel, retry action, empty/error/loading states.
- Keep Chinese labels and realistic enterprise operations copy.
- Do not invent unrelated workflow, queue system, or new navigation.
