Create a product prototype / wireframe image for the approval audit IA split.

Project context:
- Page/route set: `/approval-audits`, `/approval-audits/events/[eventId]`, `/approval-audits/archives`, `/approval-audits/archives/create`
- Users/roles: 安全管理员、审计员、租户管理员、平台运营人员
- Main task flow: 用户在审批审计列表筛选事件 -> 点击查看详情 -> 从详情跳转审批或 Trace；用户进入归档中心 -> 下载归档或申请删除；用户进入归档生成页 -> 设置筛选条件 -> 导出 CSV 或生成归档。
- API/service contract: list/overview APIs on the list page; detail API on the event detail page; archive list/download/delete APIs on the archive page; archive create and CSV export APIs on the create page.
- Data entities and fields: event identity, source/type/status, actor, request/trace IDs, occurred time, note, metadata; archive name, folder, size, object key, last modified.

Prototype requirements:
- Use low- to mid-fidelity wireframe style focused on information architecture.
- Show four page frames: event list, event detail, archive management, archive generation.
- Mark component boundaries: header actions, metric cards, filters, table, route entry cards, detail sections, JSON preview, archive table, confirmation feedback.
- Use clear Chinese section labels and realistic table columns.
- Include empty/error/loading placeholders and mutation success/error areas.
- Make it obvious that list, detail, archive management, and archive generation are separate routes.

Avoid:
- polished decoration that obscures layout
- putting complete event detail or archive workflows inside the event list
- fields or actions outside the documented API contract
