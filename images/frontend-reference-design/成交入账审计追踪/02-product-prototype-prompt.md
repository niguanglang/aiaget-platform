# Product Prototype / Wireframe Prompt

Create a low- to mid-fidelity product prototype / wireframe for the enterprise AI Agent Platform audit center.

Project context:
- Page/route: 审计中心 at /audit
- Users/roles: 审计员、租户管理员、财务负责人、客户成功负责人
- Main task flow: 用户从续约机会或调账记录带关键词进入 /audit，确认顶部审计概览，选择“计费”来源，搜索调账单号/机会名/客户名/链路 ID，查看统一审计事件列表，并点击查看详情。
- API/service contract: getAuditOverview、listAuditEvents，source_type 支持 login/operation/approval_audit/billing，status 支持 SUCCESS/DEGRADED/FAILED。
- Data entities and fields: 指标卡、排行卡、失败事件卡、事件列表列为时间、来源、状态、用户、模块、动作、链路 ID、摘要、操作。
- Actions and states: 刷新数据、窗口筛选、来源筛选、状态筛选、关键词搜索、清空、查看详情；包含 loading、empty、error 状态占位。

Prototype requirements:
- Show page regions clearly: header, metric cards, supporting cards, filter toolbar, audit event table.
- Mark the billing-specific additions: “计费事件” metric, “计费” source option, expanded search vocabulary.
- Keep list page responsibility strict: no full payload JSON, no approval detail, no billing adjustment detail embedded in the table.
- Show detail navigation as a row action only.
- Keep spacing and table density realistic for a backend console.

Avoid:
- placing full event details inside list rows
- inventing new billing forms or edit actions
- deep menu changes outside the audit page
