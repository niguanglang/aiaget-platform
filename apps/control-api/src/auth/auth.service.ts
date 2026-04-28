import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { compare } from 'bcryptjs';
import { createHash, randomUUID } from 'node:crypto';

import type { CurrentUserResponse, LoginResponse } from '@aiaget/shared-types';

import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../common/types/request-context';
import type { LoginDto } from './dto/login.dto';

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_DAYS = 7;

type UserWithAuthRelations = Prisma.UserGetPayload<{
  include: {
    tenant: true;
    userRoles: {
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true;
              };
            };
          };
        };
      };
    };
  };
}>;

interface RequestMetadata {
  ip?: string;
  userAgent?: string;
}

function getAccessTokenSecret() {
  return process.env.JWT_ACCESS_TOKEN_SECRET ?? 'dev-access-token-secret';
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(JwtService)
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto, metadata: RequestMetadata): Promise<LoginResponse> {
    const tenantCode = dto.tenantCode?.trim() || 'default';
    const email = dto.email.trim().toLowerCase();
    const tenant = await this.prisma.tenant.findFirst({
      where: {
        code: tenantCode,
        status: 'ACTIVE',
        deletedAt: null,
      },
    });

    if (!tenant) {
      throw new UnauthorizedException('Invalid tenant or credentials');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        tenantId: tenant.id,
        email,
        deletedAt: null,
      },
      include: this.authUserInclude(),
    });

    if (!user || !(await compare(dto.password, user.passwordHash))) {
      await this.writeLoginLog(tenant.id, null, email, 'FAILED', metadata, 'Invalid credentials');
      throw new UnauthorizedException('Invalid tenant or credentials');
    }

    if (user.status !== 'ACTIVE') {
      await this.writeLoginLog(tenant.id, user.id, email, 'FAILED', metadata, 'User is disabled');
      throw new UnauthorizedException('User is disabled');
    }

    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        lastLoginAt: new Date(),
      },
    });
    await this.writeLoginLog(tenant.id, user.id, email, 'SUCCESS', metadata);

    return this.issueTokens(user);
  }

  async me(currentUser: AuthenticatedUser): Promise<CurrentUserResponse> {
    const user = await this.findActiveUser(currentUser.id, currentUser.tenantId);

    return this.mapCurrentUser(user);
  }

  async refresh(refreshToken: string): Promise<LoginResponse> {
    const tokenHash = hashToken(refreshToken);
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: {
        tokenHash,
      },
      include: {
        user: {
          include: this.authUserInclude(),
        },
      },
    });

    if (
      !storedToken ||
      storedToken.revokedAt ||
      storedToken.expiresAt.getTime() <= Date.now() ||
      storedToken.user.deletedAt ||
      storedToken.user.status !== 'ACTIVE'
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.update({
      where: {
        id: storedToken.id,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return this.issueTokens(storedToken.user);
  }

  async logout(currentUser: AuthenticatedUser, refreshToken?: string) {
    if (!refreshToken) {
      return {
        success: true,
      };
    }

    await this.prisma.refreshToken.updateMany({
      where: {
        tenantId: currentUser.tenantId,
        userId: currentUser.id,
        tokenHash: hashToken(refreshToken),
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return {
      success: true,
    };
  }

  private async issueTokens(user: UserWithAuthRelations): Promise<LoginResponse> {
    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        tenant_id: user.tenantId,
        email: user.email,
      },
      {
        secret: getAccessTokenSecret(),
        expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      },
    );
    const refreshToken = `rft_${randomUUID()}_${randomUUID()}`;

    await this.prisma.refreshToken.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      currentUser: this.mapCurrentUser(user),
    };
  }

  private async findActiveUser(userId: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        tenantId,
        status: 'ACTIVE',
        deletedAt: null,
      },
      include: this.authUserInclude(),
    });

    if (!user) {
      throw new BadRequestException('Current user is not active');
    }

    return user;
  }

  private mapCurrentUser(user: UserWithAuthRelations): CurrentUserResponse {
    const roles = user.userRoles.map((userRole) => ({
      id: userRole.role.id,
      code: userRole.role.code,
      name: userRole.role.name,
    }));
    const permissions = Array.from(
      new Set(
        user.userRoles.flatMap((userRole) =>
          userRole.role.rolePermissions.map((rolePermission) => rolePermission.permission.code),
        ),
      ),
    );

    return {
      tenant: {
        id: user.tenant.id,
        code: user.tenant.code,
        name: user.tenant.name,
        status: user.tenant.status as CurrentUserResponse['tenant']['status'],
      },
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status as CurrentUserResponse['user']['status'],
        roles,
        permissions,
      },
    };
  }

  private authUserInclude() {
    return {
      tenant: true,
      userRoles: {
        where: {
          deletedAt: null,
        },
        include: {
          role: {
            include: {
              rolePermissions: {
                where: {
                  deletedAt: null,
                },
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    } satisfies Prisma.UserInclude;
  }

  private async writeLoginLog(
    tenantId: string,
    userId: string | null,
    email: string,
    status: 'SUCCESS' | 'FAILED',
    metadata: RequestMetadata,
    errorMessage?: string,
  ) {
    await this.prisma.loginLog.create({
      data: {
        tenantId,
        userId,
        email,
        status,
        ip: metadata.ip,
        userAgent: metadata.userAgent,
        errorMessage,
      },
    });
  }
}
