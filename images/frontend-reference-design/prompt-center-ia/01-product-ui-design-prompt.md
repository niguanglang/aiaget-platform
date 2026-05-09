# Product UI Design Image Prompt
Create a high-fidelity product UI design image for an Enterprise Agent Platform Prompt Center.

Project context:
- Product/module: 企业 AI Agent 平台 / 提示词中心
- Page/route: prompt template management split across `/prompts`, `/prompts/create`, `/prompts/[id]`, `/prompts/[id]/edit`
- Target users/roles: 租户管理员、提示词管理员、Agent 管理员、只读审计用户
- Business goal: 管理提示词模板、变量、版本、渲染测试、真实模型测试记录和 Agent 引用，页面职责清晰
- Frontend stack/design system: Next.js App Router, React, TypeScript, Tailwind CSS, shadcn-style Button/Card/Input/EmptyState/MetricCard/StatusBadge
- Existing page shell/layout: console dashboard layout, max-width content, Chinese UI text, subtle border, soft shadow, restrained motion

Interface contract that must appear in the UI:
- API/service functions: listPromptTemplates, createPromptTemplate, getPromptTemplate, updatePromptTemplate, deletePromptTemplate, copyPromptTemplate, publishPromptTemplate, rollbackPromptTemplate, renderPromptTemplate, testPromptTemplate, variable CRUD, listUsers
- Route responsibility contract: `/prompts` is list-only and must not expose publish, rollback, render, or model test actions; `/prompts/[id]` owns version publish/rollback, prompt content editing, variables, render/test, references, and audit.
- Main entities and fields:
  - PromptTemplateListItem: name, code, type, status, version, description, content_preview, owner, variable_count, test_count, agent_reference_count, updated_at
  - PromptTemplateDetail: content, variables, versions, test_records, agent_references, audit_records
  - PromptVariableItem: name, variable_type, default_value, required, description, sort_order
  - PromptVersionItem: version, status, change_note, published_at, created_by
  - PromptTestRecordItem: status, model_provider_name, request_model, rendered_content, output_text, latency_ms, error_message, created_at
- Status values/enums: DRAFT/草稿, PUBLISHED/已发布, DISABLED/已停用, ARCHIVED/已归档; SYSTEM/系统, USER/用户, ASSISTANT/助手, TOOL/工具; SUCCESS/成功, FAILED/失败
- User actions:
  - List: search, filter by type/status/owner, create, view detail, edit, copy, delete
  - Detail: edit metadata, save content, manage variables, publish with note, rollback version, render, run test, view Agent references and audit
  - Form pages: save, cancel, validation
- Required states: loading, empty, error, disabled when no permission, delete confirmation, validation errors

Design requirements:
- Show the Prompt Center as a production SaaS/admin product, not a marketing page.
- The list page is a clean provider-like table with metrics above it; do not show full prompt detail or test panel in the list.
- The detail page uses dashboard/Bento sections: editor, variables table, version table, render/test panel, recent tests, references, audit activity.
- Use Chinese labels and realistic prompt template content.
- Include clear button placement: top-level create, row-level view/edit/copy/delete, detail-level publish/rollback/save/render/test.
- Visual style: minimal, technical, high-quality product feel; subtle border, soft shadow, backdrop-blur, restrained gradient mesh/noise.

Avoid:
- invented fields outside the listed contract
- full details inside the list page
- publish or rollback buttons inside the list page
- overly decorative gradients, emoji, cheap glow, oversized round cards, or overloaded tables
Paste the high-fidelity product UI prompt here.
