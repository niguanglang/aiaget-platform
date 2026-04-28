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

import type {
  ModelProviderDetail,
  ModelProviderListItem,
  PaginatedResult,
  TestModelProviderResult,
} from '@aiaget/shared-types';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import type { AuthenticatedUser } from '../common/types/request-context';
import { CreateModelApiKeyDto } from './dto/create-model-api-key.dto';
import { CreateModelProviderDto } from './dto/create-model-provider.dto';
import { ListModelProvidersDto } from './dto/list-model-providers.dto';
import { TestModelProviderDto } from './dto/test-model-provider.dto';
import { UpdateModelProviderDto } from './dto/update-model-provider.dto';
import { ModelsService } from './models.service';

@ApiTags('model-providers')
@ApiBearerAuth()
@Controller('model-providers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ModelProvidersController {
  constructor(@Inject(ModelsService) private readonly modelsService: ModelsService) {}

  @Get()
  @Permissions('model.read')
  @ApiOkResponse({ description: 'Tenant-isolated paginated model provider list' })
  async list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListModelProvidersDto,
  ): Promise<PaginatedResult<ModelProviderListItem>> {
    return this.modelsService.listProviders(currentUser, query);
  }

  @Post()
  @Permissions('model.write')
  @ApiOkResponse({ description: 'Create model provider' })
  async create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateModelProviderDto,
  ): Promise<ModelProviderDetail> {
    return this.modelsService.createProvider(currentUser, dto);
  }

  @Get(':id')
  @Permissions('model.read')
  @ApiOkResponse({ description: 'Get model provider detail' })
  async get(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ModelProviderDetail> {
    return this.modelsService.getProvider(currentUser, id);
  }

  @Patch(':id')
  @Permissions('model.write')
  @ApiOkResponse({ description: 'Update model provider' })
  async update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateModelProviderDto,
  ): Promise<ModelProviderDetail> {
    return this.modelsService.updateProvider(currentUser, id, dto);
  }

  @Delete(':id')
  @Permissions('model.write')
  @ApiOkResponse({ description: 'Soft delete model provider' })
  async remove(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.modelsService.removeProvider(currentUser, id);
  }

  @Post(':id/disable')
  @Permissions('model.write')
  @ApiOkResponse({ description: 'Disable model provider' })
  async disable(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ModelProviderDetail> {
    return this.modelsService.setProviderStatus(currentUser, id, 'DISABLED');
  }

  @Post(':id/enable')
  @Permissions('model.write')
  @ApiOkResponse({ description: 'Enable model provider' })
  async enable(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ModelProviderDetail> {
    return this.modelsService.setProviderStatus(currentUser, id, 'ACTIVE');
  }

  @Post(':id/api-keys')
  @Permissions('model.write')
  @ApiOkResponse({ description: 'Add masked model provider API key' })
  async createApiKey(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateModelApiKeyDto,
  ): Promise<ModelProviderDetail> {
    return this.modelsService.createApiKey(currentUser, id, dto);
  }

  @Delete(':id/api-keys/:keyId')
  @Permissions('model.write')
  @ApiOkResponse({ description: 'Soft delete model provider API key' })
  async removeApiKey(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Param('keyId') keyId: string,
  ): Promise<ModelProviderDetail> {
    return this.modelsService.removeApiKey(currentUser, id, keyId);
  }

  @Post(':id/test')
  @Permissions('model.write')
  @ApiOkResponse({ description: 'Run model provider compatibility test' })
  async test(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: TestModelProviderDto,
  ): Promise<TestModelProviderResult> {
    return this.modelsService.testProvider(currentUser, id, dto);
  }
}
