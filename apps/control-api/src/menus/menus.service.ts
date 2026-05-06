import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  AuthorizedMenuItem,
  MenuDetail,
  MenuListItem,
  MenuOverview,
  MenuRoleBindingItem,
  MenuTreeItem,
  PaginatedResult,
} from '@aiaget/shared-types';
import { expandPermissionCodes } from '@aiaget/shared-types';

import type { AuthenticatedUser } from '../common/types/request-context';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateMenuDto } from './dto/create-menu.dto';
import type { ListMenusDto } from './dto/list-menus.dto';
import type { UpdateMenuRoleBindingDto } from './dto/update-menu-role-binding.dto';
import type { UpdateMenuDto } from './dto/update-menu.dto';

const menuInclude = {
  parent: true,
  children: {
    where: {
      deletedAt: null,
    },
  },
  roleMenus: {
    where: {
      deletedAt: null,
    },
    include: {
      role: true,
    },
  },
} satisfies Prisma.MenuInclude;

type MenuRecord = Prisma.MenuGetPayload<{ include: typeof menuInclude }>;
const DEFAULT_MAX_MENU_LEVEL = 6;
const MAX_MENU_LEVEL = readMaxMenuLevel();

@Injectable()
export class MenusService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getAuthorizedMenuTree(currentUser: AuthenticatedUser): Promise<AuthorizedMenuItem[]> {
    const menus = await this.loadAuthorizedMenus(currentUser.tenantId, currentUser.roles, currentUser.permissions);

    return buildAuthorizedTree(menus);
  }

  async getOverview(currentUser: AuthenticatedUser): Promise<MenuOverview> {
    const menus = await this.prisma.menu.findMany({
      where: {
        tenantId: currentUser.tenantId,
        deletedAt: null,
      },
      select: {
        type: true,
        visible: true,
        enabled: true,
      },
    });

    return {
      total: menus.length,
      directory_count: menus.filter((menu) => menu.type === 'DIRECTORY').length,
      menu_count: menus.filter((menu) => menu.type === 'MENU').length,
      button_count: menus.filter((menu) => menu.type === 'BUTTON').length,
      hidden_count: menus.filter((menu) => !menu.visible).length,
      disabled_count: menus.filter((menu) => !menu.enabled).length,
    };
  }

  async list(currentUser: AuthenticatedUser, query: ListMenusDto): Promise<PaginatedResult<MenuListItem>> {
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.page_size ?? 100);
    const where = this.buildWhere(currentUser.tenantId, query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.menu.findMany({
        where,
        include: menuInclude,
        orderBy: [
          {
            sortOrder: 'asc',
          },
          {
            createdAt: 'asc',
          },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.menu.count({ where }),
    ]);
    const allMenus = await this.loadAllMenus(currentUser.tenantId);
    const levelMap = buildLevelMap(allMenus);

    return {
      items: items.map((menu) => this.mapMenuListItem(menu, levelMap.get(menu.id) ?? 1)),
      page,
      page_size: pageSize,
      total,
    };
  }

  async tree(currentUser: AuthenticatedUser): Promise<MenuTreeItem[]> {
    const menus = await this.loadAllMenus(currentUser.tenantId);
    const levelMap = buildLevelMap(menus);

    return buildTree(menus.map((menu) => this.mapMenuListItem(menu, levelMap.get(menu.id) ?? 1)));
  }

  async create(currentUser: AuthenticatedUser, dto: CreateMenuDto): Promise<MenuDetail> {
    await this.ensureParent(currentUser.tenantId, dto.parent_id ?? null, null);

    try {
      const menu = await this.prisma.menu.create({
        data: {
          tenantId: currentUser.tenantId,
          parentId: normalizeNullable(dto.parent_id),
          name: dto.name.trim(),
          code: dto.code.trim(),
          type: dto.type,
          path: normalizeNullable(dto.path),
          component: normalizeNullable(dto.component),
          icon: normalizeNullable(dto.icon),
          permissionCode: normalizeNullable(dto.permission_code),
          sortOrder: dto.sort_order ?? 0,
          visible: dto.visible ?? true,
          enabled: dto.enabled ?? true,
          createdBy: currentUser.id,
          updatedBy: currentUser.id,
        },
        include: menuInclude,
      });

      return this.detailFromRecord(currentUser.tenantId, menu);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('A menu with this code already exists in the tenant');
      }

      throw error;
    }
  }

  async get(currentUser: AuthenticatedUser, id: string): Promise<MenuDetail> {
    const menu = await this.findMenu(currentUser.tenantId, id);

    return this.detailFromRecord(currentUser.tenantId, menu);
  }

  async update(currentUser: AuthenticatedUser, id: string, dto: UpdateMenuDto): Promise<MenuDetail> {
    await this.ensureMenu(currentUser.tenantId, id);
    if (dto.parent_id !== undefined) {
      await this.ensureParent(currentUser.tenantId, dto.parent_id, id);
    }

    const data: Prisma.MenuUncheckedUpdateInput = {
      updatedBy: currentUser.id,
    };

    if (dto.parent_id !== undefined) data.parentId = normalizeNullable(dto.parent_id);
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.path !== undefined) data.path = normalizeNullable(dto.path);
    if (dto.component !== undefined) data.component = normalizeNullable(dto.component);
    if (dto.icon !== undefined) data.icon = normalizeNullable(dto.icon);
    if (dto.permission_code !== undefined) data.permissionCode = normalizeNullable(dto.permission_code);
    if (dto.sort_order !== undefined) data.sortOrder = dto.sort_order;
    if (dto.visible !== undefined) data.visible = dto.visible;
    if (dto.enabled !== undefined) data.enabled = dto.enabled;

    const menu = await this.prisma.menu.update({
      where: {
        id,
      },
      data,
      include: menuInclude,
    });

    return this.detailFromRecord(currentUser.tenantId, menu);
  }

  async remove(currentUser: AuthenticatedUser, id: string): Promise<{ success: boolean }> {
    const menu = await this.findMenu(currentUser.tenantId, id);
    if (menu.children.length > 0) {
      throw new BadRequestException('Menu with child nodes cannot be deleted');
    }

    const [roleBindingCount, pluginMenuBindingCount] = await this.prisma.$transaction([
      this.prisma.roleMenu.count({
        where: {
          tenantId: currentUser.tenantId,
          menuId: id,
          deletedAt: null,
        },
      }),
      this.prisma.pluginMenuBinding.count({
        where: {
          tenantId: currentUser.tenantId,
          menuId: id,
          deletedAt: null,
        },
      }),
    ]);

    if (roleBindingCount > 0 || pluginMenuBindingCount > 0) {
      throw new BadRequestException(
        `菜单仍存在依赖，不能删除。请先解除角色绑定 ${roleBindingCount} 个、插件菜单绑定 ${pluginMenuBindingCount} 个。`,
      );
    }

    await this.prisma.menu.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
        enabled: false,
        updatedBy: currentUser.id,
      },
    });

    return { success: true };
  }

  async setEnabled(currentUser: AuthenticatedUser, id: string, enabled: boolean): Promise<MenuDetail> {
    await this.ensureMenu(currentUser.tenantId, id);
    const menu = await this.prisma.menu.update({
      where: {
        id,
      },
      data: {
        enabled,
        updatedBy: currentUser.id,
      },
      include: menuInclude,
    });

    return this.detailFromRecord(currentUser.tenantId, menu);
  }

  async listRoleBindings(currentUser: AuthenticatedUser): Promise<MenuRoleBindingItem[]> {
    const roles = await this.prisma.role.findMany({
      where: {
        tenantId: currentUser.tenantId,
        deletedAt: null,
      },
      include: {
        roleMenus: {
          where: {
            deletedAt: null,
            menu: {
              deletedAt: null,
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return roles.map((role) => ({
      role_id: role.id,
      role_code: role.code,
      role_name: role.name,
      menu_ids: role.roleMenus.map((roleMenu) => roleMenu.menuId),
    }));
  }

  async updateRoleBinding(
    currentUser: AuthenticatedUser,
    roleId: string,
    dto: UpdateMenuRoleBindingDto,
  ): Promise<MenuRoleBindingItem> {
    const role = await this.prisma.role.findFirst({
      where: {
        tenantId: currentUser.tenantId,
        id: roleId,
        deletedAt: null,
      },
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const menus = await this.prisma.menu.findMany({
      where: {
        tenantId: currentUser.tenantId,
        id: {
          in: dto.menu_ids,
        },
        deletedAt: null,
      },
    });

    if (menus.length !== dto.menu_ids.length) {
      throw new BadRequestException('Some menu ids are invalid');
    }

    await this.prisma.$transaction([
      this.prisma.roleMenu.updateMany({
        where: {
          tenantId: currentUser.tenantId,
          roleId,
          deletedAt: null,
          menuId: {
            notIn: dto.menu_ids,
          },
        },
        data: {
          deletedAt: new Date(),
          updatedBy: currentUser.id,
        },
      }),
      ...dto.menu_ids.map((menuId) =>
        this.prisma.roleMenu.upsert({
          where: {
            tenantId_roleId_menuId: {
              tenantId: currentUser.tenantId,
              roleId,
              menuId,
            },
          },
          create: {
            tenantId: currentUser.tenantId,
            roleId,
            menuId,
            createdBy: currentUser.id,
            updatedBy: currentUser.id,
          },
          update: {
            deletedAt: null,
            updatedBy: currentUser.id,
          },
        }),
      ),
    ]);

    const roleMenus = await this.prisma.roleMenu.findMany({
      where: {
        tenantId: currentUser.tenantId,
        roleId,
        deletedAt: null,
      },
    });

    return {
      role_id: role.id,
      role_code: role.code,
      role_name: role.name,
      menu_ids: roleMenus.map((roleMenu) => roleMenu.menuId),
    };
  }

  private buildWhere(tenantId: string, query: ListMenusDto): Prisma.MenuWhereInput {
    const keyword = query.keyword?.trim();
    const where: Prisma.MenuWhereInput = {
      tenantId,
      deletedAt: null,
    };

    if (query.type) where.type = query.type;
    if (query.status === 'ENABLED') where.enabled = true;
    if (query.status === 'DISABLED') where.enabled = false;
    if (query.visible !== undefined) where.visible = query.visible;

    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { code: { contains: keyword, mode: 'insensitive' } },
        { path: { contains: keyword, mode: 'insensitive' } },
        { permissionCode: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private async loadAllMenus(tenantId: string): Promise<MenuRecord[]> {
    return this.prisma.menu.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      include: menuInclude,
      orderBy: [
        {
          sortOrder: 'asc',
        },
        {
          createdAt: 'asc',
        },
      ],
    });
  }

  private async loadAuthorizedMenus(tenantId: string, roles: string[], permissions: string[]): Promise<MenuRecord[]> {
    const expandedPermissions = expandPermissionCodes(permissions);

    if (roles.includes('tenant_admin')) {
      return this.prisma.menu.findMany({
        where: {
          tenantId,
          enabled: true,
          visible: true,
          deletedAt: null,
          type: {
            not: 'BUTTON',
          },
        },
        include: menuInclude,
        orderBy: [
          {
            sortOrder: 'asc',
          },
          {
            createdAt: 'asc',
          },
        ],
      });
    }

    return this.prisma.menu.findMany({
      where: {
        tenantId,
        enabled: true,
        visible: true,
        deletedAt: null,
        type: {
          not: 'BUTTON',
        },
        roleMenus: {
          some: {
            deletedAt: null,
            role: {
              code: {
                in: roles,
              },
              deletedAt: null,
            },
          },
        },
        OR: [
          {
            permissionCode: null,
          },
          {
            permissionCode: {
              in: expandedPermissions,
            },
          },
        ],
      },
      include: menuInclude,
      orderBy: [
        {
          sortOrder: 'asc',
        },
        {
          createdAt: 'asc',
        },
      ],
    });
  }

  private async ensureMenu(tenantId: string, id: string) {
    const menu = await this.prisma.menu.findFirst({
      where: {
        tenantId,
        id,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!menu) {
      throw new NotFoundException('Menu not found');
    }
  }

  private async findMenu(tenantId: string, id: string): Promise<MenuRecord> {
    const menu = await this.prisma.menu.findFirst({
      where: {
        tenantId,
        id,
        deletedAt: null,
      },
      include: menuInclude,
    });

    if (!menu) {
      throw new NotFoundException('Menu not found');
    }

    return menu;
  }

  private async ensureParent(tenantId: string, parentId: string | null | undefined, currentMenuId: string | null) {
    const normalizedParentId = normalizeNullable(parentId);
    if (!normalizedParentId) return;
    if (currentMenuId && normalizedParentId === currentMenuId) {
      throw new BadRequestException('Menu cannot be its own parent');
    }

    const parent = await this.prisma.menu.findFirst({
      where: {
        tenantId,
        id: normalizedParentId,
        deletedAt: null,
      },
      select: {
        id: true,
        type: true,
      },
    });

    if (!parent) {
      throw new BadRequestException('Parent menu does not exist');
    }

    if (parent.type === 'BUTTON') {
      throw new BadRequestException('Button menu cannot be parent');
    }

    const menus = await this.loadAllMenus(tenantId);
    const childrenByParent = new Map<string, MenuRecord[]>();
    for (const menu of menus) {
      if (!menu.parentId) continue;
      childrenByParent.set(menu.parentId, [...(childrenByParent.get(menu.parentId) ?? []), menu]);
    }

    if (currentMenuId && hasDescendant(currentMenuId, normalizedParentId, childrenByParent)) {
      throw new BadRequestException('Menu cannot be moved below its own child node');
    }

    const parentLevel = buildLevelMap(menus).get(normalizedParentId) ?? 1;
    const subtreeDepth = currentMenuId ? calculateSubtreeDepth(currentMenuId, childrenByParent) : 1;
    if (parentLevel + subtreeDepth > MAX_MENU_LEVEL) {
      throw new BadRequestException(`Menu tree supports at most ${MAX_MENU_LEVEL} levels`);
    }
  }

  private async detailFromRecord(tenantId: string, menu: MenuRecord): Promise<MenuDetail> {
    const allMenus = await this.loadAllMenus(tenantId);
    const levelMap = buildLevelMap(allMenus);
    const childLevel = (levelMap.get(menu.id) ?? 1) + 1;
    const children = allMenus.filter((candidate) => candidate.parentId === menu.id);

    return {
      ...this.mapMenuListItem(menu, levelMap.get(menu.id) ?? 1),
      children: children.map((child) => this.mapMenuListItem(child, childLevel)),
      role_bindings: menu.roleMenus.map((roleMenu) => ({
        role_id: roleMenu.roleId,
        role_code: roleMenu.role.code,
        role_name: roleMenu.role.name,
      })),
    };
  }

  private mapMenuListItem(menu: MenuRecord, level: number): MenuListItem {
    return {
      id: menu.id,
      tenant_id: menu.tenantId,
      parent_id: menu.parentId,
      parent_name: menu.parent?.name ?? null,
      name: menu.name,
      code: menu.code,
      type: menu.type as MenuListItem['type'],
      path: menu.path,
      component: menu.component,
      icon: menu.icon,
      permission_code: menu.permissionCode,
      sort_order: menu.sortOrder,
      level,
      visible: menu.visible,
      enabled: menu.enabled,
      child_count: menu.children.length,
      role_count: menu.roleMenus.length,
      created_at: menu.createdAt.toISOString(),
      updated_at: menu.updatedAt.toISOString(),
    };
  }
}

function normalizeNullable(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function buildTree(items: MenuListItem[]): MenuTreeItem[] {
  const nodeMap = new Map<string, MenuTreeItem>();
  const roots: MenuTreeItem[] = [];

  for (const item of items) {
    nodeMap.set(item.id, {
      ...item,
      children: [],
    });
  }

  for (const item of items) {
    const node = nodeMap.get(item.id);
    if (!node) continue;
    const parent = item.parent_id ? nodeMap.get(item.parent_id) : null;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

function buildAuthorizedTree(items: MenuRecord[]): AuthorizedMenuItem[] {
  const nodeMap = new Map<string, AuthorizedMenuItem>();
  const roots: AuthorizedMenuItem[] = [];

  for (const item of items) {
    nodeMap.set(item.id, {
      id: item.id,
      parent_id: item.parentId,
      name: item.name,
      code: item.code,
      type: item.type as AuthorizedMenuItem['type'],
      path: item.path,
      icon: item.icon,
      permission_code: item.permissionCode,
      sort_order: item.sortOrder,
      children: [],
    });
  }

  for (const item of items) {
    const node = nodeMap.get(item.id);
    if (!node) continue;
    const parent = item.parentId ? nodeMap.get(item.parentId) : null;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

function buildLevelMap(menus: MenuRecord[]) {
  const byId = new Map(menus.map((menu) => [menu.id, menu]));
  const output = new Map<string, number>();

  for (const menu of menus) {
    output.set(menu.id, calculateLevel(menu, byId));
  }

  return output;
}

function calculateLevel(menu: MenuRecord, byId: Map<string, MenuRecord>) {
  let level = 1;
  let parentId = menu.parentId;

  while (parentId) {
    const parent = byId.get(parentId);
    if (!parent) break;
    level += 1;
    parentId = parent.parentId;
  }

  return level;
}

function hasDescendant(
  ancestorId: string,
  targetId: string,
  childrenByParent: Map<string, MenuRecord[]>,
): boolean {
  const children = childrenByParent.get(ancestorId) ?? [];
  for (const child of children) {
    if (child.id === targetId || hasDescendant(child.id, targetId, childrenByParent)) {
      return true;
    }
  }

  return false;
}

function calculateSubtreeDepth(menuId: string, childrenByParent: Map<string, MenuRecord[]>): number {
  const children = childrenByParent.get(menuId) ?? [];
  if (children.length === 0) return 1;

  return 1 + Math.max(...children.map((child) => calculateSubtreeDepth(child.id, childrenByParent)));
}

function readMaxMenuLevel() {
  const value = Number(process.env.MAX_MENU_LEVEL ?? DEFAULT_MAX_MENU_LEVEL);
  if (!Number.isFinite(value)) return DEFAULT_MAX_MENU_LEVEL;

  return Math.max(4, Math.floor(value));
}
