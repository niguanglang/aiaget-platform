# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the real frontend page below.

Project context:
- Page/route: M46 可观测性增强 at `/monitor`.
- Users/roles: 租户管理员、运营、安全管理员、审计员；读取权限 `monitor:log:view`。
- Main task flow: 进入监控中心 -> 查看观测质量概览 -> 从统一事件流选择事件 -> 自动加载 Trace 详情 -> 阅读时间线、传播质量、错误链路 -> 定位慢 Trace 或错误模块。
- API/service contract:
  - overview: health, summary, latency trend, rankings, run step summary.
  - events: unified event list.
  - event detail: request/response/step payload.
  - trace detail: timeline, propagation, metrics, errors.
  - observability overview: trace coverage, orphan events, slow/error traces.
- Data entities and fields:
  - Trace detail: trace_id, root_event, events, timeline, metrics, propagation, errors.
  - Observability overview: trace_coverage, linked_trace_count, orphan_event_count, error_trace_count, slow_trace_count, top_error_modules, slow_traces, recent_error_traces.
- Actions and states: refresh, filter, select event, copy trace id, loading, empty, error, partial data.

Prototype requirements:
- Use low- to mid-fidelity admin wireframe style.
- Show page regions:
  1. Header: M46 badges, title “监控中心”, refresh action.
  2. Observability quality KPI row.
  3. Existing health and metric cards.
  4. Trace analysis split panel: event stream on the left, trace timeline and propagation panel on the right.
  5. Bottom cards: 错误模块、慢 Trace、最近错误 Trace.
  6. Event detail JSON panel remains available.
- Make component boundaries obvious for implementation using Card/Button/StatusBadge/MetricCard/EmptyState.
- Include placeholders for loading, empty trace, error state and no trace selected.

Avoid:
- decorative-only UI
- invented fields outside the contract
- unrealistic external tool integrations
