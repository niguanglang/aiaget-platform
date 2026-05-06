# Product UI Design Prompt

Create a high-fidelity SaaS operations console design for a Chinese AI agent platform monitor and runtime module. The design shows five connected route-level pages, not a marketing page.

Visual direction: quiet enterprise console, dense but readable information architecture, white or neutral background, restrained borders, compact cards with 8px radius or less, no decorative blobs, no oversized hero. Use a left navigation shell implied by the existing product, with the main content focused on operational scanning.

Pages to depict:

1. Monitor overview `/monitor`: top row with status badges, title, refresh button, quick entrance buttons for observability and runtime workflows, service health cards, metric cards, step summary, trends, rankings, and a wide event table. Event rows expose compact actions to open event details and trace timelines.
2. Event detail `/monitor/events/[eventId]`: status badges, title, trace link, occurrence metadata, error alert if present, and three JSON payload panels.
3. Trace timeline `/monitor/traces/[traceId]`: trace ID header, copy action, propagation quality metrics, latency/cost/token metrics, and vertical timeline of events.
4. Observability `/monitor/observability`: trace coverage score, linked/orphan/error/slow trace metrics, recent error traces, slow traces, and top error modules.
5. Runtime workflows `/runtime/workflows`: backend status, workflow mode, latest dispatch failure, recoverable task list, refresh and retry controls.

Use Chinese labels from the existing product: 监控中心, 统一事件流, 可观测性质量, Trace 链路, 工作流后端, 恢复重试. The interface should feel like a production admin tool for repeated triage.
