# M12 Dashboard Operations

## Scope

M12 upgrades the original mock dashboard into a real operational overview using existing monitor and audit aggregates.

Reused contracts:

```text
GET /api/v1/monitor/overview
GET /api/v1/audit/overview
GET /api/v1/health
GET /api/v1/runtime/health
```

## Page Design

The `/dashboard` page now supports:

1. Control service and runtime health cards.
2. Headline metrics for total events, success rate, active conversations, cost, security events, and config changes.
3. Real latency trend bars based on monitor aggregates.
4. Recent incident panel merged from audit failures and monitor errors.
5. Ranking panels for agents, models, tools, and knowledge recalls.

## Architecture Notes

M12 does not add a new backend module. It composes the existing monitor and audit APIs and replaces the old mock dashboard visuals with real aggregated operational data. This keeps the dashboard thin while preserving a clear separation between overview, observability, and audit concerns.
