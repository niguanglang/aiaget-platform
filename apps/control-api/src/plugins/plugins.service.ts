import { BadRequestException, Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash } from 'crypto';

import type {
  CreatePluginInstallationInput,
  PluginAuditLogItem,
  PluginHookItem,
  PluginInstallationDetail,
  PluginInstallationItem,
  PluginMarketItem,
  PluginMenuBindingItem,
  PluginOverview,
  PluginUninstallResult,
  PluginVersionItem,
  RollbackPluginInput,
  PluginHookStatus,
  PluginInstallationStatus,
  PluginRiskLevel,
  PluginRuntimeStatus,
  UpdatePluginHookInput,
  UpdatePluginInstallationInput,
  UpdatePluginMenuBindingInput,
  UpgradePluginInput,
} from '@aiaget/shared-types';

import type { AuthenticatedUser } from '../common/types/request-context';
import { DataScopeQueryService, mergeDataScopeWhere } from '../common/services/data-scope-query.service';
import { PlatformEventsService } from '../platform-events/platform-events.service';
import { PrismaService } from '../prisma/prisma.service';
import { PluginPackageIntegrityService } from './plugin-package-integrity.service';
import { PluginRollbackWorkflowService, type PluginRollbackWorkflowDispatchResult } from './plugin-rollback-workflow.service';
import { auditSandboxPolicyForHookExecution, buildPluginGeneratedCodes, buildPluginManifestPolicy, validatePluginManifestInput } from './plugin-policy';

type PluginRecord = Prisma.PluginGetPayload<{
  include: {
    versions: true;
    hooks: true;
    menuBindings: { include: { menu: true } };
    auditLogs: true;
  };
}>;

type PluginInstallationDetailRecord = Prisma.PluginInstallationGetPayload<{
  include: {
    plugin: {
      include: {
        versions: true;
        hooks: true;
        menuBindings: { include: { menu: true } };
        auditLogs: true;
      };
    };
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

interface NormalizedPluginManifestMenu {
  code: string;
  name: string;
  type: 'DIRECTORY' | 'MENU' | 'BUTTON';
  path: string | null;
  component: string | null;
  icon: string | null;
  permissionCode: string | null;
  sortOrder: number;
  visible: boolean;
  enabled: boolean;
  parentCode: string | null;
}

interface NormalizedPluginManifestHook {
  code: string;
  name: string;
  hookType: string;
  target: string;
  method: string;
  status: PluginHookStatus;
  configJson: Record<string, unknown> | null;
  toolCode: string | null;
  generatedToolCode: string | null;
}

interface NormalizedPluginManifestTool {
  code: string;
  name: string;
  method: string;
  url: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  timeoutMs: number;
  requireApproval: boolean;
  headers: Record<string, string> | null;
  authType: string;
  authConfig: Record<string, unknown> | null;
  inputSchema: Record<string, unknown> | null;
  outputSchema: Record<string, unknown> | null;
  status: 'ACTIVE' | 'DISABLED';
  description: string | null;
}

interface NormalizedPluginManifest {
  raw: Record<string, unknown>;
  code: string;
  name: string;
  provider: string;
  version: string;
  description: string | null;
  riskLevel: PluginRiskLevel;
  permissions: string[];
  menus: NormalizedPluginManifestMenu[];
  hooks: NormalizedPluginManifestHook[];
  tools: NormalizedPluginManifestTool[];
  config: Record<string, unknown> | null;
}

@Injectable()
export class PluginsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(DataScopeQueryService) private readonly dataScopeQuery: DataScopeQueryService,
    @Inject(PlatformEventsService) private readonly platformEvents: PlatformEventsService,
    @Inject(PluginPackageIntegrityService) private readonly packageIntegrity: PluginPackageIntegrityService,
    @Optional() @Inject(PluginRollbackWorkflowService) private readonly rollbackWorkflow: PluginRollbackWorkflowService | null = null,
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

  async validateManifest(currentUser: AuthenticatedUser, dto: CreatePluginInstallationInput) {
    const validation = await this.validateManifestWithPackageIntegrity(dto);
    if (!validation.can_install) {
      await this.recordManifestValidationFailed(currentUser, validation);
    }
    return validation;
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
    const validation = validatePluginManifestInput(dto);
    if (!validation.can_install) {
      await this.recordManifestValidationFailed(currentUser, validation);
      throw new BadRequestException(validation.summary);
    }
    await this.attachPackageIntegrity(validation);
    if (!validation.can_install) {
      await this.recordManifestValidationFailed(currentUser, validation);
      throw new BadRequestException(validation.summary);
    }
    const packageIntegrity = validation.package_integrity;

    const manifest = normalizePluginManifest(dto);
    const plugin = await this.prisma.plugin.upsert({
      where: {
        tenantId_code: {
          tenantId: currentUser.tenantId,
          code: manifest.code,
        },
      },
      create: {
        tenantId: currentUser.tenantId,
        ownerId: currentUser.id,
        code: manifest.code,
        name: manifest.name,
        provider: manifest.provider,
        description: manifest.description,
        sourceType: dto.source_type ?? 'MARKET',
        latestVersion: manifest.version,
        riskLevel: manifest.riskLevel,
        manifestJson: toJsonInput(manifest.raw),
        configJson: toJsonInput(manifest.config),
        permissionPreview: toJsonInput(manifest.permissions),
        status: 'INSTALLED',
        runtimeStatus: 'STOPPED',
        installedAt: new Date(),
        createdBy: currentUser.id,
        updatedBy: currentUser.id,
      },
      update: {
        ownerId: currentUser.id,
        name: manifest.name,
        provider: manifest.provider,
        description: manifest.description,
        sourceType: dto.source_type ?? 'MARKET',
        latestVersion: manifest.version,
        riskLevel: manifest.riskLevel,
        manifestJson: toJsonInput(manifest.raw),
        configJson: toJsonInput(manifest.config),
        permissionPreview: toJsonInput(manifest.permissions),
        status: 'INSTALLED',
        runtimeStatus: 'STOPPED',
        deletedAt: null,
        updatedBy: currentUser.id,
      },
    });

    await this.upsertPluginVersionSnapshot({
      tenantId: currentUser.tenantId,
      pluginId: plugin.id,
      version: plugin.latestVersion,
      manifestJson: plugin.manifestJson,
      changeNote: '插件安装后的初始版本快照。',
      createdBy: currentUser.id,
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

    const syncSummary = await this.syncPluginManifest(currentUser, plugin.id, manifest);
    await this.recordAudit(
      currentUser,
      plugin.id,
      'INSTALL',
      '安装插件',
      `已安装插件 ${plugin.name}，同步 ${syncSummary.hooks} 个 Hook、${syncSummary.menus} 个菜单、${syncSummary.tools} 个工具。`,
      'INFO',
      {
        manifest_code: manifest.code,
        version: manifest.version,
        hooks: syncSummary.hooks,
        menus: syncSummary.menus,
        tools: syncSummary.tools,
        permissions: manifest.permissions,
        risk_level: manifest.riskLevel,
        source_type: dto.source_type ?? 'MARKET',
        package_integrity: packageIntegrity ?? null,
      },
      manifest.riskLevel,
    );
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
      summary: `插件 ${plugin.code} 已安装并同步 Manifest`,
      payloadJson: JSON.parse(JSON.stringify({
        plugin_code: plugin.code,
        manifest_code: manifest.code,
        version: manifest.version,
        hooks: syncSummary.hooks,
        menus: syncSummary.menus,
        tools: syncSummary.tools,
        package_integrity: packageIntegrity ?? null,
      })) as Prisma.InputJsonValue,
    });

    return this.getInstallation(currentUser, plugin.id);
  }

  private async validateManifestWithPackageIntegrity(dto: CreatePluginInstallationInput) {
    const validation = validatePluginManifestInput(dto);
    if (validation.can_install) {
      await this.attachPackageIntegrity(validation);
    }
    return validation;
  }

  private async attachPackageIntegrity(validation: ReturnType<typeof validatePluginManifestInput>) {
    const packageIntegrity = await this.packageIntegrity.verifyPackage({
      sourceUrl: validation.package_source,
      expectedSha256: validation.package_sha256,
      signature: validation.package_signature,
      signatureType: validation.package_signature_type,
      signatureVerificationUrl: validation.package_signature_verification_url,
    });
    validation.package_integrity = packageIntegrity;
    if (packageIntegrity.status !== 'FAILED') return;

    validation.status = 'FAILED';
    validation.can_install = false;
    validation.errors.push({
      code: packageIntegrity.error_code ?? 'PACKAGE_INTEGRITY_FAILED',
      severity: 'ERROR',
      path: 'package.sha256',
      message: packageIntegrity.error_message ?? '插件包完整性校验失败。',
    });
    validation.summary = `Manifest 校验失败：${validation.errors.map((issue) => issue.message).join('；')}`;
  }

  private async recordManifestValidationFailed(
    currentUser: AuthenticatedUser,
    validation: ReturnType<typeof validatePluginManifestInput>,
  ) {
    await this.platformEvents.recordEvent({
      tenantId: currentUser.tenantId,
      departmentId: currentUser.departmentId ?? null,
      userId: currentUser.id,
      resourceType: 'PLUGIN',
      resourceId: validation.manifest_code,
      eventSource: 'CONTROL_API',
      eventType: 'plugin.manifest.validation_failed',
      status: 'FAILED',
      severity: 'WARN',
      billable: false,
      summary: validation.summary,
      payloadJson: JSON.parse(JSON.stringify(validation)) as Prisma.InputJsonValue,
    });
  }

  async update(currentUser: AuthenticatedUser, pluginId: string, dto: UpdatePluginInstallationInput): Promise<PluginInstallationDetail> {
    const installation = await this.ensureInstallation(currentUser.tenantId, pluginId);
    const nextLatestVersion = dto.latest_version?.trim() || undefined;

    await this.prisma.plugin.update({
      where: { id: installation.pluginId },
      data: {
        name: dto.name?.trim() ?? undefined,
        description: dto.description === undefined ? undefined : dto.description,
        latestVersion: nextLatestVersion,
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
        installedVersion: nextLatestVersion ?? installation.installedVersion,
        latestVersion: nextLatestVersion ?? installation.latestVersion,
        riskLevel: dto.risk_level ?? installation.riskLevel,
        status: dto.status ?? installation.status,
        runtimeStatus: dto.runtime_status ?? installation.runtimeStatus,
        configJson: dto.config_json === undefined ? undefined : toJsonInput(dto.config_json),
        updatedBy: currentUser.id,
      },
    });

    if (nextLatestVersion && nextLatestVersion !== installation.latestVersion) {
      await this.upsertPluginVersionSnapshot({
        tenantId: currentUser.tenantId,
        pluginId,
        version: nextLatestVersion,
        manifestJson: installation.manifestJson,
        changeNote: '控制台调整后生成的版本快照。',
        createdBy: currentUser.id,
      });
    }

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

  async upgrade(currentUser: AuthenticatedUser, pluginId: string, dto: UpgradePluginInput = {}) {
    const installation = await this.ensureInstallation(currentUser.tenantId, pluginId);
    if (dto.manifest_json) {
      return this.upgradeWithManifest(currentUser, pluginId, installation, dto);
    }

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

    await this.upsertPluginVersionSnapshot({
      tenantId: currentUser.tenantId,
      pluginId,
      version: nextVersion,
      manifestJson: installation.manifestJson,
      changeNote: `插件升级至 ${nextVersion}。`,
      createdBy: currentUser.id,
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

  private async upgradeWithManifest(
    currentUser: AuthenticatedUser,
    pluginId: string,
    installation: Awaited<ReturnType<PluginsService['ensureInstallation']>>,
    dto: UpgradePluginInput,
  ) {
    const sourceType = dto.source_type ?? (installation.sourceType as CreatePluginInstallationInput['source_type']) ?? 'MARKET';
    const manifestDto: CreatePluginInstallationInput = {
      code: dto.code ?? pluginId,
      name: dto.name,
      provider: dto.provider,
      description: dto.description,
      latest_version: dto.latest_version,
      source_type: sourceType,
      manifest_json: dto.manifest_json,
      config_json: dto.config_json,
      permission_preview: dto.permission_preview,
      risk_level: dto.risk_level,
    };
    const validation = await this.validateManifestWithPackageIntegrity(manifestDto);
    if (!validation.can_install) {
      await this.recordManifestValidationFailed(currentUser, validation);
      throw new BadRequestException(validation.summary);
    }

    const manifest = normalizePluginManifest(manifestDto);
    const installedManifestCode = normalizeInstalledPluginCode(installation.manifestJson) ?? normalizeOptionalText(dto.code ?? null);
    if (installedManifestCode && manifest.code !== installedManifestCode) {
      throw new BadRequestException(`升级 Manifest 编码 ${manifest.code} 与当前插件编码 ${installedManifestCode} 不一致。`);
    }

    const now = new Date();
    const packageIntegrity = validation.package_integrity;

    await this.prisma.plugin.update({
      where: { id: pluginId },
      data: {
        name: manifest.name,
        provider: manifest.provider,
        description: manifest.description,
        latestVersion: manifest.version,
        riskLevel: manifest.riskLevel,
        manifestJson: toJsonInput(manifest.raw),
        configJson: toJsonInput(manifest.config),
        permissionPreview: toJsonInput(manifest.permissions),
        status: 'INSTALLED',
        runtimeStatus: 'STOPPED',
        lastUpgradedAt: now,
        updatedBy: currentUser.id,
      },
    });

    await this.prisma.pluginInstallation.update({
      where: { id: installation.id },
      data: {
        installedVersion: manifest.version,
        latestVersion: manifest.version,
        status: 'INSTALLED',
        runtimeStatus: 'STOPPED',
        sourceType,
        riskLevel: manifest.riskLevel,
        configJson: toJsonInput(manifest.config),
        manifestJson: toJsonInput(manifest.raw),
        permissionPreview: toJsonInput(manifest.permissions),
        lastUpgradedAt: now,
        updatedBy: currentUser.id,
      },
    });

    await this.upsertPluginVersionSnapshot({
      tenantId: currentUser.tenantId,
      pluginId,
      version: manifest.version,
      manifestJson: toJsonInput(manifest.raw) as Prisma.JsonValue,
      changeNote: dto.change_note?.trim() || `插件升级至 ${manifest.version} 并同步 Manifest。`,
      createdBy: currentUser.id,
    });

    const syncSummary = await this.syncPluginManifest(currentUser, pluginId, manifest);
    await this.recordAudit(
      currentUser,
      pluginId,
      'UPGRADE',
      '升级插件',
      `插件版本升级至 ${manifest.version}，同步 ${syncSummary.hooks} 个 Hook、${syncSummary.menus} 个菜单、${syncSummary.tools} 个工具。`,
      'INFO',
      {
        manifest_code: manifest.code,
        version: manifest.version,
        previous_installed_version: installation.installedVersion,
        hooks: syncSummary.hooks,
        menus: syncSummary.menus,
        tools: syncSummary.tools,
        permissions: manifest.permissions,
        risk_level: manifest.riskLevel,
        source_type: sourceType,
        package_integrity: packageIntegrity ?? null,
      },
      manifest.riskLevel,
    );
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
      severity: manifest.riskLevel === 'CRITICAL' || manifest.riskLevel === 'HIGH' ? 'WARN' : 'INFO',
      billable: false,
      summary: `插件 ${pluginId} 已升级并同步 Manifest`,
      payloadJson: JSON.parse(JSON.stringify({
        plugin_code: manifest.code,
        manifest_code: manifest.code,
        version: manifest.version,
        previous_installed_version: installation.installedVersion,
        hooks: syncSummary.hooks,
        menus: syncSummary.menus,
        tools: syncSummary.tools,
        package_integrity: packageIntegrity ?? null,
      })) as Prisma.InputJsonValue,
    });

    return this.getInstallation(currentUser, pluginId);
  }

  async rollback(currentUser: AuthenticatedUser, pluginId: string, dto: RollbackPluginInput) {
    this.assertRollbackTarget(dto);
    const installation = await this.ensureInstallation(currentUser.tenantId, pluginId);
    const version = await this.prisma.pluginVersion.findFirst({
      where: {
        tenantId: currentUser.tenantId,
        pluginId,
        id: dto.version_id ?? undefined,
        version: dto.version_id ? undefined : dto.version,
        status: 'PUBLISHED',
        deletedAt: null,
      },
    });
    if (!version) {
      throw new NotFoundException('Plugin version snapshot not found');
    }

    const manifest = normalizePluginManifest({
      code: pluginId,
      manifest_json: normalizeJson(version.manifestJson) ?? {},
      source_type: installation.sourceType as CreatePluginInstallationInput['source_type'],
    });
    const now = new Date();

    await this.prisma.plugin.update({
      where: { id: pluginId },
      data: {
        name: manifest.name,
        provider: manifest.provider,
        description: manifest.description,
        latestVersion: version.version,
        riskLevel: manifest.riskLevel,
        manifestJson: toJsonInput(manifest.raw),
        configJson: toJsonInput(manifest.config),
        permissionPreview: toJsonInput(manifest.permissions),
        status: 'INSTALLED',
        runtimeStatus: 'STOPPED',
        updatedBy: currentUser.id,
      },
    });
    await this.prisma.pluginInstallation.update({
      where: { id: installation.id },
      data: {
        installedVersion: version.version,
        latestVersion: version.version,
        status: 'INSTALLED',
        runtimeStatus: 'STOPPED',
        riskLevel: manifest.riskLevel,
        manifestJson: toJsonInput(manifest.raw),
        configJson: toJsonInput(manifest.config),
        permissionPreview: toJsonInput(manifest.permissions),
        lastUpgradedAt: now,
        updatedBy: currentUser.id,
      },
    });

    const syncSummary = await this.syncPluginManifest(currentUser, pluginId, manifest);
    await this.upsertPluginVersionSnapshot({
      tenantId: currentUser.tenantId,
      pluginId,
      version: version.version,
      manifestJson: version.manifestJson,
      changeNote: dto.change_note?.trim() || `插件回滚至 ${version.version}。`,
      createdBy: currentUser.id,
    });
    const workflowDispatch = await this.dispatchRollbackWorkflow(currentUser, pluginId, {
      versionId: version.id,
      version: version.version,
    });

    await this.recordAudit(
      currentUser,
      pluginId,
      'ROLLBACK',
      '回滚插件',
      dto.change_note?.trim() || `插件已回滚至版本 ${version.version}。`,
      'SUCCESS',
      {
        version_id: version.id,
        version: version.version,
        previous_installed_version: installation.installedVersion,
        hooks: syncSummary.hooks,
        menus: syncSummary.menus,
        tools: syncSummary.tools,
        workflow_backend: workflowDispatch.workflow_backend,
        workflow_id: workflowDispatch.workflow_id,
        workflow_run_id: workflowDispatch.workflow_run_id,
      },
      manifest.riskLevel,
    );
    await this.platformEvents.recordEvent({
      tenantId: currentUser.tenantId,
      departmentId: currentUser.departmentId ?? null,
      userId: currentUser.id,
      resourceType: 'PLUGIN',
      resourceId: pluginId,
      pluginId,
      eventSource: 'CONTROL_API',
      eventType: 'plugin.rolled_back',
      status: 'SUCCESS',
      severity: 'WARN',
      billable: false,
      summary: `插件 ${pluginId} 已回滚至 ${version.version}`,
      payloadJson: {
        version_id: version.id,
        version: version.version,
        previous_installed_version: installation.installedVersion,
        hooks: syncSummary.hooks,
        menus: syncSummary.menus,
        tools: syncSummary.tools,
        workflow_backend: workflowDispatch.workflow_backend,
        workflow_id: workflowDispatch.workflow_id,
        workflow_run_id: workflowDispatch.workflow_run_id,
      },
    });

    return this.getInstallation(currentUser, pluginId);
  }

  private assertRollbackTarget(dto: RollbackPluginInput) {
    const versionId = dto.version_id?.trim();
    const version = dto.version?.trim();
    if (!versionId && !version) {
      throw new BadRequestException('插件回滚必须指定版本 ID 或版本号。');
    }
    if (versionId && version) {
      throw new BadRequestException('插件回滚版本 ID 和版本号只能二选一。');
    }
  }

  private async dispatchRollbackWorkflow(
    currentUser: AuthenticatedUser,
    pluginId: string,
    input: { versionId: string; version: string },
  ): Promise<PluginRollbackWorkflowDispatchResult> {
    if (!this.rollbackWorkflow) {
      return {
        workflow_backend: 'LOCAL',
        workflow_id: null,
        workflow_run_id: null,
      };
    }

    return this.rollbackWorkflow.dispatchRollback(currentUser, pluginId, input);
  }

  async uninstall(currentUser: AuthenticatedUser, pluginId: string): Promise<PluginUninstallResult> {
    const installation = await this.ensureInstallation(currentUser.tenantId, pluginId);
    const plugin = await this.prisma.plugin.findFirst({
      where: {
        tenantId: currentUser.tenantId,
        id: pluginId,
        deletedAt: null,
      },
      select: {
        id: true,
        code: true,
        name: true,
        manifestJson: true,
      },
    });
    if (!plugin) throw new NotFoundException('Plugin not found');

    const now = new Date();
    const generatedCodes = buildPluginGeneratedCodes(plugin.code, normalizeJson(plugin.manifestJson));

    const [menuBindings, hooks, tools, menus] = await this.prisma.$transaction([
      this.prisma.pluginMenuBinding.updateMany({
        where: {
          tenantId: currentUser.tenantId,
          pluginId,
          deletedAt: null,
        },
        data: {
          status: 'DELETED',
          enabled: false,
          visible: false,
          deletedAt: now,
          updatedBy: currentUser.id,
        },
      }),
      this.prisma.pluginHook.updateMany({
        where: {
          tenantId: currentUser.tenantId,
          pluginId,
          deletedAt: null,
        },
        data: {
          status: 'DELETED',
          deletedAt: now,
          updatedBy: currentUser.id,
        },
      }),
      this.prisma.tool.updateMany({
        where: {
          tenantId: currentUser.tenantId,
          code: {
            in: generatedCodes.toolCodes,
          },
          deletedAt: null,
        },
        data: {
          status: 'DELETED',
          deletedAt: now,
          updatedBy: currentUser.id,
        },
      }),
      this.prisma.menu.updateMany({
        where: {
          tenantId: currentUser.tenantId,
          code: {
            in: generatedCodes.menuCodes,
          },
          deletedAt: null,
        },
        data: {
          enabled: false,
          visible: false,
          deletedAt: now,
          updatedBy: currentUser.id,
        },
      }),
    ]);

    await this.prisma.pluginInstallation.update({
      where: { id: installation.id },
      data: {
        status: 'ARCHIVED',
        runtimeStatus: 'STOPPED',
        disabledAt: now,
        deletedAt: now,
        updatedBy: currentUser.id,
      },
    });
    await this.prisma.plugin.update({
      where: { id: pluginId },
      data: {
        status: 'ARCHIVED',
        runtimeStatus: 'STOPPED',
        hookCount: 0,
        menuCount: 0,
        disabledAt: now,
        updatedBy: currentUser.id,
      },
    });

    const cleanup = {
      menu_bindings: menuBindings.count,
      menus: menus.count,
      hooks: hooks.count,
      tools: tools.count,
    };
    await this.recordAudit(
      currentUser,
      pluginId,
      'UNINSTALL',
      '卸载插件',
      `已卸载插件 ${plugin.name}，清理菜单绑定 ${cleanup.menu_bindings} 个、菜单 ${cleanup.menus} 个、Hook ${cleanup.hooks} 个、工具 ${cleanup.tools} 个。`,
      'SUCCESS',
      cleanup,
      'MEDIUM',
    );
    await this.platformEvents.recordEvent({
      tenantId: currentUser.tenantId,
      departmentId: currentUser.departmentId ?? null,
      userId: currentUser.id,
      resourceType: 'PLUGIN',
      resourceId: pluginId,
      pluginId,
      eventSource: 'CONTROL_API',
      eventType: 'plugin.uninstalled',
      status: 'SUCCESS',
      severity: 'WARN',
      billable: false,
      summary: `插件 ${plugin.code} 已卸载并完成控制面清理`,
      payloadJson: cleanup,
    });

    return {
      plugin_id: pluginId,
      status: 'ARCHIVED',
      runtime_status: 'STOPPED',
      cleanup,
      message: '插件已卸载，生成的菜单、Hook 与工具已完成软删除清理。',
    };
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
    if (runtimeStatus === 'ACTIVE') {
      const policy = buildPluginManifestPolicy({
        riskLevel: installation.riskLevel as PluginRiskLevel,
        status: installation.status,
        manifest: normalizeJson(installation.manifestJson),
      });
      if (!policy.canEnable) {
        await this.recordAudit(
          currentUser,
          pluginId,
          'ENABLE_BLOCKED',
          '启用插件被拦截',
          policy.reason ?? '插件当前状态不允许启用。',
          'WARN',
          {
            review_required: policy.reviewRequired,
            review_status: policy.reviewStatus,
            risk_level: installation.riskLevel,
          },
          installation.riskLevel as PluginRiskLevel,
        );
        throw new BadRequestException(policy.reason ?? 'Plugin cannot be enabled');
      }
    }
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

  private async syncPluginManifest(
    currentUser: AuthenticatedUser,
    pluginId: string,
    manifest: NormalizedPluginManifest,
  ) {
    const [permissions, hooks, menus, tools] = await Promise.all([
      this.syncPluginPermissions(currentUser, manifest),
      this.syncPluginHooks(currentUser, pluginId, manifest),
      this.syncPluginMenus(currentUser, pluginId, manifest.menus, manifest.code),
      this.syncPluginTools(currentUser, manifest),
    ]);

    await this.prisma.plugin.update({
      where: { id: pluginId },
      data: {
        hookCount: hooks,
        menuCount: menus,
        updatedBy: currentUser.id,
      },
    });

    await this.recordAudit(
      currentUser,
      pluginId,
      'MANIFEST_SYNC',
      '同步 Manifest',
      `已同步 ${permissions} 个权限、${hooks} 个 Hook、${menus} 个菜单、${tools} 个工具。`,
      'SUCCESS',
      {
        permissions,
        hooks,
        menus,
        tools,
        plugin_code: manifest.code,
        version: manifest.version,
      },
      manifest.riskLevel,
    );
    await this.platformEvents.recordEvent({
      tenantId: currentUser.tenantId,
      departmentId: currentUser.departmentId ?? null,
      userId: currentUser.id,
      resourceType: 'PLUGIN',
      resourceId: pluginId,
      pluginId,
      eventSource: 'CONTROL_API',
      eventType: 'plugin.manifest.synced',
      status: 'SUCCESS',
      severity: manifest.riskLevel === 'CRITICAL' || manifest.riskLevel === 'HIGH' ? 'WARN' : 'INFO',
      billable: false,
      summary: `插件 ${manifest.code} Manifest 已同步`,
      payloadJson: {
        permissions,
        hooks,
        menus,
        tools,
        version: manifest.version,
      },
    });

    return {
      permissions,
      hooks,
      menus,
      tools,
    };
  }

  private async syncPluginPermissions(currentUser: AuthenticatedUser, manifest: NormalizedPluginManifest) {
    let synced = 0;

    for (const code of manifest.permissions) {
      const parsed = parsePermissionCode(code);
      await this.prisma.permission.upsert({
        where: {
          tenantId_code: {
            tenantId: currentUser.tenantId,
            code,
          },
        },
        create: {
          tenantId: currentUser.tenantId,
          code,
          name: `${manifest.name} ${parsed.actionLabel}`,
          module: parsed.module,
          resource: parsed.resource,
          action: parsed.action,
          createdBy: currentUser.id,
          updatedBy: currentUser.id,
        },
        update: {
          name: `${manifest.name} ${parsed.actionLabel}`,
          module: parsed.module,
          resource: parsed.resource,
          action: parsed.action,
          deletedAt: null,
          updatedBy: currentUser.id,
        },
      });
      synced += 1;
    }

    return synced;
  }

  private async syncPluginHooks(
    currentUser: AuthenticatedUser,
    pluginId: string,
    manifest: NormalizedPluginManifest,
  ) {
    let synced = 0;
    const now = new Date();
    const activeCodes = manifest.hooks.map((hook) => hook.code);
    const toolCodes = new Set(manifest.tools.map((tool) => tool.code));
    const generatedToolCodes = new Set(manifest.tools.map((tool) => buildPluginToolCode(manifest.code, tool.code)));
    const fallbackToolCode = manifest.tools.length === 1 ? manifest.tools[0]?.code ?? null : null;
    const sandboxAudit = auditSandboxPolicyForHookExecution(manifest.raw);
    const sandboxConfig = sandboxAudit.policy.status === 'NOT_REQUIRED'
      ? {}
      : {
        sandbox_policy: sandboxAudit.policy,
        sandbox_risk_level: sandboxAudit.risk_level,
        sandbox_violations: sandboxAudit.violations,
      };

    for (const hook of manifest.hooks) {
      const generatedToolCode = hook.generatedToolCode && generatedToolCodes.has(hook.generatedToolCode)
        ? hook.generatedToolCode
        : hook.toolCode && toolCodes.has(hook.toolCode)
          ? buildPluginToolCode(manifest.code, hook.toolCode)
          : fallbackToolCode
            ? buildPluginToolCode(manifest.code, fallbackToolCode)
            : null;
      const hookConfig = {
        ...(hook.configJson ?? {}),
        ...sandboxConfig,
        ...(generatedToolCode ? { generated_tool_code: generatedToolCode } : {}),
      };
      await this.prisma.pluginHook.upsert({
        where: {
          tenantId_pluginId_code: {
            tenantId: currentUser.tenantId,
            pluginId,
            code: hook.code,
          },
        },
        create: {
          tenantId: currentUser.tenantId,
          pluginId,
          code: hook.code,
          name: hook.name,
          hookType: hook.hookType,
          target: hook.target,
          method: hook.method,
          status: hook.status,
          configJson: toJsonInput(hookConfig),
          createdBy: currentUser.id,
          updatedBy: currentUser.id,
        },
        update: {
          name: hook.name,
          hookType: hook.hookType,
          target: hook.target,
          method: hook.method,
          status: hook.status,
          configJson: toJsonInput(hookConfig),
          deletedAt: null,
          updatedBy: currentUser.id,
        },
      });
      synced += 1;
    }

    await this.prisma.pluginHook.updateMany({
      where: {
        tenantId: currentUser.tenantId,
        pluginId,
        code: {
          notIn: activeCodes,
        },
        deletedAt: null,
      },
      data: {
        status: 'DELETED',
        deletedAt: now,
        updatedBy: currentUser.id,
      },
    });

    return synced;
  }

  private async syncPluginMenus(
    currentUser: AuthenticatedUser,
    pluginId: string,
    menus: NormalizedPluginManifestMenu[],
    pluginCode: string,
  ) {
    let synced = 0;
    const menuIdByRawCode = new Map<string, string>();
    const activeMenuCodes = menus.map((menu) => buildPluginMenuCode(pluginCode, menu.code));
    const now = new Date();

    for (const menu of menus) {
      const menuCode = buildPluginMenuCode(pluginCode, menu.code);
      const menuRecord = await this.prisma.menu.upsert({
        where: {
          tenantId_code: {
            tenantId: currentUser.tenantId,
            code: menuCode,
          },
        },
        create: {
          tenantId: currentUser.tenantId,
          parentId: null,
          name: menu.name,
          code: menuCode,
          type: menu.type,
          path: menu.path,
          component: menu.component,
          icon: menu.icon,
          permissionCode: menu.permissionCode,
          sortOrder: menu.sortOrder,
          visible: menu.visible,
          enabled: menu.enabled,
          createdBy: currentUser.id,
          updatedBy: currentUser.id,
        },
        update: {
          parentId: null,
          name: menu.name,
          type: menu.type,
          path: menu.path,
          component: menu.component,
          icon: menu.icon,
          permissionCode: menu.permissionCode,
          sortOrder: menu.sortOrder,
          visible: menu.visible,
          enabled: menu.enabled,
          deletedAt: null,
          updatedBy: currentUser.id,
        },
      });
      menuIdByRawCode.set(menu.code, menuRecord.id);
    }

    for (const menu of menus) {
      const menuId = menuIdByRawCode.get(menu.code);
      if (!menuId) {
        throw new BadRequestException(`Manifest menu ${menu.code} 同步失败，未生成菜单记录`);
      }

      if (menu.parentCode) {
      const parentId =
        menuIdByRawCode.get(menu.parentCode)
        ?? (await this.findMenuIdByCode(currentUser.tenantId, buildPluginMenuCode(pluginCode, menu.parentCode)))
        ?? (await this.findMenuIdByCode(currentUser.tenantId, menu.parentCode));
        if (!parentId) {
          throw new BadRequestException(`Manifest menu ${menu.code} 的父菜单 ${menu.parentCode} 不存在`);
        }

        const menuCode = buildPluginMenuCode(pluginCode, menu.code);
        await this.prisma.menu.update({
          where: {
            tenantId_code: {
              tenantId: currentUser.tenantId,
              code: menuCode,
            },
          },
          data: {
            parentId,
            updatedBy: currentUser.id,
          },
        });
      }

      await this.prisma.pluginMenuBinding.upsert({
        where: {
          tenantId_pluginId_menuId: {
            tenantId: currentUser.tenantId,
            pluginId,
            menuId,
          },
        },
        create: {
          tenantId: currentUser.tenantId,
          pluginId,
          menuId,
          enabled: menu.enabled,
          visible: menu.visible,
          sortOrder: menu.sortOrder,
          status: menu.enabled ? 'ACTIVE' : 'DISABLED',
          createdBy: currentUser.id,
          updatedBy: currentUser.id,
        },
        update: {
          enabled: menu.enabled,
          visible: menu.visible,
          sortOrder: menu.sortOrder,
          status: menu.enabled ? 'ACTIVE' : 'DISABLED',
          deletedAt: null,
          updatedBy: currentUser.id,
        },
      });
      synced += 1;
    }

    await this.prisma.pluginMenuBinding.updateMany({
      where: {
        tenantId: currentUser.tenantId,
        pluginId,
        menuId: {
          notIn: Array.from(menuIdByRawCode.values()),
        },
        deletedAt: null,
      },
      data: {
        status: 'DELETED',
        enabled: false,
        visible: false,
        deletedAt: now,
        updatedBy: currentUser.id,
      },
    });
    await this.prisma.menu.updateMany({
      where: {
        tenantId: currentUser.tenantId,
        code: {
          startsWith: buildPluginCodePrefix('plugin', pluginCode),
          notIn: activeMenuCodes,
        },
        deletedAt: null,
      },
      data: {
        enabled: false,
        visible: false,
        deletedAt: now,
        updatedBy: currentUser.id,
      },
    });

    return synced;
  }

  private async findMenuIdByCode(tenantId: string, code: string) {
    const menu = await this.prisma.menu.findFirst({
      where: {
        tenantId,
        code,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    return menu?.id ?? null;
  }

  private async syncPluginTools(currentUser: AuthenticatedUser, manifest: NormalizedPluginManifest) {
    let synced = 0;
    const activeToolCodes = manifest.tools.map((tool) => buildPluginToolCode(manifest.code, tool.code));
    const now = new Date();

    for (const tool of manifest.tools) {
      const toolCode = buildPluginToolCode(manifest.code, tool.code);
      const toolDescription = [
        tool.description,
        `来源插件：${manifest.name}（${manifest.code}）`,
      ].filter(Boolean).join('\n');
      const requireApproval = tool.requireApproval || tool.riskLevel === 'HIGH';
      await this.prisma.tool.upsert({
        where: {
          tenantId_code: {
            tenantId: currentUser.tenantId,
            code: toolCode,
          },
        },
        create: {
          tenantId: currentUser.tenantId,
          name: tool.name,
          code: toolCode,
          description: toolDescription,
          toolType: 'HTTP',
          method: tool.method,
          url: tool.url,
          status: tool.status,
          riskLevel: tool.riskLevel,
          timeoutMs: tool.timeoutMs,
          requireApproval,
          headers: toJsonInput(tool.headers),
          authType: tool.authType,
          authConfig: toJsonInput(tool.authConfig),
          inputSchema: toJsonInput(tool.inputSchema),
          outputSchema: toJsonInput(tool.outputSchema),
          createdBy: currentUser.id,
          updatedBy: currentUser.id,
        },
        update: {
          name: tool.name,
          description: toolDescription,
          toolType: 'HTTP',
          method: tool.method,
          url: tool.url,
          status: tool.status,
          riskLevel: tool.riskLevel,
          timeoutMs: tool.timeoutMs,
          requireApproval,
          headers: toJsonInput(tool.headers),
          authType: tool.authType,
          authConfig: toJsonInput(tool.authConfig),
          inputSchema: toJsonInput(tool.inputSchema),
          outputSchema: toJsonInput(tool.outputSchema),
          deletedAt: null,
          updatedBy: currentUser.id,
        },
      });
      synced += 1;
    }

    await this.prisma.tool.updateMany({
      where: {
        tenantId: currentUser.tenantId,
        code: {
          startsWith: buildPluginCodePrefix('plugin_tool', manifest.code),
          notIn: activeToolCodes,
        },
        deletedAt: null,
      },
      data: {
        status: 'DELETED',
        deletedAt: now,
        updatedBy: currentUser.id,
      },
    });

    return synced;
  }

  private async recordAudit(
    currentUser: AuthenticatedUser,
    pluginId: string,
    action: string,
    title: string,
    summary: string,
    status: string,
    payload?: Record<string, unknown> | null,
    riskLevel: PluginRiskLevel = 'LOW',
  ) {
    await this.prisma.pluginAuditLog.create({
      data: {
        tenantId: currentUser.tenantId,
        pluginId,
        action,
        title,
        summary,
        status,
        riskLevel,
        payloadJson: payload === undefined ? Prisma.JsonNull : toJsonInput(payload),
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

  private async upsertPluginVersionSnapshot(params: {
    tenantId: string;
    pluginId: string;
    version: string;
    manifestJson: Prisma.JsonValue | null;
    changeNote: string;
    createdBy: string;
  }) {
    const now = new Date();

    await this.prisma.pluginVersion.upsert({
      where: {
        tenantId_pluginId_version: {
          tenantId: params.tenantId,
          pluginId: params.pluginId,
          version: params.version,
        },
      },
      create: {
        tenantId: params.tenantId,
        pluginId: params.pluginId,
        version: params.version,
        status: 'PUBLISHED',
        manifestJson: toJsonInput(params.manifestJson),
        changeNote: params.changeNote,
        publishedAt: now,
        createdBy: params.createdBy,
      },
      update: {
        status: 'PUBLISHED',
        manifestJson: toJsonInput(params.manifestJson),
        changeNote: params.changeNote,
        publishedAt: now,
        createdBy: params.createdBy,
        deletedAt: null,
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

  private mapInstallationDetail(item: PluginInstallationDetailRecord): PluginInstallationDetail {
    const plugin: PluginRecord = item.plugin;
    const policy = buildPluginManifestPolicy({
      riskLevel: item.riskLevel as PluginRiskLevel,
      status: item.status,
      manifest: normalizeJson(plugin.manifestJson),
    });
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
        summary: policy.canEnable
          ? '插件安装、启停和卸载受到权限、数据范围和资源授权控制。'
          : policy.reason ?? '插件当前存在安全策略阻断。',
        risks: [
          '插件菜单注入必须经过菜单授权。',
          '插件 Hook 需要审计记录。',
          '高风险插件需要安全中心审批。',
          ...policy.warnings,
        ],
        notes: ['插件中心当前仅管理控制面状态，不直接执行第三方任意代码。'],
        review_required: policy.reviewRequired,
        review_status: policy.reviewStatus,
        can_enable: policy.canEnable,
        block_reason: policy.reason,
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
      manifest_json: normalizeJson(version.manifestJson),
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

function normalizePluginManifest(dto: CreatePluginInstallationInput): NormalizedPluginManifest {
  const rawManifest = isPlainRecord(dto.manifest_json) ? dto.manifest_json : {};
  const manifestPermissions = getStringArray(rawManifest, ['permissions', 'permission_codes', 'permission_preview']);
  const permissions = uniqueStrings([
    ...manifestPermissions,
    ...(Array.isArray(dto.permission_preview) ? dto.permission_preview : []),
  ]);
  const menus = getManifestObjectArray(rawManifest, ['menus', 'menu_bindings', 'menu_entries']).map((item, index) =>
    normalizeManifestMenu(item, index),
  );
  const hooks = getManifestObjectArray(rawManifest, ['hooks']).map((item, index) => normalizeManifestHook(item, index));
  const tools = getManifestObjectArray(rawManifest, ['tools', 'actions', 'capabilities']).map((item, index) =>
    normalizeManifestTool(item, index),
  );
  const config = isPlainRecord(dto.config_json)
    ? dto.config_json
    : getRecord(rawManifest, ['config', 'config_json']);
  const version = normalizeVersion(
    getString(rawManifest, ['version', 'latest_version'])
    ?? dto.latest_version
    ?? '1.0.0',
  );
  const riskLevel = normalizePluginRiskLevel(
    getString(rawManifest, ['risk_level', 'risk'])
    ?? dto.risk_level
    ?? null,
  );
  const code = normalizeManifestCode(getString(rawManifest, ['code', 'plugin_code']) ?? dto.code);
  const name = normalizeOptionalText(getString(rawManifest, ['name', 'plugin_name']) ?? dto.name ?? null) ?? code;
  const provider =
    normalizeOptionalText(getString(rawManifest, ['provider', 'vendor']) ?? dto.provider ?? null) ?? '平台插件市场';
  const description = normalizeOptionalText(
    getString(rawManifest, ['description', 'summary'])
    ?? dto.description
    ?? null,
  );

  return {
    raw: {
      ...rawManifest,
      code,
      name,
      provider,
      version,
      description,
      risk_level: riskLevel,
      permissions,
      config,
      menus,
      hooks,
      tools,
    },
    code,
    name,
    provider,
    version,
    description,
    riskLevel,
    permissions,
    menus,
    hooks,
    tools,
    config,
  };
}

function normalizeInstalledPluginCode(value: unknown) {
  if (!isPlainRecord(value)) return null;
  const code = getString(value, ['code', 'plugin_code']);
  if (!code) return null;
  return normalizeManifestCode(code);
}

function normalizeManifestMenu(value: Record<string, unknown>, index: number): NormalizedPluginManifestMenu {
  const code = normalizeManifestCode(getString(value, ['code', 'menu_code']) ?? `menu_${index + 1}`);
  const name = normalizeText(getString(value, ['name', 'menu_name']) ?? code);
  const path = normalizeOptionalText(getString(value, ['path', 'route']) ?? null);
  const component = normalizeOptionalText(getString(value, ['component', 'view']) ?? null);
  const icon = normalizeOptionalText(getString(value, ['icon']) ?? null);
  const permissionCode = normalizeOptionalText(getString(value, ['permission_code', 'permissionCode']) ?? null);
  const sortOrder = normalizeNumber(value.sort_order ?? value.sortOrder, 0);
  const visible = normalizeBoolean(value.visible, true);
  const enabled = normalizeBoolean(value.enabled, true);
  const parentCode = normalizeOptionalText(getString(value, ['parent_code', 'parentCode']) ?? null);
  const type = normalizeMenuType(getString(value, ['type', 'menu_type']) ?? null);

  return {
    code,
    name,
    path,
    component,
    icon,
    permissionCode,
    sortOrder,
    visible,
    enabled,
    parentCode,
    type,
  };
}

function normalizeManifestHook(value: Record<string, unknown>, index: number): NormalizedPluginManifestHook {
  const code = normalizeManifestCode(getString(value, ['code', 'hook_code']) ?? `hook_${index + 1}`);
  const name = normalizeText(getString(value, ['name', 'hook_name']) ?? code);
  const hookType = normalizeText(getString(value, ['hook_type', 'type']) ?? 'EVENT');
  const target = normalizeText(getString(value, ['target', 'event', 'topic']) ?? code);
  const method = normalizeHookMethod(getString(value, ['method']) ?? null);
  const status = normalizeHookStatus(getString(value, ['status']) ?? null);
  const configJson = getRecord(value, ['config', 'config_json']);
  const toolCode = normalizeOptionalText(getString(value, ['tool_code', 'toolCode']) ?? null);
  const generatedToolCode = normalizeOptionalText(
    getString(value, ['generated_tool_code', 'generatedToolCode'])
    ?? (configJson ? getString(configJson, ['generated_tool_code', 'generatedToolCode']) : null),
  );

  return {
    code,
    name,
    hookType,
    target,
    method,
    status,
    configJson,
    toolCode: toolCode ? normalizeManifestCode(toolCode) : null,
    generatedToolCode: generatedToolCode ? normalizeManifestCode(generatedToolCode) : null,
  };
}

function normalizeManifestTool(value: Record<string, unknown>, index: number): NormalizedPluginManifestTool {
  const rawCode = normalizeManifestCode(getString(value, ['code', 'tool_code']) ?? `tool_${index + 1}`);
  const name = normalizeText(getString(value, ['name', 'tool_name']) ?? rawCode);
  const method = normalizeToolMethod(getString(value, ['method']) ?? 'POST');
  const url = normalizeUrl(getString(value, ['url', 'endpoint']) ?? '');
  const riskLevel = normalizeToolRiskLevel(getString(value, ['risk_level', 'risk']) ?? null);
  const timeoutMs = normalizeNumber(value.timeout_ms ?? value.timeoutMs, 10000);
  const requireApproval = riskLevel === 'HIGH'
    ? true
    : normalizeBoolean(value.require_approval ?? value.requireApproval, false);
  const headers = normalizeStringRecord(value.headers);
  const authType = normalizeToolAuthType(getString(value, ['auth_type', 'authType']) ?? null);
  const authConfig = getRecord(value, ['auth_config', 'authConfig']);
  const inputSchema = getRecord(value, ['input_schema', 'inputSchema']) ?? defaultPermissiveObjectSchema();
  const outputSchema = getRecord(value, ['output_schema', 'outputSchema']) ?? defaultPermissiveObjectSchema();
  const status = normalizeToolStatus(getString(value, ['status']) ?? null);
  const description = normalizeOptionalText(getString(value, ['description', 'summary']) ?? null);

  if (!url) {
    throw new BadRequestException(`Manifest tool ${rawCode} 缺少有效 url`);
  }

  return {
    code: rawCode,
    name,
    method,
    url,
    riskLevel,
    timeoutMs,
    requireApproval,
    headers,
    authType,
    authConfig,
    inputSchema,
    outputSchema,
    status,
    description,
  };
}

function parsePermissionCode(code: string) {
  const normalized = normalizeText(code);
  const segments = normalized.split(':').map((item) => item.trim()).filter(Boolean);
  const module = normalizeManifestCode(segments[0] ?? 'plugin');
  const resource = normalizeManifestCode(segments[1] ?? module);
  const action = normalizeManifestCode(segments.slice(2).join(':') || 'use');
  const actionLabel = segments.length >= 3 ? segments[segments.length - 1] : action;

  return {
    module,
    resource,
    action,
    actionLabel,
  };
}

function buildPluginMenuCode(pluginCode: string, rawCode: string) {
  return buildNamespacedCode('plugin', pluginCode, rawCode, 100);
}

function buildPluginToolCode(pluginCode: string, rawCode: string) {
  return buildNamespacedCode('plugin_tool', pluginCode, rawCode, 100);
}

function buildPluginCodePrefix(prefix: string, pluginCode: string) {
  return `${[prefix, pluginCode].map((part) => normalizeManifestCode(part)).join('_')}_`;
}

function buildNamespacedCode(prefix: string, namespace: string, rawCode: string, maxLength: number) {
  const parts = [prefix, namespace, rawCode].map((part) => normalizeManifestCode(part)).filter(Boolean);
  const base = parts.join('_');
  if (base.length <= maxLength && /^[a-z]/.test(base)) {
    return base;
  }

  const hash = createHash('sha1').update(base).digest('hex').slice(0, 8);
  const trimLength = Math.max(3, maxLength - hash.length - 1);
  const trimmed = base.slice(0, trimLength).replace(/_+$/g, '');
  const candidate = `${trimmed}_${hash}`.replace(/_+/g, '_').replace(/^_+|_+$/g, '');
  return candidate.slice(0, maxLength);
}

function normalizeManifestCode(value: string) {
  const normalized = normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  return normalized || 'item';
}

function normalizeText(value: string) {
  return value.trim();
}

function normalizeOptionalText(value: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeVersion(value: string) {
  const trimmed = value.trim();
  return trimmed || '1.0.0';
}

function normalizePluginRiskLevel(value: string | null): PluginRiskLevel {
  if (value === 'LOW' || value === 'MEDIUM' || value === 'HIGH' || value === 'CRITICAL') return value;

  return 'MEDIUM';
}

function normalizeToolRiskLevel(value: string | null): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (value === 'LOW' || value === 'MEDIUM') return value;
  return 'HIGH';
}

function normalizeToolMethod(value: string) {
  const normalized = value.trim().toUpperCase();
  if (normalized === 'GET' || normalized === 'POST' || normalized === 'PUT' || normalized === 'PATCH' || normalized === 'DELETE') {
    return normalized;
  }
  return 'POST';
}

function normalizeToolStatus(value: string | null) {
  if (value === 'ACTIVE' || value === 'DISABLED') return value;
  return 'ACTIVE';
}

function normalizeHookMethod(value: string | null) {
  const normalized = normalizeOptionalText(value);
  return normalized ? normalized.toUpperCase() : 'ASYNC';
}

function normalizeHookStatus(value: string | null): PluginHookStatus {
  if (value === 'ACTIVE' || value === 'DISABLED' || value === 'DELETED') return value;
  return 'ACTIVE';
}

function normalizeMenuType(value: string | null) {
  const normalized = normalizeOptionalText(value)?.toUpperCase();
  if (normalized === 'DIRECTORY' || normalized === 'MENU' || normalized === 'BUTTON') {
    return normalized;
  }

  return 'MENU';
}

function normalizeToolAuthType(value: string | null) {
  const normalized = normalizeOptionalText(value)?.toUpperCase();
  if (
    normalized === 'NONE'
    || normalized === 'BEARER'
    || normalized === 'API_KEY_HEADER'
    || normalized === 'API_KEY_QUERY'
    || normalized === 'BASIC'
  ) {
    return normalized;
  }

  return 'NONE';
}

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';

  try {
    return new URL(trimmed).toString();
  } catch {
    return '';
  }
}

function normalizeNumber(value: unknown, fallback: number) {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function normalizeBoolean(value: unknown, fallback: boolean) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }

  return fallback;
}

function normalizeStringRecord(value: unknown): Record<string, string> | null {
  if (value === undefined || value === null) return null;
  if (!isPlainRecord(value)) {
    throw new BadRequestException('headers must be a JSON object');
  }

  const output: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry !== 'string') {
      throw new BadRequestException(`headers.${key} must be a string`);
    }
    output[key] = entry;
  }

  return output;
}

function getString(value: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const entry = value[key];
    if (typeof entry === 'string') {
      const trimmed = entry.trim();
      if (trimmed) return trimmed;
    }
  }

  return null;
}

function getRecord(value: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const entry = value[key];
    if (isPlainRecord(entry)) {
      return entry;
    }
  }

  return null;
}

function getManifestObjectArray(manifest: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = manifest[key];
    if (Array.isArray(value)) {
      return value.filter(isPlainRecord);
    }
  }

  return [];
}

function getStringArray(manifest: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = manifest[key];
    if (Array.isArray(value)) {
      return value
        .map((item) => (typeof item === 'string' ? item.trim() : null))
        .filter((item): item is string => Boolean(item));
    }
  }

  return [];
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)));
}

function defaultPermissiveObjectSchema() {
  return {
    type: 'object',
    additionalProperties: true,
  } as const;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
