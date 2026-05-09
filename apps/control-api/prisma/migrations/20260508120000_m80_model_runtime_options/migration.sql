ALTER TABLE "model_config" ADD COLUMN "max_output_tokens" INTEGER;
ALTER TABLE "model_config" ADD COLUMN "api_version" VARCHAR(80);

COMMENT ON COLUMN "model_config"."max_output_tokens" IS '模型最大输出 Token 数，主要用于 Anthropic max_tokens 等供应商协议字段。';
COMMENT ON COLUMN "model_config"."api_version" IS '模型供应商 API 版本，主要用于 Azure OpenAI api-version 等版本化协议字段。';

