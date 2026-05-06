# Product Prototype Prompt

Create a mid-fidelity wireframe for the monitor/runtime IA refactor of a Chinese SaaS console. Focus on route separation and navigation flow instead of visual decoration.

Show a flow map and representative page wireframes:

- `/monitor` overview/list page: header, filter bar, metric strip, health cards, event table, quick links. No inline detail drawer.
- `/monitor/events/[eventId]`: detail route, loaded by clicking event row. Contains event facts and payload sections.
- `/monitor/traces/[traceId]`: trace route, loaded from trace links or legacy `/monitor?trace_id=` handoff. Contains timeline and propagation facts.
- `/monitor/observability`: observability route, loaded from quick link. Contains coverage, slow/error trace lists, top error modules.
- `/runtime/workflows`: runtime route, loaded from quick link. Contains backend status, recoverable tasks, retry action.

Annotate API ownership on each wireframe: overview uses `getMonitorOverview` and `listMonitorEvents`; event detail uses `getMonitorEvent`; trace uses `getMonitorTrace`; observability uses `getMonitorObservabilityOverview`; runtime workflows uses `/runtime/workflows/status` and `/runtime/workflows/retry`.

Include legacy compatibility note: `/monitor?trace_id=xxx` displays a concise handoff card to `/monitor/traces/xxx` while preserving the overview page.
