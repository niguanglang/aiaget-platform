# Project UI Brief

## 页面目标

- 页面名称：M63-3 计费商业化中心
- 路由：`/billing`
- 目标：在现有 M47 成本与额度中心上扩展套餐目录、当前租户订阅、账单列表和额度策略管理，把模型成本、平台用量、API Key 额度与商业套餐联动起来。

## 目标用户与权限

- 租户管理员、平台运营、财务运营：查看成本、订阅、账单和额度策略。
- 查看权限：后端 `GET /billing/overview` 使用 `monitor:log:view`。
- 管理权限：后端 `PATCH /billing/subscription` 与 `PATCH /billing/quota-policies/:id` 使用 `system:settings:manage`。
- 前端当前没有精细按钮权限 hook，本页面通过接口错误和按钮禁用状态处理无权限/失败状态。

## 接口与服务

- `getBillingOverview({ window })` -> `GET /billing/overview?window=24h|7d`
- `updateBillingSubscription(input)` -> `PATCH /billing/subscription`
- `updateBillingQuotaPolicy(id, input)` -> `PATCH /billing/quota-policies/:id`

## 核心数据

- `BillingOverview.summary`：总成本、模型成本、运行步骤成本、词元数、月度预测、风险密钥数、订阅状态、套餐名、套餐层级、基础价格、包含额度、当前周期用量、超额成本、下期账单估算、活跃额度策略数、阻断策略数。
- `BillingPlanItem`：套餐编码、名称、层级、月付/年付价格、包含成本/词元/调用/存储、超额单价、功能限制、状态、排序。
- `BillingSubscriptionItem`：当前套餐、状态、计费周期、基础价格、包含额度、账期开始/结束、自动续费。
- `BillingInvoiceItem`：账单编号、状态、金额、已付金额、账期、到期/支付时间、账单明细。
- `BillingQuotaPolicyItem`：策略名称、主体、指标、周期、额度上限、当前用量、使用率、风险等级、阈值、动作、状态、最近评估时间。

## 页面动作

- 切换成本窗口：`24h` / `7d`。
- 刷新概览。
- 切换订阅套餐与计费周期。
- 打开额度策略编辑面板，编辑额度上限、预警阈值、硬限制阈值、动作、状态。

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
