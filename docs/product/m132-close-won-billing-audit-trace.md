# M132 成交入账审计追踪增强

## 目标

M131 已经让续约机会详情页可以按调账单号跳转到审计中心。M132 补齐审计侧闭环：审计中心纳入计费平台事件，并支持按调账单号、机会名、客户名、链路 ID 检索成交入账相关事件。

## 范围

- 审计中心事件来源新增 `billing`，读取 `platform_event` 中 `event_source/source_system = billing` 的记录。
- 审计中心列表关键词搜索扩展到模块、动作、路径、错误信息和 `request_summary/payload`，可覆盖调账单号、续约机会名、客户名。
- 续约机会成交入账创建调账单时写入 `billing.adjustment.close_won_created` 平台事件。
- 审计概览新增 `billing_event_total` 指标，前端显示“计费事件”指标卡和“计费”来源筛选项。
- `/audit/events/:eventId` 仍承担完整事件详情查看，列表页只保留紧凑摘要和详情入口。

## 页面边界

- 审计列表页不展示完整 `payload_json`、调账详情或机会详情。
- 调账审批、应用、作废仍归属账单调账页。
- 续约机会详情页只负责业务反向入口，不承载审计事件明细。

## 验收点

- `GET /audit/events?source_type=billing&keyword=调账单号` 能返回计费平台事件。
- 成交入账生成调账单后会写入可检索的计费平台事件。
- 前端审计中心可以选择“计费”来源，并用中文提示搜索调账单号、机会名、客户名和链路 ID。
- 审计详情路由保持独立，列表页不混入详情面板。

## 前端参考

- UI brief、设计图提示词、原型图提示词与组件映射保存在 `images/frontend-reference-design/成交入账审计追踪/`。
