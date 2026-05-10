# Product Prototype / Wireframe Prompt

Create a low/mid-fidelity wireframe for `/security/recovery` focused on information architecture.

Layout:
- Header: 自愈恢复, refresh button, link to 告警运营.
- Metric row: 待通知、待重试、任务失败率、待处理建议.
- Two-column upper section: left task runtime status, right task run history.
- Two-column middle section: left self-healing suggestions, right recovery audit list with filters.
- Bottom section: archive approval summary and recent archive/delete approval rows.

Interaction flow:
- User filters recovery audit by failure source “客户成功复盘归档删除”.
- Suggestion card displays source badge and customer success failed count.
- Task history remains operational summary only; customer success report details are not embedded.

States:
- Loading rows, empty state, error state, disabled actions without permission, readable Chinese labels.
