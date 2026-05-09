CREATE TABLE "skill" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "owner_id" UUID,
  "name" VARCHAR(160) NOT NULL,
  "code" VARCHAR(100) NOT NULL,
  "category" VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
  "status" VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
  "version" INTEGER NOT NULL DEFAULT 0,
  "description" TEXT,
  "trigger_scenario" TEXT NOT NULL,
  "input_requirements" TEXT NOT NULL,
  "execution_steps" TEXT NOT NULL,
  "output_format" TEXT NOT NULL,
  "quality_criteria" TEXT NOT NULL,
  "boundary_rules" TEXT NOT NULL,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,

  CONSTRAINT "skill_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "skill_version" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "skill_id" UUID NOT NULL,
  "version" INTEGER NOT NULL,
  "status" VARCHAR(30) NOT NULL DEFAULT 'PUBLISHED',
  "snapshot" JSONB NOT NULL,
  "change_note" TEXT,
  "published_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,

  CONSTRAINT "skill_version_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_skill_binding" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "agent_id" UUID NOT NULL,
  "skill_id" UUID NOT NULL,
  "binding_type" VARCHAR(30) NOT NULL DEFAULT 'PRIMARY',
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,

  CONSTRAINT "agent_skill_binding_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "skill_tenant_id_code_key" ON "skill"("tenant_id", "code");
CREATE INDEX "skill_tenant_id_idx" ON "skill"("tenant_id");
CREATE INDEX "skill_owner_id_idx" ON "skill"("owner_id");
CREATE INDEX "skill_category_idx" ON "skill"("category");
CREATE INDEX "skill_status_idx" ON "skill"("status");
CREATE INDEX "skill_tags_idx" ON "skill" USING GIN ("tags");
CREATE INDEX "skill_created_at_idx" ON "skill"("created_at");
CREATE INDEX "skill_updated_at_idx" ON "skill"("updated_at");
CREATE INDEX "skill_deleted_at_idx" ON "skill"("deleted_at");

CREATE UNIQUE INDEX "skill_version_tenant_id_skill_id_version_key" ON "skill_version"("tenant_id", "skill_id", "version");
CREATE INDEX "skill_version_tenant_id_idx" ON "skill_version"("tenant_id");
CREATE INDEX "skill_version_skill_id_idx" ON "skill_version"("skill_id");
CREATE INDEX "skill_version_status_idx" ON "skill_version"("status");
CREATE INDEX "skill_version_published_at_idx" ON "skill_version"("published_at");
CREATE INDEX "skill_version_created_at_idx" ON "skill_version"("created_at");
CREATE INDEX "skill_version_updated_at_idx" ON "skill_version"("updated_at");
CREATE INDEX "skill_version_deleted_at_idx" ON "skill_version"("deleted_at");

CREATE UNIQUE INDEX "agent_skill_binding_tenant_id_agent_id_skill_id_binding_type_key" ON "agent_skill_binding"("tenant_id", "agent_id", "skill_id", "binding_type");
CREATE INDEX "agent_skill_binding_tenant_id_idx" ON "agent_skill_binding"("tenant_id");
CREATE INDEX "agent_skill_binding_agent_id_idx" ON "agent_skill_binding"("agent_id");
CREATE INDEX "agent_skill_binding_skill_id_idx" ON "agent_skill_binding"("skill_id");
CREATE INDEX "agent_skill_binding_binding_type_idx" ON "agent_skill_binding"("binding_type");
CREATE INDEX "agent_skill_binding_sort_order_idx" ON "agent_skill_binding"("sort_order");
CREATE INDEX "agent_skill_binding_created_at_idx" ON "agent_skill_binding"("created_at");
CREATE INDEX "agent_skill_binding_updated_at_idx" ON "agent_skill_binding"("updated_at");
CREATE INDEX "agent_skill_binding_deleted_at_idx" ON "agent_skill_binding"("deleted_at");

ALTER TABLE "skill" ADD CONSTRAINT "skill_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "skill" ADD CONSTRAINT "skill_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "skill_version" ADD CONSTRAINT "skill_version_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "skill_version" ADD CONSTRAINT "skill_version_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "skill_version" ADD CONSTRAINT "skill_version_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "agent_skill_binding" ADD CONSTRAINT "agent_skill_binding_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_skill_binding" ADD CONSTRAINT "agent_skill_binding_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_skill_binding" ADD CONSTRAINT "agent_skill_binding_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMENT ON TABLE "skill" IS '技能资产表，用于沉淀可复用业务能力，包括触发场景、输入要求、执行步骤、输出结构、质量标准和边界规则。';
COMMENT ON TABLE "skill_version" IS '技能资产版本表，用于记录 Skill 发布时的不可变快照和变更说明。';
COMMENT ON TABLE "agent_skill_binding" IS 'Agent 与技能资产绑定表，用于声明某个 Agent 可使用或主推的业务 Skill。';

COMMENT ON COLUMN "skill"."id" IS '技能资产 ID。';
COMMENT ON COLUMN "skill"."tenant_id" IS '所属租户 ID。';
COMMENT ON COLUMN "skill"."owner_id" IS '负责人用户 ID。';
COMMENT ON COLUMN "skill"."name" IS '技能资产名称。';
COMMENT ON COLUMN "skill"."code" IS '租户内唯一技能编码。';
COMMENT ON COLUMN "skill"."category" IS '技能分类，例如 SALES、DESIGN、OPERATIONS、TRAINING、REVIEW。';
COMMENT ON COLUMN "skill"."status" IS '技能状态，DRAFT 草稿、PUBLISHED 已发布、DISABLED 已停用、ARCHIVED 已归档。';
COMMENT ON COLUMN "skill"."version" IS '当前已发布版本号。';
COMMENT ON COLUMN "skill"."description" IS '技能描述。';
COMMENT ON COLUMN "skill"."trigger_scenario" IS '触发场景，描述什么时候应该使用该 Skill。';
COMMENT ON COLUMN "skill"."input_requirements" IS '输入要求，描述使用该 Skill 前需要哪些材料、目标和约束。';
COMMENT ON COLUMN "skill"."execution_steps" IS '执行步骤，描述可复用的业务 SOP。';
COMMENT ON COLUMN "skill"."output_format" IS '输出结构，描述 Skill 完成后应交付的格式和内容。';
COMMENT ON COLUMN "skill"."quality_criteria" IS '质量标准，描述如何判断输出是否可交付。';
COMMENT ON COLUMN "skill"."boundary_rules" IS '边界规则，描述不能编造、不能越权或需要确认的约束。';
COMMENT ON COLUMN "skill"."tags" IS '技能标签数组。';
COMMENT ON COLUMN "skill"."created_at" IS '创建时间。';
COMMENT ON COLUMN "skill"."updated_at" IS '更新时间。';
COMMENT ON COLUMN "skill"."deleted_at" IS '软删除时间。';
COMMENT ON COLUMN "skill"."created_by" IS '创建人用户 ID。';
COMMENT ON COLUMN "skill"."updated_by" IS '最近更新人用户 ID。';

COMMENT ON COLUMN "skill_version"."id" IS '技能版本 ID。';
COMMENT ON COLUMN "skill_version"."tenant_id" IS '所属租户 ID。';
COMMENT ON COLUMN "skill_version"."skill_id" IS '关联技能资产 ID。';
COMMENT ON COLUMN "skill_version"."version" IS '技能版本号。';
COMMENT ON COLUMN "skill_version"."status" IS '版本状态。';
COMMENT ON COLUMN "skill_version"."snapshot" IS '技能发布快照 JSON。';
COMMENT ON COLUMN "skill_version"."change_note" IS '版本变更说明。';
COMMENT ON COLUMN "skill_version"."published_at" IS '发布时间。';
COMMENT ON COLUMN "skill_version"."created_at" IS '创建时间。';
COMMENT ON COLUMN "skill_version"."updated_at" IS '更新时间。';
COMMENT ON COLUMN "skill_version"."deleted_at" IS '软删除时间。';
COMMENT ON COLUMN "skill_version"."created_by" IS '创建人用户 ID。';
COMMENT ON COLUMN "skill_version"."updated_by" IS '最近更新人用户 ID。';

COMMENT ON COLUMN "agent_skill_binding"."id" IS 'Agent 技能绑定 ID。';
COMMENT ON COLUMN "agent_skill_binding"."tenant_id" IS '所属租户 ID。';
COMMENT ON COLUMN "agent_skill_binding"."agent_id" IS '关联 Agent ID。';
COMMENT ON COLUMN "agent_skill_binding"."skill_id" IS '关联技能资产 ID。';
COMMENT ON COLUMN "agent_skill_binding"."binding_type" IS '绑定类型，例如 PRIMARY 主能力、SUPPORTING 辅助能力。';
COMMENT ON COLUMN "agent_skill_binding"."sort_order" IS '绑定排序号。';
COMMENT ON COLUMN "agent_skill_binding"."created_at" IS '创建时间。';
COMMENT ON COLUMN "agent_skill_binding"."updated_at" IS '更新时间。';
COMMENT ON COLUMN "agent_skill_binding"."deleted_at" IS '软删除时间。';
COMMENT ON COLUMN "agent_skill_binding"."created_by" IS '创建人用户 ID。';
COMMENT ON COLUMN "agent_skill_binding"."updated_by" IS '最近更新人用户 ID。';
