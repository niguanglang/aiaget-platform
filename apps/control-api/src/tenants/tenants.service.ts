import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type { PaginatedResult, TenantDetail, TenantListItem } from '@aiaget/shared-types';

import type { AuthenticatedUser } from '../common/types/request-context';
import { PrismaService } from '../prisma/prisma.service';
import type { ListTenantsDto } from './dto/list-tenants.dto';
import type { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async list(
    currentUser: AuthenticatedUser,
    query: ListTenantsDto,
  ): Promise<PaginatedResult<TenantListItem>> {
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.page_size ?? 20);
    const keyword = query.keyword?.trim();
    const where: Prisma.TenantWhereInput = {
      id: currentUser.tenantId,
      deletedAt: query.status === 'DELETED' ? { not: null } : null,
    };

    if (query.status && query.status !== 'DELETED') {
      where.status = query.status;
    }

    if (keyword) {
      where.OR = [
        {
          code: {
            contains: keyword,
            mode: 'insensitive',
          },
        },
        {
          name: {
            contains: keyword,
            mode: 'insensitive',
          },
        },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.tenant.findMany({
        where,
        orderBy: {
          updatedAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return {
      items: items.map((tenant) => this.mapTenant(tenant)),
      page,
      page_size: pageSize,
      total,
    };
  }

  async get(currentUser: AuthenticatedUser, tenantId: string): Promise<TenantDetail> {
    const tenant = await this.ensureTenant(currentUser.tenantId, tenantId);
    return this.mapTenant(tenant);
  }

  async update(currentUser: AuthenticatedUser, tenantId: string, dto: UpdateTenantDto): Promise<TenantDetail> {
    await this.ensureTenant(currentUser.tenantId, tenantId);

    const tenant = await this.prisma.tenant.update({
      where: {
        id: tenantId,
      },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        updatedBy: currentUser.id,
      },
    });

    return this.mapTenant(tenant);
  }

  private async ensureTenant(currentTenantId: string, tenantId: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: {
        id: tenantId,
        deletedAt: null,
      },
    });

    if (!tenant || tenant.id !== currentTenantId) {
      throw new BadRequestException('Tenant not found in current context');
    }

    return tenant;
  }

  private mapTenant(tenant: { id: string; code: string; name: string; status: string; createdAt: Date; updatedAt: Date }): TenantDetail {
    return {
      id: tenant.id,
      code: tenant.code,
      name: tenant.name,
      status: tenant.status as TenantDetail['status'],
      created_at: tenant.createdAt.toISOString(),
      updated_at: tenant.updatedAt.toISOString(),
    };
  }
}
