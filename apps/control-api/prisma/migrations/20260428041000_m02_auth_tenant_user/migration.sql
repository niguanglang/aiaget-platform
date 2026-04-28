CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE "tenant" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "code" VARCHAR(80) NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "tenant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "email" VARCHAR(180) NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "password_hash" VARCHAR(255) NOT NULL,
  "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  "last_login_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "role" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "code" VARCHAR(80) NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "description" TEXT,
  "is_system" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "permission" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "code" VARCHAR(120) NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "module" VARCHAR(80) NOT NULL,
  "action" VARCHAR(80) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "permission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_role" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "role_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "user_role_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "role_permission" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "role_id" UUID NOT NULL,
  "permission_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "role_permission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "api_key" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "key_prefix" VARCHAR(30) NOT NULL,
  "key_hash" VARCHAR(255) NOT NULL,
  "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  "expires_at" TIMESTAMP(3),
  "last_used_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "api_key_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "login_log" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "user_id" UUID,
  "email" VARCHAR(180) NOT NULL,
  "status" VARCHAR(30) NOT NULL,
  "ip" VARCHAR(80),
  "user_agent" VARCHAR(500),
  "error_message" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "login_log_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "operation_log" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "user_id" UUID,
  "module" VARCHAR(80) NOT NULL,
  "action" VARCHAR(80) NOT NULL,
  "method" VARCHAR(20) NOT NULL,
  "path" VARCHAR(500) NOT NULL,
  "status_code" INTEGER NOT NULL,
  "request_id" VARCHAR(120) NOT NULL,
  "ip" VARCHAR(80),
  "user_agent" VARCHAR(500),
  "request_summary" JSONB,
  "error_message" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "operation_log_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "refresh_token" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "token_hash" VARCHAR(255) NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "revoked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tenant_code_key" ON "tenant"("code");
CREATE INDEX "tenant_status_idx" ON "tenant"("status");
CREATE INDEX "tenant_created_at_idx" ON "tenant"("created_at");
CREATE INDEX "tenant_updated_at_idx" ON "tenant"("updated_at");
CREATE INDEX "tenant_deleted_at_idx" ON "tenant"("deleted_at");

CREATE UNIQUE INDEX "user_tenant_id_email_key" ON "user"("tenant_id", "email");
CREATE INDEX "user_tenant_id_idx" ON "user"("tenant_id");
CREATE INDEX "user_status_idx" ON "user"("status");
CREATE INDEX "user_created_at_idx" ON "user"("created_at");
CREATE INDEX "user_updated_at_idx" ON "user"("updated_at");
CREATE INDEX "user_deleted_at_idx" ON "user"("deleted_at");

CREATE UNIQUE INDEX "role_tenant_id_code_key" ON "role"("tenant_id", "code");
CREATE INDEX "role_tenant_id_idx" ON "role"("tenant_id");
CREATE INDEX "role_created_at_idx" ON "role"("created_at");
CREATE INDEX "role_updated_at_idx" ON "role"("updated_at");
CREATE INDEX "role_deleted_at_idx" ON "role"("deleted_at");

CREATE UNIQUE INDEX "permission_tenant_id_code_key" ON "permission"("tenant_id", "code");
CREATE INDEX "permission_tenant_id_idx" ON "permission"("tenant_id");
CREATE INDEX "permission_module_idx" ON "permission"("module");
CREATE INDEX "permission_created_at_idx" ON "permission"("created_at");
CREATE INDEX "permission_updated_at_idx" ON "permission"("updated_at");
CREATE INDEX "permission_deleted_at_idx" ON "permission"("deleted_at");

CREATE UNIQUE INDEX "user_role_tenant_id_user_id_role_id_key" ON "user_role"("tenant_id", "user_id", "role_id");
CREATE INDEX "user_role_tenant_id_user_id_role_id_idx" ON "user_role"("tenant_id", "user_id", "role_id");
CREATE INDEX "user_role_created_at_idx" ON "user_role"("created_at");
CREATE INDEX "user_role_updated_at_idx" ON "user_role"("updated_at");
CREATE INDEX "user_role_deleted_at_idx" ON "user_role"("deleted_at");

CREATE UNIQUE INDEX "role_permission_tenant_id_role_id_permission_id_key" ON "role_permission"("tenant_id", "role_id", "permission_id");
CREATE INDEX "role_permission_tenant_id_role_id_permission_id_idx" ON "role_permission"("tenant_id", "role_id", "permission_id");
CREATE INDEX "role_permission_created_at_idx" ON "role_permission"("created_at");
CREATE INDEX "role_permission_updated_at_idx" ON "role_permission"("updated_at");
CREATE INDEX "role_permission_deleted_at_idx" ON "role_permission"("deleted_at");

CREATE INDEX "api_key_tenant_id_idx" ON "api_key"("tenant_id");
CREATE INDEX "api_key_status_idx" ON "api_key"("status");
CREATE INDEX "api_key_created_at_idx" ON "api_key"("created_at");
CREATE INDEX "api_key_updated_at_idx" ON "api_key"("updated_at");
CREATE INDEX "api_key_deleted_at_idx" ON "api_key"("deleted_at");

CREATE INDEX "login_log_tenant_id_idx" ON "login_log"("tenant_id");
CREATE INDEX "login_log_user_id_idx" ON "login_log"("user_id");
CREATE INDEX "login_log_status_idx" ON "login_log"("status");
CREATE INDEX "login_log_created_at_idx" ON "login_log"("created_at");

CREATE INDEX "operation_log_tenant_id_idx" ON "operation_log"("tenant_id");
CREATE INDEX "operation_log_user_id_idx" ON "operation_log"("user_id");
CREATE INDEX "operation_log_module_idx" ON "operation_log"("module");
CREATE INDEX "operation_log_action_idx" ON "operation_log"("action");
CREATE INDEX "operation_log_request_id_idx" ON "operation_log"("request_id");
CREATE INDEX "operation_log_created_at_idx" ON "operation_log"("created_at");

CREATE UNIQUE INDEX "refresh_token_token_hash_key" ON "refresh_token"("token_hash");
CREATE INDEX "refresh_token_tenant_id_idx" ON "refresh_token"("tenant_id");
CREATE INDEX "refresh_token_user_id_idx" ON "refresh_token"("user_id");
CREATE INDEX "refresh_token_expires_at_idx" ON "refresh_token"("expires_at");
CREATE INDEX "refresh_token_revoked_at_idx" ON "refresh_token"("revoked_at");

ALTER TABLE "user" ADD CONSTRAINT "user_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "role" ADD CONSTRAINT "role_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "permission" ADD CONSTRAINT "permission_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "api_key" ADD CONSTRAINT "api_key_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "login_log" ADD CONSTRAINT "login_log_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "login_log" ADD CONSTRAINT "login_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "operation_log" ADD CONSTRAINT "operation_log_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "operation_log" ADD CONSTRAINT "operation_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

