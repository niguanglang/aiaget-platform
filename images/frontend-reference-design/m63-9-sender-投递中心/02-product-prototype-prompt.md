# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: M63-9 Sender 投递中心 inside `/channels`
- Users/roles: 租户管理员、渠道管理员、审计人员、运维人员
- Main task flow:
  1. 用户进入全渠道发布中心。
  2. 选择一个发布渠道。
  3. 在“主动回复投递”区域筛选状态和平台。
  4. 点击一条投递记录查看请求、响应、Trace 和错误。
  5. 对失败投递执行重试，页面刷新列表并显示新投递。
- API/service contract:
  - `listChannelSenderDeliveries({ channel_id, status, provider })`
  - `getChannelSenderDelivery(deliveryId)`
  - `retryChannelSenderDelivery(deliveryId)`
- Data entities and fields:
  - delivery row: status, provider, channel name, agent name, delivery ID, target, response status, latency, retry count, created/delivered time, error summary
  - detail panel: delivery metadata, request headers, request body, response body, trace ID, run ID, external conversation/message IDs
- Actions and states:
  - filter, refresh, select, retry
  - loading, empty, error, permission-disabled, retry success

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Focus on information architecture and component boundaries.
- Layout:
  - top: existing page title and main channel metrics
  - middle left: channel list
  - middle right: selected channel detail
  - bottom full-width or two-column: “主动回复投递” list + detail inspector
  - filters above delivery list: channel, status, provider, refresh
- Include clear labels for filters, delivery rows, detail sections, code blocks and retry button.
- Include placeholders for empty delivery list and detail-not-selected state.
- Keep the layout realistic for the current Tailwind/shadcn-style project.

Avoid:
- polished decorative rendering
- invented backend fields
- a separate navigation route that bypasses `/channels`
