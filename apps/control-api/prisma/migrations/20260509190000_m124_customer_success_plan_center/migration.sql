CREATE TABLE IF NOT EXISTS "customer_success_plan" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "owner_id" UUID,
    "delivery_review_id" UUID NOT NULL,
    "delivery_asset_id" UUID,
    "solution_package_id" UUID,
    "name" VARCHAR(180) NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "customer_name" VARCHAR(160) NOT NULL,
    "plan_stage" VARCHAR(50) NOT NULL DEFAULT 'DISCOVERY',
    "status" VARCHAR(40) NOT NULL DEFAULT 'DRAFT',
    "priority" VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    "health_level" VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    "success_score" INTEGER NOT NULL DEFAULT 0,
    "expansion_scope" TEXT NOT NULL,
    "success_objectives" TEXT NOT NULL,
    "stakeholder_plan" TEXT NOT NULL,
    "asset_reuse_plan" TEXT NOT NULL,
    "renewal_plan" TEXT NOT NULL,
    "risk_summary" TEXT NOT NULL,
    "next_action" TEXT NOT NULL,
    "due_at" TIMESTAMP(3),
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" UUID,
    "updated_by" UUID,
    CONSTRAINT "customer_success_plan_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "customer_success_plan_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "customer_success_plan_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "customer_success_plan_delivery_review_id_fkey" FOREIGN KEY ("delivery_review_id") REFERENCES "delivery_review"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "customer_success_plan_delivery_asset_id_fkey" FOREIGN KEY ("delivery_asset_id") REFERENCES "delivery_asset"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "customer_success_plan_solution_package_id_fkey" FOREIGN KEY ("solution_package_id") REFERENCES "solution_package"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "customer_success_plan_tenant_id_code_key" ON "customer_success_plan"("tenant_id", "code");
CREATE INDEX IF NOT EXISTS "customer_success_plan_tenant_id_idx" ON "customer_success_plan"("tenant_id");
CREATE INDEX IF NOT EXISTS "customer_success_plan_owner_id_idx" ON "customer_success_plan"("owner_id");
CREATE INDEX IF NOT EXISTS "customer_success_plan_delivery_review_id_idx" ON "customer_success_plan"("delivery_review_id");
CREATE INDEX IF NOT EXISTS "customer_success_plan_delivery_asset_id_idx" ON "customer_success_plan"("delivery_asset_id");
CREATE INDEX IF NOT EXISTS "customer_success_plan_solution_package_id_idx" ON "customer_success_plan"("solution_package_id");
CREATE INDEX IF NOT EXISTS "customer_success_plan_customer_name_idx" ON "customer_success_plan"("customer_name");
CREATE INDEX IF NOT EXISTS "customer_success_plan_plan_stage_idx" ON "customer_success_plan"("plan_stage");
CREATE INDEX IF NOT EXISTS "customer_success_plan_status_idx" ON "customer_success_plan"("status");
CREATE INDEX IF NOT EXISTS "customer_success_plan_priority_idx" ON "customer_success_plan"("priority");
CREATE INDEX IF NOT EXISTS "customer_success_plan_health_level_idx" ON "customer_success_plan"("health_level");
CREATE INDEX IF NOT EXISTS "customer_success_plan_success_score_idx" ON "customer_success_plan"("success_score");
CREATE INDEX IF NOT EXISTS "customer_success_plan_due_at_idx" ON "customer_success_plan"("due_at");
CREATE INDEX IF NOT EXISTS "customer_success_plan_tags_idx" ON "customer_success_plan" USING GIN ("tags");
CREATE INDEX IF NOT EXISTS "customer_success_plan_created_at_idx" ON "customer_success_plan"("created_at");
CREATE INDEX IF NOT EXISTS "customer_success_plan_updated_at_idx" ON "customer_success_plan"("updated_at");
CREATE INDEX IF NOT EXISTS "customer_success_plan_deleted_at_idx" ON "customer_success_plan"("deleted_at");

COMMENT ON TABLE "customer_success_plan" IS '客户成功计划表，用于把交付验收、成果资产和落地方案沉淀为扩展推广、续约准备、健康运营和客户成功跟进计划';
COMMENT ON COLUMN "customer_success_plan"."id" IS '客户成功计划主键 ID';
COMMENT ON COLUMN "customer_success_plan"."tenant_id" IS '所属租户 ID';
COMMENT ON COLUMN "customer_success_plan"."owner_id" IS '客户成功计划负责人用户 ID';
COMMENT ON COLUMN "customer_success_plan"."delivery_review_id" IS '来源验收复盘 ID，客户成功计划必须从一次交付验收或复盘结论延伸';
COMMENT ON COLUMN "customer_success_plan"."delivery_asset_id" IS '关联成果资产 ID，用于标记本计划计划复用的成果资产、模板或案例';
COMMENT ON COLUMN "customer_success_plan"."solution_package_id" IS '关联 AI 落地方案包 ID，可从验收复盘或成果资产推导，也可显式绑定';
COMMENT ON COLUMN "customer_success_plan"."name" IS '客户成功计划名称';
COMMENT ON COLUMN "customer_success_plan"."code" IS '租户内唯一客户成功计划编码';
COMMENT ON COLUMN "customer_success_plan"."customer_name" IS '客户名称';
COMMENT ON COLUMN "customer_success_plan"."plan_stage" IS '计划阶段：DISCOVERY 发现机会、EXPANSION_DESIGN 扩展设计、PILOT_ROLLOUT 试点推广、RENEWAL_PREP 续约准备、CLOSED 已关闭';
COMMENT ON COLUMN "customer_success_plan"."status" IS '计划状态：DRAFT 草稿、ACTIVE 进行中、BLOCKED 受阻、COMPLETED 已完成、ARCHIVED 已归档';
COMMENT ON COLUMN "customer_success_plan"."priority" IS '优先级：LOW 低、MEDIUM 中、HIGH 高';
COMMENT ON COLUMN "customer_success_plan"."health_level" IS '客户健康度：LOW 低、MEDIUM 中、HIGH 高';
COMMENT ON COLUMN "customer_success_plan"."success_score" IS '客户成功评分，0 到 100，用于衡量扩展价值、续约准备、风险可控性和资产复用成熟度';
COMMENT ON COLUMN "customer_success_plan"."expansion_scope" IS '扩展范围，描述后续要推广的部门、岗位、场景、Agent 或业务流程';
COMMENT ON COLUMN "customer_success_plan"."success_objectives" IS '成功目标，描述客户成功、续约、扩展和业务价值验证目标';
COMMENT ON COLUMN "customer_success_plan"."stakeholder_plan" IS '干系人计划，描述客户侧、内部侧负责人、沟通节奏和决策路径';
COMMENT ON COLUMN "customer_success_plan"."asset_reuse_plan" IS '资产复用计划，描述将复用哪些成果资产、模板、验收清单、案例或 Skill';
COMMENT ON COLUMN "customer_success_plan"."renewal_plan" IS '续约计划，描述续约材料、商务节奏、追加范围和升级路径';
COMMENT ON COLUMN "customer_success_plan"."risk_summary" IS '风险摘要，描述扩展推广、续约、资料权限、跨部门协同和客户健康风险';
COMMENT ON COLUMN "customer_success_plan"."next_action" IS '下一步动作，描述近期需要执行的客户成功动作、会议、评审或交付任务';
COMMENT ON COLUMN "customer_success_plan"."due_at" IS '计划到期或下一关键节点时间';
COMMENT ON COLUMN "customer_success_plan"."tags" IS '客户成功计划标签数组';
COMMENT ON COLUMN "customer_success_plan"."notes" IS '内部备注';
COMMENT ON COLUMN "customer_success_plan"."created_at" IS '创建时间';
COMMENT ON COLUMN "customer_success_plan"."updated_at" IS '更新时间';
COMMENT ON COLUMN "customer_success_plan"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "customer_success_plan"."created_by" IS '创建人用户 ID';
COMMENT ON COLUMN "customer_success_plan"."updated_by" IS '最后更新人用户 ID';
