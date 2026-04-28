import { Body, Controller, Get, Inject, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import type { CurrentUserResponse, LoginResponse } from '@aiaget/shared-types';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthenticatedUser, RequestWithContext } from '../common/types/request-context';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post('login')
  @ApiOkResponse({ description: 'Login with tenant code, email, and password' })
  async login(@Body() dto: LoginDto, @Req() request: RequestWithContext): Promise<LoginResponse> {
    return this.authService.login(dto, {
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    });
  }

  @Post('refresh')
  @ApiOkResponse({ description: 'Rotate refresh token and issue a new access token' })
  async refresh(@Body() dto: RefreshDto): Promise<LoginResponse> {
    return this.authService.refresh(dto.refreshToken);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ description: 'Current authenticated user and tenant context' })
  async me(@CurrentUser() currentUser: AuthenticatedUser): Promise<CurrentUserResponse> {
    return this.authService.me(currentUser);
  }

  @Post('logout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ description: 'Logout and revoke the submitted refresh token' })
  async logout(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: Partial<RefreshDto>,
  ): Promise<{ success: boolean }> {
    return this.authService.logout(currentUser, dto.refreshToken);
  }
}
