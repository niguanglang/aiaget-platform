# Product UI Design Image Prompt

Create a high-fidelity product UI design image for an enterprise SaaS observability page.

Project context:
- Product/module: Enterprise Agent Platform, M09 Monitor Center
- Page/route: Monitor Center at `/monitor`
- Target users/roles: tenant operators and admins with `monitor.read`
- Business goal: inspect platform health, unified trace/event records, cost and latency metrics, model/tool/RAG activity, and recent errors
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn-style components, TanStack Query, Motion
- Existing page shell/layout: protected console with left navigation and topbar; use dashboard/Bento layout with thin borders, subtle shadow, glass/backdrop blur, clean responsive density

Interface contract that must appear in the UI:
- APIs: monitor overview, monitor event list, monitor event detail
- Data sources: operation logs, model call logs, tool call logs, recall logs, conversation runs, control health, runtime health
- Main fields: event ID, trace ID, module, status, title, summary, latency, token total, cost total, occurred time
- Overview metrics: events total, success rate, average latency, P95 latency, total cost, active conversations, service health
- Rankings: agent activity, model usage, tool usage, knowledge recall activity, module error counts
- Required states: loading, empty, error, service unavailable, detail fetch failure, no events in selected window

Design requirements:
- Make it look like a real production observability console, not a BI dashboard template.
- First viewport should show service health, headline metrics, event filters, and a dense event table.
- Use compact operational density with thin borders, subtle shadows, quiet blur, and precise alignment.
- Add supporting panels for rankings and selected-event detail with JSON summaries, but keep the page easy to scan.
- Use a restrained chart language: small trend bars, stacked status counts, or sparkline rows that map to real aggregates.
- Add subtle atmosphere only: faint grid/noise texture and low-opacity signal lines behind content.
- Use realistic Chinese labels, timestamps, and error summaries.
- Overall style: minimal, technical, premium product UI built for repeated operational use.

Avoid: marketing hero sections, fake data visuals, decorative neon, oversized charts, purple dashboards, or unreadable dense tables.
