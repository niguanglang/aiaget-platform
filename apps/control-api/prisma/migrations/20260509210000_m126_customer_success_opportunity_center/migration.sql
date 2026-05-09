CREATE TABLE "customer_success_opportunity" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "owner_id" UUID,
    "customer_success_plan_id" UUID NOT NULL,
    "customer_success_action_id" UUID,
    "delivery_review_id" UUID,
    "delivery_asset_id" UUID,
    "solution_package_id" UUID,
    "name" VARCHAR(180) NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "customer_name" VARCHAR(160) NOT NULL,
    "opportunity_type" VARCHAR(50) NOT NULL DEFAULT 'RENEWAL',
    "stage" VARCHAR(50) NOT NULL DEFAULT 'DISCOVERY',
    "status" VARCHAR(40) NOT NULL DEFAULT 'OPEN',
    "priority" VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    "confidence_level" VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    "risk_level" VARCHAR(20) NOT NULL DEFAULT 'LOW',
    "opportunity_score" INTEGER NOT NULL DEFAULT 0,
    "estimated_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "probability" INTEGER NOT NULL DEFAULT 0,
    "expected_close_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "opportunity_summary" TEXT NOT NULL,
    "customer_value" TEXT NOT NULL,
    "commercial_strategy" TEXT NOT NULL,
    "decision_path" TEXT NOT NULL,
    "risk_summary" TEXT NOT NULL,
    "next_action" TEXT NOT NULL,
    "loss_reason" TEXT,
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "customer_success_opportunity_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "customer_success_opportunity_tenant_id_code_key" ON "customer_success_opportunity"("tenant_id", "code");
CREATE INDEX "customer_success_opportunity_tenant_id_idx" ON "customer_success_opportunity"("tenant_id");
CREATE INDEX "customer_success_opportunity_owner_id_idx" ON "customer_success_opportunity"("owner_id");
CREATE INDEX "customer_success_opportunity_customer_success_plan_id_idx" ON "customer_success_opportunity"("customer_success_plan_id");
CREATE INDEX "customer_success_opportunity_customer_success_action_id_idx" ON "customer_success_opportunity"("customer_success_action_id");
CREATE INDEX "customer_success_opportunity_delivery_review_id_idx" ON "customer_success_opportunity"("delivery_review_id");
CREATE INDEX "customer_success_opportunity_delivery_asset_id_idx" ON "customer_success_opportunity"("delivery_asset_id");
CREATE INDEX "customer_success_opportunity_solution_package_id_idx" ON "customer_success_opportunity"("solution_package_id");
CREATE INDEX "customer_success_opportunity_customer_name_idx" ON "customer_success_opportunity"("customer_name");
CREATE INDEX "customer_success_opportunity_opportunity_type_idx" ON "customer_success_opportunity"("opportunity_type");
CREATE INDEX "customer_success_opportunity_stage_idx" ON "customer_success_opportunity"("stage");
CREATE INDEX "customer_success_opportunity_status_idx" ON "customer_success_opportunity"("status");
CREATE INDEX "customer_success_opportunity_priority_idx" ON "customer_success_opportunity"("priority");
CREATE INDEX "customer_success_opportunity_confidence_level_idx" ON "customer_success_opportunity"("confidence_level");
CREATE INDEX "customer_success_opportunity_risk_level_idx" ON "customer_success_opportunity"("risk_level");
CREATE INDEX "customer_success_opportunity_opportunity_score_idx" ON "customer_success_opportunity"("opportunity_score");
CREATE INDEX "customer_success_opportunity_estimated_amount_idx" ON "customer_success_opportunity"("estimated_amount");
CREATE INDEX "customer_success_opportunity_probability_idx" ON "customer_success_opportunity"("probability");
CREATE INDEX "customer_success_opportunity_expected_close_at_idx" ON "customer_success_opportunity"("expected_close_at");
CREATE INDEX "customer_success_opportunity_closed_at_idx" ON "customer_success_opportunity"("closed_at");
CREATE INDEX "customer_success_opportunity_tags_idx" ON "customer_success_opportunity"("tags");
CREATE INDEX "customer_success_opportunity_created_at_idx" ON "customer_success_opportunity"("created_at");
CREATE INDEX "customer_success_opportunity_updated_at_idx" ON "customer_success_opportunity"("updated_at");
CREATE INDEX "customer_success_opportunity_deleted_at_idx" ON "customer_success_opportunity"("deleted_at");

ALTER TABLE "customer_success_opportunity" ADD CONSTRAINT "customer_success_opportunity_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "customer_success_opportunity" ADD CONSTRAINT "customer_success_opportunity_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "customer_success_opportunity" ADD CONSTRAINT "customer_success_opportunity_customer_success_plan_id_fkey" FOREIGN KEY ("customer_success_plan_id") REFERENCES "customer_success_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "customer_success_opportunity" ADD CONSTRAINT "customer_success_opportunity_customer_success_action_id_fkey" FOREIGN KEY ("customer_success_action_id") REFERENCES "customer_success_action"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "customer_success_opportunity" ADD CONSTRAINT "customer_success_opportunity_delivery_review_id_fkey" FOREIGN KEY ("delivery_review_id") REFERENCES "delivery_review"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "customer_success_opportunity" ADD CONSTRAINT "customer_success_opportunity_delivery_asset_id_fkey" FOREIGN KEY ("delivery_asset_id") REFERENCES "delivery_asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "customer_success_opportunity" ADD CONSTRAINT "customer_success_opportunity_solution_package_id_fkey" FOREIGN KEY ("solution_package_id") REFERENCES "solution_package"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMENT ON TABLE "customer_success_opportunity" IS '客户成功续约机会表，用于把客户成功计划和成功行动沉淀为可跟踪的续约、扩展、增购、交叉销售和风险挽留商务机会';
COMMENT ON COLUMN "customer_success_opportunity"."id" IS '客户成功续约机会主键 ID';
COMMENT ON COLUMN "customer_success_opportunity"."tenant_id" IS '租户 ID，用于多租户数据隔离';
COMMENT ON COLUMN "customer_success_opportunity"."owner_id" IS '机会负责人用户 ID';
COMMENT ON COLUMN "customer_success_opportunity"."customer_success_plan_id" IS '关联客户成功计划 ID';
COMMENT ON COLUMN "customer_success_opportunity"."customer_success_action_id" IS '关联客户成功行动 ID，可为空';
COMMENT ON COLUMN "customer_success_opportunity"."delivery_review_id" IS '来源验收复盘 ID，可从客户成功计划或行动继承';
COMMENT ON COLUMN "customer_success_opportunity"."delivery_asset_id" IS '关联成果资产 ID，可从客户成功计划或行动继承';
COMMENT ON COLUMN "customer_success_opportunity"."solution_package_id" IS '关联落地方案包 ID，可从客户成功计划或行动推导';
COMMENT ON COLUMN "customer_success_opportunity"."name" IS '客户成功续约机会名称';
COMMENT ON COLUMN "customer_success_opportunity"."code" IS '租户内唯一客户成功续约机会编码';
COMMENT ON COLUMN "customer_success_opportunity"."customer_name" IS '客户名称';
COMMENT ON COLUMN "customer_success_opportunity"."opportunity_type" IS '机会类型：续约、扩展、增购、交叉销售或风险挽留';
COMMENT ON COLUMN "customer_success_opportunity"."stage" IS '机会阶段：发现、确认、方案、谈判、赢单、输单或归档';
COMMENT ON COLUMN "customer_success_opportunity"."status" IS '机会状态：打开、风险中、赢单、输单或归档';
COMMENT ON COLUMN "customer_success_opportunity"."priority" IS '机会优先级';
COMMENT ON COLUMN "customer_success_opportunity"."confidence_level" IS '机会信心等级';
COMMENT ON COLUMN "customer_success_opportunity"."risk_level" IS '机会风险等级';
COMMENT ON COLUMN "customer_success_opportunity"."opportunity_score" IS '机会综合评分，0 到 100';
COMMENT ON COLUMN "customer_success_opportunity"."estimated_amount" IS '预计商务金额';
COMMENT ON COLUMN "customer_success_opportunity"."probability" IS '预计成交概率，0 到 100';
COMMENT ON COLUMN "customer_success_opportunity"."expected_close_at" IS '预计关闭时间';
COMMENT ON COLUMN "customer_success_opportunity"."closed_at" IS '实际关闭时间';
COMMENT ON COLUMN "customer_success_opportunity"."opportunity_summary" IS '机会摘要，描述机会来源、目标和推进背景';
COMMENT ON COLUMN "customer_success_opportunity"."customer_value" IS '客户价值说明';
COMMENT ON COLUMN "customer_success_opportunity"."commercial_strategy" IS '商务推进策略';
COMMENT ON COLUMN "customer_success_opportunity"."decision_path" IS '客户决策路径和关键干系人说明';
COMMENT ON COLUMN "customer_success_opportunity"."risk_summary" IS '机会风险摘要';
COMMENT ON COLUMN "customer_success_opportunity"."next_action" IS '下一步商务或客户成功动作';
COMMENT ON COLUMN "customer_success_opportunity"."loss_reason" IS '输单或关闭原因';
COMMENT ON COLUMN "customer_success_opportunity"."tags" IS '机会标签数组';
COMMENT ON COLUMN "customer_success_opportunity"."notes" IS '内部备注';
COMMENT ON COLUMN "customer_success_opportunity"."created_at" IS '创建时间';
COMMENT ON COLUMN "customer_success_opportunity"."updated_at" IS '更新时间';
COMMENT ON COLUMN "customer_success_opportunity"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "customer_success_opportunity"."created_by" IS '创建人用户 ID';
COMMENT ON COLUMN "customer_success_opportunity"."updated_by" IS '最后更新人用户 ID';
