CREATE TABLE IF NOT EXISTS "solution_package" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" uuid NOT NULL,
    "owner_id" uuid,
    "customer_assessment_id" uuid,
    "role_scenario_id" uuid,
    "name" varchar(180) NOT NULL,
    "code" varchar(100) NOT NULL,
    "customer_name" varchar(160) NOT NULL,
    "industry" varchar(120),
    "customer_type" varchar(40) NOT NULL DEFAULT 'UNKNOWN',
    "package_stage" varchar(40) NOT NULL DEFAULT 'DISCOVERY',
    "status" varchar(40) NOT NULL DEFAULT 'DRAFT',
    "priority" varchar(20) NOT NULL DEFAULT 'MEDIUM',
    "executive_summary" text NOT NULL,
    "business_objectives" text NOT NULL,
    "scope_summary" text NOT NULL,
    "scenario_blueprint" text NOT NULL,
    "delivery_roadmap" text NOT NULL,
    "acceptance_plan" text NOT NULL,
    "roi_summary" text NOT NULL,
    "risk_mitigation" text NOT NULL,
    "commercial_strategy" text NOT NULL,
    "next_milestone" text NOT NULL,
    "package_score" integer NOT NULL DEFAULT 0,
    "tags" text[] NOT NULL DEFAULT ARRAY[]::text[],
    "notes" text,
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp(3) NOT NULL,
    "deleted_at" timestamp(3),
    "created_by" uuid,
    "updated_by" uuid,
    CONSTRAINT "solution_package_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "solution_package_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "solution_package_customer_assessment_id_fkey" FOREIGN KEY ("customer_assessment_id") REFERENCES "customer_assessment"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "solution_package_role_scenario_id_fkey" FOREIGN KEY ("role_scenario_id") REFERENCES "role_scenario"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "solution_package_tenant_id_code_key" ON "solution_package"("tenant_id", "code");
CREATE INDEX IF NOT EXISTS "solution_package_tenant_id_idx" ON "solution_package"("tenant_id");
CREATE INDEX IF NOT EXISTS "solution_package_owner_id_idx" ON "solution_package"("owner_id");
CREATE INDEX IF NOT EXISTS "solution_package_customer_assessment_id_idx" ON "solution_package"("customer_assessment_id");
CREATE INDEX IF NOT EXISTS "solution_package_role_scenario_id_idx" ON "solution_package"("role_scenario_id");
CREATE INDEX IF NOT EXISTS "solution_package_customer_name_idx" ON "solution_package"("customer_name");
CREATE INDEX IF NOT EXISTS "solution_package_industry_idx" ON "solution_package"("industry");
CREATE INDEX IF NOT EXISTS "solution_package_customer_type_idx" ON "solution_package"("customer_type");
CREATE INDEX IF NOT EXISTS "solution_package_package_stage_idx" ON "solution_package"("package_stage");
CREATE INDEX IF NOT EXISTS "solution_package_status_idx" ON "solution_package"("status");
CREATE INDEX IF NOT EXISTS "solution_package_priority_idx" ON "solution_package"("priority");
CREATE INDEX IF NOT EXISTS "solution_package_package_score_idx" ON "solution_package"("package_score");
CREATE INDEX IF NOT EXISTS "solution_package_tags_idx" ON "solution_package" USING GIN ("tags");
CREATE INDEX IF NOT EXISTS "solution_package_created_at_idx" ON "solution_package"("created_at");
CREATE INDEX IF NOT EXISTS "solution_package_updated_at_idx" ON "solution_package"("updated_at");
CREATE INDEX IF NOT EXISTS "solution_package_deleted_at_idx" ON "solution_package"("deleted_at");

COMMENT ON TABLE "solution_package" IS 'AI 落地方案包表，承接客户评估与岗位场景，沉淀可交付方案、路线图、验收与 ROI 摘要';
COMMENT ON COLUMN "solution_package"."id" IS '方案包主键 ID';
COMMENT ON COLUMN "solution_package"."tenant_id" IS '所属租户 ID';
COMMENT ON COLUMN "solution_package"."owner_id" IS '方案包负责人用户 ID';
COMMENT ON COLUMN "solution_package"."customer_assessment_id" IS '关联客户分层与六问评估 ID';
COMMENT ON COLUMN "solution_package"."role_scenario_id" IS '关联岗位场景编排包 ID';
COMMENT ON COLUMN "solution_package"."name" IS '方案包名称';
COMMENT ON COLUMN "solution_package"."code" IS '租户内唯一方案包编码';
COMMENT ON COLUMN "solution_package"."customer_name" IS '客户名称';
COMMENT ON COLUMN "solution_package"."industry" IS '客户所属行业';
COMMENT ON COLUMN "solution_package"."customer_type" IS '客户类型：UNKNOWN/ANXIOUS/TASK_DRIVEN/CLEAR';
COMMENT ON COLUMN "solution_package"."package_stage" IS '方案阶段：DISCOVERY/SOLUTION_DESIGN/PILOT_DESIGN/DELIVERY_PLAN/EXPANSION';
COMMENT ON COLUMN "solution_package"."status" IS '方案状态：DRAFT/REVIEWING/APPROVED/DELIVERING/CLOSED/ARCHIVED';
COMMENT ON COLUMN "solution_package"."priority" IS '优先级：LOW/MEDIUM/HIGH';
COMMENT ON COLUMN "solution_package"."executive_summary" IS '面向决策层的方案摘要';
COMMENT ON COLUMN "solution_package"."business_objectives" IS '业务目标与经营结果定义';
COMMENT ON COLUMN "solution_package"."scope_summary" IS '落地范围、岗位、部门与边界摘要';
COMMENT ON COLUMN "solution_package"."scenario_blueprint" IS '场景蓝图与流程串联说明';
COMMENT ON COLUMN "solution_package"."delivery_roadmap" IS '分阶段交付路线图';
COMMENT ON COLUMN "solution_package"."acceptance_plan" IS '验收计划与验收材料要求';
COMMENT ON COLUMN "solution_package"."roi_summary" IS 'ROI、提效、降本、质量或复用指标摘要';
COMMENT ON COLUMN "solution_package"."risk_mitigation" IS '风险控制与缓释方案';
COMMENT ON COLUMN "solution_package"."commercial_strategy" IS '商务推进与扩展策略';
COMMENT ON COLUMN "solution_package"."next_milestone" IS '下一步里程碑或行动项';
COMMENT ON COLUMN "solution_package"."package_score" IS '方案完整度或优先级评分，0-100';
COMMENT ON COLUMN "solution_package"."tags" IS '方案标签数组';
COMMENT ON COLUMN "solution_package"."notes" IS '内部备注';
COMMENT ON COLUMN "solution_package"."created_at" IS '创建时间';
COMMENT ON COLUMN "solution_package"."updated_at" IS '更新时间';
COMMENT ON COLUMN "solution_package"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "solution_package"."created_by" IS '创建人用户 ID';
COMMENT ON COLUMN "solution_package"."updated_by" IS '最后更新人用户 ID';
