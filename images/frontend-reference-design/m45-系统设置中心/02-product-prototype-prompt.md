# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the real frontend page below.

Project context:
- Page/route: M45 系统设置中心 at `/settings`.
- Users/roles: 租户管理员可修改；普通只读用户只能查看并看到禁用的保存按钮。
- Main task flow: 进入设置中心 -> 查看参数概览 -> 按分类筛选 -> 修改单个系统参数 -> 保存或恢复默认 -> 看到成功/错误/校验反馈。
- API/service contract:
  - overview endpoint returns total/active/secret/changed/category_count/last_updated.
  - list endpoint returns settings grouped by category and status.
  - patch endpoint updates value and status.
  - reset endpoint restores default value.
- Data entities and fields:
  - `SystemSettingItem`: name, key, description, category, value, default_value, value_type, options, is_secret, is_system, status, sort_order, updated_at, updated_by.
- Actions and states: filter category/status, edit value, save, reset, disabled by permission, loading skeleton, empty state, error banner, validation message.

Prototype requirements:
- Use low- to mid-fidelity admin wireframe style with clear boxes and Chinese labels.
- Show page regions:
  1. Header with title, badges, subtitle, primary “保存全部变更” placeholder disabled when no changes.
  2. KPI row: 参数总数、启用参数、敏感参数、已偏离默认。
  3. Category rail or segmented controls: 全部、基础、安全、运行时、观测、数据保留、外部集成.
  4. Main settings grid: each card has title, key, status, description, type-specific field, “保存” and “恢复默认”.
  5. Right governance panel: 权限状态、最近更新、配置风险提示.
  6. Existing lower page areas remain available: 租户资料、接口密钥、角色目录、用户管理.
- Make component boundaries obvious for implementation with existing Card/Button/StatusBadge/MetricCard/EmptyState.
- Include loading, error, empty, validation and read-only placeholders.

Avoid:
- polished decoration that hides structure
- invented backend fields or unrelated navigation
- unrealistic drag/drop or chart-heavy interactions
