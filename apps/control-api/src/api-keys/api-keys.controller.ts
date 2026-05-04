import { Body, Controller, Delete, Get, Inject, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import type {
  CreateTenantApiKeyResult,
  ExternalApiObservabilityOverview,
  ListWebhookDeliveriesResult,
  RetryWebhookDeliveryResult,
  WebhookDeliveryDetail,
  TenantApiKeyListItem,
} from '@aiaget/shared-types';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import type { AuthenticatedUser } from '../common/types/request-context';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

@ApiTags('api-keys')
@ApiBearerAuth()
@Controller('api-keys')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ApiKeysController {
  constructor(@Inject(ApiKeysService) private readonly apiKeysService: ApiKeysService) {}

  @Get()
  @Permissions('system:api_key:view')
  @ApiOkResponse({ description: 'List tenant API keys' })
  async list(@CurrentUser() currentUser: AuthenticatedUser): Promise<TenantApiKeyListItem[]> {
    return this.apiKeysService.list(currentUser);
  }

  @Get('external-observability')
  @Permissions('system:api_key:view')
  @ApiOkResponse({ description: 'Get external API invocation observability overview' })
  async getExternalObservability(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query('window') window?: string,
  ): Promise<ExternalApiObservabilityOverview> {
    return this.apiKeysService.getExternalObservability(currentUser, window);
  }

  @Post()
  @Permissions('system:api_key:manage')
  @ApiOkResponse({ description: 'Create tenant API key and return plaintext once' })
  async create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateApiKeyDto,
  ): Promise<CreateTenantApiKeyResult> {
    return this.apiKeysService.create(currentUser, dto);
  }

  @Delete(':id')
  @Permissions('system:api_key:manage')
  @ApiOkResponse({ description: 'Soft delete tenant API key' })
  async remove(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.apiKeysService.remove(currentUser, id);
  }

  @Get('webhook-deliveries')
  @Permissions('system:api_key:view')
  @ApiOkResponse({ description: 'List webhook deliveries for API keys' })
  async listWebhookDeliveries(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query('api_key_id') apiKeyId?: string,
  ): Promise<ListWebhookDeliveriesResult> {
    return this.apiKeysService.listWebhookDeliveries(currentUser, apiKeyId);
  }

  @Get('webhook-deliveries/:deliveryId')
  @Permissions('system:api_key:view')
  @ApiOkResponse({ description: 'Get webhook delivery detail' })
  async getWebhookDelivery(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('deliveryId') deliveryId: string,
  ): Promise<WebhookDeliveryDetail> {
    return this.apiKeysService.getWebhookDelivery(currentUser, deliveryId);
  }

  @Post('webhook-deliveries/:deliveryId/retry')
  @Permissions('system:api_key:manage')
  @ApiOkResponse({ description: 'Retry failed webhook delivery' })
  async retryWebhookDelivery(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('deliveryId') deliveryId: string,
  ): Promise<RetryWebhookDeliveryResult> {
    return this.apiKeysService.retryWebhookDelivery(currentUser, deliveryId);
  }
}
