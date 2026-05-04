# M97 审批与归档告警 SLA 死信审计归档删除审批筛选与导出

## 目标

M97 在 M96 审批详情和审计时间线基础上，增强归档删除审批队列的运营效率。安全管理员和审计员可以按关键字、审批状态和只看待办筛选记录，并将当前筛选结果导出为 CSV，便于离线复核和运营交接。

## 后端接口

本阶段不新增后端接口，复用现有审批列表和详情接口：

```text
GET /api/v1/security-center/operation-alert-sla/dead-letter-audits/archive-approvals
GET /api/v1/security-center/operation-alert-sla/dead-letter-audits/archive-approvals/:approvalId
```

筛选和导出在前端本地完成。

## 前端

安全中心 `/security` 的“归档删除审批”区域新增：

```text
1. 关键字搜索
2. 审批状态筛选
3. 只看待办
4. 重置筛选
5. 当前筛选数量
6. 当前筛选内待办数量
7. 当前筛选 CSV 导出
8. 筛选空态
```

关键字匹配字段：

```text
审批 ID
归档 ID
归档文件名
对象路径
审批意见
申请人姓名 / 邮箱
审批人姓名 / 邮箱
```

支持状态：

```text
全部
待审批
已批准
已拒绝
已生效
```

## 设计资产

```text
images/frontend-reference-design/m97-sla死信审计归档删除审批筛选批量运营/
```

包含：

```text
00-project-ui-brief.md
01-product-ui-design-prompt.md
02-product-prototype-prompt.md
03-component-mapping.md
```

## 权限

沿用当前安全中心接口权限：

```text
security:rule:view
```

## 边界

1. 本阶段不新增数据库表。
2. 本阶段不新增后端接口。
3. 本阶段不执行数据库迁移。
4. 本阶段不启动容器、不安装中间件、不触碰外部服务。
5. 当前导出为前端本地 CSV，后续如数据量增大可迁移为后端导出任务。

## 验收标准

- 可以按关键字搜索归档删除审批。
- 可以按审批状态筛选。
- 可以一键只看待办。
- 可以重置筛选。
- 可以查看当前筛选数量和筛选内待办数量。
- 可以导出当前筛选结果 CSV。
- 筛选无结果时显示中文空态。
- Web typecheck 通过。
- Control API typecheck 通过。
