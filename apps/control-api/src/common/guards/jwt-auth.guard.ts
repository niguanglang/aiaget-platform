import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { PrismaService } from '../../prisma/prisma.service';
import type { RequestWithContext } from '../types/request-context';

interface AccessTokenPayload {
  sub: string;
  tenant_id: string;
  email: string;
}

function getAccessTokenSecret() {
  return process.env.JWT_ACCESS_TOKEN_SECRET ?? 'dev-access-token-secret';
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(JwtService)
    private readonly jwtService: JwtService,
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithContext>();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = authorization.slice('Bearer '.length);

    try {
      const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token, {
        secret: getAccessTokenSecret(),
      });
      const user = await this.prisma.user.findFirst({
        where: {
          id: payload.sub,
          tenantId: payload.tenant_id,
          status: 'ACTIVE',
          deletedAt: null,
        },
        include: {
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
        },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid token user');
      }

      const roles = user.userRoles.map((userRole) => userRole.role.code);
      const permissions = Array.from(
        new Set(
          user.userRoles.flatMap((userRole) =>
            userRole.role.rolePermissions.map((rolePermission) => rolePermission.permission.code),
          ),
        ),
      );

      request.user = {
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        roles,
        permissions,
      };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
