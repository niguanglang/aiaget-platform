CREATE TABLE IF NOT EXISTS "billing_plan" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "code" VARCHAR(100) NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "tier" VARCHAR(30) NOT NULL DEFAULT 'TEAM',
  "description" TEXT,
  "monthly_base_price" DECIMAL(12, 2) NOT NULL DEFAULT 0,
  "yearly_base_price" DECIMAL(12, 2) NOT NULL DEFAULT 0,
  "currency" VARCHAR(12) NOT NULL DEFAULT 'USD',
  "included_monthly_cost" DECIMAL(12, 2) NOT NULL DEFAULT 0,
  "included_monthly_tokens" INTEGER NOT NULL DEFAULT 0,
  "included_monthly_calls" INTEGER NOT NULL DEFAULT 0,
  "included_storage_gb" DECIMAL(12, 2) NOT NULL DEFAULT 0,
  "overage_unit_price" DECIMAL(12, 6) NOT NULL DEFAULT 0,
  "feature_limits" JSONB,
  "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "billing_plan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "tenant_subscription" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "plan_id" UUID NOT NULL,
  "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  "billing_cycle" VARCHAR(30) NOT NULL DEFAULT 'MONTHLY',
  "currency" VARCHAR(12) NOT NULL DEFAULT 'USD',
  "base_price" DECIMAL(12, 2) NOT NULL DEFAULT 0,
  "included_monthly_cost" DECIMAL(12, 2) NOT NULL DEFAULT 0,
  "included_monthly_tokens" INTEGER NOT NULL DEFAULT 0,
  "included_monthly_calls" INTEGER NOT NULL DEFAULT 0,
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "current_period_start" TIMESTAMP(3) NOT NULL,
  "current_period_end" TIMESTAMP(3) NOT NULL,
  "trial_ends_at" TIMESTAMP(3),
  "canceled_at" TIMESTAMP(3),
  "auto_renew" BOOLEAN NOT NULL DEFAULT true,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "tenant_subscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "billing_invoice" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "subscription_id" UUID,
  "invoice_no" VARCHAR(80) NOT NULL,
  "status" VARCHAR(30) NOT NULL DEFAULT 'OPEN',
  "currency" VARCHAR(12) NOT NULL DEFAULT 'USD',
  "subtotal_amount" DECIMAL(12, 2) NOT NULL DEFAULT 0,
  "discount_amount" DECIMAL(12, 2) NOT NULL DEFAULT 0,
  "tax_amount" DECIMAL(12, 2) NOT NULL DEFAULT 0,
  "total_amount" DECIMAL(12, 2) NOT NULL DEFAULT 0,
  "paid_amount" DECIMAL(12, 2) NOT NULL DEFAULT 0,
  "period_start" TIMESTAMP(3) NOT NULL,
  "period_end" TIMESTAMP(3) NOT NULL,
  "due_at" TIMESTAMP(3),
  "paid_at" TIMESTAMP(3),
  "line_items" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "billing_invoice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "billing_quota_policy" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "subject_type" VARCHAR(60) NOT NULL,
  "subject_id" VARCHAR(120),
  "metric_type" VARCHAR(80) NOT NULL,
  "period" VARCHAR(30) NOT NULL DEFAULT 'MONTH',
  "limit_value" DECIMAL(18, 6) NOT NULL,
  "warn_threshold" DECIMAL(5, 2) NOT NULL DEFAULT 80,
  "hard_threshold" DECIMAL(5, 2) NOT NULL DEFAULT 100,
  "action" VARCHAR(30) NOT NULL DEFAULT 'WARN',
  "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  "last_evaluated_at" TIMESTAMP(3),
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "billing_quota_policy_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "billing_plan_tenant_id_code_key" ON "billing_plan"("tenant_id", "code");
CREATE INDEX IF NOT EXISTS "billing_plan_tenant_id_idx" ON "billing_plan"("tenant_id");
CREATE INDEX IF NOT EXISTS "billing_plan_tier_idx" ON "billing_plan"("tier");
CREATE INDEX IF NOT EXISTS "billing_plan_status_idx" ON "billing_plan"("status");
CREATE INDEX IF NOT EXISTS "billing_plan_sort_order_idx" ON "billing_plan"("sort_order");
CREATE INDEX IF NOT EXISTS "billing_plan_created_at_idx" ON "billing_plan"("created_at");
CREATE INDEX IF NOT EXISTS "billing_plan_updated_at_idx" ON "billing_plan"("updated_at");
CREATE INDEX IF NOT EXISTS "billing_plan_deleted_at_idx" ON "billing_plan"("deleted_at");

CREATE INDEX IF NOT EXISTS "tenant_subscription_tenant_id_idx" ON "tenant_subscription"("tenant_id");
CREATE INDEX IF NOT EXISTS "tenant_subscription_plan_id_idx" ON "tenant_subscription"("plan_id");
CREATE INDEX IF NOT EXISTS "tenant_subscription_status_idx" ON "tenant_subscription"("status");
CREATE INDEX IF NOT EXISTS "tenant_subscription_billing_cycle_idx" ON "tenant_subscription"("billing_cycle");
CREATE INDEX IF NOT EXISTS "tenant_subscription_current_period_start_current_period_end_idx" ON "tenant_subscription"("current_period_start", "current_period_end");
CREATE INDEX IF NOT EXISTS "tenant_subscription_created_at_idx" ON "tenant_subscription"("created_at");
CREATE INDEX IF NOT EXISTS "tenant_subscription_updated_at_idx" ON "tenant_subscription"("updated_at");
CREATE INDEX IF NOT EXISTS "tenant_subscription_deleted_at_idx" ON "tenant_subscription"("deleted_at");

CREATE UNIQUE INDEX IF NOT EXISTS "billing_invoice_tenant_id_invoice_no_key" ON "billing_invoice"("tenant_id", "invoice_no");
CREATE INDEX IF NOT EXISTS "billing_invoice_tenant_id_idx" ON "billing_invoice"("tenant_id");
CREATE INDEX IF NOT EXISTS "billing_invoice_subscription_id_idx" ON "billing_invoice"("subscription_id");
CREATE INDEX IF NOT EXISTS "billing_invoice_status_idx" ON "billing_invoice"("status");
CREATE INDEX IF NOT EXISTS "billing_invoice_period_start_period_end_idx" ON "billing_invoice"("period_start", "period_end");
CREATE INDEX IF NOT EXISTS "billing_invoice_due_at_idx" ON "billing_invoice"("due_at");
CREATE INDEX IF NOT EXISTS "billing_invoice_created_at_idx" ON "billing_invoice"("created_at");
CREATE INDEX IF NOT EXISTS "billing_invoice_updated_at_idx" ON "billing_invoice"("updated_at");
CREATE INDEX IF NOT EXISTS "billing_invoice_deleted_at_idx" ON "billing_invoice"("deleted_at");

CREATE INDEX IF NOT EXISTS "billing_quota_policy_tenant_id_idx" ON "billing_quota_policy"("tenant_id");
CREATE INDEX IF NOT EXISTS "billing_quota_policy_subject_type_subject_id_idx" ON "billing_quota_policy"("subject_type", "subject_id");
CREATE INDEX IF NOT EXISTS "billing_quota_policy_metric_type_idx" ON "billing_quota_policy"("metric_type");
CREATE INDEX IF NOT EXISTS "billing_quota_policy_period_idx" ON "billing_quota_policy"("period");
CREATE INDEX IF NOT EXISTS "billing_quota_policy_action_idx" ON "billing_quota_policy"("action");
CREATE INDEX IF NOT EXISTS "billing_quota_policy_status_idx" ON "billing_quota_policy"("status");
CREATE INDEX IF NOT EXISTS "billing_quota_policy_last_evaluated_at_idx" ON "billing_quota_policy"("last_evaluated_at");
CREATE INDEX IF NOT EXISTS "billing_quota_policy_created_at_idx" ON "billing_quota_policy"("created_at");
CREATE INDEX IF NOT EXISTS "billing_quota_policy_updated_at_idx" ON "billing_quota_policy"("updated_at");
CREATE INDEX IF NOT EXISTS "billing_quota_policy_deleted_at_idx" ON "billing_quota_policy"("deleted_at");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'billing_plan_tenant_id_fkey') THEN
    ALTER TABLE "billing_plan" ADD CONSTRAINT "billing_plan_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tenant_subscription_tenant_id_fkey') THEN
    ALTER TABLE "tenant_subscription" ADD CONSTRAINT "tenant_subscription_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tenant_subscription_plan_id_fkey') THEN
    ALTER TABLE "tenant_subscription" ADD CONSTRAINT "tenant_subscription_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "billing_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'billing_invoice_tenant_id_fkey') THEN
    ALTER TABLE "billing_invoice" ADD CONSTRAINT "billing_invoice_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'billing_invoice_subscription_id_fkey') THEN
    ALTER TABLE "billing_invoice" ADD CONSTRAINT "billing_invoice_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "tenant_subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'billing_quota_policy_tenant_id_fkey') THEN
    ALTER TABLE "billing_quota_policy" ADD CONSTRAINT "billing_quota_policy_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

COMMENT ON TABLE "billing_plan" IS '计费套餐表，用于定义租户可选套餐、价格、包含额度、功能限制和超额计价规则。';
COMMENT ON COLUMN "billing_plan"."id" IS '套餐 ID。';
COMMENT ON COLUMN "billing_plan"."tenant_id" IS '所属租户 ID。';
COMMENT ON COLUMN "billing_plan"."code" IS '套餐编码，在租户内唯一。';
COMMENT ON COLUMN "billing_plan"."name" IS '套餐名称。';
COMMENT ON COLUMN "billing_plan"."tier" IS '套餐层级，FREE、TEAM、BUSINESS、ENTERPRISE。';
COMMENT ON COLUMN "billing_plan"."description" IS '套餐说明。';
COMMENT ON COLUMN "billing_plan"."monthly_base_price" IS '月付基础价格。';
COMMENT ON COLUMN "billing_plan"."yearly_base_price" IS '年付基础价格。';
COMMENT ON COLUMN "billing_plan"."currency" IS '计费货币。';
COMMENT ON COLUMN "billing_plan"."included_monthly_cost" IS '套餐每月包含的模型或运行成本额度。';
COMMENT ON COLUMN "billing_plan"."included_monthly_tokens" IS '套餐每月包含词元数。';
COMMENT ON COLUMN "billing_plan"."included_monthly_calls" IS '套餐每月包含调用次数。';
COMMENT ON COLUMN "billing_plan"."included_storage_gb" IS '套餐包含存储容量 GB。';
COMMENT ON COLUMN "billing_plan"."overage_unit_price" IS '超额计价单价。';
COMMENT ON COLUMN "billing_plan"."feature_limits" IS '功能限制 JSON，例如 Agent、API Key、插件、协作团队数量。';
COMMENT ON COLUMN "billing_plan"."status" IS '套餐状态，ACTIVE、INACTIVE、ARCHIVED。';
COMMENT ON COLUMN "billing_plan"."sort_order" IS '套餐展示排序号。';
COMMENT ON COLUMN "billing_plan"."created_at" IS '创建时间。';
COMMENT ON COLUMN "billing_plan"."updated_at" IS '更新时间。';
COMMENT ON COLUMN "billing_plan"."deleted_at" IS '软删除时间。';
COMMENT ON COLUMN "billing_plan"."created_by" IS '创建人用户 ID。';
COMMENT ON COLUMN "billing_plan"."updated_by" IS '更新人用户 ID。';

COMMENT ON TABLE "tenant_subscription" IS '租户订阅表，用于记录租户当前套餐、计费周期、订阅状态、周期额度和自动续费配置。';
COMMENT ON COLUMN "tenant_subscription"."id" IS '订阅 ID。';
COMMENT ON COLUMN "tenant_subscription"."tenant_id" IS '所属租户 ID。';
COMMENT ON COLUMN "tenant_subscription"."plan_id" IS '关联套餐 ID。';
COMMENT ON COLUMN "tenant_subscription"."status" IS '订阅状态，TRIALING、ACTIVE、PAST_DUE、SUSPENDED、CANCELED。';
COMMENT ON COLUMN "tenant_subscription"."billing_cycle" IS '计费周期，MONTHLY 或 YEARLY。';
COMMENT ON COLUMN "tenant_subscription"."currency" IS '计费货币。';
COMMENT ON COLUMN "tenant_subscription"."base_price" IS '当前订阅周期基础价格。';
COMMENT ON COLUMN "tenant_subscription"."included_monthly_cost" IS '当前订阅每月包含成本额度。';
COMMENT ON COLUMN "tenant_subscription"."included_monthly_tokens" IS '当前订阅每月包含词元数。';
COMMENT ON COLUMN "tenant_subscription"."included_monthly_calls" IS '当前订阅每月包含调用次数。';
COMMENT ON COLUMN "tenant_subscription"."started_at" IS '订阅开始时间。';
COMMENT ON COLUMN "tenant_subscription"."current_period_start" IS '当前账期开始时间。';
COMMENT ON COLUMN "tenant_subscription"."current_period_end" IS '当前账期结束时间。';
COMMENT ON COLUMN "tenant_subscription"."trial_ends_at" IS '试用结束时间。';
COMMENT ON COLUMN "tenant_subscription"."canceled_at" IS '取消时间。';
COMMENT ON COLUMN "tenant_subscription"."auto_renew" IS '是否自动续费。';
COMMENT ON COLUMN "tenant_subscription"."metadata" IS '订阅扩展元数据 JSON。';
COMMENT ON COLUMN "tenant_subscription"."created_at" IS '创建时间。';
COMMENT ON COLUMN "tenant_subscription"."updated_at" IS '更新时间。';
COMMENT ON COLUMN "tenant_subscription"."deleted_at" IS '软删除时间。';
COMMENT ON COLUMN "tenant_subscription"."created_by" IS '创建人用户 ID。';
COMMENT ON COLUMN "tenant_subscription"."updated_by" IS '更新人用户 ID。';

COMMENT ON TABLE "billing_invoice" IS '账单表，用于记录租户账期账单、金额、支付状态、到期时间和账单明细。';
COMMENT ON COLUMN "billing_invoice"."id" IS '账单 ID。';
COMMENT ON COLUMN "billing_invoice"."tenant_id" IS '所属租户 ID。';
COMMENT ON COLUMN "billing_invoice"."subscription_id" IS '关联订阅 ID。';
COMMENT ON COLUMN "billing_invoice"."invoice_no" IS '账单编号，在租户内唯一。';
COMMENT ON COLUMN "billing_invoice"."status" IS '账单状态，DRAFT、OPEN、PAID、VOID、OVERDUE。';
COMMENT ON COLUMN "billing_invoice"."currency" IS '计费货币。';
COMMENT ON COLUMN "billing_invoice"."subtotal_amount" IS '账单小计金额。';
COMMENT ON COLUMN "billing_invoice"."discount_amount" IS '优惠金额。';
COMMENT ON COLUMN "billing_invoice"."tax_amount" IS '税费金额。';
COMMENT ON COLUMN "billing_invoice"."total_amount" IS '账单总金额。';
COMMENT ON COLUMN "billing_invoice"."paid_amount" IS '已支付金额。';
COMMENT ON COLUMN "billing_invoice"."period_start" IS '账期开始时间。';
COMMENT ON COLUMN "billing_invoice"."period_end" IS '账期结束时间。';
COMMENT ON COLUMN "billing_invoice"."due_at" IS '账单到期时间。';
COMMENT ON COLUMN "billing_invoice"."paid_at" IS '账单支付时间。';
COMMENT ON COLUMN "billing_invoice"."line_items" IS '账单明细 JSON。';
COMMENT ON COLUMN "billing_invoice"."created_at" IS '创建时间。';
COMMENT ON COLUMN "billing_invoice"."updated_at" IS '更新时间。';
COMMENT ON COLUMN "billing_invoice"."deleted_at" IS '软删除时间。';
COMMENT ON COLUMN "billing_invoice"."created_by" IS '创建人用户 ID。';
COMMENT ON COLUMN "billing_invoice"."updated_by" IS '更新人用户 ID。';

COMMENT ON TABLE "billing_quota_policy" IS '计费额度策略表，用于配置租户、用户、API Key、Agent 等主体的成本、词元、调用次数额度与超限动作。';
COMMENT ON COLUMN "billing_quota_policy"."id" IS '额度策略 ID。';
COMMENT ON COLUMN "billing_quota_policy"."tenant_id" IS '所属租户 ID。';
COMMENT ON COLUMN "billing_quota_policy"."name" IS '额度策略名称。';
COMMENT ON COLUMN "billing_quota_policy"."subject_type" IS '额度主体类型，TENANT、DEPARTMENT、USER、API_KEY、AGENT、AGENT_TEAM。';
COMMENT ON COLUMN "billing_quota_policy"."subject_id" IS '额度主体 ID，租户级策略可为空。';
COMMENT ON COLUMN "billing_quota_policy"."metric_type" IS '额度指标类型，COST、TOKEN、MODEL_CALL、API_CALL、AGENT_RUN、STORAGE_GB。';
COMMENT ON COLUMN "billing_quota_policy"."period" IS '额度统计周期，DAY、WEEK、MONTH、YEAR。';
COMMENT ON COLUMN "billing_quota_policy"."limit_value" IS '额度上限值。';
COMMENT ON COLUMN "billing_quota_policy"."warn_threshold" IS '预警阈值百分比。';
COMMENT ON COLUMN "billing_quota_policy"."hard_threshold" IS '硬限制阈值百分比。';
COMMENT ON COLUMN "billing_quota_policy"."action" IS '达到阈值后的动作，WARN、THROTTLE、REQUIRE_APPROVAL、BLOCK。';
COMMENT ON COLUMN "billing_quota_policy"."status" IS '策略状态，ACTIVE、DISABLED、DELETED。';
COMMENT ON COLUMN "billing_quota_policy"."last_evaluated_at" IS '最近评估时间。';
COMMENT ON COLUMN "billing_quota_policy"."metadata" IS '额度策略扩展元数据 JSON。';
COMMENT ON COLUMN "billing_quota_policy"."created_at" IS '创建时间。';
COMMENT ON COLUMN "billing_quota_policy"."updated_at" IS '更新时间。';
COMMENT ON COLUMN "billing_quota_policy"."deleted_at" IS '软删除时间。';
COMMENT ON COLUMN "billing_quota_policy"."created_by" IS '创建人用户 ID。';
COMMENT ON COLUMN "billing_quota_policy"."updated_by" IS '更新人用户 ID。';
