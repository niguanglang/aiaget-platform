# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for an enterprise SaaS admin console panel.

Project context:
- Page/route: M63-16 渠道自动推进执行器 at `/channels`
- Users/roles: 租户管理员、渠道管理员、发布负责人、审计员
- Main task flow: view executor status -> edit policy -> save -> run once -> inspect last run -> audit recent events
- API/service contract: GET/PUT/POST `/channels/:channelId/release-automation`
- Data entities and fields: automation policy, gate evaluation, current release batch, last run result, today count, next allowed time, platform events
- Actions and states: refresh, save policy, run once, loading, empty, error, disabled due to permissions, disabled due to interval limit

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Show a top header with milestone badge M63-16 and status badges.
- Show four metric cards row.
- Show two-column main area: left policy form with toggles and number fields, right execution status/detail with last run.
- Show a bottom event list region with empty state.
- Label all controls in Chinese.
- Make component boundaries obvious so a frontend engineer can map each region to existing React components.

Avoid:
- polished decorative rendering
- fields not backed by the shared types
- unrealistic navigation or actions
