Create a product prototype / wireframe image for the dashboard IA.

Project context:
- Page/route: `/dashboard`
- Users/roles: 租户运营人员、管理员、平台值班人员
- Main task flow: scan key metrics -> inspect service health/trend -> check run-step summary -> open focused monitor/audit/agent pages when detail work is needed.
- API/service contract: `getMonitorOverview`, `getAuditOverview` only.
- Data regions: metric tiles, health table/gauge, trend chart, run-step rows, agent ranking, error distribution, recent alerts.

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Clearly mark DashboardContent as a page shell, and separate component regions for metric tiles, health, trend, run steps, rankings, errors, alerts.
- Show action placement: refresh in header, window switch in trend card, detail links in card headers/rows.
- Include loading/empty/error placeholders.
- Make it obvious that detailed log review happens through links, not embedded detail panels.

Avoid:
- management forms or destructive actions
- unrelated business modules
- overly decorative visual treatment
