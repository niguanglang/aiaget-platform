# M47 成本与额度中心

## 目标

M47 为 `/billing` 提供租户级成本与额度观测，聚合模型调用成本、会话步骤成本和接口密钥额度风险。

## 已实现

- 新增控制台页面：
  - `/billing`
- 新增控制服务接口：
  - `GET /api/v1/billing/overview?window=24h|7d`
- 新增成本与额度聚合数据：
  - `BillingOverview`
  - `BillingSummary`
  - `BillingCostTrendPoint`
  - `BillingProviderCostItem`
  - `BillingModelCostItem`
  - `BillingApiKeyQuotaItem`
  - `BillingConversationCostItem`
- 新增前端展示区块：
  - 成本总览
  - 成本趋势
  - 额度风险
  - 供应商成本
  - 模型成本排行
  - 接口密钥额度
  - 会话步骤成本
- 新增控制台菜单入口：
  - 成本与额度
- 新增模块规格：
  - 成本额度

## 数据来源

本版本仅复用现有租户隔离数据，不新增数据库表：

```text
model_call_log
api_key
conversation_run.steps
model_provider
model_config
```

## 额度风险规则

- `usage_rate === null`：未设额度
- `usage_rate >= 90`：高危
- `usage_rate >= 70`：预警
- 其他：正常

## 当前边界

- M47 只做只读成本与额度观测，不做额度写入或扣减。
- 暂不引入新的计费表、账单表或配额策略表。
- 暂不启用额外中间件或容器。

## UI 参考

Reference-first 前端素材位于：

```text
images/frontend-reference-design/m47-成本与额度中心/
```

## 验证

- `pnpm --filter @aiaget/shared-types typecheck`
- `pnpm --filter @aiaget/control-api typecheck`
- `pnpm --filter @aiaget/web typecheck`
