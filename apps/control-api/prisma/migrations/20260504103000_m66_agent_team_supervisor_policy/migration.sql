ALTER TABLE "agent_team" ADD COLUMN "supervisor_model_id" UUID;
ALTER TABLE "agent_team" ADD COLUMN "supervisor_prompt" TEXT;
ALTER TABLE "agent_team" ADD COLUMN "failure_policy" VARCHAR(40) NOT NULL DEFAULT 'MATCH_HANDOFF_POLICY';
ALTER TABLE "agent_team" ADD COLUMN "quality_gate_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "agent_team" ADD COLUMN "quality_threshold" DECIMAL(4,2) NOT NULL DEFAULT 0.75;
ALTER TABLE "agent_team" ADD COLUMN "budget_token_limit" INTEGER;
ALTER TABLE "agent_team" ADD COLUMN "budget_cost_limit" DECIMAL(12,6);

CREATE INDEX "agent_team_supervisor_model_id_idx" ON "agent_team"("supervisor_model_id");
CREATE INDEX "agent_team_failure_policy_idx" ON "agent_team"("failure_policy");
CREATE INDEX "agent_team_quality_gate_enabled_idx" ON "agent_team"("quality_gate_enabled");

ALTER TABLE "agent_team" ADD CONSTRAINT "agent_team_supervisor_model_id_fkey" FOREIGN KEY ("supervisor_model_id") REFERENCES "model_config"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMENT ON COLUMN "agent_team"."supervisor_model_id" IS '团队级 Supervisor 优先使用的模型配置 ID，空值表示沿用成员模型兜底。';
COMMENT ON COLUMN "agent_team"."supervisor_prompt" IS '团队级 Supervisor 调度提示词，用于补充团队调度约束和决策风格。';
COMMENT ON COLUMN "agent_team"."failure_policy" IS '团队成员失败处理策略，MATCH_HANDOFF_POLICY 跟随接力策略、STOP_ON_REQUIRED_FAILURE 必需成员失败即终止、WAIT_HUMAN_ON_REQUIRED_FAILURE 必需成员失败等待人工、CONTINUE_OPTIONAL 可选成员失败继续。';
COMMENT ON COLUMN "agent_team"."quality_gate_enabled" IS '是否启用团队级质量门槛。';
COMMENT ON COLUMN "agent_team"."quality_threshold" IS '团队级质量门槛阈值，范围 0 到 1。';
COMMENT ON COLUMN "agent_team"."budget_token_limit" IS '团队单次运行 Token 预算上限，空值表示不限制。';
COMMENT ON COLUMN "agent_team"."budget_cost_limit" IS '团队单次运行成本预算上限，空值表示不限制。';
