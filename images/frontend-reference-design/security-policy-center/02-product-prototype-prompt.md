# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: 安全策略中心 at `/security`
- Users/roles: 租户管理员、安全管理员、审计员
- Main task flow: 用户进入安全策略中心 -> 查看策略总览 -> 筛选策略 -> 新建或编辑 ABAC 条件 -> 启停策略 -> 在模拟器中输入 subject/resource/action/context -> 查看决策结果 -> 在评估日志中追踪 request_id。
- API/service contract:
  - overview, list policies, create/update/delete, enable/disable, simulate, list evaluations
- Data entities and fields:
  - policy: name, code, effect, resource_type, action, priority, status, conditions, description, timestamps
  - simulation: subject, resource, action, context
  - evaluation: decision, matched_policy_id, reason, request_id, created_at
- Actions and states:
  - search/filter, create, edit, enable, disable, delete, simulate, empty/error/loading/validation/permission-denied

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Divide the page into clear regions:
  - header with title and primary action
  - four metric cards
  - policy table with filters and row actions
  - right simulation panel with input fields and result area
  - evaluation log table
  - create/edit modal form
- Label each component boundary and data source.
- Show validation placeholders for policy code, priority, condition JSON, simulation subject/resource/action.
- Include empty state and permission-denied placeholders.
- Make responsive behavior obvious: desktop two-column layout, mobile stacked sections.

Avoid:
- polished decorative rendering, invented backend fields, unrealistic navigation, and unrelated security module names.
