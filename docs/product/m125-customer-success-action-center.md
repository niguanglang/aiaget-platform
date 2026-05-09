# M125 客户成功行动中心

## 目标

M125 在 M124 客户成功计划中心基础上，补齐“计划拆解成执行动作”的运营闭环。客户成功行动用于把客户成功计划中的下一步动作拆成可负责人、可截止、可跟踪、可沉淀完成证据的执行项。

## 后端

1. 新增 `customer_success_action` 表，强关联 `customer_success_plan`，可关联 `delivery_review`、`delivery_asset` 与 `solution_package`。
2. 表和所有字段在迁移 SQL 中提供中文注释。
3. 新增 `CustomerSuccessActionsModule`，提供列表、详情、新建、编辑、归档接口。
4. 接入 `DataScopeGuard`、`ResourceAclGuard`、`SecurityPolicyGuard`，资源类型为 `CUSTOMER_SUCCESS_ACTION`。
5. 新增权限编码：

```text
customer:success_action:view    查看客户成功行动
customer:success_action:manage  新建、编辑、归档客户成功行动
```

## API

```text
GET    /customer-success-actions
POST   /customer-success-actions
GET    /customer-success-actions/:id
PATCH  /customer-success-actions/:id
DELETE /customer-success-actions/:id
```

## 前端

```text
/customer-success-actions
/customer-success-actions/create
/customer-success-actions/[id]
/customer-success-actions/[id]/edit
```

页面遵守后台信息架构拆分规则：

- 列表页只展示核心识别字段、行动类型、状态、优先级、风险等级、评分、行动摘要预览、下一步预览、来源关系和行内操作。
- 详情页承载完整行动摘要、预期结果、执行记录、阻塞风险、完成证据、下一步动作和关联资源。
- 新建/编辑使用独立页面和共享表单，不把复杂表单塞进列表页。
- 所有可见文案使用中文。

## 种子数据

默认种子会创建“第二批岗位场景扩展评审会”，关联默认客户成功计划、验收复盘、成果资产和落地方案包，并给租户管理员角色创建资源级 ACL。

## 验证

```text
pnpm --filter @aiaget/shared-types build
pnpm --filter @aiaget/control-api prisma:validate
pnpm --filter @aiaget/control-api prisma:generate
pnpm --filter @aiaget/control-api exec tsx --test src/customer-success-actions/customer-success-actions.service.test.ts
pnpm --filter @aiaget/control-api typecheck
pnpm --filter @aiaget/web typecheck
pnpm --filter @aiaget/web test:ia
pnpm --filter @aiaget/control-api exec tsx --test src/common/controller-permissions-contract.test.ts
```
