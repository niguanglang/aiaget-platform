-- AlterTable
ALTER TABLE "agent" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "agent_audit_log" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "agent_category" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "agent_knowledge_binding" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "agent_model_binding" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "agent_prompt_binding" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "agent_publish_channel" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "agent_tool_binding" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "agent_version" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "api_key" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "knowledge_base" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "knowledge_document" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "knowledge_embedding_task" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "knowledge_recall_log" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "knowledge_segment" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "login_log" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "model_api_key" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "model_call_log" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "model_config" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "model_cost_rule" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "model_provider" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "operation_log" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "permission" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "prompt_template" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "prompt_test_record" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "prompt_variable" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "prompt_version" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "refresh_token" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "role" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "role_permission" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "tenant" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "user_role" ALTER COLUMN "id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "tool" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "tool_type" VARCHAR(30) NOT NULL DEFAULT 'HTTP',
    "method" VARCHAR(20) NOT NULL DEFAULT 'POST',
    "url" VARCHAR(1000) NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    "risk_level" VARCHAR(30) NOT NULL DEFAULT 'LOW',
    "timeout_ms" INTEGER NOT NULL DEFAULT 10000,
    "require_approval" BOOLEAN NOT NULL DEFAULT false,
    "headers" JSONB,
    "auth_type" VARCHAR(40) NOT NULL DEFAULT 'NONE',
    "auth_config" JSONB,
    "input_schema" JSONB,
    "output_schema" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "tool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tool_call_log" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "tool_id" UUID NOT NULL,
    "trigger_source" VARCHAR(30) NOT NULL DEFAULT 'TEST',
    "status" VARCHAR(30) NOT NULL,
    "request_url" VARCHAR(1000) NOT NULL,
    "request_method" VARCHAR(20) NOT NULL,
    "request_headers" JSONB,
    "request_body" JSONB,
    "response_status" INTEGER,
    "response_headers" JSONB,
    "response_body" JSONB,
    "latency_ms" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "tool_call_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tool_tenant_id_idx" ON "tool"("tenant_id");

-- CreateIndex
CREATE INDEX "tool_tool_type_idx" ON "tool"("tool_type");

-- CreateIndex
CREATE INDEX "tool_method_idx" ON "tool"("method");

-- CreateIndex
CREATE INDEX "tool_status_idx" ON "tool"("status");

-- CreateIndex
CREATE INDEX "tool_risk_level_idx" ON "tool"("risk_level");

-- CreateIndex
CREATE INDEX "tool_created_at_idx" ON "tool"("created_at");

-- CreateIndex
CREATE INDEX "tool_updated_at_idx" ON "tool"("updated_at");

-- CreateIndex
CREATE INDEX "tool_deleted_at_idx" ON "tool"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "tool_tenant_id_code_key" ON "tool"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "tool_call_log_tenant_id_idx" ON "tool_call_log"("tenant_id");

-- CreateIndex
CREATE INDEX "tool_call_log_tool_id_idx" ON "tool_call_log"("tool_id");

-- CreateIndex
CREATE INDEX "tool_call_log_status_idx" ON "tool_call_log"("status");

-- CreateIndex
CREATE INDEX "tool_call_log_trigger_source_idx" ON "tool_call_log"("trigger_source");

-- CreateIndex
CREATE INDEX "tool_call_log_created_at_idx" ON "tool_call_log"("created_at");

-- AddForeignKey
ALTER TABLE "tool" ADD CONSTRAINT "tool_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_call_log" ADD CONSTRAINT "tool_call_log_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_call_log" ADD CONSTRAINT "tool_call_log_tool_id_fkey" FOREIGN KEY ("tool_id") REFERENCES "tool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_call_log" ADD CONSTRAINT "tool_call_log_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "agent_model_binding_tenant_id_agent_id_model_id_binding_type_ke" RENAME TO "agent_model_binding_tenant_id_agent_id_model_id_binding_typ_key";

-- RenameIndex
ALTER INDEX "agent_prompt_binding_tenant_id_agent_id_prompt_id_prompt_type_k" RENAME TO "agent_prompt_binding_tenant_id_agent_id_prompt_id_prompt_ty_key";
