CREATE TABLE IF NOT EXISTS "external_api_key_rate_limit_window" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "api_key_id" UUID NOT NULL,
  "window_start" TIMESTAMP(3) NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "external_api_key_rate_limit_window_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "external_api_key_rate_limit_window_api_key_id_window_start_key"
  ON "external_api_key_rate_limit_window"("api_key_id", "window_start");
CREATE INDEX IF NOT EXISTS "external_api_key_rate_limit_window_tenant_id_idx"
  ON "external_api_key_rate_limit_window"("tenant_id");
CREATE INDEX IF NOT EXISTS "external_api_key_rate_limit_window_api_key_id_idx"
  ON "external_api_key_rate_limit_window"("api_key_id");
CREATE INDEX IF NOT EXISTS "external_api_key_rate_limit_window_window_start_idx"
  ON "external_api_key_rate_limit_window"("window_start");
CREATE INDEX IF NOT EXISTS "external_api_key_rate_limit_window_created_at_idx"
  ON "external_api_key_rate_limit_window"("created_at");
CREATE INDEX IF NOT EXISTS "external_api_key_rate_limit_window_updated_at_idx"
  ON "external_api_key_rate_limit_window"("updated_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND constraint_name = 'external_api_key_rate_limit_window_tenant_id_fkey'
      AND table_name = 'external_api_key_rate_limit_window'
  ) THEN
    ALTER TABLE "external_api_key_rate_limit_window"
      ADD CONSTRAINT "external_api_key_rate_limit_window_tenant_id_fkey"
      FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND constraint_name = 'external_api_key_rate_limit_window_api_key_id_fkey'
      AND table_name = 'external_api_key_rate_limit_window'
  ) THEN
    ALTER TABLE "external_api_key_rate_limit_window"
      ADD CONSTRAINT "external_api_key_rate_limit_window_api_key_id_fkey"
      FOREIGN KEY ("api_key_id") REFERENCES "api_key"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

COMMENT ON TABLE "external_api_key_rate_limit_window" IS '外部 API Key 分钟限流窗口表，用于跨服务实例共享 API Key 调用频率计数。';
COMMENT ON COLUMN "external_api_key_rate_limit_window"."id" IS '限流窗口主键 ID。';
COMMENT ON COLUMN "external_api_key_rate_limit_window"."tenant_id" IS '所属租户 ID。';
COMMENT ON COLUMN "external_api_key_rate_limit_window"."api_key_id" IS '关联外部 API Key ID。';
COMMENT ON COLUMN "external_api_key_rate_limit_window"."window_start" IS '分钟窗口开始时间，按自然分钟截断。';
COMMENT ON COLUMN "external_api_key_rate_limit_window"."count" IS '当前分钟窗口内已预占调用次数。';
COMMENT ON COLUMN "external_api_key_rate_limit_window"."created_at" IS '创建时间。';
COMMENT ON COLUMN "external_api_key_rate_limit_window"."updated_at" IS '更新时间。';
