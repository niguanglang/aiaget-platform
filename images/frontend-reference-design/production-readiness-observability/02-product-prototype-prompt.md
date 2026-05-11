# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: 生产落地中心 at `/settings/production-readiness`
- Users/roles: release owner reviews checklist; observability owner provides trace evidence; tenant admin or `system:settings:manage` submits acceptance
- Main task flow: user opens production readiness center, jumps to "发布验收", reads "可观测性 Trace 质量证据", opens `/monitor/observability` for evidence, returns to fill acceptance note and submit
- API/service contract: `getProductionReadinessOverview()` returns checklist groups and items; `acceptProductionReadinessCheck(checkId, { note })` records manual acceptance; no monitor API fetch from this page
- Data entities and fields: category summaries, check item title/status/severity/owner/description/evidence/evidence_summary/observability_signal/acceptance/action link
- Actions and states: refresh, deep-link to monitor observability, type acceptance note, submit acceptance, disabled state without permission, loading skeleton, error empty state

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Show the existing page regions: header and metrics, left group navigation, right checklist group cards, individual check item card action column.
- Make component boundaries obvious for the new "可观测性证据" panel.
- In the new panel, show four fixed rows/chips mapped to `observability_signal`: Trace coverage, orphan event, error trace, slow trace.
- Keep the acceptance record block below evidence, and the action column to the right on desktop.
- Include mobile behavior as stacked checklist card sections where evidence chips wrap to one column.

Avoid:
- Inventing new filters, charts, collector controls, service provisioning flows, or monitor data mutations.
