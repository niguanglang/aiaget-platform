Use case: productivity-visual
Asset type: console dashboard wireframe
Primary request: Create a low- to mid-fidelity wireframe for the shared event and usage base page at /monitor, focused on how one shared backend powers monitor, audit, billing, and security views.
Scene/backdrop: wireframe admin page with clear regions and exact section labels
Subject: page shell, query toolbar, event table, event detail drawer/panel, relation timeline, linked usage ledger, usage rollup summary, source module links
Style/medium: mid-fidelity grayscale wireframe with light accent color for active states only
Composition/framing: desktop-first dashboard with a top summary row, a filter toolbar, a left event list, a right detail panel, and lower sections for linked usage, relations and rollups
Lighting/mood: neutral, practical, implementation-focused
Color palette: grayscale with minimal blue highlights
Materials/textures: thin borders, outlined cards, table rows, filter chips, empty-state placeholders
Text (verbatim): "平台事件", "用量事件", "事件关系", "用量汇总", "Trace ID", "Request ID", "查看详情"
Constraints: all text in Chinese; show loading, empty, error, and permission-denied placeholders; make component boundaries obvious for frontend mapping; event detail must include payload JSON, relations and usage events; keep it realistic for a Next.js admin console
Avoid: decorative rendering, gradient-heavy visuals, fake KPIs not supported by contract, and random iconography
