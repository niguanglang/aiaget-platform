CREATE TABLE "model_provider" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "code" VARCHAR(100) NOT NULL,
  "provider_type" VARCHAR(60) NOT NULL DEFAULT 'OPENAI_COMPATIBLE',
  "base_url" VARCHAR(500) NOT NULL,
  "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "description" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "model_provider_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "model_config" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "provider_id" UUID NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "model" VARCHAR(160) NOT NULL,
  "capabilities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "context_length" INTEGER NOT NULL DEFAULT 8192,
  "input_price" DECIMAL(12,6) NOT NULL DEFAULT 0,
  "output_price" DECIMAL(12,6) NOT NULL DEFAULT 0,
  "rate_limit_rpm" INTEGER,
  "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "model_config_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "model_api_key" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "provider_id" UUID NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "key_prefix" VARCHAR(30) NOT NULL,
  "masked_key" VARCHAR(120) NOT NULL,
  "encrypted_key" TEXT NOT NULL,
  "key_hash" VARCHAR(255) NOT NULL,
  "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  "last_used_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "model_api_key_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "model_cost_rule" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "provider_id" UUID NOT NULL,
  "model_config_id" UUID,
  "currency" VARCHAR(12) NOT NULL DEFAULT 'USD',
  "input_price" DECIMAL(12,6) NOT NULL DEFAULT 0,
  "output_price" DECIMAL(12,6) NOT NULL DEFAULT 0,
  "unit" VARCHAR(30) NOT NULL DEFAULT '1K_TOKENS',
  "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "model_cost_rule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "model_call_log" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "provider_id" UUID NOT NULL,
  "model_config_id" UUID,
  "trace_id" VARCHAR(120) NOT NULL,
  "request_model" VARCHAR(160) NOT NULL,
  "status" VARCHAR(30) NOT NULL,
  "prompt_tokens" INTEGER NOT NULL DEFAULT 0,
  "completion_tokens" INTEGER NOT NULL DEFAULT 0,
  "total_tokens" INTEGER NOT NULL DEFAULT 0,
  "input_cost" DECIMAL(12,6) NOT NULL DEFAULT 0,
  "output_cost" DECIMAL(12,6) NOT NULL DEFAULT 0,
  "total_cost" DECIMAL(12,6) NOT NULL DEFAULT 0,
  "latency_ms" INTEGER NOT NULL DEFAULT 0,
  "request_summary" JSONB,
  "response_summary" JSONB,
  "error_message" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "model_call_log_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "model_provider_tenant_id_code_key" ON "model_provider"("tenant_id", "code");
CREATE INDEX "model_provider_tenant_id_idx" ON "model_provider"("tenant_id");
CREATE INDEX "model_provider_provider_type_idx" ON "model_provider"("provider_type");
CREATE INDEX "model_provider_status_idx" ON "model_provider"("status");
CREATE INDEX "model_provider_is_default_idx" ON "model_provider"("is_default");
CREATE INDEX "model_provider_created_at_idx" ON "model_provider"("created_at");
CREATE INDEX "model_provider_updated_at_idx" ON "model_provider"("updated_at");
CREATE INDEX "model_provider_deleted_at_idx" ON "model_provider"("deleted_at");

CREATE UNIQUE INDEX "model_config_tenant_id_provider_id_model_key" ON "model_config"("tenant_id", "provider_id", "model");
CREATE INDEX "model_config_tenant_id_idx" ON "model_config"("tenant_id");
CREATE INDEX "model_config_provider_id_idx" ON "model_config"("provider_id");
CREATE INDEX "model_config_status_idx" ON "model_config"("status");
CREATE INDEX "model_config_is_default_idx" ON "model_config"("is_default");
CREATE INDEX "model_config_created_at_idx" ON "model_config"("created_at");
CREATE INDEX "model_config_updated_at_idx" ON "model_config"("updated_at");
CREATE INDEX "model_config_deleted_at_idx" ON "model_config"("deleted_at");

CREATE INDEX "model_api_key_tenant_id_idx" ON "model_api_key"("tenant_id");
CREATE INDEX "model_api_key_provider_id_idx" ON "model_api_key"("provider_id");
CREATE INDEX "model_api_key_status_idx" ON "model_api_key"("status");
CREATE INDEX "model_api_key_last_used_at_idx" ON "model_api_key"("last_used_at");
CREATE INDEX "model_api_key_created_at_idx" ON "model_api_key"("created_at");
CREATE INDEX "model_api_key_updated_at_idx" ON "model_api_key"("updated_at");
CREATE INDEX "model_api_key_deleted_at_idx" ON "model_api_key"("deleted_at");

CREATE INDEX "model_cost_rule_tenant_id_idx" ON "model_cost_rule"("tenant_id");
CREATE INDEX "model_cost_rule_provider_id_idx" ON "model_cost_rule"("provider_id");
CREATE INDEX "model_cost_rule_model_config_id_idx" ON "model_cost_rule"("model_config_id");
CREATE INDEX "model_cost_rule_status_idx" ON "model_cost_rule"("status");
CREATE INDEX "model_cost_rule_effective_from_idx" ON "model_cost_rule"("effective_from");
CREATE INDEX "model_cost_rule_created_at_idx" ON "model_cost_rule"("created_at");
CREATE INDEX "model_cost_rule_updated_at_idx" ON "model_cost_rule"("updated_at");
CREATE INDEX "model_cost_rule_deleted_at_idx" ON "model_cost_rule"("deleted_at");

CREATE INDEX "model_call_log_tenant_id_idx" ON "model_call_log"("tenant_id");
CREATE INDEX "model_call_log_provider_id_idx" ON "model_call_log"("provider_id");
CREATE INDEX "model_call_log_model_config_id_idx" ON "model_call_log"("model_config_id");
CREATE INDEX "model_call_log_trace_id_idx" ON "model_call_log"("trace_id");
CREATE INDEX "model_call_log_status_idx" ON "model_call_log"("status");
CREATE INDEX "model_call_log_created_at_idx" ON "model_call_log"("created_at");

ALTER TABLE "model_provider" ADD CONSTRAINT "model_provider_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "model_config" ADD CONSTRAINT "model_config_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "model_config" ADD CONSTRAINT "model_config_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "model_provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "model_api_key" ADD CONSTRAINT "model_api_key_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "model_api_key" ADD CONSTRAINT "model_api_key_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "model_provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "model_cost_rule" ADD CONSTRAINT "model_cost_rule_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "model_cost_rule" ADD CONSTRAINT "model_cost_rule_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "model_provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "model_cost_rule" ADD CONSTRAINT "model_cost_rule_model_config_id_fkey" FOREIGN KEY ("model_config_id") REFERENCES "model_config"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "model_call_log" ADD CONSTRAINT "model_call_log_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "model_call_log" ADD CONSTRAINT "model_call_log_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "model_provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "model_call_log" ADD CONSTRAINT "model_call_log_model_config_id_fkey" FOREIGN KEY ("model_config_id") REFERENCES "model_config"("id") ON DELETE SET NULL ON UPDATE CASCADE;
