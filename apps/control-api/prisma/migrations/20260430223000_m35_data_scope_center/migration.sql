CREATE TABLE IF NOT EXISTS "role_data_scope" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "role_id" UUID NOT NULL,
  "resource_type" VARCHAR(80) NOT NULL,
  "scope_type" VARCHAR(50) NOT NULL,
  "scope_value" JSONB,
  "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "role_data_scope_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "role_data_scope_tenant_id_role_id_resource_type_key" ON "role_data_scope"("tenant_id", "role_id", "resource_type");
CREATE INDEX IF NOT EXISTS "role_data_scope_tenant_id_idx" ON "role_data_scope"("tenant_id");
CREATE INDEX IF NOT EXISTS "role_data_scope_role_id_idx" ON "role_data_scope"("role_id");
CREATE INDEX IF NOT EXISTS "role_data_scope_resource_type_idx" ON "role_data_scope"("resource_type");
CREATE INDEX IF NOT EXISTS "role_data_scope_scope_type_idx" ON "role_data_scope"("scope_type");
CREATE INDEX IF NOT EXISTS "role_data_scope_status_idx" ON "role_data_scope"("status");
CREATE INDEX IF NOT EXISTS "role_data_scope_created_at_idx" ON "role_data_scope"("created_at");
CREATE INDEX IF NOT EXISTS "role_data_scope_updated_at_idx" ON "role_data_scope"("updated_at");
CREATE INDEX IF NOT EXISTS "role_data_scope_deleted_at_idx" ON "role_data_scope"("deleted_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'role_data_scope_tenant_id_fkey'
  ) THEN
    ALTER TABLE "role_data_scope"
      ADD CONSTRAINT "role_data_scope_tenant_id_fkey"
      FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'role_data_scope_role_id_fkey'
  ) THEN
    ALTER TABLE "role_data_scope"
      ADD CONSTRAINT "role_data_scope_role_id_fkey"
      FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

COMMENT ON TABLE "role_data_scope" IS '角色数据权限范围表，用于按角色和资源类型配置 ALL、TENANT、DEPT、DEPT_AND_CHILD、SELF、CUSTOM 数据范围。';
COMMENT ON COLUMN "role_data_scope"."id" IS '角色数据权限范围 ID。';
COMMENT ON COLUMN "role_data_scope"."tenant_id" IS '所属租户 ID。';
COMMENT ON COLUMN "role_data_scope"."role_id" IS '关联角色 ID。';
COMMENT ON COLUMN "role_data_scope"."resource_type" IS '资源类型，例如 AGENT、KNOWLEDGE_BASE、DOCUMENT、TOOL、MODEL、CONVERSATION、AUDIT_LOG。';
COMMENT ON COLUMN "role_data_scope"."scope_type" IS '数据范围类型，ALL 全部数据、TENANT 本租户、DEPT 本部门、DEPT_AND_CHILD 本部门及子部门、SELF 本人、CUSTOM 自定义。';
COMMENT ON COLUMN "role_data_scope"."scope_value" IS '数据范围配置 JSON，包含 department_ids、user_ids、resource_ids、include_children 等自定义范围。';
COMMENT ON COLUMN "role_data_scope"."status" IS '数据权限配置状态，ACTIVE 启用、DISABLED 停用、DELETED 已删除。';
COMMENT ON COLUMN "role_data_scope"."created_at" IS '创建时间。';
COMMENT ON COLUMN "role_data_scope"."updated_at" IS '更新时间。';
COMMENT ON COLUMN "role_data_scope"."deleted_at" IS '软删除时间。';
COMMENT ON COLUMN "role_data_scope"."created_by" IS '创建人用户 ID。';
COMMENT ON COLUMN "role_data_scope"."updated_by" IS '最近更新人用户 ID。';
