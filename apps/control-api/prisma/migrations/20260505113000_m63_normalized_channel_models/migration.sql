ALTER TABLE "agent_publish_channel" ADD COLUMN IF NOT EXISTS "account_id" UUID;
ALTER TABLE "agent_publish_channel" ADD COLUMN IF NOT EXISTS "route_rule_id" UUID;

CREATE TABLE IF NOT EXISTS "channel_provider" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "code" VARCHAR(100) NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "provider_type" VARCHAR(60) NOT NULL DEFAULT 'CUSTOM',
  "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  "endpoint_url" VARCHAR(1000),
  "callback_url" VARCHAR(1000),
  "capabilities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "auth_type" VARCHAR(60),
  "config" JSONB,
  "description" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "channel_provider_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "channel_account" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "provider_id" UUID NOT NULL,
  "code" VARCHAR(100) NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  "external_account_id" VARCHAR(180),
  "secret_encrypted" TEXT,
  "secret_masked" VARCHAR(120),
  "config" JSONB,
  "last_verified_at" TIMESTAMP(3),
  "description" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "channel_account_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "channel_template" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "provider_id" UUID,
  "account_id" UUID,
  "code" VARCHAR(120) NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "template_type" VARCHAR(60) NOT NULL DEFAULT 'MESSAGE',
  "locale" VARCHAR(30),
  "status" VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
  "subject" VARCHAR(300),
  "body" TEXT,
  "variables" JSONB,
  "content_schema" JSONB,
  "external_template_id" VARCHAR(180),
  "version" INTEGER NOT NULL DEFAULT 1,
  "approved_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "channel_template_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "channel_publish_job" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "agent_id" UUID NOT NULL,
  "publish_channel_id" UUID,
  "provider_id" UUID,
  "account_id" UUID,
  "template_id" UUID,
  "job_key" VARCHAR(160) NOT NULL,
  "job_type" VARCHAR(60) NOT NULL DEFAULT 'PUBLISH',
  "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  "payload" JSONB,
  "result" JSONB,
  "error_message" TEXT,
  "retry_count" INTEGER NOT NULL DEFAULT 0,
  "scheduled_at" TIMESTAMP(3),
  "started_at" TIMESTAMP(3),
  "finished_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "channel_publish_job_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "channel_delivery" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "agent_id" UUID,
  "publish_channel_id" UUID,
  "provider_id" UUID,
  "account_id" UUID,
  "template_id" UUID,
  "publish_job_id" UUID,
  "delivery_key" VARCHAR(160) NOT NULL,
  "direction" VARCHAR(30) NOT NULL DEFAULT 'OUTBOUND',
  "target" VARCHAR(1000),
  "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  "request_url" VARCHAR(1000),
  "request_body" JSONB,
  "request_headers" JSONB,
  "response_status" INTEGER,
  "response_body" TEXT,
  "error_message" TEXT,
  "retry_count" INTEGER NOT NULL DEFAULT 0,
  "latency_ms" INTEGER,
  "conversation_id" UUID,
  "run_id" UUID,
  "trace_id" VARCHAR(120),
  "external_conversation_id" VARCHAR(180),
  "external_message_id" VARCHAR(180),
  "delivered_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "channel_delivery_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "channel_reply" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "agent_id" UUID,
  "publish_channel_id" UUID,
  "provider_id" UUID,
  "account_id" UUID,
  "delivery_id" UUID,
  "reply_key" VARCHAR(160) NOT NULL,
  "direction" VARCHAR(30) NOT NULL DEFAULT 'INBOUND',
  "sender" VARCHAR(500),
  "recipient" VARCHAR(500),
  "content_type" VARCHAR(60) NOT NULL DEFAULT 'TEXT',
  "content" TEXT,
  "payload" JSONB,
  "status" VARCHAR(30) NOT NULL DEFAULT 'RECEIVED',
  "conversation_id" UUID,
  "message_id" UUID,
  "trace_id" VARCHAR(120),
  "external_conversation_id" VARCHAR(180),
  "external_message_id" VARCHAR(180),
  "received_at" TIMESTAMP(3),
  "processed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "channel_reply_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "channel_route_rule" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "agent_id" UUID,
  "provider_id" UUID,
  "account_id" UUID,
  "code" VARCHAR(120) NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "priority" INTEGER NOT NULL DEFAULT 100,
  "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  "direction" VARCHAR(30) NOT NULL DEFAULT 'INBOUND',
  "match_type" VARCHAR(60) NOT NULL DEFAULT 'JSON',
  "match_config" JSONB,
  "target_type" VARCHAR(60) NOT NULL DEFAULT 'AGENT',
  "target_config" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "channel_route_rule_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "channel_provider_tenant_id_code_key" ON "channel_provider"("tenant_id", "code");
CREATE INDEX IF NOT EXISTS "channel_provider_tenant_id_idx" ON "channel_provider"("tenant_id");
CREATE INDEX IF NOT EXISTS "channel_provider_provider_type_idx" ON "channel_provider"("provider_type");
CREATE INDEX IF NOT EXISTS "channel_provider_status_idx" ON "channel_provider"("status");
CREATE INDEX IF NOT EXISTS "channel_provider_created_at_idx" ON "channel_provider"("created_at");
CREATE INDEX IF NOT EXISTS "channel_provider_updated_at_idx" ON "channel_provider"("updated_at");
CREATE INDEX IF NOT EXISTS "channel_provider_deleted_at_idx" ON "channel_provider"("deleted_at");

CREATE UNIQUE INDEX IF NOT EXISTS "channel_account_tenant_id_code_key" ON "channel_account"("tenant_id", "code");
CREATE UNIQUE INDEX IF NOT EXISTS "channel_account_tenant_id_provider_id_external_account_id_key" ON "channel_account"("tenant_id", "provider_id", "external_account_id");
CREATE INDEX IF NOT EXISTS "channel_account_tenant_id_idx" ON "channel_account"("tenant_id");
CREATE INDEX IF NOT EXISTS "channel_account_provider_id_idx" ON "channel_account"("provider_id");
CREATE INDEX IF NOT EXISTS "channel_account_status_idx" ON "channel_account"("status");
CREATE INDEX IF NOT EXISTS "channel_account_external_account_id_idx" ON "channel_account"("external_account_id");
CREATE INDEX IF NOT EXISTS "channel_account_last_verified_at_idx" ON "channel_account"("last_verified_at");
CREATE INDEX IF NOT EXISTS "channel_account_created_at_idx" ON "channel_account"("created_at");
CREATE INDEX IF NOT EXISTS "channel_account_updated_at_idx" ON "channel_account"("updated_at");
CREATE INDEX IF NOT EXISTS "channel_account_deleted_at_idx" ON "channel_account"("deleted_at");

CREATE UNIQUE INDEX IF NOT EXISTS "channel_template_tenant_id_code_version_key" ON "channel_template"("tenant_id", "code", "version");
CREATE UNIQUE INDEX IF NOT EXISTS "channel_template_tenant_id_provider_id_external_template_id_key" ON "channel_template"("tenant_id", "provider_id", "external_template_id");
CREATE INDEX IF NOT EXISTS "channel_template_tenant_id_idx" ON "channel_template"("tenant_id");
CREATE INDEX IF NOT EXISTS "channel_template_provider_id_idx" ON "channel_template"("provider_id");
CREATE INDEX IF NOT EXISTS "channel_template_account_id_idx" ON "channel_template"("account_id");
CREATE INDEX IF NOT EXISTS "channel_template_template_type_idx" ON "channel_template"("template_type");
CREATE INDEX IF NOT EXISTS "channel_template_status_idx" ON "channel_template"("status");
CREATE INDEX IF NOT EXISTS "channel_template_external_template_id_idx" ON "channel_template"("external_template_id");
CREATE INDEX IF NOT EXISTS "channel_template_created_at_idx" ON "channel_template"("created_at");
CREATE INDEX IF NOT EXISTS "channel_template_updated_at_idx" ON "channel_template"("updated_at");
CREATE INDEX IF NOT EXISTS "channel_template_deleted_at_idx" ON "channel_template"("deleted_at");

CREATE UNIQUE INDEX IF NOT EXISTS "channel_publish_job_tenant_id_job_key_key" ON "channel_publish_job"("tenant_id", "job_key");
CREATE INDEX IF NOT EXISTS "channel_publish_job_tenant_id_idx" ON "channel_publish_job"("tenant_id");
CREATE INDEX IF NOT EXISTS "channel_publish_job_agent_id_idx" ON "channel_publish_job"("agent_id");
CREATE INDEX IF NOT EXISTS "channel_publish_job_publish_channel_id_idx" ON "channel_publish_job"("publish_channel_id");
CREATE INDEX IF NOT EXISTS "channel_publish_job_provider_id_idx" ON "channel_publish_job"("provider_id");
CREATE INDEX IF NOT EXISTS "channel_publish_job_account_id_idx" ON "channel_publish_job"("account_id");
CREATE INDEX IF NOT EXISTS "channel_publish_job_template_id_idx" ON "channel_publish_job"("template_id");
CREATE INDEX IF NOT EXISTS "channel_publish_job_job_type_idx" ON "channel_publish_job"("job_type");
CREATE INDEX IF NOT EXISTS "channel_publish_job_status_idx" ON "channel_publish_job"("status");
CREATE INDEX IF NOT EXISTS "channel_publish_job_scheduled_at_idx" ON "channel_publish_job"("scheduled_at");
CREATE INDEX IF NOT EXISTS "channel_publish_job_created_at_idx" ON "channel_publish_job"("created_at");
CREATE INDEX IF NOT EXISTS "channel_publish_job_updated_at_idx" ON "channel_publish_job"("updated_at");
CREATE INDEX IF NOT EXISTS "channel_publish_job_deleted_at_idx" ON "channel_publish_job"("deleted_at");

CREATE UNIQUE INDEX IF NOT EXISTS "channel_delivery_tenant_id_delivery_key_key" ON "channel_delivery"("tenant_id", "delivery_key");
CREATE INDEX IF NOT EXISTS "channel_delivery_tenant_id_idx" ON "channel_delivery"("tenant_id");
CREATE INDEX IF NOT EXISTS "channel_delivery_agent_id_idx" ON "channel_delivery"("agent_id");
CREATE INDEX IF NOT EXISTS "channel_delivery_publish_channel_id_idx" ON "channel_delivery"("publish_channel_id");
CREATE INDEX IF NOT EXISTS "channel_delivery_provider_id_idx" ON "channel_delivery"("provider_id");
CREATE INDEX IF NOT EXISTS "channel_delivery_account_id_idx" ON "channel_delivery"("account_id");
CREATE INDEX IF NOT EXISTS "channel_delivery_template_id_idx" ON "channel_delivery"("template_id");
CREATE INDEX IF NOT EXISTS "channel_delivery_publish_job_id_idx" ON "channel_delivery"("publish_job_id");
CREATE INDEX IF NOT EXISTS "channel_delivery_direction_idx" ON "channel_delivery"("direction");
CREATE INDEX IF NOT EXISTS "channel_delivery_status_idx" ON "channel_delivery"("status");
CREATE INDEX IF NOT EXISTS "channel_delivery_conversation_id_idx" ON "channel_delivery"("conversation_id");
CREATE INDEX IF NOT EXISTS "channel_delivery_run_id_idx" ON "channel_delivery"("run_id");
CREATE INDEX IF NOT EXISTS "channel_delivery_trace_id_idx" ON "channel_delivery"("trace_id");
CREATE INDEX IF NOT EXISTS "channel_delivery_external_conversation_id_idx" ON "channel_delivery"("external_conversation_id");
CREATE INDEX IF NOT EXISTS "channel_delivery_external_message_id_idx" ON "channel_delivery"("external_message_id");
CREATE INDEX IF NOT EXISTS "channel_delivery_created_at_idx" ON "channel_delivery"("created_at");
CREATE INDEX IF NOT EXISTS "channel_delivery_delivered_at_idx" ON "channel_delivery"("delivered_at");
CREATE INDEX IF NOT EXISTS "channel_delivery_deleted_at_idx" ON "channel_delivery"("deleted_at");

CREATE UNIQUE INDEX IF NOT EXISTS "channel_reply_tenant_id_reply_key_key" ON "channel_reply"("tenant_id", "reply_key");
CREATE INDEX IF NOT EXISTS "channel_reply_tenant_id_idx" ON "channel_reply"("tenant_id");
CREATE INDEX IF NOT EXISTS "channel_reply_agent_id_idx" ON "channel_reply"("agent_id");
CREATE INDEX IF NOT EXISTS "channel_reply_publish_channel_id_idx" ON "channel_reply"("publish_channel_id");
CREATE INDEX IF NOT EXISTS "channel_reply_provider_id_idx" ON "channel_reply"("provider_id");
CREATE INDEX IF NOT EXISTS "channel_reply_account_id_idx" ON "channel_reply"("account_id");
CREATE INDEX IF NOT EXISTS "channel_reply_delivery_id_idx" ON "channel_reply"("delivery_id");
CREATE INDEX IF NOT EXISTS "channel_reply_direction_idx" ON "channel_reply"("direction");
CREATE INDEX IF NOT EXISTS "channel_reply_status_idx" ON "channel_reply"("status");
CREATE INDEX IF NOT EXISTS "channel_reply_conversation_id_idx" ON "channel_reply"("conversation_id");
CREATE INDEX IF NOT EXISTS "channel_reply_message_id_idx" ON "channel_reply"("message_id");
CREATE INDEX IF NOT EXISTS "channel_reply_trace_id_idx" ON "channel_reply"("trace_id");
CREATE INDEX IF NOT EXISTS "channel_reply_external_conversation_id_idx" ON "channel_reply"("external_conversation_id");
CREATE INDEX IF NOT EXISTS "channel_reply_external_message_id_idx" ON "channel_reply"("external_message_id");
CREATE INDEX IF NOT EXISTS "channel_reply_received_at_idx" ON "channel_reply"("received_at");
CREATE INDEX IF NOT EXISTS "channel_reply_processed_at_idx" ON "channel_reply"("processed_at");
CREATE INDEX IF NOT EXISTS "channel_reply_created_at_idx" ON "channel_reply"("created_at");
CREATE INDEX IF NOT EXISTS "channel_reply_deleted_at_idx" ON "channel_reply"("deleted_at");

CREATE UNIQUE INDEX IF NOT EXISTS "channel_route_rule_tenant_id_code_key" ON "channel_route_rule"("tenant_id", "code");
CREATE INDEX IF NOT EXISTS "channel_route_rule_tenant_id_idx" ON "channel_route_rule"("tenant_id");
CREATE INDEX IF NOT EXISTS "channel_route_rule_agent_id_idx" ON "channel_route_rule"("agent_id");
CREATE INDEX IF NOT EXISTS "channel_route_rule_provider_id_idx" ON "channel_route_rule"("provider_id");
CREATE INDEX IF NOT EXISTS "channel_route_rule_account_id_idx" ON "channel_route_rule"("account_id");
CREATE INDEX IF NOT EXISTS "channel_route_rule_status_idx" ON "channel_route_rule"("status");
CREATE INDEX IF NOT EXISTS "channel_route_rule_direction_idx" ON "channel_route_rule"("direction");
CREATE INDEX IF NOT EXISTS "channel_route_rule_priority_idx" ON "channel_route_rule"("priority");
CREATE INDEX IF NOT EXISTS "channel_route_rule_created_at_idx" ON "channel_route_rule"("created_at");
CREATE INDEX IF NOT EXISTS "channel_route_rule_updated_at_idx" ON "channel_route_rule"("updated_at");
CREATE INDEX IF NOT EXISTS "channel_route_rule_deleted_at_idx" ON "channel_route_rule"("deleted_at");

CREATE INDEX IF NOT EXISTS "agent_publish_channel_account_id_idx" ON "agent_publish_channel"("account_id");
CREATE INDEX IF NOT EXISTS "agent_publish_channel_route_rule_id_idx" ON "agent_publish_channel"("route_rule_id");

ALTER TABLE "channel_provider"
  ADD CONSTRAINT "channel_provider_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "channel_account"
  ADD CONSTRAINT "channel_account_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "channel_account"
  ADD CONSTRAINT "channel_account_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "channel_provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "channel_template"
  ADD CONSTRAINT "channel_template_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "channel_template"
  ADD CONSTRAINT "channel_template_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "channel_provider"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "channel_template"
  ADD CONSTRAINT "channel_template_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "channel_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "channel_publish_job"
  ADD CONSTRAINT "channel_publish_job_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "channel_publish_job"
  ADD CONSTRAINT "channel_publish_job_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "channel_publish_job"
  ADD CONSTRAINT "channel_publish_job_publish_channel_id_fkey" FOREIGN KEY ("publish_channel_id") REFERENCES "agent_publish_channel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "channel_publish_job"
  ADD CONSTRAINT "channel_publish_job_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "channel_provider"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "channel_publish_job"
  ADD CONSTRAINT "channel_publish_job_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "channel_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "channel_publish_job"
  ADD CONSTRAINT "channel_publish_job_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "channel_template"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "channel_delivery"
  ADD CONSTRAINT "channel_delivery_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "channel_delivery"
  ADD CONSTRAINT "channel_delivery_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "channel_delivery"
  ADD CONSTRAINT "channel_delivery_publish_channel_id_fkey" FOREIGN KEY ("publish_channel_id") REFERENCES "agent_publish_channel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "channel_delivery"
  ADD CONSTRAINT "channel_delivery_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "channel_provider"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "channel_delivery"
  ADD CONSTRAINT "channel_delivery_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "channel_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "channel_delivery"
  ADD CONSTRAINT "channel_delivery_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "channel_template"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "channel_delivery"
  ADD CONSTRAINT "channel_delivery_publish_job_id_fkey" FOREIGN KEY ("publish_job_id") REFERENCES "channel_publish_job"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "channel_reply"
  ADD CONSTRAINT "channel_reply_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "channel_reply"
  ADD CONSTRAINT "channel_reply_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "channel_reply"
  ADD CONSTRAINT "channel_reply_publish_channel_id_fkey" FOREIGN KEY ("publish_channel_id") REFERENCES "agent_publish_channel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "channel_reply"
  ADD CONSTRAINT "channel_reply_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "channel_provider"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "channel_reply"
  ADD CONSTRAINT "channel_reply_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "channel_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "channel_reply"
  ADD CONSTRAINT "channel_reply_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "channel_delivery"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "channel_route_rule"
  ADD CONSTRAINT "channel_route_rule_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "channel_route_rule"
  ADD CONSTRAINT "channel_route_rule_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "channel_route_rule"
  ADD CONSTRAINT "channel_route_rule_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "channel_provider"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "channel_route_rule"
  ADD CONSTRAINT "channel_route_rule_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "channel_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "agent_publish_channel"
  ADD CONSTRAINT "agent_publish_channel_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "channel_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "agent_publish_channel"
  ADD CONSTRAINT "agent_publish_channel_route_rule_id_fkey" FOREIGN KEY ("route_rule_id") REFERENCES "channel_route_rule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMENT ON COLUMN "agent_publish_channel"."account_id" IS '可选关联的规范化渠道账号 ID，用于逐步迁移到渠道账号模型。';
COMMENT ON COLUMN "agent_publish_channel"."route_rule_id" IS '可选关联的规范化路由规则 ID，用于复用发布渠道的匹配和分发规则。';

COMMENT ON TABLE "channel_provider" IS '渠道提供方表，用于抽象企业微信、钉钉、飞书、Slack、自定义 Webhook 等提供方能力和接入配置。';
COMMENT ON COLUMN "channel_provider"."id" IS '渠道提供方主键 ID。';
COMMENT ON COLUMN "channel_provider"."tenant_id" IS '所属租户 ID。';
COMMENT ON COLUMN "channel_provider"."code" IS '租户内唯一的提供方编码。';
COMMENT ON COLUMN "channel_provider"."name" IS '渠道提供方名称。';
COMMENT ON COLUMN "channel_provider"."provider_type" IS '提供方类型，保持通用枚举以兼容不同平台。';
COMMENT ON COLUMN "channel_provider"."status" IS '提供方状态，ACTIVE、DISABLED、ARCHIVED 等。';
COMMENT ON COLUMN "channel_provider"."endpoint_url" IS '默认请求入口地址。';
COMMENT ON COLUMN "channel_provider"."callback_url" IS '默认回调入口地址。';
COMMENT ON COLUMN "channel_provider"."capabilities" IS '提供方能力列表，例如 inbound、outbound、template、receipt。';
COMMENT ON COLUMN "channel_provider"."auth_type" IS '认证方式，例如 TOKEN、SIGNATURE、OAUTH、NONE。';
COMMENT ON COLUMN "channel_provider"."config" IS '提供方通用配置 JSON。';
COMMENT ON COLUMN "channel_provider"."description" IS '提供方说明。';
COMMENT ON COLUMN "channel_provider"."created_at" IS '创建时间。';
COMMENT ON COLUMN "channel_provider"."updated_at" IS '更新时间。';
COMMENT ON COLUMN "channel_provider"."deleted_at" IS '软删除时间。';
COMMENT ON COLUMN "channel_provider"."created_by" IS '创建人用户 ID。';
COMMENT ON COLUMN "channel_provider"."updated_by" IS '更新人用户 ID。';

COMMENT ON TABLE "channel_account" IS '渠道账号表，用于保存租户在某个渠道提供方下的账号、机器人、应用或 Webhook 身份。';
COMMENT ON COLUMN "channel_account"."id" IS '渠道账号主键 ID。';
COMMENT ON COLUMN "channel_account"."tenant_id" IS '所属租户 ID。';
COMMENT ON COLUMN "channel_account"."provider_id" IS '关联渠道提供方 ID。';
COMMENT ON COLUMN "channel_account"."code" IS '租户内唯一的渠道账号编码。';
COMMENT ON COLUMN "channel_account"."name" IS '渠道账号名称。';
COMMENT ON COLUMN "channel_account"."status" IS '账号状态，ACTIVE、DISABLED、ERROR、ARCHIVED 等。';
COMMENT ON COLUMN "channel_account"."external_account_id" IS '外部平台账号、应用、机器人或 Webhook 标识。';
COMMENT ON COLUMN "channel_account"."secret_encrypted" IS '账号密钥密文。';
COMMENT ON COLUMN "channel_account"."secret_masked" IS '账号密钥脱敏展示值。';
COMMENT ON COLUMN "channel_account"."config" IS '账号级通用配置 JSON。';
COMMENT ON COLUMN "channel_account"."last_verified_at" IS '最近校验成功时间。';
COMMENT ON COLUMN "channel_account"."description" IS '账号说明。';
COMMENT ON COLUMN "channel_account"."created_at" IS '创建时间。';
COMMENT ON COLUMN "channel_account"."updated_at" IS '更新时间。';
COMMENT ON COLUMN "channel_account"."deleted_at" IS '软删除时间。';
COMMENT ON COLUMN "channel_account"."created_by" IS '创建人用户 ID。';
COMMENT ON COLUMN "channel_account"."updated_by" IS '更新人用户 ID。';

COMMENT ON TABLE "channel_template" IS '渠道模板表，用于保存跨渠道消息模板、变量定义和外部模板映射。';
COMMENT ON COLUMN "channel_template"."id" IS '渠道模板主键 ID。';
COMMENT ON COLUMN "channel_template"."tenant_id" IS '所属租户 ID。';
COMMENT ON COLUMN "channel_template"."provider_id" IS '可选关联渠道提供方 ID。';
COMMENT ON COLUMN "channel_template"."account_id" IS '可选关联渠道账号 ID。';
COMMENT ON COLUMN "channel_template"."code" IS '租户内模板编码。';
COMMENT ON COLUMN "channel_template"."name" IS '模板名称。';
COMMENT ON COLUMN "channel_template"."template_type" IS '模板类型，例如 MESSAGE、CARD、NOTIFICATION、RECEIPT。';
COMMENT ON COLUMN "channel_template"."locale" IS '模板语言或地区。';
COMMENT ON COLUMN "channel_template"."status" IS '模板状态，DRAFT、ACTIVE、PENDING_REVIEW、REJECTED、ARCHIVED 等。';
COMMENT ON COLUMN "channel_template"."subject" IS '模板标题或摘要。';
COMMENT ON COLUMN "channel_template"."body" IS '模板正文。';
COMMENT ON COLUMN "channel_template"."variables" IS '模板变量定义 JSON。';
COMMENT ON COLUMN "channel_template"."content_schema" IS '模板内容结构定义 JSON。';
COMMENT ON COLUMN "channel_template"."external_template_id" IS '外部平台模板 ID。';
COMMENT ON COLUMN "channel_template"."version" IS '模板版本号。';
COMMENT ON COLUMN "channel_template"."approved_at" IS '模板审核通过时间。';
COMMENT ON COLUMN "channel_template"."created_at" IS '创建时间。';
COMMENT ON COLUMN "channel_template"."updated_at" IS '更新时间。';
COMMENT ON COLUMN "channel_template"."deleted_at" IS '软删除时间。';
COMMENT ON COLUMN "channel_template"."created_by" IS '创建人用户 ID。';
COMMENT ON COLUMN "channel_template"."updated_by" IS '更新人用户 ID。';

COMMENT ON TABLE "channel_publish_job" IS '渠道发布任务表，用于记录发布、同步、撤回、重试等异步任务及其幂等键。';
COMMENT ON COLUMN "channel_publish_job"."id" IS '发布任务主键 ID。';
COMMENT ON COLUMN "channel_publish_job"."tenant_id" IS '所属租户 ID。';
COMMENT ON COLUMN "channel_publish_job"."agent_id" IS '关联智能体 ID。';
COMMENT ON COLUMN "channel_publish_job"."publish_channel_id" IS '可选关联旧版智能体发布渠道 ID。';
COMMENT ON COLUMN "channel_publish_job"."provider_id" IS '可选关联渠道提供方 ID。';
COMMENT ON COLUMN "channel_publish_job"."account_id" IS '可选关联渠道账号 ID。';
COMMENT ON COLUMN "channel_publish_job"."template_id" IS '可选关联渠道模板 ID。';
COMMENT ON COLUMN "channel_publish_job"."job_key" IS '租户内任务幂等键。';
COMMENT ON COLUMN "channel_publish_job"."job_type" IS '任务类型，例如 PUBLISH、SYNC、UNPUBLISH、RETRY。';
COMMENT ON COLUMN "channel_publish_job"."status" IS '任务状态，PENDING、RUNNING、SUCCESS、FAILED、CANCELLED。';
COMMENT ON COLUMN "channel_publish_job"."payload" IS '任务输入载荷 JSON。';
COMMENT ON COLUMN "channel_publish_job"."result" IS '任务执行结果 JSON。';
COMMENT ON COLUMN "channel_publish_job"."error_message" IS '任务失败原因。';
COMMENT ON COLUMN "channel_publish_job"."retry_count" IS '任务重试次数。';
COMMENT ON COLUMN "channel_publish_job"."scheduled_at" IS '计划执行时间。';
COMMENT ON COLUMN "channel_publish_job"."started_at" IS '开始执行时间。';
COMMENT ON COLUMN "channel_publish_job"."finished_at" IS '结束执行时间。';
COMMENT ON COLUMN "channel_publish_job"."created_at" IS '创建时间。';
COMMENT ON COLUMN "channel_publish_job"."updated_at" IS '更新时间。';
COMMENT ON COLUMN "channel_publish_job"."deleted_at" IS '软删除时间。';
COMMENT ON COLUMN "channel_publish_job"."created_by" IS '创建人用户 ID。';
COMMENT ON COLUMN "channel_publish_job"."updated_by" IS '更新人用户 ID。';

COMMENT ON TABLE "channel_delivery" IS '渠道投递表，用于统一记录入站、出站消息投递、回执、失败、重试和成本统计上下文。';
COMMENT ON COLUMN "channel_delivery"."id" IS '渠道投递主键 ID。';
COMMENT ON COLUMN "channel_delivery"."tenant_id" IS '所属租户 ID。';
COMMENT ON COLUMN "channel_delivery"."agent_id" IS '可选关联智能体 ID。';
COMMENT ON COLUMN "channel_delivery"."publish_channel_id" IS '可选关联旧版智能体发布渠道 ID。';
COMMENT ON COLUMN "channel_delivery"."provider_id" IS '可选关联渠道提供方 ID。';
COMMENT ON COLUMN "channel_delivery"."account_id" IS '可选关联渠道账号 ID。';
COMMENT ON COLUMN "channel_delivery"."template_id" IS '可选关联渠道模板 ID。';
COMMENT ON COLUMN "channel_delivery"."publish_job_id" IS '可选关联渠道发布任务 ID。';
COMMENT ON COLUMN "channel_delivery"."delivery_key" IS '租户内投递幂等键。';
COMMENT ON COLUMN "channel_delivery"."direction" IS '投递方向，INBOUND 或 OUTBOUND。';
COMMENT ON COLUMN "channel_delivery"."target" IS '投递目标，例如用户、群聊、Webhook 地址或频道标识。';
COMMENT ON COLUMN "channel_delivery"."status" IS '投递状态，PENDING、SUCCESS、FAILED、SKIPPED、RETRYING。';
COMMENT ON COLUMN "channel_delivery"."request_url" IS '实际请求地址，展示时应脱敏。';
COMMENT ON COLUMN "channel_delivery"."request_body" IS '请求正文 JSON。';
COMMENT ON COLUMN "channel_delivery"."request_headers" IS '请求头 JSON。';
COMMENT ON COLUMN "channel_delivery"."response_status" IS '接收方响应状态码。';
COMMENT ON COLUMN "channel_delivery"."response_body" IS '接收方响应正文截断。';
COMMENT ON COLUMN "channel_delivery"."error_message" IS '投递失败原因。';
COMMENT ON COLUMN "channel_delivery"."retry_count" IS '投递重试次数。';
COMMENT ON COLUMN "channel_delivery"."latency_ms" IS '投递耗时毫秒数。';
COMMENT ON COLUMN "channel_delivery"."conversation_id" IS '关联会话 ID。';
COMMENT ON COLUMN "channel_delivery"."run_id" IS '关联运行 ID。';
COMMENT ON COLUMN "channel_delivery"."trace_id" IS '关联 Trace ID。';
COMMENT ON COLUMN "channel_delivery"."external_conversation_id" IS '外部平台会话 ID。';
COMMENT ON COLUMN "channel_delivery"."external_message_id" IS '外部平台消息 ID。';
COMMENT ON COLUMN "channel_delivery"."delivered_at" IS '实际投递完成时间。';
COMMENT ON COLUMN "channel_delivery"."created_at" IS '创建时间。';
COMMENT ON COLUMN "channel_delivery"."updated_at" IS '更新时间。';
COMMENT ON COLUMN "channel_delivery"."deleted_at" IS '软删除时间。';
COMMENT ON COLUMN "channel_delivery"."created_by" IS '创建人用户 ID。';
COMMENT ON COLUMN "channel_delivery"."updated_by" IS '更新人用户 ID。';

COMMENT ON TABLE "channel_reply" IS '渠道回复表，用于保存外部渠道回包、用户回复、回执事件和解析后的会话关联。';
COMMENT ON COLUMN "channel_reply"."id" IS '渠道回复主键 ID。';
COMMENT ON COLUMN "channel_reply"."tenant_id" IS '所属租户 ID。';
COMMENT ON COLUMN "channel_reply"."agent_id" IS '可选关联智能体 ID。';
COMMENT ON COLUMN "channel_reply"."publish_channel_id" IS '可选关联旧版智能体发布渠道 ID。';
COMMENT ON COLUMN "channel_reply"."provider_id" IS '可选关联渠道提供方 ID。';
COMMENT ON COLUMN "channel_reply"."account_id" IS '可选关联渠道账号 ID。';
COMMENT ON COLUMN "channel_reply"."delivery_id" IS '可选关联渠道投递 ID。';
COMMENT ON COLUMN "channel_reply"."reply_key" IS '租户内回复幂等键。';
COMMENT ON COLUMN "channel_reply"."direction" IS '回复方向，INBOUND 或 OUTBOUND。';
COMMENT ON COLUMN "channel_reply"."sender" IS '发送方标识。';
COMMENT ON COLUMN "channel_reply"."recipient" IS '接收方标识。';
COMMENT ON COLUMN "channel_reply"."content_type" IS '内容类型，例如 TEXT、MARKDOWN、CARD、EVENT、FILE。';
COMMENT ON COLUMN "channel_reply"."content" IS '解析后的文本内容。';
COMMENT ON COLUMN "channel_reply"."payload" IS '原始回复或事件载荷 JSON。';
COMMENT ON COLUMN "channel_reply"."status" IS '处理状态，RECEIVED、PROCESSED、IGNORED、FAILED。';
COMMENT ON COLUMN "channel_reply"."conversation_id" IS '关联会话 ID。';
COMMENT ON COLUMN "channel_reply"."message_id" IS '关联会话消息 ID。';
COMMENT ON COLUMN "channel_reply"."trace_id" IS '关联 Trace ID。';
COMMENT ON COLUMN "channel_reply"."external_conversation_id" IS '外部平台会话 ID。';
COMMENT ON COLUMN "channel_reply"."external_message_id" IS '外部平台消息 ID。';
COMMENT ON COLUMN "channel_reply"."received_at" IS '外部回复接收时间。';
COMMENT ON COLUMN "channel_reply"."processed_at" IS '回复处理完成时间。';
COMMENT ON COLUMN "channel_reply"."created_at" IS '创建时间。';
COMMENT ON COLUMN "channel_reply"."updated_at" IS '更新时间。';
COMMENT ON COLUMN "channel_reply"."deleted_at" IS '软删除时间。';
COMMENT ON COLUMN "channel_reply"."created_by" IS '创建人用户 ID。';
COMMENT ON COLUMN "channel_reply"."updated_by" IS '更新人用户 ID。';

COMMENT ON TABLE "channel_route_rule" IS '渠道路由规则表，用于按租户、渠道、账号、方向和匹配条件分发外部事件或消息到目标智能体。';
COMMENT ON COLUMN "channel_route_rule"."id" IS '渠道路由规则主键 ID。';
COMMENT ON COLUMN "channel_route_rule"."tenant_id" IS '所属租户 ID。';
COMMENT ON COLUMN "channel_route_rule"."agent_id" IS '可选默认目标智能体 ID。';
COMMENT ON COLUMN "channel_route_rule"."provider_id" IS '可选关联渠道提供方 ID。';
COMMENT ON COLUMN "channel_route_rule"."account_id" IS '可选关联渠道账号 ID。';
COMMENT ON COLUMN "channel_route_rule"."code" IS '租户内唯一的路由规则编码。';
COMMENT ON COLUMN "channel_route_rule"."name" IS '路由规则名称。';
COMMENT ON COLUMN "channel_route_rule"."priority" IS '匹配优先级，数值越小越优先。';
COMMENT ON COLUMN "channel_route_rule"."status" IS '规则状态，ACTIVE、DISABLED、ARCHIVED 等。';
COMMENT ON COLUMN "channel_route_rule"."direction" IS '规则方向，INBOUND 或 OUTBOUND。';
COMMENT ON COLUMN "channel_route_rule"."match_type" IS '匹配类型，例如 JSON、HEADER、PATH、EXPRESSION。';
COMMENT ON COLUMN "channel_route_rule"."match_config" IS '匹配条件配置 JSON。';
COMMENT ON COLUMN "channel_route_rule"."target_type" IS '目标类型，例如 AGENT、WEBHOOK、QUEUE。';
COMMENT ON COLUMN "channel_route_rule"."target_config" IS '目标配置 JSON。';
COMMENT ON COLUMN "channel_route_rule"."created_at" IS '创建时间。';
COMMENT ON COLUMN "channel_route_rule"."updated_at" IS '更新时间。';
COMMENT ON COLUMN "channel_route_rule"."deleted_at" IS '软删除时间。';
COMMENT ON COLUMN "channel_route_rule"."created_by" IS '创建人用户 ID。';
COMMENT ON COLUMN "channel_route_rule"."updated_by" IS '更新人用户 ID。';
