# Project UI Brief

## 页面目标

- 页面名称：M63-3 计费商业化中心
- 路由：`/billing`
- 目标：在现有 M47 成本与额度中心上扩展套餐目录、当前租户订阅、账单列表、额度策略管理和调账中心，把模型成本、平台用量、API Key 额度、财务调整与商业套餐联动起来。

## 目标用户与权限

- 租户管理员、平台运营、财务运营：查看成本、订阅、账单、额度策略和调账记录。
- 查看权限：后端 `GET /billing/overview` 使用 `billing:center:view`。
- 管理权限：后端 `PATCH /billing/subscription` 与 `PATCH /billing/quota-policies/:id` 使用 `system:settings:manage`。
- 调账权限：后端 `POST /billing/adjustments` 使用 `billing:adjustment:manage`。
- 前端通过 `hasPermission` 控制调账按钮显示和禁用状态，后端继续做最终权限校验。

## 接口与服务

- `getBillingOverview({ window })` -> `GET /billing/overview?window=24h|7d`
- `updateBillingSubscription(input)` -> `PATCH /billing/subscription`
- `updateBillingQuotaPolicy(id, input)` -> `PATCH /billing/quota-policies/:id`
- `createBillingAdjustment(input)` -> `POST /billing/adjustments`

## 核心数据

- `BillingOverview.summary`：总成本、模型成本、运行步骤成本、词元数、月度预测、风险密钥数、订阅状态、套餐名、套餐层级、基础价格、包含额度、当前周期用量、超额成本、调账影响、下期账单估算、活跃额度策略数、阻断策略数。
- `BillingPlanItem`：套餐编码、名称、层级、月付/年付价格、包含成本/词元/调用/存储、超额单价、功能限制、状态、排序。
- `BillingSubscriptionItem`：当前套餐、状态、计费周期、基础价格、包含额度、账期开始/结束、自动续费。
- `BillingInvoiceItem`：账单编号、状态、金额、已付金额、账期、到期/支付时间、账单明细。
- `BillingQuotaPolicyItem`：策略名称、主体、指标、周期、额度上限、当前用量、使用率、风险等级、阈值、动作、状态、最近评估时间。
- `BillingAdjustmentItem`：调账单编号、关联账单、类型、状态、金额、签名金额、原因、说明、生效/审批时间、来源、创建/更新时间。

## 页面动作

- 切换成本窗口：`24h` / `7d`。
- 刷新概览。
- 切换订阅套餐与计费周期。
- 打开额度策略编辑面板，编辑额度上限、预警阈值、硬限制阈值、动作、状态。
- 创建调账单，登记减免、补收、退款、折扣和纠错，并刷新下期账单估算。

## 组件系统

- Next.js App Router：`apps/web/src/app/(console)/billing/page.tsx`
- 页面组件：`apps/web/src/components/billing/billing-content.tsx`
- UI 组件：`Button`、`Card`、`EmptyState`、`MetricCard`、`StatusBadge`、`Input`
- 数据状态：TanStack Query `useQuery` / `useMutation`
- 动效：`motion/react`
- 图标：`lucide-react`
- 现有格式化工具：`formatMoney`、`formatPercent`、`formatDateTime`、`formatLatency`

## 视觉约束

- 企业级 SaaS 后台，白底、细边框、轻阴影、backdrop-blur。
- Dashboard/Bento 布局，清晰层级，不做营销页。
- 页面文字使用中文。
- 动效克制，hover 和入口动画即可。
- 禁止 Emoji、廉价发光、过度渐变、大圆堆叠、信息过满。
