# Product Prototype / Wireframe Prompt

Create a low/mid-fidelity product prototype wireframe for the enterprise AI Agent platform security center.

Screen: `/security`, section “审批与归档运营 / 运营告警闭环”.

Information architecture:
1. Notification task failure aggregation remains above the alert section.
2. Add a compact source-risk strip summarizing SLA failure source, self-healing failure source, and mixed source state.
3. Operational alert grid shows source-specific alert cards when source counts are greater than zero.
4. Alert card structure: severity badge, status badge, category badge, metric, title, short description, last lifecycle action, action link, ACK, ESCALATE, CLOSE, Notify.
5. Notification delivery audit row category badges identify source alerts as notification task risk.
6. Empty state remains unchanged when no alert exists.

Prototype annotations:
- Source alert ids: SLA source, self-healing source, mixed source.
- Source alerts join the existing auto-notify task scope.
- Existing generic notification task failure and consecutive failure alerts remain for global task health.

Use Chinese labels only. Keep layout compact, utilitarian, and suitable for repeated security operations work.
