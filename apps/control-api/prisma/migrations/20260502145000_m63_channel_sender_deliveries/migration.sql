CREATE TABLE IF NOT EXISTS "channel_sender_delivery" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "channel_id" UUID NOT NULL,
  "agent_id" UUID NOT NULL,
  "delivery_id" VARCHAR(120) NOT NULL,
  "parent_delivery_id" UUID,
  "provider" VARCHAR(40) NOT NULL,
  "target" VARCHAR(1000),
  "request_url" VARCHAR(1000),
  "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  "response_status" INTEGER,
  "response_body" TEXT,
  "request_body" JSONB,
  "request_headers" JSONB,
  "error_message" TEXT,
  "retry_count" INTEGER NOT NULL DEFAULT 0,
  "latency_ms" INTEGER,
  "conversation_id" VARCHAR(120),
  "run_id" VARCHAR(120),
  "trace_id" VARCHAR(120),
  "external_conversation_id" VARCHAR(180),
  "external_message_id" VARCHAR(180),
  "delivered_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "channel_sender_delivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "channel_sender_delivery_delivery_id_key" ON "channel_sender_delivery"("delivery_id");
CREATE INDEX IF NOT EXISTS "channel_sender_delivery_tenant_id_idx" ON "channel_sender_delivery"("tenant_id");
CREATE INDEX IF NOT EXISTS "channel_sender_delivery_channel_id_idx" ON "channel_sender_delivery"("channel_id");
CREATE INDEX IF NOT EXISTS "channel_sender_delivery_agent_id_idx" ON "channel_sender_delivery"("agent_id");
CREATE INDEX IF NOT EXISTS "channel_sender_delivery_delivery_id_idx" ON "channel_sender_delivery"("delivery_id");
CREATE INDEX IF NOT EXISTS "channel_sender_delivery_parent_delivery_id_idx" ON "channel_sender_delivery"("parent_delivery_id");
CREATE INDEX IF NOT EXISTS "channel_sender_delivery_provider_idx" ON "channel_sender_delivery"("provider");
CREATE INDEX IF NOT EXISTS "channel_sender_delivery_status_idx" ON "channel_sender_delivery"("status");
CREATE INDEX IF NOT EXISTS "channel_sender_delivery_response_status_idx" ON "channel_sender_delivery"("response_status");
CREATE INDEX IF NOT EXISTS "channel_sender_delivery_conversation_id_idx" ON "channel_sender_delivery"("conversation_id");
CREATE INDEX IF NOT EXISTS "channel_sender_delivery_run_id_idx" ON "channel_sender_delivery"("run_id");
CREATE INDEX IF NOT EXISTS "channel_sender_delivery_trace_id_idx" ON "channel_sender_delivery"("trace_id");
CREATE INDEX IF NOT EXISTS "channel_sender_delivery_created_at_idx" ON "channel_sender_delivery"("created_at");
CREATE INDEX IF NOT EXISTS "channel_sender_delivery_delivered_at_idx" ON "channel_sender_delivery"("delivered_at");

ALTER TABLE "channel_sender_delivery"
  ADD CONSTRAINT "channel_sender_delivery_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "channel_sender_delivery"
  ADD CONSTRAINT "channel_sender_delivery_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "agent_publish_channel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "channel_sender_delivery"
  ADD CONSTRAINT "channel_sender_delivery_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "channel_sender_delivery"
  ADD CONSTRAINT "channel_sender_delivery_parent_delivery_id_fkey" FOREIGN KEY ("parent_delivery_id") REFERENCES "channel_sender_delivery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMENT ON TABLE "channel_sender_delivery" IS '渠道主动回复投递表，用于记录主动回复发送的请求、响应、失败原因、重试链路和审计上下文。';
COMMENT ON COLUMN "channel_sender_delivery"."id" IS '投递记录主键 ID。';
COMMENT ON COLUMN "channel_sender_delivery"."tenant_id" IS '所属租户 ID。';
COMMENT ON COLUMN "channel_sender_delivery"."channel_id" IS '关联发布渠道 ID。';
COMMENT ON COLUMN "channel_sender_delivery"."agent_id" IS '关联智能体 ID。';
COMMENT ON COLUMN "channel_sender_delivery"."delivery_id" IS '投递记录业务 ID。';
COMMENT ON COLUMN "channel_sender_delivery"."parent_delivery_id" IS '父级投递记录 ID，用于重试链路。';
COMMENT ON COLUMN "channel_sender_delivery"."provider" IS '渠道提供方标识，例如 WECHAT_WORK、DINGTALK、FEISHU、SLACK、CUSTOM_WEBHOOK。';
COMMENT ON COLUMN "channel_sender_delivery"."target" IS '发送目标，例如用户、群聊、Webhook 地址或频道标识。';
COMMENT ON COLUMN "channel_sender_delivery"."request_url" IS '实际投递请求地址，用于失败重试，前端展示时必须脱敏。';
COMMENT ON COLUMN "channel_sender_delivery"."status" IS '投递状态，PENDING、SUCCESS、FAILED、SKIPPED、RETRYING。';
COMMENT ON COLUMN "channel_sender_delivery"."response_status" IS '接收方响应状态码。';
COMMENT ON COLUMN "channel_sender_delivery"."response_body" IS '接收方响应正文截断。';
COMMENT ON COLUMN "channel_sender_delivery"."request_body" IS '发送请求正文 JSON。';
COMMENT ON COLUMN "channel_sender_delivery"."request_headers" IS '发送请求头 JSON。';
COMMENT ON COLUMN "channel_sender_delivery"."error_message" IS '发送失败原因。';
COMMENT ON COLUMN "channel_sender_delivery"."retry_count" IS '重试次数。';
COMMENT ON COLUMN "channel_sender_delivery"."latency_ms" IS '投递耗时毫秒数。';
COMMENT ON COLUMN "channel_sender_delivery"."conversation_id" IS '关联会话 ID。';
COMMENT ON COLUMN "channel_sender_delivery"."run_id" IS '关联运行 ID。';
COMMENT ON COLUMN "channel_sender_delivery"."trace_id" IS '关联 Trace ID。';
COMMENT ON COLUMN "channel_sender_delivery"."external_conversation_id" IS '外部平台会话 ID。';
COMMENT ON COLUMN "channel_sender_delivery"."external_message_id" IS '外部平台消息 ID。';
COMMENT ON COLUMN "channel_sender_delivery"."delivered_at" IS '实际投递完成时间。';
COMMENT ON COLUMN "channel_sender_delivery"."created_at" IS '创建时间。';
COMMENT ON COLUMN "channel_sender_delivery"."updated_at" IS '更新时间。';
