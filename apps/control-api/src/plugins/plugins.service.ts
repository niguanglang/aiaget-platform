import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  CreatePluginInstallationInput,
  PluginAuditLogItem,
  PluginHookItem,
  PluginInstallationDetail,
  PluginInstallationItem,
  PluginMarketItem,
  PluginMenuBindingItem,
  PluginOverview,
  PluginVersionItem,
  PluginHookStatus,
  PluginInstallationStatus,
  PluginRiskLevel,
  PluginRuntimeStatus,
  UpdatePluginHookInput,
  UpdatePluginInstallationInput,
  UpdatePluginMenuBindingInput,
} from '@aiaget/shared-types';

import type { AuthenticatedUser } from '../common/types/request-context';
import { DataScopeQueryService, mergeDataScopeWhere } from '../common/services/data-scope-query.service';
import { PlatformEventsService } from '../platform-events/platform-events.service';
import { PrismaService } from '../prisma/prisma.service';

type PluginRecord = Prisma.PluginGetPayload<{
  include: {
    versions: true;
    hooks: true;
    menuBindings: { include: { menu: true } };
    auditLogs: true;
  };
}>;

type PluginMarketRecord = Prisma.PluginGetPayload<{
  include: {
    installations: {
      select: {
        tenantId: true;
        deletedAt: true;
        status: true;
      };
    };
  };
}>;

@Injectable()
export class PluginsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(DataScopeQueryService) private readonly dataScopeQuery: DataScopeQueryService,
    @Inject(PlatformEventsService) private readonly platformEvents: PlatformEventsService,
  ) {}

  async getOverview(currentUser: AuthenticatedUser): Promise<PluginOverview> {
    const pluginWhere = await this.buildPluginWhere(currentUser);
    const plugins = await this.prisma.plugin.findMany({
      where: pluginWhere,
      select: {
        id: true,
        status: true,
        runtimeStatus: true,
        hookCount: true,
        menuCount: true,
        auditCount: true,
      },
    });
    const pluginIds = plugins.map((plugin) => plugin.id);
    const pluginInstallations = await this.prisma.pluginInstallation.findMany({
      where: {
        tenantId: currentUser.tenantId,
        pluginId: {
          in: pluginIds,
        },
        deletedAt: null,
      },
      select: {
        status: true,
      },
    });

    return {
      total: plugins.length,
      active_count: plugins.filter((plugin) => plugin.status === 'ACTIVE').length,
      disabled_count: plugins.filter((plugin) => plugin.status === 'DISABLED').length,
      pending_review_count: plugins.filter((plugin) => plugin.status === 'PENDING_REVIEW').length,
      upgrade_available_count: pluginInstallations.filter((installation) => installation.status === 'UPGRADING').length,
      hook_count: plugins.reduce((sum, plugin) => sum + plugin.hookCount, 0),
      menu_count: plugins.reduce((sum, plugin) => sum + plugin.menuCount, 0),
      audit_count: plugins.reduce((sum, plugin) => sum + plugin.auditCount, 0),
    };
  }

  async listMarket(currentUser: AuthenticatedUser): Promise<PluginMarketItem[]> {
    const where = await this.buildPluginWhere(currentUser);
    const records = await this.prisma.plugin.findMany({
      where,
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        installations: {
          where: {
            tenantId: currentUser.tenantId,
            deletedAt: null,
          },
          select: {
            tenantId: true,
            deletedAt: true,
            status: true,
          },
        },
      },
    });

    return records.map((plugin) => this.mapMarketItem(currentUser.tenantId, plugin));
  }

  async listInstallations(currentUser: AuthenticatedUser): Promise<PluginInstallationItem[]> {
    const pluginWhere = await this.buildPluginWhere(currentUser);
    const records = await this.prisma.pluginInstallation.findMany({
      where: {
        tenantId: currentUser.tenantId,
        deletedAt: null,
        plugin: pluginWhere,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        plugin: true,
      },
    });

    return records.map((item) => this.mapInstallationItem(item));
  }

  private async buildPluginWhere(currentUser: AuthenticatedUser): Promise<Prisma.PluginWhereInput> {
    const where: Prisma.PluginWhereInput = {
      tenantId: currentUser.tenantId,
      deletedAt: null,
    };
    const dataScope = await this.dataScopeQuery.buildWhere<Prisma.PluginWhereInput>(currentUser, 'PLUGIN');
    mergeDataScopeWhere(where, dataScope.where);

    return where;
  }

  async getInstallation(currentUser: AuthenticatedUser, pluginId: string): Promise<PluginInstallationDetail> {
    const installation = await this.prisma.pluginInstallation.findFirst({
      where: {
        tenantId: currentUser.tenantId,
        pluginId,
        deletedAt: null,
      },
      include: {
        plugin: {
          include: {
            versions: {
              where: {
                deletedAt: null,
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
            hooks: {
              where: {
                deletedAt: null,
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
            menuBindings: {
              where: {
                deletedAt: null,
              },
              include: {
                menu: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
            auditLogs: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 20,
            },
          },
        },
      },
    });

    if (!installation) {
      throw new NotFoundException('Plugin installation not found');
    }

    return this.mapInstallationDetail(installation);
  }

  async install(currentUser: AuthenticatedUser, dto: CreatePluginInstallationInput): Promise<PluginInstallationDetail> {
    const plugin = await this.prisma.plugin.upsert({
      where: {
        tenantId_code: {
          tenantId: currentUser.tenantId,
          code: dto.code.trim(),
        },
      },
      create: {
        tenantId: currentUser.tenantId,
        ownerId: currentUser.id,
        code: dto.code.trim(),
        name: dto.name?.trim() || dto.code.trim(),
        provider: dto.provider?.trim() || '平台插件市场',
        description: dto.description ?? null,
        sourceType: dto.source_type ?? 'MARKET',
        latestVersion: dto.latest_version?.trim() || '1.0.0',
        riskLevel: dto.risk_level ?? 'MEDIUM',
        manifestJson: toJsonInput(dto.manifest_json),
        configJson: toJsonInput(dto.config_json),
        permissionPreview: toJsonInput(Array.isArray(dto.permission_preview) ? dto.permission_preview : null),
        status: 'INSTALLED',
        runtimeStatus: 'STOPPED',
        installedAt: new Date(),
        createdBy: currentUser.id,
        updatedBy: currentUser.id,
      },
      update: {
        ownerId: currentUser.id,
        name: dto.name?.trim() || dto.code.trim(),
        provider: dto.provider?.trim() || '平台插件市场',
        description: dto.description ?? null,
        sourceType: dto.source_type ?? 'MARKET',
        latestVersion: dto.latest_version?.trim() || '1.0.0',
        riskLevel: dto.risk_level ?? 'MEDIUM',
        manifestJson: toJsonInput(dto.manifest_json),
        configJson: toJsonInput(dto.config_json),
        permissionPreview: toJsonInput(Array.isArray(dto.permission_preview) ? dto.permission_preview : null),
        status: 'INSTALLED',
        runtimeStatus: 'STOPPED',
        deletedAt: null,
        updatedBy: currentUser.id,
      },
    });

    await this.prisma.pluginInstallation.upsert({
      where: {
        tenantId_pluginId: {
          tenantId: currentUser.tenantId,
          pluginId: plugin.id,
        },
      },
      create: {
        tenantId: currentUser.tenantId,
        pluginId: plugin.id,
        ownerId: currentUser.id,
        installedVersion: plugin.latestVersion,
        latestVersion: plugin.latestVersion,
        status: 'INSTALLED',
        runtimeStatus: 'STOPPED',
        sourceType: plugin.sourceType,
        riskLevel: plugin.riskLevel,
        configJson: toJsonInput(plugin.configJson),
        manifestJson: toJsonInput(plugin.manifestJson),
        permissionPreview: toJsonInput(plugin.permissionPreview),
        installedAt: new Date(),
        createdBy: currentUser.id,
        updatedBy: currentUser.id,
      },
      update: {
        ownerId: currentUser.id,
        installedVersion: plugin.latestVersion,
        latestVersion: plugin.latestVersion,
        status: 'INSTALLED',
        runtimeStatus: 'STOPPED',
        sourceType: plugin.sourceType,
        riskLevel: plugin.riskLevel,
        configJson: toJsonInput(plugin.configJson),
        manifestJson: toJsonInput(plugin.manifestJson),
        permissionPreview: toJsonInput(plugin.permissionPreview),
        deletedAt: null,
        updatedBy: currentUser.id,
      },
    });

    await this.recordAudit(currentUser, plugin.id, 'INSTALL', '安装插件', `已安装插件 ${plugin.name}。`, 'INFO');
    await this.platformEvents.recordEvent({
      tenantId: currentUser.tenantId,
      departmentId: currentUser.departmentId ?? null,
      userId: currentUser.id,
      resourceType: 'PLUGIN',
      resourceId: plugin.id,
      pluginId: plugin.id,
      eventSource: 'CONTROL_API',
      eventType: 'plugin.installed',
      status: 'SUCCESS',
      severity: 'INFO',
      billable: false,
      summary: `插件 ${plugin.code} 已安装`,
    });

    return this.getInstallation(currentUser, plugin.id);
  }

  async update(currentUser: AuthenticatedUser, pluginId: string, dto: UpdatePluginInstallationInput): Promise<PluginInstallationDetail> {
    const installation = await this.ensureInstallation(currentUser.tenantId, pluginId);

    await this.prisma.plugin.update({
      where: { id: installation.pluginId },
      data: {
        name: dto.name?.trim() ?? undefined,
        description: dto.description === undefined ? undefined : dto.description,
        latestVersion: dto.latest_version?.trim() ?? undefined,
        riskLevel: dto.risk_level ?? undefined,
        status: dto.status ?? undefined,
        runtimeStatus: dto.runtime_status ?? undefined,
        configJson: dto.config_json === undefined ? undefined : toJsonInput(dto.config_json),
        updatedBy: currentUser.id,
      },
    });

    await this.prisma.pluginInstallation.update({
      where: { id: installation.id },
      data: {
        installedVersion: dto.latest_version?.trim() ?? installation.installedVersion,
        latestVersion: dto.latest_version?.trim() ?? installation.latestVersion,
        riskLevel: dto.risk_level ?? installation.riskLevel,
        status: dto.status ?? installation.status,
        runtimeStatus: dto.runtime_status ?? installation.runtimeStatus,
        configJson: dto.config_json === undefined ? undefined : toJsonInput(dto.config_json),
        updatedBy: currentUser.id,
      },
    });

    await this.recordAudit(currentUser, pluginId, 'UPDATE', '更新插件', `已更新插件 ${pluginId} 的配置和运行状态。`, 'INFO');
    await this.platformEvents.recordEvent({
      tenantId: currentUser.tenantId,
      departmentId: currentUser.departmentId ?? null,
      userId: currentUser.id,
      resourceType: 'PLUGIN',
      resourceId: pluginId,
      pluginId,
      eventSource: 'CONTROL_API',
      eventType: 'plugin.updated',
      status: 'SUCCESS',
      severity: 'INFO',
      billable: false,
      summary: `插件 ${pluginId} 已更新`,
    });

    return this.getInstallation(currentUser, pluginId);
  }

  async enable(currentUser: AuthenticatedUser, pluginId: string) {
    return this.setRuntimeState(currentUser, pluginId, 'ACTIVE');
  }

  async disable(currentUser: AuthenticatedUser, pluginId: string) {
    return this.setRuntimeState(currentUser, pluginId, 'DISABLED');
  }

  async upgrade(currentUser: AuthenticatedUser, pluginId: string) {
    const installation = await this.ensureInstallation(currentUser.tenantId, pluginId);
    const nextVersion = bumpPatch(installation.latestVersion);

    await this.prisma.plugin.update({
      where: { id: pluginId },
      data: {
        latestVersion: nextVersion,
        status: 'UPGRADING',
        runtimeStatus: 'UPGRADING',
        lastUpgradedAt: new Date(),
        updatedBy: currentUser.id,
      },
    });

    await this.prisma.pluginInstallation.update({
      where: { id: installation.id },
      data: {
        latestVersion: nextVersion,
        installedVersion: nextVersion,
        status: 'UPGRADING',
        runtimeStatus: 'UPGRADING',
        lastUpgradedAt: new Date(),
        updatedBy: currentUser.id,
      },
    });

    await this.recordAudit(currentUser, pluginId, 'UPGRADE', '升级插件', `插件版本升级至 ${nextVersion}。`, 'INFO');
    await this.platformEvents.recordEvent({
      tenantId: currentUser.tenantId,
      departmentId: currentUser.departmentId ?? null,
      userId: currentUser.id,
      resourceType: 'PLUGIN',
      resourceId: pluginId,
      pluginId,
      eventSource: 'CONTROL_API',
      eventType: 'plugin.upgraded',
      status: 'SUCCESS',
      severity: 'INFO',
      billable: false,
      summary: `插件 ${pluginId} 已升级`,
    });

    return this.getInstallation(currentUser, pluginId);
  }

  async updateHook(currentUser: AuthenticatedUser, pluginId: string, hookId: string, dto: UpdatePluginHookInput): Promise<PluginHookItem> {
    await this.ensureInstallation(currentUser.tenantId, pluginId);
    const hook = await this.prisma.pluginHook.findFirst({
      where: {
        tenantId: currentUser.tenantId,
        id: hookId,
        pluginId,
        deletedAt: null,
      },
    });
    if (!hook) {
      throw new NotFoundException('Plugin hook not found');
    }

    const updated = await this.prisma.pluginHook.update({
      where: { id: hook.id },
      data: {
        status: dto.status ?? hook.status,
        configJson: dto.config_json === undefined ? undefined : toJsonInput(dto.config_json),
        updatedBy: currentUser.id,
      },
    });

    await this.recordAudit(currentUser, pluginId, 'HOOK_UPDATE', '更新 Hook', `已更新插件 ${pluginId} 的 Hook ${hook.code}。`, 'INFO');
    await this.platformEvents.recordEvent({
      tenantId: currentUser.tenantId,
      departmentId: currentUser.departmentId ?? null,
      userId: currentUser.id,
      resourceType: 'PLUGIN',
      resourceId: pluginId,
      pluginId,
      eventSource: 'CONTROL_API',
      eventType: 'plugin.hook.updated',
      status: 'SUCCESS',
      severity: 'INFO',
      billable: false,
      summary: `插件 ${pluginId} 的 Hook ${hook.code} 已更新`,
    });

    return this.mapHookItem(updated);
  }

  async updateMenuBinding(
    currentUser: AuthenticatedUser,
    pluginId: string,
    bindingId: string,
    dto: UpdatePluginMenuBindingInput,
  ): Promise<PluginMenuBindingItem> {
    await this.ensureInstallation(currentUser.tenantId, pluginId);
    const binding = await this.prisma.pluginMenuBinding.findFirst({
      where: {
        tenantId: currentUser.tenantId,
        id: bindingId,
        pluginId,
        deletedAt: null,
      },
      include: {
        menu: true,
      },
    });
    if (!binding) {
      throw new NotFoundException('Plugin menu binding not found');
    }

    const updated = await this.prisma.pluginMenuBinding.update({
      where: { id: binding.id },
      data: {
        enabled: dto.enabled ?? binding.enabled,
        visible: dto.visible ?? binding.visible,
        sortOrder: dto.sort_order ?? binding.sortOrder,
        updatedBy: currentUser.id,
      },
      include: {
        menu: true,
      },
    });

    await this.recordAudit(
      currentUser,
      pluginId,
      'MENU_BINDING_UPDATE',
      '更新菜单绑定',
      `已更新插件 ${pluginId} 的菜单绑定 ${binding.menu.code}。`,
      'INFO',
    );
    await this.platformEvents.recordEvent({
      tenantId: currentUser.tenantId,
      departmentId: currentUser.departmentId ?? null,
      userId: currentUser.id,
      resourceType: 'PLUGIN',
      resourceId: pluginId,
      pluginId,
      eventSource: 'CONTROL_API',
      eventType: 'plugin.menu_binding.updated',
      status: 'SUCCESS',
      severity: 'INFO',
      billable: false,
      summary: `插件 ${pluginId} 的菜单绑定 ${binding.menu.code} 已更新`,
    });

    return this.mapMenuBindingItem(updated);
  }

  private async setRuntimeState(currentUser: AuthenticatedUser, pluginId: string, runtimeStatus: 'ACTIVE' | 'DISABLED') {
    const installation = await this.ensureInstallation(currentUser.tenantId, pluginId);
    await this.prisma.plugin.update({
      where: { id: pluginId },
      data: {
        status: runtimeStatus === 'ACTIVE' ? 'ACTIVE' : 'DISABLED',
        runtimeStatus: runtimeStatus === 'ACTIVE' ? 'RUNNING' : 'STOPPED',
        enabledAt: runtimeStatus === 'ACTIVE' ? new Date() : installation.enabledAt,
        disabledAt: runtimeStatus === 'DISABLED' ? new Date() : installation.disabledAt,
        updatedBy: currentUser.id,
      },
    });
    await this.prisma.pluginInstallation.update({
      where: { id: installation.id },
      data: {
        status: runtimeStatus === 'ACTIVE' ? 'ACTIVE' : 'DISABLED',
        runtimeStatus: runtimeStatus === 'ACTIVE' ? 'RUNNING' : 'STOPPED',
        enabledAt: runtimeStatus === 'ACTIVE' ? new Date() : installation.enabledAt,
        disabledAt: runtimeStatus === 'DISABLED' ? new Date() : installation.disabledAt,
        updatedBy: currentUser.id,
      },
    });

    await this.recordAudit(
      currentUser,
      pluginId,
      runtimeStatus === 'ACTIVE' ? 'ENABLE' : 'DISABLE',
      runtimeStatus === 'ACTIVE' ? '启用插件' : '停用插件',
      runtimeStatus === 'ACTIVE' ? '插件已启用并进入运行态。' : '插件已停用并进入停止态。',
      'INFO',
    );

    return this.getInstallation(currentUser, pluginId);
  }

  private async ensureInstallation(tenantId: string, pluginId: string) {
    const installation = await this.prisma.pluginInstallation.findFirst({
      where: {
        tenantId,
        pluginId,
        deletedAt: null,
      },
    });

    if (!installation) {
      throw new NotFoundException('Plugin installation not found');
    }

    return installation;
  }

  private async recordAudit(
    currentUser: AuthenticatedUser,
    pluginId: string,
    action: string,
    title: string,
    summary: string,
    status: string,
  ) {
    await this.prisma.pluginAuditLog.create({
      data: {
        tenantId: currentUser.tenantId,
        pluginId,
        action,
        title,
        summary,
        status,
        riskLevel: 'LOW',
        createdBy: currentUser.id,
      },
    });
    await this.prisma.plugin.update({
      where: { id: pluginId },
      data: {
        auditCount: {
          increment: 1,
        },
        updatedBy: currentUser.id,
      },
    });
  }

  private mapMarketItem(tenantId: string, plugin: PluginMarketRecord): PluginMarketItem {
    const installed = Boolean(plugin.installations?.some((item) => item.tenantId === tenantId && item.deletedAt === null));
    const installation = plugin.installations?.find((item) => item.tenantId === tenantId && item.deletedAt === null) ?? null;

    return {
      plugin_id: plugin.id,
      code: plugin.code,
      name: plugin.name,
      provider: plugin.provider,
      description: plugin.description,
      latest_version: plugin.latestVersion,
      installed,
      install_status: (installation?.status as PluginMarketItem['install_status']) ?? null,
      risk_level: plugin.riskLevel as PluginMarketItem['risk_level'],
      permission_codes: Array.isArray(plugin.permissionPreview) ? (plugin.permissionPreview as string[]) : [],
      menu_count: plugin.menuCount,
      hook_count: plugin.hookCount,
      updated_at: plugin.updatedAt.toISOString(),
    };
  }

  private mapInstallationItem(item: Prisma.PluginInstallationGetPayload<{ include: { plugin: true } }>): PluginInstallationItem {
    return {
      id: item.id,
      tenant_id: item.tenantId,
      plugin_id: item.pluginId,
      code: item.plugin.code,
      name: item.plugin.name,
      provider: item.plugin.provider,
      description: item.plugin.description,
      source_type: item.sourceType as PluginInstallationItem['source_type'],
      installed_version: item.installedVersion,
      latest_version: item.latestVersion,
      status: item.status as PluginInstallationStatus,
      runtime_status: item.runtimeStatus as PluginRuntimeStatus,
      risk_level: item.riskLevel as PluginRiskLevel,
      owner_id: item.ownerId,
      menu_count: item.plugin.menuCount,
      hook_count: item.plugin.hookCount,
      permission_count: Array.isArray(item.permissionPreview) ? item.permissionPreview.length : 0,
      installed_at: item.installedAt?.toISOString() ?? null,
      last_upgraded_at: item.lastUpgradedAt?.toISOString() ?? null,
      enabled_at: item.enabledAt?.toISOString() ?? null,
      disabled_at: item.disabledAt?.toISOString() ?? null,
      updated_at: item.updatedAt.toISOString(),
    };
  }

  private mapInstallationDetail(item: Prisma.PluginInstallationGetPayload<{ include: { plugin: any } }>): PluginInstallationDetail {
    const plugin = item.plugin as PluginRecord;
    return {
      ...this.mapInstallationItem(item as Prisma.PluginInstallationGetPayload<{ include: { plugin: true } }>),
      manifest_json: normalizeJson(plugin.manifestJson),
      config_json: normalizeJson(plugin.configJson),
      permission_preview: Array.isArray(plugin.permissionPreview) ? (plugin.permissionPreview as string[]) : [],
      menu_bindings: plugin.menuBindings.map((binding) => this.mapMenuBindingItem(binding)),
      hooks: plugin.hooks.map((hook) => this.mapHookItem(hook)),
      versions: plugin.versions.map((version) => this.mapVersionItem(version)),
      audit_logs: plugin.auditLogs.map((log) => this.mapAuditLogItem(log)),
      security_preview: {
        summary: '插件安装与启停受到权限、数据范围和资源授权控制。',
        risks: [
          '插件菜单注入必须经过菜单授权。',
          '插件 Hook 需要审计记录。',
          '高风险插件需要安全中心审批。',
        ],
        notes: ['插件中心当前仅管理控制面状态，不直接执行第三方任意代码。'],
      },
    };
  }

  private mapMenuBindingItem(binding: Prisma.PluginMenuBindingGetPayload<{ include: { menu: true } }>): PluginMenuBindingItem {
    return {
      id: binding.id,
      plugin_id: binding.pluginId,
      menu_code: binding.menu.code,
      menu_name: binding.menu.name,
      path: binding.menu.path,
      component: binding.menu.component,
      icon: binding.menu.icon,
      sort_order: binding.sortOrder,
      visible: binding.visible,
      enabled: binding.enabled,
      status: binding.status as PluginMenuBindingItem['status'],
      created_at: binding.createdAt.toISOString(),
      updated_at: binding.updatedAt.toISOString(),
    };
  }

  private mapHookItem(hook: Prisma.PluginHookGetPayload<object>): PluginHookItem {
    return {
      id: hook.id,
      plugin_id: hook.pluginId,
      code: hook.code,
      name: hook.name,
      hook_type: hook.hookType,
      target: hook.target,
      method: hook.method,
      status: hook.status as PluginHookItem['status'],
      config: normalizeJson(hook.configJson),
      created_at: hook.createdAt.toISOString(),
      updated_at: hook.updatedAt.toISOString(),
    };
  }

  private mapVersionItem(version: Prisma.PluginVersionGetPayload<object>): PluginVersionItem {
    return {
      id: version.id,
      plugin_id: version.pluginId,
      version: version.version,
      status: version.status as PluginVersionItem['status'],
      change_note: version.changeNote,
      published_at: version.publishedAt?.toISOString() ?? null,
      created_at: version.createdAt.toISOString(),
    };
  }

  private mapAuditLogItem(log: Prisma.PluginAuditLogGetPayload<object>): PluginAuditLogItem {
    return {
      id: log.id,
      plugin_id: log.pluginId,
      action: log.action,
      title: log.title,
      summary: log.summary ?? '',
      status: log.status,
      risk_level: log.riskLevel as PluginAuditLogItem['risk_level'],
      request_id: log.requestId,
      trace_id: log.traceId,
      created_at: log.createdAt.toISOString(),
    };
  }
}

function bumpPatch(version: string) {
  const parts = version.split('.').map((part) => Number(part));
  if (parts.length < 3 || parts.some((part) => Number.isNaN(part))) {
    return `${version}.1`;
  }
  const [major, minor, patch] = parts;
  return `${major}.${minor}.${(patch ?? 0) + 1}`;
}

function normalizeJson(value: Prisma.JsonValue | null) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

function toJsonInput(value: unknown): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  if (value === undefined || value === null || value === Prisma.JsonNull) return Prisma.JsonNull;

  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
