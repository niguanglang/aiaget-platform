# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: 资源授权 at `/resource-acls`.
- Users/roles: 租户管理员、安全管理员、Agent 管理员、知识库管理员、工具管理员、审计员。
- Main task flow: 选择资源类型和具体资源，选择主体类型和具体主体，选择权限编码，保存允许/拒绝 ACL 规则，然后使用模拟检查确认授权结果。
- API/service contract:
  - `GET /resource-acls/overview`
  - `GET /resource-acls/options`
  - `GET /resource-acls`
  - `POST /resource-acls`
  - `PATCH /resource-acls/:id`
  - `DELETE /resource-acls/:id`
  - `POST /resource-acls/check`
- Data entities and fields:
  - Rule list: resource, subject, permission code, effect, status, condition count, updated time, actions.
  - Editor: resource type, resource id, subject type, subject id, permission code, effect, status, conditions JSON.
  - Check result: decision, matched ACL, checked count, reason.
- Actions and states:
  - 新建授权、保存授权、删除、重置、模拟检查、清空筛选。
  - Include placeholders for loading, empty, validation error, API error and no write permission.

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Focus on information architecture and interaction flow rather than decorative polish.
- Show component boundaries clearly:
  - page header,
  - metric strip,
  - filters,
  - resource/subject selector,
  - ACL rules table,
  - editor card,
  - simulation result card.
- Keep layout realistic for the current console shell and responsive behavior:
  - desktop: three-column dashboard,
  - tablet/mobile: stacked sections.
- All section labels and button labels should be Chinese.

Avoid:
- invented backend fields
- unrelated navigation or modules
- purely decorative layout without a usable authorization workflow
