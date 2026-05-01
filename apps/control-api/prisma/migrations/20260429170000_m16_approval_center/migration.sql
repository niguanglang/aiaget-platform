CREATE TABLE "tool_approval_request" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "tool_id" UUID NOT NULL,
    "tool_call_log_id" UUID NOT NULL,
    "agent_id" UUID,
    "conversation_id" UUID,
    "trigger_source" VARCHAR(30) NOT NULL DEFAULT 'TEST',
    "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "requested_by" UUID,
    "reviewed_by" UUID,
    "decision_note" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tool_approval_request_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tool_approval_request_tool_call_log_id_key" ON "tool_approval_request"("tool_call_log_id");
CREATE INDEX "tool_approval_request_tenant_id_idx" ON "tool_approval_request"("tenant_id");
CREATE INDEX "tool_approval_request_tool_id_idx" ON "tool_approval_request"("tool_id");
CREATE INDEX "tool_approval_request_agent_id_idx" ON "tool_approval_request"("agent_id");
CREATE INDEX "tool_approval_request_conversation_id_idx" ON "tool_approval_request"("conversation_id");
CREATE INDEX "tool_approval_request_status_idx" ON "tool_approval_request"("status");
CREATE INDEX "tool_approval_request_trigger_source_idx" ON "tool_approval_request"("trigger_source");
CREATE INDEX "tool_approval_request_created_at_idx" ON "tool_approval_request"("created_at");
CREATE INDEX "tool_approval_request_updated_at_idx" ON "tool_approval_request"("updated_at");

ALTER TABLE "tool_approval_request"
  ADD CONSTRAINT "tool_approval_request_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "tool_approval_request"
  ADD CONSTRAINT "tool_approval_request_tool_id_fkey"
  FOREIGN KEY ("tool_id") REFERENCES "tool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "tool_approval_request"
  ADD CONSTRAINT "tool_approval_request_tool_call_log_id_fkey"
  FOREIGN KEY ("tool_call_log_id") REFERENCES "tool_call_log"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "tool_approval_request"
  ADD CONSTRAINT "tool_approval_request_agent_id_fkey"
  FOREIGN KEY ("agent_id") REFERENCES "agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "tool_approval_request"
  ADD CONSTRAINT "tool_approval_request_conversation_id_fkey"
  FOREIGN KEY ("conversation_id") REFERENCES "conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "tool_approval_request"
  ADD CONSTRAINT "tool_approval_request_requested_by_fkey"
  FOREIGN KEY ("requested_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "tool_approval_request"
  ADD CONSTRAINT "tool_approval_request_reviewed_by_fkey"
  FOREIGN KEY ("reviewed_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
