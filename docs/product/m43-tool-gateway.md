# M43 Tool Gateway

## 目标

M43 将工具执行从 `ToolsService` 私有 HTTP 调用升级为明确的 Tool Gateway 边界：

```text
ToolsService：工具 CRUD、详情映射、前端 API 合约
ToolGatewayService：工具调用策略、请求准备、鉴权注入、审批、限流、重试、HTTP 执行、日志
RuntimeExecutionService：Runtime 内部工具调用适配、Agent 绑定校验、DataScope、Resource ACL
```

本里程碑不新增独立进程、不创建容器、不启动任何中间件。当前 Tool Gateway 以内嵌 NestJS 模块交付，为后续独立 Go Tool Gateway 预留边界。

## 已实现

- 新增 Control API 内部模块：

```text
apps/control-api/src/tool-gateway/tool-gateway.module.ts
apps/control-api/src/tool-gateway/tool-gateway.service.ts
```

- `ToolsService.execute()` 改为调用 `ToolGatewayService.execute()`。
- 审批通过后的执行改为调用 `ToolGatewayService.executeApprovalRequest()`。
- Runtime 内部工具调用继续走：

```text
POST /api/v1/runtime/internal/tools/call
```

- Runtime 工具调用会传入 Agent 工具绑定上的 `require_approval`，绑定级审批策略进入 Tool Gateway。
- 工具测试接口权限从配置权限拆出：

```text
POST /api/v1/tools/:id/test
权限：tool:call:execute
```

- Resource ACL 工具资源授权增加：

```text
tool:call:execute
```

## Gateway 执行链

```text
1. 加载 Tool 配置
2. 校验 ACTIVE 状态
3. 校验 input JSON object
4. 校验 input_schema
5. 准备 URL / Query / Body / Headers
6. 注入鉴权配置
7. 执行安全策略评估
8. 执行工具级限流
9. 判断工具级 / 绑定级审批
10. 发起 HTTP 请求
11. GET 请求失败时按策略重试
12. 解析并裁剪响应体
13. 校验 output_schema
14. 写入 tool_call_log
```

## 安全策略

Tool Gateway 会用 `tool:call:execute` 动作评估安全策略。

可用于 ABAC 条件的属性包括：

```text
subject.id
subject.tenant_id
subject.department_id
subject.role_codes
subject.role_ids
resource.id
resource.code
resource.method
resource.risk_level
resource.require_approval
resource.url_host
resource.url_protocol
context.trigger_source
context.agent_id
context.conversation_id
context.approval_required
context.timeout_ms
context.rate_limit_per_minute
```

命中 `DENY` 时，Tool Gateway 会写入失败的 `tool_call_log`，并把原因保存在 `error_message`。

## 审批规则

以下任一条件满足时进入审批：

```text
tool.risk_level = HIGH
tool.require_approval = true
agent_tool_binding.require_approval = true
```

审批请求仍写入：

```text
tool_approval_request
```

审批通过后复用原始请求快照执行，避免审批前后输入被篡改。

## 环境变量

```text
TOOL_GATEWAY_RATE_LIMIT_PER_MINUTE=120
TOOL_GATEWAY_MAX_RETRIES=1
TOOL_GATEWAY_MAX_RESPONSE_CHARS=20000
```

说明：

- 限流是 Control API 进程内租户 + 工具维度限流。
- 当前只对 `GET` 请求执行重试，避免对写操作造成重复副作用。
- 响应体超过最大字符数会保存截断预览。

## 权限变化

新增权限：

```text
tool:call:execute
```

`tool:definition:manage` 只负责工具配置管理，不再代表工具执行权限。工具测试按钮也按 `tool:call:execute` 控制。

## 后续边界

后续如果拆出独立 Tool Gateway 服务，优先迁移：

```text
ToolGatewayService.execute()
ToolGatewayService.executeApprovalRequest()
```

Control API 仍保留租户、用户、DataScope、Resource ACL、安全策略和审计上下文，避免 Runtime 或独立网关绕过企业权限闭环。

## 验证

```text
pnpm --filter @aiaget/control-api typecheck
pnpm --filter @aiaget/web typecheck
```
