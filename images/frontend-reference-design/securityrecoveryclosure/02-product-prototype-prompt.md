# Product Prototype / Wireframe Prompt

Create a mid-fidelity wireframe for a Chinese admin console page `/security/recovery`.

Information architecture:
- Header: title "自愈恢复", description, actions: 刷新, 告警运营.
- Metrics row: 4 equal cards.
- Two-column section:
  - Left card "任务运行": status tiles, policy line, buttons for manual auto notify and auto retry.
  - Right card "任务运行历史": filter row, compact event list.
- Two-column section:
  - Left card "自愈建议": suggestion rows, status/evidence, links, row actions with confirmation.
  - Right card "恢复审计": toolbar with export/archive buttons, filter row, audit list.
- Full-width section "归档审批": metrics, recent archives, pending approval summaries.

Interaction notes:
- Manual task buttons refresh task overview, task runs, and security overview after success.
- Suggestion actions open a confirmation dialog named "确认处理自愈建议".
- Export downloads CSV. Archive creation refreshes archive summaries.
- Loading, empty, and error states appear within each card, not as whole page blockers.
