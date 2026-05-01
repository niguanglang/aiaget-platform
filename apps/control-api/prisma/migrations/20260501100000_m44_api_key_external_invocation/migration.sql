ALTER TABLE "api_key" ADD COLUMN IF NOT EXISTS "scopes" JSONB;
ALTER TABLE "api_key" ADD COLUMN IF NOT EXISTS "allowed_agent_ids" JSONB;
ALTER TABLE "api_key" ADD COLUMN IF NOT EXISTS "ip_allowlist" JSONB;
ALTER TABLE "api_key" ADD COLUMN IF NOT EXISTS "rate_limit_per_minute" INTEGER NOT NULL DEFAULT 60;
ALTER TABLE "api_key" ADD COLUMN IF NOT EXISTS "daily_quota" INTEGER;
ALTER TABLE "api_key" ADD COLUMN IF NOT EXISTS "used_count_today" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "api_key" ADD COLUMN IF NOT EXISTS "quota_reset_date" DATE;
ALTER TABLE "api_key" ADD COLUMN IF NOT EXISTS "allow_stream" BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS "api_key_rate_limit_per_minute_idx" ON "api_key"("rate_limit_per_minute");
CREATE INDEX IF NOT EXISTS "api_key_quota_reset_date_idx" ON "api_key"("quota_reset_date");

INSERT INTO "permission" ("id", "tenant_id", "code", "name", "module", "resource", "action", "created_at", "updated_at")
SELECT gen_random_uuid(), t."id", 'system:api_key:invoke', 'System API Key Invoke', 'system', 'api_key', 'invoke', now(), now()
FROM "tenant" t
WHERE NOT EXISTS (
  SELECT 1
  FROM "permission" p
  WHERE p."tenant_id" = t."id"
    AND p."code" = 'system:api_key:invoke'
);

INSERT INTO "permission" ("id", "tenant_id", "code", "name", "module", "resource", "action", "created_at", "updated_at")
SELECT gen_random_uuid(), t."id", 'agent:agent:use', 'Agent Use', 'agent', 'agent', 'use', now(), now()
FROM "tenant" t
WHERE NOT EXISTS (
  SELECT 1
  FROM "permission" p
  WHERE p."tenant_id" = t."id"
    AND p."code" = 'agent:agent:use'
);

INSERT INTO "role_permission" ("id", "tenant_id", "role_id", "permission_id", "created_at", "updated_at")
SELECT gen_random_uuid(), r."tenant_id", r."id", p."id", now(), now()
FROM "role" r
JOIN "permission" p
  ON p."tenant_id" = r."tenant_id"
 AND p."code" IN ('system:api_key:invoke', 'agent:agent:use')
WHERE r."code" IN ('tenant_admin', 'tenant_operator')
  AND r."deleted_at" IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "role_permission" rp
    WHERE rp."tenant_id" = r."tenant_id"
      AND rp."role_id" = r."id"
      AND rp."permission_id" = p."id"
  );

COMMENT ON TABLE "api_key" IS '租户接口密钥表，用于管理外部系统调用 Agent 的机器密钥、调用范围、限流和额度。';
COMMENT ON COLUMN "api_key"."id" IS '接口密钥 ID。';
COMMENT ON COLUMN "api_key"."tenant_id" IS '所属租户 ID。';
COMMENT ON COLUMN "api_key"."name" IS '接口密钥名称。';
COMMENT ON COLUMN "api_key"."key_prefix" IS '接口密钥明文前缀，用于列表脱敏展示和排查。';
COMMENT ON COLUMN "api_key"."key_hash" IS '接口密钥 SHA-256 哈希值，不保存明文。';
COMMENT ON COLUMN "api_key"."status" IS '接口密钥状态，ACTIVE 启用、DISABLED 停用、DELETED 已删除。';
COMMENT ON COLUMN "api_key"."scopes" IS '接口密钥授权范围 JSON，例如 external:agent:chat、external:agent:stream。';
COMMENT ON COLUMN "api_key"."allowed_agent_ids" IS '允许外部调用的 Agent ID 白名单 JSON 数组，空数组表示不限制 Agent。';
COMMENT ON COLUMN "api_key"."ip_allowlist" IS '允许调用的客户端 IP 白名单 JSON 数组，空数组表示不限制 IP。';
COMMENT ON COLUMN "api_key"."rate_limit_per_minute" IS '每分钟调用次数上限。';
COMMENT ON COLUMN "api_key"."daily_quota" IS '每日调用额度，空值表示不限每日总量。';
COMMENT ON COLUMN "api_key"."used_count_today" IS '今日已使用次数。';
COMMENT ON COLUMN "api_key"."quota_reset_date" IS '每日额度计数日期，用于跨天重置 used_count_today。';
COMMENT ON COLUMN "api_key"."allow_stream" IS '是否允许使用外部流式调用。';
COMMENT ON COLUMN "api_key"."expires_at" IS '接口密钥过期时间。';
COMMENT ON COLUMN "api_key"."last_used_at" IS '接口密钥最近使用时间。';
COMMENT ON COLUMN "api_key"."created_at" IS '创建时间。';
COMMENT ON COLUMN "api_key"."updated_at" IS '更新时间。';
COMMENT ON COLUMN "api_key"."deleted_at" IS '软删除时间。';
COMMENT ON COLUMN "api_key"."created_by" IS '创建人用户 ID，外部调用默认以该用户身份执行。';
COMMENT ON COLUMN "api_key"."updated_by" IS '最近更新人用户 ID。';
