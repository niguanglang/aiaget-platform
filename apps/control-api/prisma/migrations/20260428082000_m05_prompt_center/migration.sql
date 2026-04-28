CREATE TABLE "prompt_template" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "owner_id" UUID,
  "name" VARCHAR(160) NOT NULL,
  "code" VARCHAR(100) NOT NULL,
  "type" VARCHAR(30) NOT NULL DEFAULT 'SYSTEM',
  "status" VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
  "version" INTEGER NOT NULL DEFAULT 0,
  "description" TEXT,
  "content" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "prompt_template_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "prompt_version" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "template_id" UUID NOT NULL,
  "version" INTEGER NOT NULL,
  "status" VARCHAR(30) NOT NULL DEFAULT 'PUBLISHED',
  "snapshot" JSONB NOT NULL,
  "content" TEXT NOT NULL,
  "change_note" TEXT,
  "published_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "prompt_version_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "prompt_variable" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "template_id" UUID NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "variable_type" VARCHAR(30) NOT NULL DEFAULT 'string',
  "default_value" TEXT,
  "is_required" BOOLEAN NOT NULL DEFAULT false,
  "description" TEXT,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "prompt_variable_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "prompt_test_record" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "template_id" UUID NOT NULL,
  "version" INTEGER,
  "model_provider_id" UUID,
  "model_config_id" UUID,
  "inputs" JSONB NOT NULL,
  "rendered_content" TEXT NOT NULL,
  "status" VARCHAR(30) NOT NULL,
  "latency_ms" INTEGER NOT NULL DEFAULT 0,
  "output_text" TEXT,
  "error_message" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" UUID,
  CONSTRAINT "prompt_test_record_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "prompt_template_tenant_id_code_key" ON "prompt_template"("tenant_id", "code");
CREATE INDEX "prompt_template_tenant_id_idx" ON "prompt_template"("tenant_id");
CREATE INDEX "prompt_template_owner_id_idx" ON "prompt_template"("owner_id");
CREATE INDEX "prompt_template_type_idx" ON "prompt_template"("type");
CREATE INDEX "prompt_template_status_idx" ON "prompt_template"("status");
CREATE INDEX "prompt_template_created_at_idx" ON "prompt_template"("created_at");
CREATE INDEX "prompt_template_updated_at_idx" ON "prompt_template"("updated_at");
CREATE INDEX "prompt_template_deleted_at_idx" ON "prompt_template"("deleted_at");

CREATE UNIQUE INDEX "prompt_version_tenant_id_template_id_version_key" ON "prompt_version"("tenant_id", "template_id", "version");
CREATE INDEX "prompt_version_tenant_id_idx" ON "prompt_version"("tenant_id");
CREATE INDEX "prompt_version_template_id_idx" ON "prompt_version"("template_id");
CREATE INDEX "prompt_version_status_idx" ON "prompt_version"("status");
CREATE INDEX "prompt_version_published_at_idx" ON "prompt_version"("published_at");
CREATE INDEX "prompt_version_created_at_idx" ON "prompt_version"("created_at");
CREATE INDEX "prompt_version_updated_at_idx" ON "prompt_version"("updated_at");
CREATE INDEX "prompt_version_deleted_at_idx" ON "prompt_version"("deleted_at");

CREATE UNIQUE INDEX "prompt_variable_tenant_id_template_id_name_key" ON "prompt_variable"("tenant_id", "template_id", "name");
CREATE INDEX "prompt_variable_tenant_id_idx" ON "prompt_variable"("tenant_id");
CREATE INDEX "prompt_variable_template_id_idx" ON "prompt_variable"("template_id");
CREATE INDEX "prompt_variable_name_idx" ON "prompt_variable"("name");
CREATE INDEX "prompt_variable_created_at_idx" ON "prompt_variable"("created_at");
CREATE INDEX "prompt_variable_updated_at_idx" ON "prompt_variable"("updated_at");
CREATE INDEX "prompt_variable_deleted_at_idx" ON "prompt_variable"("deleted_at");

CREATE INDEX "prompt_test_record_tenant_id_idx" ON "prompt_test_record"("tenant_id");
CREATE INDEX "prompt_test_record_template_id_idx" ON "prompt_test_record"("template_id");
CREATE INDEX "prompt_test_record_model_provider_id_idx" ON "prompt_test_record"("model_provider_id");
CREATE INDEX "prompt_test_record_model_config_id_idx" ON "prompt_test_record"("model_config_id");
CREATE INDEX "prompt_test_record_status_idx" ON "prompt_test_record"("status");
CREATE INDEX "prompt_test_record_created_at_idx" ON "prompt_test_record"("created_at");

ALTER TABLE "prompt_template" ADD CONSTRAINT "prompt_template_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "prompt_template" ADD CONSTRAINT "prompt_template_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "prompt_version" ADD CONSTRAINT "prompt_version_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "prompt_version" ADD CONSTRAINT "prompt_version_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "prompt_template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "prompt_version" ADD CONSTRAINT "prompt_version_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "prompt_variable" ADD CONSTRAINT "prompt_variable_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "prompt_variable" ADD CONSTRAINT "prompt_variable_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "prompt_template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "prompt_test_record" ADD CONSTRAINT "prompt_test_record_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "prompt_test_record" ADD CONSTRAINT "prompt_test_record_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "prompt_template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "prompt_test_record" ADD CONSTRAINT "prompt_test_record_model_provider_id_fkey" FOREIGN KEY ("model_provider_id") REFERENCES "model_provider"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "prompt_test_record" ADD CONSTRAINT "prompt_test_record_model_config_id_fkey" FOREIGN KEY ("model_config_id") REFERENCES "model_config"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "prompt_test_record" ADD CONSTRAINT "prompt_test_record_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
