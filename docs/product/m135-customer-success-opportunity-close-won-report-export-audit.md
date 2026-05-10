# M135 续约机会成交复盘报告导出审计

## 背景

M134 已经支持成交复盘报告 Markdown 导出。报告包含客户名称、成交金额、商务策略、来源链路和调账追踪，属于企业运营与财务复盘材料，因此导出行为需要进入平台事件链路，便于审计中心和后续安全运营统计追踪。

## 范围

- 在 `exportCloseWonReportMarkdown` 中记录平台事件。
- 事件类型：`customer_success.opportunity.close_won_report.exported`。
- 资源类型：`CUSTOMER_SUCCESS_OPPORTUNITY`。
- 不新增表结构、不启动中间件、不改变导出文件格式。

## 事件字段

事件 payload 包含：

- `opportunity_id`
- `opportunity_code`
- `opportunity_name`
- `customer_name`
- `export_format`
- `estimated_amount`
- `close_amount`
- `adjustment_count`
- `billing_adjustment_nos`

## 验收

- 导出 Markdown 时写入 1 条平台事件。
- 事件包含租户、部门、用户、请求、Trace 上下文。
- 事件 summary 包含“成交复盘报告已导出”。
- 原有导出内容不变。
- 客户成功机会后端测试通过。
