CREATE TABLE "security_policy" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "effect" VARCHAR(20) NOT NULL DEFAULT 'DENY',
    "resource_type" VARCHAR(80) NOT NULL,
    "action" VARCHAR(120) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    "conditions" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "security_policy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "security_policy_evaluation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "request_id" VARCHAR(120) NOT NULL,
    "trace_id" VARCHAR(120),
    "subject" JSONB NOT NULL,
    "resource" JSONB NOT NULL,
    "action" VARCHAR(120) NOT NULL,
    "decision" VARCHAR(30) NOT NULL,
    "matched_policy_id" UUID,
    "matched_policy_code" VARCHAR(100),
    "reason" TEXT NOT NULL,
    "context" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "security_policy_evaluation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "security_policy_tenant_id_code_key" ON "security_policy"("tenant_id", "code");
CREATE INDEX "security_policy_tenant_id_idx" ON "security_policy"("tenant_id");
CREATE INDEX "security_policy_effect_idx" ON "security_policy"("effect");
CREATE INDEX "security_policy_resource_type_idx" ON "security_policy"("resource_type");
CREATE INDEX "security_policy_action_idx" ON "security_policy"("action");
CREATE INDEX "security_policy_priority_idx" ON "security_policy"("priority");
CREATE INDEX "security_policy_status_idx" ON "security_policy"("status");
CREATE INDEX "security_policy_created_at_idx" ON "security_policy"("created_at");
CREATE INDEX "security_policy_updated_at_idx" ON "security_policy"("updated_at");
CREATE INDEX "security_policy_deleted_at_idx" ON "security_policy"("deleted_at");

CREATE INDEX "security_policy_evaluation_tenant_id_idx" ON "security_policy_evaluation"("tenant_id");
CREATE INDEX "security_policy_evaluation_request_id_idx" ON "security_policy_evaluation"("request_id");
CREATE INDEX "security_policy_evaluation_trace_id_idx" ON "security_policy_evaluation"("trace_id");
CREATE INDEX "security_policy_evaluation_action_idx" ON "security_policy_evaluation"("action");
CREATE INDEX "security_policy_evaluation_decision_idx" ON "security_policy_evaluation"("decision");
CREATE INDEX "security_policy_evaluation_matched_policy_id_idx" ON "security_policy_evaluation"("matched_policy_id");
CREATE INDEX "security_policy_evaluation_created_at_idx" ON "security_policy_evaluation"("created_at");

ALTER TABLE "security_policy"
  ADD CONSTRAINT "security_policy_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "security_policy"
  ADD CONSTRAINT "security_policy_created_by_fkey"
  FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "security_policy"
  ADD CONSTRAINT "security_policy_updated_by_fkey"
  FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "security_policy_evaluation"
  ADD CONSTRAINT "security_policy_evaluation_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "security_policy_evaluation"
  ADD CONSTRAINT "security_policy_evaluation_matched_policy_id_fkey"
  FOREIGN KEY ("matched_policy_id") REFERENCES "security_policy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "security_policy_evaluation"
  ADD CONSTRAINT "security_policy_evaluation_created_by_fkey"
  FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMENT ON TABLE "security_policy" IS '安全策略中心的 ABAC 策略表，用于定义租户级资源访问允许或拒绝规则。';
COMMENT ON COLUMN "security_policy"."id" IS '安全策略主键 ID。';
COMMENT ON COLUMN "security_policy"."tenant_id" IS '所属租户 ID。';
COMMENT ON COLUMN "security_policy"."name" IS '安全策略名称。';
COMMENT ON COLUMN "security_policy"."code" IS '租户内唯一的安全策略编码。';
COMMENT ON COLUMN "security_policy"."description" IS '安全策略描述。';
COMMENT ON COLUMN "security_policy"."effect" IS '策略效果，ALLOW 表示允许，DENY 表示拒绝。';
COMMENT ON COLUMN "security_policy"."resource_type" IS '策略适用资源类型，如 agent、knowledge、tool、model、conversation。';
COMMENT ON COLUMN "security_policy"."action" IS '策略适用动作，如 read、write、execute、delete 或通配符 *。';
COMMENT ON COLUMN "security_policy"."priority" IS '策略优先级，数值越大越先匹配。';
COMMENT ON COLUMN "security_policy"."status" IS '策略状态，ACTIVE 表示生效，DISABLED 表示停用，DELETED 表示软删除。';
COMMENT ON COLUMN "security_policy"."conditions" IS 'ABAC 条件 JSON，包含 subject、resource、context 属性路径与操作符。';
COMMENT ON COLUMN "security_policy"."created_at" IS '创建时间。';
COMMENT ON COLUMN "security_policy"."updated_at" IS '更新时间。';
COMMENT ON COLUMN "security_policy"."deleted_at" IS '软删除时间。';
COMMENT ON COLUMN "security_policy"."created_by" IS '创建人用户 ID。';
COMMENT ON COLUMN "security_policy"."updated_by" IS '最近更新人用户 ID。';

COMMENT ON TABLE "security_policy_evaluation" IS '安全策略评估日志表，记录 ABAC 模拟和运行时评估结果。';
COMMENT ON COLUMN "security_policy_evaluation"."id" IS '安全策略评估日志主键 ID。';
COMMENT ON COLUMN "security_policy_evaluation"."tenant_id" IS '所属租户 ID。';
COMMENT ON COLUMN "security_policy_evaluation"."request_id" IS '请求 ID。';
COMMENT ON COLUMN "security_policy_evaluation"."trace_id" IS 'OpenTelemetry 追踪链路 ID。';
COMMENT ON COLUMN "security_policy_evaluation"."subject" IS '访问主体属性 JSON。';
COMMENT ON COLUMN "security_policy_evaluation"."resource" IS '被访问资源属性 JSON。';
COMMENT ON COLUMN "security_policy_evaluation"."action" IS '本次评估动作。';
COMMENT ON COLUMN "security_policy_evaluation"."decision" IS '评估结果，ALLOW、DENY 或 NO_MATCH。';
COMMENT ON COLUMN "security_policy_evaluation"."matched_policy_id" IS '命中的安全策略 ID。';
COMMENT ON COLUMN "security_policy_evaluation"."matched_policy_code" IS '命中的安全策略编码快照。';
COMMENT ON COLUMN "security_policy_evaluation"."reason" IS '评估原因说明。';
COMMENT ON COLUMN "security_policy_evaluation"."context" IS '评估上下文属性 JSON。';
COMMENT ON COLUMN "security_policy_evaluation"."created_at" IS '创建时间。';
COMMENT ON COLUMN "security_policy_evaluation"."created_by" IS '发起评估的用户 ID。';
