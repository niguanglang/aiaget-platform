CREATE TABLE "platform_event" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "department_id" UUID,
  "user_id" UUID,
  "actor_type" VARCHAR(40) NOT NULL DEFAULT 'USER',
  "resource_type" VARCHAR(80) NOT NULL,
  "resource_id" VARCHAR(120),
  "agent_id" VARCHAR(120),
  "team_id" VARCHAR(120),
  "plugin_id" VARCHAR(120),
  "channel_id" VARCHAR(120),
  "conversation_id" VARCHAR(120),
  "run_id" VARCHAR(120),
  "task_id" VARCHAR(120),
  "request_id" VARCHAR(120),
  "trace_id" VARCHAR(120),
  "parent_trace_id" VARCHAR(120),
  "event_source" VARCHAR(80) NOT NULL,
  "event_type" VARCHAR(120) NOT NULL,
  "status" VARCHAR(40) NOT NULL,
  "severity" VARCHAR(30) NOT NULL DEFAULT 'INFO',
  "security_level" VARCHAR(40) NOT NULL DEFAULT 'INTERNAL',
  "billable" BOOLEAN NOT NULL DEFAULT false,
  "summary" TEXT,
  "payload_json" JSONB,
  "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "source_system" VARCHAR(80),
  "source_id" VARCHAR(120),
  "dedupe_key" VARCHAR(180),
  CONSTRAINT "platform_event_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform_usage_event" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "department_id" UUID,
  "user_id" UUID,
  "subject_type" VARCHAR(60) NOT NULL,
  "subject_id" VARCHAR(120),
  "resource_type" VARCHAR(80) NOT NULL,
  "resource_id" VARCHAR(120),
  "metric_type" VARCHAR(80) NOT NULL,
  "unit" VARCHAR(40) NOT NULL,
  "quantity" DECIMAL(18,6) NOT NULL DEFAULT 0,
  "unit_price" DECIMAL(18,6) NOT NULL DEFAULT 0,
  "amount" DECIMAL(18,6) NOT NULL DEFAULT 0,
  "currency" VARCHAR(12) NOT NULL DEFAULT 'USD',
  "billable" BOOLEAN NOT NULL DEFAULT false,
  "cost_source" VARCHAR(80),
  "trace_id" VARCHAR(120),
  "request_id" VARCHAR(120),
  "event_id" UUID,
  "source_system" VARCHAR(80),
  "source_id" VARCHAR(120),
  "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "platform_usage_event_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "platform_event_tenant_id_idx" ON "platform_event"("tenant_id");
CREATE INDEX "platform_event_department_id_idx" ON "platform_event"("department_id");
CREATE INDEX "platform_event_user_id_idx" ON "platform_event"("user_id");
CREATE INDEX "platform_event_resource_type_resource_id_idx" ON "platform_event"("resource_type", "resource_id");
CREATE INDEX "platform_event_agent_id_idx" ON "platform_event"("agent_id");
CREATE INDEX "platform_event_team_id_idx" ON "platform_event"("team_id");
CREATE INDEX "platform_event_conversation_id_idx" ON "platform_event"("conversation_id");
CREATE INDEX "platform_event_run_id_idx" ON "platform_event"("run_id");
CREATE INDEX "platform_event_request_id_idx" ON "platform_event"("request_id");
CREATE INDEX "platform_event_trace_id_idx" ON "platform_event"("trace_id");
CREATE INDEX "platform_event_event_source_idx" ON "platform_event"("event_source");
CREATE INDEX "platform_event_event_type_idx" ON "platform_event"("event_type");
CREATE INDEX "platform_event_status_idx" ON "platform_event"("status");
CREATE INDEX "platform_event_severity_idx" ON "platform_event"("severity");
CREATE INDEX "platform_event_occurred_at_idx" ON "platform_event"("occurred_at");
CREATE INDEX "platform_event_source_system_source_id_idx" ON "platform_event"("source_system", "source_id");
CREATE INDEX "platform_event_dedupe_key_idx" ON "platform_event"("dedupe_key");

CREATE INDEX "platform_usage_event_tenant_id_idx" ON "platform_usage_event"("tenant_id");
CREATE INDEX "platform_usage_event_department_id_idx" ON "platform_usage_event"("department_id");
CREATE INDEX "platform_usage_event_user_id_idx" ON "platform_usage_event"("user_id");
CREATE INDEX "platform_usage_event_subject_type_subject_id_idx" ON "platform_usage_event"("subject_type", "subject_id");
CREATE INDEX "platform_usage_event_resource_type_resource_id_idx" ON "platform_usage_event"("resource_type", "resource_id");
CREATE INDEX "platform_usage_event_metric_type_idx" ON "platform_usage_event"("metric_type");
CREATE INDEX "platform_usage_event_billable_idx" ON "platform_usage_event"("billable");
CREATE INDEX "platform_usage_event_trace_id_idx" ON "platform_usage_event"("trace_id");
CREATE INDEX "platform_usage_event_request_id_idx" ON "platform_usage_event"("request_id");
CREATE INDEX "platform_usage_event_event_id_idx" ON "platform_usage_event"("event_id");
CREATE INDEX "platform_usage_event_source_system_source_id_idx" ON "platform_usage_event"("source_system", "source_id");
CREATE INDEX "platform_usage_event_occurred_at_idx" ON "platform_usage_event"("occurred_at");

ALTER TABLE "platform_event" ADD CONSTRAINT "platform_event_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "platform_event" ADD CONSTRAINT "platform_event_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "platform_usage_event" ADD CONSTRAINT "platform_usage_event_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "platform_usage_event" ADD CONSTRAINT "platform_usage_event_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "platform_usage_event" ADD CONSTRAINT "platform_usage_event_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "platform_event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "platform_event_relation" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "relation_type" VARCHAR(80) NOT NULL,
  "parent_event_id" UUID,
  "child_event_id" UUID,
  "source_event_id" UUID,
  "target_event_id" UUID,
  "relation_source" VARCHAR(80),
  "relation_key" VARCHAR(180),
  "metadata" JSONB,
  "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "platform_event_relation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform_usage_rollup" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "department_id" UUID,
  "subject_type" VARCHAR(60) NOT NULL,
  "subject_id" VARCHAR(120),
  "resource_type" VARCHAR(80) NOT NULL,
  "resource_id" VARCHAR(120),
  "metric_type" VARCHAR(80) NOT NULL,
  "period_type" VARCHAR(20) NOT NULL,
  "period_start" TIMESTAMP(3) NOT NULL,
  "period_end" TIMESTAMP(3) NOT NULL,
  "event_count" INT NOT NULL DEFAULT 0,
  "quantity_total" DECIMAL(18,6) NOT NULL DEFAULT 0,
  "amount_total" DECIMAL(18,6) NOT NULL DEFAULT 0,
  "cost_total" DECIMAL(18,6) NOT NULL DEFAULT 0,
  "error_count" INT NOT NULL DEFAULT 0,
  "success_count" INT NOT NULL DEFAULT 0,
  "retry_count" INT NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "platform_usage_rollup_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "platform_event_relation_tenant_id_idx" ON "platform_event_relation"("tenant_id");
CREATE INDEX "platform_event_relation_relation_type_idx" ON "platform_event_relation"("relation_type");
CREATE INDEX "platform_event_relation_parent_event_id_idx" ON "platform_event_relation"("parent_event_id");
CREATE INDEX "platform_event_relation_child_event_id_idx" ON "platform_event_relation"("child_event_id");
CREATE INDEX "platform_event_relation_source_event_id_idx" ON "platform_event_relation"("source_event_id");
CREATE INDEX "platform_event_relation_target_event_id_idx" ON "platform_event_relation"("target_event_id");
CREATE INDEX "platform_event_relation_relation_source_relation_key_idx" ON "platform_event_relation"("relation_source", "relation_key");
CREATE INDEX "platform_event_relation_occurred_at_idx" ON "platform_event_relation"("occurred_at");

CREATE INDEX "platform_usage_rollup_tenant_id_idx" ON "platform_usage_rollup"("tenant_id");
CREATE INDEX "platform_usage_rollup_department_id_idx" ON "platform_usage_rollup"("department_id");
CREATE INDEX "platform_usage_rollup_subject_type_subject_id_idx" ON "platform_usage_rollup"("subject_type", "subject_id");
CREATE INDEX "platform_usage_rollup_resource_type_resource_id_idx" ON "platform_usage_rollup"("resource_type", "resource_id");
CREATE INDEX "platform_usage_rollup_metric_type_idx" ON "platform_usage_rollup"("metric_type");
CREATE INDEX "platform_usage_rollup_period_type_period_start_period_end_idx" ON "platform_usage_rollup"("period_type", "period_start", "period_end");
CREATE INDEX "platform_usage_rollup_created_at_idx" ON "platform_usage_rollup"("created_at");
CREATE UNIQUE INDEX "platform_usage_rollup_unique_key" ON "platform_usage_rollup"("tenant_id", "subject_type", "subject_id", "resource_type", "resource_id", "metric_type", "period_type", "period_start");

ALTER TABLE "platform_event_relation" ADD CONSTRAINT "platform_event_relation_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "platform_usage_rollup" ADD CONSTRAINT "platform_usage_rollup_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMENT ON TABLE "platform_event" IS '平台统一事件表，用于投影 Agent、团队、工具、知识库、渠道、插件、安全和工作流等平台事件。';
COMMENT ON COLUMN "platform_event"."id" IS '平台事件 ID。';
COMMENT ON COLUMN "platform_event"."tenant_id" IS '所属租户 ID。';
COMMENT ON COLUMN "platform_event"."department_id" IS '事件归属部门 ID。';
COMMENT ON COLUMN "platform_event"."user_id" IS '事件归属或触发用户 ID。';
COMMENT ON COLUMN "platform_event"."actor_type" IS '事件触发主体类型，例如 USER、API_KEY、SYSTEM、RUNTIME、WORKFLOW。';
COMMENT ON COLUMN "platform_event"."resource_type" IS '事件关联资源类型，例如 AGENT、AGENT_TEAM、TOOL、KNOWLEDGE_BASE、MODEL、PLUGIN、CHANNEL。';
COMMENT ON COLUMN "platform_event"."resource_id" IS '事件关联资源 ID，可为业务 UUID 或外部资源标识。';
COMMENT ON COLUMN "platform_event"."agent_id" IS '事件关联 Agent ID。';
COMMENT ON COLUMN "platform_event"."team_id" IS '事件关联 Agent 协作团队 ID。';
COMMENT ON COLUMN "platform_event"."plugin_id" IS '事件关联插件 ID。';
COMMENT ON COLUMN "platform_event"."channel_id" IS '事件关联发布渠道 ID。';
COMMENT ON COLUMN "platform_event"."conversation_id" IS '事件关联会话 ID。';
COMMENT ON COLUMN "platform_event"."run_id" IS '事件关联运行记录 ID。';
COMMENT ON COLUMN "platform_event"."task_id" IS '事件关联任务 ID，例如后台任务或工作流任务。';
COMMENT ON COLUMN "platform_event"."request_id" IS '请求链路 ID。';
COMMENT ON COLUMN "platform_event"."trace_id" IS '追踪链路 ID。';
COMMENT ON COLUMN "platform_event"."parent_trace_id" IS '父级追踪链路 ID，用于关联重试、接力或子任务。';
COMMENT ON COLUMN "platform_event"."event_source" IS '事件来源模块，例如 CONTROL_API、RUNTIME、AGENT_TEAM、TOOL_GATEWAY、TEMPORAL。';
COMMENT ON COLUMN "platform_event"."event_type" IS '事件类型编码，例如 agent.team.run.finished、agent.team.handoff。';
COMMENT ON COLUMN "platform_event"."status" IS '事件状态，例如 SUCCESS、FAILED、WAITING_HUMAN、PENDING。';
COMMENT ON COLUMN "platform_event"."severity" IS '事件严重级别，例如 INFO、WARN、ERROR。';
COMMENT ON COLUMN "platform_event"."security_level" IS '事件安全等级，例如 PUBLIC、INTERNAL、CONFIDENTIAL、SECRET。';
COMMENT ON COLUMN "platform_event"."billable" IS '事件是否参与计费或用量归因。';
COMMENT ON COLUMN "platform_event"."summary" IS '事件摘要文本。';
COMMENT ON COLUMN "platform_event"."payload_json" IS '事件扩展负载 JSON。';
COMMENT ON COLUMN "platform_event"."occurred_at" IS '事件实际发生时间。';
COMMENT ON COLUMN "platform_event"."created_at" IS '事件记录创建时间。';
COMMENT ON COLUMN "platform_event"."updated_at" IS '事件记录更新时间。';
COMMENT ON COLUMN "platform_event"."source_system" IS '事实来源系统或来源表名。';
COMMENT ON COLUMN "platform_event"."source_id" IS '事实来源记录 ID。';
COMMENT ON COLUMN "platform_event"."dedupe_key" IS '事件幂等去重键。';

COMMENT ON TABLE "platform_usage_event" IS '平台统一用量事件表，用于记录模型 Token、工具调用、知识检索、工作流步骤、渠道投递和存储等可聚合用量。';
COMMENT ON COLUMN "platform_usage_event"."id" IS '平台用量事件 ID。';
COMMENT ON COLUMN "platform_usage_event"."tenant_id" IS '所属租户 ID。';
COMMENT ON COLUMN "platform_usage_event"."department_id" IS '用量归属部门 ID。';
COMMENT ON COLUMN "platform_usage_event"."user_id" IS '用量归属用户 ID。';
COMMENT ON COLUMN "platform_usage_event"."subject_type" IS '用量主体类型，例如 USER、API_KEY、AGENT、AGENT_TEAM、PLUGIN、CHANNEL。';
COMMENT ON COLUMN "platform_usage_event"."subject_id" IS '用量主体 ID。';
COMMENT ON COLUMN "platform_usage_event"."resource_type" IS '用量关联资源类型。';
COMMENT ON COLUMN "platform_usage_event"."resource_id" IS '用量关联资源 ID。';
COMMENT ON COLUMN "platform_usage_event"."metric_type" IS '用量指标类型，例如 model_tokens、workflow_steps、agent_team_runs。';
COMMENT ON COLUMN "platform_usage_event"."unit" IS '用量单位，例如 token、step、run、call、byte。';
COMMENT ON COLUMN "platform_usage_event"."quantity" IS '用量数量。';
COMMENT ON COLUMN "platform_usage_event"."unit_price" IS '单位价格。';
COMMENT ON COLUMN "platform_usage_event"."amount" IS '用量金额。';
COMMENT ON COLUMN "platform_usage_event"."currency" IS '金额币种。';
COMMENT ON COLUMN "platform_usage_event"."billable" IS '用量是否可计费。';
COMMENT ON COLUMN "platform_usage_event"."cost_source" IS '成本来源或计价来源，例如 AGENT_TEAM_RUNTIME、MODEL_PROVIDER。';
COMMENT ON COLUMN "platform_usage_event"."trace_id" IS '追踪链路 ID。';
COMMENT ON COLUMN "platform_usage_event"."request_id" IS '请求链路 ID。';
COMMENT ON COLUMN "platform_usage_event"."event_id" IS '关联的平台事件 ID。';
COMMENT ON COLUMN "platform_usage_event"."source_system" IS '事实来源系统或来源表名。';
COMMENT ON COLUMN "platform_usage_event"."source_id" IS '事实来源记录 ID。';
COMMENT ON COLUMN "platform_usage_event"."occurred_at" IS '用量实际发生时间。';
COMMENT ON COLUMN "platform_usage_event"."created_at" IS '用量记录创建时间。';

COMMENT ON TABLE "platform_event_relation" IS '平台统一事件关系表，用于记录父子、重试、接力、审批和结算归因链路。';
COMMENT ON COLUMN "platform_event_relation"."id" IS '平台事件关系主键。';
COMMENT ON COLUMN "platform_event_relation"."tenant_id" IS '所属租户 ID。';
COMMENT ON COLUMN "platform_event_relation"."relation_type" IS '关系类型，例如 TRACE_PARENT、REQUEST、SOURCE_LINK、USAGE_LINK、HANDOFF、APPROVAL、ROLLUP。';
COMMENT ON COLUMN "platform_event_relation"."parent_event_id" IS '父事件 ID。';
COMMENT ON COLUMN "platform_event_relation"."child_event_id" IS '子事件 ID。';
COMMENT ON COLUMN "platform_event_relation"."source_event_id" IS '源事件 ID。';
COMMENT ON COLUMN "platform_event_relation"."target_event_id" IS '目标事件 ID。';
COMMENT ON COLUMN "platform_event_relation"."relation_source" IS '关系来源系统或关系来源表。';
COMMENT ON COLUMN "platform_event_relation"."relation_key" IS '关系幂等键或外部关联键。';
COMMENT ON COLUMN "platform_event_relation"."metadata" IS '关系扩展元数据 JSON。';
COMMENT ON COLUMN "platform_event_relation"."occurred_at" IS '关系发生时间。';
COMMENT ON COLUMN "platform_event_relation"."created_at" IS '关系记录创建时间。';

COMMENT ON TABLE "platform_usage_rollup" IS '平台统一用量汇总表，用于按租户、主体、资源和周期汇总事件数量、用量、金额、错误和重试。';
COMMENT ON COLUMN "platform_usage_rollup"."id" IS '平台用量汇总主键。';
COMMENT ON COLUMN "platform_usage_rollup"."tenant_id" IS '所属租户 ID。';
COMMENT ON COLUMN "platform_usage_rollup"."department_id" IS '汇总归属部门 ID。';
COMMENT ON COLUMN "platform_usage_rollup"."subject_type" IS '汇总主体类型。';
COMMENT ON COLUMN "platform_usage_rollup"."subject_id" IS '汇总主体 ID。';
COMMENT ON COLUMN "platform_usage_rollup"."resource_type" IS '汇总资源类型。';
COMMENT ON COLUMN "platform_usage_rollup"."resource_id" IS '汇总资源 ID。';
COMMENT ON COLUMN "platform_usage_rollup"."metric_type" IS '汇总指标类型。';
COMMENT ON COLUMN "platform_usage_rollup"."period_type" IS '汇总周期类型，hour 或 day。';
COMMENT ON COLUMN "platform_usage_rollup"."period_start" IS '汇总周期开始时间。';
COMMENT ON COLUMN "platform_usage_rollup"."period_end" IS '汇总周期结束时间。';
COMMENT ON COLUMN "platform_usage_rollup"."event_count" IS '事件数量。';
COMMENT ON COLUMN "platform_usage_rollup"."quantity_total" IS '数量总和。';
COMMENT ON COLUMN "platform_usage_rollup"."amount_total" IS '金额总和。';
COMMENT ON COLUMN "platform_usage_rollup"."cost_total" IS '成本总和。';
COMMENT ON COLUMN "platform_usage_rollup"."error_count" IS '错误数量。';
COMMENT ON COLUMN "platform_usage_rollup"."success_count" IS '成功数量。';
COMMENT ON COLUMN "platform_usage_rollup"."retry_count" IS '重试数量。';
COMMENT ON COLUMN "platform_usage_rollup"."created_at" IS '汇总记录创建时间。';
COMMENT ON COLUMN "platform_usage_rollup"."updated_at" IS '汇总记录更新时间。';
