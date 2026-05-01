ALTER TABLE "role" ADD COLUMN IF NOT EXISTS "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE';

CREATE INDEX IF NOT EXISTS "role_status_idx" ON "role"("status");

COMMENT ON TABLE "role" IS '角色表，定义租户内 RBAC 角色及角色状态。';
COMMENT ON COLUMN "role"."id" IS '角色 ID。';
COMMENT ON COLUMN "role"."tenant_id" IS '所属租户 ID。';
COMMENT ON COLUMN "role"."code" IS '角色编码，租户内唯一。';
COMMENT ON COLUMN "role"."name" IS '角色名称。';
COMMENT ON COLUMN "role"."description" IS '角色描述。';
COMMENT ON COLUMN "role"."status" IS '角色状态，ACTIVE 启用、DISABLED 停用、DELETED 已删除。';
COMMENT ON COLUMN "role"."is_system" IS '是否系统内置角色，系统角色限制删除和编码修改。';
COMMENT ON COLUMN "role"."created_at" IS '创建时间。';
COMMENT ON COLUMN "role"."updated_at" IS '更新时间。';
COMMENT ON COLUMN "role"."deleted_at" IS '软删除时间。';
COMMENT ON COLUMN "role"."created_by" IS '创建人用户 ID。';
COMMENT ON COLUMN "role"."updated_by" IS '最近更新人用户 ID。';

COMMENT ON TABLE "role_permission" IS '角色权限绑定表，记录角色拥有的接口和操作权限编码。';
COMMENT ON COLUMN "role_permission"."id" IS '角色权限绑定 ID。';
COMMENT ON COLUMN "role_permission"."tenant_id" IS '所属租户 ID。';
COMMENT ON COLUMN "role_permission"."role_id" IS '关联角色 ID。';
COMMENT ON COLUMN "role_permission"."permission_id" IS '关联权限 ID。';
COMMENT ON COLUMN "role_permission"."created_at" IS '创建时间。';
COMMENT ON COLUMN "role_permission"."updated_at" IS '更新时间。';
COMMENT ON COLUMN "role_permission"."deleted_at" IS '软删除时间。';
COMMENT ON COLUMN "role_permission"."created_by" IS '创建人用户 ID。';
COMMENT ON COLUMN "role_permission"."updated_by" IS '最近更新人用户 ID。';
