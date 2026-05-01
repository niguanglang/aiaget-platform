CREATE TABLE IF NOT EXISTS "system_setting" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "category" VARCHAR(80) NOT NULL,
  "key" VARCHAR(120) NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "description" TEXT,
  "value" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "default_value" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "value_type" VARCHAR(40) NOT NULL,
  "options" JSONB,
  "is_secret" BOOLEAN NOT NULL DEFAULT false,
  "is_system" BOOLEAN NOT NULL DEFAULT true,
  "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "system_setting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "system_setting_tenant_id_key_key" ON "system_setting"("tenant_id", "key");
CREATE INDEX IF NOT EXISTS "system_setting_tenant_id_idx" ON "system_setting"("tenant_id");
CREATE INDEX IF NOT EXISTS "system_setting_category_idx" ON "system_setting"("category");
CREATE INDEX IF NOT EXISTS "system_setting_key_idx" ON "system_setting"("key");
CREATE INDEX IF NOT EXISTS "system_setting_value_type_idx" ON "system_setting"("value_type");
CREATE INDEX IF NOT EXISTS "system_setting_is_secret_idx" ON "system_setting"("is_secret");
CREATE INDEX IF NOT EXISTS "system_setting_is_system_idx" ON "system_setting"("is_system");
CREATE INDEX IF NOT EXISTS "system_setting_status_idx" ON "system_setting"("status");
CREATE INDEX IF NOT EXISTS "system_setting_sort_order_idx" ON "system_setting"("sort_order");
CREATE INDEX IF NOT EXISTS "system_setting_created_at_idx" ON "system_setting"("created_at");
CREATE INDEX IF NOT EXISTS "system_setting_updated_at_idx" ON "system_setting"("updated_at");
CREATE INDEX IF NOT EXISTS "system_setting_deleted_at_idx" ON "system_setting"("deleted_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND constraint_name = 'system_setting_tenant_id_fkey'
      AND table_name = 'system_setting'
  ) THEN
    ALTER TABLE "system_setting"
      ADD CONSTRAINT "system_setting_tenant_id_fkey"
      FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND constraint_name = 'system_setting_updated_by_fkey'
      AND table_name = 'system_setting'
  ) THEN
    ALTER TABLE "system_setting"
      ADD CONSTRAINT "system_setting_updated_by_fkey"
      FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

INSERT INTO "permission" ("id", "tenant_id", "code", "name", "module", "resource", "action", "created_at", "updated_at")
SELECT gen_random_uuid(), t."id", 'system:settings:manage', 'System Settings Manage', 'system', 'settings', 'manage', now(), now()
FROM "tenant" t
WHERE NOT EXISTS (
  SELECT 1
  FROM "permission" p
  WHERE p."tenant_id" = t."id"
    AND p."code" = 'system:settings:manage'
);

INSERT INTO "role_permission" ("id", "tenant_id", "role_id", "permission_id", "created_at", "updated_at")
SELECT gen_random_uuid(), r."tenant_id", r."id", p."id", now(), now()
FROM "role" r
JOIN "permission" p ON p."tenant_id" = r."tenant_id"
WHERE r."code" IN ('tenant_admin', 'tenant_operator')
  AND p."code" = 'system:settings:manage'
  AND NOT EXISTS (
    SELECT 1
    FROM "role_permission" rp
    WHERE rp."tenant_id" = r."tenant_id"
      AND rp."role_id" = r."id"
      AND rp."permission_id" = p."id"
  );

WITH defaults AS (
  SELECT *
  FROM (
    VALUES
      ('GENERAL', 'default_locale', '默认语言', '控制台默认语言与本地化展示。', '"zh-CN"'::jsonb, '"zh-CN"'::jsonb, 'SELECT', '[{"label":"简体中文","value":"zh-CN"},{"label":"英文","value":"en-US"}]'::jsonb, false, 10),
      ('GENERAL', 'workspace_name', '工作区名称', '展示在控制台和外部调用响应里的工作区名称。', '"企业 Agent 平台"'::jsonb, '"企业 Agent 平台"'::jsonb, 'STRING', NULL::jsonb, false, 20),
      ('SECURITY', 'session_timeout_minutes', '会话超时分钟数', '用户长期无操作后的登录会话过期时间。', '120'::jsonb, '120'::jsonb, 'NUMBER', NULL::jsonb, false, 10),
      ('SECURITY', 'api_key_ip_allowlist_required', 'API Key 必须配置 IP 白名单', '启用后新建外部调用密钥必须提供 IP 白名单。', 'false'::jsonb, 'false'::jsonb, 'BOOLEAN', NULL::jsonb, false, 20),
      ('RUNTIME', 'runtime_stream_enabled', '运行时流式输出', '控制 Agent Runtime 是否默认允许 SSE 流式响应。', 'true'::jsonb, 'true'::jsonb, 'BOOLEAN', NULL::jsonb, false, 10),
      ('RUNTIME', 'runtime_default_temperature', '默认温度', 'Agent 未单独设置模型温度时使用的默认值。', '0.4'::jsonb, '0.4'::jsonb, 'NUMBER', NULL::jsonb, false, 20),
      ('OBSERVABILITY', 'trace_sample_rate', 'Trace 采样率', 'OpenTelemetry 链路追踪采样比例，取值范围 0 到 1。', '1'::jsonb, '1'::jsonb, 'NUMBER', NULL::jsonb, false, 10),
      ('OBSERVABILITY', 'monitor_error_alert_enabled', '异常告警开关', '启用后监控中心会记录并展示异常告警信号。', 'true'::jsonb, 'true'::jsonb, 'BOOLEAN', NULL::jsonb, false, 20),
      ('RETENTION', 'audit_retention_days', '审计日志保留天数', '审计与操作日志建议保留时长。', '180'::jsonb, '180'::jsonb, 'NUMBER', NULL::jsonb, false, 10),
      ('RETENTION', 'conversation_retention_days', '会话记录保留天数', '会话与运行记录建议保留时长。', '90'::jsonb, '90'::jsonb, 'NUMBER', NULL::jsonb, false, 20),
      ('INTEGRATION', 'external_webhook_url', '外部 Webhook 地址', '用于后续集成审批、告警或自动化通知的 Webhook 地址。', '""'::jsonb, '""'::jsonb, 'STRING', NULL::jsonb, true, 10),
      ('INTEGRATION', 'minio_public_base_url', '文件公开访问基址', '用于生成对象存储文件预览或下载链接的外部基址。', '""'::jsonb, '""'::jsonb, 'STRING', NULL::jsonb, false, 20)
  ) AS d("category", "key", "name", "description", "value", "default_value", "value_type", "options", "is_secret", "sort_order")
)
INSERT INTO "system_setting" (
  "id",
  "tenant_id",
  "category",
  "key",
  "name",
  "description",
  "value",
  "default_value",
  "value_type",
  "options",
  "is_secret",
  "is_system",
  "status",
  "sort_order",
  "created_at",
  "updated_at"
)
SELECT
  gen_random_uuid(),
  t."id",
  d."category",
  d."key",
  d."name",
  d."description",
  d."value",
  d."default_value",
  d."value_type",
  d."options",
  d."is_secret",
  true,
  'ACTIVE',
  d."sort_order",
  now(),
  now()
FROM "tenant" t
CROSS JOIN defaults d
WHERE NOT EXISTS (
  SELECT 1
  FROM "system_setting" s
  WHERE s."tenant_id" = t."id"
    AND s."key" = d."key"
);

COMMENT ON TABLE "system_setting" IS '系统设置参数表，用于按租户维护基础、安全、运行时、观测、数据保留和集成配置。';
COMMENT ON COLUMN "system_setting"."id" IS '系统设置 ID。';
COMMENT ON COLUMN "system_setting"."tenant_id" IS '所属租户 ID。';
COMMENT ON COLUMN "system_setting"."category" IS '设置分类，GENERAL 基础、SECURITY 安全、RUNTIME 运行时、OBSERVABILITY 观测、RETENTION 数据保留、INTEGRATION 外部集成。';
COMMENT ON COLUMN "system_setting"."key" IS '设置键名，在租户内唯一。';
COMMENT ON COLUMN "system_setting"."name" IS '设置展示名称。';
COMMENT ON COLUMN "system_setting"."description" IS '设置说明。';
COMMENT ON COLUMN "system_setting"."value" IS '当前设置值，使用 JSONB 存储以兼容文本、数字、布尔、对象和数组。';
COMMENT ON COLUMN "system_setting"."default_value" IS '默认设置值，用于恢复默认和判断是否偏离默认。';
COMMENT ON COLUMN "system_setting"."value_type" IS '设置值类型，STRING、NUMBER、BOOLEAN、JSON、SELECT。';
COMMENT ON COLUMN "system_setting"."options" IS '下拉或枚举选项 JSON 数组。';
COMMENT ON COLUMN "system_setting"."is_secret" IS '是否为敏感设置，敏感值前端默认脱敏展示。';
COMMENT ON COLUMN "system_setting"."is_system" IS '是否为系统内置设置。';
COMMENT ON COLUMN "system_setting"."status" IS '设置状态，ACTIVE 启用、DISABLED 停用、DELETED 已删除。';
COMMENT ON COLUMN "system_setting"."sort_order" IS '分类内排序号。';
COMMENT ON COLUMN "system_setting"."created_at" IS '创建时间。';
COMMENT ON COLUMN "system_setting"."updated_at" IS '更新时间。';
COMMENT ON COLUMN "system_setting"."deleted_at" IS '软删除时间。';
COMMENT ON COLUMN "system_setting"."created_by" IS '创建人用户 ID。';
COMMENT ON COLUMN "system_setting"."updated_by" IS '最近更新人用户 ID。';
