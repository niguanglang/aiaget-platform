CREATE TABLE "department" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "parent_id" UUID,
    "name" VARCHAR(120) NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "leader_user_id" UUID,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "department_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "user" ADD COLUMN "department_id" UUID;

CREATE UNIQUE INDEX "department_tenant_id_code_key" ON "department"("tenant_id", "code");
CREATE INDEX "department_tenant_id_idx" ON "department"("tenant_id");
CREATE INDEX "department_parent_id_idx" ON "department"("parent_id");
CREATE INDEX "department_leader_user_id_idx" ON "department"("leader_user_id");
CREATE INDEX "department_status_idx" ON "department"("status");
CREATE INDEX "department_sort_order_idx" ON "department"("sort_order");
CREATE INDEX "department_created_at_idx" ON "department"("created_at");
CREATE INDEX "department_updated_at_idx" ON "department"("updated_at");
CREATE INDEX "department_deleted_at_idx" ON "department"("deleted_at");
CREATE INDEX "user_department_id_idx" ON "user"("department_id");

ALTER TABLE "department"
  ADD CONSTRAINT "department_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "department"
  ADD CONSTRAINT "department_parent_id_fkey"
  FOREIGN KEY ("parent_id") REFERENCES "department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "department"
  ADD CONSTRAINT "department_leader_user_id_fkey"
  FOREIGN KEY ("leader_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "user"
  ADD CONSTRAINT "user_department_id_fkey"
  FOREIGN KEY ("department_id") REFERENCES "department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMENT ON TABLE "department" IS '部门组织架构表，用于维护租户内部门树、负责人和成员归属。';
COMMENT ON COLUMN "department"."id" IS '部门主键 ID。';
COMMENT ON COLUMN "department"."tenant_id" IS '所属租户 ID。';
COMMENT ON COLUMN "department"."parent_id" IS '父级部门 ID，空值表示根部门。';
COMMENT ON COLUMN "department"."name" IS '部门名称。';
COMMENT ON COLUMN "department"."code" IS '租户内唯一的部门编码。';
COMMENT ON COLUMN "department"."description" IS '部门描述。';
COMMENT ON COLUMN "department"."leader_user_id" IS '部门负责人用户 ID。';
COMMENT ON COLUMN "department"."sort_order" IS '同级排序号。';
COMMENT ON COLUMN "department"."status" IS '部门状态，ACTIVE 启用、DISABLED 停用、DELETED 已删除。';
COMMENT ON COLUMN "department"."created_at" IS '创建时间。';
COMMENT ON COLUMN "department"."updated_at" IS '更新时间。';
COMMENT ON COLUMN "department"."deleted_at" IS '软删除时间。';
COMMENT ON COLUMN "department"."created_by" IS '创建人用户 ID。';
COMMENT ON COLUMN "department"."updated_by" IS '最近更新人用户 ID。';
COMMENT ON COLUMN "user"."department_id" IS '用户所属部门 ID。';
