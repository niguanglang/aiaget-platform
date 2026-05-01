import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { hash } from 'bcryptjs';

import type {
  PaginatedResult,
  DepartmentSummary,
  UserListItem,
} from '@aiaget/shared-types';

import type { AuthenticatedUser } from '../common/types/request-context';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateUserDto } from './dto/create-user.dto';
import type { ListUsersDto } from './dto/list-users.dto';
import type { UpdateUserDto } from './dto/update-user.dto';

type UserWithRoles = Prisma.UserGetPayload<{
  include: {
    department: true;
    userRoles: {
      include: {
        role: true;
      };
    };
  };
}>;

@Injectable()
export class UsersService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async list(
    currentUser: AuthenticatedUser,
    query: ListUsersDto,
  ): Promise<PaginatedResult<UserListItem>> {
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.page_size ?? 20);
    const keyword = query.keyword?.trim();
    const where: Prisma.UserWhereInput = {
      tenantId: currentUser.tenantId,
      deletedAt: query.status === 'DELETED' ? { not: null } : null,
    };

    if (query.status && query.status !== 'DELETED') {
      where.status = query.status;
    }

    if (query.department_id) {
      where.departmentId = query.department_id;
    }

    if (keyword) {
      where.OR = [
        {
          email: {
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
      this.prisma.user.findMany({
        where,
        orderBy: {
          updatedAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          department: true,
          userRoles: {
            where: {
              deletedAt: null,
            },
            include: {
              role: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: items.map((user) => this.mapUser(user)),
      page,
      page_size: pageSize,
      total,
    };
  }

  async create(currentUser: AuthenticatedUser, dto: CreateUserDto): Promise<UserListItem> {
    const roleCodes = dto.roleCodes && dto.roleCodes.length > 0 ? dto.roleCodes : ['tenant_viewer'];
    const roles = await this.findRoles(currentUser.tenantId, roleCodes);
    const departmentId = await this.resolveDepartmentId(currentUser.tenantId, dto.department_id);

    try {
      const createdUser = await this.prisma.user.create({
        data: {
          tenantId: currentUser.tenantId,
          departmentId,
          email: dto.email.trim().toLowerCase(),
          name: dto.name.trim(),
          passwordHash: await hash(dto.password, 12),
          status: dto.status ?? 'ACTIVE',
          createdBy: currentUser.id,
          updatedBy: currentUser.id,
          userRoles: {
            createMany: {
              data: roles.map((role) => ({
                tenantId: currentUser.tenantId,
                roleId: role.id,
                createdBy: currentUser.id,
                updatedBy: currentUser.id,
              })),
            },
          },
        },
        include: {
          department: true,
          userRoles: {
            where: {
              deletedAt: null,
            },
            include: {
              role: true,
            },
          },
        },
      });

      return this.mapUser(createdUser);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('A user with this email already exists in the tenant');
      }

      throw error;
    }
  }

  async update(
    currentUser: AuthenticatedUser,
    userId: string,
    dto: UpdateUserDto,
  ): Promise<UserListItem> {
    await this.ensureUser(currentUser.tenantId, userId);
    const data: Prisma.UserUpdateInput = {
      updatedBy: currentUser.id,
    };

    if (dto.name !== undefined) {
      data.name = dto.name.trim();
    }

    if (dto.status !== undefined) {
      data.status = dto.status;
    }

    if (dto.department_id !== undefined) {
      const departmentId = await this.resolveDepartmentId(currentUser.tenantId, dto.department_id);
      data.department = departmentId
        ? {
            connect: {
              id: departmentId,
            },
          }
        : {
            disconnect: true,
          };
    }

    if (dto.password !== undefined) {
      data.passwordHash = await hash(dto.password, 12);
    }

    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data,
    });

    if (dto.roleCodes !== undefined) {
      const roles = await this.findRoles(currentUser.tenantId, dto.roleCodes);

      await this.prisma.$transaction([
        this.prisma.userRole.deleteMany({
          where: {
            tenantId: currentUser.tenantId,
            userId,
          },
        }),
        this.prisma.userRole.createMany({
          data: roles.map((role) => ({
            tenantId: currentUser.tenantId,
            userId,
            roleId: role.id,
            createdBy: currentUser.id,
            updatedBy: currentUser.id,
          })),
          skipDuplicates: true,
        }),
      ]);
    }

    const updatedUser = await this.ensureUser(currentUser.tenantId, userId);

    return this.mapUser(updatedUser);
  }

  async remove(currentUser: AuthenticatedUser, userId: string): Promise<{ success: boolean }> {
    if (currentUser.id === userId) {
      throw new BadRequestException('Current user cannot delete themselves');
    }

    await this.ensureUser(currentUser.tenantId, userId);
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        status: 'DELETED',
        deletedAt: new Date(),
        updatedBy: currentUser.id,
      },
    });

    return {
      success: true,
    };
  }

  private async ensureUser(tenantId: string, userId: string): Promise<UserWithRoles> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        tenantId,
        deletedAt: null,
      },
      include: {
        department: true,
        userRoles: {
          where: {
            deletedAt: null,
          },
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private async findRoles(tenantId: string, roleCodes: string[]) {
    const roles = await this.prisma.role.findMany({
      where: {
        tenantId,
        code: {
          in: roleCodes,
        },
        deletedAt: null,
      },
    });

    if (roles.length !== roleCodes.length) {
      throw new BadRequestException('One or more roles do not exist in the tenant');
    }

    return roles;
  }

  private async resolveDepartmentId(tenantId: string, departmentId: string | null | undefined) {
    const normalizedDepartmentId = normalizeNullable(departmentId);
    if (!normalizedDepartmentId) return null;

    const department = await this.prisma.department.findFirst({
      where: {
        tenantId,
        id: normalizedDepartmentId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!department) {
      throw new BadRequestException('Department does not exist in the tenant');
    }

    return department.id;
  }

  private mapUser(user: UserWithRoles): UserListItem {
    return {
      id: user.id,
      tenant_id: user.tenantId,
      department_id: user.departmentId,
      email: user.email,
      name: user.name,
      status: user.status as UserListItem['status'],
      department: user.department
        ? {
            id: user.department.id,
            code: user.department.code,
            name: user.department.name,
            status: user.department.status as DepartmentSummary['status'],
          }
        : null,
      roles: user.userRoles.map((userRole) => ({
        id: userRole.role.id,
        code: userRole.role.code,
        name: userRole.role.name,
      })),
      last_login_at: user.lastLoginAt?.toISOString() ?? null,
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString(),
    };
  }
}

function normalizeNullable(value: string | null | undefined) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}
