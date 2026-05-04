ALTER TABLE "agent_publish_channel" ADD COLUMN IF NOT EXISTS "name" VARCHAR(160);
ALTER TABLE "agent_publish_channel" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "agent_publish_channel" ADD COLUMN IF NOT EXISTS "endpoint_url" VARCHAR(1000);
ALTER TABLE "agent_publish_channel" ADD COLUMN IF NOT EXISTS "callback_url" VARCHAR(1000);
ALTER TABLE "agent_publish_channel" ADD COLUMN IF NOT EXISTS "secret_encrypted" TEXT;
ALTER TABLE "agent_publish_channel" ADD COLUMN IF NOT EXISTS "secret_masked" VARCHAR(120);
ALTER TABLE "agent_publish_channel" ADD COLUMN IF NOT EXISTS "last_published_at" TIMESTAMP(3);
ALTER TABLE "agent_publish_channel" ADD COLUMN IF NOT EXISTS "last_checked_at" TIMESTAMP(3);
ALTER TABLE "agent_publish_channel" ADD COLUMN IF NOT EXISTS "health_status" VARCHAR(30) NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE "agent_publish_channel" ADD COLUMN IF NOT EXISTS "health_message" TEXT;

UPDATE "agent_publish_channel"
SET "name" = COALESCE("name", "channel"),
    "health_status" = COALESCE("health_status", 'UNKNOWN')
WHERE "name" IS NULL OR "health_status" IS NULL;

CREATE INDEX IF NOT EXISTS "agent_publish_channel_channel_idx" ON "agent_publish_channel"("channel");
CREATE INDEX IF NOT EXISTS "agent_publish_channel_last_published_at_idx" ON "agent_publish_channel"("last_published_at");
CREATE INDEX IF NOT EXISTS "agent_publish_channel_last_checked_at_idx" ON "agent_publish_channel"("last_checked_at");
CREATE INDEX IF NOT EXISTS "agent_publish_channel_health_status_idx" ON "agent_publish_channel"("health_status");

COMMENT ON TABLE "agent_publish_channel" IS '智能体发布渠道表，用于维护 Agent 在 Web、开放 API、企业微信、钉钉、飞书等渠道的发布配置、健康状态和回调入口。';
COMMENT ON COLUMN "agent_publish_channel"."id" IS '发布渠道 ID。';
COMMENT ON COLUMN "agent_publish_channel"."tenant_id" IS '所属租户 ID。';
COMMENT ON COLUMN "agent_publish_channel"."agent_id" IS '关联智能体 ID。';
COMMENT ON COLUMN "agent_publish_channel"."channel" IS '渠道类型，WEB_WIDGET、OPEN_API、WECHAT_WORK、DINGTALK、FEISHU、SLACK、CUSTOM_WEBHOOK。';
COMMENT ON COLUMN "agent_publish_channel"."name" IS '渠道发布名称。';
COMMENT ON COLUMN "agent_publish_channel"."description" IS '渠道发布说明。';
COMMENT ON COLUMN "agent_publish_channel"."status" IS '发布状态，DRAFT、ACTIVE、DISABLED、ERROR、ARCHIVED。';
COMMENT ON COLUMN "agent_publish_channel"."endpoint_url" IS '渠道入口地址，例如 Web Widget 地址、开放 API 地址或第三方机器人入口。';
COMMENT ON COLUMN "agent_publish_channel"."callback_url" IS '渠道回调地址，用于接收第三方平台事件或消息回调。';
COMMENT ON COLUMN "agent_publish_channel"."secret_encrypted" IS '渠道密钥密文，用于第三方平台签名或回调校验。';
COMMENT ON COLUMN "agent_publish_channel"."secret_masked" IS '渠道密钥脱敏展示值。';
COMMENT ON COLUMN "agent_publish_channel"."config" IS '渠道配置 JSON，包含渠道特定的应用 ID、机器人 ID、事件订阅、欢迎语等。';
COMMENT ON COLUMN "agent_publish_channel"."last_published_at" IS '最近发布时间。';
COMMENT ON COLUMN "agent_publish_channel"."last_checked_at" IS '最近健康检查时间。';
COMMENT ON COLUMN "agent_publish_channel"."health_status" IS '渠道健康状态，UNKNOWN、HEALTHY、DEGRADED、UNAVAILABLE。';
COMMENT ON COLUMN "agent_publish_channel"."health_message" IS '渠道健康检查说明或最近错误。';
COMMENT ON COLUMN "agent_publish_channel"."created_at" IS '创建时间。';
COMMENT ON COLUMN "agent_publish_channel"."updated_at" IS '更新时间。';
COMMENT ON COLUMN "agent_publish_channel"."deleted_at" IS '软删除时间。';
COMMENT ON COLUMN "agent_publish_channel"."created_by" IS '创建人用户 ID。';
COMMENT ON COLUMN "agent_publish_channel"."updated_by" IS '更新人用户 ID。';
