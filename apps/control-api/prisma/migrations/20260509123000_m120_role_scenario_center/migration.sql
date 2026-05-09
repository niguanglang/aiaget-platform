CREATE TABLE "role_scenario" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "owner_id" UUID,
  "agent_id" UUID,
  "skill_id" UUID,
  "knowledge_id" UUID,
  "tool_id" UUID,
  "prompt_id" UUID,
  "name" VARCHAR(160) NOT NULL,
  "code" VARCHAR(100) NOT NULL,
  "role_name" VARCHAR(120) NOT NULL,
  "department_name" VARCHAR(120) NOT NULL,
  "scenario_type" VARCHAR(40) NOT NULL DEFAULT 'CUSTOM',
  "status" VARCHAR(40) NOT NULL DEFAULT 'DRAFT',
  "priority" VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
  "pain_point" TEXT NOT NULL,
  "business_goal" TEXT NOT NULL,
  "workflow_summary" TEXT NOT NULL,
  "expected_outcome" TEXT NOT NULL,
  "sample_deliverable" TEXT NOT NULL,
  "acceptance_criteria" TEXT NOT NULL,
  "roi_metric" TEXT NOT NULL,
  "impact_score" INTEGER NOT NULL DEFAULT 0,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,

  CONSTRAINT "role_scenario_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "role_scenario_tenant_id_code_key" ON "role_scenario"("tenant_id", "code");
CREATE INDEX "role_scenario_tenant_id_idx" ON "role_scenario"("tenant_id");
CREATE INDEX "role_scenario_owner_id_idx" ON "role_scenario"("owner_id");
CREATE INDEX "role_scenario_agent_id_idx" ON "role_scenario"("agent_id");
CREATE INDEX "role_scenario_skill_id_idx" ON "role_scenario"("skill_id");
CREATE INDEX "role_scenario_knowledge_id_idx" ON "role_scenario"("knowledge_id");
CREATE INDEX "role_scenario_tool_id_idx" ON "role_scenario"("tool_id");
CREATE INDEX "role_scenario_prompt_id_idx" ON "role_scenario"("prompt_id");
CREATE INDEX "role_scenario_role_name_idx" ON "role_scenario"("role_name");
CREATE INDEX "role_scenario_department_name_idx" ON "role_scenario"("department_name");
CREATE INDEX "role_scenario_scenario_type_idx" ON "role_scenario"("scenario_type");
CREATE INDEX "role_scenario_status_idx" ON "role_scenario"("status");
CREATE INDEX "role_scenario_priority_idx" ON "role_scenario"("priority");
CREATE INDEX "role_scenario_impact_score_idx" ON "role_scenario"("impact_score");
CREATE INDEX "role_scenario_tags_idx" ON "role_scenario" USING GIN ("tags");
CREATE INDEX "role_scenario_created_at_idx" ON "role_scenario"("created_at");
CREATE INDEX "role_scenario_updated_at_idx" ON "role_scenario"("updated_at");
CREATE INDEX "role_scenario_deleted_at_idx" ON "role_scenario"("deleted_at");

ALTER TABLE "role_scenario" ADD CONSTRAINT "role_scenario_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "role_scenario" ADD CONSTRAINT "role_scenario_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "role_scenario" ADD CONSTRAINT "role_scenario_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "role_scenario" ADD CONSTRAINT "role_scenario_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skill"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "role_scenario" ADD CONSTRAINT "role_scenario_knowledge_id_fkey" FOREIGN KEY ("knowledge_id") REFERENCES "knowledge_base"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "role_scenario" ADD CONSTRAINT "role_scenario_tool_id_fkey" FOREIGN KEY ("tool_id") REFERENCES "tool"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "role_scenario" ADD CONSTRAINT "role_scenario_prompt_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "prompt_template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMENT ON TABLE "role_scenario" IS '岗位场景编排表，用于把岗位、业务流程、Agent、Skill、知识库、工具、提示词和验收标准组合成可落地的 AI 场景包。';

COMMENT ON COLUMN "role_scenario"."id" IS '岗位场景包 ID。';
COMMENT ON COLUMN "role_scenario"."tenant_id" IS '所属租户 ID。';
COMMENT ON COLUMN "role_scenario"."owner_id" IS '场景包负责人用户 ID。';
COMMENT ON COLUMN "role_scenario"."agent_id" IS '绑定的 Agent ID。';
COMMENT ON COLUMN "role_scenario"."skill_id" IS '绑定的技能资产 ID。';
COMMENT ON COLUMN "role_scenario"."knowledge_id" IS '绑定的知识库 ID。';
COMMENT ON COLUMN "role_scenario"."tool_id" IS '绑定的工具 ID。';
COMMENT ON COLUMN "role_scenario"."prompt_id" IS '绑定的提示词模板 ID。';
COMMENT ON COLUMN "role_scenario"."name" IS '岗位场景包名称。';
COMMENT ON COLUMN "role_scenario"."code" IS '岗位场景包编码，同一租户内唯一。';
COMMENT ON COLUMN "role_scenario"."role_name" IS '目标岗位名称，例如售前顾问、客服主管、运维工程师。';
COMMENT ON COLUMN "role_scenario"."department_name" IS '适用部门名称。';
COMMENT ON COLUMN "role_scenario"."scenario_type" IS '场景类型，SALES 售前销售、SERVICE 服务、OPERATIONS 运营运维、DESIGN 设计、TRAINING 培训、MANAGEMENT 管理、CUSTOM 自定义。';
COMMENT ON COLUMN "role_scenario"."status" IS '场景包状态，DRAFT 草稿、READY 就绪、PILOTING 试点、ACTIVE 已启用、ARCHIVED 已归档。';
COMMENT ON COLUMN "role_scenario"."priority" IS '落地优先级，LOW 低、MEDIUM 中、HIGH 高。';
COMMENT ON COLUMN "role_scenario"."pain_point" IS '业务痛点，描述当前岗位流程中的问题和阻力。';
COMMENT ON COLUMN "role_scenario"."business_goal" IS '业务目标，描述该场景包要达成的业务结果。';
COMMENT ON COLUMN "role_scenario"."workflow_summary" IS '流程编排摘要，描述场景包执行步骤和关键节点。';
COMMENT ON COLUMN "role_scenario"."expected_outcome" IS '预期成果，描述场景包完成后应产生的业务收益。';
COMMENT ON COLUMN "role_scenario"."sample_deliverable" IS '样板成果，描述可演示、可验收的交付物形态。';
COMMENT ON COLUMN "role_scenario"."acceptance_criteria" IS '验收标准，描述客户或内部验收时使用的判断口径。';
COMMENT ON COLUMN "role_scenario"."roi_metric" IS 'ROI 指标，描述效率、成本、质量或风险方面的衡量方式。';
COMMENT ON COLUMN "role_scenario"."impact_score" IS '落地价值评分，0 到 100，结合优先级、绑定资产完整度和内容完整度计算或手工维护。';
COMMENT ON COLUMN "role_scenario"."tags" IS '场景包标签数组，用于分类筛选和复用。';
COMMENT ON COLUMN "role_scenario"."notes" IS '补充备注。';
COMMENT ON COLUMN "role_scenario"."created_at" IS '创建时间。';
COMMENT ON COLUMN "role_scenario"."updated_at" IS '更新时间。';
COMMENT ON COLUMN "role_scenario"."deleted_at" IS '软删除时间。';
COMMENT ON COLUMN "role_scenario"."created_by" IS '创建人用户 ID。';
COMMENT ON COLUMN "role_scenario"."updated_by" IS '最近更新人用户 ID。';
