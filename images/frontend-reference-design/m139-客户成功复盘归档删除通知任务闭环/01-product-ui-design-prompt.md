# Product UI Design Image Prompt

Create a high-fidelity enterprise SaaS admin UI for the Security Center recovery page.

Context:
- Product/module: 企业 AI Agent 平台 / 安全中心 / 自愈恢复
- Page/route: `/security/recovery`
- Target roles: 安全管理员、审计员、租户管理员
- Goal: 将客户成功成交复盘报告归档删除审批告警纳入通知任务和自愈失败来源，便于定位自动通知失败、查看恢复审计并筛选来源。

Interface contract:
- Show task health metrics: 待通知、待重试、任务失败率、待处理建议。
- Show task run history with `AUTO_NOTIFY/AUTO_RETRY`, `SUCCESS/FAILED/SKIPPED`, scanned/success/failed/skipped counts.
- Show self-healing suggestion cards with source badges including “客户成功复盘归档删除”.
- Show recovery audit filters: 动作、状态、原因、失败来源、关键词.
- Failure source enum includes `CUSTOMER_SUCCESS_CLOSE_WON_REPORT_ARCHIVE_DELETE`.
- Do not show customer opportunity list or report content.

Visual style:
- Compact dashboard layout, restrained enterprise product feel, subtle borders, soft shadows, clean Chinese labels.
- Use existing card, metric, status badge, filter select, list row and empty/loading/error state patterns.
- Avoid hero sections, decorative blobs, unrelated charts, and over-dense tables.
