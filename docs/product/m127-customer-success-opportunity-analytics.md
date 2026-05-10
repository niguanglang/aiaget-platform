# M127 客户成功续约机会分析

M127 在 M126 续约机会 CRUD 之后，补齐只读运营看板。该模块不新增数据库表，不触碰中间件，不执行远程数据库写入；直接基于 `customer_success_opportunity` 在当前租户和数据权限范围内聚合分析。

## 后端能力

1. 新增 `GET /customer-success-opportunities/analytics`。
2. 返回 `CustomerSuccessOpportunityAnalytics`，包含总览指标、阶段漏斗、类型分布、风险分布、高价值机会 Top 5 和近期关闭机会。
3. 聚合查询复用 `CUSTOMER_SUCCESS_OPPORTUNITY` 数据范围过滤，避免越权看到跨部门或跨资源数据。
4. 接口权限使用 `customer:success_opportunity:view`，保持“能看机会，才能看机会分析”。

## 前端页面

```text
/customer-success-opportunities/analytics
```

页面职责：

- 只读展示续约机会漏斗和分析指标。
- 不承载新增、编辑、归档等 CRUD 动作。
- Top 机会和近期关闭机会只提供“详情”入口。
- 列表页 `/customer-success-opportunities` 只保留清单查询、筛选和行内操作，通过顶部按钮进入分析页。

## 菜单与权限

默认种子新增续约机会的子菜单：

```text
续约机会
└── 机会分析
```

菜单编码：

```text
customer_success_opportunity_analytics
```

权限编码：

```text
customer:success_opportunity:view
```

## 前端参考设计

```text
images/frontend-reference-design/续约机会分析/
```

该目录包含项目 UI brief、产品 UI 设计图提示词、产品原型图提示词和组件映射。

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
