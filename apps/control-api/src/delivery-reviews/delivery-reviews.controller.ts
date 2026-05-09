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

import type { DeliveryReviewDetail, DeliveryReviewListItem, PaginatedResult } from '@aiaget/shared-types';

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
import { CreateDeliveryReviewDto } from './dto/create-delivery-review.dto';
import { ListDeliveryReviewsDto } from './dto/list-delivery-reviews.dto';
import { UpdateDeliveryReviewDto } from './dto/update-delivery-review.dto';
import { DeliveryReviewsService } from './delivery-reviews.service';

@ApiTags('delivery-reviews')
@ApiBearerAuth()
@Controller('delivery-reviews')
@UseGuards(JwtAuthGuard, PermissionsGuard, DataScopeGuard, ResourceAclGuard, SecurityPolicyGuard)
export class DeliveryReviewsController {
  constructor(@Inject(DeliveryReviewsService) private readonly deliveryReviewsService: DeliveryReviewsService) {}

  @Get()
  @Permissions('delivery:review:view')
  @ApiOkResponse({ description: 'Tenant-isolated delivery acceptance and review list' })
  async list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListDeliveryReviewsDto,
  ): Promise<PaginatedResult<DeliveryReviewListItem>> {
    return this.deliveryReviewsService.list(currentUser, query);
  }

  @Post()
  @Permissions('delivery:review:manage')
  @ApiOkResponse({ description: 'Create delivery acceptance review' })
  async create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateDeliveryReviewDto,
  ): Promise<DeliveryReviewDetail> {
    return this.deliveryReviewsService.create(currentUser, dto);
  }

  @Get(':id')
  @Permissions('delivery:review:view')
  @RequireDataScope({ resourceType: 'DELIVERY_REVIEW' })
  @RequireResourceAcl({ resourceType: 'DELIVERY_REVIEW', permissionCode: 'delivery:review:view' })
  @ApiOkResponse({ description: 'Get delivery acceptance review detail' })
  async get(@CurrentUser() currentUser: AuthenticatedUser, @Param('id') id: string): Promise<DeliveryReviewDetail> {
    return this.deliveryReviewsService.get(currentUser, id);
  }

  @Patch(':id')
  @Permissions('delivery:review:manage')
  @RequireDataScope({ resourceType: 'DELIVERY_REVIEW' })
  @RequireResourceAcl({ resourceType: 'DELIVERY_REVIEW', permissionCode: 'delivery:review:manage' })
  @ApiOkResponse({ description: 'Update delivery acceptance review' })
  async update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateDeliveryReviewDto,
  ): Promise<DeliveryReviewDetail> {
    return this.deliveryReviewsService.update(currentUser, id, dto);
  }

  @Delete(':id')
  @Permissions('delivery:review:manage')
  @RequireDataScope({ resourceType: 'DELIVERY_REVIEW' })
  @RequireResourceAcl({ resourceType: 'DELIVERY_REVIEW', permissionCode: 'delivery:review:manage' })
  @ApiOkResponse({ description: 'Archive delivery acceptance review' })
  async remove(@CurrentUser() currentUser: AuthenticatedUser, @Param('id') id: string): Promise<{ success: boolean }> {
    return this.deliveryReviewsService.remove(currentUser, id);
  }
}
