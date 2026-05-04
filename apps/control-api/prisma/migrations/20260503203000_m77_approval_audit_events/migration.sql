CREATE TABLE IF NOT EXISTS "approval_audit_event" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "source_type" VARCHAR(60) NOT NULL,
  "source_id" UUID NOT NULL,
  "event_type" VARCHAR(60) NOT NULL,
  "event_status" VARCHAR(30) NOT NULL DEFAULT 'INFO',
  "title" VARCHAR(180) NOT NULL,
  "note" TEXT,
  "request_id" VARCHAR(120),
  "trace_id" VARCHAR(120),
  "metadata" JSONB,
  "actor_id" UUID,
  "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "approval_audit_event_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "approval_audit_event_tenant_id_idx" ON "approval_audit_event"("tenant_id");
CREATE INDEX IF NOT EXISTS "approval_audit_event_source_type_idx" ON "approval_audit_event"("source_type");
CREATE INDEX IF NOT EXISTS "approval_audit_event_source_id_idx" ON "approval_audit_event"("source_id");
CREATE INDEX IF NOT EXISTS "approval_audit_event_event_type_idx" ON "approval_audit_event"("event_type");
CREATE INDEX IF NOT EXISTS "approval_audit_event_event_status_idx" ON "approval_audit_event"("event_status");
CREATE INDEX IF NOT EXISTS "approval_audit_event_actor_id_idx" ON "approval_audit_event"("actor_id");
CREATE INDEX IF NOT EXISTS "approval_audit_event_occurred_at_idx" ON "approval_audit_event"("occurred_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = current_schema()
      AND constraint_name = 'approval_audit_event_tenant_id_fkey'
      AND table_name = 'approval_audit_event'
  ) THEN
    ALTER TABLE "approval_audit_event"
      ADD CONSTRAINT "approval_audit_event_tenant_id_fkey"
      FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = current_schema()
      AND constraint_name = 'approval_audit_event_actor_id_fkey'
      AND table_name = 'approval_audit_event'
  ) THEN
    ALTER TABLE "approval_audit_event"
      ADD CONSTRAINT "approval_audit_event_actor_id_fkey"
      FOREIGN KEY ("actor_id") REFERENCES "user"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

COMMENT ON TABLE "approval_audit_event" IS '审批审计事件表，用于统一记录工具审批、通知策略审批及后续审批源的生命周期事件。';
COMMENT ON COLUMN "approval_audit_event"."id" IS '审批审计事件 ID。';
COMMENT ON COLUMN "approval_audit_event"."tenant_id" IS '所属租户 ID。';
COMMENT ON COLUMN "approval_audit_event"."source_type" IS '审批来源类型，例如 TOOL_APPROVAL、NOTIFICATION_POLICY。';
COMMENT ON COLUMN "approval_audit_event"."source_id" IS '审批来源记录 ID。';
COMMENT ON COLUMN "approval_audit_event"."event_type" IS '审批事件类型，例如 REQUEST_CREATED、APPROVED、REJECTED、APPLIED、EXECUTION_FAILED。';
COMMENT ON COLUMN "approval_audit_event"."event_status" IS '审批事件状态，INFO、SUCCESS、FAILED、WARNING。';
COMMENT ON COLUMN "approval_audit_event"."title" IS '审批事件标题。';
COMMENT ON COLUMN "approval_audit_event"."note" IS '审批事件备注或决策说明。';
COMMENT ON COLUMN "approval_audit_event"."request_id" IS '关联请求 ID。';
COMMENT ON COLUMN "approval_audit_event"."trace_id" IS '关联链路 Trace ID。';
COMMENT ON COLUMN "approval_audit_event"."metadata" IS '审批事件扩展元数据。';
COMMENT ON COLUMN "approval_audit_event"."actor_id" IS '触发审批事件的用户 ID。';
COMMENT ON COLUMN "approval_audit_event"."occurred_at" IS '审批事件发生时间。';
