# M124 客户成功计划中心

## 目标

M124 在 M119 客户评估、M120 岗位场景、M121 落地方案包、M122 验收复盘、M123 成果资产基础上，补齐“落地后扩展与续约运营”的闭环。客户成功计划用于把一次交付验收和可复用成果资产转成后续扩展推广、续约准备、健康风险和下一步客户成功动作。

## 后端

1. 新增 `customer_success_plan` 表，强关联 `delivery_review`，可关联 `delivery_asset` 与 `solution_package`。
2. 表和所有字段在迁移 SQL 中提供中文注释。
3. 新增 `CustomerSuccessPlansModule`，提供列表、详情、新建、编辑、归档接口。
4. 接入 `DataScopeGuard`、`ResourceAclGuard`、`SecurityPolicyGuard`，资源类型为 `CUSTOMER_SUCCESS_PLAN`。
5. 新增权限编码：

```text
customer:success:view    查看客户成功计划
customer:success:manage  新建、编辑、归档客户成功计划
```

## API

```text
GET    /customer-success-plans
POST   /customer-success-plans
GET    /customer-success-plans/:id
PATCH  /customer-success-plans/:id
DELETE /customer-success-plans/:id
```

## 前端

```text
/customer-success-plans
/customer-success-plans/create
/customer-success-plans/[id]
/customer-success-plans/[id]/edit
```

页面遵守后台信息架构拆分规则：

- 列表页只展示核心识别字段、阶段、状态、优先级、健康度、评分、扩展预览、下一步预览和行内操作。
- 详情页承载完整扩展范围、成功目标、干系人计划、资产复用计划、续约计划、风险摘要、下一步动作和关联资源。
- 新建/编辑使用独立页面和共享表单，不把复杂表单塞进列表页。
- 所有可见文案使用中文。

## 种子数据

默认种子会创建“华中设计院客户成功扩展计划”，关联默认验收复盘、成果资产和落地方案包，并给租户管理员角色创建资源级 ACL。

## 验证

```text
pnpm --filter @aiaget/shared-types build
pnpm --filter @aiaget/control-api prisma:validate
pnpm --filter @aiaget/control-api prisma:generate
pnpm --filter @aiaget/control-api exec tsx --test src/customer-success-plans/customer-success-plans.service.test.ts
pnpm --filter @aiaget/control-api typecheck
pnpm --filter @aiaget/web typecheck
pnpm --filter @aiaget/web test:ia
pnpm --filter @aiaget/control-api exec tsx --test src/common/controller-permissions-contract.test.ts
```
