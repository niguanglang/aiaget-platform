# M48 知识库增强

## 目标

M48 为 `/knowledge` 增加租户级知识库治理总览，在不改变既有知识库 CRUD、上传、重建索引和检索测试流程的前提下，集中展示健康状态、处理队列、索引就绪率和最近召回情况。

## 已实现

- 新增知识库总览接口：
  - `GET /api/v1/knowledge-bases/overview`
- 新增前端总览区块：
  - 治理摘要指标
  - 知识库健康卡
  - 任务与召回卡
  - 最近文档、任务、召回列表
- `/knowledge` 维持原有列表入口，并保留：
  - 新建知识库
  - 编辑知识库
  - 上传文档
  - 重建索引
  - 检索测试
- 新增权限态提示：
  - 只读访问
  - 访问受限
- 新增总览缓存联动：
  - 知识库创建、更新、删除、上传、重建索引、检索测试后刷新总览

## 数据口径

M48 复用现有知识库相关数据，不新增数据库表。

```text
knowledge_base
knowledge_document
knowledge_segment
knowledge_embedding_task
knowledge_recall_log
agent_knowledge_binding
```

## UI 参考

Reference-first 前端素材位于：

```text
images/frontend-reference-design/m48-knowledge-enhancement/
```

## 说明

- 所有可见文案保持中文。
- 该版本仅增强知识库治理视图，不引入新的中间件或容器。
- 总览统计仅计算当前租户下未删除的知识库及其关联知识数据。
