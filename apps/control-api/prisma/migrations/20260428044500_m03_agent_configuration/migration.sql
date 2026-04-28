CREATE TABLE "agent_category" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "code" VARCHAR(80) NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "agent_category_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "category_id" UUID,
  "owner_id" UUID,
  "name" VARCHAR(160) NOT NULL,
  "code" VARCHAR(100) NOT NULL,
  "description" TEXT,
  "avatar_url" VARCHAR(500),
  "status" VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
  "version" INTEGER NOT NULL DEFAULT 0,
  "temperature" DECIMAL(4,2) NOT NULL DEFAULT 0.7,
  "max_context_tokens" INTEGER NOT NULL DEFAULT 4096,
  "enable_stream" BOOLEAN NOT NULL DEFAULT true,
  "enable_log" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "agent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_version" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "agent_id" UUID NOT NULL,
  "version" INTEGER NOT NULL,
  "status" VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
  "snapshot" JSONB NOT NULL,
  "change_note" TEXT,
  "published_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "agent_version_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_model_binding" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "agent_id" UUID NOT NULL,
  "model_id" VARCHAR(120) NOT NULL,
  "binding_type" VARCHAR(30) NOT NULL DEFAULT 'DEFAULT',
  "weight" INTEGER NOT NULL DEFAULT 100,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "agent_model_binding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_prompt_binding" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "agent_id" UUID NOT NULL,
  "prompt_id" VARCHAR(120) NOT NULL,
  "prompt_type" VARCHAR(30) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "agent_prompt_binding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_knowledge_binding" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "agent_id" UUID NOT NULL,
  "knowledge_id" VARCHAR(120) NOT NULL,
  "weight" INTEGER NOT NULL DEFAULT 100,
  "recall_top_k" INTEGER NOT NULL DEFAULT 5,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "agent_knowledge_binding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_tool_binding" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "agent_id" UUID NOT NULL,
  "tool_id" VARCHAR(120) NOT NULL,
  "require_approval" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "agent_tool_binding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_publish_channel" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "agent_id" UUID NOT NULL,
  "channel" VARCHAR(80) NOT NULL,
  "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  "config" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "agent_publish_channel_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_audit_log" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "agent_id" UUID NOT NULL,
  "action" VARCHAR(80) NOT NULL,
  "message" TEXT NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" UUID,
  CONSTRAINT "agent_audit_log_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "agent_category_tenant_id_code_key" ON "agent_category"("tenant_id", "code");
CREATE INDEX "agent_category_tenant_id_idx" ON "agent_category"("tenant_id");
CREATE INDEX "agent_category_created_at_idx" ON "agent_category"("created_at");
CREATE INDEX "agent_category_updated_at_idx" ON "agent_category"("updated_at");
CREATE INDEX "agent_category_deleted_at_idx" ON "agent_category"("deleted_at");

CREATE UNIQUE INDEX "agent_tenant_id_code_key" ON "agent"("tenant_id", "code");
CREATE INDEX "agent_tenant_id_idx" ON "agent"("tenant_id");
CREATE INDEX "agent_status_idx" ON "agent"("status");
CREATE INDEX "agent_category_id_idx" ON "agent"("category_id");
CREATE INDEX "agent_owner_id_idx" ON "agent"("owner_id");
CREATE INDEX "agent_created_at_idx" ON "agent"("created_at");
CREATE INDEX "agent_updated_at_idx" ON "agent"("updated_at");
CREATE INDEX "agent_deleted_at_idx" ON "agent"("deleted_at");

CREATE UNIQUE INDEX "agent_version_tenant_id_agent_id_version_key" ON "agent_version"("tenant_id", "agent_id", "version");
CREATE INDEX "agent_version_tenant_id_idx" ON "agent_version"("tenant_id");
CREATE INDEX "agent_version_tenant_id_agent_id_idx" ON "agent_version"("tenant_id", "agent_id");
CREATE INDEX "agent_version_status_idx" ON "agent_version"("status");
CREATE INDEX "agent_version_created_at_idx" ON "agent_version"("created_at");
CREATE INDEX "agent_version_updated_at_idx" ON "agent_version"("updated_at");
CREATE INDEX "agent_version_deleted_at_idx" ON "agent_version"("deleted_at");

CREATE UNIQUE INDEX "agent_model_binding_tenant_id_agent_id_model_id_binding_type_key" ON "agent_model_binding"("tenant_id", "agent_id", "model_id", "binding_type");
CREATE INDEX "agent_model_binding_tenant_id_agent_id_model_id_idx" ON "agent_model_binding"("tenant_id", "agent_id", "model_id");
CREATE INDEX "agent_model_binding_created_at_idx" ON "agent_model_binding"("created_at");
CREATE INDEX "agent_model_binding_updated_at_idx" ON "agent_model_binding"("updated_at");
CREATE INDEX "agent_model_binding_deleted_at_idx" ON "agent_model_binding"("deleted_at");

CREATE UNIQUE INDEX "agent_prompt_binding_tenant_id_agent_id_prompt_id_prompt_type_key" ON "agent_prompt_binding"("tenant_id", "agent_id", "prompt_id", "prompt_type");
CREATE INDEX "agent_prompt_binding_tenant_id_agent_id_prompt_id_idx" ON "agent_prompt_binding"("tenant_id", "agent_id", "prompt_id");
CREATE INDEX "agent_prompt_binding_created_at_idx" ON "agent_prompt_binding"("created_at");
CREATE INDEX "agent_prompt_binding_updated_at_idx" ON "agent_prompt_binding"("updated_at");
CREATE INDEX "agent_prompt_binding_deleted_at_idx" ON "agent_prompt_binding"("deleted_at");

CREATE UNIQUE INDEX "agent_knowledge_binding_tenant_id_agent_id_knowledge_id_key" ON "agent_knowledge_binding"("tenant_id", "agent_id", "knowledge_id");
CREATE INDEX "agent_knowledge_binding_tenant_id_agent_id_knowledge_id_idx" ON "agent_knowledge_binding"("tenant_id", "agent_id", "knowledge_id");
CREATE INDEX "agent_knowledge_binding_created_at_idx" ON "agent_knowledge_binding"("created_at");
CREATE INDEX "agent_knowledge_binding_updated_at_idx" ON "agent_knowledge_binding"("updated_at");
CREATE INDEX "agent_knowledge_binding_deleted_at_idx" ON "agent_knowledge_binding"("deleted_at");

CREATE UNIQUE INDEX "agent_tool_binding_tenant_id_agent_id_tool_id_key" ON "agent_tool_binding"("tenant_id", "agent_id", "tool_id");
CREATE INDEX "agent_tool_binding_tenant_id_agent_id_tool_id_idx" ON "agent_tool_binding"("tenant_id", "agent_id", "tool_id");
CREATE INDEX "agent_tool_binding_created_at_idx" ON "agent_tool_binding"("created_at");
CREATE INDEX "agent_tool_binding_updated_at_idx" ON "agent_tool_binding"("updated_at");
CREATE INDEX "agent_tool_binding_deleted_at_idx" ON "agent_tool_binding"("deleted_at");

CREATE UNIQUE INDEX "agent_publish_channel_tenant_id_agent_id_channel_key" ON "agent_publish_channel"("tenant_id", "agent_id", "channel");
CREATE INDEX "agent_publish_channel_tenant_id_agent_id_idx" ON "agent_publish_channel"("tenant_id", "agent_id");
CREATE INDEX "agent_publish_channel_status_idx" ON "agent_publish_channel"("status");
CREATE INDEX "agent_publish_channel_created_at_idx" ON "agent_publish_channel"("created_at");
CREATE INDEX "agent_publish_channel_updated_at_idx" ON "agent_publish_channel"("updated_at");
CREATE INDEX "agent_publish_channel_deleted_at_idx" ON "agent_publish_channel"("deleted_at");

CREATE INDEX "agent_audit_log_tenant_id_idx" ON "agent_audit_log"("tenant_id");
CREATE INDEX "agent_audit_log_tenant_id_agent_id_idx" ON "agent_audit_log"("tenant_id", "agent_id");
CREATE INDEX "agent_audit_log_action_idx" ON "agent_audit_log"("action");
CREATE INDEX "agent_audit_log_created_at_idx" ON "agent_audit_log"("created_at");

ALTER TABLE "agent_category" ADD CONSTRAINT "agent_category_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent" ADD CONSTRAINT "agent_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent" ADD CONSTRAINT "agent_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "agent_category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "agent" ADD CONSTRAINT "agent_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "agent_version" ADD CONSTRAINT "agent_version_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_version" ADD CONSTRAINT "agent_version_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_version" ADD CONSTRAINT "agent_version_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "agent_model_binding" ADD CONSTRAINT "agent_model_binding_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_model_binding" ADD CONSTRAINT "agent_model_binding_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_prompt_binding" ADD CONSTRAINT "agent_prompt_binding_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_prompt_binding" ADD CONSTRAINT "agent_prompt_binding_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_knowledge_binding" ADD CONSTRAINT "agent_knowledge_binding_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_knowledge_binding" ADD CONSTRAINT "agent_knowledge_binding_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_tool_binding" ADD CONSTRAINT "agent_tool_binding_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_tool_binding" ADD CONSTRAINT "agent_tool_binding_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_publish_channel" ADD CONSTRAINT "agent_publish_channel_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_publish_channel" ADD CONSTRAINT "agent_publish_channel_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_audit_log" ADD CONSTRAINT "agent_audit_log_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_audit_log" ADD CONSTRAINT "agent_audit_log_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_audit_log" ADD CONSTRAINT "agent_audit_log_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

