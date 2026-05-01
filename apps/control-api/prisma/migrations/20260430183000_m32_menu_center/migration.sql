CREATE TABLE "menu" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "parent_id" UUID,
    "name" VARCHAR(120) NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "path" VARCHAR(255),
    "component" VARCHAR(255),
    "icon" VARCHAR(100),
    "permission_code" VARCHAR(120),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "menu_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "role_menu" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "menu_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "role_menu_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "menu_tenant_id_code_key" ON "menu"("tenant_id", "code");
CREATE INDEX "menu_tenant_id_idx" ON "menu"("tenant_id");
CREATE INDEX "menu_parent_id_idx" ON "menu"("parent_id");
CREATE INDEX "menu_type_idx" ON "menu"("type");
CREATE INDEX "menu_permission_code_idx" ON "menu"("permission_code");
CREATE INDEX "menu_sort_order_idx" ON "menu"("sort_order");
CREATE INDEX "menu_visible_idx" ON "menu"("visible");
CREATE INDEX "menu_enabled_idx" ON "menu"("enabled");
CREATE INDEX "menu_created_at_idx" ON "menu"("created_at");
CREATE INDEX "menu_updated_at_idx" ON "menu"("updated_at");
CREATE INDEX "menu_deleted_at_idx" ON "menu"("deleted_at");

CREATE UNIQUE INDEX "role_menu_tenant_id_role_id_menu_id_key" ON "role_menu"("tenant_id", "role_id", "menu_id");
CREATE INDEX "role_menu_tenant_id_idx" ON "role_menu"("tenant_id");
CREATE INDEX "role_menu_role_id_idx" ON "role_menu"("role_id");
CREATE INDEX "role_menu_menu_id_idx" ON "role_menu"("menu_id");
CREATE INDEX "role_menu_tenant_id_role_id_menu_id_idx" ON "role_menu"("tenant_id", "role_id", "menu_id");
CREATE INDEX "role_menu_created_at_idx" ON "role_menu"("created_at");
CREATE INDEX "role_menu_updated_at_idx" ON "role_menu"("updated_at");
CREATE INDEX "role_menu_deleted_at_idx" ON "role_menu"("deleted_at");

ALTER TABLE "menu"
  ADD CONSTRAINT "menu_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "menu"
  ADD CONSTRAINT "menu_parent_id_fkey"
  FOREIGN KEY ("parent_id") REFERENCES "menu"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "role_menu"
  ADD CONSTRAINT "role_menu_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "role_menu"
  ADD CONSTRAINT "role_menu_role_id_fkey"
  FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "role_menu"
  ADD CONSTRAINT "role_menu_menu_id_fkey"
  FOREIGN KEY ("menu_id") REFERENCES "menu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMENT ON TABLE "menu" IS '控制台菜单表，用于配置目录、页面和按钮节点。';
COMMENT ON COLUMN "menu"."id" IS '菜单主键 ID。';
COMMENT ON COLUMN "menu"."tenant_id" IS '所属租户 ID。';
COMMENT ON COLUMN "menu"."parent_id" IS '父级菜单 ID，空值表示根节点。';
COMMENT ON COLUMN "menu"."name" IS '菜单名称。';
COMMENT ON COLUMN "menu"."code" IS '租户内唯一的菜单编码。';
COMMENT ON COLUMN "menu"."type" IS '菜单类型，DIRECTORY 目录、MENU 页面、BUTTON 按钮。';
COMMENT ON COLUMN "menu"."path" IS '前端路由路径。';
COMMENT ON COLUMN "menu"."component" IS '前端组件标识。';
COMMENT ON COLUMN "menu"."icon" IS '菜单图标标识。';
COMMENT ON COLUMN "menu"."permission_code" IS '访问该菜单或按钮所需权限编码。';
COMMENT ON COLUMN "menu"."sort_order" IS '同级排序号。';
COMMENT ON COLUMN "menu"."visible" IS '是否在导航中显示。';
COMMENT ON COLUMN "menu"."enabled" IS '是否启用。';
COMMENT ON COLUMN "menu"."created_at" IS '创建时间。';
COMMENT ON COLUMN "menu"."updated_at" IS '更新时间。';
COMMENT ON COLUMN "menu"."deleted_at" IS '软删除时间。';
COMMENT ON COLUMN "menu"."created_by" IS '创建人用户 ID。';
COMMENT ON COLUMN "menu"."updated_by" IS '最近更新人用户 ID。';

COMMENT ON TABLE "role_menu" IS '角色与菜单关联表，用于控制角色可见菜单和按钮。';
COMMENT ON COLUMN "role_menu"."id" IS '角色菜单关联主键 ID。';
COMMENT ON COLUMN "role_menu"."tenant_id" IS '所属租户 ID。';
COMMENT ON COLUMN "role_menu"."role_id" IS '关联角色 ID。';
COMMENT ON COLUMN "role_menu"."menu_id" IS '关联菜单 ID。';
COMMENT ON COLUMN "role_menu"."created_at" IS '创建时间。';
COMMENT ON COLUMN "role_menu"."updated_at" IS '更新时间。';
COMMENT ON COLUMN "role_menu"."deleted_at" IS '软删除时间。';
COMMENT ON COLUMN "role_menu"."created_by" IS '创建人用户 ID。';
COMMENT ON COLUMN "role_menu"."updated_by" IS '最近更新人用户 ID。';
