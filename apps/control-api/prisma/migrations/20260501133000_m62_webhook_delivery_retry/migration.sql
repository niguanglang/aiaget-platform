CREATE TABLE IF NOT EXISTS "webhook_delivery" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "api_key_id" UUID NOT NULL,
  "event" VARCHAR(80) NOT NULL,
  "delivery_id" VARCHAR(120) NOT NULL,
  "parent_delivery_id" UUID,
  "target_url" VARCHAR(1000) NOT NULL,
  "payload" JSONB NOT NULL,
  "request_headers" JSONB,
  "response_status" INTEGER,
  "response_body" TEXT,
  "latency_ms" INTEGER,
  "status" VARCHAR(30) NOT NULL,
  "error_message" TEXT,
  "retry_count" INTEGER NOT NULL DEFAULT 0,
  "delivered_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "webhook_delivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "webhook_delivery_delivery_id_key" ON "webhook_delivery"("delivery_id");
CREATE INDEX IF NOT EXISTS "webhook_delivery_tenant_id_idx" ON "webhook_delivery"("tenant_id");
CREATE INDEX IF NOT EXISTS "webhook_delivery_api_key_id_idx" ON "webhook_delivery"("api_key_id");
CREATE INDEX IF NOT EXISTS "webhook_delivery_event_idx" ON "webhook_delivery"("event");
CREATE INDEX IF NOT EXISTS "webhook_delivery_parent_delivery_id_idx" ON "webhook_delivery"("parent_delivery_id");
CREATE INDEX IF NOT EXISTS "webhook_delivery_status_idx" ON "webhook_delivery"("status");
CREATE INDEX IF NOT EXISTS "webhook_delivery_response_status_idx" ON "webhook_delivery"("response_status");
CREATE INDEX IF NOT EXISTS "webhook_delivery_created_at_idx" ON "webhook_delivery"("created_at");
CREATE INDEX IF NOT EXISTS "webhook_delivery_delivered_at_idx" ON "webhook_delivery"("delivered_at");

ALTER TABLE "webhook_delivery"
  ADD CONSTRAINT "webhook_delivery_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "webhook_delivery"
  ADD CONSTRAINT "webhook_delivery_api_key_id_fkey" FOREIGN KEY ("api_key_id") REFERENCES "api_key"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "webhook_delivery"
  ADD CONSTRAINT "webhook_delivery_parent_delivery_id_fkey" FOREIGN KEY ("parent_delivery_id") REFERENCES "webhook_delivery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMENT ON TABLE "webhook_delivery" IS 'Webhook 投递记录表，用于保存外部调用完成通知的请求、响应、失败原因和重试链路。';
COMMENT ON COLUMN "webhook_delivery"."id" IS '投递记录 ID。';
COMMENT ON COLUMN "webhook_delivery"."tenant_id" IS '所属租户 ID。';
COMMENT ON COLUMN "webhook_delivery"."api_key_id" IS '所属 API Key ID。';
COMMENT ON COLUMN "webhook_delivery"."event" IS 'Webhook 事件类型，例如 agent.run.completed。';
COMMENT ON COLUMN "webhook_delivery"."delivery_id" IS '投递 ID，对应 x-aiaget-delivery-id。';
COMMENT ON COLUMN "webhook_delivery"."parent_delivery_id" IS '父级投递记录 ID，用于重试链路。';
COMMENT ON COLUMN "webhook_delivery"."target_url" IS '投递目标地址。';
COMMENT ON COLUMN "webhook_delivery"."payload" IS '投递正文 JSON。';
COMMENT ON COLUMN "webhook_delivery"."request_headers" IS '投递请求头 JSON。';
COMMENT ON COLUMN "webhook_delivery"."response_status" IS '接收方响应状态码。';
COMMENT ON COLUMN "webhook_delivery"."response_body" IS '接收方响应正文截断。';
COMMENT ON COLUMN "webhook_delivery"."latency_ms" IS '投递耗时毫秒数。';
COMMENT ON COLUMN "webhook_delivery"."status" IS '投递状态，SUCCESS 成功、FAILED 失败、PENDING 待投递、RETRYING 重试中。';
COMMENT ON COLUMN "webhook_delivery"."error_message" IS '失败原因摘要。';
COMMENT ON COLUMN "webhook_delivery"."retry_count" IS '重试次数。';
COMMENT ON COLUMN "webhook_delivery"."delivered_at" IS '实际投递完成时间。';
COMMENT ON COLUMN "webhook_delivery"."created_at" IS '创建时间。';
COMMENT ON COLUMN "webhook_delivery"."updated_at" IS '更新时间。';
