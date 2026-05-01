# Product Prototype / Wireframe Prompt

Create a low- to mid-fidelity product prototype / wireframe for the AIAget 数据权限中心 page at `/data-scopes`.

Project context:
- Users/roles: 租户管理员、安全管理员、系统管理员
- Main task flow: 选择角色 -> 选择资源类型 -> 配置数据范围 -> 预览命中部门与用户 -> 保存角色数据权限
- API/service contract:
  - `GET /data-scopes/overview`
  - `GET /roles`
  - `GET /data-scopes/roles/:roleId`
  - `PUT /data-scopes/roles/:roleId`
  - `POST /data-scopes/preview`
  - `GET /departments/tree`
  - `GET /users`
- Data entities and fields:
  - role: `name/code/status/is_system/user_count/permission_count`
  - scope: `resource_type/scope_type/scope_value/status/department_count/user_count/resource_count/updated_at`
  - custom value: `department_ids/user_ids/resource_ids/include_children`
- Actions and states:
  - role search/filter/select
  - scope row select
  - scope type segmented control
  - custom departments/users/resource ids select
  - preview, save, reset
  - loading, empty, error, disabled, validation, success

Prototype requirements:
- Show a clear page header with M35 badge and explanation.
- Show four metric cards: 已配置角色、数据范围、全局范围、自定义范围.
- Main body should have three regions:
  1. 左侧「角色目录」：搜索框、状态筛选、角色列表。
  2. 中间「资源范围矩阵」：七个资源类型行，每行显示范围类型、部门数、用户数、更新时间。
  3. 右侧「范围配置与预览」：范围类型控件、自定义选择区、预览结果、保存按钮。
- Include permission disabled placeholder: 保存按钮不可用时显示“缺少 system:data_scope:manage 权限”.
- Include empty state: 未选择角色时提示从左侧选择角色.
- Include error banner area above main body.
- Component boundaries must be obvious and map cleanly to cards, table rows, filters, and form controls.

Avoid:
- unrelated modules
- fake charts
- English labels
- unrealistic menu structures
