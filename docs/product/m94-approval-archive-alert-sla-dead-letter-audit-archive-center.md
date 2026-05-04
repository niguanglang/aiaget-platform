# M94 审批与归档告警 SLA 死信处置审计归档下载中心

## 目标

M94 在 M93 的同步 CSV 导出基础上，补齐对象存储归档和下载中心。安全管理员和审计员可以把当前筛选条件下的 SLA 死信处置审计生成 CSV 归档，保存到对象存储，并通过短期下载链接离线下载。

## 后端接口

新增归档接口：

```text
POST /api/v1/security-center/operation-alert-sla/dead-letter-audits/archives
GET  /api/v1/security-center/operation-alert-sla/dead-letter-audits/archives
GET  /api/v1/security-center/operation-alert-sla/dead-letter-audits/archives/:archiveId/download-url
```

生成归档支持筛选参数：

```text
keyword
action
disposition_status
```

对象存储前缀：

```text
audit-archives/security-sla-dead-letter-audits
```

下载链接有效期：

```text
300 秒
```

## 前端

安全中心 `/security` 的“SLA 死信处置审计时间线”下方新增：

```text
1. SLA 死信审计归档下载面板
2. 生成归档
3. 刷新归档
4. 归档文件数和总容量
5. 归档文件列表
6. 下载短期链接
7. 成功和失败反馈
```

归档列表字段：

```text
文件名
目录
大小
更新时间
对象路径
操作
```

## 设计资产

```text
images/frontend-reference-design/m94-sla死信审计归档下载中心/
```

包含：

```text
00-project-ui-brief.md
01-product-ui-design-prompt.md
02-product-prototype-prompt.md
03-component-mapping.md
```

## 权限

沿用安全中心查看权限：

```text
security:rule:view
```

## 边界

1. 本阶段不新增数据库表。
2. 本阶段不跑迁移、不启动容器、不安装中间件。
3. 使用现有 `StorageService` 和已配置对象存储。
4. 本阶段不做归档删除审批，删除治理可单独拆后续里程碑。

## 验收标准

- 可以按当前筛选条件生成 SLA 死信处置审计 CSV 归档。
- 可以查看归档文件数量和总容量。
- 可以查看归档文件列表。
- 可以打开短期下载链接。
- Control API typecheck 通过。
- Web typecheck 通过。
