import { Body, Controller, Delete, Inject, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import type { ModelProviderDetail } from '@aiaget/shared-types';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import type { AuthenticatedUser } from '../common/types/request-context';
import { CreateModelConfigDto } from './dto/create-model-config.dto';
import { UpdateModelConfigDto } from './dto/update-model-config.dto';
import { ModelsService } from './models.service';

@ApiTags('models')
@ApiBearerAuth()
@Controller('models')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ModelConfigsController {
  constructor(@Inject(ModelsService) private readonly modelsService: ModelsService) {}

  @Post()
  @Permissions('model.write')
  @ApiOkResponse({ description: 'Create model config under provider' })
  async create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateModelConfigDto,
  ): Promise<ModelProviderDetail> {
    return this.modelsService.createModel(currentUser, dto);
  }

  @Patch(':id')
  @Permissions('model.write')
  @ApiOkResponse({ description: 'Update model config' })
  async update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateModelConfigDto,
  ): Promise<ModelProviderDetail> {
    return this.modelsService.updateModel(currentUser, id, dto);
  }

  @Delete(':id')
  @Permissions('model.write')
  @ApiOkResponse({ description: 'Soft delete model config' })
  async remove(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.modelsService.removeModel(currentUser, id);
  }

  @Post(':id/disable')
  @Permissions('model.write')
  @ApiOkResponse({ description: 'Disable model config' })
  async disable(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ModelProviderDetail> {
    return this.modelsService.setModelStatus(currentUser, id, 'DISABLED');
  }

  @Post(':id/enable')
  @Permissions('model.write')
  @ApiOkResponse({ description: 'Enable model config' })
  async enable(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ModelProviderDetail> {
    return this.modelsService.setModelStatus(currentUser, id, 'ACTIVE');
  }
}
