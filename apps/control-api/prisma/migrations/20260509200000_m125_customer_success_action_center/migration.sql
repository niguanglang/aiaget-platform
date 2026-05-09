CREATE TABLE IF NOT EXISTS "customer_success_action" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "owner_id" UUID,
    "customer_success_plan_id" UUID NOT NULL,
    "delivery_review_id" UUID,
    "delivery_asset_id" UUID,
    "solution_package_id" UUID,
    "name" VARCHAR(180) NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "customer_name" VARCHAR(160) NOT NULL,
    "action_type" VARCHAR(50) NOT NULL DEFAULT 'FOLLOW_UP',
    "status" VARCHAR(40) NOT NULL DEFAULT 'TODO',
    "priority" VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    "risk_level" VARCHAR(20) NOT NULL DEFAULT 'LOW',
    "action_score" INTEGER NOT NULL DEFAULT 0,
    "action_summary" TEXT NOT NULL,
    "expected_outcome" TEXT NOT NULL,
    "execution_notes" TEXT NOT NULL,
    "blocker_summary" TEXT NOT NULL,
    "completion_evidence" TEXT NOT NULL,
    "next_action" TEXT NOT NULL,
    "due_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" UUID,
    "updated_by" UUID,
    CONSTRAINT "customer_success_action_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "customer_success_action_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "customer_success_action_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "customer_success_action_customer_success_plan_id_fkey" FOREIGN KEY ("customer_success_plan_id") REFERENCES "customer_success_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "customer_success_action_delivery_review_id_fkey" FOREIGN KEY ("delivery_review_id") REFERENCES "delivery_review"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "customer_success_action_delivery_asset_id_fkey" FOREIGN KEY ("delivery_asset_id") REFERENCES "delivery_asset"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "customer_success_action_solution_package_id_fkey" FOREIGN KEY ("solution_package_id") REFERENCES "solution_package"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "customer_success_action_tenant_id_code_key" ON "customer_success_action"("tenant_id", "code");
CREATE INDEX IF NOT EXISTS "customer_success_action_tenant_id_idx" ON "customer_success_action"("tenant_id");
CREATE INDEX IF NOT EXISTS "customer_success_action_owner_id_idx" ON "customer_success_action"("owner_id");
CREATE INDEX IF NOT EXISTS "customer_success_action_customer_success_plan_id_idx" ON "customer_success_action"("customer_success_plan_id");
CREATE INDEX IF NOT EXISTS "customer_success_action_delivery_review_id_idx" ON "customer_success_action"("delivery_review_id");
CREATE INDEX IF NOT EXISTS "customer_success_action_delivery_asset_id_idx" ON "customer_success_action"("delivery_asset_id");
CREATE INDEX IF NOT EXISTS "customer_success_action_solution_package_id_idx" ON "customer_success_action"("solution_package_id");
CREATE INDEX IF NOT EXISTS "customer_success_action_customer_name_idx" ON "customer_success_action"("customer_name");
CREATE INDEX IF NOT EXISTS "customer_success_action_action_type_idx" ON "customer_success_action"("action_type");
CREATE INDEX IF NOT EXISTS "customer_success_action_status_idx" ON "customer_success_action"("status");
CREATE INDEX IF NOT EXISTS "customer_success_action_priority_idx" ON "customer_success_action"("priority");
CREATE INDEX IF NOT EXISTS "customer_success_action_risk_level_idx" ON "customer_success_action"("risk_level");
CREATE INDEX IF NOT EXISTS "customer_success_action_action_score_idx" ON "customer_success_action"("action_score");
CREATE INDEX IF NOT EXISTS "customer_success_action_due_at_idx" ON "customer_success_action"("due_at");
CREATE INDEX IF NOT EXISTS "customer_success_action_completed_at_idx" ON "customer_success_action"("completed_at");
CREATE INDEX IF NOT EXISTS "customer_success_action_tags_idx" ON "customer_success_action" USING GIN ("tags");
CREATE INDEX IF NOT EXISTS "customer_success_action_created_at_idx" ON "customer_success_action"("created_at");
CREATE INDEX IF NOT EXISTS "customer_success_action_updated_at_idx" ON "customer_success_action"("updated_at");
CREATE INDEX IF NOT EXISTS "customer_success_action_deleted_at_idx" ON "customer_success_action"("deleted_at");

COMMENT ON TABLE "customer_success_action" IS '客户成功行动表，用于把客户成功计划拆解为可负责人、可截止、可跟踪、可沉淀证据的后续执行动作';
COMMENT ON COLUMN "customer_success_action"."id" IS '客户成功行动主键 ID';
COMMENT ON COLUMN "customer_success_action"."tenant_id" IS '所属租户 ID';
COMMENT ON COLUMN "customer_success_action"."owner_id" IS '行动负责人用户 ID';
COMMENT ON COLUMN "customer_success_action"."customer_success_plan_id" IS '所属客户成功计划 ID，行动必须从客户成功计划拆解而来';
COMMENT ON COLUMN "customer_success_action"."delivery_review_id" IS '关联验收复盘 ID，可继承客户成功计划来源复盘';
COMMENT ON COLUMN "customer_success_action"."delivery_asset_id" IS '关联成果资产 ID，用于标记行动会复用或沉淀的资产';
COMMENT ON COLUMN "customer_success_action"."solution_package_id" IS '关联 AI 落地方案包 ID，用于追溯行动所属交付方案';
COMMENT ON COLUMN "customer_success_action"."name" IS '客户成功行动名称';
COMMENT ON COLUMN "customer_success_action"."code" IS '租户内唯一客户成功行动编码';
COMMENT ON COLUMN "customer_success_action"."customer_name" IS '客户名称';
COMMENT ON COLUMN "customer_success_action"."action_type" IS '行动类型：MEETING 会议、ASSET_REUSE 资产复用、ROLLOUT 推广、TRAINING 培训、RENEWAL 续约、RISK_REVIEW 风险复盘、FOLLOW_UP 跟进';
COMMENT ON COLUMN "customer_success_action"."status" IS '行动状态：TODO 待处理、IN_PROGRESS 进行中、BLOCKED 受阻、DONE 已完成、CANCELLED 已取消、ARCHIVED 已归档';
COMMENT ON COLUMN "customer_success_action"."priority" IS '优先级：LOW 低、MEDIUM 中、HIGH 高';
COMMENT ON COLUMN "customer_success_action"."risk_level" IS '风险等级：LOW 低、MEDIUM 中、HIGH 高';
COMMENT ON COLUMN "customer_success_action"."action_score" IS '行动评分，0 到 100，用于衡量行动完整度、风险可控性、证据沉淀和推进成熟度';
COMMENT ON COLUMN "customer_success_action"."action_summary" IS '行动摘要，描述本次客户成功行动要做什么';
COMMENT ON COLUMN "customer_success_action"."expected_outcome" IS '预期结果，描述行动完成后应产生的客户价值、交付产物或商务结果';
COMMENT ON COLUMN "customer_success_action"."execution_notes" IS '执行记录，描述行动推进过程、沟通记录和执行情况';
COMMENT ON COLUMN "customer_success_action"."blocker_summary" IS '阻塞风险，描述当前阻塞、风险事项、责任人和待协调内容';
COMMENT ON COLUMN "customer_success_action"."completion_evidence" IS '完成证据，描述会议纪要、资产链接、验收记录、续约材料等证明材料';
COMMENT ON COLUMN "customer_success_action"."next_action" IS '下一步动作，描述行动后续需要跟进的具体事项';
COMMENT ON COLUMN "customer_success_action"."due_at" IS '行动截止时间';
COMMENT ON COLUMN "customer_success_action"."completed_at" IS '行动完成时间';
COMMENT ON COLUMN "customer_success_action"."tags" IS '客户成功行动标签数组';
COMMENT ON COLUMN "customer_success_action"."notes" IS '内部备注';
COMMENT ON COLUMN "customer_success_action"."created_at" IS '创建时间';
COMMENT ON COLUMN "customer_success_action"."updated_at" IS '更新时间';
COMMENT ON COLUMN "customer_success_action"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "customer_success_action"."created_by" IS '创建人用户 ID';
COMMENT ON COLUMN "customer_success_action"."updated_by" IS '最后更新人用户 ID';
