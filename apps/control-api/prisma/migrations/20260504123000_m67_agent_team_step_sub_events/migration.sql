ALTER TABLE "agent_team_step" ADD COLUMN "child_steps" JSONB;
ALTER TABLE "agent_team_step" ADD COLUMN "references" JSONB;
ALTER TABLE "agent_team_step" ADD COLUMN "tool_calls" JSONB;
ALTER TABLE "agent_team_step" ADD COLUMN "model_call" JSONB;

COMMENT ON COLUMN "agent_team_step"."child_steps" IS '成员 Agent 内部运行子步骤 JSON，例如 prompt、knowledge、tool、response。';
COMMENT ON COLUMN "agent_team_step"."references" IS '成员 Agent RAG 引用来源 JSON。';
COMMENT ON COLUMN "agent_team_step"."tool_calls" IS '成员 Agent 工具调用摘要 JSON。';
COMMENT ON COLUMN "agent_team_step"."model_call" IS '成员 Agent 模型调用摘要 JSON。';
