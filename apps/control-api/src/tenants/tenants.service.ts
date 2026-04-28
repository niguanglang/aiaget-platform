import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type { PaginatedResult, TenantListItem } from '@aiaget/shared-types';

import type { AuthenticatedUser } from '../common/types/request-context';
import { PrismaService } from '../prisma/prisma.service';
import type { ListTenantsDto } from './dto/list-tenants.dto';

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
      items: items.map((tenant) => ({
        id: tenant.id,
        code: tenant.code,
        name: tenant.name,
        status: tenant.status as TenantListItem['status'],
        created_at: tenant.createdAt.toISOString(),
        updated_at: tenant.updatedAt.toISOString(),
      })),
      page,
      page_size: pageSize,
      total,
    };
  }
}
