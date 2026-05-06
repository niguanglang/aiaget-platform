ALTER TABLE "menu" ADD COLUMN IF NOT EXISTS "is_external" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "menu" ADD COLUMN IF NOT EXISTS "external_url" VARCHAR(500);
ALTER TABLE "menu" ADD COLUMN IF NOT EXISTS "redirect_path" VARCHAR(255);
ALTER TABLE "menu" ADD COLUMN IF NOT EXISTS "keep_alive" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "menu" ADD COLUMN IF NOT EXISTS "affix" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "menu" ADD COLUMN IF NOT EXISTS "hide_breadcrumb" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "menu" ADD COLUMN IF NOT EXISTS "route_meta" JSONB;

CREATE INDEX IF NOT EXISTS "menu_is_external_idx" ON "menu"("is_external");
CREATE INDEX IF NOT EXISTS "menu_keep_alive_idx" ON "menu"("keep_alive");
CREATE INDEX IF NOT EXISTS "menu_affix_idx" ON "menu"("affix");

COMMENT ON COLUMN "menu"."is_external" IS '是否为外链菜单。';
COMMENT ON COLUMN "menu"."external_url" IS '外链菜单跳转地址。';
COMMENT ON COLUMN "menu"."redirect_path" IS '目录或页面默认重定向地址。';
COMMENT ON COLUMN "menu"."keep_alive" IS '是否缓存页面组件。';
COMMENT ON COLUMN "menu"."affix" IS '是否固定在标签页或常用入口中。';
COMMENT ON COLUMN "menu"."hide_breadcrumb" IS '是否在面包屑中隐藏该节点。';
COMMENT ON COLUMN "menu"."route_meta" IS '前端路由扩展元信息 JSON。';
