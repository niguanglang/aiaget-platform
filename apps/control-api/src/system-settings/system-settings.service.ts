import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  SystemSettingCategory,
  SystemSettingItem,
  SystemSettingOption,
  SystemSettingOverview,
  SystemSettingValueType,
} from '@aiaget/shared-types';

import type { AuthenticatedUser } from '../common/types/request-context';
import { PrismaService } from '../prisma/prisma.service';
import type { ListSystemSettingsDto } from './dto/list-system-settings.dto';
import type { UpdateSystemSettingDto } from './dto/update-system-setting.dto';
import {
  DEFAULT_SYSTEM_SETTINGS,
  SYSTEM_SETTING_CATEGORY_LABELS,
  SYSTEM_SETTING_CATEGORIES,
  SYSTEM_SETTING_VALUE_TYPES,
} from './system-settings.constants';

const settingInclude = {
  updater: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.SystemSettingInclude;

type SystemSettingRecord = Prisma.SystemSettingGetPayload<{ include: typeof settingInclude }>;

@Injectable()
export class SystemSettingsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getOverview(currentUser: AuthenticatedUser): Promise<SystemSettingOverview> {
    await this.ensureDefaults(currentUser);
    const settings = await this.prisma.systemSetting.findMany({
      where: {
        tenantId: currentUser.tenantId,
        deletedAt: null,
      },
      orderBy: [
        {
          category: 'asc',
        },
        {
          sortOrder: 'asc',
        },
      ],
    });

    const categories = SYSTEM_SETTING_CATEGORIES.map((category) => {
      const categorySettings = settings.filter((setting) => setting.category === category);

      return {
        category,
        label: SYSTEM_SETTING_CATEGORY_LABELS[category],
        total: categorySettings.length,
        active: categorySettings.filter((setting) => setting.status === 'ACTIVE').length,
        changed: categorySettings.filter((setting) => !jsonEquals(setting.value, setting.defaultValue)).length,
      };
    });
    const lastUpdated = settings
      .map((setting) => setting.updatedAt)
      .sort((left, right) => right.getTime() - left.getTime())[0];

    return {
      total: settings.length,
      active: settings.filter((setting) => setting.status === 'ACTIVE').length,
      disabled: settings.filter((setting) => setting.status === 'DISABLED').length,
      secret: settings.filter((setting) => setting.isSecret).length,
      changed_from_default: settings.filter((setting) => !jsonEquals(setting.value, setting.defaultValue)).length,
      category_count: categories.filter((category) => category.total > 0).length,
      last_updated_at: lastUpdated?.toISOString() ?? null,
      categories,
    };
  }

  async list(currentUser: AuthenticatedUser, query: ListSystemSettingsDto): Promise<SystemSettingItem[]> {
    await this.ensureDefaults(currentUser);

    const settings = await this.prisma.systemSetting.findMany({
      where: {
        tenantId: currentUser.tenantId,
        deletedAt: null,
        category: query.category,
        status: query.status,
      },
      include: settingInclude,
      orderBy: [
        {
          category: 'asc',
        },
        {
          sortOrder: 'asc',
        },
        {
          createdAt: 'asc',
        },
      ],
    });

    return settings.map((setting) => this.mapSetting(setting));
  }

  async update(currentUser: AuthenticatedUser, id: string, dto: UpdateSystemSettingDto): Promise<SystemSettingItem> {
    const setting = await this.findSetting(currentUser.tenantId, id);
    const data: Prisma.SystemSettingUncheckedUpdateInput = {
      updatedBy: currentUser.id,
    };

    if (dto.value !== undefined) {
      data.value = this.normalizeValue(setting, dto.value);
    }

    if (dto.status !== undefined) {
      data.status = dto.status;
    }

    const updated = await this.prisma.systemSetting.update({
      where: {
        id,
      },
      data,
      include: settingInclude,
    });

    return this.mapSetting(updated);
  }

  async reset(currentUser: AuthenticatedUser, id: string): Promise<SystemSettingItem> {
    const setting = await this.findSetting(currentUser.tenantId, id);
    const updated = await this.prisma.systemSetting.update({
      where: {
        id,
      },
      data: {
        value: toJsonInput(setting.defaultValue),
        status: 'ACTIVE',
        updatedBy: currentUser.id,
      },
      include: settingInclude,
    });

    return this.mapSetting(updated);
  }

  private async ensureDefaults(currentUser: AuthenticatedUser) {
    for (const setting of DEFAULT_SYSTEM_SETTINGS) {
      await this.prisma.systemSetting.upsert({
        where: {
          tenantId_key: {
            tenantId: currentUser.tenantId,
            key: setting.key,
          },
        },
        create: {
          tenantId: currentUser.tenantId,
          category: setting.category,
          key: setting.key,
          name: setting.name,
          description: setting.description,
          value: setting.value,
          defaultValue: setting.defaultValue,
          valueType: setting.valueType,
          options: setting.options ?? Prisma.JsonNull,
          isSecret: setting.isSecret,
          isSystem: true,
          status: 'ACTIVE',
          sortOrder: setting.sortOrder,
          createdBy: currentUser.id,
          updatedBy: currentUser.id,
        },
        update: {
          category: setting.category,
          name: setting.name,
          description: setting.description,
          defaultValue: setting.defaultValue,
          valueType: setting.valueType,
          options: setting.options ?? Prisma.JsonNull,
          isSecret: setting.isSecret,
          isSystem: true,
          sortOrder: setting.sortOrder,
          deletedAt: null,
        },
      });
    }
  }

  private async findSetting(tenantId: string, id: string) {
    const setting = await this.prisma.systemSetting.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      include: settingInclude,
    });

    if (!setting) {
      throw new NotFoundException('System setting not found');
    }

    return setting;
  }

  private normalizeValue(
    setting: { valueType: string; options: Prisma.JsonValue | null },
    value: unknown,
  ): Prisma.InputJsonValue {
    if (!SYSTEM_SETTING_VALUE_TYPES.includes(setting.valueType as (typeof SYSTEM_SETTING_VALUE_TYPES)[number])) {
      throw new BadRequestException('Unsupported system setting value type');
    }

    if (setting.valueType === 'STRING') {
      if (typeof value !== 'string') {
        throw new BadRequestException('Setting value must be a string');
      }

      return toJsonInput(value);
    }

    if (setting.valueType === 'NUMBER') {
      const numberValue = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(numberValue)) {
        throw new BadRequestException('Setting value must be a number');
      }

      return toJsonInput(numberValue);
    }

    if (setting.valueType === 'BOOLEAN') {
      if (typeof value !== 'boolean') {
        throw new BadRequestException('Setting value must be a boolean');
      }

      return toJsonInput(value);
    }

    if (setting.valueType === 'SELECT') {
      const options = parseOptions(setting.options);
      if (options.length === 0) {
        throw new BadRequestException('Setting options are not configured');
      }

      const allowed = options.some((option) => option.value === value);
      if (!allowed) {
        throw new BadRequestException('Setting value is not in allowed options');
      }

      if (!isJsonPrimitive(value)) {
        throw new BadRequestException('Select setting value must be a JSON primitive');
      }

      return toJsonInput(value);
    }

    if (value === undefined || typeof value === 'function' || typeof value === 'symbol') {
      throw new BadRequestException('Setting value must be valid JSON');
    }

    return toJsonInput(value);
  }

  private mapSetting(setting: SystemSettingRecord): SystemSettingItem {
    return {
      id: setting.id,
      tenant_id: setting.tenantId,
      category: setting.category as SystemSettingCategory,
      key: setting.key,
      name: setting.name,
      description: setting.description,
      value: setting.value,
      default_value: setting.defaultValue,
      value_type: setting.valueType as SystemSettingValueType,
      options: parseOptions(setting.options),
      is_secret: setting.isSecret,
      is_system: setting.isSystem,
      status: setting.status as SystemSettingItem['status'],
      sort_order: setting.sortOrder,
      updated_at: setting.updatedAt.toISOString(),
      updated_by: setting.updater
        ? {
            id: setting.updater.id,
            name: setting.updater.name,
            email: setting.updater.email,
          }
        : null,
    };
  }
}

function parseOptions(value: Prisma.JsonValue | null): SystemSettingOption[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((option) => {
    if (!option || typeof option !== 'object' || Array.isArray(option)) return [];
    if (!('label' in option) || !('value' in option)) return [];
    if (typeof option.label !== 'string' || !isJsonPrimitive(option.value)) return [];

    return [
      {
        label: option.label,
        value: option.value,
      },
    ];
  });
}

function isJsonPrimitive(value: unknown): value is string | number | boolean {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

function jsonEquals(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function toJsonInput(value: unknown): Prisma.InputJsonValue {
  if (value === null || value === undefined || typeof value === 'function' || typeof value === 'symbol') {
    throw new BadRequestException('Setting value must be valid JSON');
  }

  return value as Prisma.InputJsonValue;
}
