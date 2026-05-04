# Product Prototype / Wireframe Prompt

Create a mid-fidelity product prototype / wireframe image for the enterprise AI Agent platform settings page.

Project context:
- Page/route: 设置中心 `/settings`，现有 `SettingsContent`。
- Users/roles: 租户管理员、监控运营、安全管理员；编辑需要 `system:settings:manage`。
- Main task flow: 用户进入设置中心 -> 选择“通知策略”分类 -> 修改自动重试开关和数字策略 -> 保存 -> M72 自动重试任务按租户设置执行。
- API/service contract: `listSystemSettings({ category: 'NOTIFICATION' })`, `updateSystemSetting`, `resetSystemSetting`.
- Data entities and fields: SystemSettingItem, category summary, setting status.
- Actions and states: 分类筛选、保存、恢复默认、只读、校验错误、保存成功。

Prototype requirements:
- Show the existing three-column settings layout.
- Left category list includes “通知策略”.
- Center list shows notification policy setting cards.
- Right governance panel explains impact on `/monitor` alert notification auto retry task.
- Each setting row has value input, status select, save button and reset button.

Avoid:
- new pages or modals beyond existing reset confirm
- advanced scheduler policy editor
- invented table structures
