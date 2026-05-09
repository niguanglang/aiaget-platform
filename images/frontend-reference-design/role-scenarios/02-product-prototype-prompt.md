# Product Prototype / Wireframe Prompt

Paste the low/mid-fidelity prototype prompt here.
# Product Prototype / Wireframe Image Prompt

Create a mid-fidelity product prototype / wireframe for the enterprise SaaS admin page `/role-scenarios`.

Project context:
- Page: 岗位场景编排中心
- Users: 租户管理员、Agent 管理员、业务运营负责人、交付负责人
- Main task flow: 进入列表 -> 搜索和筛选场景包 -> 查看核心摘要和资产齐套情况 -> 打开详情查看完整流程、样板成果、验收标准和 ROI -> 进入新建/编辑页维护多段表单和关联资产
- API contract: `listRoleScenarios`, `createRoleScenario`, `getRoleScenario`, `updateRoleScenario`, `deleteRoleScenario`
- Form asset selectors: `listUsers`, `listAgents`, `listSkills`, `listKnowledgeBases`, `listTools`, `listPromptTemplates`

Wireframe regions:
- Header: 中文标题“岗位场景编排”，说明这是 AI 落地场景包中心，右侧“新建场景包”按钮
- Metric grid: 场景包、价值评分高于 80、试点中、资产齐套
- Filter toolbar: keyword input, type select, status select, priority select, owner select, clear button
- Table: 场景包、岗位/部门、类型/状态/优先级、价值评分、痛点预览、流程预览、关联资产、负责人、更新时间、操作
- Detail page: top action bar, tabs/sections for 基础信息、流程编排、样板成果、验收标准、ROI、关联资产、备注
- Create/edit page: independent multi-section form with 基础信息、落地内容、关联资产、补充信息 sections
- Feedback placeholders: loading row, empty state, error message, permission-disabled create/edit/archive buttons

Prototype requirements:
- Focus on information architecture and page boundaries.
- Make component boundaries obvious for frontend implementation.
- Keep list page compact; details belong to detail route.
- Use Chinese labels and realistic enterprise data.
- Show row actions as 查看、编辑、归档, with lower-frequency destructive action visually secondary.

Avoid:
- decorative polished rendering
- invented backend fields
- combining list, detail and edit form on one screen
