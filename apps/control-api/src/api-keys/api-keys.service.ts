import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';

import type { CreateTenantApiKeyResult, TenantApiKeyListItem } from '@aiaget/shared-types';

import type { AuthenticatedUser } from '../common/types/request-context';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateApiKeyDto } from './dto/create-api-key.dto';

@Injectable()
export class ApiKeysService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async list(currentUser: AuthenticatedUser): Promise<TenantApiKeyListItem[]> {
    const keys = await this.prisma.apiKey.findMany({
      where: {
        tenantId: currentUser.tenantId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return keys.map((key) => this.mapKey(key));
  }

  async create(currentUser: AuthenticatedUser, dto: CreateApiKeyDto): Promise<CreateTenantApiKeyResult> {
    const plainTextToken = `ak_${randomUUID().replaceAll('-', '')}${randomUUID().replaceAll('-', '')}`;
    const allowedAgentIds = normalizeStringArray(dto.allowed_agent_ids);
    await this.ensureAgentsExist(currentUser.tenantId, allowedAgentIds);

    const key = await this.prisma.apiKey.create({
      data: {
        tenantId: currentUser.tenantId,
        name: dto.name.trim(),
        keyPrefix: plainTextToken.slice(0, 12),
        keyHash: hashToken(plainTextToken),
        status: 'ACTIVE',
        scopes: normalizeScopes(dto.scopes) as Prisma.InputJsonValue,
        allowedAgentIds: allowedAgentIds as Prisma.InputJsonValue,
        ipAllowlist: normalizeStringArray(dto.ip_allowlist) as Prisma.InputJsonValue,
        rateLimitPerMinute: dto.rate_limit_per_minute ?? 60,
        dailyQuota: dto.daily_quota ?? null,
        usedCountToday: 0,
        quotaResetDate: null,
        allowStream: dto.allow_stream ?? true,
        expiresAt: dto.expires_at ? new Date(dto.expires_at) : null,
        createdBy: currentUser.id,
        updatedBy: currentUser.id,
      },
    });

    return {
      api_key: plainTextToken,
      item: this.mapKey(key),
    };
  }

  async remove(currentUser: AuthenticatedUser, keyId: string): Promise<{ success: boolean }> {
    const key = await this.prisma.apiKey.findFirst({
      where: {
        id: keyId,
        tenantId: currentUser.tenantId,
        deletedAt: null,
      },
    });

    if (!key) {
      throw new NotFoundException('API key not found');
    }

    await this.prisma.apiKey.update({
      where: {
        id: keyId,
      },
      data: {
        status: 'DELETED',
        deletedAt: new Date(),
        updatedBy: currentUser.id,
      },
    });

    return { success: true };
  }

  private async ensureAgentsExist(tenantId: string, agentIds: string[]) {
    if (agentIds.length === 0) return;

    const count = await this.prisma.agent.count({
      where: {
        tenantId,
        id: {
          in: agentIds,
        },
        deletedAt: null,
      },
    });

    if (count !== agentIds.length) {
      throw new BadRequestException('Allowed agent list contains unavailable agents');
    }
  }

  private mapKey(key: {
    id: string;
    tenantId: string;
    name: string;
    keyPrefix: string;
    status: string;
    scopes: Prisma.JsonValue | null;
    allowedAgentIds: Prisma.JsonValue | null;
    ipAllowlist: Prisma.JsonValue | null;
    rateLimitPerMinute: number;
    dailyQuota: number | null;
    usedCountToday: number;
    quotaResetDate: Date | null;
    allowStream: boolean;
    expiresAt: Date | null;
    lastUsedAt: Date | null;
    createdAt: Date;
  }): TenantApiKeyListItem {
    return {
      id: key.id,
      tenant_id: key.tenantId,
      name: key.name,
      key_prefix: key.keyPrefix,
      masked_key: `${key.keyPrefix}****`,
      status: key.status as TenantApiKeyListItem['status'],
      scopes: parseStringArray(key.scopes),
      allowed_agent_ids: parseStringArray(key.allowedAgentIds),
      ip_allowlist: parseStringArray(key.ipAllowlist),
      rate_limit_per_minute: key.rateLimitPerMinute,
      daily_quota: key.dailyQuota,
      used_count_today: key.usedCountToday,
      quota_reset_date: key.quotaResetDate?.toISOString().slice(0, 10) ?? null,
      allow_stream: key.allowStream,
      expires_at: key.expiresAt?.toISOString() ?? null,
      last_used_at: key.lastUsedAt?.toISOString() ?? null,
      created_at: key.createdAt.toISOString(),
    };
  }
}

export function hashApiKeyToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function hashToken(token: string) {
  return hashApiKeyToken(token);
}

function normalizeScopes(value: string[] | undefined) {
  const scopes = normalizeStringArray(value);
  return scopes.length > 0 ? scopes : ['external:agent:chat'];
}

function normalizeStringArray(value: string[] | undefined | null) {
  return Array.from(new Set((value ?? []).map((item) => item.trim()).filter(Boolean)));
}

function parseStringArray(value: Prisma.JsonValue | null) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}
