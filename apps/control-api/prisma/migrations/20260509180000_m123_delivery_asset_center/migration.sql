CREATE TABLE IF NOT EXISTS "delivery_asset" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" uuid NOT NULL,
    "owner_id" uuid,
    "delivery_review_id" uuid NOT NULL,
    "solution_package_id" uuid,
    "skill_id" uuid,
    "agent_id" uuid,
    "knowledge_id" uuid,
    "name" varchar(180) NOT NULL,
    "code" varchar(100) NOT NULL,
    "customer_name" varchar(160) NOT NULL,
    "asset_type" varchar(50) NOT NULL DEFAULT 'SOLUTION_TEMPLATE',
    "status" varchar(40) NOT NULL DEFAULT 'DRAFT',
    "visibility" varchar(30) NOT NULL DEFAULT 'PRIVATE',
    "reuse_score" integer NOT NULL DEFAULT 0,
    "summary" text NOT NULL,
    "business_value" text NOT NULL,
    "reuse_guidance" text NOT NULL,
    "source_context" text NOT NULL,
    "risk_notes" text NOT NULL,
    "next_action" text NOT NULL,
    "tags" text[] NOT NULL DEFAULT ARRAY[]::text[],
    "notes" text,
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" timestamp(3),
    "created_by" uuid,
    "updated_by" uuid,

    CONSTRAINT "delivery_asset_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "delivery_asset_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "delivery_asset_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "delivery_asset_delivery_review_id_fkey" FOREIGN KEY ("delivery_review_id") REFERENCES "delivery_review"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "delivery_asset_solution_package_id_fkey" FOREIGN KEY ("solution_package_id") REFERENCES "solution_package"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "delivery_asset_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skill"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "delivery_asset_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agent"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "delivery_asset_knowledge_id_fkey" FOREIGN KEY ("knowledge_id") REFERENCES "knowledge_base"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "delivery_asset_tenant_id_code_key" ON "delivery_asset"("tenant_id", "code");
CREATE INDEX IF NOT EXISTS "delivery_asset_tenant_id_idx" ON "delivery_asset"("tenant_id");
CREATE INDEX IF NOT EXISTS "delivery_asset_owner_id_idx" ON "delivery_asset"("owner_id");
CREATE INDEX IF NOT EXISTS "delivery_asset_delivery_review_id_idx" ON "delivery_asset"("delivery_review_id");
CREATE INDEX IF NOT EXISTS "delivery_asset_solution_package_id_idx" ON "delivery_asset"("solution_package_id");
CREATE INDEX IF NOT EXISTS "delivery_asset_skill_id_idx" ON "delivery_asset"("skill_id");
CREATE INDEX IF NOT EXISTS "delivery_asset_agent_id_idx" ON "delivery_asset"("agent_id");
CREATE INDEX IF NOT EXISTS "delivery_asset_knowledge_id_idx" ON "delivery_asset"("knowledge_id");
CREATE INDEX IF NOT EXISTS "delivery_asset_customer_name_idx" ON "delivery_asset"("customer_name");
CREATE INDEX IF NOT EXISTS "delivery_asset_asset_type_idx" ON "delivery_asset"("asset_type");
CREATE INDEX IF NOT EXISTS "delivery_asset_status_idx" ON "delivery_asset"("status");
CREATE INDEX IF NOT EXISTS "delivery_asset_visibility_idx" ON "delivery_asset"("visibility");
CREATE INDEX IF NOT EXISTS "delivery_asset_reuse_score_idx" ON "delivery_asset"("reuse_score");
CREATE INDEX IF NOT EXISTS "delivery_asset_tags_idx" ON "delivery_asset" USING GIN ("tags");
CREATE INDEX IF NOT EXISTS "delivery_asset_created_at_idx" ON "delivery_asset"("created_at");
CREATE INDEX IF NOT EXISTS "delivery_asset_updated_at_idx" ON "delivery_asset"("updated_at");
CREATE INDEX IF NOT EXISTS "delivery_asset_deleted_at_idx" ON "delivery_asset"("deleted_at");

COMMENT ON TABLE "delivery_asset" IS '成果资产表，用于把交付验收复盘沉淀为可复用方案模板、验收清单、风险清单、Prompt SOP、客户案例和报告归档';
COMMENT ON COLUMN "delivery_asset"."id" IS '成果资产主键 ID';
COMMENT ON COLUMN "delivery_asset"."tenant_id" IS '所属租户 ID';
COMMENT ON COLUMN "delivery_asset"."owner_id" IS '成果资产负责人用户 ID';
COMMENT ON COLUMN "delivery_asset"."delivery_review_id" IS '来源验收复盘 ID，成果资产必须从一次交付验收或复盘沉淀';
COMMENT ON COLUMN "delivery_asset"."solution_package_id" IS '关联 AI 落地方案包 ID，可从验收复盘推导，也可显式绑定';
COMMENT ON COLUMN "delivery_asset"."skill_id" IS '关联 Skill ID，用于标记资产由哪个可复用技能产出或反哺';
COMMENT ON COLUMN "delivery_asset"."agent_id" IS '关联 Agent ID，用于标记资产适配或来源的智能体';
COMMENT ON COLUMN "delivery_asset"."knowledge_id" IS '关联知识库 ID，用于标记资产依赖或可沉淀进入的知识库';
COMMENT ON COLUMN "delivery_asset"."name" IS '成果资产名称';
COMMENT ON COLUMN "delivery_asset"."code" IS '租户内唯一成果资产编码';
COMMENT ON COLUMN "delivery_asset"."customer_name" IS '来源客户名称';
COMMENT ON COLUMN "delivery_asset"."asset_type" IS '资产类型：SOLUTION_TEMPLATE 方案模板、ACCEPTANCE_CHECKLIST 验收清单、RISK_CHECKLIST 风险清单、PROMPT_SOP Prompt SOP、CUSTOMER_CASE 客户案例、REPORT_ARCHIVE 报告归档';
COMMENT ON COLUMN "delivery_asset"."status" IS '资产状态：DRAFT 草稿、REVIEWING 评审中、PUBLISHED 已发布、RETIRED 已退役、ARCHIVED 已归档';
COMMENT ON COLUMN "delivery_asset"."visibility" IS '可见范围：PRIVATE 私有、TEAM 团队、TENANT 租户、PUBLIC 公开';
COMMENT ON COLUMN "delivery_asset"."reuse_score" IS '复用评分，0 到 100，用于衡量资产复用成熟度、完整度和可推广价值';
COMMENT ON COLUMN "delivery_asset"."summary" IS '资产摘要，描述资产内容、适用场景和核心交付物';
COMMENT ON COLUMN "delivery_asset"."business_value" IS '业务价值，描述资产复用后带来的效率、质量、交付或商业收益';
COMMENT ON COLUMN "delivery_asset"."reuse_guidance" IS '复用指引，描述使用条件、复制步骤、适配方式和推荐场景';
COMMENT ON COLUMN "delivery_asset"."source_context" IS '来源上下文，描述资产来自哪个客户、项目、验收结论或复盘事实';
COMMENT ON COLUMN "delivery_asset"."risk_notes" IS '风险说明，描述复用前需要确认的权限、合规、资料、行业差异和质量风险';
COMMENT ON COLUMN "delivery_asset"."next_action" IS '下一步动作，描述资产发布、归档、同步到 Skill Hub 或推广复用的后续事项';
COMMENT ON COLUMN "delivery_asset"."tags" IS '成果资产标签数组';
COMMENT ON COLUMN "delivery_asset"."notes" IS '内部备注';
COMMENT ON COLUMN "delivery_asset"."created_at" IS '创建时间';
COMMENT ON COLUMN "delivery_asset"."updated_at" IS '更新时间';
COMMENT ON COLUMN "delivery_asset"."deleted_at" IS '软删除时间';
COMMENT ON COLUMN "delivery_asset"."created_by" IS '创建人用户 ID';
COMMENT ON COLUMN "delivery_asset"."updated_by" IS '最后更新人用户 ID';
