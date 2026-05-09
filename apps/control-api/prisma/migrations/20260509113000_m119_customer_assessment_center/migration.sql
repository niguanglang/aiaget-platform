CREATE TABLE "customer_assessment" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "owner_id" UUID,
  "customer_name" VARCHAR(160) NOT NULL,
  "customer_type" VARCHAR(40) NOT NULL DEFAULT 'UNKNOWN',
  "decision_stage" VARCHAR(40) NOT NULL DEFAULT 'LEARNING',
  "status" VARCHAR(40) NOT NULL DEFAULT 'DISCOVERY',
  "industry" VARCHAR(120),
  "contact_name" VARCHAR(120),
  "contact_info" VARCHAR(240),
  "business_goal" TEXT NOT NULL,
  "process_maturity" TEXT NOT NULL,
  "data_asset_status" TEXT NOT NULL,
  "management_support" TEXT NOT NULL,
  "budget_signal" TEXT NOT NULL,
  "six_question_scores" JSONB NOT NULL,
  "readiness_score" INTEGER NOT NULL DEFAULT 0,
  "recommended_strategy" TEXT NOT NULL,
  "risk_summary" TEXT NOT NULL,
  "next_action" TEXT NOT NULL,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,

  CONSTRAINT "customer_assessment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "customer_assessment_tenant_id_idx" ON "customer_assessment"("tenant_id");
CREATE INDEX "customer_assessment_owner_id_idx" ON "customer_assessment"("owner_id");
CREATE INDEX "customer_assessment_customer_type_idx" ON "customer_assessment"("customer_type");
CREATE INDEX "customer_assessment_decision_stage_idx" ON "customer_assessment"("decision_stage");
CREATE INDEX "customer_assessment_status_idx" ON "customer_assessment"("status");
CREATE INDEX "customer_assessment_industry_idx" ON "customer_assessment"("industry");
CREATE INDEX "customer_assessment_readiness_score_idx" ON "customer_assessment"("readiness_score");
CREATE INDEX "customer_assessment_created_at_idx" ON "customer_assessment"("created_at");
CREATE INDEX "customer_assessment_updated_at_idx" ON "customer_assessment"("updated_at");
CREATE INDEX "customer_assessment_deleted_at_idx" ON "customer_assessment"("deleted_at");

ALTER TABLE "customer_assessment" ADD CONSTRAINT "customer_assessment_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "customer_assessment" ADD CONSTRAINT "customer_assessment_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMENT ON TABLE "customer_assessment" IS '客户分层与六问评估表，用于记录客户 AI 落地准备度、客户类型、决策阶段、风险和下一步打法。';

COMMENT ON COLUMN "customer_assessment"."id" IS '客户评估 ID。';
COMMENT ON COLUMN "customer_assessment"."tenant_id" IS '所属租户 ID。';
COMMENT ON COLUMN "customer_assessment"."owner_id" IS '负责人用户 ID。';
COMMENT ON COLUMN "customer_assessment"."customer_name" IS '客户名称。';
COMMENT ON COLUMN "customer_assessment"."customer_type" IS '客户类型，UNKNOWN 未判断、ANXIOUS 焦虑型、TASK_DRIVEN 任务型、CLEAR 清醒型。';
COMMENT ON COLUMN "customer_assessment"."decision_stage" IS '客户决策阶段，LEARNING 学习、EVALUATION 评估、PROCUREMENT 采购、PILOT 试点、DELIVERY 交付。';
COMMENT ON COLUMN "customer_assessment"."status" IS '评估状态，DISCOVERY 发现、QUALIFIED 已确认、NURTURING 培育、WON 赢单、LOST 输单、ARCHIVED 已归档。';
COMMENT ON COLUMN "customer_assessment"."industry" IS '客户所属行业。';
COMMENT ON COLUMN "customer_assessment"."contact_name" IS '关键联系人姓名。';
COMMENT ON COLUMN "customer_assessment"."contact_info" IS '关键联系人联系方式。';
COMMENT ON COLUMN "customer_assessment"."business_goal" IS '经营目标判断，回答客户是否有明确经营目标。';
COMMENT ON COLUMN "customer_assessment"."process_maturity" IS '流程成熟度判断，回答客户是否有稳定流程。';
COMMENT ON COLUMN "customer_assessment"."data_asset_status" IS '数据与知识资产状态，回答客户是否有可用数据和知识资产。';
COMMENT ON COLUMN "customer_assessment"."management_support" IS '管理层推动情况，回答是否有管理层推动。';
COMMENT ON COLUMN "customer_assessment"."budget_signal" IS '预算意识和采购信号。';
COMMENT ON COLUMN "customer_assessment"."six_question_scores" IS '六问评分 JSON，包含客户类型清晰度、决策意图、经营目标、流程成熟度、数据资产、管理预算六项 1 到 5 分。';
COMMENT ON COLUMN "customer_assessment"."readiness_score" IS 'AI 落地准备度分数，按六问评分折算为 0 到 100。';
COMMENT ON COLUMN "customer_assessment"."recommended_strategy" IS '推荐打法，根据客户类型和准备度生成。';
COMMENT ON COLUMN "customer_assessment"."risk_summary" IS '风险提示摘要。';
COMMENT ON COLUMN "customer_assessment"."next_action" IS '下一步动作建议。';
COMMENT ON COLUMN "customer_assessment"."notes" IS '补充备注。';
COMMENT ON COLUMN "customer_assessment"."created_at" IS '创建时间。';
COMMENT ON COLUMN "customer_assessment"."updated_at" IS '更新时间。';
COMMENT ON COLUMN "customer_assessment"."deleted_at" IS '软删除时间。';
COMMENT ON COLUMN "customer_assessment"."created_by" IS '创建人用户 ID。';
COMMENT ON COLUMN "customer_assessment"."updated_by" IS '最近更新人用户 ID。';
