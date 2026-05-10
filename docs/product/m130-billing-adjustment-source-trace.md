# M130 调账来源追踪与续约机会回链

## 目标

M129 已经支持在续约机会详情页执行“成交入账闭环”，并生成来源为 `CUSTOMER_SUCCESS_OPPORTUNITY` 的 `billing_adjustment` 记录。M130 补齐账单侧追踪能力，让财务运营在调账记录页可以看到调账来源，并一键回到续约机会详情页复核来源业务对象。

## 范围

- `BillingAdjustmentItem` 增加只读展示字段：
  - `source_label`：来源中文标签，例如 `续约机会：华中设计院二期续约扩展机会`
  - `source_href`：来源详情路由，例如 `/customer-success-opportunities/opportunity-1`
- `BillingService.getOverview` 和账单详情中的调账记录会批量解析 `CUSTOMER_SUCCESS_OPPORTUNITY` 来源。
- `/billing/adjustments` 调账列表新增“来源”列，列表只展示来源摘要和跳转入口。

## 页面边界

- 调账列表仍只负责查询、概览、审批和进入关联对象。
- 续约机会的详情、成交入账、跟进行动和编辑仍归属 `/customer-success-opportunities/:id`。
- 账单页不引入 `closeWonCustomerSuccessOpportunity` 等客户成功机会写操作。

## 验收点

- 来源为续约机会的调账返回 `source_label/source_href`。
- 手工调账显示 `手工调账`，不产生跳转。
- 调账列表的来源列可回链到续约机会详情。
- 高影响调账动作仍需要确认弹窗。
