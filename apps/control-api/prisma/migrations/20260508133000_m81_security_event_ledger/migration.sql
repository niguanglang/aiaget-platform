CREATE TABLE "security_event" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "user_id" UUID,
    "source" VARCHAR(60) NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "reason" TEXT NOT NULL,
    "resource_type" VARCHAR(80),
    "resource_id" VARCHAR(120),
    "action" VARCHAR(120),
    "matched_code" VARCHAR(120),
    "path" VARCHAR(500) NOT NULL,
    "method" VARCHAR(20) NOT NULL,
    "status_code" INTEGER NOT NULL,
    "request_id" VARCHAR(120) NOT NULL,
    "trace_id" VARCHAR(120),
    "severity" VARCHAR(30) NOT NULL DEFAULT 'MEDIUM',
    "source_record_type" VARCHAR(80) NOT NULL,
    "source_record_id" VARCHAR(120) NOT NULL,
    "subject" JSONB,
    "resource" JSONB,
    "context" JSONB,
    "request_summary" JSONB,
    "matched_policy_id" UUID,
    "matched_policy_code" VARCHAR(120),
    "matched_policy_name" VARCHAR(160),
    "ip" VARCHAR(80),
    "user_agent" VARCHAR(500),
    "error_message" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_event_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "security_event_tenant_id_source_record_type_source_record_id_key" ON "security_event"("tenant_id", "source_record_type", "source_record_id");
CREATE INDEX "security_event_tenant_id_idx" ON "security_event"("tenant_id");
CREATE INDEX "security_event_user_id_idx" ON "security_event"("user_id");
CREATE INDEX "security_event_source_idx" ON "security_event"("source");
CREATE INDEX "security_event_resource_type_resource_id_idx" ON "security_event"("resource_type", "resource_id");
CREATE INDEX "security_event_action_idx" ON "security_event"("action");
CREATE INDEX "security_event_matched_code_idx" ON "security_event"("matched_code");
CREATE INDEX "security_event_request_id_idx" ON "security_event"("request_id");
CREATE INDEX "security_event_trace_id_idx" ON "security_event"("trace_id");
CREATE INDEX "security_event_severity_idx" ON "security_event"("severity");
CREATE INDEX "security_event_source_record_type_source_record_id_idx" ON "security_event"("source_record_type", "source_record_id");
CREATE INDEX "security_event_occurred_at_idx" ON "security_event"("occurred_at");

ALTER TABLE "security_event" ADD CONSTRAINT "security_event_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "security_event" ADD CONSTRAINT "security_event_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMENT ON TABLE "security_event" IS '安全事件台账表，用于稳定记录 Data Scope、Resource ACL、安全策略和安全运营动作产生的安全事件。';
COMMENT ON COLUMN "security_event"."id" IS '主键 ID。';
COMMENT ON COLUMN "security_event"."tenant_id" IS '所属租户 ID。';
COMMENT ON COLUMN "security_event"."user_id" IS '关联用户 ID。';
COMMENT ON COLUMN "security_event"."source" IS '安全事件来源，DATA_SCOPE、RESOURCE_ACL、SECURITY_POLICY、OPERATION、APPROVAL_WORKBENCH。';
COMMENT ON COLUMN "security_event"."title" IS '安全事件标题。';
COMMENT ON COLUMN "security_event"."reason" IS '安全事件原因或拒绝说明。';
COMMENT ON COLUMN "security_event"."resource_type" IS '关联资源类型。';
COMMENT ON COLUMN "security_event"."resource_id" IS '关联资源 ID。';
COMMENT ON COLUMN "security_event"."action" IS '触发事件的操作或权限编码。';
COMMENT ON COLUMN "security_event"."matched_code" IS '命中的权限、策略或规则编码。';
COMMENT ON COLUMN "security_event"."path" IS '请求路径或事件入口。';
COMMENT ON COLUMN "security_event"."method" IS '请求方法或事件动作。';
COMMENT ON COLUMN "security_event"."status_code" IS '请求状态码或事件状态码。';
COMMENT ON COLUMN "security_event"."request_id" IS '关联请求 ID。';
COMMENT ON COLUMN "security_event"."trace_id" IS '关联链路 Trace ID。';
COMMENT ON COLUMN "security_event"."severity" IS '风险等级，LOW、MEDIUM、HIGH。';
COMMENT ON COLUMN "security_event"."source_record_type" IS '来源记录类型，例如 operation_log、security_policy_evaluation、platform_event。';
COMMENT ON COLUMN "security_event"."source_record_id" IS '来源记录 ID。';
COMMENT ON COLUMN "security_event"."subject" IS '主体属性快照。';
COMMENT ON COLUMN "security_event"."resource" IS '资源属性快照。';
COMMENT ON COLUMN "security_event"."context" IS '上下文属性快照。';
COMMENT ON COLUMN "security_event"."request_summary" IS '请求摘要或平台事件负载快照。';
COMMENT ON COLUMN "security_event"."matched_policy_id" IS '命中的安全策略 ID。';
COMMENT ON COLUMN "security_event"."matched_policy_code" IS '命中的安全策略编码。';
COMMENT ON COLUMN "security_event"."matched_policy_name" IS '命中的安全策略名称。';
COMMENT ON COLUMN "security_event"."ip" IS '客户端 IP。';
COMMENT ON COLUMN "security_event"."user_agent" IS '客户端 User-Agent。';
COMMENT ON COLUMN "security_event"."error_message" IS '错误信息。';
COMMENT ON COLUMN "security_event"."occurred_at" IS '事件发生时间。';
COMMENT ON COLUMN "security_event"."created_at" IS '创建时间。';
