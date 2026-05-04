ALTER TABLE "api_key" ADD COLUMN IF NOT EXISTS "webhook_enabled" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "api_key" ADD COLUMN IF NOT EXISTS "webhook_url" VARCHAR(1000);
ALTER TABLE "api_key" ADD COLUMN IF NOT EXISTS "webhook_events" JSONB;
ALTER TABLE "api_key" ADD COLUMN IF NOT EXISTS "webhook_secret_encrypted" TEXT;
ALTER TABLE "api_key" ADD COLUMN IF NOT EXISTS "webhook_last_status" VARCHAR(30);
ALTER TABLE "api_key" ADD COLUMN IF NOT EXISTS "webhook_last_error" TEXT;
ALTER TABLE "api_key" ADD COLUMN IF NOT EXISTS "webhook_last_sent_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "api_key_webhook_enabled_idx" ON "api_key"("webhook_enabled");
CREATE INDEX IF NOT EXISTS "api_key_webhook_last_sent_at_idx" ON "api_key"("webhook_last_sent_at");

COMMENT ON TABLE "api_key" IS '租户接口密钥表，用于管理外部系统调用 Agent 的机器密钥、调用范围、限流、额度和运行完成 Webhook 回调。';
COMMENT ON COLUMN "api_key"."webhook_enabled" IS '是否启用外部 API 调用完成 Webhook 回调。';
COMMENT ON COLUMN "api_key"."webhook_url" IS 'Webhook 回调地址，外部调用完成后向该地址发送 POST 通知。';
COMMENT ON COLUMN "api_key"."webhook_events" IS 'Webhook 订阅事件 JSON 数组，例如 agent.run.completed。';
COMMENT ON COLUMN "api_key"."webhook_secret_encrypted" IS 'Webhook 签名密钥密文，用于生成 x-aiaget-signature HMAC 签名。';
COMMENT ON COLUMN "api_key"."webhook_last_status" IS '最近一次 Webhook 投递状态，SUCCESS 成功、FAILED 失败、SKIPPED 跳过。';
COMMENT ON COLUMN "api_key"."webhook_last_error" IS '最近一次 Webhook 投递失败原因。';
COMMENT ON COLUMN "api_key"."webhook_last_sent_at" IS '最近一次 Webhook 投递时间。';
