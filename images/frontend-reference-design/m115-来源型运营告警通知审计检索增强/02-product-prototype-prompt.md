# Product Prototype / Wireframe Prompt

Create a low/mid-fidelity product prototype wireframe for the enterprise AI Agent platform security center.

Screen: `/security`, section “审批与归档运营 / 通知投递审计”.

Information architecture:
1. Header row with M115 badge, retryable count, source-risk count.
2. Metrics row: delivery total, retryable, source-risk, failed/partial.
3. Filter row: status select, source/category select, keyword input, reset button.
4. Action row or right controls: refresh, export CSV, create archive.
5. Audit table: status, alert/category, channels/targets, webhook, retry, request/trace, delivery time, retry action.
6. Archive panel below table: archive list with file name, size, updated time, download action.
7. Empty, loading, export success/error and archive success/error states.

Prototype annotations:
- Source categories include SLA 死信归档删除, 自愈归档删除, 双来源失败, 通知任务风险.
- Export and archive use current filters.
- Archives are object-store files, not database rows.

Use Chinese labels only. Keep layout compact, utilitarian, and suitable for audit operations.
