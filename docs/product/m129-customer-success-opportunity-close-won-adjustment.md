# M129 续约机会成交入账闭环

M129 在 M128 跟进行动闭环之后，把续约机会的商务结果接入已有计费中心。该模块不新增数据库表、不新增中间件、不执行远程数据库写入；复用 `billing_adjustment.source_type/source_id/metadata` 记录机会成交来源。

## 后端接口

```text
POST /api/v1/customer-success-opportunities/:id/close-won-adjustment
```

权限要求：

```text
customer:success_opportunity:manage
billing:adjustment:manage
```

处理逻辑：

1. 读取当前租户下的续约机会。
2. 已赢单机会或已有 `CUSTOMER_SUCCESS_OPPORTUNITY` 来源调账记录时拒绝重复入账。
3. 创建 `DEBIT` / `APPLIED` 计费调账记录，来源为当前续约机会。
4. 将机会阶段、状态更新为 `WON`，成交概率更新为 `100`，写入 `closed_at`。
5. 返回更新后的机会详情和调账摘要。

## 前端页面

续约机会详情页新增“成交入账闭环”卡片：

- 展示预计金额、加权金额、默认入账金额和入账状态。
- 未赢单时支持填写成交金额和入账说明。
- 点击“确认成交入账”前必须二次确认。
- 已赢单时只展示状态和“查看调账记录”入口。
- 成功后刷新机会详情、机会列表、机会分析和计费调账相关缓存。

## 页面边界

- 成交入账属于当前机会对象级操作，因此放在详情页。
- 列表页仍只做查询、筛选、概览和进入详情。
- 分析页仍只读展示漏斗、趋势和 Top 机会，不承载入账 mutation。
- 调账记录完整列表、审批和账单影响仍由计费中心负责。

## 前端参考设计

```text
images/frontend-reference-design/续约机会成交入账/
```

## 验证命令

```bash
pnpm --filter @aiaget/control-api exec tsx --test src/customer-success-opportunities/customer-success-opportunities.service.test.ts
pnpm --filter @aiaget/control-api typecheck
pnpm --filter @aiaget/web typecheck
pnpm --filter @aiaget/web test:ia
pnpm --filter @aiaget/control-api exec tsx --test src/common/controller-permissions-contract.test.ts
pnpm --filter @aiaget/control-api prisma:validate
```
