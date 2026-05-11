# M44 APIKey 外部调用

## 目标

让企业外部系统可以使用租户 API Key 调用指定 Agent，同时不绕过现有权限、安全策略、数据权限、资源 ACL、Runtime、RAG、Tool Gateway 和审计链路。

## 后端能力

- API Key 表增加外部调用控制字段：`scopes`、`allowed_agent_ids`、`ip_allowlist`、`rate_limit_per_minute`、`daily_quota`、`used_count_today`、`quota_reset_date`、`allow_stream`。
- 新增权限编码：
  - `system:api_key:invoke`：允许 API Key 被用于外部调用。
  - `agent:agent:use`：允许使用具体 Agent。
- 新增外部调用入口：

```http
POST /api/v1/external/agents/{agentId}/chat
Authorization: Bearer ak_xxx
Content-Type: application/json

{
  "message": "请根据知识库回答这个问题",
  "title": "外部系统会话"
}
```

也支持：

```http
x-api-key: ak_xxx
```

## 安全校验链路

1. 校验 API Key 明文哈希、状态、过期时间。
2. 校验 scope，当前非流式调用需要 `external:agent:chat`。
3. 校验 Agent 白名单，空白名单表示不限制 Agent，但仍要继续校验用户权限。
4. 校验 IP 白名单。
5. 校验 PostgreSQL 共享分钟限流窗口和数据库日额度。
6. 将 API Key 创建人还原成真实用户身份。
7. 校验 `system:api_key:invoke`、`conversation:chat:manage`、`agent:agent:use`。
8. 校验 Agent 数据权限与 Resource ACL，资源授权主体支持父部门授权对子部门用户继承。
9. 复用 `ConversationsService.create()` 进入现有 Runtime 执行链路。
10. 调用成功后更新 `last_used_at`、`used_count_today`、`quota_reset_date`。

## 前端能力

设置中心的“接口密钥”卡片已增强为外部调用配置面板：

- 展示外部调用地址 `/external/agents/{agentId}/chat`。
- 创建密钥时支持配置 Agent 白名单、调用范围、IP 白名单、分钟限流、每日额度、流式开关和过期时间。
- 密钥列表展示脱敏密钥、最近使用、过期时间、scope、Agent 限制、IP 限制、限流、日额度和流式状态。
- 创建成功后只展示一次明文密钥。

## 迁移

迁移文件：

```text
apps/control-api/prisma/migrations/20260501100000_m44_api_key_external_invocation/migration.sql
apps/control-api/prisma/migrations/20260511103000_external_api_key_rate_limit_windows/migration.sql
```

本次未自动执行迁移，需由你确认后在目标数据库执行。

## 验收标准

- 有权限用户可以在设置中心创建受限 API Key。
- 外部系统可用 `Authorization: Bearer ak_xxx` 或 `x-api-key` 调用 Agent。
- 无效、过期、停用、越权 Agent、IP 不匹配、超过限流或超过日额度都会被拒绝。
- 外部调用返回 `answer`、`references`、`tool_calls`、`usage`、`trace_id`、`conversation_id`。
- 外部调用产生会话、运行记录、操作日志和 trace id。
