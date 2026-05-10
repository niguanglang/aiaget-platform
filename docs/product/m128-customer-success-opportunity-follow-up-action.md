# M128 续约机会跟进行动闭环

M128 在 M127 续约机会分析之后，把分析发现的高价值、风险中、近期关闭机会接入执行闭环。该模块不新增数据库表，不新增中间件，不执行远程数据库写入；复用已有 `customer_success_action` 表承载后续跟进。

## 后端能力

新增接口：

```text
POST /customer-success-opportunities/:id/follow-up-actions
```

行为：

1. 读取当前租户下的续约机会。
2. 基于机会名称、阶段、风险摘要、下一步动作、负责人、来源复盘、成果资产、落地方案自动生成客户成功行动。
3. 创建成功行动后，将该行动回写绑定到续约机会的 `customer_success_action_id`。
4. 返回 `CustomerSuccessOpportunityFollowUpActionResult`：

```ts
{
  action: CustomerSuccessActionDetail;
  opportunity: CustomerSuccessOpportunityDetail;
}
```

权限：

```text
customer:success_opportunity:manage
customer:success_action:manage
```

## 前端能力

续约机会详情页新增“跟进行动闭环”卡片：

- 未绑定成功行动时，支持输入可选行动名称和截止时间。
- 点击“生成跟进行动”前必须二次确认。
- 生成中按钮禁用。
- 成功后刷新机会详情、机会列表和成功行动列表缓存。
- 已绑定成功行动时，展示行动名称、状态、风险、评分和“查看行动”入口，不允许重复生成。

## 页面职责

- 列表页仍只负责查询、筛选、概览和进入详情。
- 分析页仍只负责只读看板。
- 生成跟进行动属于当前机会对象级操作，因此放在详情页。
- 不在机会详情页嵌入完整成功行动编辑表单。

## 前端参考设计

```text
images/frontend-reference-design/续约机会跟进行动/
```

## 验证命令

```bash
pnpm --filter @aiaget/shared-types build
pnpm --filter @aiaget/control-api exec tsx --test src/customer-success-opportunities/customer-success-opportunities.service.test.ts
pnpm --filter @aiaget/control-api typecheck
pnpm --filter @aiaget/web typecheck
pnpm --filter @aiaget/web test:ia
pnpm --filter @aiaget/control-api exec tsx --test src/common/controller-permissions-contract.test.ts
git diff --check
```
