CREATE TABLE IF NOT EXISTS "system_setting_snapshot" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "setting_id" UUID NOT NULL,
  "setting_key" VARCHAR(120) NOT NULL,
  "setting_name" VARCHAR(160) NOT NULL,
  "version" INTEGER NOT NULL,
  "action" VARCHAR(40) NOT NULL,
  "previous_value" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "next_value" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "previous_status" VARCHAR(30) NOT NULL,
  "next_status" VARCHAR(30) NOT NULL,
  "approval_status" VARCHAR(40) NOT NULL DEFAULT 'NOT_REQUIRED',
  "approval_request_id" VARCHAR(120),
  "rollback_from_snapshot_id" UUID,
  "rollback_count" INTEGER NOT NULL DEFAULT 0,
  "impact_level" VARCHAR(30),
  "impact_summary" TEXT,
  "created_by" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "system_setting_snapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "system_setting_snapshot_tenant_id_setting_id_version_key" ON "system_setting_snapshot"("tenant_id", "setting_id", "version");
CREATE INDEX IF NOT EXISTS "system_setting_snapshot_tenant_id_idx" ON "system_setting_snapshot"("tenant_id");
CREATE INDEX IF NOT EXISTS "system_setting_snapshot_setting_id_idx" ON "system_setting_snapshot"("setting_id");
CREATE INDEX IF NOT EXISTS "system_setting_snapshot_setting_key_idx" ON "system_setting_snapshot"("setting_key");
CREATE INDEX IF NOT EXISTS "system_setting_snapshot_action_idx" ON "system_setting_snapshot"("action");
CREATE INDEX IF NOT EXISTS "system_setting_snapshot_approval_status_idx" ON "system_setting_snapshot"("approval_status");
CREATE INDEX IF NOT EXISTS "system_setting_snapshot_rollback_from_snapshot_id_idx" ON "system_setting_snapshot"("rollback_from_snapshot_id");
CREATE INDEX IF NOT EXISTS "system_setting_snapshot_created_by_idx" ON "system_setting_snapshot"("created_by");
CREATE INDEX IF NOT EXISTS "system_setting_snapshot_created_at_idx" ON "system_setting_snapshot"("created_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND constraint_name = 'system_setting_snapshot_tenant_id_fkey'
      AND table_name = 'system_setting_snapshot'
  ) THEN
    ALTER TABLE "system_setting_snapshot"
      ADD CONSTRAINT "system_setting_snapshot_tenant_id_fkey"
      FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND constraint_name = 'system_setting_snapshot_setting_id_fkey'
      AND table_name = 'system_setting_snapshot'
  ) THEN
    ALTER TABLE "system_setting_snapshot"
      ADD CONSTRAINT "system_setting_snapshot_setting_id_fkey"
      FOREIGN KEY ("setting_id") REFERENCES "system_setting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND constraint_name = 'system_setting_snapshot_created_by_fkey'
      AND table_name = 'system_setting_snapshot'
  ) THEN
    ALTER TABLE "system_setting_snapshot"
      ADD CONSTRAINT "system_setting_snapshot_created_by_fkey"
      FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

COMMENT ON TABLE "system_setting_snapshot" IS '系统设置版本快照表，用于记录租户级系统设置变更前后的值、状态、审批预留和回滚来源。';
COMMENT ON COLUMN "system_setting_snapshot"."id" IS '系统设置快照 ID。';
COMMENT ON COLUMN "system_setting_snapshot"."tenant_id" IS '所属租户 ID。';
COMMENT ON COLUMN "system_setting_snapshot"."setting_id" IS '关联系统设置 ID。';
COMMENT ON COLUMN "system_setting_snapshot"."setting_key" IS '系统设置键名快照。';
COMMENT ON COLUMN "system_setting_snapshot"."setting_name" IS '系统设置名称快照。';
COMMENT ON COLUMN "system_setting_snapshot"."version" IS '该设置在租户内的递增版本号。';
COMMENT ON COLUMN "system_setting_snapshot"."action" IS '快照动作，UPDATE 更新、RESET 恢复默认、ROLLBACK 回滚。';
COMMENT ON COLUMN "system_setting_snapshot"."previous_value" IS '变更前设置值。';
COMMENT ON COLUMN "system_setting_snapshot"."next_value" IS '变更后设置值。';
COMMENT ON COLUMN "system_setting_snapshot"."previous_status" IS '变更前设置状态。';
COMMENT ON COLUMN "system_setting_snapshot"."next_status" IS '变更后设置状态。';
COMMENT ON COLUMN "system_setting_snapshot"."approval_status" IS '审批状态预留，NOT_REQUIRED 不需要审批、RESERVED 预留、PENDING 待审批、APPROVED 已通过、REJECTED 已拒绝。';
COMMENT ON COLUMN "system_setting_snapshot"."approval_request_id" IS '审批请求 ID 预留，用于后续接入安全中心审批流。';
COMMENT ON COLUMN "system_setting_snapshot"."rollback_from_snapshot_id" IS '回滚来源快照 ID。';
COMMENT ON COLUMN "system_setting_snapshot"."rollback_count" IS '该快照被用于回滚的次数。';
COMMENT ON COLUMN "system_setting_snapshot"."impact_level" IS '变更影响等级快照，LOW、MEDIUM、HIGH。';
COMMENT ON COLUMN "system_setting_snapshot"."impact_summary" IS '变更影响摘要快照。';
COMMENT ON COLUMN "system_setting_snapshot"."created_by" IS '创建快照的用户 ID。';
COMMENT ON COLUMN "system_setting_snapshot"."created_at" IS '快照创建时间。';
