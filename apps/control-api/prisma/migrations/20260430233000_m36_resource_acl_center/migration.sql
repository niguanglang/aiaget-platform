CREATE TABLE IF NOT EXISTS "resource_acl" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "resource_type" VARCHAR(80) NOT NULL,
  "resource_id" UUID NOT NULL,
  "subject_type" VARCHAR(50) NOT NULL,
  "subject_id" UUID NOT NULL,
  "permission_code" VARCHAR(120) NOT NULL,
  "effect" VARCHAR(20) NOT NULL DEFAULT 'ALLOW',
  "conditions" JSONB,
  "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "resource_acl_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "resource_acl_tenant_resource_subject_permission_key" ON "resource_acl"("tenant_id", "resource_type", "resource_id", "subject_type", "subject_id", "permission_code");
CREATE INDEX IF NOT EXISTS "resource_acl_tenant_id_idx" ON "resource_acl"("tenant_id");
CREATE INDEX IF NOT EXISTS "resource_acl_resource_type_idx" ON "resource_acl"("resource_type");
CREATE INDEX IF NOT EXISTS "resource_acl_resource_id_idx" ON "resource_acl"("resource_id");
CREATE INDEX IF NOT EXISTS "resource_acl_subject_type_idx" ON "resource_acl"("subject_type");
CREATE INDEX IF NOT EXISTS "resource_acl_subject_id_idx" ON "resource_acl"("subject_id");
CREATE INDEX IF NOT EXISTS "resource_acl_permission_code_idx" ON "resource_acl"("permission_code");
CREATE INDEX IF NOT EXISTS "resource_acl_effect_idx" ON "resource_acl"("effect");
CREATE INDEX IF NOT EXISTS "resource_acl_status_idx" ON "resource_acl"("status");
CREATE INDEX IF NOT EXISTS "resource_acl_created_at_idx" ON "resource_acl"("created_at");
CREATE INDEX IF NOT EXISTS "resource_acl_updated_at_idx" ON "resource_acl"("updated_at");
CREATE INDEX IF NOT EXISTS "resource_acl_deleted_at_idx" ON "resource_acl"("deleted_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'resource_acl_tenant_id_fkey'
  ) THEN
    ALTER TABLE "resource_acl"
      ADD CONSTRAINT "resource_acl_tenant_id_fkey"
      FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

COMMENT ON TABLE "resource_acl" IS '资源级授权表，用于记录具体 Agent、知识库、工具、模型等资源授权给用户、角色、部门或租户主体的 ACL 规则。';
COMMENT ON COLUMN "resource_acl"."id" IS '资源授权 ID。';
COMMENT ON COLUMN "resource_acl"."tenant_id" IS '所属租户 ID。';
COMMENT ON COLUMN "resource_acl"."resource_type" IS '资源类型，例如 AGENT、KNOWLEDGE_BASE、DOCUMENT、TOOL、MODEL、CONVERSATION、AUDIT_LOG。';
COMMENT ON COLUMN "resource_acl"."resource_id" IS '被授权资源 ID。';
COMMENT ON COLUMN "resource_acl"."subject_type" IS '授权主体类型，USER 用户、ROLE 角色、DEPARTMENT 部门、TENANT 租户。';
COMMENT ON COLUMN "resource_acl"."subject_id" IS '授权主体 ID。';
COMMENT ON COLUMN "resource_acl"."permission_code" IS '授权权限编码，例如 agent:agent:view、knowledge:base:manage。';
COMMENT ON COLUMN "resource_acl"."effect" IS '授权效果，ALLOW 允许、DENY 拒绝。';
COMMENT ON COLUMN "resource_acl"."conditions" IS '可选条件 JSON，用于预留上下文、时段、风险等级等细粒度条件。';
COMMENT ON COLUMN "resource_acl"."status" IS '授权状态，ACTIVE 启用、DISABLED 停用、DELETED 已删除。';
COMMENT ON COLUMN "resource_acl"."created_at" IS '创建时间。';
COMMENT ON COLUMN "resource_acl"."updated_at" IS '更新时间。';
COMMENT ON COLUMN "resource_acl"."deleted_at" IS '软删除时间。';
COMMENT ON COLUMN "resource_acl"."created_by" IS '创建人用户 ID。';
COMMENT ON COLUMN "resource_acl"."updated_by" IS '最近更新人用户 ID。';
