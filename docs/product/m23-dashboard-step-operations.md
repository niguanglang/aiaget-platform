# M23 Dashboard Step Operations

## Scope

M23 brings M22 run-step observability into the `/dashboard` home view. Operators can now see step health, latency, token usage, and cost without opening the monitor center first.

Reused contracts:

```text
GET /api/v1/monitor/overview
GET /api/v1/audit/overview
GET /api/v1/monitor/events
```

## Behavior

1. Dashboard consumes `run_step_summary` and `run_step_breakdown` from monitor overview.
2. A new "运行步骤态势" card shows step totals, failed steps, average step latency, tokens, and cost.
3. Step type rows show counts, failures, average latency, P95 latency, token usage, and cost.
4. Step rows link to `/monitor?source_type=conversation_step&step_type=<type>`.
5. Monitor center initializes filters from query params so dashboard drilldown opens the matching event stream.
6. Dashboard copy remains Chinese and removes nonessential emoji from the header.

## Architecture Notes

M23 does not add a backend module, database table, or migration. It composes existing monitor and audit overview APIs and reuses the M22 `conversation_step` event filters for drilldown.
