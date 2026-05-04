# Product Prototype / Wireframe Prompt

Create a low/mid-fidelity product prototype wireframe for the enterprise AI Agent platform security center.

Screen: `/security`, section “审批与归档运营 / 通知任务中心”.

Information architecture:
1. Existing notification task recovery suggestion card area.
2. Each suggestion item contains risk badge, reason badge, new failure source badge, lifecycle status, title, description, evidence, two source counters, troubleshooting links, and ACK/IGNORE/RESOLVE buttons.
3. Existing recovery audit search card below task history.
4. Metrics row: total records, acknowledged, ignored, resolved, SLA source, self-healing source, latest action.
5. Filter row: action select, status select, reason select, failure source select, keyword input, reset button.
6. Table columns: suggestion, reason/risk/source, action/status, note, request/trace, handled time, operation links.
7. Empty and loading states should remain visible in the wireframe.

Prototype annotations:
- Failure source values: SLA 死信归档, 自愈归档删除, 混合来源, 未知来源.
- Legacy audit events without source fields use 未知来源.
- Export and archive actions reuse current filter state including failure source.

Use Chinese labels only. Keep layout compact, utilitarian, and suitable for repeated security operations work.
