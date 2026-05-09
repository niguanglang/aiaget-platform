# Product UI Design Image Prompt

Paste the high-fidelity product UI prompt here.
# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise SaaS admin page.

Project context:
- Product/module: 企业 AIAgent 平台 / M120 岗位场景编排中心
- Page/route: 岗位场景编排中心 at `/role-scenarios`
- Target users/roles: 租户管理员、Agent 管理员、业务运营负责人、交付负责人
- Business goal: 把岗位目标、业务流程、Agent、Skill、知识库、工具、提示词和验收标准组合成可复用、可交付、可验收的 AI 落地场景包
- Frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn-style components, lucide icons, motion microinteractions
- Layout: console page shell, max width admin content, responsive bento metric cards, filter toolbar, compact table, row actions, no marketing hero

Interface contract that must appear:
- API services: `listRoleScenarios`, `createRoleScenario`, `getRoleScenario`, `updateRoleScenario`, `deleteRoleScenario`
- Selection APIs in create/edit: `listUsers`, `listAgents`, `listSkills`, `listKnowledgeBases`, `listTools`, `listPromptTemplates`
- List fields: 场景包名称、编码、岗位、部门、类型、状态、优先级、价值评分、业务痛点预览、流程预览、负责人、关联资产、更新时间、操作
- Detail fields: 业务痛点、业务目标、流程编排、预期成果、样板成果、验收标准、ROI 指标、关联 Agent/Skill/知识库/工具/提示词、备注
- Enums: 类型 `SALES/SERVICE/OPERATIONS/DESIGN/TRAINING/MANAGEMENT/CUSTOM`，状态 `DRAFT/READY/PILOTING/ACTIVE/ARCHIVED`，优先级 `LOW/MEDIUM/HIGH`
- Actions: 新建场景包、搜索、筛选类型/状态/优先级/负责人、查看详情、编辑、归档、清空筛选、分页
- States: loading, empty, error, disabled permission state

Design requirements:
- Make the interface look like a production enterprise product, not a template.
- The list page must stay compact and only show overview fields. Do not show full acceptance criteria or full sample deliverables in the table.
- Use metric cards for 场景包总数、高价值场景、试点中、资产齐套.
- Use subtle border, soft shadow, backdrop blur and restrained gradient mesh background.
- Use Chinese text throughout.
- Show linked assets as compact badges or chips: Agent, Skill, 知识库, 工具, 提示词.
- Primary workflow should be obvious: filter scenario packages -> inspect compact rows -> open detail -> edit structured form.

Avoid:
- fake fields not listed above
- random charts that do not map to API data
- excessive gradient/glow, emoji, over-rounded blobs, crowded tables
- putting complete detail or edit form into the list page
