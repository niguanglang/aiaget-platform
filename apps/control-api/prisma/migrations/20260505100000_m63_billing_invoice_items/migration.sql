CREATE TABLE IF NOT EXISTS "billing_invoice_line_item" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "invoice_id" UUID NOT NULL,
  "item_no" VARCHAR(80) NOT NULL,
  "item_type" VARCHAR(60) NOT NULL,
  "title" VARCHAR(160) NOT NULL,
  "description" TEXT,
  "source_type" VARCHAR(60),
  "source_id" VARCHAR(120),
  "metric_type" VARCHAR(80),
  "quantity" DECIMAL(18, 6) NOT NULL DEFAULT 0,
  "unit" VARCHAR(40) NOT NULL,
  "unit_price" DECIMAL(18, 6) NOT NULL DEFAULT 0,
  "amount" DECIMAL(18, 6) NOT NULL DEFAULT 0,
  "currency" VARCHAR(12) NOT NULL DEFAULT 'USD',
  "status" VARCHAR(30) NOT NULL DEFAULT 'POSTED',
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "billing_invoice_line_item_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'billing_invoice_tenant_id_subscription_id_period_start_period_end_key') THEN
    ALTER TABLE "billing_invoice" ADD CONSTRAINT "billing_invoice_tenant_id_subscription_id_period_start_period_end_key" UNIQUE ("tenant_id", "subscription_id", "period_start", "period_end");
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "billing_invoice_line_item_invoice_id_item_no_key" ON "billing_invoice_line_item"("invoice_id", "item_no");
CREATE INDEX IF NOT EXISTS "billing_invoice_line_item_tenant_id_idx" ON "billing_invoice_line_item"("tenant_id");
CREATE INDEX IF NOT EXISTS "billing_invoice_line_item_invoice_id_idx" ON "billing_invoice_line_item"("invoice_id");
CREATE INDEX IF NOT EXISTS "billing_invoice_line_item_item_type_idx" ON "billing_invoice_line_item"("item_type");
CREATE INDEX IF NOT EXISTS "billing_invoice_line_item_metric_type_idx" ON "billing_invoice_line_item"("metric_type");
CREATE INDEX IF NOT EXISTS "billing_invoice_line_item_source_type_source_id_idx" ON "billing_invoice_line_item"("source_type", "source_id");
CREATE INDEX IF NOT EXISTS "billing_invoice_line_item_status_idx" ON "billing_invoice_line_item"("status");
CREATE INDEX IF NOT EXISTS "billing_invoice_line_item_created_at_idx" ON "billing_invoice_line_item"("created_at");
CREATE INDEX IF NOT EXISTS "billing_invoice_line_item_updated_at_idx" ON "billing_invoice_line_item"("updated_at");
CREATE INDEX IF NOT EXISTS "billing_invoice_line_item_deleted_at_idx" ON "billing_invoice_line_item"("deleted_at");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'billing_invoice_line_item_tenant_id_fkey') THEN
    ALTER TABLE "billing_invoice_line_item" ADD CONSTRAINT "billing_invoice_line_item_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'billing_invoice_line_item_invoice_id_fkey') THEN
    ALTER TABLE "billing_invoice_line_item" ADD CONSTRAINT "billing_invoice_line_item_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "billing_invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

COMMENT ON TABLE "billing_invoice_line_item" IS '账单明细项表，用于记录可重算的账单项目、来源、数量和金额。';
COMMENT ON COLUMN "billing_invoice_line_item"."id" IS '账单明细 ID。';
COMMENT ON COLUMN "billing_invoice_line_item"."tenant_id" IS '所属租户 ID。';
COMMENT ON COLUMN "billing_invoice_line_item"."invoice_id" IS '关联账单 ID。';
COMMENT ON COLUMN "billing_invoice_line_item"."item_no" IS '账单明细编号，在账单内唯一。';
COMMENT ON COLUMN "billing_invoice_line_item"."item_type" IS '明细类型，例如 PLAN_BASE、MODEL_USAGE、RUN_USAGE、ADJUSTMENT。';
COMMENT ON COLUMN "billing_invoice_line_item"."title" IS '明细标题。';
COMMENT ON COLUMN "billing_invoice_line_item"."description" IS '明细说明。';
COMMENT ON COLUMN "billing_invoice_line_item"."source_type" IS '来源类型，例如 MODEL_CALL、CONVERSATION_RUN、PLATFORM_USAGE_EVENT、BILLING_ADJUSTMENT。';
COMMENT ON COLUMN "billing_invoice_line_item"."source_id" IS '来源对象 ID。';
COMMENT ON COLUMN "billing_invoice_line_item"."metric_type" IS '计量类型。';
COMMENT ON COLUMN "billing_invoice_line_item"."quantity" IS '数量。';
COMMENT ON COLUMN "billing_invoice_line_item"."unit" IS '计量单位。';
COMMENT ON COLUMN "billing_invoice_line_item"."unit_price" IS '单价。';
COMMENT ON COLUMN "billing_invoice_line_item"."amount" IS '金额。';
COMMENT ON COLUMN "billing_invoice_line_item"."currency" IS '货币。';
COMMENT ON COLUMN "billing_invoice_line_item"."status" IS '明细状态，POSTED、VOID。';
COMMENT ON COLUMN "billing_invoice_line_item"."metadata" IS '扩展元数据。';
COMMENT ON COLUMN "billing_invoice_line_item"."created_at" IS '创建时间。';
COMMENT ON COLUMN "billing_invoice_line_item"."updated_at" IS '更新时间。';
COMMENT ON COLUMN "billing_invoice_line_item"."deleted_at" IS '软删除时间。';
COMMENT ON COLUMN "billing_invoice_line_item"."created_by" IS '创建人用户 ID。';
COMMENT ON COLUMN "billing_invoice_line_item"."updated_by" IS '更新人用户 ID。';
