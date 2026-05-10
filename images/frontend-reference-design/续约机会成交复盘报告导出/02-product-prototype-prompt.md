# Product Prototype / Wireframe Prompt

Create a low- to mid-fidelity wireframe for a report page export enhancement.

Route: /customer-success-opportunities/[id]/close-won-report
Task flow: user enters the close-won report, reviews report sections, clicks 导出报告, receives a Markdown file download, or sees an inline export error.

Regions:
- Header: title, status badges, action buttons: 返回详情 / 调账记录 / 审计追踪 / 导出报告。
- Summary metrics row.
- Two-column report body for 客户价值复盘 and 来源链路。
- 入账追踪 list.
- 复盘要点 and 下一步动作 cards.
- Small inline error/notice area near header when export fails.

Constraints:
- Report stays read-only.
- Export action belongs only to this report page, not list or analytics pages.
- No modal confirmation needed because export is read-only.
