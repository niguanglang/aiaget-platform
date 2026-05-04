CREATE TABLE IF NOT EXISTS "billing_adjustment" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "invoice_id" UUID,
  "adjustment_no" VARCHAR(80) NOT NULL,
  "type" VARCHAR(30) NOT NULL,
  "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  "currency" VARCHAR(12) NOT NULL DEFAULT 'USD',
  "amount" DECIMAL(12, 2) NOT NULL,
  "reason" VARCHAR(220) NOT NULL,
  "description" TEXT,
  "effective_at" TIMESTAMP(3),
  "approved_at" TIMESTAMP(3),
  "approved_by" UUID,
  "source_type" VARCHAR(60),
  "source_id" VARCHAR(120),
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "billing_adjustment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "billing_adjustment_tenant_id_adjustment_no_key" ON "billing_adjustment"("tenant_id", "adjustment_no");
CREATE INDEX IF NOT EXISTS "billing_adjustment_tenant_id_idx" ON "billing_adjustment"("tenant_id");
CREATE INDEX IF NOT EXISTS "billing_adjustment_invoice_id_idx" ON "billing_adjustment"("invoice_id");
CREATE INDEX IF NOT EXISTS "billing_adjustment_type_idx" ON "billing_adjustment"("type");
CREATE INDEX IF NOT EXISTS "billing_adjustment_status_idx" ON "billing_adjustment"("status");
CREATE INDEX IF NOT EXISTS "billing_adjustment_effective_at_idx" ON "billing_adjustment"("effective_at");
CREATE INDEX IF NOT EXISTS "billing_adjustment_created_at_idx" ON "billing_adjustment"("created_at");
CREATE INDEX IF NOT EXISTS "billing_adjustment_updated_at_idx" ON "billing_adjustment"("updated_at");
CREATE INDEX IF NOT EXISTS "billing_adjustment_deleted_at_idx" ON "billing_adjustment"("deleted_at");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'billing_adjustment_tenant_id_fkey') THEN
    ALTER TABLE "billing_adjustment" ADD CONSTRAINT "billing_adjustment_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'billing_adjustment_invoice_id_fkey') THEN
    ALTER TABLE "billing_adjustment" ADD CONSTRAINT "billing_adjustment_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "billing_invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

COMMENT ON TABLE "billing_adjustment" IS '计费调整单表，用于记录手工调账、退款、折扣、纠错等财务调整及其审批、生效和审计信息。';
COMMENT ON COLUMN "billing_adjustment"."id" IS '调整单 ID。';
COMMENT ON COLUMN "billing_adjustment"."tenant_id" IS '所属租户 ID。';
COMMENT ON COLUMN "billing_adjustment"."invoice_id" IS '关联账单 ID，可为空表示未绑定具体账单。';
COMMENT ON COLUMN "billing_adjustment"."adjustment_no" IS '调整单编号，在租户内唯一。';
COMMENT ON COLUMN "billing_adjustment"."type" IS '调整类型，CREDIT、DEBIT、REFUND、DISCOUNT、CORRECTION。';
COMMENT ON COLUMN "billing_adjustment"."status" IS '调整状态，PENDING、APPROVED、APPLIED、REJECTED、VOID。';
COMMENT ON COLUMN "billing_adjustment"."currency" IS '调整金额货币。';
COMMENT ON COLUMN "billing_adjustment"."amount" IS '调整金额绝对值，正负方向由调整类型决定。';
COMMENT ON COLUMN "billing_adjustment"."reason" IS '调整原因摘要。';
COMMENT ON COLUMN "billing_adjustment"."description" IS '调整说明。';
COMMENT ON COLUMN "billing_adjustment"."effective_at" IS '调整生效时间。';
COMMENT ON COLUMN "billing_adjustment"."approved_at" IS '调整审批时间。';
COMMENT ON COLUMN "billing_adjustment"."approved_by" IS '审批人用户 ID。';
COMMENT ON COLUMN "billing_adjustment"."source_type" IS '来源类型，例如 MANUAL、INVOICE、SUPPORT_TICKET、SYSTEM。';
COMMENT ON COLUMN "billing_adjustment"."source_id" IS '来源对象 ID。';
COMMENT ON COLUMN "billing_adjustment"."metadata" IS '调整单扩展元数据 JSON。';
COMMENT ON COLUMN "billing_adjustment"."created_at" IS '创建时间。';
COMMENT ON COLUMN "billing_adjustment"."updated_at" IS '更新时间。';
COMMENT ON COLUMN "billing_adjustment"."deleted_at" IS '软删除时间。';
COMMENT ON COLUMN "billing_adjustment"."created_by" IS '创建人用户 ID。';
COMMENT ON COLUMN "billing_adjustment"."updated_by" IS '更新人用户 ID。';
