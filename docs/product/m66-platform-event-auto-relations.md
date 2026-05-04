# M66 统一事件关系自动建链

## 目标

在 M64/M65 已经完成统一事件、用量写入与查询承载后，让新写入的 `platform_event` 自动建立 `platform_event_relation`，把一次请求、一次运行、一次工作流、一次工具调用串成可追踪链路。

本模块不新增表、不执行迁移、不启动容器、不安装中间件。

## 自动建链触发点

统一入口：

```text
PlatformEventsService.recordEvent
PlatformEventsService.recordUsage
```

业务模块只要继续调用统一事件服务，即可自动生成关系链。

## 关系规则

新事件写入后，会查找同租户最近 24 小时内的候选事件，并按以下字段建立关系：

```text
trace_id        -> TRACE_PARENT
request_id      -> REQUEST
run_id          -> SOURCE_LINK
task_id         -> SOURCE_LINK
conversation_id -> SOURCE_LINK
source_system + source_id -> SOURCE_LINK
```

用量事件如果绑定了 `event_id`，会自动生成：

```text
USAGE_LINK
```

## 去重策略

关系写入前会按以下字段检查已有记录：

```text
tenant_id
relation_type
parent_event_id
child_event_id
source_event_id
target_event_id
relation_key
```

避免同一个事件多次写入时产生重复关系。

## 失败边界

自动建链失败不会影响主事件或主用量写入。

这样可以保证：

```text
业务事件优先写入成功
关系链作为增强能力尽力补齐
不会因为关系重复或候选异常阻断业务路径
```

## 查询承载

继续复用：

```text
GET /platform-events/:eventId
GET /platform-events/:eventId/relations
GET /platform-usage/overview
```

前端 M64 面板会在事件详情和最近关系区域展示这些自动关系。

## 验收标准

- 新写入事件会按 Trace / Request / Run / Task / Source 自动关联历史事件。
- 用量事件绑定 `event_id` 时会生成 `USAGE_LINK`。
- 重复写入不会产生重复关系。
- 自动建链失败不影响 `recordEvent` / `recordUsage` 返回。
- Control API typecheck 通过。
