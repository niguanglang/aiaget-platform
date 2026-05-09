CREATE TABLE IF NOT EXISTS "delivery_review" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" uuid NOT NULL,
    "owner_id" uuid,
    "solution_package_id" uuid NOT NULL,
    "name" varchar(180) NOT NULL,
    "code" varchar(100) NOT NULL,
    "customer_name" varchar(160) NOT NULL,
    "review_stage" varchar(40) NOT NULL DEFAULT 'PILOT_ACCEPTANCE',
    "result" varchar(30) NOT NULL DEFAULT 'PARTIAL',
    "status" varchar(40) NOT NULL DEFAULT 'DRAFT',
    "satisfaction_level" varchar(30) NOT NULL DEFAULT 'MEDIUM',
    "acceptance_score" integer NOT NULL DEFAULT 0,
    "delivered_scope" text NOT NULL,
    "acceptance_summary" text NOT NULL,
    "issue_summary" text NOT NULL,
    "improvement_actions" text NOT NULL,
    "expansion_plan" text NOT NULL,
    "reusable_assets" text NOT NULL,
    "next_action" text NOT NULL,
    "reviewed_at" timestamp(3),
    "tags" text[] NOT NULL DEFAULT ARRAY[]::text[],
    "notes" text,
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp(3) NOT NULL,
    "deleted_at" timestamp(3),
    "created_by" uuid,
    "updated_by" uuid,
    CONSTRAINT "delivery_review_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "delivery_review_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "delivery_review_solution_package_id_fkey" FOREIGN KEY ("solution_package_id") REFERENCES "solution_package"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "delivery_review_tenant_id_code_key" ON "delivery_review"("tenant_id", "code");
CREATE INDEX IF NOT EXISTS "delivery_review_tenant_id_idx" ON "delivery_review"("tenant_id");
CREATE INDEX IF NOT EXISTS "delivery_review_owner_id_idx" ON "delivery_review"("owner_id");
CREATE INDEX IF NOT EXISTS "delivery_review_solution_package_id_idx" ON "delivery_review"("solution_package_id");
CREATE INDEX IF NOT EXISTS "delivery_review_customer_name_idx" ON "delivery_review"("customer_name");
CREATE INDEX IF NOT EXISTS "delivery_review_review_stage_idx" ON "delivery_review"("review_stage");
CREATE INDEX IF NOT EXISTS "delivery_review_result_idx" ON "delivery_review"("result");
CREATE INDEX IF NOT EXISTS "delivery_review_status_idx" ON "delivery_review"("status");
CREATE INDEX IF NOT EXISTS "delivery_review_satisfaction_level_idx" ON "delivery_review"("satisfaction_level");
CREATE INDEX IF NOT EXISTS "delivery_review_acceptance_score_idx" ON "delivery_review"("acceptance_score");
CREATE INDEX IF NOT EXISTS "delivery_review_reviewed_at_idx" ON "delivery_review"("reviewed_at");
CREATE INDEX IF NOT EXISTS "delivery_review_tags_idx" ON "delivery_review" USING GIN ("tags");
CREATE INDEX IF NOT EXISTS "delivery_review_created_at_idx" ON "delivery_review"("created_at");
CREATE INDEX IF NOT EXISTS "delivery_review_updated_at_idx" ON "delivery_review"("updated_at");
CREATE INDEX IF NOT EXISTS "delivery_review_deleted_at_idx" ON "delivery_review"("deleted_at");

COMMENT ON TABLE "delivery_review" IS '交付验收复盘表，用于承接 AI 落地方案包的交付验收、问题复盘、改进行动、扩展计划和可复用资产沉淀';
COMMENT ON COLUMN "delivery_review"."id" IS '验收复盘主键 ID';
COMMENT ON COLUMN "delivery_review"."tenant_id" IS '所属租户 ID';
COMMENT ON COLUMN "delivery_review"."owner_id" IS '验收复盘负责人用户 ID';
COMMENT ON COLUMN "delivery_review"."solution_package_id" IS '关联 AI 落地方案包 ID';
COMMENT ON COLUMN "delivery_review"."name" IS '验收复盘名称';
COMMENT ON COLUMN "delivery_review"."code" IS '租户内唯一验收复盘编码';
COMMENT ON COLUMN "delivery_review"."customer_name" IS '客户名称';
COMMENT ON COLUMN "delivery_review"."review_stage" IS '复盘阶段：PILOT_ACCEPTANCE 试点验收、FINAL_ACCEPTANCE 最终验收、EXPANSION_REVIEW 扩展复盘、RENEWAL_REVIEW 续约复盘';
COMMENT ON COLUMN "delivery_review"."result" IS '验收结果：PASSED 通过、PARTIAL 部分通过、FAILED 未通过、DEFERRED 延期';
COMMENT ON COLUMN "delivery_review"."status" IS '复盘状态：DRAFT 草稿、IN_REVIEW 复盘中、COMPLETED 已完成、ACTION_REQUIRED 待改进、ARCHIVED 已归档';
COMMENT ON COLUMN "delivery_review"."satisfaction_level" IS '客户满意度等级：LOW 低、MEDIUM 中、HIGH 高、VERY_HIGH 很高';
COMMENT ON COLUMN "delivery_review"."acceptance_score" IS '验收评分，0 到 100，用于衡量交付验收完整度和客户认可度';
COMMENT ON COLUMN "delivery_review"."delivered_scope" IS '已交付范围，描述本次验收覆盖的模块、场景、资料和成果';
COMMENT ON COLUMN "delivery_review"."acceptance_summary" IS '验收结论摘要，描述客户确认内容和通过依据';
COMMENT ON COLUMN "delivery_review"."issue_summary" IS '问题复盘摘要，描述未完成、风险、缺口和客户反馈';
COMMENT ON COLUMN "delivery_review"."improvement_actions" IS '改进行动项，描述后续整改、责任和跟进动作';
COMMENT ON COLUMN "delivery_review"."expansion_plan" IS '扩展计划，描述下一阶段岗位、知识库、渠道或商业扩展方向';
COMMENT ON COLUMN "delivery_review"."reusable_assets" IS '可复用资产，描述沉淀出的模板、清单、Prompt、知识库或验收材料';
COMMENT ON COLUMN "delivery_review"."next_action" IS '下一步动作或里程碑';
COMMENT ON COLUMN "delivery_review"."reviewed_at" IS '验收或复盘完成时间';
COMMENT ON COLUMN "delivery_review"."tags" IS '验收复盘标签数组';
COMMENT ON COLUMN "delivery_review"."notes" IS '内部备注';
COMMENT ON COLUMN "delivery_review"."created_at" IS '创建时间';
COMMENT ON COLUMN "delivery_review"."updated_at" IS '更新时间';
COMMENT ON COLUMN "delivery_review"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "delivery_review"."created_by" IS '创建人用户 ID';
COMMENT ON COLUMN "delivery_review"."updated_by" IS '最后更新人用户 ID';
