# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: 安全中心 at `/security`
- Users/roles: 租户管理员、安全管理员、审计员
- Main task flow: 查看审批与归档运营 -> 查看审批工作台导出指标 -> 发现导出风险告警 -> 查看安全事件或通知处理人
- API/service contract: security center overview, operation alert notify, operation alert actions
- Data entities and fields: export count, exported records, high-risk export count, repeated export count, operational alerts
- Actions and states: 查看安全事件、通知、确认、升级、关闭；加载、空、风险、已关闭

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Layout:
  - Existing approval operations summary remains at top.
  - Add a section named 审批工作台导出治理.
  - Four metric tiles: 导出次数、导出记录、高风险筛选、重复导出.
  - Inline warning text when any risk metric is nonzero.
  - Existing operational alert cards include export alert rows.
- Make component boundaries obvious so implementation can map to existing React components.

Avoid:
- Invented backend fields.
- New route or unrelated modules.
- Marketing hero layout.
