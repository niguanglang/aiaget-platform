import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import type { DeliveryAssetDetail, DeliveryAssetListItem, PaginatedResult } from '@aiaget/shared-types';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireDataScope } from '../common/decorators/data-scope.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { RequireResourceAcl } from '../common/decorators/resource-acl.decorator';
import { DataScopeGuard } from '../common/guards/data-scope.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { ResourceAclGuard } from '../common/guards/resource-acl.guard';
import { SecurityPolicyGuard } from '../common/guards/security-policy.guard';
import type { AuthenticatedUser } from '../common/types/request-context';
import { CreateDeliveryAssetDto } from './dto/create-delivery-asset.dto';
import { ListDeliveryAssetsDto } from './dto/list-delivery-assets.dto';
import { UpdateDeliveryAssetDto } from './dto/update-delivery-asset.dto';
import { DeliveryAssetsService } from './delivery-assets.service';

@ApiTags('delivery-assets')
@ApiBearerAuth()
@Controller('delivery-assets')
@UseGuards(JwtAuthGuard, PermissionsGuard, DataScopeGuard, ResourceAclGuard, SecurityPolicyGuard)
export class DeliveryAssetsController {
  constructor(@Inject(DeliveryAssetsService) private readonly deliveryAssetsService: DeliveryAssetsService) {}

  @Get()
  @Permissions('delivery:asset:view')
  @ApiOkResponse({ description: 'Tenant-isolated reusable delivery asset list' })
  async list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListDeliveryAssetsDto,
  ): Promise<PaginatedResult<DeliveryAssetListItem>> {
    return this.deliveryAssetsService.list(currentUser, query);
  }

  @Post()
  @Permissions('delivery:asset:manage')
  @ApiOkResponse({ description: 'Create reusable delivery asset' })
  async create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateDeliveryAssetDto,
  ): Promise<DeliveryAssetDetail> {
    return this.deliveryAssetsService.create(currentUser, dto);
  }

  @Get(':id')
  @Permissions('delivery:asset:view')
  @RequireDataScope({ resourceType: 'DELIVERY_ASSET' })
  @RequireResourceAcl({ resourceType: 'DELIVERY_ASSET', permissionCode: 'delivery:asset:view' })
  @ApiOkResponse({ description: 'Get reusable delivery asset detail' })
  async get(@CurrentUser() currentUser: AuthenticatedUser, @Param('id') id: string): Promise<DeliveryAssetDetail> {
    return this.deliveryAssetsService.get(currentUser, id);
  }

  @Patch(':id')
  @Permissions('delivery:asset:manage')
  @RequireDataScope({ resourceType: 'DELIVERY_ASSET' })
  @RequireResourceAcl({ resourceType: 'DELIVERY_ASSET', permissionCode: 'delivery:asset:manage' })
  @ApiOkResponse({ description: 'Update reusable delivery asset' })
  async update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateDeliveryAssetDto,
  ): Promise<DeliveryAssetDetail> {
    return this.deliveryAssetsService.update(currentUser, id, dto);
  }

  @Delete(':id')
  @Permissions('delivery:asset:manage')
  @RequireDataScope({ resourceType: 'DELIVERY_ASSET' })
  @RequireResourceAcl({ resourceType: 'DELIVERY_ASSET', permissionCode: 'delivery:asset:manage' })
  @ApiOkResponse({ description: 'Archive reusable delivery asset' })
  async remove(@CurrentUser() currentUser: AuthenticatedUser, @Param('id') id: string): Promise<{ success: boolean }> {
    return this.deliveryAssetsService.remove(currentUser, id);
  }
}
