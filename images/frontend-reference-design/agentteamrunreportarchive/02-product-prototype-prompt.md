# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the existing `/agent-teams` page extension.

Project context:
- Page/route: 团队运行报告归档 at `/agent-teams`
- Users/roles: Agent 管理员、租户管理员、审计员、安全管理员
- Main task flow: 选择团队运行 -> 生成报告归档 -> 在归档列表下载 -> 如需删除先提交审批 -> 安全管理员审批通过后删除对象。
- API/service contract: POST run report archive, GET archive list, GET archive download URL, DELETE archive creates approval, GET archive approvals, approve/reject approval.
- Data entities and fields: archive id/key/file_name/size_bytes/last_modified/run_id/team_name/run_objective；approval id/archive_id/status/reason/requested_by/reviewed_by/requested_at/reviewed_at。
- Actions and states: creating, downloading, delete requested, approve/reject, empty archives, no permission, failure message.

Prototype requirements:
- Low- to mid-fidelity wireframe.
- Keep current run workspace and add an archive panel below report export.
- Show archive list rows with file metadata and actions.
- Show delete approval queue rows with approve/reject buttons.
- Include empty state and permission-disabled state.
- Use Chinese labels.

Avoid:
- new route or global document management page
- unsupported PDF preview/editor
- decorative or marketing layout
