# M30 ABAC / 安全策略中心

## 范围

- 新增安全策略中心页面 `/security`，使用中文界面展示策略概览、策略表、模拟评估和评估日志。
- 新增 ABAC 数据表 `security_policy` 与 `security_policy_evaluation`，均包含表注释和字段注释。
- 新增 Control API 模块 `security-policies`，提供策略 CRUD、启停、删除、概览、模拟评估和评估日志查询。
- 新增 RBAC 权限 `security_policy.read`、`security_policy.write`，租户管理员自动具备全部权限。

## 策略模型

- `effect` 支持 `ALLOW`、`DENY`。
- `status` 支持 `ACTIVE`、`DISABLED`、`DELETED`。
- `resource_type` 使用资源属性中的 `resource.type`、`resource.resource_type` 或 `resource.resourceType` 参与匹配。
- `action` 支持精确匹配和 `*` 通配。
- `priority` 数值越大越先匹配，同优先级下 `DENY` 优先。
- `conditions` 支持 JSON 对象或数组，推荐结构如下：

```json
{
  "all": [
    {
      "path": "subject.department_id",
      "operator": "eq",
      "value": "sales",
      "label": "主体部门匹配"
    }
  ]
}
```

## 条件操作符

- `eq`
- `neq`
- `in`
- `not_in`
- `contains`
- `exists`

## 接口

- `GET /api/v1/security-policies/overview`
- `GET /api/v1/security-policies`
- `POST /api/v1/security-policies`
- `GET /api/v1/security-policies/:id`
- `PATCH /api/v1/security-policies/:id`
- `DELETE /api/v1/security-policies/:id`
- `POST /api/v1/security-policies/:id/enable`
- `POST /api/v1/security-policies/:id/disable`
- `POST /api/v1/security-policies/simulate`
- `GET /api/v1/security-policies/evaluations`

## 验证

- `pnpm --filter @aiaget/control-api prisma:validate`
- `pnpm --filter @aiaget/control-api typecheck`
- `pnpm --filter @aiaget/web typecheck`
- 已对项目配置的 PostgreSQL 数据库执行迁移、注释脚本和权限种子。
