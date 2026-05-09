# M126 客户成功续约机会中心

M126 在 M124 客户成功计划中心和 M125 客户成功行动中心之后，补齐“客户成功动作转商务机会”的闭环。续约机会用于跟踪续约、扩展、增购、交叉销售和风险挽留机会，记录阶段、金额、概率、商务策略、决策路径、风险摘要和下一步动作。

## 后端能力

1. 新增 `customer_success_opportunity` 表，包含完整中文表注释和字段注释。
2. 新增 `CustomerSuccessOpportunitiesModule`，提供列表、详情、新建、编辑、归档接口。
3. 接入 `DataScopeGuard`、`ResourceAclGuard`、`SecurityPolicyGuard`，资源类型为 `CUSTOMER_SUCCESS_OPPORTUNITY`。
4. 机会必须绑定客户成功计划，可选绑定成功行动、验收复盘、成果资产和落地方案包，并校验来源链路一致。
5. 默认权限编码：

```text
customer:success_opportunity:view    查看续约机会
customer:success_opportunity:manage  新建、编辑、归档续约机会
```

## 接口

```text
GET    /customer-success-opportunities
POST   /customer-success-opportunities
GET    /customer-success-opportunities/:id
PATCH  /customer-success-opportunities/:id
DELETE /customer-success-opportunities/:id
```

## 前端页面

```text
/customer-success-opportunities
/customer-success-opportunities/create
/customer-success-opportunities/[id]
/customer-success-opportunities/[id]/edit
```

列表页只展示核心识别字段、机会类型、阶段、状态、优先级、信心/风险、评分、金额/概率、摘要预览、下一步动作、负责人和来源关系。客户价值、商务策略、决策路径、风险摘要、输单原因和内部备注进入详情页。

## 种子数据

默认种子新增：

- 菜单：`续约机会`
- 按钮：新建续约机会、编辑续约机会、归档续约机会
- 数据权限资源：`CUSTOMER_SUCCESS_OPPORTUNITY`
- 管理员角色默认资源授权
- 示例机会：`华中设计院二期续约扩展机会`

## 前端参考设计

```text
images/frontend-reference-design/customersuccessopportunities/
```

## 验证命令

```bash
pnpm --filter @aiaget/shared-types build
pnpm --filter @aiaget/control-api prisma:validate
pnpm --filter @aiaget/control-api prisma:generate
pnpm --filter @aiaget/control-api exec tsx --test src/customer-success-opportunities/customer-success-opportunities.service.test.ts
pnpm --filter @aiaget/control-api typecheck
pnpm --filter @aiaget/web typecheck
pnpm --filter @aiaget/web test:ia
pnpm --filter @aiaget/control-api exec tsx --test src/common/controller-permissions-contract.test.ts
git diff --check
```
