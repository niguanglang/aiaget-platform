CREATE TABLE IF NOT EXISTS "plugin" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "owner_id" UUID,
  "code" VARCHAR(120) NOT NULL,
  "name" VARCHAR(180) NOT NULL,
  "provider" VARCHAR(180) NOT NULL,
  "description" TEXT,
  "source_type" VARCHAR(30) NOT NULL DEFAULT 'MARKET',
  "latest_version" VARCHAR(60) NOT NULL DEFAULT '1.0.0',
  "risk_level" VARCHAR(30) NOT NULL DEFAULT 'LOW',
  "manifest_json" JSONB,
  "config_json" JSONB,
  "permission_preview" JSONB,
  "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  "runtime_status" VARCHAR(30) NOT NULL DEFAULT 'STOPPED',
  "menu_count" INTEGER NOT NULL DEFAULT 0,
  "hook_count" INTEGER NOT NULL DEFAULT 0,
  "audit_count" INTEGER NOT NULL DEFAULT 0,
  "installed_at" TIMESTAMP(3),
  "last_upgraded_at" TIMESTAMP(3),
  "enabled_at" TIMESTAMP(3),
  "disabled_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "plugin_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "plugin_version" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "plugin_id" UUID NOT NULL,
  "version" VARCHAR(60) NOT NULL,
  "status" VARCHAR(30) NOT NULL DEFAULT 'PUBLISHED',
  "manifest_json" JSONB,
  "change_note" TEXT,
  "published_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  CONSTRAINT "plugin_version_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "plugin_installation" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "plugin_id" UUID NOT NULL,
  "owner_id" UUID,
  "installed_version" VARCHAR(60) NOT NULL,
  "latest_version" VARCHAR(60) NOT NULL,
  "status" VARCHAR(30) NOT NULL DEFAULT 'INSTALLED',
  "runtime_status" VARCHAR(30) NOT NULL DEFAULT 'STOPPED',
  "source_type" VARCHAR(30) NOT NULL DEFAULT 'MARKET',
  "risk_level" VARCHAR(30) NOT NULL DEFAULT 'LOW',
  "config_json" JSONB,
  "manifest_json" JSONB,
  "permission_preview" JSONB,
  "installed_at" TIMESTAMP(3),
  "last_upgraded_at" TIMESTAMP(3),
  "enabled_at" TIMESTAMP(3),
  "disabled_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "plugin_installation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "plugin_hook" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "plugin_id" UUID NOT NULL,
  "code" VARCHAR(120) NOT NULL,
  "name" VARCHAR(180) NOT NULL,
  "hook_type" VARCHAR(80) NOT NULL,
  "target" VARCHAR(180) NOT NULL,
  "method" VARCHAR(80) NOT NULL,
  "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  "config_json" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "plugin_hook_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "plugin_menu_binding" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "plugin_id" UUID NOT NULL,
  "menu_id" UUID NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "visible" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "plugin_menu_binding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "plugin_audit_log" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "plugin_id" UUID NOT NULL,
  "action" VARCHAR(80) NOT NULL,
  "title" VARCHAR(220) NOT NULL,
  "summary" TEXT,
  "status" VARCHAR(30) NOT NULL,
  "risk_level" VARCHAR(30) NOT NULL DEFAULT 'LOW',
  "request_id" VARCHAR(120),
  "trace_id" VARCHAR(120),
  "payload_json" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" UUID,
  CONSTRAINT "plugin_audit_log_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "plugin_tenant_id_code_key" ON "plugin"("tenant_id", "code");
CREATE INDEX IF NOT EXISTS "plugin_tenant_id_idx" ON "plugin"("tenant_id");
CREATE INDEX IF NOT EXISTS "plugin_owner_id_idx" ON "plugin"("owner_id");
CREATE INDEX IF NOT EXISTS "plugin_source_type_idx" ON "plugin"("source_type");
CREATE INDEX IF NOT EXISTS "plugin_status_idx" ON "plugin"("status");
CREATE INDEX IF NOT EXISTS "plugin_runtime_status_idx" ON "plugin"("runtime_status");
CREATE INDEX IF NOT EXISTS "plugin_risk_level_idx" ON "plugin"("risk_level");
CREATE INDEX IF NOT EXISTS "plugin_created_at_idx" ON "plugin"("created_at");
CREATE INDEX IF NOT EXISTS "plugin_updated_at_idx" ON "plugin"("updated_at");
CREATE INDEX IF NOT EXISTS "plugin_deleted_at_idx" ON "plugin"("deleted_at");

CREATE UNIQUE INDEX IF NOT EXISTS "plugin_version_tenant_id_plugin_id_version_key" ON "plugin_version"("tenant_id", "plugin_id", "version");
CREATE INDEX IF NOT EXISTS "plugin_version_tenant_id_idx" ON "plugin_version"("tenant_id");
CREATE INDEX IF NOT EXISTS "plugin_version_plugin_id_idx" ON "plugin_version"("plugin_id");
CREATE INDEX IF NOT EXISTS "plugin_version_status_idx" ON "plugin_version"("status");
CREATE INDEX IF NOT EXISTS "plugin_version_published_at_idx" ON "plugin_version"("published_at");
CREATE INDEX IF NOT EXISTS "plugin_version_created_at_idx" ON "plugin_version"("created_at");
CREATE INDEX IF NOT EXISTS "plugin_version_deleted_at_idx" ON "plugin_version"("deleted_at");

CREATE UNIQUE INDEX IF NOT EXISTS "plugin_installation_tenant_id_plugin_id_key" ON "plugin_installation"("tenant_id", "plugin_id");
CREATE INDEX IF NOT EXISTS "plugin_installation_tenant_id_idx" ON "plugin_installation"("tenant_id");
CREATE INDEX IF NOT EXISTS "plugin_installation_plugin_id_idx" ON "plugin_installation"("plugin_id");
CREATE INDEX IF NOT EXISTS "plugin_installation_owner_id_idx" ON "plugin_installation"("owner_id");
CREATE INDEX IF NOT EXISTS "plugin_installation_status_idx" ON "plugin_installation"("status");
CREATE INDEX IF NOT EXISTS "plugin_installation_runtime_status_idx" ON "plugin_installation"("runtime_status");
CREATE INDEX IF NOT EXISTS "plugin_installation_risk_level_idx" ON "plugin_installation"("risk_level");
CREATE INDEX IF NOT EXISTS "plugin_installation_installed_at_idx" ON "plugin_installation"("installed_at");
CREATE INDEX IF NOT EXISTS "plugin_installation_last_upgraded_at_idx" ON "plugin_installation"("last_upgraded_at");
CREATE INDEX IF NOT EXISTS "plugin_installation_created_at_idx" ON "plugin_installation"("created_at");
CREATE INDEX IF NOT EXISTS "plugin_installation_updated_at_idx" ON "plugin_installation"("updated_at");
CREATE INDEX IF NOT EXISTS "plugin_installation_deleted_at_idx" ON "plugin_installation"("deleted_at");

CREATE UNIQUE INDEX IF NOT EXISTS "plugin_hook_tenant_id_plugin_id_code_key" ON "plugin_hook"("tenant_id", "plugin_id", "code");
CREATE INDEX IF NOT EXISTS "plugin_hook_tenant_id_idx" ON "plugin_hook"("tenant_id");
CREATE INDEX IF NOT EXISTS "plugin_hook_plugin_id_idx" ON "plugin_hook"("plugin_id");
CREATE INDEX IF NOT EXISTS "plugin_hook_status_idx" ON "plugin_hook"("status");
CREATE INDEX IF NOT EXISTS "plugin_hook_hook_type_idx" ON "plugin_hook"("hook_type");
CREATE INDEX IF NOT EXISTS "plugin_hook_created_at_idx" ON "plugin_hook"("created_at");
CREATE INDEX IF NOT EXISTS "plugin_hook_updated_at_idx" ON "plugin_hook"("updated_at");
CREATE INDEX IF NOT EXISTS "plugin_hook_deleted_at_idx" ON "plugin_hook"("deleted_at");

CREATE UNIQUE INDEX IF NOT EXISTS "plugin_menu_binding_tenant_id_plugin_id_menu_id_key" ON "plugin_menu_binding"("tenant_id", "plugin_id", "menu_id");
CREATE INDEX IF NOT EXISTS "plugin_menu_binding_tenant_id_idx" ON "plugin_menu_binding"("tenant_id");
CREATE INDEX IF NOT EXISTS "plugin_menu_binding_plugin_id_idx" ON "plugin_menu_binding"("plugin_id");
CREATE INDEX IF NOT EXISTS "plugin_menu_binding_menu_id_idx" ON "plugin_menu_binding"("menu_id");
CREATE INDEX IF NOT EXISTS "plugin_menu_binding_status_idx" ON "plugin_menu_binding"("status");
CREATE INDEX IF NOT EXISTS "plugin_menu_binding_created_at_idx" ON "plugin_menu_binding"("created_at");
CREATE INDEX IF NOT EXISTS "plugin_menu_binding_updated_at_idx" ON "plugin_menu_binding"("updated_at");
CREATE INDEX IF NOT EXISTS "plugin_menu_binding_deleted_at_idx" ON "plugin_menu_binding"("deleted_at");

CREATE INDEX IF NOT EXISTS "plugin_audit_log_tenant_id_idx" ON "plugin_audit_log"("tenant_id");
CREATE INDEX IF NOT EXISTS "plugin_audit_log_plugin_id_idx" ON "plugin_audit_log"("plugin_id");
CREATE INDEX IF NOT EXISTS "plugin_audit_log_action_idx" ON "plugin_audit_log"("action");
CREATE INDEX IF NOT EXISTS "plugin_audit_log_status_idx" ON "plugin_audit_log"("status");
CREATE INDEX IF NOT EXISTS "plugin_audit_log_risk_level_idx" ON "plugin_audit_log"("risk_level");
CREATE INDEX IF NOT EXISTS "plugin_audit_log_request_id_idx" ON "plugin_audit_log"("request_id");
CREATE INDEX IF NOT EXISTS "plugin_audit_log_trace_id_idx" ON "plugin_audit_log"("trace_id");
CREATE INDEX IF NOT EXISTS "plugin_audit_log_created_at_idx" ON "plugin_audit_log"("created_at");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'plugin_tenant_id_fkey') THEN
    ALTER TABLE "plugin" ADD CONSTRAINT "plugin_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'plugin_owner_id_fkey') THEN
    ALTER TABLE "plugin" ADD CONSTRAINT "plugin_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'plugin_version_tenant_id_fkey') THEN
    ALTER TABLE "plugin_version" ADD CONSTRAINT "plugin_version_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'plugin_version_plugin_id_fkey') THEN
    ALTER TABLE "plugin_version" ADD CONSTRAINT "plugin_version_plugin_id_fkey" FOREIGN KEY ("plugin_id") REFERENCES "plugin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'plugin_version_created_by_fkey') THEN
    ALTER TABLE "plugin_version" ADD CONSTRAINT "plugin_version_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'plugin_installation_tenant_id_fkey') THEN
    ALTER TABLE "plugin_installation" ADD CONSTRAINT "plugin_installation_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'plugin_installation_plugin_id_fkey') THEN
    ALTER TABLE "plugin_installation" ADD CONSTRAINT "plugin_installation_plugin_id_fkey" FOREIGN KEY ("plugin_id") REFERENCES "plugin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'plugin_installation_owner_id_fkey') THEN
    ALTER TABLE "plugin_installation" ADD CONSTRAINT "plugin_installation_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'plugin_hook_tenant_id_fkey') THEN
    ALTER TABLE "plugin_hook" ADD CONSTRAINT "plugin_hook_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'plugin_hook_plugin_id_fkey') THEN
    ALTER TABLE "plugin_hook" ADD CONSTRAINT "plugin_hook_plugin_id_fkey" FOREIGN KEY ("plugin_id") REFERENCES "plugin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'plugin_hook_created_by_fkey') THEN
    ALTER TABLE "plugin_hook" ADD CONSTRAINT "plugin_hook_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'plugin_menu_binding_tenant_id_fkey') THEN
    ALTER TABLE "plugin_menu_binding" ADD CONSTRAINT "plugin_menu_binding_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'plugin_menu_binding_plugin_id_fkey') THEN
    ALTER TABLE "plugin_menu_binding" ADD CONSTRAINT "plugin_menu_binding_plugin_id_fkey" FOREIGN KEY ("plugin_id") REFERENCES "plugin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'plugin_menu_binding_menu_id_fkey') THEN
    ALTER TABLE "plugin_menu_binding" ADD CONSTRAINT "plugin_menu_binding_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "menu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'plugin_menu_binding_created_by_fkey') THEN
    ALTER TABLE "plugin_menu_binding" ADD CONSTRAINT "plugin_menu_binding_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'plugin_audit_log_tenant_id_fkey') THEN
    ALTER TABLE "plugin_audit_log" ADD CONSTRAINT "plugin_audit_log_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'plugin_audit_log_plugin_id_fkey') THEN
    ALTER TABLE "plugin_audit_log" ADD CONSTRAINT "plugin_audit_log_plugin_id_fkey" FOREIGN KEY ("plugin_id") REFERENCES "plugin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'plugin_audit_log_created_by_fkey') THEN
    ALTER TABLE "plugin_audit_log" ADD CONSTRAINT "plugin_audit_log_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

COMMENT ON TABLE "plugin" IS '插件主表，用于维护插件市场条目、租户可安装插件元数据、风险等级、运行状态和能力统计。';
COMMENT ON COLUMN "plugin"."id" IS '插件 ID。';
COMMENT ON COLUMN "plugin"."tenant_id" IS '所属租户 ID。';
COMMENT ON COLUMN "plugin"."owner_id" IS '插件负责人用户 ID。';
COMMENT ON COLUMN "plugin"."code" IS '插件编码，在租户内唯一。';
COMMENT ON COLUMN "plugin"."name" IS '插件名称。';
COMMENT ON COLUMN "plugin"."provider" IS '插件提供方。';
COMMENT ON COLUMN "plugin"."description" IS '插件描述。';
COMMENT ON COLUMN "plugin"."source_type" IS '插件来源类型，MARKET 市场插件、CUSTOM 自定义插件。';
COMMENT ON COLUMN "plugin"."latest_version" IS '插件最新版本号。';
COMMENT ON COLUMN "plugin"."risk_level" IS '插件风险等级，LOW、MEDIUM、HIGH、CRITICAL。';
COMMENT ON COLUMN "plugin"."manifest_json" IS '插件声明清单 JSON，包含入口、能力、Hook、菜单和权限声明。';
COMMENT ON COLUMN "plugin"."config_json" IS '插件默认配置 JSON。';
COMMENT ON COLUMN "plugin"."permission_preview" IS '插件声明权限编码预览 JSON 数组。';
COMMENT ON COLUMN "plugin"."status" IS '插件安装或市场状态。';
COMMENT ON COLUMN "plugin"."runtime_status" IS '插件运行状态，RUNNING、STOPPED、UPGRADING、BLOCKED、ERROR。';
COMMENT ON COLUMN "plugin"."menu_count" IS '插件声明或绑定的菜单数量。';
COMMENT ON COLUMN "plugin"."hook_count" IS '插件声明或绑定的 Hook 数量。';
COMMENT ON COLUMN "plugin"."audit_count" IS '插件审计记录数量。';
COMMENT ON COLUMN "plugin"."installed_at" IS '插件安装时间。';
COMMENT ON COLUMN "plugin"."last_upgraded_at" IS '最近升级时间。';
COMMENT ON COLUMN "plugin"."enabled_at" IS '最近启用时间。';
COMMENT ON COLUMN "plugin"."disabled_at" IS '最近停用时间。';
COMMENT ON COLUMN "plugin"."created_at" IS '创建时间。';
COMMENT ON COLUMN "plugin"."updated_at" IS '更新时间。';
COMMENT ON COLUMN "plugin"."deleted_at" IS '软删除时间。';
COMMENT ON COLUMN "plugin"."created_by" IS '创建人用户 ID。';
COMMENT ON COLUMN "plugin"."updated_by" IS '最近更新人用户 ID。';

COMMENT ON TABLE "plugin_version" IS '插件版本表，用于记录插件版本、Manifest 快照、发布状态和变更说明。';
COMMENT ON COLUMN "plugin_version"."id" IS '插件版本 ID。';
COMMENT ON COLUMN "plugin_version"."tenant_id" IS '所属租户 ID。';
COMMENT ON COLUMN "plugin_version"."plugin_id" IS '关联插件 ID。';
COMMENT ON COLUMN "plugin_version"."version" IS '版本号。';
COMMENT ON COLUMN "plugin_version"."status" IS '版本状态，例如 DRAFT、PUBLISHED、DEPRECATED。';
COMMENT ON COLUMN "plugin_version"."manifest_json" IS '该版本插件 Manifest 快照 JSON。';
COMMENT ON COLUMN "plugin_version"."change_note" IS '版本变更说明。';
COMMENT ON COLUMN "plugin_version"."published_at" IS '发布时间。';
COMMENT ON COLUMN "plugin_version"."created_at" IS '创建时间。';
COMMENT ON COLUMN "plugin_version"."deleted_at" IS '软删除时间。';
COMMENT ON COLUMN "plugin_version"."created_by" IS '创建人用户 ID。';

COMMENT ON TABLE "plugin_installation" IS '插件安装实例表，用于记录租户内插件安装版本、运行状态、配置、权限预览和生命周期时间。';
COMMENT ON COLUMN "plugin_installation"."id" IS '插件安装实例 ID。';
COMMENT ON COLUMN "plugin_installation"."tenant_id" IS '所属租户 ID。';
COMMENT ON COLUMN "plugin_installation"."plugin_id" IS '关联插件 ID。';
COMMENT ON COLUMN "plugin_installation"."owner_id" IS '安装实例负责人用户 ID。';
COMMENT ON COLUMN "plugin_installation"."installed_version" IS '当前安装版本号。';
COMMENT ON COLUMN "plugin_installation"."latest_version" IS '可用最新版本号。';
COMMENT ON COLUMN "plugin_installation"."status" IS '安装实例状态，PENDING_REVIEW、INSTALLED、ACTIVE、DISABLED、UPGRADING、FAILED、ARCHIVED。';
COMMENT ON COLUMN "plugin_installation"."runtime_status" IS '运行状态，RUNNING、STOPPED、UPGRADING、BLOCKED、ERROR。';
COMMENT ON COLUMN "plugin_installation"."source_type" IS '插件来源类型，MARKET 市场插件、CUSTOM 自定义插件。';
COMMENT ON COLUMN "plugin_installation"."risk_level" IS '插件风险等级。';
COMMENT ON COLUMN "plugin_installation"."config_json" IS '租户安装实例配置 JSON。';
COMMENT ON COLUMN "plugin_installation"."manifest_json" IS '安装时插件 Manifest 快照 JSON。';
COMMENT ON COLUMN "plugin_installation"."permission_preview" IS '安装实例权限编码预览 JSON 数组。';
COMMENT ON COLUMN "plugin_installation"."installed_at" IS '安装时间。';
COMMENT ON COLUMN "plugin_installation"."last_upgraded_at" IS '最近升级时间。';
COMMENT ON COLUMN "plugin_installation"."enabled_at" IS '最近启用时间。';
COMMENT ON COLUMN "plugin_installation"."disabled_at" IS '最近停用时间。';
COMMENT ON COLUMN "plugin_installation"."created_at" IS '创建时间。';
COMMENT ON COLUMN "plugin_installation"."updated_at" IS '更新时间。';
COMMENT ON COLUMN "plugin_installation"."deleted_at" IS '软删除时间。';
COMMENT ON COLUMN "plugin_installation"."created_by" IS '创建人用户 ID。';
COMMENT ON COLUMN "plugin_installation"."updated_by" IS '最近更新人用户 ID。';

COMMENT ON TABLE "plugin_hook" IS '插件 Hook 表，用于记录插件接入平台事件、用量聚合、工具网关或控制面扩展点的绑定配置。';
COMMENT ON COLUMN "plugin_hook"."id" IS '插件 Hook ID。';
COMMENT ON COLUMN "plugin_hook"."tenant_id" IS '所属租户 ID。';
COMMENT ON COLUMN "plugin_hook"."plugin_id" IS '关联插件 ID。';
COMMENT ON COLUMN "plugin_hook"."code" IS 'Hook 编码，在插件内唯一。';
COMMENT ON COLUMN "plugin_hook"."name" IS 'Hook 名称。';
COMMENT ON COLUMN "plugin_hook"."hook_type" IS 'Hook 类型，例如 EVENT、USAGE、MENU、TOOL_GATEWAY、SECURITY。';
COMMENT ON COLUMN "plugin_hook"."target" IS 'Hook 目标事件、扩展点或内部主题。';
COMMENT ON COLUMN "plugin_hook"."method" IS 'Hook 调用方式，例如 SYNC、ASYNC、SCHEDULED、WEBHOOK。';
COMMENT ON COLUMN "plugin_hook"."status" IS 'Hook 状态，ACTIVE、DISABLED、DELETED。';
COMMENT ON COLUMN "plugin_hook"."config_json" IS 'Hook 配置 JSON。';
COMMENT ON COLUMN "plugin_hook"."created_at" IS '创建时间。';
COMMENT ON COLUMN "plugin_hook"."updated_at" IS '更新时间。';
COMMENT ON COLUMN "plugin_hook"."deleted_at" IS '软删除时间。';
COMMENT ON COLUMN "plugin_hook"."created_by" IS '创建人用户 ID。';
COMMENT ON COLUMN "plugin_hook"."updated_by" IS '最近更新人用户 ID。';

COMMENT ON TABLE "plugin_menu_binding" IS '插件菜单绑定表，用于记录插件注入或绑定到控制台菜单入口的可见性、启用状态和排序。';
COMMENT ON COLUMN "plugin_menu_binding"."id" IS '插件菜单绑定 ID。';
COMMENT ON COLUMN "plugin_menu_binding"."tenant_id" IS '所属租户 ID。';
COMMENT ON COLUMN "plugin_menu_binding"."plugin_id" IS '关联插件 ID。';
COMMENT ON COLUMN "plugin_menu_binding"."menu_id" IS '关联控制台菜单 ID。';
COMMENT ON COLUMN "plugin_menu_binding"."enabled" IS '菜单绑定是否启用。';
COMMENT ON COLUMN "plugin_menu_binding"."visible" IS '菜单绑定是否可见。';
COMMENT ON COLUMN "plugin_menu_binding"."sort_order" IS '菜单绑定排序号。';
COMMENT ON COLUMN "plugin_menu_binding"."status" IS '菜单绑定状态，ACTIVE、DISABLED、DELETED。';
COMMENT ON COLUMN "plugin_menu_binding"."created_at" IS '创建时间。';
COMMENT ON COLUMN "plugin_menu_binding"."updated_at" IS '更新时间。';
COMMENT ON COLUMN "plugin_menu_binding"."deleted_at" IS '软删除时间。';
COMMENT ON COLUMN "plugin_menu_binding"."created_by" IS '创建人用户 ID。';
COMMENT ON COLUMN "plugin_menu_binding"."updated_by" IS '最近更新人用户 ID。';

COMMENT ON TABLE "plugin_audit_log" IS '插件审计日志表，用于记录插件安装、启停、升级、配置、Hook 和菜单注入变更。';
COMMENT ON COLUMN "plugin_audit_log"."id" IS '插件审计日志 ID。';
COMMENT ON COLUMN "plugin_audit_log"."tenant_id" IS '所属租户 ID。';
COMMENT ON COLUMN "plugin_audit_log"."plugin_id" IS '关联插件 ID。';
COMMENT ON COLUMN "plugin_audit_log"."action" IS '插件操作动作，例如 INSTALL、ENABLE、DISABLE、UPGRADE、HOOK_UPDATE、MENU_BINDING_UPDATE。';
COMMENT ON COLUMN "plugin_audit_log"."title" IS '审计标题。';
COMMENT ON COLUMN "plugin_audit_log"."summary" IS '审计摘要。';
COMMENT ON COLUMN "plugin_audit_log"."status" IS '操作状态，例如 SUCCESS、FAILED、INFO。';
COMMENT ON COLUMN "plugin_audit_log"."risk_level" IS '操作风险等级。';
COMMENT ON COLUMN "plugin_audit_log"."request_id" IS '请求链路 ID。';
COMMENT ON COLUMN "plugin_audit_log"."trace_id" IS '追踪链路 ID。';
COMMENT ON COLUMN "plugin_audit_log"."payload_json" IS '审计扩展负载 JSON。';
COMMENT ON COLUMN "plugin_audit_log"."created_at" IS '创建时间。';
COMMENT ON COLUMN "plugin_audit_log"."created_by" IS '操作人用户 ID。';
